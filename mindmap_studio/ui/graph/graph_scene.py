"""
Custom QGraphicsScene with real-time Force-Directed physics engine.
"""

import math
from typing import Dict, List, Optional, Tuple
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QPointF
from PyQt6.QtWidgets import QGraphicsScene, QGraphicsItem

from mindmap_studio.models.graph_models import GraphState, NodeData, EdgeData
from mindmap_studio.ui.graph.graph_items import NodeItem, EdgeItem
from mindmap_studio.config import PHYSICS_DEFAULTS, config


class GraphScene(QGraphicsScene):
    """
    QGraphicsScene managing nodes, edges, and real-time Force-Directed Physics.
    """
    node_selected = pyqtSignal(str)
    node_moved = pyqtSignal(str, float, float)
    add_child_text_requested = pyqtSignal(str)
    add_child_image_requested = pyqtSignal(str)
    edit_note_requested = pyqtSignal(str)
    deep_dive_requested = pyqtSignal(str)
    connect_nodes_requested = pyqtSignal(str, str)
    delete_node_requested = pyqtSignal(str)
    delete_edge_requested = pyqtSignal(str, str)
    edit_edge_label_requested = pyqtSignal(str, str)
    edge_selected = pyqtSignal(str, str)
    socratic_questions_requested = pyqtSignal(str)
    node_highlight_toggled = pyqtSignal(str, bool)
    graph_changed = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setSceneRect(-4000, -4000, 8000, 8000)
        
        self.node_items: Dict[str, NodeItem] = {}
        self.edge_items: List[EdgeItem] = []
        
        # Physics engine timer
        self.physics_timer = QTimer(self)
        self.physics_timer.setInterval(16)  # ~60 fps
        self.physics_timer.timeout.connect(self._physics_step)
        
        self.physics_enabled = True
        self.is_simulating = True
        self.anim_time = 0.0
        
        # Link creation mode
        self.pending_connect_source: Optional[str] = None
        
        # Spring cluster drag tracking
        self.active_drag_node: Optional[NodeItem] = None
        self.active_drag_cluster: Dict[NodeItem, Tuple[float, float, float]] = {}

        # Start continuous animation loop
        self.physics_timer.start()

    def begin_node_drag(self, node_item: NodeItem):
        """Initializes spring cluster drag for all connected nodes."""
        self.active_drag_node = node_item
        self.active_drag_cluster = self._build_drag_cluster(node_item)
        self.start_physics()

    def end_node_drag(self, node_item: NodeItem):
        """Signals end of mouse drag, letting connected nodes settle into their relative positions."""
        self.start_physics()

    def _build_drag_cluster(self, start_node: NodeItem) -> Dict[NodeItem, Tuple[float, float, float]]:
        """
        BFS traversal to find all nodes connected directly or indirectly to the dragged node,
        capturing their relative offsets (offset_x, offset_y, weight) to maintain relative geometry.
        """
        cluster: Dict[NodeItem, Tuple[float, float, float]] = {}
        visited = {start_node}
        start_pos = start_node.pos()
        queue = [(start_node, 0)]
        
        while queue:
            curr, hop = queue.pop(0)
            for edge in curr.edges:
                neighbor = edge.target_item if edge.source_item == curr else edge.source_item
                if neighbor and neighbor not in visited:
                    visited.add(neighbor)
                    if not neighbor.node_data.fixed:
                        n_pos = neighbor.pos()
                        off_x = n_pos.x() - start_pos.x()
                        off_y = n_pos.y() - start_pos.y()
                        weight = 1.0 if hop == 0 else (0.85 if hop == 1 else 0.7)
                        cluster[neighbor] = (off_x, off_y, weight)
                    queue.append((neighbor, hop + 1))
        return cluster

    def load_graph_state(self, state: GraphState):
        """Reconstructs scene from GraphState and triggers smooth kinetic entrance expansion."""
        self.clear_scene()
        
        # 1. Add all nodes with initial gentle blossom impulse
        nodes_list = list(state.nodes.values())
        total_nodes = max(1, len(nodes_list))
        for idx, node_data in enumerate(nodes_list):
            item = self.add_node_item(node_data, trigger_physics=False)
            item.vx = 0.0
            item.vy = 0.0

        # 2. Add all edges
        for edge_data in state.edges:
            self.add_edge_item(
                edge_data.source_id, 
                edge_data.target_id, 
                edge_data.weight, 
                edge_data.label,
                edge_data.edge_type,
                edge_data.similarity
            )

        self.start_physics()

    def clear_scene(self):
        self.stop_physics()
        self.clear()
        self.node_items.clear()
        self.edge_items.clear()
        self.pending_connect_source = None
        self.active_drag_node = None
        self.active_drag_cluster.clear()

    def add_node_item(self, node_data: NodeData, trigger_physics: bool = True) -> NodeItem:
        if node_data.id in self.node_items:
            item = self.node_items[node_data.id]
            item.refresh_data(node_data)
            return item

        item = NodeItem(node_data)
        item.node_selected.connect(self.node_selected.emit)
        item.node_moved.connect(self._on_node_moved)
        item.add_child_text_requested.connect(self.add_child_text_requested.emit)
        item.add_child_image_requested.connect(self.add_child_image_requested.emit)
        item.edit_note_requested.connect(self.edit_note_requested.emit)
        item.deep_dive_requested.connect(self.deep_dive_requested.emit)
        item.delete_node_requested.connect(self.delete_node_requested.emit)
        item.delete_edge_requested.connect(self.delete_edge_requested.emit)
        item.socratic_questions_requested.connect(self.socratic_questions_requested.emit)
        item.highlight_toggled.connect(self.node_highlight_toggled.emit)
        item.connect_to_requested.connect(self._start_connection_flow)
        item.connect_nodes_requested.connect(self.connect_nodes_requested.emit)

        self.addItem(item)
        self.node_items[node_data.id] = item

        if trigger_physics:
            self.start_physics()
            self.graph_changed.emit()

        return item

    def add_edge_item(self, source_id: str, target_id: str, weight: float = 1.0, 
                      label: str = "", edge_type: str = "explicit", similarity: float = 1.0) -> Optional[EdgeItem]:
        src_item = self.node_items.get(source_id)
        tgt_item = self.node_items.get(target_id)
        if not src_item or not tgt_item or src_item == tgt_item:
            return None

        # Check existing edge
        for edge in self.edge_items:
            if (edge.source_item == src_item and edge.target_item == tgt_item) or \
               (edge.source_item == tgt_item and edge.target_item == src_item):
                if edge_type == "explicit" and edge.edge_type != "explicit":
                    edge.edge_type = "explicit"
                    edge.weight = weight
                    edge.update()
                return edge

        edge = EdgeItem(
            src_item, 
            tgt_item, 
            weight=weight, 
            label=label, 
            edge_type=edge_type, 
            similarity=similarity
        )
        self.addItem(edge)
        self.edge_items.append(edge)
        
        src_item.add_edge(edge)
        tgt_item.add_edge(edge)

        self.start_physics()
        self.graph_changed.emit()
        return edge

    def remove_semantic_edge_items(self):
        """Removes all dynamic semantic edge items from scene."""
        semantic_edges = [e for e in self.edge_items if e.edge_type == "semantic"]
        for edge in semantic_edges:
            self.edge_items.remove(edge)
            edge.source_item.remove_edge(edge)
            edge.target_item.remove_edge(edge)
            self.removeItem(edge)
        self.graph_changed.emit()

    def remove_node_item(self, node_id: str):
        item = self.node_items.get(node_id)
        if not item:
            return

        # Remove connected edges
        edges_to_remove = [e for e in self.edge_items if e.source_item == item or e.target_item == item]
        for edge in edges_to_remove:
            self.edge_items.remove(edge)
            edge.source_item.remove_edge(edge)
            edge.target_item.remove_edge(edge)
            self.removeItem(edge)

        self.removeItem(item)
        del self.node_items[node_id]
        self.start_physics()
        self.graph_changed.emit()

    def remove_edge_item(self, source_id: str, target_id: str):
        edges_to_remove = [
            e for e in self.edge_items
            if (e.source_item.node_data.id == source_id and e.target_item.node_data.id == target_id) or
               (e.source_item.node_data.id == target_id and e.target_item.node_data.id == source_id)
        ]
        for edge in edges_to_remove:
            self.edge_items.remove(edge)
            edge.source_item.remove_edge(edge)
            edge.target_item.remove_edge(edge)
            self.removeItem(edge)
            
        self.start_physics()
        self.graph_changed.emit()

    def keyPressEvent(self, event):
        """Allows deleting selected edges or nodes directly via keyboard in the scene."""
        if event.key() in (Qt.Key.Key_Delete, Qt.Key.Key_Backspace):
            selected = self.selectedItems()
            selected_edges = [item for item in selected if isinstance(item, EdgeItem)]
            if selected_edges:
                for edge in selected_edges:
                    self.delete_edge_requested.emit(edge.source_item.node_data.id, edge.target_item.node_data.id)
                event.accept()
                return
            selected_nodes = [item for item in selected if isinstance(item, NodeItem)]
            if selected_nodes:
                for node in selected_nodes:
                    self.delete_node_requested.emit(node.node_data.id)
                event.accept()
                return
        super().keyPressEvent(event)

    def _start_connection_flow(self, source_id: str):
        self.pending_connect_source = source_id

    def handle_node_click_for_connection(self, target_id: str) -> bool:
        if self.pending_connect_source and self.pending_connect_source != target_id:
            src = self.pending_connect_source
            self.pending_connect_source = None
            self.connect_nodes_requested.emit(src, target_id)
            return True
        return False

    def _on_node_moved(self, node_id: str, x: float, y: float):
        self.node_moved.emit(node_id, x, y)
        self.start_physics()

    def start_physics(self):
        if not self.physics_enabled:
            return
        self.is_simulating = True
        if not self.physics_timer.isActive():
            self.physics_timer.start()

    def stop_physics(self):
        self.is_simulating = False
        if self.physics_timer.isActive():
            self.physics_timer.stop()

    def toggle_physics(self, enabled: bool):
        self.physics_enabled = enabled
        config.set_physics_enabled(enabled)
        if enabled:
            self.start_physics()
        else:
            self.stop_physics()

    def _physics_step(self):
        """
        Interactive Physics Engine with Real Anti-Gravity Repulsion, Spring Elasticity, and Zero-G Floating:
        - Smooth Anti-Gravity Coulomb field: Nodes dynamically push each other away on close approach.
        - Elastic Hooke's Springs: Edges pull and bounce connected nodes when dragged.
        - Celestial Zero-G Drift: Nodes float smoothly in space with subtle harmonic waves.
        """
        if not self.physics_enabled:
            return

        nodes = list(self.node_items.values())
        n_count = len(nodes)
        if n_count == 0:
            return

        dt = PHYSICS_DEFAULTS.get("time_step", 0.036)
        l_rest = PHYSICS_DEFAULTS.get("spring_length", 84.0)
        damping = 0.86
        max_vel = 54.0
        repulsion_radius = 182.0  # 30% reduction from 260.0

        self.anim_time += dt

        for node in nodes:
            node.fx = 0.0
            node.fy = 0.0

            # 1. Celestial Zero-G Floating Drift (floating drift mechanism preserved; speed currently set to zero)
            if not node.node_data.fixed and not node.is_dragging and not getattr(node, "is_shift_linking", False) and not getattr(node, "is_link_target", False):
                phase = (abs(hash(node.node_data.id)) % 100) * 0.0628
                drift_speed = 0.0  # Floating drift speed set to 0
                drift_amp = 0.0    # Floating drift amplitude set to 0
                node.fx += math.sin(self.anim_time * drift_speed + phase) * drift_amp
                node.fy += math.cos(self.anim_time * (drift_speed * 0.75) + phase * 1.3) * (drift_amp * 0.8)

        # 2. Smooth Anti-Gravity Repulsion between all node pairs
        for i in range(n_count):
            n1 = nodes[i]
            p1 = n1.pos()
            for j in range(i + 1, n_count):
                n2 = nodes[j]
                p2 = n2.pos()

                dx = p2.x() - p1.x()
                dy = p2.y() - p1.y()
                dist = math.hypot(dx, dy) + 0.01

                if getattr(n1, "is_shift_linking", False) or getattr(n2, "is_shift_linking", False) or \
                   getattr(n1, "is_link_target", False) or getattr(n2, "is_link_target", False):
                    continue

                if dist < repulsion_radius:
                    # Smooth quadratic falloff: strong push when close, gently fading at repulsion_radius (scaled by 20%)
                    ratio = 1.0 - (dist / repulsion_radius)
                    rep_force = ratio * ratio * 900.0
                    fx_rep = (dx / dist) * rep_force
                    fy_rep = (dy / dist) * rep_force
                    n1.fx -= fx_rep
                    n1.fy -= fy_rep
                    n2.fx += fx_rep
                    n2.fy += fy_rep

        # 3. Hooke's Law Spring Tension along Connected Edges (Elastic stretch, pull & bounce - scaled by 20%)
        for edge in self.edge_items:
            n1 = edge.source_item
            n2 = edge.target_item
            p1 = n1.pos()
            p2 = n2.pos()

            dx = p2.x() - p1.x()
            dy = p2.y() - p1.y()
            dist = math.hypot(dx, dy) + 0.01

            displacement = dist - l_rest
            spring_force = displacement * 4.32 * edge.weight
            fx = (dx / dist) * spring_force
            fy = (dy / dist) * spring_force

            n1.fx += fx
            n1.fy += fy
            n2.fx -= fx
            n2.fy -= fy

        # 4. Position Integration with Velocity Damping
        total_movement = 0.0
        is_node_actively_dragged = any(n.is_dragging for n in nodes)

        for node in nodes:
            if node.is_dragging or node.node_data.fixed:
                node.vx = 0.0
                node.vy = 0.0
                continue

            node.vx = (node.vx + node.fx * dt) * damping
            node.vy = (node.vy + node.fy * dt) * damping

            v_mag = math.hypot(node.vx, node.vy)
            if v_mag > max_vel:
                node.vx = (node.vx / v_mag) * max_vel
                node.vy = (node.vy / v_mag) * max_vel

            new_x = node.pos().x() + node.vx * dt
            new_y = node.pos().y() + node.vy * dt

            node.setPos(new_x, new_y)
            node.node_data.x = new_x
            node.node_data.y = new_y
            total_movement += v_mag

        # 5. Update edge endpoints to follow moving nodes
        for edge in self.edge_items:
            edge.update_positions()

        # 6. Adaptive Frame Rate (60fps when actively moving/dragging, 30fps for floating drift)
        if is_node_actively_dragged or total_movement > 3.0:
            if self.physics_timer.interval() != 16:
                self.physics_timer.setInterval(16)
        else:
            if self.physics_timer.interval() != 33:
                self.physics_timer.setInterval(33)
