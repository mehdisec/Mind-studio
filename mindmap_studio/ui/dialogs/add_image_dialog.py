"""
Dedicated Dialog for Adding an Image Node with 3 selectable sizes.
- Small (1x — Base size, 3x standard node)
- Medium (2x — 6x standard node)
- Large (3x — Maximum size, 9x standard node / 3x current size)
"""

from pathlib import Path
from typing import Tuple

from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QRadioButton, QButtonGroup, QFrame,
    QSlider, QGroupBox
)
from PyQt6.QtGui import QPixmap, QPainter, QPainterPath, QColor, QPen, QBrush

from mindmap_studio.i18n import t, i18n
from mindmap_studio.ui.styles import DARK_THEME_QSS


class CircularPreviewWidget(QFrame):
    """Draws a live circular preview of the selected image scaled to the chosen size."""
    
    def __init__(self, image_path: str, parent=None):
        super().__init__(parent)
        self.setFixedSize(140, 140)
        self.image_path = image_path
        self._pixmap = QPixmap(image_path) if Path(image_path).exists() else QPixmap()
        self.size_scale = 1.0  # 1.0 = small, 2.0 = medium, 3.0 = large for visual preview

    def set_size_scale(self, scale: float):
        self.size_scale = scale
        self.update()

    def paintEvent(self, event):
        super().paintEvent(event)
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        painter.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform)

        # Background canvas of preview
        painter.fillRect(self.rect(), QColor("#090d16"))

        center_x = self.width() / 2.0
        center_y = self.height() / 2.0

        if self.size_scale == 3.0:
            preview_r = 60.0
        elif self.size_scale == 2.0:
            preview_r = 44.0
        else:
            preview_r = 26.0

        # Draw glow aura
        glow_grad = QColor(56, 189, 248, 60)
        painter.setBrush(QBrush(glow_grad))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(int(center_x - preview_r - 6), int(center_y - preview_r - 6),
                            int((preview_r + 6) * 2), int((preview_r + 6) * 2))

        # Circular clip image
        if not self._pixmap.isNull():
            clip_path = QPainterPath()
            clip_path.addEllipse(center_x - preview_r, center_y - preview_r, preview_r * 2, preview_r * 2)
            painter.save()
            painter.setClipPath(clip_path)

            scaled_pix = self._pixmap.scaled(
                int(preview_r * 2), int(preview_r * 2),
                Qt.AspectRatioMode.KeepAspectRatioByExpanding,
                Qt.TransformationMode.SmoothTransformation
            )
            pw = scaled_pix.width()
            ph = scaled_pix.height()
            painter.drawPixmap(int(center_x - pw / 2), int(center_y - ph / 2), scaled_pix)
            painter.restore()

        # Circular border
        painter.setPen(QPen(QColor("#38bdf8"), 2.0))
        painter.setBrush(Qt.BrushStyle.NoBrush)
        painter.drawEllipse(int(center_x - preview_r), int(center_y - preview_r), int(preview_r * 2), int(preview_r * 2))


class AddImageNodeDialog(QDialog):
    """Sleek modal dialog for configuring a new image node with 3 selectable sizes."""

    def __init__(self, image_path: str, initial_importance: int = 5, parent=None):
        super().__init__(parent)
        self.image_path = image_path
        self.selected_size = "small"
        self.importance = initial_importance

        self.setWindowTitle(t("dialog_image_node_title_window"))
        self.resize(500, 480)
        self.setMinimumSize(440, 420)
        self.setStyleSheet(DARK_THEME_QSS)

        self._init_ui()

    def _init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 18, 20, 18)
        layout.setSpacing(14)

        # RTL/LTR setup
        is_fa = (i18n.get_language() == "fa")
        dir_mode = Qt.LayoutDirection.RightToLeft if is_fa else Qt.LayoutDirection.LeftToRight
        align_mode = Qt.AlignmentFlag.AlignRight if is_fa else Qt.AlignmentFlag.AlignLeft
        self.setLayoutDirection(dir_mode)

        # 1. Preview & Basic Info Row
        top_row = QHBoxLayout()
        top_row.setSpacing(16)

        # Circular Live Preview
        self.preview_widget = CircularPreviewWidget(self.image_path, self)
        top_row.addWidget(self.preview_widget)

        # File & Title details
        info_layout = QVBoxLayout()
        info_layout.setSpacing(8)

        lbl_file = QLabel(f"📁 {Path(self.image_path).name}")
        lbl_file.setStyleSheet("color: #94a3b8; font-size: 11px;")
        lbl_file.setWordWrap(True)
        info_layout.addWidget(lbl_file)

        lbl_title_prompt = QLabel(t("dialog_image_node_title_prompt"))
        lbl_title_prompt.setStyleSheet("font-weight: bold; color: #f8fafc; font-size: 12px;")
        info_layout.addWidget(lbl_title_prompt)

        default_title = Path(self.image_path).stem
        self.edit_title = QLineEdit(default_title)
        self.edit_title.setFixedHeight(34)
        self.edit_title.setStyleSheet("""
            QLineEdit {
                background-color: #090d16;
                border: 1px solid #334155;
                border-radius: 6px;
                padding: 4px 10px;
                color: #f8fafc;
                font-weight: 600;
                font-size: 13px;
            }
            QLineEdit:focus {
                border-color: #38bdf8;
            }
        """)
        self.edit_title.selectAll()
        info_layout.addWidget(self.edit_title)

        top_row.addLayout(info_layout)
        layout.addLayout(top_row)

        # 2. Size Selection Group (3 Selectable Sizes)
        size_group = QGroupBox(t("dialog_image_size_label"))
        size_group.setStyleSheet("""
            QGroupBox {
                background-color: #090d16;
                border: 1px solid #1e293b;
                border-radius: 8px;
                margin-top: 10px;
                padding-top: 14px;
                font-weight: bold;
                color: #38bdf8;
            }
        """)
        size_layout = QVBoxLayout(size_group)
        size_layout.setSpacing(10)

        self.btn_group = QButtonGroup(self)

        # Small (1x - Base)
        self.rb_small = QRadioButton(t("image_size_small"))
        self.rb_small.setStyleSheet("color: #f8fafc; font-size: 12px;")
        self.rb_small.setChecked(True)
        self.btn_group.addButton(self.rb_small, 1)
        size_layout.addWidget(self.rb_small)

        # Medium (2x)
        self.rb_medium = QRadioButton(t("image_size_medium"))
        self.rb_medium.setStyleSheet("color: #f8fafc; font-size: 12px;")
        self.btn_group.addButton(self.rb_medium, 2)
        size_layout.addWidget(self.rb_medium)

        # Large (3x - Maximum)
        self.rb_large = QRadioButton(t("image_size_large"))
        self.rb_large.setStyleSheet("color: #f8fafc; font-size: 12px;")
        self.btn_group.addButton(self.rb_large, 3)
        size_layout.addWidget(self.rb_large)

        self.btn_group.idClicked.connect(self._on_size_changed)
        layout.addWidget(size_group)

        # 3. Importance Slider
        imp_row = QHBoxLayout()
        lbl_imp_title = QLabel(t("top_importance_lbl"))
        lbl_imp_title.setStyleSheet("color: #cbd5e1; font-weight: 600;")
        imp_row.addWidget(lbl_imp_title)

        self.slider_importance = QSlider(Qt.Orientation.Horizontal)
        self.slider_importance.setRange(1, 10)
        self.slider_importance.setValue(self.importance)
        self.slider_importance.valueChanged.connect(self._on_importance_slider_changed)
        imp_row.addWidget(self.slider_importance)

        self.lbl_imp_val = QLabel(f"★{self.importance}")
        self.lbl_imp_val.setStyleSheet("font-weight: bold; color: #f59e0b; font-size: 12px; width: 30px;")
        imp_row.addWidget(self.lbl_imp_val)

        layout.addLayout(imp_row)

        layout.addStretch()

        # 4. Action Buttons
        btn_layout = QHBoxLayout()
        btn_layout.setSpacing(10)

        self.btn_cancel = QPushButton(t("editor_btn_cancel"))
        self.btn_cancel.setFixedHeight(34)
        self.btn_cancel.clicked.connect(self.reject)
        btn_layout.addWidget(self.btn_cancel)

        self.btn_add = QPushButton(t("dialog_add_image_btn"))
        self.btn_add.setObjectName("primaryBtn")
        self.btn_add.setFixedHeight(34)
        self.btn_add.setStyleSheet("""
            QPushButton#primaryBtn {
                background-color: #0284c7;
                color: white;
                font-weight: bold;
                border-radius: 6px;
                padding: 6px 18px;
                font-size: 12px;
            }
            QPushButton#primaryBtn:hover {
                background-color: #0369a1;
            }
        """)
        self.btn_add.clicked.connect(self.accept)
        btn_layout.addWidget(self.btn_add)

        layout.addLayout(btn_layout)

    def _on_size_changed(self, btn_id: int):
        if btn_id == 3:
            self.selected_size = "large"
            self.preview_widget.set_size_scale(3.0)
        elif btn_id == 2:
            self.selected_size = "medium"
            self.preview_widget.set_size_scale(2.0)
        else:
            self.selected_size = "small"
            self.preview_widget.set_size_scale(1.0)

    def _on_importance_slider_changed(self, val: int):
        self.importance = val
        self.lbl_imp_val.setText(f"★{val}")

    def get_data(self) -> Tuple[str, str, int]:
        """Returns (title, image_size, importance)."""
        title = self.edit_title.text().strip() or Path(self.image_path).stem
        return title, self.selected_size, self.importance
