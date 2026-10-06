"""
Core data structures for Nodes, Edges, Graph State, and AI Insights.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
import uuid
from typing import List, Dict, Optional, Any


def generate_node_id(prefix: str = "node") -> str:
    """Generate a clean unique identifier."""
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


@dataclass
class NodeData:
    """Represents a single conceptual node in the knowledge graph."""
    id: str = field(default_factory=generate_node_id)
    title: str = "New Thought"
    content: str = ""
    importance: int = 5  # 1 to 10
    x: float = 0.0
    y: float = 0.0
    vx: float = 0.0
    vy: float = 0.0
    tags: List[str] = field(default_factory=list)
    links: List[str] = field(default_factory=list)  # List of connected target node IDs
    node_type: str = "text"  # 'text' or 'image'
    image_path: str = ""     # Path to image file for image nodes
    image_size: str = "small"  # 'small' (1x), 'medium' (2x), 'large' (3x)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)
    fixed: bool = False  # Fixed position during physics if pinned
    highlighted: bool = False  # Highlighted visual accent state
    highlight_color: str = "gold"  # Highlight color: 'gold' (amber), 'red', 'green'

    def update_timestamp(self):
        self.updated_at = datetime.now().isoformat()

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "NodeData":
        # Handle field compatibility
        known_fields = cls.__dataclass_fields__.keys()
        filtered = {k: v for k, v in data.items() if k in known_fields}
        return cls(**filtered)


@dataclass
class EdgeData:
    """Represents an edge / relationship between two nodes."""
    source_id: str
    target_id: str
    weight: float = 1.0  # Spring strength / importance
    label: str = ""
    edge_type: str = "explicit"  # 'explicit' (Wikilink/Direct) or 'semantic' (Embedding KNN)
    similarity: float = 1.0      # Cosine similarity score (for semantic edges)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "EdgeData":
        known_fields = cls.__dataclass_fields__.keys()
        filtered = {k: v for k, v in data.items() if k in known_fields}
        return cls(**filtered)


@dataclass
class AIInsight:
    """Represents an AI-generated conceptual breakdown item."""
    topic: str
    description: str
    importance: int = 5
    relation_type: str = "Association"

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class AIDeepDiveResult:
    """Encapsulates a full AI deep-dive breakdown including conceptual insights and Socratic questions."""
    topic: str
    insights: List[AIInsight] = field(default_factory=list)
    socratic_questions: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "topic": self.topic,
            "insights": [i.to_dict() for i in self.insights],
            "socratic_questions": self.socratic_questions
        }



@dataclass
class GraphState:
    """Full graph snapshot containing all nodes, edges, and metadata."""
    nodes: Dict[str, NodeData] = field(default_factory=dict)
    edges: List[EdgeData] = field(default_factory=list)
    vault_path: str = ""
    last_saved: str = field(default_factory=lambda: datetime.now().isoformat())
    version: str = "1.0.0"

    def add_node(self, node: NodeData):
        self.nodes[node.id] = node

    def get_node(self, node_id: str) -> Optional[NodeData]:
        return self.nodes.get(node_id)

    def remove_node(self, node_id: str):
        if node_id in self.nodes:
            del self.nodes[node_id]
        # Remove any edges involving this node
        self.edges = [e for e in self.edges if e.source_id != node_id and e.target_id != node_id]
        # Remove from other nodes' link arrays
        for n in self.nodes.values():
            if node_id in n.links:
                n.links.remove(node_id)

    def add_edge(self, source_id: str, target_id: str, weight: float = 1.0, label: str = "", 
                 edge_type: str = "explicit", similarity: float = 1.0) -> Optional[EdgeData]:
        if source_id not in self.nodes or target_id not in self.nodes or source_id == target_id:
            return None
        
        # Check existing edge
        for e in self.edges:
            if (e.source_id == source_id and e.target_id == target_id) or \
               (e.source_id == target_id and e.target_id == source_id):
                # If existing is semantic and new is explicit, upgrade it
                if edge_type == "explicit" and e.edge_type != "explicit":
                    e.edge_type = "explicit"
                    e.weight = weight
                    e.label = label or e.label
                return e
                
        edge = EdgeData(
            source_id=source_id, 
            target_id=target_id, 
            weight=weight, 
            label=label, 
            edge_type=edge_type, 
            similarity=similarity
        )
        self.edges.append(edge)
        
        # Keep links in sync
        src_node = self.nodes[source_id]
        if target_id not in src_node.links:
            src_node.links.append(target_id)
            
        return edge

    def remove_semantic_edges(self):
        """Clears all dynamic semantic edges prior to re-clustering."""
        self.edges = [e for e in self.edges if e.edge_type == "explicit"]


    def remove_edge(self, source_id: str, target_id: str):
        self.edges = [
            e for e in self.edges 
            if not ((e.source_id == source_id and e.target_id == target_id) or 
                    (e.source_id == target_id and e.target_id == source_id))
        ]
        if source_id in self.nodes and target_id in self.nodes[source_id].links:
            self.nodes[source_id].links.remove(target_id)
        if target_id in self.nodes and source_id in self.nodes[target_id].links:
            self.nodes[target_id].links.remove(source_id)

    def to_dict(self) -> dict:
        return {
            "version": self.version,
            "vault_path": self.vault_path,
            "last_saved": datetime.now().isoformat(),
            "nodes": {nid: n.to_dict() for nid, n in self.nodes.items()},
            "edges": [e.to_dict() for e in self.edges],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "GraphState":
        nodes = {}
        for nid, nd in data.get("nodes", {}).items():
            nodes[nid] = NodeData.from_dict(nd)
            
        edges = [EdgeData.from_dict(ed) for ed in data.get("edges", [])]
        
        return cls(
            nodes=nodes,
            edges=edges,
            vault_path=data.get("vault_path", ""),
            last_saved=data.get("last_saved", datetime.now().isoformat()),
            version=data.get("version", "1.0.0")
        )
