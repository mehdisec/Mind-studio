"""
AI Edge Service for MindMap Studio.
Scalable, incremental conceptual relationship detector powered by Google Gemini AI & fast semantic candidate retrieval.
Designed to handle 1,000+ nodes efficiently without losing established connections.
"""

import json
import re
import math
import urllib.request
import urllib.error
from typing import List, Dict, Tuple, Optional, Set
from PyQt6.QtCore import QObject, QThread, pyqtSignal

from mindmap_studio.models.graph_models import NodeData, EdgeData
from mindmap_studio.config import config


def compute_fast_similarity(query_text: str, candidate_texts: List[str]) -> List[float]:
    """
    Computes rapid subword & word n-gram cosine similarities between a query text and candidate texts.
    Executes in a few milliseconds even across 1,000+ documents.
    """
    if not candidate_texts:
        return []

    all_docs = [query_text] + candidate_texts
    vocab: Dict[str, int] = {}
    doc_tokens: List[List[int]] = []

    for doc in all_docs:
        words = re.findall(r'[a-zA-Z0-9_\u0600-\u06FF]+', doc.lower())
        tokens: List[str] = list(words)
        # Add character 3-grams for morphological / multilingual matching
        for w in words:
            if len(w) >= 3:
                for i in range(len(w) - 2):
                    tokens.append(f"c3_{w[i:i+3]}")
        
        indexed = []
        for t in tokens:
            if t not in vocab:
                vocab[t] = len(vocab)
            indexed.append(vocab[t])
        doc_tokens.append(indexed)

    # Document frequency
    df: Dict[int, int] = {}
    for tokens in doc_tokens:
        for t_idx in set(tokens):
            df[t_idx] = df.get(t_idx, 0) + 1

    num_docs = len(all_docs)
    vectors: List[Dict[int, float]] = []
    for tokens in doc_tokens:
        tf: Dict[int, float] = {}
        for t_idx in tokens:
            tf[t_idx] = tf.get(t_idx, 0.0) + 1.0
        
        vec: Dict[int, float] = {}
        sq_sum = 0.0
        for t_idx, count in tf.items():
            idf = math.log((num_docs + 1) / (df.get(t_idx, 1) + 1)) + 1.0
            weight = count * idf
            vec[t_idx] = weight
            sq_sum += weight * weight
        
        norm = math.sqrt(sq_sum)
        if norm > 1e-6:
            for k in vec:
                vec[k] /= norm
        vectors.append(vec)

    query_vec = vectors[0]
    similarities = []
    for cand_vec in vectors[1:]:
        dot = sum(val * cand_vec.get(idx, 0.0) for idx, val in query_vec.items())
        similarities.append(dot)

    return similarities


class AIConnectionWorker(QThread):
    """
    Dedicated QThread that uses Google Gemini AI + fast local candidate retrieval
    to discover relationships incrementally without freezing the UI or dropping edges.
    """
    linking_started = pyqtSignal()
    linking_progress = pyqtSignal(str)
    linking_finished = pyqtSignal(list)  # List[EdgeData]
    linking_error = pyqtSignal(str)

    def __init__(self, nodes: Dict[str, NodeData], target_node_id: Optional[str] = None,
                 existing_edges: Optional[List[EdgeData]] = None, api_key: str = "", 
                 model_name: str = "gemini-3.7-flash", parent=None):
        super().__init__(parent)
        self.nodes = dict(nodes)
        self.target_node_id = target_node_id
        self.existing_edges = list(existing_edges or [])
        self.api_key = (api_key or config.get_gemini_api_key()).strip()
        self.model_name = model_name or config.get_model_name()
        self._is_cancelled = False

    def cancel(self):
        self._is_cancelled = True

    def run(self):
        self.linking_started.emit()
        n_count = len(self.nodes)

        if n_count < 2:
            self.linking_finished.emit([])
            return

        self.linking_progress.emit(f"Evaluating relationships across {n_count} concepts...")

        # Build lookup of existing connected pairs
        existing_pairs: Set[Tuple[str, str]] = set()
        node_degrees: Dict[str, int] = {nid: 0 for nid in self.nodes}
        for e in self.existing_edges:
            pair = tuple(sorted([e.source_id, e.target_id]))
            existing_pairs.add(pair)
            node_degrees[e.source_id] = node_degrees.get(e.source_id, 0) + 1
            node_degrees[e.target_id] = node_degrees.get(e.target_id, 0) + 1

        try:
            if self.target_node_id and self.target_node_id in self.nodes:
                # Incremental mode for a single new/updated node
                target_node = self.nodes[self.target_node_id]
                edges = self._find_links_for_single_node(target_node, existing_pairs, node_degrees)
            else:
                # Batch mode
                edges = self._find_links_for_batch(existing_pairs, node_degrees)

            if self._is_cancelled:
                return

            self.linking_finished.emit(edges)

        except Exception as e:
            if self._is_cancelled:
                return
            error_msg = str(e)
            self.linking_progress.emit(f"AI auto-link fallback: {error_msg[:60]}...")
            fallback_edges = self._fallback_local_links(existing_pairs, node_degrees)
            self.linking_finished.emit(fallback_edges)

    def _find_links_for_single_node(self, target_node: NodeData, 
                                    existing_pairs: Set[Tuple[str, str]], 
                                    node_degrees: Dict[str, int]) -> List[EdgeData]:
        """
        Finds the best 1 to 3 links for a newly added or updated node by:
        1. Actively including all unconnected (degree == 0) and low-degree concepts.
        2. Fast candidate ranking across up to 1000+ nodes.
        3. Prompting Gemini with target node + candidate pool for deep conceptual reasoning.
        """
        candidates = [n for nid, n in self.nodes.items() if nid != target_node.id]
        if not candidates:
            return []

        # Filter out nodes already connected to target_node
        unconnected_to_target = [
            c for c in candidates 
            if tuple(sorted([target_node.id, c.id])) not in existing_pairs
        ]
        if not unconnected_to_target:
            return []

        # Categorize candidates by connection status
        zero_degree_cands = [c for c in unconnected_to_target if node_degrees.get(c.id, 0) == 0]
        low_degree_cands = [c for c in unconnected_to_target if 0 < node_degrees.get(c.id, 0) <= 2]
        other_cands = [c for c in unconnected_to_target if c not in zero_degree_cands and c not in low_degree_cands]

        if len(unconnected_to_target) <= 30:
            # Small to medium graph: Send all candidates to Gemini so no isolated concept is missed
            top_candidates = unconnected_to_target
        else:
            # Large graph (>30 nodes): Rank candidates using fast TF-IDF / N-gram similarity
            target_text = f"{target_node.title} {target_node.content} {' '.join(target_node.tags)}"
            cand_texts = [f"{c.title} {c.content} {' '.join(c.tags)}" for c in unconnected_to_target]
            sims = compute_fast_similarity(target_text, cand_texts)
            ranked = [cand for cand, _ in sorted(zip(unconnected_to_target, sims), key=lambda x: x[1], reverse=True)]

            # Always prioritize isolated nodes (up to 10), low-degree nodes (up to 8), and top semantic matches
            top_candidates = zero_degree_cands[:10] + low_degree_cands[:8]
            for c in ranked:
                if c not in top_candidates:
                    top_candidates.append(c)
                if len(top_candidates) >= 25:
                    break

        if not top_candidates:
            return []

        # Fallback if no API key
        if not self.api_key:
            return self._local_links_for_target(target_node, top_candidates, existing_pairs)

        prompt = f"""You are an expert cognitive scientist, philosopher, and knowledge graph synthesizer.
We have a NEW thought/concept and a pool of CANDIDATE existing concepts (including isolated/unconnected thoughts).
Analyze and determine if the NEW thought has meaningful, direct conceptual, philosophical, scientific, thematic, or causal links with any of the candidate concepts.

Pay special attention to connecting with isolated or standalone thoughts if a relevant thematic/conceptual link exists.

NEW THOUGHT:
- ID: "{target_node.id}"
- Title: "{target_node.title}"
- Note: "{target_node.content[:300] if target_node.content else ''}"

CANDIDATE CONCEPTS:
{json.dumps([{"id": c.id, "title": c.title, "note": c.content[:200] if c.content else ""} for c in top_candidates], ensure_ascii=False, indent=2)}

STRICT RULES:
1. Connect the NEW thought to AT MOST 2 or 3 of the most relevant candidates. If none are related, return an empty array [].
2. Assign a `strength` float between 0.50 and 1.00 for connection intimacy.
3. Provide a concise `relation` label (1 to 4 words, e.g., "Causal Link", "Thematic Cluster", "Philosophical Foundation", "Subsystem", "Semantic Pair").
4. Output MUST be ONLY a valid JSON array of objects.

JSON Schema format:
[
  {{
    "source_id": "{target_node.id}",
    "target_id": "candidate_id",
    "relation": "Concise relation type",
    "strength": 0.85
  }}
]
"""
        response_text = self._call_gemini_raw(prompt)
        return self._parse_gemini_edge_response(response_text, existing_pairs, node_degrees)

    def _find_links_for_batch(self, existing_pairs: Set[Tuple[str, str]], 
                              node_degrees: Dict[str, int]) -> List[EdgeData]:
        """Handles full graph auto-linking across nodes."""
        node_list = list(self.nodes.values())
        if len(node_list) <= 30 and self.api_key:
            node_payload = [{"id": n.id, "title": n.title, "note": n.content[:300] if n.content else ""} for n in node_list]
            prompt = f"""You are an expert cognitive scientist, epistemologist, and knowledge graph synthesizer.
Analyze these concepts and discover direct, meaningful conceptual, philosophical, scientific, thematic, or causal relationships between them.
Pay special attention to unconnected or isolated thoughts and link them to their most conceptually relevant peers.

GRAPH NODES:
{json.dumps(node_payload, ensure_ascii=False, indent=2)}

STRICT RULES:
1. Return high-value, direct relationships. Connect each node to at most 2 or 3 relevant peers.
2. Assign `strength` (0.50 to 1.00) and a concise `relation` label.
3. Output MUST be strictly a valid JSON array.

JSON Schema format:
[
  {{
    "source_id": "node_id_1",
    "target_id": "node_id_2",
    "relation": "Thematic Cluster",
    "strength": 0.85
  }}
]
"""
            response_text = self._call_gemini_raw(prompt)
            return self._parse_gemini_edge_response(response_text, existing_pairs, node_degrees)
        else:
            return self._fallback_local_links(existing_pairs, node_degrees)

    def _local_links_for_target(self, target_node: NodeData, 
                                candidates: List[NodeData], 
                                existing_pairs: Set[Tuple[str, str]]) -> List[EdgeData]:
        edges = []
        target_text = f"{target_node.title} {target_node.content} {' '.join(target_node.tags)}"
        cand_texts = [f"{c.title} {c.content} {' '.join(c.tags)}" for c in candidates]
        sims = compute_fast_similarity(target_text, cand_texts)
        ranked = sorted(zip(candidates, sims), key=lambda x: x[1], reverse=True)
        
        count = 0
        for cand, sim in ranked:
            pair = tuple(sorted([target_node.id, cand.id]))
            if pair in existing_pairs:
                continue
            if sim >= 0.20:
                edges.append(EdgeData(
                    source_id=target_node.id,
                    target_id=cand.id,
                    weight=max(0.6, sim * 1.5),
                    label="Semantic Link",
                    edge_type="conceptual",
                    similarity=max(0.5, sim)
                ))
                count += 1
                if count >= 3:
                    break
        return edges

    def _fallback_local_links(self, existing_pairs: Set[Tuple[str, str]], 
                              node_degrees: Dict[str, int]) -> List[EdgeData]:
        """Rapid local semantic clustering across all nodes."""
        node_list = list(self.nodes.values())
        if len(node_list) < 2:
            return []

        cand_texts = [f"{n.title} {n.content} {' '.join(n.tags)}" for n in node_list]
        edges: List[EdgeData] = []
        seen: Set[Tuple[str, str]] = set(existing_pairs)

        for i, src in enumerate(node_list):
            if node_degrees.get(src.id, 0) >= 3:
                continue
            sims = compute_fast_similarity(cand_texts[i], cand_texts)
            ranked = sorted([(node_list[j], sims[j]) for j in range(len(node_list)) if j != i], 
                            key=lambda x: x[1], reverse=True)
            
            added_for_src = 0
            for tgt, sim in ranked:
                if sim < 0.30 or node_degrees.get(tgt.id, 0) >= 3:
                    continue
                pair = tuple(sorted([src.id, tgt.id]))
                if pair in seen:
                    continue
                seen.add(pair)
                node_degrees[src.id] = node_degrees.get(src.id, 0) + 1
                node_degrees[tgt.id] = node_degrees.get(tgt.id, 0) + 1
                edges.append(EdgeData(
                    source_id=src.id,
                    target_id=tgt.id,
                    weight=sim * 1.5,
                    label="Semantic Link",
                    edge_type="conceptual",
                    similarity=sim
                ))
                added_for_src += 1
                if added_for_src >= 2:
                    break
        return edges

    def _call_gemini_raw(self, prompt: str) -> str:
        candidate_models = [self.model_name]
        for fallback in ["gemini-3.7-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        payload_dict = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.9,
                "maxOutputTokens": 2048,
                "responseMimeType": "application/json"
            }
        }
        payload_bytes = json.dumps(payload_dict).encode("utf-8")
        headers = {"Content-Type": "application/json", "x-goog-api-key": self.api_key}

        last_error = None
        for model in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            req = urllib.request.Request(url, data=payload_bytes, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"]
            except urllib.error.HTTPError as e:
                last_error = e
                if e.code == 404:
                    continue
                raise RuntimeError(f"Gemini API Error ({e.code}): {e.read().decode('utf-8')}")
            except Exception as e:
                last_error = e
                continue
        if last_error:
            raise last_error
        raise RuntimeError("No response from Gemini API.")

    def _parse_gemini_edge_response(self, text: str, 
                                    existing_pairs: Optional[Set[Tuple[str, str]]] = None, 
                                    node_degrees: Optional[Dict[str, int]] = None) -> List[EdgeData]:
        clean_text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
        match = re.search(r'\[\s*\{.*\}\s*\]', clean_text, re.DOTALL)
        if match:
            clean_text = match.group(0)

        data = json.loads(clean_text)
        edges: List[EdgeData] = []
        seen_pairs: Set[Tuple[str, str]] = set(existing_pairs or set())
        degrees: Dict[str, int] = dict(node_degrees or {nid: 0 for nid in self.nodes})

        for item in data:
            if not isinstance(item, dict):
                continue
            src = item.get("source_id", "").strip()
            tgt = item.get("target_id", "").strip()
            relation = item.get("relation", "Conceptual Link").strip()
            strength = max(0.1, min(1.0, float(item.get("strength", 0.8))))

            if src not in self.nodes or tgt not in self.nodes or src == tgt:
                continue

            pair = tuple(sorted([src, tgt]))
            if pair in seen_pairs:
                continue

            if degrees.get(src, 0) >= 4 or degrees.get(tgt, 0) >= 4:
                continue

            seen_pairs.add(pair)
            degrees[src] = degrees.get(src, 0) + 1
            degrees[tgt] = degrees.get(tgt, 0) + 1

            edges.append(EdgeData(
                source_id=src,
                target_id=tgt,
                weight=strength * 1.5,
                label=relation,
                edge_type="conceptual",
                similarity=strength
            ))
        return edges


def apply_ai_edges_to_graph(graph_state, graph_scene, new_edges: List[EdgeData], clear_existing: bool = False):
    """
    Applies AI-generated edges to GraphState and GraphScene.
    NEVER deletes existing connections unless clear_existing is explicitly requested.
    """
    if clear_existing:
        graph_state.edges = [e for e in graph_state.edges if e.edge_type not in ("conceptual", "semantic")]
        items_to_remove = [e for e in graph_scene.edge_items if e.edge_type in ("conceptual", "semantic")]
        for item in items_to_remove:
            graph_scene.edge_items.remove(item)
            item.source_item.remove_edge(item)
            item.target_item.remove_edge(item)
            graph_scene.removeItem(item)

    added_count = 0
    for edge in new_edges:
        # Check if edge already exists in graph_state
        exists = any(
            (e.source_id == edge.source_id and e.target_id == edge.target_id) or
            (e.source_id == edge.target_id and e.target_id == edge.source_id)
            for e in graph_state.edges
        )
        if not exists:
            added_edge = graph_state.add_edge(
                source_id=edge.source_id,
                target_id=edge.target_id,
                weight=edge.weight,
                label=edge.label,
                edge_type=edge.edge_type,
                similarity=edge.similarity
            )
            if added_edge:
                graph_scene.add_edge_item(
                    source_id=edge.source_id,
                    target_id=edge.target_id,
                    weight=edge.weight,
                    label=edge.label,
                    edge_type=edge.edge_type,
                    similarity=edge.similarity
                )
                added_count += 1

    if added_count > 0:
        graph_scene.start_physics()
