"""
Obsidian Vault persistence layer.
Handles Markdown notes with YAML frontmatter serialization and graph_state.json synchronization.
Ensures seamless auto-save and persistence across application restarts.
"""

import json
import os
import re
from pathlib import Path
from datetime import datetime
from typing import Optional, Tuple, List, Dict
import yaml

from mindmap_studio.models.graph_models import GraphState, NodeData, EdgeData


def sanitize_filename(title: str) -> str:
    """Make title safe for Windows and Obsidian filenames."""
    clean = re.sub(r'[\\/*?:"<>|]', "", title).strip()
    return clean if clean else "Untitled_Thought"


class ObsidianService:
    """Manages reading and writing graph data to an Obsidian Vault and local backup."""
    
    def __init__(self, vault_path: Optional[str] = None):
        self.vault_path: Optional[Path] = Path(vault_path) if vault_path else None
        
    def set_vault_path(self, path: str):
        self.vault_path = Path(path) if path else None

    def is_valid_vault(self) -> bool:
        if not self.vault_path:
            return False
        return self.vault_path.exists() and self.vault_path.is_dir()

    def get_state_file_path(self) -> Optional[Path]:
        if not self.is_valid_vault():
            return None
        return self.vault_path / "graph_state.json"

    def get_local_state_file_path(self) -> Path:
        """Returns primary fallback storage path for graph_state.json."""
        # Check current working directory first
        cwd_file = Path.cwd() / "graph_state.json"
        return cwd_file

    def get_notes_dir(self) -> Optional[Path]:
        """Directory within the vault where mind map markdown files are stored."""
        if not self.is_valid_vault():
            return None
        notes_dir = self.vault_path / "MindMap"
        notes_dir.mkdir(parents=True, exist_ok=True)
        return notes_dir

    def save_node_to_markdown(self, node: NodeData) -> Optional[Path]:
        """
        Saves a NodeData object as a clean Markdown file with YAML frontmatter.
        """
        notes_dir = self.get_notes_dir()
        if not notes_dir:
            return None
            
        safe_name = sanitize_filename(node.title)
        file_path = notes_dir / f"{safe_name}.md"
        
        frontmatter_data = {
            "id": node.id,
            "title": node.title,
            "type": getattr(node, "node_type", "text"),
            "image": getattr(node, "image_path", ""),
            "image_size": getattr(node, "image_size", "small"),
            "rating": int(node.importance),
            "importance": int(node.importance),
            "highlighted": bool(node.highlighted),
            "highlight_color": str(getattr(node, "highlight_color", "gold")),
            "tags": node.tags if node.tags else ["thought"],
            "links": node.links if node.links else [],
            "created_at": node.created_at,
            "updated_at": node.updated_at,
            "position": {"x": round(node.x, 2), "y": round(node.y, 2)}
        }
        
        yaml_content = yaml.dump(frontmatter_data, sort_keys=False, allow_unicode=True)
        
        md_content = f"---\n{yaml_content}---\n\n# {node.title}\n\n{node.content.strip()}\n"
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(md_content)
            
        return file_path

    def load_node_from_markdown(self, file_path: Path) -> Optional[NodeData]:
        """
        Parses an Obsidian markdown note with YAML frontmatter back into a NodeData object.
        """
        if not file_path.exists() or not file_path.is_file():
            return None
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            frontmatter = {}
            body = content
            
            # Match YAML Frontmatter between --- delimiters
            match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
            if match:
                yaml_text, body = match.groups()
                frontmatter = yaml.safe_load(yaml_text) or {}
                
            title = frontmatter.get("title", file_path.stem)
            node_id = frontmatter.get("id", f"node_{file_path.stem}")
            node_type = frontmatter.get("type", frontmatter.get("node_type", "text"))
            image_path = frontmatter.get("image", frontmatter.get("image_path", ""))
            image_size = frontmatter.get("image_size", "small")
            importance = int(frontmatter.get("rating", frontmatter.get("importance", 5)))
            highlighted = bool(frontmatter.get("highlighted", False))
            highlight_color = str(frontmatter.get("highlight_color", "gold"))
            tags = frontmatter.get("tags", [])
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.split(",") if t.strip()]
            links = frontmatter.get("links", [])
            created_at = frontmatter.get("created_at", datetime.now().isoformat())
            updated_at = frontmatter.get("updated_at", datetime.now().isoformat())
            
            pos = frontmatter.get("position", {})
            x = float(pos.get("x", 0.0))
            y = float(pos.get("y", 0.0))
            
            body_clean = re.sub(rf"^#\s+{re.escape(title)}\s*\n", "", body.strip(), flags=re.MULTILINE)
            
            return NodeData(
                id=node_id,
                title=title,
                content=body_clean.strip(),
                importance=importance,
                highlighted=highlighted,
                highlight_color=highlight_color,
                node_type=node_type,
                image_path=image_path,
                image_size=image_size,
                x=x,
                y=y,
                tags=tags,
                links=links,
                created_at=str(created_at),
                updated_at=str(updated_at)
            )
        except Exception as e:
            print(f"Error parsing markdown file {file_path}: {e}")
            return None

    def delete_node_file(self, node_id: str, title: str = "") -> bool:
        """
        Permanently removes the markdown file corresponding to a node from the Obsidian vault.
        """
        notes_dir = self.get_notes_dir()
        if not notes_dir or not notes_dir.exists():
            return False

        deleted_any = False

        # 1. Direct filename check using sanitized title
        if title:
            safe_name = sanitize_filename(title)
            direct_file = notes_dir / f"{safe_name}.md"
            if direct_file.exists():
                try:
                    direct_file.unlink()
                    deleted_any = True
                except Exception as e:
                    print(f"Error deleting file {direct_file}: {e}")

        # 2. Inspect all markdown notes in MindMap/ for matching frontmatter id or title
        for md_file in notes_dir.glob("*.md"):
            try:
                with open(md_file, "r", encoding="utf-8") as f:
                    content = f.read(1024)
                match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
                if match:
                    frontmatter = yaml.safe_load(match.group(1)) or {}
                    if frontmatter.get("id") == node_id or (title and frontmatter.get("title") == title):
                        md_file.unlink(missing_ok=True)
                        deleted_any = True
            except Exception as e:
                print(f"Error inspecting/deleting note {md_file}: {e}")

        return deleted_any

    def save_graph_state(self, graph_state: GraphState) -> Tuple[bool, str]:
        """
        Saves the complete graph state to Obsidian Vault and local JSON storage,
        and purges any deleted/orphaned markdown notes from the vault.
        """
        try:
            state_dict = graph_state.to_dict()
            state_dict["vault_path"] = str(self.vault_path) if self.vault_path else ""

            # 1. Always save local persistent state file
            local_state_file = self.get_local_state_file_path()
            with open(local_state_file, "w", encoding="utf-8") as f:
                json.dump(state_dict, f, indent=2, ensure_ascii=False)

            # 2. If valid Obsidian vault is set, synchronize vault state and markdown files
            if self.is_valid_vault():
                state_file = self.get_state_file_path()
                if state_file:
                    with open(state_file, "w", encoding="utf-8") as f:
                        json.dump(state_dict, f, indent=2, ensure_ascii=False)
                        
                active_files = set()
                for node in graph_state.nodes.values():
                    saved_path = self.save_node_to_markdown(node)
                    if saved_path:
                        active_files.add(saved_path.resolve())

                # Clean up any orphaned markdown notes that no longer exist in graph_state
                notes_dir = self.get_notes_dir()
                if notes_dir and notes_dir.exists():
                    for md_file in notes_dir.glob("*.md"):
                        if md_file.resolve() not in active_files:
                            try:
                                md_file.unlink()
                            except Exception as e:
                                print(f"Error cleaning orphan markdown note {md_file}: {e}")

                return True, f"Saved {len(graph_state.nodes)} nodes to Obsidian Vault ({self.vault_path.name})."
                
            return True, f"Saved {len(graph_state.nodes)} thoughts to local state."
        except Exception as e:
            return False, f"Failed to save graph state: {str(e)}"

    def load_graph_state(self) -> Tuple[Optional[GraphState], str]:
        """
        Loads saved state from:
        1. Configured Obsidian Vault graph_state.json
        2. Obsidian Vault MindMap/*.md notes
        3. Local persistent graph_state.json
        """
        # 1. Check Obsidian Vault
        if self.is_valid_vault():
            state_file = self.get_state_file_path()
            if state_file and state_file.exists():
                try:
                    with open(state_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    state = GraphState.from_dict(data)
                    state.vault_path = str(self.vault_path)
                    if state.nodes:
                        return state, f"Loaded {len(state.nodes)} nodes from Obsidian Vault ({self.vault_path.name})."
                except Exception as e:
                    print(f"Failed to load vault graph_state.json: {e}")

            # Fallback: scan markdown notes in MindMap/
            notes_dir = self.get_notes_dir()
            if notes_dir and notes_dir.exists():
                nodes: Dict[str, NodeData] = {}
                for md_file in notes_dir.glob("*.md"):
                    node = self.load_node_from_markdown(md_file)
                    if node:
                        nodes[node.id] = node
                        
                if nodes:
                    edges: List[EdgeData] = []
                    for node in nodes.values():
                        for target_id in node.links:
                            if target_id in nodes:
                                if not any((e.source_id == target_id and e.target_id == node.id) for e in edges):
                                    edges.append(EdgeData(source_id=node.id, target_id=target_id))
                                    
                    state = GraphState(nodes=nodes, edges=edges, vault_path=str(self.vault_path))
                    return state, f"Imported {len(nodes)} notes from Obsidian Vault."

        # 2. Check local persistent graph_state.json
        local_file = self.get_local_state_file_path()
        if local_file and local_file.exists():
            try:
                with open(local_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                state = GraphState.from_dict(data)
                if state.nodes:
                    return state, f"Loaded {len(state.nodes)} thoughts from local storage."
            except Exception as e:
                print(f"Failed to load local graph_state.json: {e}")

        return None, "No existing graph state found."
