"""
Custom QGraphicsItems for Nodes and Edges in MindMap Studio.
Features dynamic importance scaling (1-10), glowing halos, text wrapping, and context menus.
"""

import math
from typing import List, Optional, Set
from PyQt6.QtCore import Qt, QRectF, QPointF, pyqtSignal
from PyQt6.QtWidgets import (
    QGraphicsObject, QGraphicsItem, QGraphicsSceneMouseEvent,
    QMenu, QGraphicsSceneContextMenuEvent
)
from PyQt6.QtGui import (
    QPainter, QColor, QBrush, QPen, QRadialGradient, QFont,
    QFontMetrics, QTextOption
)

from mindmap_studio.models.graph_models import NodeData, EdgeData
from mindmap_studio.config import get_node_style_for_importance
from mindmap_studio.i18n import t


class EdgeItem(QGraphicsItem):
    """Visual edge connecting source and target NodeItems with interactive hover, selection, and delete key / context menu deletion."""
    
    def __init__(self, source_item: "NodeItem", target_item: "NodeItem", weight: float = 1.0, 
                 label: str = "", edge_type: str = "conceptual", similarity: float = 1.0):
        super().__init__()
        self.source_item = source_item
        self.target_item = target_item
        self.weight = weight
        self.label = label or ""
        self.edge_type = edge_type
        self.similarity = similarity
        self.is_hovered = False
        
        self.setZValue(1)  # Behind nodes (Z=10)
        self.setAcceptHoverEvents(True)
        self.setAcceptedMouseButtons(Qt.MouseButton.LeftButton | Qt.MouseButton.RightButton)
        self.setFlag(QGraphicsItem.GraphicsItemFlag.ItemIsSelectable, True)
        self.setFlag(QGraphicsItem.GraphicsItemFlag.ItemIsFocusable, True)
        
        src_name = source_item.node_data.title if source_item else ""
        tgt_name = target_item.node_data.title if target_item else ""
        self.setToolTip(t("edge_tooltip", src=src_name, tgt=tgt_name))
        
        self.source_point = QPointF()
        self.target_point = QPointF()
        self.update_positions()

    def boundingRect(self) -> QRectF:
        extra = 25.0
        return QRectF(
            self.source_point,
            self.target_point
        ).normalized().adjusted(-extra, -extra, extra, extra)

    def shape(self):
        from PyQt6.QtGui import QPainterPath, QPainterPathStroker
        path = QPainterPath()
        path.moveTo(self.source_point)
        path.lineTo(self.target_point)
        stroker = QPainterPathStroker()
        stroker.setWidth(18.0)  # Generous hit area for easy hover & click selection
        stroker.setCapStyle(Qt.PenCapStyle.RoundCap)
        return stroker.createStroke(path)

    def hoverEnterEvent(self, event):
        self.is_hovered = True
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.update()
        super().hoverEnterEvent(event)

    def hoverLeaveEvent(self, event):
        self.is_hovered = False
        self.setCursor(Qt.CursorShape.ArrowCursor)
        self.update()
        super().hoverLeaveEvent(event)

    def mousePressEvent(self, event: QGraphicsSceneMouseEvent):
        if event.button() == Qt.MouseButton.LeftButton:
            if self.scene():
                self.scene().clearSelection()
            self.setSelected(True)
            if self.scene() and hasattr(self.scene(), "edge_selected"):
                self.scene().edge_selected.emit(self.source_item.node_data.id, self.target_item.node_data.id)
            event.accept()
        super().mousePressEvent(event)

    def contextMenuEvent(self, event: QGraphicsSceneContextMenuEvent):
        menu = QMenu()
        menu.setStyleSheet("""
            QMenu {
                background-color: #0f172a;
                color: #f8fafc;
                border: 1px solid #334155;
                border-radius: 8px;
                padding: 6px;
                font-size: 13px;
            }
            QMenu::item {
                padding: 6px 20px 6px 12px;
                border-radius: 4px;
            }
            QMenu::item:selected {
                background-color: #1e293b;
                color: #38bdf8;
            }
        """)
        src_title = self.source_item.node_data.title if self.source_item else "Node"
        tgt_title = self.target_item.node_data.title if self.target_item else "Node"
        act_edit_label = menu.addAction(t("menu_edit_link_label"))
        menu.addSeparator()
        act_delete = menu.addAction(t("menu_delete_link", src=src_title, tgt=tgt_title))

        chosen = menu.exec(event.screenPos())
        if chosen == act_edit_label:
            if self.scene() and hasattr(self.scene(), "edit_edge_label_requested"):
                self.scene().edit_edge_label_requested.emit(self.source_item.node_data.id, self.target_item.node_data.id)
        elif chosen == act_delete:
            if self.scene() and hasattr(self.scene(), "delete_edge_requested"):
                self.scene().delete_edge_requested.emit(self.source_item.node_data.id, self.target_item.node_data.id)
            elif self.scene() and hasattr(self.scene(), "remove_edge_item"):
                self.scene().remove_edge_item(self.source_item.node_data.id, self.target_item.node_data.id)
        event.accept()

    def update_positions(self):
        """Calculates boundary intersection points between circular nodes."""
        if not self.source_item or not self.target_item:
            return
            
        p1 = self.source_item.scenePos()
        p2 = self.target_item.scenePos()
        
        dx = p2.x() - p1.x()
        dy = p2.y() - p1.y()
        dist = math.hypot(dx, dy)
        
        if dist < 1e-4:
            self.source_point = p1
            self.target_point = p2
            return

        # Connect at circle perimeters
        r1 = self.source_item.radius
        r2 = self.target_item.radius
        
        self.prepareGeometryChange()
        self.source_point = QPointF(p1.x() + (dx / dist) * r1, p1.y() + (dy / dist) * r1)
        self.target_point = QPointF(p2.x() - (dx / dist) * r2, p2.y() - (dy / dist) * r2)

    def paint(self, painter: QPainter, option, widget=None):
        if not self.source_item or not self.target_item:
            return

        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        is_endpoint_selected = self.source_item.isSelected() or self.target_item.isSelected()

        if self.isSelected():
            edge_color = QColor("#38bdf8")  # Glowing vibrant cyan when selected
            pen_width = 2.2
            pen_style = Qt.PenStyle.DashLine
        elif self.is_hovered:
            edge_color = QColor(148, 163, 184, 230)  # Neutral elegant slate
            pen_width = 1.6
            pen_style = Qt.PenStyle.DotLine  # Clean dotted line on hover
        elif is_endpoint_selected:
            edge_color = QColor("#38bdf8")
            pen_width = 1.1
            pen_style = Qt.PenStyle.SolidLine
        else:
            edge_color = QColor(100, 116, 139, 140)
            pen_width = 0.8
            pen_style = Qt.PenStyle.SolidLine

        pen = QPen(edge_color, pen_width, pen_style, Qt.PenCapStyle.RoundCap)
        painter.setPen(pen)
        painter.drawLine(self.source_point, self.target_point)

        # Draw edge label badge at midpoint if label exists
        if self.label:
            mx = (self.source_point.x() + self.target_point.x()) / 2.0
            my = (self.source_point.y() + self.target_point.y()) / 2.0
            
            font = QFont("Segoe UI", 8, QFont.Weight.Medium)
            painter.setFont(font)
            fm = QFontMetrics(font)
            text_w = fm.horizontalAdvance(self.label)
            text_h = fm.height()
            
            pad_x = 7.0
            pad_y = 3.0
            badge_rect = QRectF(mx - text_w / 2.0 - pad_x, my - text_h / 2.0 - pad_y, text_w + 2 * pad_x, text_h + 2 * pad_y)
            
            if self.isSelected():
                bg_col = QColor("#0369a1")
                border_col = QColor("#38bdf8")
                txt_col = QColor("#ffffff")
            elif self.is_hovered:
                bg_col = QColor("#1e293b")
                border_col = QColor("#94a3b8")
                txt_col = QColor("#f8fafc")
            else:
                bg_col = QColor(15, 23, 42, 220)
                border_col = QColor(51, 65, 85, 200)
                txt_col = QColor("#94a3b8")
                
            painter.setBrush(QBrush(bg_col))
            painter.setPen(QPen(border_col, 1.0))
            painter.drawRoundedRect(badge_rect, 4.0, 4.0)
            
            painter.setPen(txt_col)
            painter.drawText(badge_rect, Qt.AlignmentFlag.AlignCenter, self.label)



class NodeItem(QGraphicsObject):
    """
    Interactive Knowledge Graph Node.
    Supports free dragging and Shift + Drag & Drop Node to Connect.
    """
    # Signals for UI interactions
    node_selected = pyqtSignal(str)
    node_moved = pyqtSignal(str, float, float)
    add_child_text_requested = pyqtSignal(str)
    add_child_image_requested = pyqtSignal(str)
    edit_note_requested = pyqtSignal(str)
    deep_dive_requested = pyqtSignal(str)
    connect_to_requested = pyqtSignal(str)
    connect_nodes_requested = pyqtSignal(str, str)
    delete_node_requested = pyqtSignal(str)
    delete_edge_requested = pyqtSignal(str, str)
    socratic_questions_requested = pyqtSignal(str)
    pin_toggled = pyqtSignal(str, bool)
    highlight_toggled = pyqtSignal(str, bool)

    def __init__(self, node_data: NodeData):
        super().__init__()
        self.node_data = node_data
        self.is_hovered = False
        self.is_dragging = False
        self._pixmap: Optional[QPixmap] = None
        
        # Shift + Drag to Connect state
        self.is_shift_linking = False
        self.is_link_target = False
        self.drag_start_pos = QPointF()

        # Velocity for physics simulation
        self.vx = 0.0
        self.vy = 0.0
        self.fx = 0.0
        self.fy = 0.0

        # Connected edges reference
        self.edges: Set[EdgeItem] = set()

        # Flags
        self.setFlags(
            QGraphicsItem.GraphicsItemFlag.ItemIsMovable |
            QGraphicsItem.GraphicsItemFlag.ItemIsSelectable |
            QGraphicsItem.GraphicsItemFlag.ItemSendsGeometryChanges
        )
        self.setAcceptHoverEvents(True)
        self.setZValue(10)

        self._update_styling()
        self.setPos(node_data.x, node_data.y)

    def _load_pixmap(self):
        """Loads and caches pixmap if this is an image node."""
        is_image_node = (getattr(self.node_data, "node_type", "text") == "image")
        img_path = getattr(self.node_data, "image_path", "")
        if is_image_node and img_path:
            from pathlib import Path
            from PyQt6.QtGui import QPixmap
            p = Path(img_path)
            candidates = [
                p,
                Path.cwd() / p,
                Path(__file__).resolve().parents[3] / p,
                Path(__file__).resolve().parents[2] / p,
            ]
            found = None
            for cand in candidates:
                if cand.is_file():
                    found = cand
                    break
            
            if found:
                self._pixmap = QPixmap(str(found))
            else:
                pix = QPixmap(str(img_path))
                self._pixmap = pix if not pix.isNull() else None
        else:
            self._pixmap = None

    def _update_styling(self):
        style = get_node_style_for_importance(self.node_data.importance)
        is_image_node = (getattr(self.node_data, "node_type", "text") == "image")
        
        # Determine scale for image nodes:
        # small = 1.0 (current base size = 3x regular node)
        # medium = 2.0 (2x of current image node size = 6x regular node)
        # large = 3.0 (3x of current image node size = 9x regular node)
        if is_image_node:
            size_name = getattr(self.node_data, "image_size", "small")
            if size_name == "large":
                img_scale = 3.0
            elif size_name == "medium":
                img_scale = 2.0
            else:
                img_scale = 1.0
            self.radius = 19.5 * img_scale  # Preserved original image node sizes
            self.border_width = style["border_width"] * (1.5 + (img_scale - 1.0) * 0.4)
        else:
            self.radius = style["radius"]
            self.border_width = style["border_width"]

        self.fill_color_hex = style["fill_color"]
        self.border_color_hex = style["border_color"]
        self.glow_color_str = style["glow_color"]
        self.glow_radius = style["glow_radius"]
        self._load_pixmap()

    def refresh_data(self, node_data: NodeData):
        """Updates internal node data and geometry."""
        self.node_data = node_data
        self.prepareGeometryChange()
        self._update_styling()
        self.update()
        for edge in self.edges:
            edge.update_positions()

    def add_edge(self, edge: EdgeItem):
        self.edges.add(edge)

    def remove_edge(self, edge: EdgeItem):
        self.edges.discard(edge)

    def boundingRect(self) -> QRectF:
        margin_x = max(80.0, self.radius + 20.0)
        margin_top = self.radius + 20.0
        margin_bottom = self.radius + 45.0
        return QRectF(-margin_x, -margin_top, margin_x * 2, margin_top + margin_bottom)

    def shape(self):
        from PyQt6.QtGui import QPainterPath
        path = QPainterPath()
        path.addEllipse(QPointF(0, 0), self.radius + 4, self.radius + 4)
        return path

    def paint(self, painter: QPainter, option, widget=None):
        from PyQt6.QtGui import QPainterPath, QPixmap
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing)
        painter.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform)

        center = QPointF(0, 0)
        is_highlighted = bool(getattr(self.node_data, "highlighted", False))
        hl_color = getattr(self.node_data, "highlight_color", "gold") or "gold"
        if isinstance(self.node_data.highlighted, str) and self.node_data.highlighted.lower() in ("red", "green", "gold", "amber", "yellow"):
            hl_color = self.node_data.highlighted.lower()
        if hl_color in ("amber", "yellow"):
            hl_color = "gold"

        is_image_node = (getattr(self.node_data, "node_type", "text") == "image")
        
        # 0. Draw Tether Line if in Shift + Drag Link mode
        if self.is_shift_linking:
            local_start = self.mapFromScene(self.drag_start_pos)
            tether_pen = QPen(QColor("#38bdf8"), 1.8, Qt.PenStyle.DashLine, Qt.PenCapStyle.RoundCap)
            painter.setPen(tether_pen)
            painter.drawLine(local_start, center)
            # Tether origin anchor dot
            painter.setBrush(QBrush(QColor("#38bdf8")))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(local_start, 3.0, 3.0)

        # 1. Radiant Glow on Select / Hover / Link Target / Highlighted
        if self.is_link_target:
            glow_r = self.radius + (14 if is_image_node else 12)
            glow_grad = QRadialGradient(center, glow_r)
            glow_grad.setColorAt(0.0, QColor(56, 189, 248, 180))
            glow_grad.setColorAt(1.0, QColor(56, 189, 248, 0))
            painter.setBrush(QBrush(glow_grad))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(center, glow_r, glow_r)
        elif is_highlighted:
            glow_r = self.radius + (18 if is_image_node else 14)
            glow_grad = QRadialGradient(center, glow_r)
            if hl_color == "red":
                # Deep Radiant Vivid Crimson Red Highlight Glow Aura
                glow_grad.setColorAt(0.0, QColor(255, 30, 60, 250))
                glow_grad.setColorAt(0.5, QColor(220, 38, 38, 160))
                glow_grad.setColorAt(1.0, QColor(185, 28, 28, 0))
            elif hl_color == "green":
                # Deep Radiant Vivid Emerald Green Highlight Glow Aura
                glow_grad.setColorAt(0.0, QColor(34, 197, 94, 250))
                glow_grad.setColorAt(0.5, QColor(16, 185, 129, 160))
                glow_grad.setColorAt(1.0, QColor(21, 128, 61, 0))
            else:
                # Radiant Golden Amber Highlight Glow Aura (Original Gold Highlight)
                glow_grad.setColorAt(0.0, QColor(245, 158, 11, 220))
                glow_grad.setColorAt(0.6, QColor(251, 191, 36, 100))
                glow_grad.setColorAt(1.0, QColor(245, 158, 11, 0))
            painter.setBrush(QBrush(glow_grad))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(center, glow_r, glow_r)
        elif self.isSelected() or self.is_hovered:
            glow_r = self.radius + (10 if is_image_node else 6)
            glow_grad = QRadialGradient(center, glow_r)
            glow_grad.setColorAt(0.0, QColor(248, 250, 252, 70 if self.isSelected() else 40))
            glow_grad.setColorAt(1.0, QColor(148, 163, 184, 0))
            painter.setBrush(QBrush(glow_grad))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(center, glow_r, glow_r)

        # 2. Node Body Fill and Border
        if self.is_link_target:
            fill_color = QColor("#0284c7")
            border_color = QColor("#38bdf8")
            pen_w = 2.6 if is_image_node else 2.6
        elif self.is_shift_linking:
            fill_color = QColor("#0369a1")
            border_color = QColor("#38bdf8")
            pen_w = 2.4 if is_image_node else 2.2
        elif is_highlighted:
            if hl_color == "red":
                fill_color = QColor("#dc2626")
                border_color = QColor("#ff3355")
            elif hl_color == "green":
                fill_color = QColor("#16a34a")
                border_color = QColor("#22c55e")
            else:
                # Highlighted golden amber node body (Original Gold Highlight)
                fill_color = QColor("#d97706")
                border_color = QColor("#fde047")
            pen_w = 2.6 if is_image_node else 2.2
        elif self.isSelected():
            fill_color = QColor("#64748b")
            border_color = QColor("#f8fafc")
            pen_w = 2.4 if is_image_node else 2.0
        elif self.is_hovered:
            fill_color = QColor("#525e70")
            border_color = QColor("#94a3b8")
            pen_w = 2.0 if is_image_node else 1.6
        else:
            fill_color = QColor("#475569")
            border_color = QColor("#64748b")
            pen_w = 1.8 if is_image_node else 1.4

        pen_style = Qt.PenStyle.DashLine if self.node_data.fixed else Qt.PenStyle.SolidLine

        if is_image_node and self._pixmap and not self._pixmap.isNull():
            # Draw background base circle
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(fill_color))
            painter.drawEllipse(center, self.radius, self.radius)

            # Draw image with circular clip mask
            painter.save()
            clip_path = QPainterPath()
            clip_path.addEllipse(center, self.radius - 0.5, self.radius - 0.5)
            painter.setClipPath(clip_path)

            scaled_pix = self._pixmap.scaled(
                int(self.radius * 2), int(self.radius * 2),
                Qt.AspectRatioMode.KeepAspectRatioByExpanding,
                Qt.TransformationMode.SmoothTransformation
            )
            pw = scaled_pix.width()
            ph = scaled_pix.height()
            painter.drawPixmap(int(-pw / 2), int(-ph / 2), scaled_pix)
            painter.restore()

            # Draw circular border on top
            painter.setPen(QPen(border_color, pen_w, pen_style))
            painter.setBrush(Qt.BrushStyle.NoBrush)
            painter.drawEllipse(center, self.radius, self.radius)
        else:
            # Standard solid node circle
            painter.setPen(QPen(border_color, pen_w, pen_style))
            painter.setBrush(QBrush(fill_color))
            painter.drawEllipse(center, self.radius, self.radius)

        # 3. Clean Text Label
        if self.is_link_target:
            painter.setPen(QColor("#38bdf8"))
            font = QFont("Segoe UI", 8, QFont.Weight.Bold)
        elif is_highlighted:
            if hl_color == "red":
                painter.setPen(QColor("#ff4d6d"))
            elif hl_color == "green":
                painter.setPen(QColor("#4ade80"))
            else:
                painter.setPen(QColor("#fde047"))
            font = QFont("Segoe UI", 8, QFont.Weight.Bold)
        elif self.is_shift_linking or self.isSelected():
            painter.setPen(QColor("#f8fafc"))
            font = QFont("Segoe UI", 8, QFont.Weight.DemiBold)
        else:
            painter.setPen(QColor("#cbd5e1" if not self.is_hovered else "#f8fafc"))
            font = QFont("Segoe UI", 8, QFont.Weight.Medium)

        painter.setFont(font)
        label_w = max(150.0, self.radius * 2 + 30.0)
        label_rect = QRectF(-label_w / 2, self.radius + 4, label_w, 34)
        text_option = QTextOption(Qt.AlignmentFlag.AlignHCenter | Qt.AlignmentFlag.AlignTop)
        text_option.setWrapMode(QTextOption.WrapMode.WordWrap)
        
        display_text = self.node_data.title
        if self.is_link_target:
            display_text += "\n[🔗 Release to Link]"
        
        painter.drawText(label_rect, display_text, text_option)

    def itemChange(self, change: QGraphicsItem.GraphicsItemChange, value):
        if change == QGraphicsItem.GraphicsItemChange.ItemPositionHasChanged:
            pos = self.pos()
            self.node_data.x = pos.x()
            self.node_data.y = pos.y()
            for edge in self.edges:
                edge.update_positions()
            self.node_moved.emit(self.node_data.id, pos.x(), pos.y())
        return super().itemChange(change, value)

    def hoverEnterEvent(self, event):
        self.is_hovered = True
        self.update()
        super().hoverEnterEvent(event)

    def hoverLeaveEvent(self, event):
        self.is_hovered = False
        self.update()
        super().hoverLeaveEvent(event)

    def _find_hovered_target_node(self) -> Optional["NodeItem"]:
        """Finds any nearby candidate NodeItem to drop connection onto."""
        if not self.scene():
            return None
        current_scene_pos = self.scenePos()
        target_item = None
        min_dist = float('inf')
        for item in self.scene().items():
            if isinstance(item, NodeItem) and item != self:
                dist = math.hypot(item.scenePos().x() - current_scene_pos.x(),
                                  item.scenePos().y() - current_scene_pos.y())
                trigger_radius = item.radius + 40.0
                if dist <= trigger_radius and dist < min_dist:
                    min_dist = dist
                    target_item = item
        return target_item

    def mousePressEvent(self, event: QGraphicsSceneMouseEvent):
        if event.button() == Qt.MouseButton.LeftButton:
            self.node_selected.emit(self.node_data.id)
            self.drag_start_pos = self.pos()

            if event.modifiers() & Qt.KeyboardModifier.ShiftModifier:
                # Shift + Drag link mode
                self.is_shift_linking = True
                self.is_dragging = False
                if self.scene() and hasattr(self.scene(), "stop_physics"):
                    self.scene().stop_physics()
            else:
                # Normal position drag
                self.is_shift_linking = False
                self.is_dragging = True
                if self.scene() and hasattr(self.scene(), "begin_node_drag"):
                    self.scene().begin_node_drag(self)

        super().mousePressEvent(event)

    def mouseMoveEvent(self, event: QGraphicsSceneMouseEvent):
        super().mouseMoveEvent(event)
        
        if self.is_dragging:
            pos = self.pos()
            self.node_data.x = pos.x()
            self.node_data.y = pos.y()
            for edge in self.edges:
                edge.update_positions()
        elif self.is_shift_linking and self.scene():
            target_item = self._find_hovered_target_node()
            for item in self.scene().items():
                if isinstance(item, NodeItem) and item != self:
                    is_target = (item == target_item)
                    if item.is_link_target != is_target:
                        item.is_link_target = is_target
                        item.update()
            self.update()

    def mouseReleaseEvent(self, event: QGraphicsSceneMouseEvent):
        if event.button() == Qt.MouseButton.LeftButton:
            if self.is_shift_linking:
                target_item = self._find_hovered_target_node()
                
                # Clear target highlight on all nodes
                if self.scene():
                    for item in self.scene().items():
                        if isinstance(item, NodeItem):
                            if item.is_link_target:
                                item.is_link_target = False
                                item.update()

                # If dropped over valid target node, trigger permanent connection
                if target_item and target_item != self:
                    self.connect_nodes_requested.emit(self.node_data.id, target_item.node_data.id)

                # Snap Node A back to its initial position before the shift drag
                self.setPos(self.drag_start_pos)
                self.node_data.x = self.drag_start_pos.x()
                self.node_data.y = self.drag_start_pos.y()
                for edge in self.edges:
                    edge.update_positions()

                self.is_shift_linking = False
                self.update()

                if self.scene() and hasattr(self.scene(), "start_physics"):
                    self.scene().start_physics()
            else:
                self.is_dragging = False
                pos = self.pos()
                self.node_data.x = pos.x()
                self.node_data.y = pos.y()
                if self.scene() and hasattr(self.scene(), "end_node_drag"):
                    self.scene().end_node_drag(self)
                elif self.scene() and hasattr(self.scene(), "start_physics"):
                    self.scene().start_physics()

        super().mouseReleaseEvent(event)

    def mouseDoubleClickEvent(self, event: QGraphicsSceneMouseEvent):
        if event.button() == Qt.MouseButton.LeftButton:
            self.edit_note_requested.emit(self.node_data.id)
            event.accept()
        else:
            super().mouseDoubleClickEvent(event)

    def contextMenuEvent(self, event: QGraphicsSceneContextMenuEvent):
        menu = QMenu()
        menu.setStyleSheet("""
            QMenu {
                background-color: #0f172a;
                color: #f8fafc;
                border: 1px solid #334155;
                border-radius: 8px;
                padding: 6px;
                font-size: 13px;
            }
            QMenu::item {
                padding: 6px 20px 6px 12px;
                border-radius: 4px;
            }
            QMenu::item:selected {
                background-color: #1e293b;
                color: #38bdf8;
            }
        """)

        act_add_child_text = menu.addAction(t("menu_add_child_text"))
        act_add_child_image = menu.addAction(t("menu_add_child_image"))
        menu.addSeparator()
        act_edit = menu.addAction(t("menu_add_edit_note"))
        act_deep_dive = menu.addAction(t("menu_deep_dive"))
        act_socratic = menu.addAction(t("menu_socratic"))
        
        is_hl = bool(getattr(self.node_data, "highlighted", False))
        menu_hl = menu.addMenu(t("menu_highlight_menu"))
        act_hl_gold = menu_hl.addAction(t("menu_highlight_gold"))
        act_hl_red = menu_hl.addAction(t("menu_highlight_red"))
        act_hl_green = menu_hl.addAction(t("menu_highlight_green"))
        if is_hl:
            menu_hl.addSeparator()
            act_hl_remove = menu_hl.addAction(t("menu_remove_highlight"))
        else:
            act_hl_remove = None

        menu.addSeparator()
        act_connect = menu.addAction(t("menu_connect"))
        
        # Disconnect options if node has edges
        disconnect_actions = {}
        if self.edges:
            disconnect_menu = menu.addMenu(t("menu_disconnect"))
            for edge in list(self.edges):
                other_node = edge.target_item if edge.source_item == self else edge.source_item
                if other_node:
                    act_dc = disconnect_menu.addAction(t("menu_disconnect_from", title=other_node.node_data.title))
                    disconnect_actions[act_dc] = (self.node_data.id, other_node.node_data.id)

        pin_text = t("menu_unpin") if self.node_data.fixed else t("menu_pin")
        act_pin = menu.addAction(pin_text)
        
        menu.addSeparator()
        act_delete = menu.addAction(t("menu_delete_thought"))

        chosen = menu.exec(event.screenPos())
        
        if chosen in disconnect_actions:
            src_id, tgt_id = disconnect_actions[chosen]
            self.delete_edge_requested.emit(src_id, tgt_id)
        elif chosen == act_add_child_text:
            self.add_child_text_requested.emit(self.node_data.id)
        elif chosen == act_add_child_image:
            self.add_child_image_requested.emit(self.node_data.id)
        elif chosen == act_edit:
            self.edit_note_requested.emit(self.node_data.id)
        elif chosen == act_deep_dive:
            self.deep_dive_requested.emit(self.node_data.id)
        elif chosen == act_socratic:
            self.socratic_questions_requested.emit(self.node_data.id)
        elif chosen == act_hl_gold:
            self.node_data.highlighted = True
            self.node_data.highlight_color = "gold"
            self.highlight_toggled.emit(self.node_data.id, True)
            self.update()
        elif chosen == act_hl_red:
            self.node_data.highlighted = True
            self.node_data.highlight_color = "red"
            self.highlight_toggled.emit(self.node_data.id, True)
            self.update()
        elif chosen == act_hl_green:
            self.node_data.highlighted = True
            self.node_data.highlight_color = "green"
            self.highlight_toggled.emit(self.node_data.id, True)
            self.update()
        elif act_hl_remove and chosen == act_hl_remove:
            self.node_data.highlighted = False
            self.highlight_toggled.emit(self.node_data.id, False)
            self.update()
        elif chosen == act_connect:
            self.connect_to_requested.emit(self.node_data.id)
        elif chosen == act_pin:
            self.node_data.fixed = not self.node_data.fixed
            self.pin_toggled.emit(self.node_data.id, self.node_data.fixed)
            self.update()
        elif chosen == act_delete:
            self.delete_node_requested.emit(self.node_data.id)

        event.accept()
