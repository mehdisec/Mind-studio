"""
Custom QGraphicsView with smooth navigation, zoom, pan, rubber-band multi-selection,
and sleek minimal dark grid canvas.
- Dragging empty space: Box-selects (RubberBand) multiple nodes.
- Space + Mouse Drag (or Middle-Click / Alt+Drag): Smoothly pans the canvas in any direction.
- Properly handles RTL (RightToLeft) coordinate inversion for Persian localization.
"""

from pathlib import Path
from typing import Optional
from PyQt6.QtCore import Qt, QRectF, QPointF, pyqtSignal
from PyQt6.QtWidgets import QGraphicsView, QMenu
from PyQt6.QtGui import QPainter, QColor, QPen, QWheelEvent, QMouseEvent, QKeyEvent, QPixmap

from mindmap_studio.config import config
from mindmap_studio.i18n import t


class GraphView(QGraphicsView):
    """Interactive canvas view for navigating the force-directed mind map."""
    add_text_node_requested = pyqtSignal(QPointF)
    add_image_node_requested = pyqtSignal(QPointF)
    
    _shared_bg_pixmap: Optional[QPixmap] = None

    @classmethod
    def _get_background_pixmap(cls) -> Optional[QPixmap]:
        """Loads and caches the Background.jpg pixmap from project root or resources."""
        if cls._shared_bg_pixmap is not None:
            return cls._shared_bg_pixmap

        candidates = [
            Path(__file__).resolve().parents[3] / "Background.jpg",
            Path(__file__).resolve().parents[3] / "background.jpg",
            Path.cwd() / "Background.jpg",
            Path.cwd() / "background.jpg",
            Path("Background.jpg"),
            Path("background.jpg"),
            Path(__file__).resolve().parents[2] / "Background.jpg",
            Path(__file__).resolve().parents[2] / "resources" / "Background.jpg",
            Path(__file__).resolve().parents[1] / "Background.jpg",
        ]
        for path in candidates:
            if path.is_file():
                pix = QPixmap(str(path))
                if not pix.isNull():
                    cls._shared_bg_pixmap = pix
                    return pix

        return None

    def __init__(self, scene, parent=None):
        super().__init__(scene, parent)
        self.setRenderHints(
            QPainter.RenderHint.Antialiasing |
            QPainter.RenderHint.SmoothPixmapTransform |
            QPainter.RenderHint.TextAntialiasing
        )
        self.setViewportUpdateMode(QGraphicsView.ViewportUpdateMode.FullViewportUpdate)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setTransformationAnchor(QGraphicsView.ViewportAnchor.AnchorUnderMouse)
        self.setResizeAnchor(QGraphicsView.ViewportAnchor.AnchorViewCenter)
        self.setDragMode(QGraphicsView.DragMode.RubberBandDrag)
        self.setMouseTracking(True)
        
        self.is_panning = False
        self._space_held = False
        self._pan_start_x = 0
        self._pan_start_y = 0
        self._zoom_level = 1.25
        self.scale(1.25, 1.25)
        
        self.viewport().setCursor(Qt.CursorShape.ArrowCursor)

        self._bg_pixmap = self._get_background_pixmap()
        self._cached_scaled_bg: Optional[QPixmap] = None
        self._cached_viewport_size = None

    def drawBackground(self, painter: QPainter, rect: QRectF):
        """Draws canvas with the project Background.jpg wallpaper and a subtle spatial grid."""
        is_light = (config.get_theme() == "light")
        bg_color = QColor("#f8fafc") if is_light else QColor("#080c14")
        dot_color = QColor(100, 116, 139, 45) if is_light else QColor(148, 163, 184, 30)

        # 1. Base color fill in scene coordinates
        painter.fillRect(rect, bg_color)

        # 2. Draw Background.jpg image fixed in viewport coordinates (unclipped)
        bg = self._get_background_pixmap() or self._bg_pixmap
        if bg and not bg.isNull():
            painter.save()
            painter.setClipping(False)
            painter.resetTransform()

            vp = self.viewport()
            v_w = vp.width() if vp else int(rect.width())
            v_h = vp.height() if vp else int(rect.height())

            if v_w > 0 and v_h > 0:
                v_size = vp.size() if vp else rect.size().toSize()
                if self._cached_viewport_size != v_size or self._cached_scaled_bg is None:
                    self._cached_viewport_size = v_size
                    self._cached_scaled_bg = bg.scaled(
                        v_size,
                        Qt.AspectRatioMode.KeepAspectRatioByExpanding,
                        Qt.TransformationMode.SmoothTransformation,
                    )

                x_off = (v_w - self._cached_scaled_bg.width()) // 2
                y_off = (v_h - self._cached_scaled_bg.height()) // 2
                painter.drawPixmap(x_off, y_off, self._cached_scaled_bg)

                # Overlay subtle cyber dark tint to preserve node contrast and readability
                if is_light:
                    painter.fillRect(0, 0, v_w, v_h, QColor(248, 250, 252, 175))
                else:
                    painter.fillRect(0, 0, v_w, v_h, QColor(8, 12, 20, 115))

            painter.restore()

        # 3. Spatial dot matrix grid
        grid_size = 50.0
        left = int(rect.left()) - (int(rect.left()) % int(grid_size))
        top = int(rect.top()) - (int(rect.top()) % int(grid_size))

        painter.setPen(QPen(dot_color, 1.2))

        x = float(left)
        while x < rect.right():
            y = float(top)
            while y < rect.bottom():
                painter.drawPoint(QPointF(x, y))
                y += grid_size
            x += grid_size

    def wheelEvent(self, event: QWheelEvent):
        """Smooth zooming anchored under mouse cursor."""
        zoom_in_factor = 1.15
        zoom_out_factor = 1.0 / zoom_in_factor

        if event.angleDelta().y() > 0:
            zoom_factor = zoom_in_factor
            self._zoom_level *= 1.15
        else:
            zoom_factor = zoom_out_factor
            self._zoom_level *= 0.85

        # Clamp zoom level between 0.3x and 5.0x
        if 0.3 <= self._zoom_level <= 5.0:
            self.scale(zoom_factor, zoom_factor)
        else:
            self._zoom_level = max(0.3, min(5.0, self._zoom_level))
            
        event.accept()

    def mousePressEvent(self, event: QMouseEvent):
        is_pan_action = (
            self._space_held or
            event.button() == Qt.MouseButton.MiddleButton or
            (event.button() == Qt.MouseButton.LeftButton and bool(event.modifiers() & Qt.KeyboardModifier.AltModifier))
        )

        if is_pan_action:
            self.is_panning = True
            self.setDragMode(QGraphicsView.DragMode.NoDrag)
            self._pan_start_x = int(event.position().x())
            self._pan_start_y = int(event.position().y())
            self.viewport().setCursor(Qt.CursorShape.ClosedHandCursor)
            event.accept()
            return

        # Normal mode: Rubber-band box selection on empty space or node dragging
        self.setDragMode(QGraphicsView.DragMode.RubberBandDrag)
        super().mousePressEvent(event)

    def mouseMoveEvent(self, event: QMouseEvent):
        curr_x = int(event.position().x())
        curr_y = int(event.position().y())

        if self.is_panning:
            dx = curr_x - self._pan_start_x
            dy = curr_y - self._pan_start_y

            # Handle Qt's inverted horizontal scrollbar values in RTL (RightToLeft) mode
            h_delta = dx if self.isRightToLeft() else -dx
            self.horizontalScrollBar().setValue(self.horizontalScrollBar().value() + h_delta)
            self.verticalScrollBar().setValue(self.verticalScrollBar().value() - dy)
            self._pan_start_x = curr_x
            self._pan_start_y = curr_y
            event.accept()
            return
        
        # When Space is held, show OpenHand cursor
        if self._space_held:
            self.viewport().setCursor(Qt.CursorShape.OpenHandCursor)
        else:
            item = self.itemAt(curr_x, curr_y)
            if item is None:
                self.viewport().setCursor(Qt.CursorShape.ArrowCursor)

        super().mouseMoveEvent(event)

    def mouseReleaseEvent(self, event: QMouseEvent):
        if self.is_panning and (event.button() in (Qt.MouseButton.LeftButton, Qt.MouseButton.MiddleButton)):
            self.is_panning = False
            self.setDragMode(QGraphicsView.DragMode.RubberBandDrag)
            if self._space_held:
                self.viewport().setCursor(Qt.CursorShape.OpenHandCursor)
            else:
                self.viewport().setCursor(Qt.CursorShape.ArrowCursor)
            event.accept()
            return

        super().mouseReleaseEvent(event)

    def contextMenuEvent(self, event):
        item = self.itemAt(event.pos())
        if item is not None:
            # Let the clicked item (NodeItem / EdgeItem) handle its own context menu
            super().contextMenuEvent(event)
            return

        # Empty canvas right-click context menu
        menu = QMenu(self)
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

        act_add_text = menu.addAction(t("menu_add_text_node"))
        act_add_image = menu.addAction(t("menu_add_image_node"))

        scene_pos = self.mapToScene(event.pos())
        chosen = menu.exec(event.globalPos())

        if chosen == act_add_text:
            self.add_text_node_requested.emit(scene_pos)
        elif chosen == act_add_image:
            self.add_image_node_requested.emit(scene_pos)

        event.accept()

    def keyPressEvent(self, event: QKeyEvent):
        # Space key toggles pan mode
        if event.key() == Qt.Key.Key_Space and not event.isAutoRepeat():
            self._space_held = True
            self.setDragMode(QGraphicsView.DragMode.NoDrag)
            self.viewport().setCursor(Qt.CursorShape.OpenHandCursor)
            event.accept()
            return

        # Delete & Backspace keys to remove selected links or nodes
        if event.key() in (Qt.Key.Key_Delete, Qt.Key.Key_Backspace):
            if self.scene():
                self.scene().keyPressEvent(event)
                if event.isAccepted():
                    return

        super().keyPressEvent(event)

    def keyReleaseEvent(self, event: QKeyEvent):
        if event.key() == Qt.Key.Key_Space and not event.isAutoRepeat():
            self._space_held = False
            if not self.is_panning:
                self.setDragMode(QGraphicsView.DragMode.RubberBandDrag)
                self.viewport().setCursor(Qt.CursorShape.ArrowCursor)
            event.accept()
            return

        super().keyReleaseEvent(event)

    def fit_graph_to_view(self):
        """Centers nodes in the viewport with a close-up, comfortable perspective."""
        items_rect = self.scene().itemsBoundingRect()
        if not items_rect.isEmpty():
            self.fitInView(items_rect.adjusted(-100, -100, 100, 100), Qt.AspectRatioMode.KeepAspectRatio)
            current_scale = self.transform().m11()
            if current_scale < 1.1:
                factor = 1.1 / current_scale
                self.scale(factor, factor)
            self._zoom_level = self.transform().m11()

    def reset_zoom(self):
        self.resetTransform()
        self._zoom_level = 1.25
        self.scale(1.25, 1.25)
        self.centerOn(0, 0)
