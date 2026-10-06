"""
Markdown Note Editor Dialog for Nodes in MindMap Studio.
Supports YAML frontmatter editing, tags, importance rating, and instant vault synchronization.
Fully bilingual (Persian & English).
"""

from pathlib import Path
from datetime import datetime
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QTextEdit, QPushButton, QSlider, QGroupBox, QSplitter,
    QFrame, QMessageBox, QFileDialog, QRadioButton, QButtonGroup
)
from PyQt6.QtGui import QFont, QKeySequence, QShortcut, QPixmap, QPainter, QPainterPath, QColor, QPen, QBrush

from mindmap_studio.models.graph_models import NodeData
from mindmap_studio.config import get_node_style_for_importance
from mindmap_studio.i18n import t


class CircularPreviewWidget(QFrame):
    """Draws a live circular preview of the selected image scaled to the chosen size."""
    
    def __init__(self, image_path: str = "", parent=None):
        super().__init__(parent)
        self.setFixedSize(90, 90)
        self.image_path = image_path
        self._pixmap = QPixmap(image_path) if (image_path and Path(image_path).exists()) else QPixmap()
        self.size_scale = 1.0

    def set_image(self, image_path: str):
        self.image_path = image_path
        if image_path:
            p = Path(image_path)
            candidates = [p, Path.cwd() / p, Path(__file__).resolve().parents[4] / p]
            found = None
            for c in candidates:
                if c.is_file():
                    found = c
                    break
            self._pixmap = QPixmap(str(found)) if found else QPixmap(image_path)
        else:
            self._pixmap = QPixmap()
        self.update()

    def set_size_scale(self, scale: float):
        self.size_scale = scale
        self.update()

    def paintEvent(self, event):
        super().paintEvent(event)
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        painter.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform)

        painter.fillRect(self.rect(), QColor("#090d16"))

        center_x = self.width() / 2.0
        center_y = self.height() / 2.0
        preview_r = 36.0

        if not self._pixmap.isNull():
            glow_grad = QColor(56, 189, 248, 70)
            painter.setBrush(QBrush(glow_grad))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(int(center_x - preview_r - 4), int(center_y - preview_r - 4),
                                int((preview_r + 4) * 2), int((preview_r + 4) * 2))

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

            painter.setPen(QPen(QColor("#38bdf8"), 2.0))
            painter.setBrush(Qt.BrushStyle.NoBrush)
            painter.drawEllipse(int(center_x - preview_r), int(center_y - preview_r), int(preview_r * 2), int(preview_r * 2))
        else:
            painter.setPen(QPen(QColor("#475569"), 1.5, Qt.PenStyle.DashLine))
            painter.setBrush(QBrush(QColor("#1e293b")))
            painter.drawEllipse(int(center_x - preview_r), int(center_y - preview_r), int(preview_r * 2), int(preview_r * 2))
            painter.setPen(QColor("#94a3b8"))
            painter.setFont(QFont("Segoe UI", 9))
            painter.drawText(self.rect(), Qt.AlignmentFlag.AlignCenter, "No Img")


class NoteEditorDialog(QDialog):
    """Clean, focused Markdown note editor for a specific conceptual node with complete Image Node support."""
    saved = pyqtSignal(NodeData)
    trigger_deep_dive = pyqtSignal(str)
    trigger_socratic_questions = pyqtSignal(str)

    def __init__(self, node_data: NodeData, parent=None):
        super().__init__(parent)
        self.node_data = node_data
        self.node_type = getattr(node_data, "node_type", "text")
        self.image_path = getattr(node_data, "image_path", "")
        self.image_size = getattr(node_data, "image_size", "small") or "small"

        self.setWindowTitle(t("editor_dialog_title", title=node_data.title))
        self.resize(960, 720)
        self.setMinimumSize(850, 560)
        
        self._init_ui()
        self._populate_fields()
        
        # Shortcut Ctrl+S inside dialog
        save_shortcut = QShortcut(QKeySequence("Ctrl+S"), self)
        save_shortcut.activated.connect(self._on_save_clicked)

    def _init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(18, 18, 18, 18)
        layout.setSpacing(12)

        # 1. Header with Title & Importance
        self.header_group = QGroupBox(t("editor_group_props"))
        h_layout = QVBoxLayout(self.header_group)
        h_layout.setSpacing(10)

        # Title Field
        row_title = QHBoxLayout()
        self.lbl_title = QLabel(t("editor_lbl_topic"))
        self.lbl_title.setFixedWidth(70)
        self.lbl_title.setStyleSheet("font-weight: bold; color: #38bdf8;")
        self.edit_title = QLineEdit()
        self.edit_title.setPlaceholderText(t("editor_placeholder_topic"))
        self.edit_title.setStyleSheet("font-size: 14px; font-weight: bold;")
        row_title.addWidget(self.lbl_title)
        row_title.addWidget(self.edit_title)
        h_layout.addLayout(row_title)

        # Importance Slider & Rating
        row_imp = QHBoxLayout()
        self.lbl_imp = QLabel(t("editor_lbl_importance"))
        self.lbl_imp.setFixedWidth(70)
        self.lbl_imp.setStyleSheet("font-weight: bold; color: #f59e0b;")
        
        self.slider_importance = QSlider(Qt.Orientation.Horizontal)
        self.slider_importance.setRange(1, 10)
        self.slider_importance.setValue(5)
        self.slider_importance.setTickPosition(QSlider.TickPosition.TicksBelow)
        self.slider_importance.setTickInterval(1)
        self.slider_importance.valueChanged.connect(self._on_importance_changed)

        self.lbl_imp_val = QLabel("★ 5 / 10")
        self.lbl_imp_val.setFixedWidth(70)
        self.lbl_imp_val.setStyleSheet("font-weight: bold; color: #f59e0b; font-size: 13px;")

        row_imp.addWidget(self.lbl_imp)
        row_imp.addWidget(self.slider_importance)
        row_imp.addWidget(self.lbl_imp_val)
        h_layout.addLayout(row_imp)

        # Tags Field
        row_tags = QHBoxLayout()
        self.lbl_tags = QLabel(t("editor_lbl_tags"))
        self.lbl_tags.setFixedWidth(70)
        self.lbl_tags.setStyleSheet("color: #94a3b8;")
        self.edit_tags = QLineEdit()
        self.edit_tags.setPlaceholderText(t("editor_placeholder_tags"))
        row_tags.addWidget(self.lbl_tags)
        row_tags.addWidget(self.edit_tags)
        h_layout.addLayout(row_tags)

        layout.addWidget(self.header_group)

        # 2. Image Node Properties Section
        self.image_group = QGroupBox(t("editor_group_image"))
        img_main_layout = QHBoxLayout(self.image_group)
        img_main_layout.setContentsMargins(10, 10, 10, 10)
        img_main_layout.setSpacing(12)

        self.img_preview = CircularPreviewWidget(self.image_path)
        img_main_layout.addWidget(self.img_preview)

        img_controls_layout = QVBoxLayout()
        img_controls_layout.setSpacing(8)

        self.lbl_img_path = QLabel()
        self.lbl_img_path.setStyleSheet("color: #94a3b8; font-size: 11px;")
        self.lbl_img_path.setWordWrap(True)
        img_controls_layout.addWidget(self.lbl_img_path)

        # Size selector
        size_row = QHBoxLayout()
        self.lbl_size_tag = QLabel(t("editor_lbl_image_size"))
        self.lbl_size_tag.setStyleSheet("color: #cbd5e1; font-size: 12px; font-weight: bold;")
        size_row.addWidget(self.lbl_size_tag)

        self.size_btn_group = QButtonGroup(self)
        self.rb_small = QRadioButton(t("editor_size_small"))
        self.rb_med = QRadioButton(t("editor_size_medium"))
        self.rb_large = QRadioButton(t("editor_size_large"))

        self.size_btn_group.addButton(self.rb_small, 1)
        self.size_btn_group.addButton(self.rb_med, 2)
        self.size_btn_group.addButton(self.rb_large, 3)

        self.rb_small.toggled.connect(lambda: self._on_size_toggled("small", 1.0))
        self.rb_med.toggled.connect(lambda: self._on_size_toggled("medium", 2.0))
        self.rb_large.toggled.connect(lambda: self._on_size_toggled("large", 3.0))

        size_row.addWidget(self.rb_small)
        size_row.addWidget(self.rb_med)
        size_row.addWidget(self.rb_large)
        size_row.addStretch()
        img_controls_layout.addLayout(size_row)

        # Action Buttons
        img_btn_row = QHBoxLayout()
        self.btn_change_image = QPushButton(t("editor_btn_change_image"))
        self.btn_change_image.clicked.connect(self._on_choose_new_image)
        img_btn_row.addWidget(self.btn_change_image)

        self.btn_remove_image = QPushButton(t("editor_btn_remove_image"))
        self.btn_remove_image.setStyleSheet("color: #f87171; border: 1px solid #7f1d1d;")
        self.btn_remove_image.clicked.connect(self._on_remove_image)
        img_btn_row.addWidget(self.btn_remove_image)
        img_btn_row.addStretch()

        img_controls_layout.addLayout(img_btn_row)
        img_main_layout.addLayout(img_controls_layout)

        layout.addWidget(self.image_group)

        # 3. Markdown Note Content Editor
        self.editor_group = QGroupBox(t("editor_group_content"))
        e_layout = QVBoxLayout(self.editor_group)
        
        # Note formatting / media toolbar
        ed_toolbar = QHBoxLayout()
        self.btn_insert_image = QPushButton(t("editor_btn_insert_image"))
        self.btn_insert_image.setStyleSheet("""
            QPushButton {
                background-color: #1e293b;
                color: #38bdf8;
                border: 1px solid #334155;
                border-radius: 6px;
                padding: 4px 12px;
                font-size: 11px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #334155;
                color: #ffffff;
                border-color: #38bdf8;
            }
        """)
        self.btn_insert_image.clicked.connect(self._on_insert_image_to_content)
        ed_toolbar.addWidget(self.btn_insert_image)
        ed_toolbar.addStretch()
        e_layout.addLayout(ed_toolbar)

        self.txt_content = QTextEdit()
        self.txt_content.setFont(QFont("Consolas", 11))
        self.txt_content.setPlaceholderText(t("editor_placeholder_content"))
        self.txt_content.textChanged.connect(self._update_stats)
        e_layout.addWidget(self.txt_content)

        # Set Text Direction & Alignment based on language
        from mindmap_studio.i18n import i18n
        is_fa = (i18n.get_language() == "fa")
        dir_mode = Qt.LayoutDirection.RightToLeft if is_fa else Qt.LayoutDirection.LeftToRight
        align_mode = Qt.AlignmentFlag.AlignRight if is_fa else Qt.AlignmentFlag.AlignLeft

        self.edit_title.setLayoutDirection(dir_mode)
        self.edit_title.setAlignment(align_mode | Qt.AlignmentFlag.AlignVCenter)
        self.edit_tags.setLayoutDirection(dir_mode)
        self.edit_tags.setAlignment(align_mode | Qt.AlignmentFlag.AlignVCenter)

        self.txt_content.setLayoutDirection(dir_mode)
        opt = self.txt_content.document().defaultTextOption()
        opt.setTextDirection(dir_mode)
        opt.setAlignment(align_mode | Qt.AlignmentFlag.AlignAbsolute)
        self.txt_content.document().setDefaultTextOption(opt)

        # Bottom stats
        self.lbl_stats = QLabel("0 words | 0 characters")
        self.lbl_stats.setStyleSheet("color: #64748b; font-size: 11px;")
        self.lbl_stats.setAlignment(align_mode | Qt.AlignmentFlag.AlignVCenter)
        e_layout.addWidget(self.lbl_stats)

        layout.addWidget(self.editor_group)

        # 4. Footer Action Buttons
        footer_layout = QHBoxLayout()
        
        self.btn_deep_dive = QPushButton(t("editor_btn_deep_dive"))
        self.btn_deep_dive.setObjectName("aiBtn")
        self.btn_deep_dive.clicked.connect(self._on_ai_clicked)
        footer_layout.addWidget(self.btn_deep_dive)

        self.btn_socratic = QPushButton(t("editor_btn_socratic"))
        self.btn_socratic.setStyleSheet("""
            QPushButton {
                background-color: #581c87;
                color: #f3e8ff;
                font-weight: bold;
                border: 1px solid #9333ea;
                border-radius: 5px;
                padding: 4px 10px;
                font-size: 11px;
            }
            QPushButton:hover {
                background-color: #7e22ce;
                color: #ffffff;
            }
        """)
        self.btn_socratic.clicked.connect(self._on_socratic_clicked)
        footer_layout.addWidget(self.btn_socratic)

        footer_layout.addStretch()

        self.btn_cancel = QPushButton(t("editor_btn_cancel"))
        self.btn_cancel.clicked.connect(self.reject)
        footer_layout.addWidget(self.btn_cancel)

        self.btn_save = QPushButton(t("editor_btn_save"))
        self.btn_save.setObjectName("primaryBtn")
        self.btn_save.clicked.connect(self._on_save_clicked)
        footer_layout.addWidget(self.btn_save)

        layout.addLayout(footer_layout)

    def _populate_fields(self):
        self.edit_title.setText(self.node_data.title)
        self.slider_importance.setValue(self.node_data.importance)
        self.lbl_imp_val.setText(f"★ {self.node_data.importance} / 10")
        self.edit_tags.setText(", ".join(self.node_data.tags))
        self.txt_content.setPlainText(self.node_data.content)
        self._update_stats()
        self._update_image_ui()

    def _update_image_ui(self):
        if self.node_type == "image" and self.image_path:
            self.image_group.show()
            self.lbl_img_path.setText(f"📁 {self.image_path}")
            self.img_preview.set_image(self.image_path)
            if self.image_size == "large":
                self.rb_large.setChecked(True)
                self.img_preview.set_size_scale(3.0)
            elif self.image_size == "medium":
                self.rb_med.setChecked(True)
                self.img_preview.set_size_scale(2.0)
            else:
                self.rb_small.setChecked(True)
                self.img_preview.set_size_scale(1.0)
            self.btn_change_image.setText(t("editor_btn_change_image"))
            self.btn_remove_image.show()
        else:
            # Text node, but allow attaching image
            self.image_group.show()
            self.lbl_img_path.setText("📝 Text Node (No image attached)")
            self.img_preview.set_image("")
            self.rb_small.setChecked(True)
            self.btn_change_image.setText(t("editor_btn_attach_image"))
            self.btn_remove_image.hide()

    def _on_choose_new_image(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            t("dialog_select_image_title"),
            "",
            t("dialog_image_files_filter")
        )
        if file_path:
            self.image_path = file_path
            self.node_type = "image"
            self._update_image_ui()

    def _on_insert_image_to_content(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            t("choose_image"),
            "",
            t("image_filter")
        )
        if file_path:
            clean_path = file_path.replace("\\", "/")
            alt_text = Path(file_path).stem
            md_image = f"\n![{alt_text}]({clean_path})\n"
            cursor = self.txt_content.textCursor()
            cursor.insertText(md_image)
            self.txt_content.setTextCursor(cursor)
            self.txt_content.setFocus()

    def _on_remove_image(self):
        self.image_path = ""
        self.node_type = "text"
        self._update_image_ui()

    def _on_size_toggled(self, size_name: str, scale: float):
        self.image_size = size_name
        self.img_preview.set_size_scale(scale)

    def _on_importance_changed(self, val: int):
        self.lbl_imp_val.setText(f"★ {val} / 10")

    def _update_stats(self):
        text = self.txt_content.toPlainText()
        words = len(text.split()) if text.strip() else 0
        chars = len(text)
        self.lbl_stats.setText(t("editor_stats_template", words=words, chars=chars, id=self.node_data.id))

    def _on_save_clicked(self):
        title = self.edit_title.text().strip()
        if not title:
            QMessageBox.warning(self, t("editor_invalid_title_title"), t("editor_invalid_title_body"))
            return

        # Update node data
        self.node_data.title = title
        self.node_data.importance = self.slider_importance.value()
        self.node_data.content = self.txt_content.toPlainText().strip()
        
        # Preserve & update image node properties
        self.node_data.node_type = self.node_type
        self.node_data.image_path = self.image_path
        self.node_data.image_size = self.image_size
        
        tag_str = self.edit_tags.text().strip()
        tags_list = [t_tag.strip() for t_tag in tag_str.split(",") if t_tag.strip()]
        if self.node_type == "image" and "image" not in tags_list:
            tags_list.append("image")
        elif self.node_type != "image" and "image" in tags_list:
            tags_list.remove("image")

        self.node_data.tags = tags_list
        self.node_data.update_timestamp()

        self.saved.emit(self.node_data)
        self.accept()

    def _on_ai_clicked(self):
        # Save current edits first
        self.node_data.title = self.edit_title.text().strip() or self.node_data.title
        self.node_data.importance = self.slider_importance.value()
        self.node_data.content = self.txt_content.toPlainText().strip()
        self.node_data.node_type = self.node_type
        self.node_data.image_path = self.image_path
        self.node_data.image_size = self.image_size
        self.saved.emit(self.node_data)
        
        self.trigger_deep_dive.emit(self.node_data.id)
        self.accept()

    def _on_socratic_clicked(self):
        # Save current edits first
        self.node_data.title = self.edit_title.text().strip() or self.node_data.title
        self.node_data.importance = self.slider_importance.value()
        self.node_data.content = self.txt_content.toPlainText().strip()
        self.node_data.node_type = self.node_type
        self.node_data.image_path = self.image_path
        self.node_data.image_size = self.image_size
        self.saved.emit(self.node_data)

        self.trigger_socratic_questions.emit(self.node_data.id)
        self.accept()

