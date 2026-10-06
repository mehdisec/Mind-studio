"""
Main Window for MindMap Studio.
Integrates the Knowledge Graph canvas, AI Deep-Dive radial studio, Obsidian Vault synchronization, and sidebar inspector.
"""

from datetime import datetime
import os
import math
from pathlib import Path
from typing import Optional, List

from PyQt6.QtCore import Qt, QTimer, QPointF
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QLineEdit, QPushButton, QSlider, QTabWidget, QSplitter,
    QFrame, QListWidget, QListWidgetItem, QStatusBar,
    QToolBar, QMessageBox, QFileDialog, QProgressBar,
    QComboBox, QInputDialog, QTextEdit, QPlainTextEdit, QDialog
)
from PyQt6.QtGui import QIcon, QKeySequence, QShortcut, QAction, QFont

from mindmap_studio.models.graph_models import GraphState, NodeData, EdgeData, AIInsight
from mindmap_studio.services.obsidian_service import ObsidianService
from mindmap_studio.services.gemini_service import GeminiService
from mindmap_studio.services.ai_edge_service import AIConnectionWorker, apply_ai_edges_to_graph
from mindmap_studio.services.gemini_service import AIChatAction
from mindmap_studio.ui.graph.graph_items import EdgeItem, NodeItem
from mindmap_studio.ui.graph.graph_scene import GraphScene
from mindmap_studio.ui.graph.graph_view import GraphView
from mindmap_studio.ui.graph.radial_view import RadialGraphView
from mindmap_studio.ui.dialogs.note_editor import NoteEditorDialog
from mindmap_studio.ui.dialogs.settings_dialog import SettingsDialog
from mindmap_studio.ui.dialogs.add_image_dialog import AddImageNodeDialog
from mindmap_studio.ui.dialogs.action_review_dialog import ActionReviewDialog
from mindmap_studio.ui.widgets.ai_chat_panel import AIChatPanel
from mindmap_studio.ui.styles import get_theme_qss
from mindmap_studio.config import config, get_node_style_for_importance
from mindmap_studio.i18n import t, i18n


class MainWindow(QMainWindow):
    """Main Application Window for MindMap Studio."""

    def __init__(self):
        super().__init__()
        self.setWindowTitle(t("app_title"))
        self.resize(1380, 860)
        self.setMinimumSize(900, 600)

        # State & Services
        self.graph_state = GraphState()
        self.obsidian_service = ObsidianService(config.get_vault_path())
        self.gemini_service = GeminiService(self)
        self._ai_edge_worker: Optional[AIConnectionWorker] = None
        self.selected_node_id: Optional[str] = None

        # Setup UI
        self.setStyleSheet(get_theme_qss())
        self._init_ui()
        self._setup_shortcuts()
        self._load_vault_or_defaults()

        # Connect internationalization listener
        i18n.language_changed.connect(lambda _: self.retranslate_ui())
        self.retranslate_ui()

    def _init_ui(self):
        # Central Widget & Main Layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_vbox = QVBoxLayout(central_widget)
        main_vbox.setContentsMargins(8, 8, 8, 8)
        main_vbox.setSpacing(6)

        # 1. Top Quick-Add & Navigation Bar
        top_bar = self._create_top_bar()
        main_vbox.addWidget(top_bar)

        # 2. Main Workspace Splitter (Dual-Tab Canvas on Left + Sidebar Inspector on Right)
        self.workspace_splitter = QSplitter(Qt.Orientation.Horizontal)
        self.workspace_splitter.setLayoutDirection(Qt.LayoutDirection.LeftToRight)

        # Central Tabs: Main Graph + AI Radial Studio
        self.tabs = QTabWidget()
        
        # Tab 1: Force-Directed Knowledge Graph
        self.graph_scene = GraphScene(self)
        self.graph_scene.node_selected.connect(self._on_node_selected)
        self.graph_scene.node_moved.connect(self._on_node_moved)
        self.graph_scene.add_child_text_requested.connect(self._on_add_child_text)
        self.graph_scene.add_child_image_requested.connect(self._on_add_child_image)
        self.graph_scene.edit_note_requested.connect(self._open_note_editor)
        self.graph_scene.deep_dive_requested.connect(self._trigger_deep_dive_for_node)
        self.graph_scene.delete_node_requested.connect(self._delete_node)
        self.graph_scene.delete_edge_requested.connect(self._delete_edge)
        self.graph_scene.edit_edge_label_requested.connect(self._on_edit_edge_label)
        self.graph_scene.edge_selected.connect(self._on_edge_selected)
        self.graph_scene.socratic_questions_requested.connect(self._generate_socratic_questions_for_node)
        self.graph_scene.node_highlight_toggled.connect(self._on_node_highlight_toggled)
        self.graph_scene.connect_nodes_requested.connect(self._connect_nodes)
        self.graph_scene.graph_changed.connect(self._update_graph_stats)

        self.graph_view = GraphView(self.graph_scene)
        self.graph_view.add_text_node_requested.connect(self._on_add_text_node_at_pos)
        self.graph_view.add_image_node_requested.connect(self._on_add_image_node_at_pos)
        
        tab_graph_container = QWidget()
        tab_graph_layout = QVBoxLayout(tab_graph_container)
        tab_graph_layout.setContentsMargins(0, 0, 0, 0)
        tab_graph_layout.setSpacing(0)
        
        # Vertical Splitter: Graph Canvas on Top (60%) and Note Panel Horizontally Below (40%)
        self.graph_content_splitter = QSplitter(Qt.Orientation.Vertical)
        
        # Top Container: Controls + Graph Canvas (60%)
        graph_canvas_container = QWidget()
        graph_canvas_layout = QVBoxLayout(graph_canvas_container)
        graph_canvas_layout.setContentsMargins(0, 0, 0, 0)
        graph_canvas_layout.setSpacing(0)
        
        canvas_controls = self._create_canvas_toolbar()
        graph_canvas_layout.addWidget(canvas_controls)
        graph_canvas_layout.addWidget(self.graph_view)
        
        self.graph_content_splitter.addWidget(graph_canvas_container)
        
        # Bottom Container: AI Chat & Notebook Assistant Panel (40%)
        self.ai_chat_panel = AIChatPanel(self)
        self.ai_chat_panel.setMinimumHeight(200)
        self.ai_chat_panel.send_message_requested.connect(self._on_ai_chat_message_sent)
        self.ai_chat_panel.deep_dive_requested.connect(self._deep_dive_selected_or_prompt)
        self.ai_chat_panel.brainstorm_requested.connect(self._on_brainstorm_requested)
        self.graph_content_splitter.addWidget(self.ai_chat_panel)
        
        self.graph_content_splitter.setStretchFactor(0, 6)
        self.graph_content_splitter.setStretchFactor(1, 4)
        self.graph_content_splitter.setSizes([540, 360])
        
        tab_graph_layout.addWidget(self.graph_content_splitter)

        self.tabs.addTab(tab_graph_container, t("tab_graph"))

        # Tab 2: AI Conceptual Breakdown Studio
        self.radial_view = RadialGraphView(self)
        self.radial_view.merge_insights_requested.connect(self._merge_insights_to_main_graph)
        self.radial_view.save_to_note_requested.connect(self._save_radial_to_note)
        self.tabs.addTab(self.radial_view, t("tab_radial"))

        self.workspace_splitter.addWidget(self.tabs)

        # Right Sidebar (Inspector, Search & Stats)
        self.sidebar_widget = self._create_sidebar()
        self.workspace_splitter.addWidget(self.sidebar_widget)

        self.workspace_splitter.setStretchFactor(0, 4)
        self.workspace_splitter.setStretchFactor(1, 1)
        self.workspace_splitter.setSizes([1000, 320])

        main_vbox.addWidget(self.workspace_splitter)

        # 3. Status Bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        
        self.lbl_vault_status = QLabel(t("status_vault_not_set"))
        self.lbl_vault_status.setStyleSheet("color: #38bdf8; font-weight: 500; margin-right: 15px; margin-left: 15px;")
        self.status_bar.addPermanentWidget(self.lbl_vault_status)

        self.ai_progress = QProgressBar()
        self.ai_progress.setRange(0, 0)  # Indeterminate
        self.ai_progress.setFixedWidth(140)
        self.ai_progress.setFixedHeight(14)
        self.ai_progress.hide()
        self.status_bar.addPermanentWidget(self.ai_progress)

        self.lbl_stats_status = QLabel(t("sidebar_stats_nodes", nodes=0, edges=0))
        self.lbl_stats_status.setStyleSheet("color: #94a3b8; font-weight: 500; margin-right: 10px; margin-left: 10px;")
        self.status_bar.addPermanentWidget(self.lbl_stats_status)

        self.status_bar.showMessage(t("status_ready"))

    def _create_top_bar(self) -> QWidget:
        bar = QFrame()
        bar.setObjectName("topBar")
        layout = QHBoxLayout(bar)
        layout.setContentsMargins(8, 4, 8, 4)
        layout.setSpacing(10)

        # App Brand
        self.lbl_brand = QLabel(t("app_brand"))
        self.lbl_brand.setStyleSheet("font-size: 14px; font-weight: bold; color: #38bdf8;")
        layout.addWidget(self.lbl_brand)

        sep1 = QFrame()
        sep1.setFrameShape(QFrame.Shape.VLine)
        sep1.setObjectName("divider")
        layout.addWidget(sep1)

        # Thought Input
        self.lbl_thought = QLabel(t("top_thought_lbl"))
        self.lbl_thought.setStyleSheet("font-weight: 600;")
        layout.addWidget(self.lbl_thought)

        self.input_thought = QLineEdit()
        self.input_thought.setPlaceholderText(t("top_thought_placeholder"))
        self.input_thought.returnPressed.connect(self._add_thought_from_bar)
        layout.addWidget(self.input_thought, stretch=2)

        # Importance Slider
        self.lbl_top_rating = QLabel(t("top_importance_lbl"))
        self.lbl_top_rating.setStyleSheet("font-weight: 600;")
        layout.addWidget(self.lbl_top_rating)

        self.top_slider_importance = QSlider(Qt.Orientation.Horizontal)
        self.top_slider_importance.setRange(1, 10)
        self.top_slider_importance.setValue(5)
        self.top_slider_importance.setFixedWidth(110)
        self.top_slider_importance.valueChanged.connect(self._on_top_importance_changed)
        layout.addWidget(self.top_slider_importance)

        self.lbl_top_imp_val = QLabel("★5")
        self.lbl_top_imp_val.setStyleSheet("font-weight: bold; color: #f59e0b; width: 24px;")
        layout.addWidget(self.lbl_top_imp_val)

        # Add Button
        self.btn_add_thought = QPushButton(t("top_add_node_btn"))
        self.btn_add_thought.setObjectName("primaryBtn")
        self.btn_add_thought.clicked.connect(self._add_thought_from_bar)
        layout.addWidget(self.btn_add_thought)

        sep2 = QFrame()
        sep2.setFrameShape(QFrame.Shape.VLine)
        sep2.setObjectName("divider")
        layout.addWidget(sep2)

        # Quick Save Button
        self.btn_quick_save = QPushButton(t("top_quick_save_btn"))
        self.btn_quick_save.clicked.connect(self.quick_save_vault)
        layout.addWidget(self.btn_quick_save)

        # Settings Button
        self.btn_settings = QPushButton(t("top_settings_btn"))
        self.btn_settings.clicked.connect(self._open_settings)
        layout.addWidget(self.btn_settings)

        return bar

    def _create_canvas_toolbar(self) -> QWidget:
        bar = QFrame()
        bar.setObjectName("canvasToolBar")
        layout = QHBoxLayout(bar)
        layout.setContentsMargins(8, 2, 8, 2)
        layout.setSpacing(8)

        self.btn_fit = QPushButton(t("canvas_fit_view"))
        self.btn_fit.setFixedHeight(26)
        self.btn_fit.clicked.connect(self.graph_view.fit_graph_to_view)
        layout.addWidget(self.btn_fit)

        self.btn_toggle_physics = QPushButton(t("canvas_physics_on"))
        self.btn_toggle_physics.setFixedHeight(26)
        self.btn_toggle_physics.clicked.connect(self._toggle_physics_state)
        layout.addWidget(self.btn_toggle_physics)

        layout.addStretch()

        self.lbl_canvas_hint = QLabel(t("canvas_hint"))
        self.lbl_canvas_hint.setStyleSheet("color: #64748b; font-size: 11px;")
        layout.addWidget(self.lbl_canvas_hint)

        return bar

    def _create_sidebar(self) -> QWidget:
        sidebar = QFrame()
        sidebar.setObjectName("sidebarFrame")
        sidebar.setMinimumWidth(260)
        sidebar.setMaximumWidth(360)
        
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(10)

        # 1. Search Box
        self.lbl_search = QLabel(t("sidebar_search_title"))
        self.lbl_search.setStyleSheet("font-weight: bold; color: #38bdf8;")
        layout.addWidget(self.lbl_search)

        self.edit_search = QLineEdit()
        self.edit_search.setPlaceholderText(t("sidebar_search_placeholder"))
        self.edit_search.textChanged.connect(self._filter_node_list)
        layout.addWidget(self.edit_search)

        # 2. Node List
        self.list_nodes = QListWidget()
        self.list_nodes.setObjectName("nodeList")
        self.list_nodes.itemClicked.connect(self._on_list_item_clicked)
        self.list_nodes.itemDoubleClicked.connect(self._on_list_item_double_clicked)
        layout.addWidget(self.list_nodes)

        # 3. Selected Node Inspector
        inspector_frame = QFrame()
        inspector_frame.setObjectName("inspectorFrame")
        insp_layout = QVBoxLayout(inspector_frame)
        insp_layout.setContentsMargins(6, 6, 6, 6)
        insp_layout.setSpacing(6)

        self.lbl_insp_title = QLabel(t("sidebar_inspector_title"))
        self.lbl_insp_title.setStyleSheet("font-weight: bold; color: #a855f7; font-size: 12px;")
        insp_layout.addWidget(self.lbl_insp_title)

        self.lbl_insp_node_name = QLabel(t("sidebar_no_selection"))
        self.lbl_insp_node_name.setWordWrap(True)
        self.lbl_insp_node_name.setStyleSheet("font-weight: bold;")
        insp_layout.addWidget(self.lbl_insp_node_name)

        self.lbl_insp_details = QLabel(t("sidebar_select_hint"))
        self.lbl_insp_details.setWordWrap(True)
        self.lbl_insp_details.setStyleSheet("color: #94a3b8; font-size: 11px;")
        insp_layout.addWidget(self.lbl_insp_details)

        btn_row = QHBoxLayout()
        self.btn_insp_edit = QPushButton(t("sidebar_btn_edit"))
        self.btn_insp_edit.clicked.connect(self._edit_selected_node)
        self.btn_insp_edit.setEnabled(False)
        btn_row.addWidget(self.btn_insp_edit)

        self.btn_insp_ai = QPushButton(t("sidebar_btn_deep_dive"))
        self.btn_insp_ai.setObjectName("aiBtn")
        self.btn_insp_ai.clicked.connect(self._deep_dive_selected_node)
        self.btn_insp_ai.setEnabled(False)
        btn_row.addWidget(self.btn_insp_ai)

        insp_layout.addLayout(btn_row)
        layout.addWidget(inspector_frame)

        # 4. Total Concepts & Graph Stats Card
        stats_frame = QFrame()
        stats_frame.setObjectName("statsFrame")
        stats_layout = QVBoxLayout(stats_frame)
        stats_layout.setContentsMargins(8, 8, 8, 8)
        stats_layout.setSpacing(4)

        self.lbl_sidebar_stats_title = QLabel(t("sidebar_stats_title"))
        self.lbl_sidebar_stats_title.setStyleSheet("font-weight: bold; color: #38bdf8; font-size: 12px;")
        stats_layout.addWidget(self.lbl_sidebar_stats_title)

        self.lbl_sidebar_stats = QLabel(t("sidebar_stats_nodes", nodes=0, edges=0))
        self.lbl_sidebar_stats.setStyleSheet("color: #cbd5e1; font-size: 12px; font-weight: 600;")
        stats_layout.addWidget(self.lbl_sidebar_stats)

        layout.addWidget(stats_frame)

        return sidebar

    def retranslate_ui(self):
        """Dynamically updates all UI strings and layout direction based on current active language."""
        self.setWindowTitle(t("app_title"))
        
        # Tabs
        self.tabs.setTabText(0, t("tab_graph"))
        self.tabs.setTabText(1, t("tab_radial"))

        # Top bar
        self.lbl_brand.setText(t("app_brand"))
        self.lbl_thought.setText(t("top_thought_lbl"))
        self.input_thought.setPlaceholderText(t("top_thought_placeholder"))
        self.lbl_top_rating.setText(t("top_importance_lbl"))
        self.btn_add_thought.setText(t("top_add_node_btn"))
        self.btn_quick_save.setText(t("top_quick_save_btn"))
        self.btn_settings.setText(t("top_settings_btn"))

        # Canvas toolbar
        self.btn_fit.setText(t("canvas_fit_view"))
        self.btn_toggle_physics.setText(
            t("canvas_physics_on") if self.graph_scene.physics_enabled else t("canvas_physics_off")
        )
        self.lbl_canvas_hint.setText(t("canvas_hint"))

        # Sidebar
        self.lbl_search.setText(t("sidebar_search_title"))
        self.edit_search.setPlaceholderText(t("sidebar_search_placeholder"))
        self.lbl_insp_title.setText(t("sidebar_inspector_title"))
        self.btn_insp_edit.setText(t("sidebar_btn_edit"))
        self.btn_insp_ai.setText(t("sidebar_btn_deep_dive"))
        if hasattr(self, "lbl_sidebar_stats_title"):
            self.lbl_sidebar_stats_title.setText(t("sidebar_stats_title"))

        # AI Chat Panel
        if hasattr(self, "ai_chat_panel"):
            self.ai_chat_panel.retranslate_ui()

        # Vault status & stats
        self._update_vault_status_label()
        self._update_graph_stats()
        self._update_notebook_stats()

        # Text Direction & Alignment for Inputs
        is_fa = (i18n.get_language() == "fa")
        dir_mode = Qt.LayoutDirection.RightToLeft if is_fa else Qt.LayoutDirection.LeftToRight
        align_mode = Qt.AlignmentFlag.AlignRight if is_fa else Qt.AlignmentFlag.AlignLeft

        self.input_thought.setLayoutDirection(dir_mode)
        self.input_thought.setAlignment(align_mode | Qt.AlignmentFlag.AlignVCenter)

        self.edit_search.setLayoutDirection(dir_mode)
        self.edit_search.setAlignment(align_mode | Qt.AlignmentFlag.AlignVCenter)

        self.lbl_insp_details.setAlignment(align_mode | Qt.AlignmentFlag.AlignVCenter)
        self.lbl_insp_node_name.setAlignment(align_mode | Qt.AlignmentFlag.AlignVCenter)

        # Update selected node UI state text if any
        if self.selected_node_id and self.selected_node_id in self.graph_state.nodes:
            node = self.graph_state.nodes[self.selected_node_id]
            self.lbl_insp_node_name.setText(node.title)
            tags_str = ", ".join(node.tags) if node.tags else t("sidebar_tags_none")
            self.lbl_insp_details.setText(
                t("sidebar_details_template",
                  importance=node.importance,
                  tags=tags_str,
                  links=len(node.links),
                  chars=len(node.content or ""))
            )
            self.lbl_insp_node_name.setText(t("sidebar_no_selection"))
            self.lbl_insp_details.setText(t("sidebar_select_hint"))

    def _setup_shortcuts(self):
        # Quick save shortcut
        save_sc = QShortcut(QKeySequence("Ctrl+S"), self)
        save_sc.activated.connect(self.quick_save_vault)

        # Settings shortcut
        settings_sc = QShortcut(QKeySequence("Ctrl+,"), self)
        settings_sc.activated.connect(self._open_settings)

        # Delete node shortcuts (Delete & Backspace)
        del_sc = QShortcut(QKeySequence.StandardKey.Delete, self)
        del_sc.activated.connect(self._delete_selected_node_or_items)

        backspace_sc = QShortcut(QKeySequence(Qt.Key.Key_Backspace), self)
        backspace_sc.activated.connect(self._delete_selected_node_or_items)

    def _delete_selected_node_or_items(self):
        """Triggered by Delete or Backspace keys across graph canvas or sidebar."""
        focus_w = self.focusWidget()
        if isinstance(focus_w, (QLineEdit, QTextEdit, QPlainTextEdit)):
            return

        # If on AI Radial Studio tab (index 1)
        if self.tabs.currentIndex() == 1:
            self.radial_view._delete_selected_node()
            return

        # Main Graph Tab: Check for selected edges first
        selected_edges = [
            item for item in self.graph_scene.selectedItems()
            if isinstance(item, EdgeItem)
        ]
        if selected_edges:
            for edge in selected_edges:
                self._delete_edge(edge.source_item.node_data.id, edge.target_item.node_data.id)
            return

        # Next check for selected nodes
        selected_node_items = [
            item for item in self.graph_scene.selectedItems()
            if hasattr(item, "node_data") and not isinstance(item, EdgeItem)
        ]
        
        node_ids = []
        if selected_node_items:
            node_ids = [item.node_data.id for item in selected_node_items]
        elif self.selected_node_id:
            node_ids = [self.selected_node_id]

        for nid in node_ids:
            self._delete_node(nid)

    def _update_vault_status_label(self):
        vault_path = config.get_vault_path()
        if vault_path and Path(vault_path).is_dir():
            self.lbl_vault_status.setText(t("status_vault_connected", name=Path(vault_path).name))
        else:
            self.lbl_vault_status.setText(t("status_vault_not_set"))

    def _load_vault_or_defaults(self):
        vault_path = config.get_vault_path()
        if vault_path and Path(vault_path).is_dir():
            self.obsidian_service.set_vault_path(vault_path)
        self._update_vault_status_label()

        # 1. Attempt to load existing saved graph from Obsidian or local persistent storage
        state, msg = self.obsidian_service.load_graph_state()
        if state and state.nodes:
            self.graph_state = state
            self.graph_scene.load_graph_state(self.graph_state)
            self._refresh_node_list()
            self._update_graph_stats()
            self.status_bar.showMessage(msg, 4000)
            QTimer.singleShot(200, self.graph_view.fit_graph_to_view)
            QTimer.singleShot(250, self.graph_scene.start_physics)
            return

        # 2. First launch only: create starter sample nodes and persist them
        if not self.graph_state.nodes:
            self._create_starter_graph()
            self.obsidian_service.save_graph_state(self.graph_state)

    def _create_starter_graph(self):
        """Initializes a starter knowledge graph with 3 interconnected sample nodes."""
        n1 = NodeData(
            title="MindMap Studio", 
            importance=9, 
            x=0.0, 
            y=-85.0, 
            content="Interactive visual canvas for capturing thoughts and exploring mental models with force-directed physics.", 
            tags=["core", "thoughts"]
        )
        n2 = NodeData(
            title="Knowledge Graph", 
            importance=8, 
            x=-85.0, 
            y=60.0, 
            content="Nonlinear relational network representing concepts and bi-directional associations.", 
            tags=["graph", "network"]
        )
        n3 = NodeData(
            title="AI Insights", 
            importance=8, 
            x=85.0, 
            y=60.0, 
            content="Deep cognitive breakdowns, conceptual clustering, and automated idea synthesis.", 
            tags=["ai", "gemini"]
        )

        for node in (n1, n2, n3):
            self.graph_state.add_node(node)
            self.graph_scene.add_node_item(node, trigger_physics=False)

        connections = [
            (n1.id, n2.id),
            (n2.id, n3.id),
            (n3.id, n1.id)
        ]
        for src, tgt in connections:
            self.graph_state.add_edge(src, tgt, weight=1.2, label="", edge_type="explicit")
            self.graph_scene.add_edge_item(src, tgt, weight=1.2, label="", edge_type="explicit")

        self.graph_scene.start_physics()
        self._refresh_node_list()
        self._update_graph_stats()
        QTimer.singleShot(200, self.graph_view.fit_graph_to_view)

    def _on_top_importance_changed(self, val: int):
        self.lbl_top_imp_val.setText(f"★{val}")

    def _add_thought_from_bar(self):
        topic = self.input_thought.text().strip()
        if not topic:
            return

        importance = self.top_slider_importance.value()
        
        # Calculate scene coordinates corresponding precisely to the center of the current visible viewport
        vp_rect = self.graph_view.viewport().rect()
        center_scene_pos = self.graph_view.mapToScene(vp_rect.center())
        
        # Micro-spread if multiple thoughts are created in the same frame/position
        spread_idx = len(self.graph_state.nodes)
        angle = spread_idx * 2.39996  # golden angle
        radius = min(20.0, (spread_idx % 5) * 4.0)
        
        x = round(center_scene_pos.x() + math.cos(angle) * radius, 1)
        y = round(center_scene_pos.y() + math.sin(angle) * radius, 1)

        node = NodeData(
            title=topic,
            importance=importance,
            x=x,
            y=y,
            tags=["thought"]
        )
        
        self.graph_state.add_node(node)
        self.graph_scene.add_node_item(node, trigger_physics=False)
        self.graph_scene.start_physics()
        
        self.obsidian_service.save_graph_state(self.graph_state)

        self.input_thought.clear()
        self._refresh_node_list()
        self._update_graph_stats()
        self.status_bar.showMessage(t("status_thought_added", topic=topic), 3000)

    def _on_add_text_node_at_pos(self, pos: QPointF):
        """Adds a text node at the specified scene position via context menu."""
        topic, ok = QInputDialog.getText(
            self,
            t("top_add_node_btn"),
            t("top_thought_lbl") + ":",
            QLineEdit.EchoMode.Normal,
            ""
        )
        if ok and topic.strip():
            topic = topic.strip()
            node = NodeData(
                title=topic,
                importance=self.top_slider_importance.value(),
                x=round(pos.x(), 1),
                y=round(pos.y(), 1),
                tags=["thought"]
            )
            self.graph_state.add_node(node)
            self.graph_scene.add_node_item(node, trigger_physics=False)
            self.graph_scene.start_physics()
            if self.obsidian_service.is_valid_vault():
                self.obsidian_service.save_node_to_markdown(node)
            self.obsidian_service.save_graph_state(self.graph_state)
            self._refresh_node_list()
            self._update_graph_stats()
            self.status_bar.showMessage(t("status_thought_added", topic=topic), 3000)

    def _on_add_image_node_at_pos(self, pos: QPointF):
        """Adds an image node at the specified scene position via dialog with 3 selectable sizes."""
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            t("dialog_select_image_title"),
            "",
            t("dialog_image_files_filter")
        )
        if not file_path:
            return

        from PyQt6.QtWidgets import QDialog
        dialog = AddImageNodeDialog(
            image_path=file_path,
            initial_importance=self.top_slider_importance.value(),
            parent=self
        )
        if dialog.exec() != QDialog.DialogCode.Accepted:
            return

        node_title, image_size, importance = dialog.get_data()

        node = NodeData(
            title=node_title,
            node_type="image",
            image_path=file_path,
            image_size=image_size,
            importance=importance,
            x=round(pos.x(), 1),
            y=round(pos.y(), 1),
            tags=["image"]
        )
        self.graph_state.add_node(node)
        self.graph_scene.add_node_item(node, trigger_physics=False)
        self.graph_scene.start_physics()
        if self.obsidian_service.is_valid_vault():
            self.obsidian_service.save_node_to_markdown(node)
        self.obsidian_service.save_graph_state(self.graph_state)
        self._refresh_node_list()
        self._update_graph_stats()
        self.status_bar.showMessage(t("status_thought_added", topic=node_title), 3000)

    def _on_node_selected(self, node_id: str):
        if self.graph_scene.handle_node_click_for_connection(node_id):
            return

        self.selected_node_id = node_id
        node = self.graph_state.get_node(node_id)
        if not node:
            return

        # 1. Update left sidebar inspector
        self.lbl_insp_node_name.setText(node.title)
        tags_str = ", ".join(node.tags) if node.tags else t("sidebar_tags_none")
        self.lbl_insp_details.setText(
            t("sidebar_details_template",
              importance=node.importance,
              tags=tags_str,
              links=len(node.links),
              chars=len(node.content or ""))
        )
        self.btn_insp_edit.setEnabled(True)
        self.btn_insp_ai.setEnabled(True)

        # 2. Update bottom Obsidian Note Content Editor Panel
        if hasattr(self, "note_panel_title"):
            self.note_panel_title.setText(node.title)
            self.note_panel_importance.setValue(node.importance)
            self.lbl_note_panel_imp_val.setText(f"★{node.importance}")
            self.note_panel_tags.setText(", ".join(node.tags) if node.tags else "")
            self.note_panel_editor.setPlainText(node.content)
            self.lbl_note_panel_status.setText(t("note_panel_status_loaded"))
            self.lbl_note_panel_status.setStyleSheet("color: #38bdf8; font-size: 11px;")
            self.btn_save_note_panel.setEnabled(True)
            self.btn_deep_dive_panel.setEnabled(True)
            if hasattr(self, "btn_socratic_panel"):
                self.btn_socratic_panel.setEnabled(True)
            if hasattr(self, "btn_highlight_panel"):
                self._update_highlight_btn_label(node)
                self.btn_highlight_panel.setEnabled(True)

        # Highlight item in sidebar list
        for i in range(self.list_nodes.count()):
            item = self.list_nodes.item(i)
            if item.data(Qt.ItemDataRole.UserRole) == node_id:
                self.list_nodes.setCurrentItem(item)
                break

    def _update_notebook_stats(self):
        """Updates the Notebook grounded badge count in the AI Chat Panel."""
        notes_count = len(self.graph_state.nodes)
        if self.obsidian_service.is_valid_vault():
            notes_dir = self.obsidian_service.get_notes_dir()
            if notes_dir and notes_dir.exists():
                notes_count = len(list(notes_dir.glob("*.md")))
        nodes_count = len(self.graph_state.nodes)
        if hasattr(self, "ai_chat_panel"):
            self.ai_chat_panel.update_notebook_stats(notes_count, nodes_count)

    def _on_ai_chat_message_sent(self, user_msg: str):
        """Builds full Obsidian Notebook and Graph context and sends to AI Assistant."""
        vault_notes = []
        if self.obsidian_service.is_valid_vault():
            notes_dir = self.obsidian_service.get_notes_dir()
            if notes_dir and notes_dir.exists():
                for md_file in notes_dir.glob("*.md"):
                    nd = self.obsidian_service.load_node_from_markdown(md_file)
                    if nd:
                        vault_notes.append({
                            "id": nd.id,
                            "title": nd.title,
                            "content": nd.content,
                            "tags": nd.tags,
                            "links": nd.links,
                            "importance": nd.importance
                        })
        if not vault_notes:
            for nd in self.graph_state.nodes.values():
                vault_notes.append({
                    "id": nd.id,
                    "title": nd.title,
                    "content": nd.content,
                    "tags": nd.tags,
                    "links": nd.links,
                    "importance": nd.importance
                })

        graph_nodes = []
        for nd in self.graph_state.nodes.values():
            graph_nodes.append({
                "id": nd.id,
                "title": nd.title,
                "importance": nd.importance,
                "tags": nd.tags,
                "links": [self.graph_state.nodes[lid].title for lid in nd.links if lid in self.graph_state.nodes]
            })

        selected_node_dict = None
        if self.selected_node_id and self.selected_node_id in self.graph_state.nodes:
            sn = self.graph_state.nodes[self.selected_node_id]
            selected_node_dict = {
                "id": sn.id,
                "title": sn.title,
                "content": sn.content,
                "tags": sn.tags,
                "importance": sn.importance
            }

        history = self.ai_chat_panel.get_history() if hasattr(self, "ai_chat_panel") else []

        self.gemini_service.send_chat_message(
            user_message=user_msg,
            chat_history=history,
            vault_notes=vault_notes,
            graph_nodes=graph_nodes,
            selected_node=selected_node_dict,
            on_started=lambda: self.status_bar.showMessage(t("ai_connecting", model=config.get_model_name())),
            on_progress=lambda msg: self.status_bar.showMessage(msg),
            on_chunk=self.ai_chat_panel.stream_ai_chunk if hasattr(self, "ai_chat_panel") else None,
            on_finished=self._on_ai_chat_complete,
            on_error=self._on_ai_chat_error
        )

    def _on_brainstorm_requested(self):
        """Brainstorms and expands graph specifically around the currently selected focus node."""
        if not self.selected_node_id or self.selected_node_id not in self.graph_state.nodes:
            QMessageBox.information(
                self,
                t("ai_chat_brainstorm_no_node_title"),
                t("ai_chat_brainstorm_no_node_msg")
            )
            return

        node = self.graph_state.nodes[self.selected_node_id]
        is_fa = (i18n.get_language() == "fa")
        prompt = (
            f"ایده‌های کلیدی نود «{node.title}» را تحلیل کن و ۳ نود مفهومی جدید در ارتباط با آن همراه با اتصالات آنها به گراف به صورت کامل به زبان فارسی پیشنهاد بده (در قالب بلوک actions) تا با تایید من به گراف اضافه شوند."
            if is_fa else
            f"Analyze key ideas of the selected node '{node.title}' and propose 3 new connected conceptual nodes for the graph in an actions block for my confirmation."
        )
        if hasattr(self, "ai_chat_panel"):
            self.ai_chat_panel.send_quick_prompt(prompt)

    def _on_ai_chat_complete(self, reply_text: str, actions: List[AIChatAction], auto_confirm: bool = False):
        """Executes autonomous AI graph actions with interactive user review and multi-selection dialog, and appends response to chat panel."""
        executed_actions: List[AIChatAction] = []
        nodes_modified = False

        # Filter valid actionable items
        valid_actions = [
            a for a in (actions or [])
            if (a.action_type == "add_node" and a.title.strip()) or (a.action_type in ("delete_node", "connect_nodes"))
        ]

        actions_to_execute: List[AIChatAction] = []
        if valid_actions and not auto_confirm:
            dialog = ActionReviewDialog(valid_actions, parent=self)
            if dialog.exec() == QDialog.DialogCode.Accepted:
                actions_to_execute = dialog.get_selected_actions()
            else:
                self.status_bar.showMessage(t("ai_action_declined"), 4000)
        elif auto_confirm:
            actions_to_execute = valid_actions

        if actions_to_execute:
            for act in actions_to_execute:
                if act.action_type == "add_node" and act.title.strip():
                    clean_title = act.title.strip()
                    existing = any(n.title.lower() == clean_title.lower() for n in self.graph_state.nodes.values())
                    if existing:
                        continue

                    # Position node intelligently
                    target_ids = []
                    target_items = []
                    for ct in act.connects_to:
                        for n in self.graph_state.nodes.values():
                            if n.title.lower() == ct.lower().strip():
                                target_ids.append(n.id)
                                it = self.graph_scene.node_items.get(n.id)
                                if it:
                                    target_items.append(it)
                                break

                    if target_items:
                        avg_x = sum(it.pos().x() for it in target_items) / len(target_items)
                        avg_y = sum(it.pos().y() for it in target_items) / len(target_items)
                        angle = len(self.graph_state.nodes) * 2.39996
                        node_x = round(avg_x + math.cos(angle) * 70.0, 1)
                        node_y = round(avg_y + math.sin(angle) * 70.0, 1)
                    else:
                        vp_rect = self.graph_view.viewport().rect()
                        center_pos = self.graph_view.mapToScene(vp_rect.center())
                        angle = len(self.graph_state.nodes) * 2.39996
                        node_x = round(center_pos.x() + math.cos(angle) * 45.0, 1)
                        node_y = round(center_pos.y() + math.sin(angle) * 45.0, 1)

                    node = NodeData(
                        title=clean_title,
                        content=act.content.strip(),
                        importance=act.importance,
                        tags=act.tags or ["ai-thought"],
                        x=node_x,
                        y=node_y
                    )
                    self.graph_state.add_node(node)
                    self.graph_scene.add_node_item(node, trigger_physics=False)

                    for tid in target_ids:
                        self.graph_state.add_edge(node.id, tid, weight=1.1, edge_type="explicit")
                        self.graph_scene.add_edge_item(node.id, tid, weight=1.1, edge_type="explicit")

                    if self.obsidian_service.is_valid_vault():
                        self.obsidian_service.save_node_to_markdown(node)

                    executed_actions.append(act)
                    nodes_modified = True

                elif act.action_type == "delete_node":
                    to_delete_id = None
                    if act.node_id and act.node_id in self.graph_state.nodes:
                        to_delete_id = act.node_id
                    else:
                        for n in self.graph_state.nodes.values():
                            if n.title.lower() == act.title.lower().strip():
                                to_delete_id = n.id
                                break
                    if to_delete_id:
                        node_obj = self.graph_state.get_node(to_delete_id)
                        if node_obj:
                            self.obsidian_service.delete_node_file(node_obj.id, node_obj.title)
                        self.graph_state.remove_node(to_delete_id)
                        self.graph_scene.remove_node_item(to_delete_id)
                        executed_actions.append(act)
                        nodes_modified = True

                elif act.action_type == "connect_nodes":
                    src_id = None
                    tgt_id = None
                    for n in self.graph_state.nodes.values():
                        if n.title.lower() == act.source_title.lower().strip():
                            src_id = n.id
                        if n.title.lower() == act.target_title.lower().strip():
                            tgt_id = n.id
                    if src_id and tgt_id and src_id != tgt_id:
                        self.graph_state.add_edge(src_id, tgt_id, weight=1.2, edge_type="explicit")
                        self.graph_scene.add_edge_item(src_id, tgt_id, weight=1.2, edge_type="explicit")
                        executed_actions.append(act)
                        nodes_modified = True

        if nodes_modified:
            self.obsidian_service.save_graph_state(self.graph_state)
            self.graph_scene.start_physics()
            self._refresh_node_list()
            self._update_graph_stats()
            self._update_notebook_stats()

        if hasattr(self, "ai_chat_panel"):
            self.ai_chat_panel.add_ai_message(reply_text, executed_actions, model_name=config.get_model_name())

        self.status_bar.showMessage(t("status_ready"), 3000)

    def _on_ai_chat_error(self, err_msg: str):
        if hasattr(self, "ai_chat_panel"):
            self.ai_chat_panel.add_error_message(err_msg)
        self.status_bar.showMessage(err_msg, 4000)

    def _update_highlight_btn_label(self, node: Optional[NodeData]):
        if not hasattr(self, "btn_highlight_panel"):
            return
        if not node or not getattr(node, "highlighted", False):
            self.btn_highlight_panel.setText(t("note_panel_btn_highlight"))
            return
        color = getattr(node, "highlight_color", "gold") or "gold"
        if color == "red":
            self.btn_highlight_panel.setText(t("note_panel_btn_highlight_red"))
        elif color == "green":
            self.btn_highlight_panel.setText(t("note_panel_btn_highlight_green"))
        else:
            self.btn_highlight_panel.setText(t("note_panel_btn_highlight_gold"))

    def _toggle_highlight_from_panel(self):
        if not self.selected_node_id:
            return
        node = self.graph_state.get_node(self.selected_node_id)
        if not node:
            return

        is_hl = getattr(node, "highlighted", False)
        current_color = getattr(node, "highlight_color", "gold")

        if not is_hl:
            node.highlighted = True
            node.highlight_color = "gold"
        elif current_color == "gold":
            node.highlighted = True
            node.highlight_color = "red"
        elif current_color == "red":
            node.highlighted = True
            node.highlight_color = "green"
        else:
            node.highlighted = False
            node.highlight_color = "gold"

        item = self.graph_scene.node_items.get(node.id)
        if item:
            item.refresh_data(node)
        if self.obsidian_service.is_valid_vault():
            self.obsidian_service.save_node_to_markdown(node)
        self.obsidian_service.save_graph_state(self.graph_state)
        self._update_highlight_btn_label(node)
        self.status_bar.showMessage(t("status_note_updated", title=node.title), 2500)

    def _on_node_highlight_toggled(self, node_id: str, highlighted: bool):
        node = self.graph_state.get_node(node_id)
        if node:
            node.highlighted = highlighted
            if self.obsidian_service.is_valid_vault():
                self.obsidian_service.save_node_to_markdown(node)
            self.obsidian_service.save_graph_state(self.graph_state)
            if self.selected_node_id == node_id:
                self._update_highlight_btn_label(node)

    def _on_node_moved(self, node_id: str, x: float, y: float):
        node = self.graph_state.get_node(node_id)
        if node:
            node.x = x
            node.y = y

    def _open_note_editor(self, node_id: str):
        node = self.graph_state.get_node(node_id)
        if not node:
            return

        dialog = NoteEditorDialog(node, self)
        dialog.saved.connect(self._on_node_saved)
        dialog.trigger_deep_dive.connect(self._trigger_deep_dive_for_node)
        dialog.trigger_socratic_questions.connect(self._generate_socratic_questions_for_node)
        dialog.exec()

    def _edit_selected_node(self):
        if self.selected_node_id:
            self._open_note_editor(self.selected_node_id)

    def _on_node_saved(self, node: NodeData):
        self.graph_state.nodes[node.id] = node
        
        item = self.graph_scene.node_items.get(node.id)
        if item:
            item.refresh_data(node)

        if self.obsidian_service.is_valid_vault():
            self.obsidian_service.save_node_to_markdown(node)
            self.obsidian_service.save_graph_state(self.graph_state)

        self._refresh_node_list()
        self._on_node_selected(node.id)
        self.status_bar.showMessage(t("status_note_updated", title=node.title), 3000)

    def _trigger_deep_dive_for_node(self, node_id: str):
        node = self.graph_state.get_node(node_id)
        if not node:
            return

        self.ai_progress.show()
        self.status_bar.showMessage(t("ai_analyzing", title=node.title))

        self.gemini_service.start_analysis(
            topic=node.title,
            context_notes=node.content,
            importance=node.importance,
            on_started=lambda: self.status_bar.showMessage(t("ai_connecting", model=config.get_model_name())),
            on_progress=lambda msg: self.status_bar.showMessage(msg),
            on_finished=lambda insights, socratic_questions=[]: self._on_deep_dive_complete(node, insights, socratic_questions),
            on_error=self._on_deep_dive_error
        )

    def _deep_dive_selected_node(self):
        if self.selected_node_id:
            self._trigger_deep_dive_for_node(self.selected_node_id)
        else:
            self._deep_dive_selected_or_prompt()

    def _deep_dive_selected_or_prompt(self):
        """Triggers full Gemini Deep-Dive Conceptual Breakdown Studio for the active or chosen topic."""
        if self.selected_node_id and self.selected_node_id in self.graph_state.nodes:
            self._trigger_deep_dive_for_node(self.selected_node_id)
            return

        # Check if user typed anything in chat input or top-bar thought input
        chat_text = ""
        if hasattr(self, "ai_chat_panel") and self.ai_chat_panel.input_edit:
            chat_text = self.ai_chat_panel.input_edit.toPlainText().strip()
        if not chat_text and hasattr(self, "input_thought"):
            chat_text = self.input_thought.text().strip()

        if chat_text:
            # Check if matching node exists
            existing = None
            for n in self.graph_state.nodes.values():
                if n.title.lower() == chat_text.lower():
                    existing = n
                    break
            if existing:
                self._trigger_deep_dive_for_node(existing.id)
            else:
                new_node = NodeData(title=chat_text, importance=8, tags=["deep-dive"])
                self.graph_state.add_node(new_node)
                self.graph_scene.add_node_item(new_node)
                self._trigger_deep_dive_for_node(new_node.id)
            if hasattr(self, "ai_chat_panel"):
                self.ai_chat_panel.input_edit.clear()
            return

        # If graph has nodes, ask or use the first node
        if self.graph_state.nodes:
            first_node = list(self.graph_state.nodes.values())[0]
            topic, ok = QInputDialog.getText(
                self,
                t("tab_radial"),
                t("top_thought_placeholder"),
                QLineEdit.EchoMode.Normal,
                first_node.title
            )
            if ok and topic.strip():
                clean_topic = topic.strip()
                match_node = None
                for n in self.graph_state.nodes.values():
                    if n.title.lower() == clean_topic.lower():
                        match_node = n
                        break
                if match_node:
                    self._trigger_deep_dive_for_node(match_node.id)
                else:
                    new_node = NodeData(title=clean_topic, importance=8, tags=["deep-dive"])
                    self.graph_state.add_node(new_node)
                    self.graph_scene.add_node_item(new_node)
                    self._trigger_deep_dive_for_node(new_node.id)
        else:
            topic, ok = QInputDialog.getText(
                self,
                t("tab_radial"),
                t("top_thought_placeholder"),
                QLineEdit.EchoMode.Normal,
                ""
            )
            if ok and topic.strip():
                new_node = NodeData(title=topic.strip(), importance=8, tags=["deep-dive"])
                self.graph_state.add_node(new_node)
                self.graph_scene.add_node_item(new_node)
                self._trigger_deep_dive_for_node(new_node.id)

    def _generate_socratic_questions_for_selected_node(self):
        if self.selected_node_id:
            self._generate_socratic_questions_for_node(self.selected_node_id)

    def _generate_socratic_questions_for_node(self, node_id: str):
        """Generates deep Socratic questions for a concept and appends to notes/graph."""
        node = self.graph_state.get_node(node_id)
        if not node:
            return

        if hasattr(self, "btn_socratic_panel") and self.btn_socratic_panel:
            self.btn_socratic_panel.setEnabled(False)
        self.ai_progress.show()
        self.status_bar.showMessage(t("ai_socratic_thinking", title=node.title), 3000)

        self.gemini_service.generate_socratic_questions(
            topic=node.title,
            context_notes=node.content,
            on_started=lambda: self.status_bar.showMessage(t("ai_connecting", model=config.get_model_name())),
            on_progress=lambda msg: self.status_bar.showMessage(msg),
            on_finished=lambda questions: self._on_socratic_questions_complete(node, questions),
            on_error=self._on_socratic_questions_error
        )

    def _on_socratic_questions_complete(self, node: NodeData, questions: List[str]):
        if hasattr(self, "btn_socratic_panel") and self.btn_socratic_panel:
            self.btn_socratic_panel.setEnabled(True)
        self.ai_progress.hide()

        if not questions:
            self.status_bar.showMessage(t("ai_socratic_failed"), 3000)
            return

        # 1. Format questions into markdown section
        header_text = t("ai_socratic_section_header")
        q_lines = [f"\n\n{header_text}"]
        for q in questions:
            q_lines.append(f"- [ ] *{q}*")
        q_block = "\n".join(q_lines)

        # 2. Append to note content
        if "## ❓ Socratic Questions" not in (node.content or ""):
            node.content = (node.content or "").rstrip() + q_block
        else:
            node.content = (node.content or "").rstrip() + "\n" + "\n".join(f"- [ ] *{q}*" for q in questions)

        if self.selected_node_id == node.id and hasattr(self, "note_panel_editor"):
            self.note_panel_editor.setPlainText(node.content)

        if self.obsidian_service.is_valid_vault():
            self.obsidian_service.save_node_to_markdown(node)
        self.obsidian_service.save_graph_state(self.graph_state)

        self.status_bar.showMessage(t("ai_socratic_complete", count=len(questions), title=node.title), 4000)

        # Ask if user wants to add them as visual thoughts to the graph
        preview_text = "\n".join(f"• {q}" for q in questions[:3]) + ("\n..." if len(questions) > 3 else "")
        reply = QMessageBox.question(
            self,
            t("ai_socratic_prompt_dialog_title"),
            t("ai_socratic_prompt_dialog_body", count=len(questions), title=node.title, preview=preview_text),
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )

        if reply == QMessageBox.StandardButton.Yes:
            for i, q in enumerate(questions):
                short_t = "❓ " + " ".join(q.split()[:6]) + ("..." if len(q.split()) > 6 else "")
                q_node = NodeData(
                    title=short_t,
                    content=f"### ❓ Socratic Inquiry for [[{node.title}]]:\n\n> *{q}*\n\n### Hypotheses & Reflections:\n- ",
                    importance=7,
                    tags=["socratic-question", "inquiry"],
                    x=node.x + (i * 30 - 45),
                    y=node.y + 110.0 + (i * 20)
                )
                self.graph_state.add_node(q_node)
                self.graph_scene.add_node_item(q_node, trigger_physics=False)
                self.graph_state.add_edge(node.id, q_node.id, weight=1.1, label="Socratic Inquiry")
                self.graph_scene.add_edge_item(node.id, q_node.id, weight=1.1, label="Socratic Inquiry")

            self.obsidian_service.save_graph_state(self.graph_state)
            self.graph_scene.start_physics()
            self._refresh_node_list()
            self._update_graph_stats()

    def _on_socratic_questions_error(self, err_msg: str):
        if hasattr(self, "btn_socratic_panel") and self.btn_socratic_panel:
            self.btn_socratic_panel.setEnabled(True)
        self.ai_progress.hide()
        self.status_bar.showMessage(t("ai_socratic_failed"), 3000)
        QMessageBox.warning(self, t("ai_socratic_failed"), err_msg)

    def _on_deep_dive_complete(self, parent_node: NodeData, insights: List[AIInsight], socratic_questions: Optional[List[str]] = None):
        self.ai_progress.hide()
        soc_count = len(socratic_questions or [])
        self.status_bar.showMessage(
            t("ai_deep_dive_complete", title=parent_node.title, count=len(insights), soc_count=soc_count),
            5000
        )

        # Populate and switch to AI Radial Studio tab
        self.radial_view.display_breakdown(parent_node.title, insights, parent_node.importance, socratic_questions or [])
        self.tabs.setCurrentIndex(1)

    def _on_deep_dive_error(self, error_msg: str):
        self.ai_progress.hide()
        self.status_bar.showMessage(t("ai_deep_dive_failed"), 4000)
        QMessageBox.warning(self, t("ai_deep_dive_failed"), error_msg)

    def _merge_insights_to_main_graph(self, central_topic: str, sub_nodes: list):
        """Merges edited/filtered AI insight nodes from the interactive studio into the main Knowledge Graph."""
        parent_node = None
        for n in self.graph_state.nodes.values():
            if n.title.lower() == central_topic.lower():
                parent_node = n
                break

        if not parent_node:
            parent_node = NodeData(title=central_topic, importance=8, tags=["ai-parent"])
            self.graph_state.add_node(parent_node)
            self.graph_scene.add_node_item(parent_node)

        count_added = 0
        for i, item in enumerate(sub_nodes):
            if isinstance(item, NodeData):
                topic = item.title
                content = item.content
                importance = item.importance
                tags = item.tags
            else:
                topic = item.topic
                content = f"**Relation:** {item.relation_type}\n\n{item.description}"
                importance = item.importance
                tags = ["ai-generated", item.relation_type.lower().replace(" ", "-")]

            existing = any(n.title.lower() == topic.lower() for n in self.graph_state.nodes.values())
            if existing:
                continue

            node = NodeData(
                title=topic,
                content=content,
                importance=importance,
                x=parent_node.x + (i * 25 - 50),
                y=parent_node.y + (i * 25 - 50),
                tags=tags
            )
            self.graph_state.add_node(node)
            self.graph_scene.add_node_item(node, trigger_physics=False)
            
            self.graph_state.add_edge(parent_node.id, node.id, weight=1.0)
            self.graph_scene.add_edge_item(parent_node.id, node.id, weight=1.0)
            count_added += 1

        self.obsidian_service.save_graph_state(self.graph_state)
        self.graph_scene.start_physics()
        self._refresh_node_list()
        self._update_graph_stats()
        self.tabs.setCurrentIndex(0)
        self.status_bar.showMessage(t("radial_merge_success", count=count_added), 4000)

    def _save_radial_to_note(self, central_topic: str, nodes_list: list, socratic_questions: Optional[list] = None):
        """Exports the AI breakdown and Socratic questions to an Obsidian note."""
        if not self.obsidian_service.is_valid_vault():
            QMessageBox.information(
                self,
                t("dialog_connect_vault_title"),
                t("dialog_connect_vault_body")
            )
            self._open_settings()
            return

        lines = [
            f"# AI Conceptual Breakdown: {central_topic}\n", 
            f"Generated by Gemini AI on {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n",
            "## Key Associations & Mental Models:\n"
        ]
        for item in nodes_list:
            if isinstance(item, NodeData):
                lines.append(f"### [[{item.title}]] (★{item.importance}/10)\n{item.content}\n")
            else:
                lines.append(f"### [[{item.topic}]] (★{item.importance}/10 — {item.relation_type})\n{item.description}\n")

        if socratic_questions:
            lines.append("\n## ❓ Socratic Questions for Deep Reflection:\n")
            for q in socratic_questions:
                lines.append(f"- [ ] *{q}*\n")

        content = "\n".join(lines)
        node = NodeData(
            title=f"Breakdown — {central_topic}",
            content=content,
            importance=8,
            tags=["gemini-breakdown", "ai", "socratic"]
        )
        file_path = self.obsidian_service.save_node_to_markdown(node)
        if file_path:
            QMessageBox.information(
                self,
                t("radial_export_success_title"),
                t("radial_export_success_body", filename=file_path.name)
            )

    def _on_add_child_text(self, parent_id: str):
        """Adds a child text sub-node connected to the specified parent node."""
        parent_node = self.graph_state.get_node(parent_id)
        if not parent_node:
            return

        topic, ok = QInputDialog.getText(
            self,
            t("dialog_add_subnode_title"),
            t("dialog_add_subnode_prompt"),
            QLineEdit.EchoMode.Normal,
            ""
        )
        if not ok or not topic.strip():
            return

        topic = topic.strip()
        connected_count = len([e for e in self.graph_state.edges if e.source_id == parent_id or e.target_id == parent_id])
        angle = connected_count * 1.05 + 0.6
        dist = 140.0
        new_x = round(parent_node.x + math.cos(angle) * dist, 1)
        new_y = round(parent_node.y + math.sin(angle) * dist, 1)

        child_importance = max(1, parent_node.importance - 1)
        tags = [parent_node.tags[0]] if parent_node.tags else ["thought"]
        child_node = NodeData(
            title=topic,
            importance=child_importance,
            x=new_x,
            y=new_y,
            tags=tags
        )
        self.graph_state.add_node(child_node)
        self.graph_scene.add_node_item(child_node, trigger_physics=False)

        edge_label = tags[0] if tags else ""
        self.graph_state.add_edge(parent_id, child_node.id, weight=1.2, label=edge_label, edge_type="explicit")
        self.graph_scene.add_edge_item(parent_id, child_node.id, weight=1.2, label=edge_label, edge_type="explicit")

        self.graph_scene.start_physics()
        if self.obsidian_service.is_valid_vault():
            self.obsidian_service.save_node_to_markdown(child_node)
        self.obsidian_service.save_graph_state(self.graph_state)
        self._refresh_node_list()
        self._update_graph_stats()
        self.status_bar.showMessage(t("status_thought_added", topic=topic), 3000)

    def _on_add_child_image(self, parent_id: str):
        """Adds a child image sub-node connected to the specified parent node."""
        parent_node = self.graph_state.get_node(parent_id)
        if not parent_node:
            return

        file_path, _ = QFileDialog.getOpenFileName(
            self,
            t("dialog_select_image_title"),
            "",
            t("dialog_image_files_filter")
        )
        if not file_path:
            return

        dialog = AddImageNodeDialog(
            image_path=file_path,
            initial_importance=max(1, parent_node.importance - 1),
            parent=self
        )
        if dialog.exec() != QDialog.DialogCode.Accepted:
            return

        node_title, image_size, importance = dialog.get_data()
        connected_count = len([e for e in self.graph_state.edges if e.source_id == parent_id or e.target_id == parent_id])
        angle = connected_count * 1.05 + 0.6
        dist = 160.0
        new_x = round(parent_node.x + math.cos(angle) * dist, 1)
        new_y = round(parent_node.y + math.sin(angle) * dist, 1)

        child_node = NodeData(
            title=node_title,
            node_type="image",
            image_path=file_path,
            image_size=image_size,
            importance=importance,
            x=new_x,
            y=new_y,
            tags=["image"]
        )
        self.graph_state.add_node(child_node)
        self.graph_scene.add_node_item(child_node, trigger_physics=False)

        self.graph_state.add_edge(parent_id, child_node.id, weight=1.2, label="image", edge_type="explicit")
        self.graph_scene.add_edge_item(parent_id, child_node.id, weight=1.2, label="image", edge_type="explicit")

        self.graph_scene.start_physics()
        if self.obsidian_service.is_valid_vault():
            self.obsidian_service.save_node_to_markdown(child_node)
        self.obsidian_service.save_graph_state(self.graph_state)
        self._refresh_node_list()
        self._update_graph_stats()
        self.status_bar.showMessage(t("status_thought_added", topic=node_title), 3000)

    def _on_edit_edge_label(self, source_id: str, target_id: str):
        """Edits the label / tag description of a link between two nodes."""
        curr_edge = next(
            (e for e in self.graph_state.edges if (e.source_id == source_id and e.target_id == target_id) or (e.source_id == target_id and e.target_id == source_id)),
            None
        )
        curr_label = curr_edge.label if curr_edge else ""
        new_label, ok = QInputDialog.getText(
            self,
            t("dialog_edit_edge_label_title"),
            t("dialog_edit_edge_label_prompt"),
            QLineEdit.EchoMode.Normal,
            curr_label
        )
        if ok:
            clean_label = new_label.strip()
            if curr_edge:
                curr_edge.label = clean_label
            for edge_item in self.graph_scene.edge_items:
                if (edge_item.source_item.node_data.id == source_id and edge_item.target_item.node_data.id == target_id) or \
                   (edge_item.source_item.node_data.id == target_id and edge_item.target_item.node_data.id == source_id):
                    edge_item.label = clean_label
                    edge_item.update()
            self.obsidian_service.save_graph_state(self.graph_state)
            self.status_bar.showMessage(t("status_link_label_updated"), 3000)

    def _connect_nodes(self, source_id: str, target_id: str):
        tgt = self.graph_state.nodes.get(target_id)
        default_label = tgt.tags[0] if (tgt and tgt.tags) else ""
        edge = self.graph_state.add_edge(source_id, target_id, weight=1.2, label=default_label, edge_type="explicit")
        if edge:
            self.graph_scene.add_edge_item(source_id, target_id, weight=1.2, label=default_label, edge_type="explicit")
            self.obsidian_service.save_graph_state(self.graph_state)
            self._update_graph_stats()
            src_t = self.graph_state.nodes[source_id].title if source_id in self.graph_state.nodes else source_id
            tgt_t = self.graph_state.nodes[target_id].title if target_id in self.graph_state.nodes else target_id
            self.status_bar.showMessage(t("status_link_connected", src=src_t, tgt=tgt_t), 3000)

    def _on_edge_selected(self, source_id: str, target_id: str):
        self.selected_node_id = None
        src_node = self.graph_state.get_node(source_id)
        tgt_node = self.graph_state.get_node(target_id)
        src_title = src_node.title if src_node else source_id
        tgt_title = tgt_node.title if tgt_node else target_id
        self.status_bar.showMessage(t("status_link_selected", src=src_title, tgt=tgt_title), 5000)

    def _delete_edge(self, source_id: str, target_id: str):
        src_node = self.graph_state.get_node(source_id)
        tgt_node = self.graph_state.get_node(target_id)
        src_title = src_node.title if src_node else source_id
        tgt_title = tgt_node.title if tgt_node else target_id

        self.graph_state.remove_edge(source_id, target_id)
        self.graph_scene.remove_edge_item(source_id, target_id)
        self.obsidian_service.save_graph_state(self.graph_state)
        self._update_graph_stats()
        self.status_bar.showMessage(t("status_link_removed", src=src_title, tgt=tgt_title), 3000)

    def _delete_node(self, node_id: str):
        node = self.graph_state.get_node(node_id)
        if not node:
            return

        has_notes = bool(node.content and node.content.strip())
        if has_notes:
            reply = QMessageBox.question(
                self,
                t("confirm_delete_title"),
                t("confirm_delete_body", title=node.title),
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
            )
            if reply != QMessageBox.StandardButton.Yes:
                return

        # Direct deletion from Obsidian Vault files & state
        self.obsidian_service.delete_node_file(node.id, node.title)
        self.graph_state.remove_node(node_id)
        self.graph_scene.remove_node_item(node_id)
        self.obsidian_service.save_graph_state(self.graph_state)
        if self.selected_node_id == node_id:
            self.selected_node_id = None
            self.lbl_insp_node_name.setText(t("sidebar_no_selection"))
            self.lbl_insp_details.setText(t("sidebar_select_hint"))
            self.btn_insp_edit.setEnabled(False)
            self.btn_insp_ai.setEnabled(False)
            if hasattr(self, "note_panel_title"):
                self.note_panel_title.clear()
                self.note_panel_tags.clear()
                self.note_panel_editor.clear()
                self.btn_save_note_panel.setEnabled(False)
                self.btn_deep_dive_panel.setEnabled(False)
                if hasattr(self, "btn_socratic_panel"):
                    self.btn_socratic_panel.setEnabled(False)
                if hasattr(self, "btn_highlight_panel"):
                    self.btn_highlight_panel.setText(t("note_panel_btn_highlight"))
                    self.btn_highlight_panel.setEnabled(False)
                self.lbl_note_panel_status.setText(t("note_panel_status_idle"))
                self.lbl_note_panel_status.setStyleSheet("color: #64748b; font-size: 11px;")
        self._refresh_node_list()
        self._update_graph_stats()
        self.status_bar.showMessage(t("status_node_deleted", title=node.title), 2500)

    def _refresh_node_list(self):
        self.list_nodes.clear()
        filter_text = self.edit_search.text().lower().strip()
        
        sorted_nodes = sorted(self.graph_state.nodes.values(), key=lambda n: n.importance, reverse=True)
        
        for node in sorted_nodes:
            if filter_text:
                match = (filter_text in node.title.lower()) or any(filter_text in t_tag.lower() for t_tag in node.tags)
                if not match:
                    continue

            item = QListWidgetItem(f"★{node.importance}  {node.title}")
            item.setData(Qt.ItemDataRole.UserRole, node.id)
            self.list_nodes.addItem(item)

    def _filter_node_list(self):
        self._refresh_node_list()

    def _on_list_item_clicked(self, item: QListWidgetItem):
        node_id = item.data(Qt.ItemDataRole.UserRole)
        if node_id:
            self._on_node_selected(node_id)
            node_item = self.graph_scene.node_items.get(node_id)
            if node_item:
                self.graph_view.centerOn(node_item)
                node_item.setSelected(True)

    def _on_list_item_double_clicked(self, item: QListWidgetItem):
        node_id = item.data(Qt.ItemDataRole.UserRole)
        if node_id:
            self._open_note_editor(node_id)

    def _toggle_physics_state(self):
        current = self.graph_scene.physics_enabled
        new_state = not current
        self.graph_scene.toggle_physics(new_state)
        self.btn_toggle_physics.setText(
            t("canvas_physics_on") if new_state else t("canvas_physics_off")
        )

    def _update_graph_stats(self):
        node_count = len(self.graph_state.nodes)
        edge_count = len(self.graph_state.edges)
        stats_text = t("sidebar_stats_nodes", nodes=node_count, edges=edge_count)
        self.lbl_stats_status.setText(stats_text)
        if hasattr(self, "lbl_sidebar_stats"):
            self.lbl_sidebar_stats.setText(stats_text)

    def quick_save_vault(self):
        """Instant synchronization of graph_state.json and Obsidian notes."""
        self.obsidian_service.save_graph_state(self.graph_state)
        self.status_bar.showMessage(t("status_saved_sync"), 2500)

    def _open_settings(self):
        dialog = SettingsDialog(self)
        dialog.settings_saved.connect(self._on_settings_updated)
        dialog.exec()

    def _on_settings_updated(self):
        vault_path = config.get_vault_path()
        self.obsidian_service.set_vault_path(vault_path)
        self._update_vault_status_label()

        physics_on = config.get_physics_enabled()
        self.graph_scene.toggle_physics(physics_on)
        self.btn_toggle_physics.setText(
            t("canvas_physics_on") if physics_on else t("canvas_physics_off")
        )
        # Apply updated theme across the entire application and views
        self.setStyleSheet(get_theme_qss())
        if hasattr(self, "graph_view"):
            self.graph_view.viewport().update()
        if hasattr(self, "radial_view") and hasattr(self.radial_view, "view"):
            self.radial_view.view.viewport().update()
        if hasattr(self, "ai_chat_panel"):
            self.ai_chat_panel.update_model_status()
            self.ai_chat_panel.update_theme_styling()
        self.status_bar.showMessage(t("status_settings_updated"), 3000)

    def closeEvent(self, event):
        """Persist graph state, stop live voice engine, and save coordinates when closing the window."""
        try:
            if hasattr(self, "ai_chat_panel"):
                self.ai_chat_panel._stop_live_voice()
            for node_id, item in self.graph_scene.node_items.items():
                node = self.graph_state.get_node(node_id)
                if node:
                    pos = item.pos()
                    node.x = pos.x()
                    node.y = pos.y()
            self.obsidian_service.save_graph_state(self.graph_state)
        except Exception as e:
            print(f"Error saving on close: {e}")
        event.accept()
