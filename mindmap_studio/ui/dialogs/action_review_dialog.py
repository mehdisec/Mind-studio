"""
Action Review and Selection Dialog for Proposed AI Graph Modifications in MindMap Studio.
Allows users to selectively check/uncheck individual nodes, connections, and modifications
before committing them to the knowledge graph and Obsidian Vault.
"""

from typing import List, Tuple
from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QScrollArea, QWidget, QFrame, QCheckBox, QMessageBox
)

from mindmap_studio.services.gemini_service import AIChatAction
from mindmap_studio.config import config
from mindmap_studio.i18n import t, i18n


class ActionItemCard(QFrame):
    """Interactive card representing a single proposed AI graph modification with a checkbox."""

    def __init__(self, action: AIChatAction, is_checked: bool = True, parent=None):
        super().__init__(parent)
        self.action = action
        self.setObjectName("actionItemCard")
        self._init_ui(is_checked)

    def _init_ui(self, is_checked: bool):
        is_light = (config.get_theme() == "light")
        is_fa = (i18n.get_language() == "fa")
        dir_mode = Qt.LayoutDirection.RightToLeft if is_fa else Qt.LayoutDirection.LeftToRight
        self.setLayoutDirection(dir_mode)

        # Card theme colors based on action type
        if self.action.action_type == "add_node":
            bg_color = "#f0fdf4" if is_light else "#064e3b22"
            border_color = "#86efac" if is_light else "#059669"
            accent_color = "#16a34a" if is_light else "#4ade80"
            type_label = f"➕ {t('ai_action_add')}"
        elif self.action.action_type == "delete_node":
            bg_color = "#fef2f2" if is_light else "#450a0a22"
            border_color = "#fca5a5" if is_light else "#dc2626"
            accent_color = "#dc2626" if is_light else "#f87171"
            type_label = f"🗑️ {t('ai_action_delete')}"
        else:  # connect_nodes
            bg_color = "#f0f9ff" if is_light else "#08334422"
            border_color = "#7dd3fc" if is_light else "#0891b2"
            accent_color = "#0284c7" if is_light else "#38bdf8"
            type_label = f"🔗 {t('ai_action_connect')}"

        self.setStyleSheet(f"""
            QFrame#actionItemCard {{
                background-color: {bg_color};
                border: 1px solid {border_color};
                border-radius: 8px;
                padding: 6px;
            }}
            QFrame#actionItemCard:hover {{
                border-color: {accent_color};
            }}
        """)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 8, 10, 8)
        layout.setSpacing(6)

        # Top Header Row: Checkbox + Action Title + Badges
        header_row = QHBoxLayout()
        header_row.setSpacing(8)

        self.chk_select = QCheckBox()
        self.chk_select.setChecked(is_checked)
        self.chk_select.setCursor(Qt.CursorShape.PointingHandCursor)
        header_row.addWidget(self.chk_select)

        # Title Label
        if self.action.action_type == "add_node":
            title_text = f"[[{self.action.title}]]"
        elif self.action.action_type == "delete_node":
            title_text = f"«{self.action.title}»"
        else:
            title_text = f"[[{self.action.source_title}]] ↔ [[{self.action.target_title}]]"

        self.lbl_title = QLabel(f"<b>{type_label}:</b> {title_text}")
        self.lbl_title.setStyleSheet(f"font-size: 13px; font-weight: 600; color: {accent_color};")
        header_row.addWidget(self.lbl_title, stretch=1)

        # Importance & Tags badge if add_node
        if self.action.action_type == "add_node":
            badge_text = f"★ {self.action.importance}/10"
            lbl_importance = QLabel(badge_text)
            lbl_importance.setStyleSheet("""
                QLabel {
                    background-color: #f59e0b22;
                    color: #f59e0b;
                    border: 1px solid #f59e0b66;
                    border-radius: 10px;
                    padding: 1px 8px;
                    font-size: 11px;
                    font-weight: bold;
                }
            """)
            header_row.addWidget(lbl_importance)

        layout.addLayout(header_row)

        # Secondary Details (Connections, Tags, Content preview)
        details_layout = QVBoxLayout()
        details_layout.setContentsMargins(28, 0, 0, 0)
        details_layout.setSpacing(4)

        if self.action.action_type == "add_node":
            if self.action.connects_to:
                conn_str = ", ".join([f"[[{c}]]" for c in self.action.connects_to])
                lbl_conn = QLabel(f"🔗 <b>{t('action_review_connects_to')}:</b> {conn_str}")
                lbl_conn.setStyleSheet("font-size: 11px; color: #94a3b8;")
                details_layout.addWidget(lbl_conn)

            if self.action.tags:
                tags_str = ", ".join([f"#{t_tag}" for t_tag in self.action.tags])
                lbl_tags = QLabel(f"🏷️ <b>{t('action_review_tags')}:</b> {tags_str}")
                lbl_tags.setStyleSheet("font-size: 11px; color: #94a3b8;")
                details_layout.addWidget(lbl_tags)

            if self.action.content and self.action.content.strip():
                content_preview = self.action.content.strip()
                if len(content_preview) > 180:
                    content_preview = content_preview[:180] + "..."
                lbl_content = QLabel(content_preview)
                lbl_content.setWordWrap(True)
                lbl_content.setStyleSheet("""
                    font-size: 11px;
                    color: #cbd5e1;
                    background-color: rgba(15, 23, 42, 0.4);
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-style: italic;
                """ if not is_light else """
                    font-size: 11px;
                    color: #475569;
                    background-color: rgba(241, 245, 249, 0.8);
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-style: italic;
                """)
                details_layout.addWidget(lbl_content)

        if details_layout.count() > 0:
            layout.addLayout(details_layout)

    def is_selected(self) -> bool:
        return self.chk_select.isChecked()

    def set_selected(self, checked: bool):
        self.chk_select.setChecked(checked)


class ActionReviewDialog(QDialog):
    """
    Checklist dialog for reviewing and selecting specific AI-proposed graph actions.
    Ensures the user has fine-grained control over which nodes and links get added.
    """

    def __init__(self, actions: List[AIChatAction], parent=None):
        super().__init__(parent)
        self.actions = actions
        self._card_items: List[ActionItemCard] = []

        is_fa = (i18n.get_language() == "fa")
        dir_mode = Qt.LayoutDirection.RightToLeft if is_fa else Qt.LayoutDirection.LeftToRight
        self.setLayoutDirection(dir_mode)
        self.setWindowTitle(t("action_review_title"))
        self.resize(640, 520)
        self.setMinimumSize(500, 380)

        self._init_ui()
        self._update_counter()

    def _init_ui(self):
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(18, 18, 18, 18)
        main_layout.setSpacing(12)

        # 1. Header: Title & Subtitle
        header_vbox = QVBoxLayout()
        header_vbox.setSpacing(4)

        lbl_title = QLabel(t("action_review_title"))
        lbl_title.setStyleSheet("font-size: 16px; font-weight: bold; color: #38bdf8;")
        header_vbox.addWidget(lbl_title)

        lbl_subtitle = QLabel(t("action_review_subtitle"))
        lbl_subtitle.setStyleSheet("font-size: 12px; color: #94a3b8;")
        lbl_subtitle.setWordWrap(True)
        header_vbox.addWidget(lbl_subtitle)

        main_layout.addLayout(header_vbox)

        # 2. Selection Toolbar: Select All / Deselect All / Counter Badge
        sel_bar = QHBoxLayout()
        sel_bar.setSpacing(8)

        self.btn_select_all = QPushButton(t("action_review_select_all"))
        self.btn_select_all.setFixedHeight(28)
        self.btn_select_all.clicked.connect(self._select_all)
        self._style_tool_btn(self.btn_select_all)
        sel_bar.addWidget(self.btn_select_all)

        self.btn_deselect_all = QPushButton(t("action_review_deselect_all"))
        self.btn_deselect_all.setFixedHeight(28)
        self.btn_deselect_all.clicked.connect(self._deselect_all)
        self._style_tool_btn(self.btn_deselect_all)
        sel_bar.addWidget(self.btn_deselect_all)

        sel_bar.addStretch()

        self.lbl_counter = QLabel()
        self.lbl_counter.setStyleSheet("""
            QLabel {
                background-color: #0f172a;
                color: #38bdf8;
                border: 1px solid #1e293b;
                border-radius: 12px;
                padding: 3px 12px;
                font-size: 11px;
                font-weight: bold;
            }
        """)
        sel_bar.addWidget(self.lbl_counter)

        main_layout.addLayout(sel_bar)

        # 3. Scrollable List of Action Cards
        scroll_area = QScrollArea(self)
        scroll_area.setWidgetResizable(True)
        scroll_area.setFrameShape(QFrame.Shape.NoFrame)
        scroll_area.setStyleSheet("""
            QScrollArea {
                background: transparent;
                border: 1px solid #1e293b;
                border-radius: 8px;
            }
        """)

        container = QWidget()
        container_layout = QVBoxLayout(container)
        container_layout.setContentsMargins(8, 8, 8, 8)
        container_layout.setSpacing(8)

        for act in self.actions:
            card = ActionItemCard(act, is_checked=True, parent=container)
            card.chk_select.toggled.connect(self._update_counter)
            self._card_items.append(card)
            container_layout.addWidget(card)

        container_layout.addStretch()
        scroll_area.setWidget(container)
        main_layout.addWidget(scroll_area, stretch=1)

        # 4. Action Buttons (Apply / Cancel)
        btn_bar = QHBoxLayout()
        btn_bar.setSpacing(10)

        self.btn_cancel = QPushButton(t("action_review_btn_cancel"))
        self.btn_cancel.setFixedHeight(36)
        self.btn_cancel.setFixedWidth(100)
        self.btn_cancel.setStyleSheet("""
            QPushButton {
                background-color: #1e293b;
                color: #94a3b8;
                border: 1px solid #334155;
                border-radius: 6px;
                font-size: 12px;
            }
            QPushButton:hover {
                background-color: #334155;
                color: #f8fafc;
            }
        """)
        self.btn_cancel.clicked.connect(self.reject)
        btn_bar.addWidget(self.btn_cancel)

        btn_bar.addStretch()

        self.btn_apply = QPushButton(t("action_review_btn_apply"))
        self.btn_apply.setFixedHeight(36)
        self.btn_apply.setStyleSheet("""
            QPushButton {
                background-color: #0284c7;
                color: white;
                font-weight: bold;
                border-radius: 6px;
                padding: 0 18px;
                font-size: 13px;
            }
            QPushButton:hover {
                background-color: #0369a1;
            }
        """)
        self.btn_apply.clicked.connect(self._on_apply_clicked)
        btn_bar.addWidget(self.btn_apply)

        main_layout.addLayout(btn_bar)

    def _style_tool_btn(self, btn: QPushButton):
        btn.setStyleSheet("""
            QPushButton {
                background-color: #1e293b;
                color: #cbd5e1;
                border: 1px solid #334155;
                border-radius: 6px;
                padding: 2px 10px;
                font-size: 11px;
            }
            QPushButton:hover {
                background-color: #334155;
                color: #38bdf8;
                border-color: #38bdf8;
            }
        """)

    def _select_all(self):
        for c in self._card_items:
            c.set_selected(True)
        self._update_counter()

    def _deselect_all(self):
        for c in self._card_items:
            c.set_selected(False)
        self._update_counter()

    def _update_counter(self):
        total = len(self._card_items)
        selected = sum(1 for c in self._card_items if c.is_selected())
        self.lbl_counter.setText(t("action_review_selected_count", selected=selected, total=total))

    def _on_apply_clicked(self):
        selected_count = sum(1 for c in self._card_items if c.is_selected())
        if selected_count == 0:
            res = QMessageBox.question(
                self,
                t("action_review_title"),
                t("action_review_no_selection_warn"),
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
                QMessageBox.StandardButton.Yes
            )
            if res == QMessageBox.StandardButton.Yes:
                self.reject()
            return
        self.accept()

    def get_selected_actions(self) -> List[AIChatAction]:
        """Returns the list of actions that have their checkboxes checked."""
        return [c.action for c in self._card_items if c.is_selected()]
