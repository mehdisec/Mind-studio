"""
Interactive Physics-Driven AI Deep-Dive Studio for MindMap Studio.
Features Force-Directed physics, dynamic draggable nodes, interactive editing, and Socratic questioning.
Fully bilingual (Persian & English).
"""

import math
from typing import List, Optional, Dict
from PyQt6.QtCore import Qt, QTimer, pyqtSignal
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QSplitter, QFrame, QTextEdit, QMessageBox, QTabWidget,
    QScrollArea, QApplication
)
from PyQt6.QtGui import QFont, QColor

from mindmap_studio.models.graph_models import AIInsight, NodeData, GraphState
from mindmap_studio.ui.graph.graph_scene import GraphScene
from mindmap_studio.ui.graph.graph_view import GraphView
from mindmap_studio.ui.dialogs.note_editor import NoteEditorDialog
from mindmap_studio.i18n import t, i18n


class RadialGraphView(QWidget):
    """
    Interactive Physics-Driven AI Deep-Dive Studio Canvas.
    Fully interactive with draggable nodes, force-directed physics, editing, deletion, merging,
    and a dedicated Socratic Questions explorer for deeper dialectic inquiry.
    """
    merge_insights_requested = pyqtSignal(str, list)  # central_topic, List[NodeData]
    save_to_note_requested = pyqtSignal(str, list, list)  # central_topic, List[NodeData], List[str]

    def __init__(self, parent=None):
        super().__init__(parent)
        self.current_topic = ""
        self.central_node_id: Optional[str] = None
        self.ai_graph_state = GraphState()
        self.selected_node_id: Optional[str] = None
        self.socratic_questions: List[str] = []
        
        self._init_ui()
        self.retranslate_ui()
        i18n.language_changed.connect(lambda _: self.retranslate_ui())

    def _init_ui(self):
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(8, 8, 8, 8)
        main_layout.setSpacing(6)

        # 1. Header Toolbar
        header_bar = QFrame()
        header_bar.setObjectName("radialHeaderBar")
        header_layout = QHBoxLayout(header_bar)
        header_layout.setContentsMargins(8, 4, 8, 4)
        header_layout.setSpacing(10)

        self.title_label = QLabel()
        self.title_label.setStyleSheet("font-size: 14px; font-weight: bold; color: #38bdf8;")
        header_layout.addWidget(self.title_label)

        header_layout.addStretch()

        self.btn_fit = QPushButton()
        self.btn_fit.clicked.connect(self._fit_view)
        header_layout.addWidget(self.btn_fit)

        self.btn_reset = QPushButton()
        self.btn_reset.clicked.connect(self._reset_view)
        header_layout.addWidget(self.btn_reset)

        self.btn_physics = QPushButton()
        self.btn_physics.clicked.connect(self._toggle_physics)
        header_layout.addWidget(self.btn_physics)

        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.VLine)
        sep.setObjectName("divider")
        header_layout.addWidget(sep)

        self.btn_merge = QPushButton()
        self.btn_merge.setObjectName("primaryBtn")
        self.btn_merge.clicked.connect(self._on_merge_clicked)
        header_layout.addWidget(self.btn_merge)

        self.btn_export = QPushButton()
        self.btn_export.clicked.connect(self._on_export_clicked)
        header_layout.addWidget(self.btn_export)

        main_layout.addWidget(header_bar)

        # 2. Main Canvas & Inspector Splitter
        splitter = QSplitter(Qt.Orientation.Horizontal)
        splitter.setLayoutDirection(Qt.LayoutDirection.LeftToRight)

        # Physics-Driven Canvas
        self.scene = GraphScene(self)
        self.scene.node_selected.connect(self._on_node_selected)
        self.scene.edit_note_requested.connect(self._open_note_editor)
        self.scene.delete_node_requested.connect(self._delete_node)
        self.scene.connect_nodes_requested.connect(self._connect_nodes)

        self.view = GraphView(self.scene)
        splitter.addWidget(self.view)

        # Right Inspector & Socratic Tabs
        panel = QFrame()
        panel.setObjectName("radialSidePanel")
        panel.setMinimumWidth(280)
        panel.setMaximumWidth(400)
        
        panel_layout = QVBoxLayout(panel)
        panel_layout.setContentsMargins(6, 6, 6, 6)
        panel_layout.setSpacing(6)

        self.side_tabs = QTabWidget()

        # Tab 1: Node Inspector
        self.tab_inspector = QWidget()
        insp_layout = QVBoxLayout(self.tab_inspector)
        insp_layout.setContentsMargins(6, 6, 6, 6)
        insp_layout.setSpacing(8)

        self.lbl_node_title = QLabel()
        self.lbl_node_title.setWordWrap(True)
        self.lbl_node_title.setStyleSheet("font-weight: bold; font-size: 13px;")
        insp_layout.addWidget(self.lbl_node_title)

        self.lbl_node_meta = QLabel("")
        self.lbl_node_meta.setStyleSheet("color: #38bdf8; font-size: 11px;")
        insp_layout.addWidget(self.lbl_node_meta)

        self.txt_description = QTextEdit()
        self.txt_description.setReadOnly(True)
        insp_layout.addWidget(self.txt_description)

        # Inspector Action Buttons
        btn_box = QHBoxLayout()
        self.btn_insp_edit = QPushButton()
        self.btn_insp_edit.clicked.connect(self._edit_selected_node)
        self.btn_insp_edit.setEnabled(False)
        btn_box.addWidget(self.btn_insp_edit)

        self.btn_insp_delete = QPushButton()
        self.btn_insp_delete.clicked.connect(self._delete_selected_node)
        self.btn_insp_delete.setEnabled(False)
        btn_box.addWidget(self.btn_insp_delete)

        insp_layout.addLayout(btn_box)
        self.side_tabs.addTab(self.tab_inspector, t("radial_tab_inspector"))

        # Tab 2: Socratic Questions
        self.tab_socratic = QWidget()
        soc_layout = QVBoxLayout(self.tab_socratic)
        soc_layout.setContentsMargins(6, 6, 6, 6)
        soc_layout.setSpacing(6)

        self.lbl_soc_desc = QLabel()
        self.lbl_soc_desc.setWordWrap(True)
        self.lbl_soc_desc.setStyleSheet("color: #94a3b8; font-size: 11px;")
        soc_layout.addWidget(self.lbl_soc_desc)

        self.scroll_socratic = QScrollArea()
        self.scroll_socratic.setWidgetResizable(True)
        self.scroll_socratic.setStyleSheet("background-color: transparent; border: none;")

        self.container_socratic = QWidget()
        self.layout_socratic_cards = QVBoxLayout(self.container_socratic)
        self.layout_socratic_cards.setContentsMargins(0, 0, 0, 0)
        self.layout_socratic_cards.setSpacing(8)
        self.layout_socratic_cards.addStretch()

        self.scroll_socratic.setWidget(self.container_socratic)
        soc_layout.addWidget(self.scroll_socratic)

        self.side_tabs.addTab(self.tab_socratic, t("radial_tab_socratic", count=0))
        panel_layout.addWidget(self.side_tabs)

        splitter.addWidget(panel)
        splitter.setStretchFactor(0, 4)
        splitter.setStretchFactor(1, 1)

        main_layout.addWidget(splitter)

    def retranslate_ui(self):
        """Refreshes all texts across Radial Studio."""
        if not self.current_topic:
            self.title_label.setText(t("tab_radial"))
        else:
            ins_count = len([n for nid, n in self.ai_graph_state.nodes.items() if nid != self.central_node_id])
            self.title_label.setText(t("radial_title", topic=self.current_topic, count=ins_count))

        self.btn_fit.setText(t("canvas_fit_view"))
        self.btn_reset.setText(t("canvas_reset_view"))
        self.btn_physics.setText(t("canvas_physics_on") if self.scene.physics_enabled else t("canvas_physics_off"))
        self.btn_merge.setText(t("radial_merge_btn"))
        self.btn_export.setText(t("radial_export_btn"))

        self.side_tabs.setTabText(0, t("radial_tab_inspector"))
        self.side_tabs.setTabText(1, t("radial_tab_socratic", count=len(self.socratic_questions)))

        is_fa = (i18n.get_language() == "fa")
        dir_mode = Qt.LayoutDirection.RightToLeft if is_fa else Qt.LayoutDirection.LeftToRight
        align_mode = Qt.AlignmentFlag.AlignRight if is_fa else Qt.AlignmentFlag.AlignLeft

        self.txt_description.setLayoutDirection(dir_mode)
        opt = self.txt_description.document().defaultTextOption()
        opt.setTextDirection(dir_mode)
        opt.setAlignment(align_mode | Qt.AlignmentFlag.AlignAbsolute)
        self.txt_description.document().setDefaultTextOption(opt)

        self.lbl_node_title.setAlignment(align_mode | Qt.AlignmentFlag.AlignVCenter)
        self.lbl_node_meta.setAlignment(align_mode | Qt.AlignmentFlag.AlignVCenter)
        self.lbl_soc_desc.setAlignment(align_mode | Qt.AlignmentFlag.AlignVCenter)

        self._populate_socratic_cards()

    def display_breakdown(self, topic: str, insights: List[AIInsight], importance: int = 8, 
                          socratic_questions: Optional[List[str]] = None):
        """Populates the interactive physics studio with the central node, orbiting insight nodes, and Socratic questions."""
        self.current_topic = topic
        self.socratic_questions = list(socratic_questions or [])
        self.title_label.setText(t("radial_title", topic=topic, count=len(insights)))

        self.ai_graph_state = GraphState()
        self.scene.clear_scene()

        # Update Socratic tab count
        self.side_tabs.setTabText(1, t("radial_tab_socratic", count=len(self.socratic_questions)))
        self._populate_socratic_cards()

        if not insights:
            return

        # 1. Create Central Primary Node
        central_node = NodeData(
            title=topic,
            importance=importance,
            x=0.0,
            y=0.0,
            tags=["ai-root", "core-topic"],
            content=f"Primary topic for AI deep-dive analysis.\nGenerated {len(insights)} sub-concepts and {len(self.socratic_questions)} Socratic questions."
        )
        self.ai_graph_state.add_node(central_node)
        self.central_node_id = central_node.id
        self.scene.add_node_item(central_node, trigger_physics=False)

        # 2. Add Orbiting AI Insight Nodes with initial radial spread
        total = len(insights)
        orbit_radius = 126.0  # 30% reduction from 180.0
        sub_nodes: List[NodeData] = []

        for i, ins in enumerate(insights):
            angle = (2 * math.pi * i / max(1, total)) - (math.pi / 2)
            init_x = orbit_radius * math.cos(angle)
            init_y = orbit_radius * math.sin(angle)

            sub_node = NodeData(
                title=ins.topic,
                content=f"**Relation:** {ins.relation_type}\n\n{ins.description}",
                importance=ins.importance,
                x=init_x,
                y=init_y,
                tags=["ai-insight", ins.relation_type.lower().replace(" ", "-")]
            )
            self.ai_graph_state.add_node(sub_node)
            self.scene.add_node_item(sub_node, trigger_physics=False)
            sub_nodes.append(sub_node)

            # Connect spring edge from central node to insight node
            self.ai_graph_state.add_edge(central_node.id, sub_node.id, weight=1.2, label=ins.relation_type)
            self.scene.add_edge_item(central_node.id, sub_node.id, weight=1.2, label=ins.relation_type)

        # Start live physics simulation
        self.scene.start_physics()
        QTimer.singleShot(250, self.view.fit_graph_to_view)

        # Select first insight by default
        if sub_nodes:
            self._on_node_selected(sub_nodes[0].id)

    def _populate_socratic_cards(self):
        """Builds interactive cards for each Socratic question."""
        # Clear existing items
        while self.layout_socratic_cards.count() > 0:
            item = self.layout_socratic_cards.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        if not self.socratic_questions:
            lbl_empty = QLabel(t("radial_soc_empty"))
            lbl_empty.setStyleSheet("color: #64748b; font-style: italic; padding: 12px;")
            self.layout_socratic_cards.addWidget(lbl_empty)
            self.layout_socratic_cards.addStretch()
            return

        for i, question in enumerate(self.socratic_questions, 1):
            card = QFrame()
            card.setStyleSheet("""
                QFrame {
                    background-color: #090d16;
                    border: 1px solid #1e293b;
                    border-left: 3px solid #f59e0b;
                    border-radius: 6px;
                    padding: 8px;
                }
                QFrame:hover {
                    border-color: #38bdf8;
                    border-left-color: #38bdf8;
                }
            """)
            card_layout = QVBoxLayout(card)
            card_layout.setContentsMargins(6, 6, 6, 6)
            card_layout.setSpacing(6)

            lbl_q = QLabel(t("radial_card_q", i=i, question=question))
            lbl_q.setWordWrap(True)
            lbl_q.setStyleSheet("color: #f1f5f9; font-size: 12px; line-height: 1.4;")
            card_layout.addWidget(lbl_q)

            btn_row = QHBoxLayout()
            btn_row.setSpacing(6)

            btn_add = QPushButton(t("radial_card_btn_add"))
            btn_add.setFixedHeight(24)
            btn_add.setStyleSheet("""
                QPushButton {
                    background-color: #1e293b;
                    color: #38bdf8;
                    border: 1px solid #0284c7;
                    border-radius: 4px;
                    font-size: 11px;
                    padding: 2px 8px;
                    font-weight: 600;
                }
                QPushButton:hover {
                    background-color: #0284c7;
                    color: #ffffff;
                }
            """)
            btn_add.clicked.connect(lambda checked, q=question: self._add_question_as_node(q))
            btn_row.addWidget(btn_add)

            btn_copy = QPushButton(t("radial_card_btn_copy"))
            btn_copy.setFixedHeight(24)
            btn_copy.setStyleSheet("""
                QPushButton {
                    background-color: #1e293b;
                    color: #94a3b8;
                    border: 1px solid #334155;
                    border-radius: 4px;
                    font-size: 11px;
                    padding: 2px 6px;
                }
                QPushButton:hover {
                    background-color: #334155;
                    color: #ffffff;
                }
            """)
            btn_copy.clicked.connect(lambda checked, q=question: self._copy_to_clipboard(q))
            btn_row.addWidget(btn_copy)

            btn_row.addStretch()
            card_layout.addLayout(btn_row)

            self.layout_socratic_cards.addWidget(card)

        self.layout_socratic_cards.addStretch()

    def _copy_to_clipboard(self, text: str):
        clipboard = QApplication.clipboard()
        if clipboard:
            clipboard.setText(text)
            QMessageBox.information(self, t("radial_copied_title"), t("radial_copied_body"))

    def _add_question_as_node(self, question_text: str):
        """Creates a new thought node on the AI Studio graph from a Socratic question."""
        words = question_text.split()
        short_title = "❓ " + " ".join(words[:6]) + ("..." if len(words) > 6 else "")

        pos_offset = (len(self.ai_graph_state.nodes) * 40.0) % 200
        new_node = NodeData(
            title=short_title,
            content=f"### ❓ Socratic Inquiry for [[{self.current_topic}]]:\n\n> *{question_text}*\n\n### Hypotheses & Exploration:\n- ",
            importance=8,
            tags=["socratic-question", "inquiry"],
            x=pos_offset - 100,
            y=pos_offset - 100
        )
        self.ai_graph_state.add_node(new_node)
        self.scene.add_node_item(new_node, trigger_physics=False)

        if self.central_node_id:
            self.ai_graph_state.add_edge(self.central_node_id, new_node.id, weight=1.1, label="Socratic Inquiry")
            self.scene.add_edge_item(self.central_node_id, new_node.id, weight=1.1, label="Socratic Inquiry")

        self.scene.start_physics()
        self._on_node_selected(new_node.id)
        self.side_tabs.setCurrentIndex(0)  # Switch to inspector

    def _on_node_selected(self, node_id: str):
        self.selected_node_id = node_id
        node = self.ai_graph_state.get_node(node_id)
        if not node:
            return

        self.lbl_node_title.setText(node.title)
        tags_str = ', '.join(node.tags) if node.tags else t("sidebar_tags_none")
        self.lbl_node_meta.setText(t("radial_node_meta", importance=node.importance, tags=tags_str))
        self.txt_description.setPlainText(node.content)
        self.btn_insp_edit.setEnabled(True)
        self.btn_insp_delete.setEnabled(node_id != self.central_node_id)

    def _open_note_editor(self, node_id: str):
        node = self.ai_graph_state.get_node(node_id)
        if not node:
            return

        dialog = NoteEditorDialog(node, self)
        dialog.saved.connect(self._on_node_saved)
        dialog.exec()

    def _on_node_saved(self, node: NodeData):
        self.ai_graph_state.nodes[node.id] = node
        item = self.scene.node_items.get(node.id)
        if item:
            item.refresh_data(node)
        self._on_node_selected(node.id)

    def _edit_selected_node(self):
        if self.selected_node_id:
            self._open_note_editor(self.selected_node_id)

    def _delete_node(self, node_id: str):
        if node_id == self.central_node_id:
            QMessageBox.information(self, t("settings_invalid_path_title"), t("notice_root_node_delete"))
            return

        node = self.ai_graph_state.get_node(node_id)
        if not node:
            return

        has_notes = bool(node.content and node.content.strip())
        if has_notes:
            reply = QMessageBox.question(
                self, t("confirm_delete_title"),
                t("confirm_remove_ai_node_body", title=node.title),
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
            )
            if reply != QMessageBox.StandardButton.Yes:
                return

        self.ai_graph_state.remove_node(node_id)
        self.scene.remove_node_item(node_id)
        if self.selected_node_id == node_id:
            self.selected_node_id = None
            self.lbl_node_title.setText(t("sidebar_select_hint"))
            self.lbl_node_meta.setText("")
            self.txt_description.clear()
            self.btn_insp_edit.setEnabled(False)
            self.btn_insp_delete.setEnabled(False)

    def _connect_nodes(self, source_id: str, target_id: str):
        edge = self.ai_graph_state.add_edge(source_id, target_id, weight=1.2, label="", edge_type="explicit")
        if edge:
            self.scene.add_edge_item(source_id, target_id, weight=1.2, label="", edge_type="explicit")

    def _delete_selected_node(self):
        if self.selected_node_id:
            self._delete_node(self.selected_node_id)

    def _fit_view(self):
        self.view.fit_graph_to_view()

    def _reset_view(self):
        self.view.reset_zoom()

    def _toggle_physics(self):
        new_state = not self.scene.physics_enabled
        self.scene.toggle_physics(new_state)
        self.btn_physics.setText(t("canvas_physics_on") if new_state else t("canvas_physics_off"))

    def _on_merge_clicked(self):
        # Extract surviving sub-nodes (excluding central root node)
        surviving_sub_nodes = [
            n for nid, n in self.ai_graph_state.nodes.items()
            if nid != self.central_node_id
        ]
        if self.current_topic and surviving_sub_nodes:
            self.merge_insights_requested.emit(self.current_topic, surviving_sub_nodes)

    def _on_export_clicked(self):
        surviving_nodes = list(self.ai_graph_state.nodes.values())
        if self.current_topic and surviving_nodes:
            self.save_to_note_requested.emit(self.current_topic, surviving_nodes, self.socratic_questions)
