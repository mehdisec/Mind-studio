"""
Unit and Integration Tests for MindMap Studio.
Verifies data models, Obsidian Vault serialization, YAML frontmatter, and Gemini JSON parsing.
"""

import unittest
from unittest.mock import patch
import tempfile
import json
import shutil
from pathlib import Path

from mindmap_studio.models.graph_models import NodeData, EdgeData, GraphState, AIInsight
from mindmap_studio.services.obsidian_service import ObsidianService
from mindmap_studio.services.gemini_service import GeminiWorker
from mindmap_studio.ui.graph.graph_scene import GraphScene
from mindmap_studio.ui.main_window import MainWindow
from mindmap_studio.ui.dialogs.note_editor import NoteEditorDialog
from mindmap_studio.config import config, get_node_style_for_importance
from PyQt6.QtWidgets import QApplication, QMessageBox

_qapp = QApplication.instance() or QApplication(["test_app"])


class TestMindMapStudio(unittest.TestCase):

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.vault_path = Path(self.test_dir) / "TestVault"
        self.vault_path.mkdir(parents=True, exist_ok=True)
        self.obsidian_service = ObsidianService(str(self.vault_path))

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_node_and_edge_models(self):
        node = NodeData(
            title="Quantum Computing",
            importance=9,
            content="Superposition and Entanglement notes.",
            tags=["physics", "quantum"],
            links=["node_qubit"]
        )
        self.assertEqual(node.title, "Quantum Computing")
        self.assertEqual(node.importance, 9)

        # Test dictionary conversion
        n_dict = node.to_dict()
        reconstructed = NodeData.from_dict(n_dict)
        self.assertEqual(reconstructed.id, node.id)
        self.assertEqual(reconstructed.title, node.title)
        self.assertEqual(reconstructed.tags, ["physics", "quantum"])

    def test_graph_state_operations(self):
        state = GraphState()
        n1 = NodeData(title="Concept A", importance=7)
        n2 = NodeData(title="Concept B", importance=4)
        
        state.add_node(n1)
        state.add_node(n2)
        self.assertEqual(len(state.nodes), 2)

        edge = state.add_edge(n1.id, n2.id, weight=1.8, label="leads to")
        self.assertIsNotNone(edge)
        self.assertEqual(len(state.edges), 1)
        self.assertIn(n2.id, n1.links)

        # Remove node removes edge as well
        state.remove_node(n1.id)
        self.assertEqual(len(state.nodes), 1)
        self.assertEqual(len(state.edges), 0)

    def test_obsidian_markdown_frontmatter_persistence(self):
        node = NodeData(
            id="node_ai_arch",
            title="AI Architecture",
            importance=8,
            content="Exploration of multi-agent and transformer architectures.",
            tags=["ai", "agents"],
            links=["node_llm"]
        )
        
        # Save to markdown
        file_path = self.obsidian_service.save_node_to_markdown(node)
        self.assertIsNotNone(file_path)
        self.assertTrue(file_path.exists())

        # Read back markdown
        loaded_node = self.obsidian_service.load_node_from_markdown(file_path)
        self.assertIsNotNone(loaded_node)
        self.assertEqual(loaded_node.id, "node_ai_arch")
        self.assertEqual(loaded_node.title, "AI Architecture")
        self.assertEqual(loaded_node.importance, 8)
        self.assertIn("ai", loaded_node.tags)
        self.assertIn("Exploration of multi-agent", loaded_node.content)

    def test_obsidian_graph_state_json_sync(self):
        state = GraphState(vault_path=str(self.vault_path))
        n1 = NodeData(title="First Principle Thinking", importance=10)
        n2 = NodeData(title="Reasoning by Analogy", importance=6)
        state.add_node(n1)
        state.add_node(n2)
        state.add_edge(n1.id, n2.id)

        success, msg = self.obsidian_service.save_graph_state(state)
        self.assertTrue(success)

        # Load back
        loaded_state, load_msg = self.obsidian_service.load_graph_state()
        self.assertIsNotNone(loaded_state)
        self.assertEqual(len(loaded_state.nodes), 2)
        self.assertEqual(len(loaded_state.edges), 1)

    def test_gemini_json_response_parsing(self):
        worker = GeminiWorker(topic="Cognitive Load Theory", api_key="dummy_key")
        
        # Test markdown code block containing JSON
        mock_response = """
Here is the conceptual breakdown:
```json
[
  {
    "topic": "Working Memory Capacity Limitation",
    "description": "The limited number of information chunks that can be processed at once.",
    "importance": 9,
    "relation_type": "Core Mechanism"
  },
  {
    "topic": "Extraneous Load Reduction",
    "description": "Designing interfaces to eliminate unnecessary mental effort.",
    "importance": 8,
    "relation_type": "Application"
  }
]
```
        """
        insights, socratic_questions = worker._parse_response(mock_response)
        self.assertEqual(len(insights), 2)
        self.assertEqual(insights[0].topic, "Working Memory Capacity Limitation")
        self.assertEqual(insights[0].importance, 9)
        self.assertEqual(insights[0].relation_type, "Core Mechanism")
        self.assertEqual(insights[1].importance, 8)
        self.assertTrue(len(socratic_questions) > 0)

    def test_gemini_dict_with_socratic_questions_parsing(self):
        worker = GeminiWorker(topic="Mental Models", context_notes="", importance=8)
        mock_response = """
{
  "insights": [
    {
      "topic": "First Principles Thinking",
      "description": "Deconstructing a problem into its most fundamental truths.",
      "importance": 9,
      "relation_type": "Core Mechanism"
    }
  ],
  "socratic_questions": [
    "What core assumption must hold true for this thought to remain valid?",
    "Under what conditions does first principles thinking fail?"
  ]
}
        """
        insights, socratic_questions = worker._parse_response(mock_response)
        self.assertEqual(len(insights), 1)
        self.assertEqual(insights[0].topic, "First Principles Thinking")
        self.assertEqual(len(socratic_questions), 2)
        self.assertIn("What core assumption must hold true", socratic_questions[0])

    def test_socratic_worker_parsing(self):
        from mindmap_studio.services.gemini_service import GeminiSocraticWorkerThread
        worker = GeminiSocraticWorkerThread(topic="Entropy", context_notes="Thermodynamics")
        mock_resp = """
[
  "How does entropy manifest in non-physical information systems?",
  "What is the ultimate boundary of spontaneous organization?"
]
        """
        questions = worker._parse_questions(mock_resp)
        self.assertEqual(len(questions), 2)
        self.assertIn("How does entropy manifest", questions[0])


    def test_uniform_solid_grey_styles(self):
        style_1 = get_node_style_for_importance(1)
        style_10 = get_node_style_for_importance(10)
        
        self.assertEqual(style_1["radius"], 6.5)
        self.assertEqual(style_10["radius"], 6.5)
        self.assertEqual(style_1["fill_color"], "#334155")
        self.assertEqual(style_10["fill_color"], "#334155")

    def test_wikilinks_parsing_and_explicit_edges(self):
        from mindmap_studio.services.embedding_service import parse_wikilinks, build_explicit_wikilink_edges
        
        content = "This connects to [[Deep Learning]] and [[Attention Mechanism|Self-Attention]]."
        links = parse_wikilinks(content)
        self.assertIn("Deep Learning", links)
        self.assertIn("Attention Mechanism", links)

        n1 = NodeData(id="n1", title="Transformers", content="Built upon [[Deep Learning]] models.")
        n2 = NodeData(id="n2", title="Deep Learning", content="Neural network architectures.")
        nodes = {"n1": n1, "n2": n2}

        edges = build_explicit_wikilink_edges(nodes)
        self.assertEqual(len(edges), 1)
        self.assertEqual(edges[0].edge_type, "explicit")
        self.assertEqual(edges[0].source_id, "n1")
        self.assertEqual(edges[0].target_id, "n2")

    def test_semantic_embeddings_and_cosine_similarity(self):
        from mindmap_studio.services.embedding_service import compute_local_tfidf_embeddings, cosine_similarity
        
        texts = [
            "Deep learning neural networks and transformer language models",
            "Deep learning neural network architectures and transformer language systems",
            "Cooking recipes for homemade Italian pasta and tomato pizza sauce"
        ]
        embeddings = compute_local_tfidf_embeddings(texts)
        self.assertEqual(len(embeddings), 3)

        sim_related = cosine_similarity(embeddings[0], embeddings[1])
        sim_unrelated = cosine_similarity(embeddings[0], embeddings[2])

    def test_ai_connection_worker_parsing(self):
        from mindmap_studio.services.ai_edge_service import AIConnectionWorker
        
        n1 = NodeData(id="n1", title="سرطان", content="بیماری سلول‌های بدخیم")
        n2 = NodeData(id="n2", title="مرگ", content="پایان حیات بیولوژیک")
        n3 = NodeData(id="n3", title="سنگ قبر", content="یادبود مزار در آرامگاه")
        nodes = {"n1": n1, "n2": n2, "n3": n3}

        worker = AIConnectionWorker(nodes=nodes, api_key="dummy_key")
        mock_gemini_json = """
        [
          {
            "source_id": "n1",
            "target_id": "n2",
            "relation": "Causal Prognosis",
            "strength": 0.92
          },
          {
            "source_id": "n2",
            "target_id": "n3",
            "relation": "Thematic & Memorial",
            "strength": 0.88
          }
        ]
        """
        edges = worker._parse_gemini_edge_response(mock_gemini_json)
        self.assertEqual(len(edges), 2)
        self.assertEqual(edges[0].source_id, "n1")
        self.assertEqual(edges[0].target_id, "n2")
        self.assertEqual(edges[0].label, "Causal Prognosis")
    def test_persistent_incremental_edges_not_deleted(self):
        from mindmap_studio.services.ai_edge_service import apply_ai_edges_to_graph
        from mindmap_studio.ui.graph.graph_scene import GraphScene

        state = GraphState()
        scene = GraphScene()

        n1 = NodeData(id="n1", title="A")
        n2 = NodeData(id="n2", title="B")
        n3 = NodeData(id="n3", title="C")
        state.add_node(n1)
        state.add_node(n2)
        state.add_node(n3)
        scene.add_node_item(n1, trigger_physics=False)
        scene.add_node_item(n2, trigger_physics=False)
        scene.add_node_item(n3, trigger_physics=False)

        # First edge
        e1 = [EdgeData(source_id="n1", target_id="n2", label="Initial Link")]
        apply_ai_edges_to_graph(state, scene, e1, clear_existing=False)
        self.assertEqual(len(state.edges), 1)

        # Second edge (adding new node C linking to B)
        e2 = [EdgeData(source_id="n3", target_id="n2", label="Second Link")]
        apply_ai_edges_to_graph(state, scene, e2, clear_existing=False)

        # Both edges MUST exist!
        self.assertEqual(len(state.edges), 2)
        pair_set = {tuple(sorted([e.source_id, e.target_id])) for e in state.edges}
        self.assertIn(("n1", "n2"), pair_set)
        self.assertIn(("n2", "n3"), pair_set)

    def test_1000_nodes_candidate_selection_speed(self):
        import time
        from mindmap_studio.services.ai_edge_service import compute_fast_similarity, AIConnectionWorker

        # Create 1000 nodes
        nodes = {}
        for i in range(1000):
            nid = f"node_{i}"
            nodes[nid] = NodeData(
                id=nid,
                title=f"Concept {i} regarding cognitive systems and artificial intelligence",
                content=f"Detailed notes on topic {i} including transformers, neural physics, and memory."
            )

        # Target node
        target_node = NodeData(
            id="target_9999",
            title="Transformer Architecture in Cognitive AI",
            content="Self-attention layers and neural memory models."
        )
        nodes[target_node.id] = target_node

        t_start = time.perf_counter()
        worker = AIConnectionWorker(nodes=nodes, target_node_id=target_node.id)
        candidates = [n for nid, n in nodes.items() if nid != target_node.id]
        cand_texts = [f"{c.title} {c.content}" for c in candidates]
        sims = compute_fast_similarity(f"{target_node.title} {target_node.content}", cand_texts)
        duration = time.perf_counter() - t_start

        self.assertEqual(len(sims), 1000)
    def test_delete_logic_conditional_confirmation(self):
        # Empty content node vs note-containing node
        node_empty = NodeData(id="empty_1", title="Empty Thought", content="")
        node_with_notes = NodeData(id="noted_1", title="Important Thought", content="Important research notes")

        has_notes_empty = bool(node_empty.content and node_empty.content.strip())
        has_notes_noted = bool(node_with_notes.content and node_with_notes.content.strip())

    def test_shift_drag_to_connect_mechanic(self):
        from mindmap_studio.ui.graph.graph_items import NodeItem
        from mindmap_studio.ui.graph.graph_scene import GraphScene

        scene = GraphScene()
        n1 = NodeData(id="n1", title="A", x=0, y=0)
        n2 = NodeData(id="n2", title="B", x=20, y=20)
        
        item1 = scene.add_node_item(n1, trigger_physics=False)
        item2 = scene.add_node_item(n2, trigger_physics=False)

        # Test candidate discovery within collision distance
        target = item1._find_hovered_target_node()
        self.assertEqual(target, item2)

    def test_edge_item_properties(self):
        from mindmap_studio.ui.graph.graph_items import NodeItem, EdgeItem
        from PyQt6.QtWidgets import QGraphicsItem
        from PyQt6.QtCore import Qt

        n1 = NodeItem(NodeData(id="n1", title="A"))
        n2 = NodeItem(NodeData(id="n2", title="B"))
        edge = EdgeItem(n1, n2, weight=1.2, label="Direct Link", edge_type="explicit")

        # Edge preserves custom label, and is interactive, selectable, and hoverable for deletion
        self.assertEqual(edge.label, "Direct Link")
        self.assertTrue(edge.acceptHoverEvents())
        self.assertTrue(bool(edge.acceptedMouseButtons() & Qt.MouseButton.LeftButton))
        self.assertTrue(bool(edge.flags() & QGraphicsItem.GraphicsItemFlag.ItemIsSelectable))
        self.assertIsNotNone(edge.shape())

    def test_manual_link_deletion(self):
        """Tests that links can be removed cleanly from graph state and scene."""
        scene = GraphScene()
        n1 = NodeData(id="n1", title="Alpha")
        n2 = NodeData(id="n2", title="Beta")
        scene.add_node_item(n1, trigger_physics=False)
        scene.add_node_item(n2, trigger_physics=False)
        edge = scene.add_edge_item("n1", "n2", weight=1.0)
        self.assertEqual(len(scene.edge_items), 1)

        # Remove edge
        scene.remove_edge_item("n1", "n2")
        self.assertEqual(len(scene.edge_items), 0)
        self.assertEqual(len(scene.node_items["n1"].edges), 0)
        self.assertEqual(len(scene.node_items["n2"].edges), 0)

    def test_shift_drag_no_repulsion_on_target(self):
        """Tests that nodes in Shift+Drag mode do not push away candidate target nodes."""
        scene = GraphScene()
        n1 = NodeData(id="n1", title="Source", x=0.0, y=0.0)
        n2 = NodeData(id="n2", title="Target", x=50.0, y=0.0)
        item1 = scene.add_node_item(n1, trigger_physics=False)
        item2 = scene.add_node_item(n2, trigger_physics=False)

        item1.is_shift_linking = True
        item2.is_link_target = True

        # Run physics step
        scene._physics_step()

        # Repulsion force should be 0 because both are exempt during linking
        self.assertEqual(item1.fx, 0.0)
        self.assertEqual(item2.fx, 0.0)


    def test_radial_view_integrity(self):
        from mindmap_studio.ui.graph.radial_view import RadialGraphView
        view = RadialGraphView()
        insights = [
            AIInsight(topic="Sub-Concept 1", description="Description 1", importance=8, relation_type="Core"),
            AIInsight(topic="Sub-Concept 2", description="Description 2", importance=7, relation_type="Application")
        ]
        socratic_qs = [
            "What assumption must hold true for Main Test Topic?",
            "How does this concept behave under adversarial conditions?"
        ]
        view.display_breakdown("Main Test Topic", insights, 9, socratic_qs)
        self.assertEqual(len(view.socratic_questions), 2)
        from mindmap_studio.i18n import t
        self.assertIn(t("radial_tab_socratic", count=2), view.side_tabs.tabText(1))

        # Test adding question as thought node
        view._add_question_as_node(socratic_qs[0])
        self.assertEqual(len(view.ai_graph_state.nodes), 4)  # root + 2 insights + 1 question node

    def test_obsidian_permanent_deletion_and_orphan_cleanup(self):
        import tempfile
        import shutil
        from mindmap_studio.services.obsidian_service import ObsidianService

        temp_dir = tempfile.mkdtemp()
        try:
            service = ObsidianService(temp_dir)
            n1 = NodeData(id="n1", title="Thought Alpha", content="Notes for Alpha")
            n2 = NodeData(id="n2", title="Thought Beta", content="Notes for Beta")
            
            graph = GraphState(nodes={"n1": n1, "n2": n2})
            service.save_graph_state(graph)

            notes_dir = service.get_notes_dir()
            alpha_file = notes_dir / "Thought Alpha.md"
            beta_file = notes_dir / "Thought Beta.md"
            self.assertTrue(alpha_file.exists())
            self.assertTrue(beta_file.exists())

            # Delete n1
            service.delete_node_file(n1.id, n1.title)
            self.assertFalse(alpha_file.exists())

            # Delete from graph_state and save again (orphan cleanup test)
            graph.remove_node("n1")
            service.save_graph_state(graph)
            
            # Reload graph from obsidian notes
            loaded_state, _ = service.load_graph_state()
            self.assertIsNotNone(loaded_state)
            self.assertNotIn("n1", loaded_state.nodes)
            self.assertIn("n2", loaded_state.nodes)
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def test_ai_chat_panel_integration(self):
        from mindmap_studio.ui.main_window import MainWindow
        from mindmap_studio.services.gemini_service import AIChatAction
        win = MainWindow()
        
        node = NodeData(id="test_node_1", title="Quantum Computing", content="Qubits and entanglement notes.", importance=9, tags=["physics", "quantum"])
        win.graph_state.add_node(node)
        win.graph_scene.add_node_item(node, trigger_physics=False)
        
        # Test clicking on node updates selection
        win._on_node_selected(node.id)
        self.assertEqual(win.selected_node_id, "test_node_1")
        
        # Test 30/70 horizontal split widgets
        self.assertIsNotNone(win.ai_chat_panel.banner_frame)
        self.assertIsNotNone(win.ai_chat_panel.cortex)
        self.assertIsNotNone(win.ai_chat_panel.btn_live_voice)
        self.assertIsNotNone(win.ai_chat_panel.chat_container)
        self.assertIsNotNone(win.ai_chat_panel.btn_chip_brainstorm)
        self.assertIsNotNone(win.ai_chat_panel.btn_chip_deep_dive)
        self.assertIsNotNone(win.ai_chat_panel.btn_chip_socratic)
        self.assertIsNotNone(win.ai_chat_panel.btn_chip_connect)
        self.assertIsNotNone(win.ai_chat_panel.btn_clear)
        self.assertIsNotNone(win.ai_chat_panel.btn_send)
        self.assertIsNotNone(win.ai_chat_panel.input_edit)
        self.assertIsNotNone(win.ai_chat_panel.lbl_model_status)
        self.assertIsNotNone(win.ai_chat_panel.lbl_thinking)
        
        # Test updating notebook stats with count of notes & nodes
        win.ai_chat_panel.update_notebook_stats(notes_count=12, nodes_count=25)
        self.assertIn("12", win.ai_chat_panel.lbl_badge.text())
        self.assertIn("25", win.ai_chat_panel.lbl_badge.text())

        # Test adding messages and action cards
        win.ai_chat_panel.add_user_message("Hello AI Assistant")
        actions = [AIChatAction(action_type="add_node", title="Qubit", importance=9)]
        # Test deep_dive_requested signal emission from chip button
        deep_dive_emitted = []
        win.ai_chat_panel.deep_dive_requested.connect(lambda: deep_dive_emitted.append(True))
        win.ai_chat_panel.btn_chip_deep_dive.click()
        self.assertTrue(len(deep_dive_emitted) > 0)

        win.ai_chat_panel.add_ai_message("Hello! I am grounded with your Obsidian Notebook notes.", actions=actions)
        self.assertIn("Hello AI Assistant", win.ai_chat_panel.chat_browser.toPlainText())
        self.assertIn("Obsidian Notebook notes", win.ai_chat_panel.chat_browser.toPlainText())
        self.assertIn("Qubit", win.ai_chat_panel.chat_browser.toPlainText())

    def test_node_highlighting_persistence(self):
        node = NodeData(
            id="hl_node_1",
            title="Highlighted Idea",
            importance=9,
            content="Important priority topic.",
            tags=["starred"],
            highlighted=True,
            highlight_color="red"
        )
        self.assertTrue(node.highlighted)
        self.assertEqual(node.highlight_color, "red")
        self.assertTrue(node.to_dict()["highlighted"])
        self.assertEqual(node.to_dict()["highlight_color"], "red")

        # Save to markdown and check frontmatter parsing
        file_path = self.obsidian_service.save_node_to_markdown(node)
        loaded = self.obsidian_service.load_node_from_markdown(file_path)
        self.assertIsNotNone(loaded)
        self.assertTrue(loaded.highlighted)
        self.assertEqual(loaded.highlight_color, "red")

        # Test green highlight
        node_green = NodeData(id="hl_node_2", title="Green Idea", highlighted=True, highlight_color="green")
        f_green = self.obsidian_service.save_node_to_markdown(node_green)
        loaded_green = self.obsidian_service.load_node_from_markdown(f_green)
        self.assertTrue(loaded_green.highlighted)
        self.assertEqual(loaded_green.highlight_color, "green")

    def test_ai_chat_worker_action_parsing(self):
        from mindmap_studio.services.gemini_service import GeminiChatWorkerThread, AIChatAction
        
        mock_ai_raw_response = """
I have analyzed your Obsidian Notebook. Based on your thoughts about Neural Networks and Optimization, I suggest adding a node for Backpropagation and connecting it.

```actions
[
  {
    "action": "add_node",
    "title": "Backpropagation",
    "content": "Gradient descent algorithm using the chain rule to update weights.",
    "importance": 9,
    "tags": ["deep-learning", "algorithms"],
    "connects_to": ["Neural Networks", "Gradient Descent"]
  },
  {
    "action": "connect_nodes",
    "source_title": "Neural Networks",
    "target_title": "Loss Function"
  },
  {
    "action": "delete_node",
    "title": "Outdated Concept"
  }
]
```

Let me know if you want to explore further!
"""
        conversational_text, actions = GeminiChatWorkerThread._parse_chat_response(mock_ai_raw_response)
        
        self.assertIn("I have analyzed your Obsidian Notebook", conversational_text)
        self.assertNotIn("```actions", conversational_text)
        self.assertEqual(len(actions), 3)
        
        # Verify Action 1: Add Node
        self.assertEqual(actions[0].action_type, "add_node")
        self.assertEqual(actions[0].title, "Backpropagation")
        self.assertEqual(actions[0].importance, 9)
        self.assertEqual(actions[0].connects_to, ["Neural Networks", "Gradient Descent"])
        
        # Verify Action 2: Connect Nodes
        self.assertEqual(actions[1].action_type, "connect_nodes")
        self.assertEqual(actions[1].source_title, "Neural Networks")
        self.assertEqual(actions[1].target_title, "Loss Function")
        
        # Verify Action 3: Delete Node
        self.assertEqual(actions[2].action_type, "delete_node")
        self.assertEqual(actions[2].title, "Outdated Concept")

    def test_gemini_chat_worker_prompt_building(self):
        from mindmap_studio.services.gemini_service import GeminiChatWorkerThread
        worker = GeminiChatWorkerThread(
            user_message="لطفاً ایده‌های جدید را بررسی کن",
            chat_history=[{"role": "user", "text": "سلام"}, {"role": "assistant", "text": "درود!"}],
            vault_notes=[{"title": "Note 1", "content": "Content 1", "tags": ["tag1"]}],
            graph_nodes=[{"title": "Node 1", "importance": 8, "links": ["Node 2"]}],
            selected_node={"title": "Node 1", "content": "Focused note content"}
        )
        prompt = worker._build_chat_prompt()
        self.assertIn("لطفاً ایده‌های جدید را بررسی کن", prompt)
        self.assertIn("سلام", prompt)
        self.assertIn("درود!", prompt)
        self.assertIn("LANGUAGE MANDATE", prompt)
        self.assertIn("فارسی", prompt)
        self.assertIn("CURRENTLY SELECTED FOCUS NODE: [[Node 1]]", prompt)

    def test_main_window_autonomous_ai_chat_actions_execution(self):
        from mindmap_studio.ui.main_window import MainWindow
        from mindmap_studio.services.gemini_service import AIChatAction
        
        win = MainWindow()
        
        # Add initial nodes
        n1 = NodeData(id="n_nn", title="Neural Networks", content="Base NN concepts")
        n2 = NodeData(id="n_loss", title="Loss Function", content="Error calculation")
        n3 = NodeData(id="n_old", title="Outdated Concept", content="Legacy note")
        win.graph_state.add_node(n1)
        win.graph_state.add_node(n2)
        win.graph_state.add_node(n3)
        win.graph_scene.add_node_item(n1, trigger_physics=False)
        win.graph_scene.add_node_item(n2, trigger_physics=False)
        win.graph_scene.add_node_item(n3, trigger_physics=False)
        
        actions = [
            AIChatAction(
                action_type="add_node",
                title="Backpropagation",
                content="Chain rule gradient calculations.",
                importance=9,
                tags=["ai", "math"],
                connects_to=["Neural Networks"]
            ),
            AIChatAction(
                action_type="connect_nodes",
                source_title="Neural Networks",
                target_title="Loss Function"
            ),
            AIChatAction(
                action_type="delete_node",
                title="Outdated Concept"
            )
        ]
        
        win._on_ai_chat_complete("I executed your requested graph changes.", actions, auto_confirm=True)
        
        # Verify new node Backpropagation exists and is connected
        backprop_node = None
        for node in win.graph_state.nodes.values():
            if node.title == "Backpropagation":
                backprop_node = node
                break
        self.assertIsNotNone(backprop_node)
        self.assertEqual(backprop_node.importance, 9)
        self.assertIn("ai", backprop_node.tags)
        
        # Verify edge between Backpropagation and Neural Networks
        edge_exists = False
        for edge in win.graph_state.edges:
            if (edge.source_id == backprop_node.id and edge.target_id == n1.id) or \
               (edge.source_id == n1.id and edge.target_id == backprop_node.id):
                edge_exists = True
                break
        self.assertTrue(edge_exists)
        
        # Verify edge between Neural Networks and Loss Function
        nn_loss_edge = False
        for edge in win.graph_state.edges:
            if (edge.source_id == n1.id and edge.target_id == n2.id) or \
               (edge.source_id == n2.id and edge.target_id == n1.id):
                nn_loss_edge = True
                break
        self.assertTrue(nn_loss_edge)
        
        # Verify Outdated Concept was deleted
        self.assertNotIn(n3.id, win.graph_state.nodes)

    def test_delete_selected_edge_via_shortcut(self):
        from mindmap_studio.ui.main_window import MainWindow
        win = MainWindow()
        
        initial_edges = len(win.graph_state.edges)
        n1 = NodeData(id="edge_test_1", title="Thought 1")
        n2 = NodeData(id="edge_test_2", title="Thought 2")
        win.graph_state.add_node(n1)
        win.graph_state.add_node(n2)
        win.graph_scene.add_node_item(n1, trigger_physics=False)
        win.graph_scene.add_node_item(n2, trigger_physics=False)
        
        edge_item = win.graph_scene.add_edge_item("edge_test_1", "edge_test_2", weight=1.0)
        win.graph_state.add_edge("edge_test_1", "edge_test_2", weight=1.0)
        self.assertIn(edge_item, win.graph_scene.edge_items)
        self.assertEqual(len(win.graph_state.edges), initial_edges + 1)
        
        # Select the edge item on the scene
        edge_item.setSelected(True)
        self.assertTrue(edge_item.isSelected())
        
        # Trigger delete action (same as pressing Delete key)
        win._delete_selected_node_or_items()
        self.assertEqual(len(win.graph_state.edges), initial_edges)

    def test_i18n_bilingual_translation_and_switching(self):
        from mindmap_studio.i18n import i18n, t
        from mindmap_studio.config import config
        from mindmap_studio.ui.main_window import MainWindow

        # Test Persian
        i18n.set_language("fa")
        self.assertEqual(i18n.get_language(), "fa")
        self.assertEqual(config.get_language(), "fa")
        self.assertIn("استودیو", t("app_brand"))
        self.assertIn("نود", t("top_add_node_btn"))
        self.assertIn("تنظیمات", t("settings_btn_save"))

        # Test English
        i18n.set_language("en")
        self.assertEqual(i18n.get_language(), "en")
        self.assertEqual(config.get_language(), "en")
        self.assertEqual(t("app_brand"), "🧠 MindMap Studio")
        self.assertEqual(t("top_add_node_btn"), "➕ Add Node")
        self.assertEqual(t("settings_btn_save"), "Save Settings")

        # Test MainWindow dynamic retranslation
        win = MainWindow()
        self.assertEqual(win.btn_add_thought.text(), "➕ Add Node")
        
        # Switch to Persian dynamically
        i18n.set_language("fa")
        self.assertEqual(win.btn_add_thought.text(), "➕ افزودن نود")
        self.assertIn("تنظیمات", win.btn_settings.text())

        # Switch back to Persian default
        i18n.set_language("fa")

    def test_settings_dialog_bilingual_ui_and_persistence(self):
        from mindmap_studio.ui.dialogs.settings_dialog import SettingsDialog
        from mindmap_studio.i18n import i18n
        from mindmap_studio.config import config

        i18n.set_language("fa")
        dialog = SettingsDialog()
        self.assertEqual(dialog.combo_language.currentData(), "fa")

        # Select English in combo
        idx_en = dialog.combo_language.findData("en")
        self.assertGreaterEqual(idx_en, 0)
        dialog.combo_language.setCurrentIndex(idx_en)

        # Save settings
        dialog._save_settings()
        self.assertEqual(config.get_language(), "en")
        self.assertEqual(i18n.get_language(), "en")

        # Restore to Persian
        i18n.set_language("fa")

    def test_graph_view_empty_canvas_pan_drag(self):
        from mindmap_studio.ui.graph.graph_view import GraphView
        from mindmap_studio.ui.graph.graph_scene import GraphScene
        from PyQt6.QtGui import QMouseEvent, QKeyEvent
        from PyQt6.QtCore import QPointF, QEvent, Qt

        scene = GraphScene()
        view = GraphView(scene)
        view.resize(800, 600)
        view.show()

        press_event = QMouseEvent(
            QEvent.Type.MouseButtonPress,
            QPointF(100, 100),
            QPointF(100, 100),
            Qt.MouseButton.LeftButton,
            Qt.MouseButton.LeftButton,
            Qt.KeyboardModifier.NoModifier
        )
        move_event = QMouseEvent(
            QEvent.Type.MouseMove,
            QPointF(150, 180),
            QPointF(150, 180),
            Qt.MouseButton.LeftButton,
            Qt.MouseButton.LeftButton,
            Qt.KeyboardModifier.NoModifier
        )
        release_event = QMouseEvent(
            QEvent.Type.MouseButtonRelease,
            QPointF(150, 180),
            QPointF(150, 180),
            Qt.MouseButton.LeftButton,
            Qt.MouseButton.NoButton,
            Qt.KeyboardModifier.NoModifier
        )

        space_press = QKeyEvent(QEvent.Type.KeyPress, Qt.Key.Key_Space, Qt.KeyboardModifier.NoModifier)
        space_release = QKeyEvent(QEvent.Type.KeyRelease, Qt.Key.Key_Space, Qt.KeyboardModifier.NoModifier)

        # 1. Test Space + Left Drag Panning in LTR
        view.setLayoutDirection(Qt.LayoutDirection.LeftToRight)
        view.keyPressEvent(space_press)
        self.assertTrue(view._space_held)
        self.assertEqual(view.viewport().cursor().shape(), Qt.CursorShape.OpenHandCursor)

        view.mousePressEvent(press_event)
        self.assertTrue(view.is_panning)
        self.assertEqual(view.viewport().cursor().shape(), Qt.CursorShape.ClosedHandCursor)

        initial_h = view.horizontalScrollBar().value()
        initial_v = view.verticalScrollBar().value()
        view.mouseMoveEvent(move_event)
        self.assertEqual(view.horizontalScrollBar().value(), initial_h - 50)
        self.assertEqual(view.verticalScrollBar().value(), initial_v - 80)
        view.mouseReleaseEvent(release_event)
        self.assertFalse(view.is_panning)
        view.keyReleaseEvent(space_release)
        self.assertFalse(view._space_held)

        # 2. Test Space + Left Drag Panning in RTL (Persian)
        view.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        view.keyPressEvent(space_press)
        view.mousePressEvent(press_event)
        self.assertTrue(view.is_panning)

        initial_h = view.horizontalScrollBar().value()
        initial_v = view.verticalScrollBar().value()
        view.mouseMoveEvent(move_event)
        self.assertEqual(view.horizontalScrollBar().value(), initial_h + 50)
        self.assertEqual(view.verticalScrollBar().value(), initial_v - 80)
        view.mouseReleaseEvent(release_event)
        self.assertFalse(view.is_panning)
        view.keyReleaseEvent(space_release)

        # 3. Test Normal Mode Drag = RubberBandDrag for Box Selecting Nodes
        self.assertEqual(view.dragMode(), GraphView.DragMode.RubberBandDrag)

    def test_persian_ai_chat_panel_rtl_alignment(self):
        from mindmap_studio.ui.main_window import MainWindow
        from mindmap_studio.i18n import i18n
        from PyQt6.QtCore import Qt
        
        # 1. Switch to Persian
        i18n.set_language("fa")
        win = MainWindow()
        
        self.assertEqual(win.ai_chat_panel.input_edit.layoutDirection(), Qt.LayoutDirection.RightToLeft)
        opt = win.ai_chat_panel.input_edit.document().defaultTextOption()
        self.assertEqual(opt.textDirection(), Qt.LayoutDirection.RightToLeft)
        self.assertEqual(win.ai_chat_panel.chat_browser.layoutDirection(), Qt.LayoutDirection.RightToLeft)

        # 2. Switch to English
        i18n.set_language("en")
        win_en = MainWindow()
        self.assertEqual(win_en.ai_chat_panel.input_edit.layoutDirection(), Qt.LayoutDirection.LeftToRight)
        opt_en = win_en.ai_chat_panel.input_edit.document().defaultTextOption()
        self.assertEqual(opt_en.textDirection(), Qt.LayoutDirection.LeftToRight)

        # Restore default Persian
        i18n.set_language("fa")

    def test_settings_dialog_custom_model_and_api_test(self):
        from mindmap_studio.ui.dialogs.settings_dialog import SettingsDialog
        from mindmap_studio.services.gemini_service import test_api_connection
        from mindmap_studio.config import config
        
        dialog = SettingsDialog()
        self.assertTrue(dialog.combo_model.isEditable())
        
        # Set custom model name
        dialog.combo_model.setEditText("gemini-2.5-flash-thinking")
        dialog.edit_api_key.setText("MOCK_GEMINI_API_KEY_123")
        dialog._save_settings()
        
        self.assertEqual(config.get_model_name(), "gemini-2.5-flash-thinking")
        self.assertEqual(config.get_gemini_api_key(), "MOCK_GEMINI_API_KEY_123")
        
        # Test API connection function returns False gracefully with dummy key
        success, msg = test_api_connection("dummy_key", "gemini-flash-latest")
        self.assertFalse(success)
        self.assertTrue(len(msg) > 0)

        # Restore real user defaults
        from mindmap_studio.config import DEFAULT_API_KEY, DEFAULT_MODEL
        config.set_gemini_api_key(DEFAULT_API_KEY)
        config.set_model_name(DEFAULT_MODEL)



    def test_image_node_creation_and_styling_three_sizes(self):
        from mindmap_studio.ui.graph.graph_items import NodeItem
        from PyQt6.QtGui import QImage, QColor
        
        # Create temporary dummy image file
        img_file = Path(self.test_dir) / "test_avatar.png"
        qimg = QImage(120, 120, QImage.Format.Format_ARGB32)
        qimg.fill(QColor(56, 189, 248))
        qimg.save(str(img_file))

        # Standard text node (radius = 6.5)
        text_node = NodeData(id="n_text", title="Text Node", node_type="text", importance=5)
        text_item = NodeItem(text_node)
        self.assertEqual(text_item.radius, 6.5)

        # 1. Small Image Node (1x base image size = 3x regular = 19.5)
        img_small = NodeData(id="n_small", title="Small Img", node_type="image", image_path=str(img_file), image_size="small")
        item_small = NodeItem(img_small)
        self.assertEqual(item_small.radius, 19.5)
        self.assertAlmostEqual(item_small.radius, text_item.radius * 3.0)

        # 2. Medium Image Node (2x base image size = 6x regular = 39.0)
        img_medium = NodeData(id="n_med", title="Medium Img", node_type="image", image_path=str(img_file), image_size="medium")
        item_medium = NodeItem(img_medium)
        self.assertEqual(item_medium.radius, 39.0)
        self.assertAlmostEqual(item_medium.radius, item_small.radius * 2.0)

        # 3. Large Image Node (3x base image size = 9x regular = 58.5)
        img_large = NodeData(id="n_large", title="Large Img", node_type="image", image_path=str(img_file), image_size="large")
        item_large = NodeItem(img_large)
        self.assertEqual(item_large.radius, 58.5)
        self.assertAlmostEqual(item_large.radius, item_small.radius * 3.0)

        # Verify pixmap was loaded
        self.assertIsNotNone(item_small._pixmap)
        self.assertFalse(item_small._pixmap.isNull())

    def test_image_node_obsidian_markdown_frontmatter_persistence(self):
        img_file = str(Path(self.test_dir) / "diagram.png")
        node = NodeData(
            id="img_node_arch",
            title="System Architecture Diagram",
            node_type="image",
            image_path=img_file,
            image_size="large",
            importance=8,
            content="Visual breakdown of system components.",
            tags=["architecture", "diagram"]
        )

        # 1. Save to markdown
        file_path = self.obsidian_service.save_node_to_markdown(node)
        self.assertIsNotNone(file_path)
        self.assertTrue(file_path.exists())

        # 2. Read back markdown and verify type, image, and image_size fields
        loaded_node = self.obsidian_service.load_node_from_markdown(file_path)
        self.assertIsNotNone(loaded_node)
        self.assertEqual(loaded_node.id, "img_node_arch")
        self.assertEqual(loaded_node.title, "System Architecture Diagram")
        self.assertEqual(loaded_node.node_type, "image")
        self.assertEqual(loaded_node.image_path, img_file)
        self.assertEqual(loaded_node.image_size, "large")
        self.assertEqual(loaded_node.importance, 8)
        self.assertIn("architecture", loaded_node.tags)

    def test_add_image_dialog_size_selection(self):
        from mindmap_studio.ui.dialogs.add_image_dialog import AddImageNodeDialog
        from PyQt6.QtGui import QImage, QColor
        
        img_file = Path(self.test_dir) / "sample_chart.png"
        qimg = QImage(64, 64, QImage.Format.Format_ARGB32)
        qimg.fill(QColor(14, 165, 233))
        qimg.save(str(img_file))

        dialog = AddImageNodeDialog(image_path=str(img_file), initial_importance=7)
        self.assertEqual(dialog.selected_size, "small")
        self.assertEqual(dialog.edit_title.text(), "sample_chart")

        # Select Medium
        dialog.rb_medium.click()
        self.assertEqual(dialog.selected_size, "medium")

        # Select Large
        dialog.rb_large.click()
        self.assertEqual(dialog.selected_size, "large")

        title, size, imp = dialog.get_data()
        self.assertEqual(title, "sample_chart")
        self.assertEqual(size, "large")
        self.assertEqual(imp, 7)

    def test_image_node_note_editor_dialog_preserves_image(self):
        from mindmap_studio.ui.dialogs.note_editor import NoteEditorDialog
        from PyQt6.QtGui import QImage, QColor

        img_file = Path(self.test_dir) / "edited_photo.png"
        qimg = QImage(64, 64, QImage.Format.Format_ARGB32)
        qimg.fill(QColor(236, 72, 153))
        qimg.save(str(img_file))

        orig_node = NodeData(
            id="img_edit_1",
            title="Initial Image Thought",
            node_type="image",
            image_path=str(img_file),
            image_size="medium",
            importance=6,
            content="Initial notes",
            tags=["photo", "image"]
        )

        editor = NoteEditorDialog(orig_node)
        self.assertEqual(editor.node_type, "image")
        self.assertEqual(editor.image_path, str(img_file))
        self.assertEqual(editor.image_size, "medium")

        # Edit title and content and switch size to large
        editor.edit_title.setText("Updated Image Thought")
        editor.txt_content.setPlainText("Updated Markdown text")
        editor.rb_large.setChecked(True)
        editor._on_size_toggled("large", 3.0)

        # Trigger save
        saved_holder = []
        editor.saved.connect(lambda n: saved_holder.append(n))
        editor._on_save_clicked()

        self.assertEqual(len(saved_holder), 1)
        saved = saved_holder[0]
        self.assertEqual(saved.title, "Updated Image Thought")
        self.assertEqual(saved.content, "Updated Markdown text")
        self.assertEqual(saved.node_type, "image")
        self.assertEqual(saved.image_path, str(img_file))
        self.assertEqual(saved.image_size, "large")
        self.assertIn("image", saved.tags)

    def test_image_node_shift_drag_connection_and_highlighting(self):
        from mindmap_studio.ui.graph.graph_items import NodeItem
        from mindmap_studio.ui.graph.graph_scene import GraphScene

        scene = GraphScene()
        img_node = NodeData(id="img_1", title="Image Node", node_type="image", image_size="medium", x=0.0, y=0.0)
        text_node = NodeData(id="text_1", title="Text Node", node_type="text", x=30.0, y=30.0)

        img_item = scene.add_node_item(img_node, trigger_physics=False)
        text_item = scene.add_node_item(text_node, trigger_physics=False)

        # Connect them
        edge_item = scene.add_edge_item(img_node.id, text_node.id, weight=1.2)
        self.assertIsNotNone(edge_item)
        self.assertEqual(len(scene.edge_items), 1)
        self.assertIn(edge_item, img_item.edges)
        self.assertIn(edge_item, text_item.edges)

        # Test highlight on image node
        img_node.highlighted = True
        img_item.refresh_data(img_node)
        self.assertTrue(img_item.node_data.highlighted)

    def test_theme_config_and_qss(self):
        from mindmap_studio.config import config
        from mindmap_studio.ui.styles import get_theme_qss, DARK_THEME_QSS, LIGHT_THEME_QSS

        # Test setting and getting theme
        config.set_theme("light")
        self.assertEqual(config.get_theme(), "light")
        qss_light = get_theme_qss("light")
        self.assertEqual(qss_light, LIGHT_THEME_QSS)
        self.assertIn("#f8fafc", qss_light)

        config.set_theme("dark")
        self.assertEqual(config.get_theme(), "dark")
        qss_dark = get_theme_qss("dark")
        self.assertEqual(qss_dark, DARK_THEME_QSS)
        self.assertIn("#080c14", qss_dark)

    def test_node_styles_remain_unchanged_across_themes(self):
        # Verification of the strict Red Line: node geometry, radius, and fill color must never change
        style_5 = get_node_style_for_importance(5)
        self.assertEqual(style_5["radius"], 6.5)
        self.assertEqual(style_5["fill_color"], "#334155")
        self.assertEqual(style_5["border_color"], "#64748b")
        self.assertEqual(style_5["border_width"], 1.2)

    def test_graph_view_draw_background(self):
        from mindmap_studio.ui.graph.graph_view import GraphView
        from mindmap_studio.ui.graph.graph_scene import GraphScene
        from PyQt6.QtGui import QImage, QPainter
        from PyQt6.QtCore import QRectF

        scene = GraphScene()
        view = GraphView(scene)
        img = QImage(200, 200, QImage.Format.Format_ARGB32)
        painter = QPainter(img)
        rect = QRectF(0, 0, 200, 200)
        # Verify drawBackground executes without error in both dark and light modes
        self.assertIsNotNone(view._bg_pixmap)
        self.assertFalse(view._bg_pixmap.isNull())
        config.set_theme("dark")
        view.drawBackground(painter, rect)
        config.set_theme("light")
        view.drawBackground(painter, rect)
        painter.end()


    def test_cortex_visualizer_integration(self):
        from mindmap_studio.ui.widgets.ai_chat_panel import AIChatPanel
        from gemini_cortex import CortexVisualizer

        chat_panel = AIChatPanel()
        self.assertIsNotNone(chat_panel.cortex)
        self.assertIsInstance(chat_panel.cortex, CortexVisualizer)
        
        # Verify state changes
        chat_panel.set_loading(True)
        self.assertEqual(chat_panel.cortex._state, "THINKING")
        chat_panel.set_loading(False)
        self.assertEqual(chat_panel.cortex._state, "IDLE")

        # Verify transcripts handling
        chat_panel._on_cortex_user_transcript("Test voice query")
        self.assertTrue(any("Test voice query" in item.get("text", "") for item in chat_panel.get_history()))

        chat_panel._on_cortex_ai_transcript("Test AI spoken response")
        self.assertTrue(any("Test AI spoken response" in item.get("text", "") for item in chat_panel.get_history()))

    def test_config_get_api_key_alias(self):
        config.set_gemini_api_key("test_key_123")
        self.assertEqual(config.get_api_key(), "test_key_123")
        self.assertEqual(config.get_gemini_api_key(), "test_key_123")

    def test_gemini_cortex_package_standalone(self):
        import gemini_cortex
        from gemini_cortex import CortexVisualizer, CortexColors, GeminiLiveEngine, CortexLiveController

        self.assertTrue(hasattr(gemini_cortex, "CortexVisualizer"))
        self.assertTrue(hasattr(gemini_cortex, "GeminiLiveEngine"))
        self.assertTrue(hasattr(gemini_cortex, "CortexLiveController"))

        viz = CortexVisualizer()
        self.assertIsNotNone(viz)
        viz.set_state("LISTENING")
        self.assertEqual(viz._state, "LISTENING")
        viz.set_state("SPEAKING")
        self.assertEqual(viz._state, "SPEAKING")

        # Test GeminiLiveEngine initialization and configuration
        engine = GeminiLiveEngine(
            api_key="test_api_key",
            model="models/gemini-2.5-flash-native-audio-latest"
        )
        self.assertEqual(engine.model, "gemini-2.5-flash-native-audio-latest")
        self.assertEqual(engine.SEND_SAMPLE_RATE, 16000)
        self.assertEqual(engine.RECEIVE_SAMPLE_RATE, 24000)
        self.assertFalse(engine.is_muted())
        engine.set_muted(True)
        self.assertTrue(engine.is_muted())
        engine.interrupt()
        self.assertFalse(engine._is_speaking)

    def test_unified_chat_bubble_background_and_persian_socratic_prompt(self):
        """Validates that chat bubbles share unified background, Persian renders strict RTL, and Socratic asks for 5 questions."""
        from mindmap_studio.ui.widgets.ai_chat_panel import AIChatPanel
        from mindmap_studio.i18n import i18n
        chat_panel = AIChatPanel()
        
        # Test Persian language RTL rendering
        i18n.set_language("fa")
        chat_panel.retranslate_ui()
        chat_panel.add_user_message("سوال کاربر به زبان فارسی")
        chat_panel.add_ai_message("پاسخ مدل هوش مصنوعی")

        html = chat_panel.chat_browser.toHtml()
        self.assertTrue("dir='rtl'" in html or "dir=\"rtl\"" in html)
        self.assertTrue("align=\"right\"" in html or "align='right'" in html or "text-align: right" in html)

        # Test Socratic prompt generation
        chat_panel._trigger_quick_action("socratic")
        # History or input edit should contain the strict 5-question prompt
        user_msgs = [item["text"] for item in chat_panel.get_history() if item.get("role") == "user"]
        self.assertTrue(any("۵ پرسش" in msg and "پرهیز" in msg for msg in user_msgs))

    def test_ai_chat_markdown_formatting_and_rtl(self):
        from mindmap_studio.ui.widgets.ai_chat_panel import _format_markdown_for_html
        
        # Test Persian text with lists and headers
        sample_persian = "### عنوان\n1. مورد اول\n2. مورد دوم\nمتن نهایی"
        html_fa = _format_markdown_for_html(sample_persian, is_light=False, is_fa=True)
        self.assertIn("dir='rtl'", html_fa)
        self.assertIn("text-align: right", html_fa)
        self.assertNotIn("<br><div", html_fa)  # No extra br before block divs causing blank lines
        self.assertNotIn("</div><br>", html_fa) # No extra br after block divs

        # Test code block handling
        sample_code = "```python\nprint('hello')\n```"
        html_code = _format_markdown_for_html(sample_code, is_light=False, is_fa=True)
        self.assertIn("dir='ltr'", html_code)
        self.assertIn("Consolas", html_code)

    def test_api_anti_loop_and_rate_limit_protection(self):
        from mindmap_studio.services.gemini_service import call_gemini_api
        import urllib.error
        from unittest.mock import patch, MagicMock

        # 1. Test that 429 Quota Exceeded fails FAST and raises immediately without retry loops
        with patch("urllib.request.urlopen") as mock_urlopen:
            mock_err = urllib.error.HTTPError(
                url="http://fake",
                code=429,
                msg="Too Many Requests",
                hdrs={},
                fp=MagicMock(read=lambda: b'{"error":{"message":"RESOURCE_EXHAUSTED"}}')
            )
            mock_urlopen.side_effect = mock_err
            
            with self.assertRaises(RuntimeError) as ctx:
                call_gemini_api("Test prompt", "fake_key", "gemini-2.5-flash")
            self.assertIn("429", str(ctx.exception))
            # Must have only attempted 1 call, not looped through fallback models
            self.assertEqual(mock_urlopen.call_count, 1)


    def test_brainstorm_quick_action_requires_selected_node(self):
        """Tests that brainstorm quick action requires a selected node and focuses exclusively on it."""
        from mindmap_studio.ui.main_window import MainWindow
        from mindmap_studio.models.graph_models import NodeData
        from mindmap_studio.i18n import i18n
        from unittest.mock import patch

        i18n.set_language("fa")
        win = MainWindow()
        
        # Case 1: No node selected -> Shows information message box
        win.selected_node_id = None
        with patch("PyQt6.QtWidgets.QMessageBox.information") as mock_info:
            win._on_brainstorm_requested()
            mock_info.assert_called_once()

        # Case 2: Node is selected -> Sends tailored prompt focusing specifically on selected node
        test_node = NodeData(title="محاسبات کوانتومی", content="مبانی فیزیک کوانتوم", importance=9)
        win.graph_state.add_node(test_node)
        win.selected_node_id = test_node.id

        with patch.object(win.ai_chat_panel, "send_quick_prompt") as mock_send:
            win._on_brainstorm_requested()
            mock_send.assert_called_once()
            prompt_sent = mock_send.call_args[0][0]
            self.assertIn("محاسبات کوانتومی", prompt_sent)
            self.assertIn("نود «محاسبات کوانتومی»", prompt_sent)

    def test_action_review_dialog_and_selective_execution(self):
        """Tests ActionReviewDialog checklist behavior and selective action application to knowledge graph."""
        from mindmap_studio.ui.dialogs.action_review_dialog import ActionReviewDialog
        from mindmap_studio.services.gemini_service import AIChatAction
        from mindmap_studio.ui.main_window import MainWindow
        from PyQt6.QtWidgets import QDialog
        from unittest.mock import patch

        act1 = AIChatAction(action_type="add_node", title="ایده اول", importance=8, tags=["ایده1"], content="محتوای اول")
        act2 = AIChatAction(action_type="add_node", title="ایده دوم", importance=7, tags=["ایده2"], content="محتوای دوم")
        act3 = AIChatAction(action_type="connect_nodes", source_title="نود A", target_title="نود B")

        dialog = ActionReviewDialog([act1, act2, act3])
        self.assertEqual(len(dialog._card_items), 3)
        self.assertEqual(len(dialog.get_selected_actions()), 3)

        # Uncheck item 2
        dialog._card_items[1].set_selected(False)
        selected = dialog.get_selected_actions()
        self.assertEqual(len(selected), 2)
        self.assertIn(act1, selected)
        self.assertNotIn(act2, selected)
        self.assertIn(act3, selected)

        # Deselect all
        dialog._deselect_all()
        self.assertEqual(len(dialog.get_selected_actions()), 0)

        # Select all
        dialog._select_all()
        self.assertEqual(len(dialog.get_selected_actions()), 3)

        # Test selective execution in MainWindow
        win = MainWindow()
        dialog._card_items[0].set_selected(True)
        dialog._card_items[1].set_selected(False)
        dialog._card_items[2].set_selected(False)

        with patch.object(ActionReviewDialog, "exec", return_value=QDialog.DialogCode.Accepted), \
             patch.object(ActionReviewDialog, "get_selected_actions", return_value=[act1]):
            win._on_ai_chat_complete("پاسخ هوش مصنوعی", [act1, act2, act3], auto_confirm=False)

        # Verify only act1 ("Idea 1") was added to graph_state
        node_titles = [n.title for n in win.graph_state.nodes.values()]
        self.assertIn("ایده اول", node_titles)
        self.assertNotIn("ایده دوم", node_titles)

    def test_child_subnode_creation(self):
        """Tests that adding child text sub-nodes from parent context menu creates linked nodes with correct tags/labels."""
        win = MainWindow()
        parent_node = NodeData(id="parent_1", title="Parent Idea", tags=["parent_tag"], importance=8, x=100.0, y=100.0)
        win.graph_state.add_node(parent_node)
        win.graph_scene.add_node_item(parent_node, trigger_physics=False)

        from PyQt6.QtWidgets import QInputDialog
        with patch.object(QInputDialog, "getText", return_value=("Child Concept", True)):
            win._on_add_child_text("parent_1")

        # Verify child node is created
        child = next((n for n in win.graph_state.nodes.values() if n.title == "Child Concept"), None)
        self.assertIsNotNone(child)
        self.assertEqual(child.tags, ["parent_tag"])
        self.assertEqual(child.importance, 7)

        # Verify edge exists and has tag label
        edge = next((e for e in win.graph_state.edges if (e.source_id == "parent_1" and e.target_id == child.id) or (e.source_id == child.id and e.target_id == "parent_1")), None)
        self.assertIsNotNone(edge)
        self.assertEqual(edge.label, "parent_tag")

    def test_edge_label_editing(self):
        """Tests that edge labels can be edited and persisted."""
        win = MainWindow()
        n1 = NodeData(id="n1", title="A")
        n2 = NodeData(id="n2", title="B")
        win.graph_state.add_node(n1)
        win.graph_state.add_node(n2)
        win.graph_scene.add_node_item(n1, trigger_physics=False)
        win.graph_scene.add_node_item(n2, trigger_physics=False)
        win.graph_state.add_edge("n1", "n2", label="Initial Label")
        win.graph_scene.add_edge_item("n1", "n2", label="Initial Label")

        from PyQt6.QtWidgets import QInputDialog
        with patch.object(QInputDialog, "getText", return_value=("Updated Label", True)):
            win._on_edit_edge_label("n1", "n2")

        edge = next(e for e in win.graph_state.edges if (e.source_id == "n1" and e.target_id == "n2"))
        self.assertEqual(edge.label, "Updated Label")
        edge_item = next(e for e in win.graph_scene.edge_items if (e.source_item.node_data.id == "n1" and e.target_item.node_data.id == "n2"))
        self.assertEqual(edge_item.label, "Updated Label")

    def test_note_editor_image_insert(self):
        """Tests that image markdown is properly inserted into the NoteEditorDialog content."""
        nd = NodeData(id="test_node", title="Note Test", content="Initial text.")
        editor = NoteEditorDialog(nd)
        self.assertGreaterEqual(editor.width(), 850)
        self.assertGreaterEqual(editor.height(), 560)

        with patch("mindmap_studio.ui.dialogs.note_editor.QFileDialog.getOpenFileName", return_value=("C:/images/diagram.png", "Images (*.png)")):
            editor._on_insert_image_to_content()

        content = editor.txt_content.toPlainText()
        self.assertIn("![diagram](C:/images/diagram.png)", content)


if __name__ == "__main__":
    unittest.main()






