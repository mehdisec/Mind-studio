"""
Interactive AI Chat & Notebook Assistant Panel for MindMap Studio.
Features real-time token streaming (Chatbot-like interactivity), animated Thinking... indicators,
and autonomous Obsidian graph actions.
"""

import os
from typing import List, Optional
from datetime import datetime
import re

from PyQt6.QtCore import Qt, pyqtSignal, QEvent
from PyQt6.QtWidgets import (
    QWidget, QFrame, QVBoxLayout, QHBoxLayout, QLabel,
    QPushButton, QTextBrowser, QPlainTextEdit, QScrollArea, QSizePolicy
)
from PyQt6.QtGui import QFont, QKeyEvent, QTextCursor, QPixmap

from mindmap_studio.i18n import t, i18n
from mindmap_studio.config import config
from mindmap_studio.services.gemini_service import AIChatAction
from gemini_cortex import CortexVisualizer, GeminiLiveEngine, CortexLiveController


def _format_markdown_for_html(text: str, is_light: bool = False, is_fa: bool = False) -> str:
    """Lightweight and robust markdown-to-HTML converter for chat bubble rendering with full RTL and theme support."""
    if not text:
        return ""
    
    # Strip any trailing action json block from visible stream
    act_match = re.search(r"```(?:actions|json)?\s*\[\s*\{[\s\S]*", text)
    if act_match:
        text = text[:act_match.start()].strip()

    # Normalize line breaks
    text = text.replace("\r\n", "\n").replace("\r", "\n").strip()

    # Detect if text contains Persian/Arabic or if UI is Persian
    has_rtl_chars = bool(re.search(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]', text))
    is_rtl = is_fa or has_rtl_chars

    dir_attr = "rtl" if is_rtl else "ltr"
    text_align = "right" if is_rtl else "left"
    align_style = f"text-align: {text_align}; direction: {dir_attr};"

    heading_color = "#0284c7" if is_light else "#38bdf8"
    bold_color = "#0f172a" if is_light else "#f8fafc"
    code_bg = "#f1f5f9" if is_light else "#1e293b"
    code_color = "#0369a1" if is_light else "#38bdf8"
    tag_bg = "rgba(2,132,199,0.12)" if is_light else "rgba(56,189,248,0.12)"

    lines = text.split("\n")
    processed_blocks = []
    
    in_code_block = False
    code_block_lines = []

    for line in lines:
        stripped = line.strip()
        
        # Handle code blocks ```
        if stripped.startswith("```"):
            if in_code_block:
                code_content = "<br>".join(code_block_lines)
                processed_blocks.append(
                    f"<div dir='ltr' align='left' style='background-color:{code_bg}; color:{code_color}; padding:6px 10px; margin:4px 0; border-radius:4px; font-family:Consolas, monospace; font-size:12px; text-align:left; direction:ltr;'>{code_content}</div>"
                )
                code_block_lines = []
                in_code_block = False
            else:
                in_code_block = True
                code_block_lines = []
            continue

        if in_code_block:
            escaped_code = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(" ", "&nbsp;")
            code_block_lines.append(escaped_code)
            continue

        if not stripped:
            # Paragraph separation: use a controlled subtle spacer rather than a full empty line
            processed_blocks.append("<div style='height: 4px; margin: 0; padding: 0;'></div>")
            continue

        # Escape HTML
        escaped_line = stripped.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        # Inline formatting
        escaped_line = re.sub(r"\*\*(.*?)\*\*", rf"<b style='color:{bold_color}; font-weight:bold;'>\1</b>", escaped_line)
        escaped_line = re.sub(r"\*(.*?)\*", r"<i>\1</i>", escaped_line)
        escaped_line = re.sub(r"`([^`]+)`", rf"<span style='background-color:{code_bg}; color:{code_color}; padding:1px 5px; font-family:Consolas, monospace; border-radius:3px;'>\1</span>", escaped_line)
        escaped_line = re.sub(r"\[\[(.*?)\]\]", rf"<span style='color:{code_color}; font-weight:bold; background-color:{tag_bg}; padding:1px 6px; border-radius:3px;'>[[\1]]</span>", escaped_line)

        # Headers
        h3_m = re.match(r"^###\s+(.*)$", escaped_line)
        if h3_m:
            processed_blocks.append(f"<div align='{text_align}' dir='{dir_attr}' style='color:{heading_color}; margin:6px 0 2px 0; font-size:14px; font-weight:bold; {align_style}'>{h3_m.group(1)}</div>")
            continue

        h2_m = re.match(r"^##\s+(.*)$", escaped_line)
        if h2_m:
            processed_blocks.append(f"<div align='{text_align}' dir='{dir_attr}' style='color:{heading_color}; margin:8px 0 3px 0; font-size:15px; font-weight:bold; {align_style}'>{h2_m.group(1)}</div>")
            continue

        h1_m = re.match(r"^#\s+(.*)$", escaped_line)
        if h1_m:
            processed_blocks.append(f"<div align='{text_align}' dir='{dir_attr}' style='color:{heading_color}; margin:10px 0 4px 0; font-size:16px; font-weight:bold; {align_style}'>{h1_m.group(1)}</div>")
            continue

        # Numbered list: 1. or 1- or 1)
        num_m = re.match(r"^(\d+[\.\-\)])\s+(.*)$", escaped_line)
        if num_m:
            processed_blocks.append(f"<div align='{text_align}' dir='{dir_attr}' style='margin:2px 0; {align_style}'><b style='color:{heading_color};'>{num_m.group(1)}</b> {num_m.group(2)}</div>")
            continue

        # Bullet list: - or * or •
        bullet_m = re.match(r"^[•*-]\s+(.*)$", escaped_line)
        if bullet_m:
            processed_blocks.append(f"<div align='{text_align}' dir='{dir_attr}' style='margin:2px 0; {align_style}'>• {bullet_m.group(1)}</div>")
            continue

        # Regular text paragraph line with explicit alignment & direction attributes and styles
        processed_blocks.append(f"<div align='{text_align}' dir='{dir_attr}' style='margin:1px 0; {align_style}'>{escaped_line}</div>")

    if in_code_block and code_block_lines:
        code_content = "<br>".join(code_block_lines)
        processed_blocks.append(
            f"<div dir='ltr' align='left' style='background-color:{code_bg}; color:{code_color}; padding:6px 10px; margin:4px 0; border-radius:4px; font-family:Consolas, monospace; font-size:12px; text-align:left; direction:ltr;'>{code_content}</div>"
        )

    return "".join(processed_blocks)


class ChatInputEdit(QPlainTextEdit):
    """Custom multi-line editor that sends on Enter and adds newline on Shift+Enter."""
    return_pressed = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("aiChatInput")
        self.setFixedHeight(50)

    def keyPressEvent(self, event: QKeyEvent):
        if event.key() in (Qt.Key.Key_Return, Qt.Key.Key_Enter):
            if not (event.modifiers() & Qt.KeyboardModifier.ShiftModifier):
                self.return_pressed.emit()
                event.accept()
                return
        super().keyPressEvent(event)


class AIChatPanel(QFrame):
    """Interactive bottom chat & notebook assistant panel with live token streaming and 3D Cortex."""
    send_message_requested = pyqtSignal(str)
    deep_dive_requested = pyqtSignal()
    brainstorm_requested = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("aiChatPanel")
        self._history_items = []
        self._is_loading = False
        self._streaming_text = ""
        self._active_model_name = config.get_model_name()
        self._cortex_controller: Optional[CortexLiveController] = None
        self._live_engine: Optional[GeminiLiveEngine] = None
        self._is_live_active = False
        self._init_ui()
        self.retranslate_ui()

    def _init_ui(self):
        # Top-level vertical layout so the Header Bar extends 100% across the full width
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(10, 8, 10, 8)
        main_layout.setSpacing(6)

        # =========================================================================
        # 1. Full-Width Top Header Toolbar (Extending above left banner and right chat)
        # =========================================================================
        header_bar = QHBoxLayout()
        header_bar.setSpacing(8)

        self.lbl_title = QLabel(t("ai_chat_title"))
        self.lbl_title.setStyleSheet("font-size: 13px; font-weight: bold; color: #38bdf8;")
        header_bar.addWidget(self.lbl_title)

        self.lbl_badge = QLabel(t("ai_chat_badge_connected", notes=0, nodes=0))
        self.lbl_badge.setStyleSheet("""
            QLabel {
                background-color: #0f172a;
                color: #4ade80;
                border: 1px solid #1e293b;
                border-radius: 12px;
                padding: 2px 10px;
                font-size: 11px;
                font-weight: 600;
            }
        """)
        header_bar.addWidget(self.lbl_badge)

        header_bar.addStretch()

        # Quick Action Chips extending across the entire top bar
        self.btn_chip_brainstorm = QPushButton(t("ai_chat_quick_brainstorm"))
        self._style_chip(self.btn_chip_brainstorm)
        self.btn_chip_brainstorm.clicked.connect(lambda: self._trigger_quick_action("brainstorm"))
        header_bar.addWidget(self.btn_chip_brainstorm)

        self.btn_chip_deep_dive = QPushButton(t("ai_chat_quick_deep_dive"))
        self._style_chip(self.btn_chip_deep_dive)
        self.btn_chip_deep_dive.clicked.connect(self._on_deep_dive_clicked)
        header_bar.addWidget(self.btn_chip_deep_dive)

        self.btn_chip_socratic = QPushButton(t("ai_chat_quick_socratic"))
        self._style_chip(self.btn_chip_socratic)
        self.btn_chip_socratic.clicked.connect(lambda: self._trigger_quick_action("socratic"))
        header_bar.addWidget(self.btn_chip_socratic)

        self.btn_chip_connect = QPushButton(t("ai_chat_quick_connect"))
        self._style_chip(self.btn_chip_connect)
        self.btn_chip_connect.clicked.connect(lambda: self._trigger_quick_action("connect"))
        header_bar.addWidget(self.btn_chip_connect)

        self.btn_clear = QPushButton(t("ai_chat_clear"))
        self.btn_clear.setStyleSheet("""
            QPushButton {
                background-color: #1e293b;
                color: #94a3b8;
                border: 1px solid #334155;
                border-radius: 12px;
                padding: 3px 10px;
                font-size: 11px;
            }
            QPushButton:hover {
                background-color: #334155;
                color: #f8fafc;
            }
        """)
        self.btn_clear.clicked.connect(self.clear_chat)
        header_bar.addWidget(self.btn_clear)

        main_layout.addLayout(header_bar)

        # =========================================================================
        # 2. Horizontal Split Body: Left 30% (3D AI Cortex) : Right 70% (Chat Window)
        # =========================================================================
        body_widget = QWidget(self)
        body_widget.setLayoutDirection(Qt.LayoutDirection.LeftToRight)
        body_layout = QHBoxLayout(body_widget)
        body_layout.setContentsMargins(0, 0, 0, 0)
        body_layout.setSpacing(10)

        # 2.1 Left 30% Frame: 3D Holographic AI Cortex Visualizer & Live Audio HUD
        self.banner_frame = QFrame(body_widget)
        self.banner_frame.setObjectName("aiBannerFrame")
        banner_layout = QVBoxLayout(self.banner_frame)
        banner_layout.setContentsMargins(4, 4, 4, 4)
        banner_layout.setSpacing(4)

        # 3D Cortex Visualizer from gemini_cortex package
        self.cortex = CortexVisualizer(self.banner_frame)
        self.cortex.setMinimumSize(160, 160)
        self.cortex.set_state("IDLE")
        banner_layout.addWidget(self.cortex, stretch=1)

        # Live Voice & Mic Control Bar
        cortex_hud = QHBoxLayout()
        cortex_hud.setSpacing(4)
        cortex_hud.setContentsMargins(2, 0, 2, 2)

        self.btn_live_voice = QPushButton(t("cortex_btn_start_live"))
        self.btn_live_voice.setObjectName("cortexLiveBtn")
        self.btn_live_voice.setFixedHeight(26)
        self.btn_live_voice.clicked.connect(self._toggle_live_voice)
        cortex_hud.addWidget(self.btn_live_voice, stretch=2)

        self.btn_cortex_mute = QPushButton(t("cortex_btn_mute"))
        self.btn_cortex_mute.setObjectName("cortexMuteBtn")
        self.btn_cortex_mute.setFixedHeight(26)
        self.btn_cortex_mute.clicked.connect(self._toggle_cortex_mute)
        self.btn_cortex_mute.setEnabled(False)
        cortex_hud.addWidget(self.btn_cortex_mute, stretch=1)

        self.btn_cortex_interrupt = QPushButton(t("cortex_btn_interrupt"))
        self.btn_cortex_interrupt.setObjectName("cortexInterruptBtn")
        self.btn_cortex_interrupt.setFixedHeight(26)
        self.btn_cortex_interrupt.clicked.connect(self._interrupt_cortex)
        self.btn_cortex_interrupt.setEnabled(False)
        cortex_hud.addWidget(self.btn_cortex_interrupt, stretch=1)

        banner_layout.addLayout(cortex_hud)

        body_layout.addWidget(self.banner_frame, stretch=30)

        # 2.2 Right 70% Container: Chat Browser, Inputs & Status
        self.chat_container = QWidget(body_widget)
        chat_layout = QVBoxLayout(self.chat_container)
        chat_layout.setContentsMargins(0, 0, 0, 0)
        chat_layout.setSpacing(6)

        # Chat Log Area
        self.chat_browser = QTextBrowser()
        self.chat_browser.setObjectName("aiChatBrowser")
        self.chat_browser.setOpenExternalLinks(True)
        chat_layout.addWidget(self.chat_browser, stretch=1)

        # Input Bar
        input_bar = QHBoxLayout()
        input_bar.setSpacing(8)

        self.input_edit = ChatInputEdit(self)
        self.input_edit.setPlaceholderText(t("ai_chat_placeholder"))
        self.input_edit.return_pressed.connect(self._on_send_clicked)
        input_bar.addWidget(self.input_edit, stretch=1)

        self.btn_send = QPushButton(t("ai_chat_send"))
        self.btn_send.setObjectName("primaryBtn")
        self.btn_send.setFixedHeight(50)
        self.btn_send.setFixedWidth(85)
        self.btn_send.setStyleSheet("""
            QPushButton#primaryBtn {
                background-color: #0284c7;
                color: white;
                font-weight: bold;
                border-radius: 8px;
                font-size: 13px;
            }
            QPushButton#primaryBtn:hover {
                background-color: #0369a1;
            }
            QPushButton#primaryBtn:disabled {
                background-color: #1e293b;
                color: #64748b;
            }
        """)
        self.btn_send.clicked.connect(self._on_send_clicked)
        input_bar.addWidget(self.btn_send)

        chat_layout.addLayout(input_bar)

        # Footer Bar showing current AI Model and live Thinking status
        footer_bar = QHBoxLayout()
        footer_bar.setContentsMargins(4, 2, 4, 0)
        footer_bar.setSpacing(10)

        self.lbl_model_status = QLabel(t("ai_chat_active_model", model=config.get_model_name()))
        self.lbl_model_status.setStyleSheet("""
            QLabel {
                color: #38bdf8;
                font-size: 12px;
                font-weight: 600;
                padding: 2px 8px;
                border-radius: 6px;
                background-color: #0b1528;
                border: 1px solid #1e3a8a;
            }
        """)
        footer_bar.addWidget(self.lbl_model_status)

        self.lbl_thinking = QLabel(t("ai_chat_thinking"))
        self.lbl_thinking.setStyleSheet("""
            QLabel {
                color: #f59e0b;
                font-size: 12px;
                font-weight: bold;
                padding: 2px 8px;
                border-radius: 6px;
                background-color: rgba(245, 158, 11, 0.12);
                border: 1px solid rgba(245, 158, 11, 0.35);
            }
        """)
        self.lbl_thinking.hide()
        footer_bar.addWidget(self.lbl_thinking)

        footer_bar.addStretch()

        chat_layout.addLayout(footer_bar)

        body_layout.addWidget(self.chat_container, stretch=70)

        main_layout.addWidget(body_widget, stretch=1)

    def _style_chip(self, btn: QPushButton):
        btn.setStyleSheet("""
            QPushButton {
                background-color: #0f172a;
                color: #cbd5e1;
                border: 1px solid #334155;
                border-radius: 12px;
                padding: 3px 10px;
                font-size: 11px;
                font-weight: 500;
            }
            QPushButton:hover {
                background-color: #1e293b;
                color: #38bdf8;
                border-color: #38bdf8;
            }
        """)

    def _toggle_live_voice(self):
        """Toggles the live bidirectional Gemini voice streaming session."""
        if self._is_live_active:
            self._stop_live_voice()
        else:
            self._start_live_voice()

    def _start_live_voice(self):
        """Initializes and connects the Gemini Live Engine with 3D Cortex HUD."""
        api_key = config.get_api_key()
        if not api_key:
            from PyQt6.QtWidgets import QMessageBox
            QMessageBox.warning(
                self,
                t("settings_invalid_path_title"),
                t("cortex_need_api_key")
            )
            return

        try:
            self._live_engine = GeminiLiveEngine(
                api_key=api_key,
                system_instruction=(
                    "You are an advanced, intelligent cognitive AI assistant for MindMap Studio. "
                    "You have deep understanding of mental models, knowledge graphs, and Obsidian notes. "
                    "Respond naturally, concisely, and efficiently in the user's language (Persian or English)."
                ),
                voice_name="charon"
            )
            self._cortex_controller = CortexLiveController(self.cortex, self._live_engine, self)
            self._cortex_controller.userTranscriptReceived.connect(self._on_cortex_user_transcript)
            self._cortex_controller.aiTranscriptReceived.connect(self._on_cortex_ai_transcript)
            self._cortex_controller.errorReceived.connect(self._on_cortex_error)
            self._cortex_controller.start()

            self._is_live_active = True
            self.btn_live_voice.setText(t("cortex_btn_stop_live"))
            self.btn_live_voice.setProperty("active", "true")
            self.btn_live_voice.style().unpolish(self.btn_live_voice)
            self.btn_live_voice.style().polish(self.btn_live_voice)
            self.btn_cortex_mute.setEnabled(True)
            self.btn_cortex_mute.setText(t("cortex_btn_mute"))
            self.btn_cortex_interrupt.setEnabled(True)
            self.lbl_thinking.setText(t("cortex_status_live"))
            self.lbl_thinking.show()
        except Exception as e:
            from PyQt6.QtWidgets import QMessageBox
            QMessageBox.critical(self, "Live Voice Error", f"Failed to start Gemini Live Engine:\n{e}")

    def _on_cortex_error(self, err_msg: str):
        """Called when a live voice connection or API key error occurs."""
        self._stop_live_voice()
        self.add_error_message(f"Gemini Live Voice: {err_msg}")

    def _stop_live_voice(self):
        """Stops live audio streaming and resets cortex state."""
        if self._cortex_controller:
            try:
                self._cortex_controller.stop()
            except Exception:
                pass
            self._cortex_controller = None
            self._live_engine = None

        self._is_live_active = False
        self.btn_live_voice.setText(t("cortex_btn_start_live"))
        self.btn_live_voice.setProperty("active", "false")
        self.btn_live_voice.style().unpolish(self.btn_live_voice)
        self.btn_live_voice.style().polish(self.btn_live_voice)
        self.btn_cortex_mute.setEnabled(False)
        self.btn_cortex_mute.setText(t("cortex_btn_mute"))
        self.btn_cortex_interrupt.setEnabled(False)
        self.cortex.set_state("IDLE")
        if not self._is_loading:
            self.lbl_thinking.hide()

    def _toggle_cortex_mute(self):
        if self._cortex_controller:
            is_muted = self._cortex_controller.toggle_mute()
            self.btn_cortex_mute.setText(t("cortex_btn_unmute") if is_muted else t("cortex_btn_mute"))

    def _interrupt_cortex(self):
        if self._cortex_controller:
            self._cortex_controller.interrupt()

    def _on_cortex_user_transcript(self, text: str):
        text = text.strip()
        if not text:
            return
        time_str = datetime.now().strftime("%H:%M")
        self._history_items.append({
            "role": "user",
            "text": f"🎙️ {text}",
            "time": time_str
        })
        self._render_full_chat()

    def _on_cortex_ai_transcript(self, text: str):
        text = text.strip()
        if not text:
            return
        time_str = datetime.now().strftime("%H:%M")
        if self._history_items and self._history_items[-1].get("role") == "model" and self._history_items[-1].get("is_live"):
            self._history_items[-1]["text"] += " " + text
        else:
            self._history_items.append({
                "role": "model",
                "text": f"🎙️ {text}",
                "model": "Gemini Live Voice",
                "is_live": True,
                "time": time_str
            })
        self._render_full_chat()

    def update_model_status(self, model_name: str = ""):
        self._active_model_name = model_name or config.get_model_name()
        self.lbl_model_status.setText(t("ai_chat_active_model", model=self._active_model_name))

    def retranslate_ui(self):
        self._active_model_name = config.get_model_name()
        self.lbl_title.setText(t("ai_chat_title"))
        self.btn_chip_brainstorm.setText(t("ai_chat_quick_brainstorm"))
        self.btn_chip_deep_dive.setText(t("ai_chat_quick_deep_dive"))
        self.btn_chip_socratic.setText(t("ai_chat_quick_socratic"))
        self.btn_chip_connect.setText(t("ai_chat_quick_connect"))
        self.btn_clear.setText(t("ai_chat_clear"))
        self.btn_send.setText(t("ai_chat_send"))
        self.input_edit.setPlaceholderText(t("ai_chat_placeholder"))
        self.lbl_thinking.setText(t("ai_chat_thinking"))
        if hasattr(self, "lbl_model_status"):
            self.lbl_model_status.setText(t("ai_chat_active_model", model=self._active_model_name))

        if hasattr(self, "btn_live_voice"):
            self.btn_live_voice.setText(t("cortex_btn_stop_live") if self._is_live_active else t("cortex_btn_start_live"))
        if hasattr(self, "btn_cortex_mute"):
            is_muted = self._live_engine.is_muted() if (self._live_engine and hasattr(self._live_engine, "is_muted")) else False
            self.btn_cortex_mute.setText(t("cortex_btn_unmute") if is_muted else t("cortex_btn_mute"))
        if hasattr(self, "btn_cortex_interrupt"):
            self.btn_cortex_interrupt.setText(t("cortex_btn_interrupt"))

        is_fa = (i18n.get_language() == "fa")
        dir_mode = Qt.LayoutDirection.RightToLeft if is_fa else Qt.LayoutDirection.LeftToRight
        align_mode = Qt.AlignmentFlag.AlignRight if is_fa else Qt.AlignmentFlag.AlignLeft

        self.input_edit.setLayoutDirection(dir_mode)
        opt = self.input_edit.document().defaultTextOption()
        opt.setTextDirection(dir_mode)
        opt.setAlignment(align_mode | Qt.AlignmentFlag.AlignAbsolute)
        self.input_edit.document().setDefaultTextOption(opt)

        self.chat_browser.setLayoutDirection(dir_mode)
        self._render_full_chat()

    def update_notebook_stats(self, notes_count: int, nodes_count: int):
        self.lbl_badge.setText(t("ai_chat_badge_connected", notes=notes_count, nodes=nodes_count))

    def _on_deep_dive_clicked(self):
        """Emits deep_dive_requested to launch the dedicated 8-insight Conceptual Breakdown Studio."""
        self.deep_dive_requested.emit()

    def _trigger_quick_action(self, action_type: str):
        if action_type == "brainstorm":
            self.brainstorm_requested.emit()
            return
        elif action_type == "socratic":
            prompt = "صرفاً ۵ پرسش بنیادین و عمیق سقراطی (دقیقاً ۵ پرسش به صورت لیست شماره‌دار از ۱ تا ۵ به زبان فارسی) برای نقد، به چالش کشیدن و سنجش فرضیات یادداشت‌های والت من مطرح کن. از هرگونه توضیح اضافی، مقدمه‌چینی، نتیجه‌گیری و متون متفرقه پرهیز کن و فقط متن ۵ پرسش را لیست کن." if i18n.get_language() == "fa" else "Formulate exactly 5 profound, fundamental Socratic questions as a numbered list (1 to 5) to challenge and probe the core assumptions in my notes. Strictly avoid any preamble, explanations, or commentary, and list only the 5 questions."
        else:
            prompt = "اتصالات و الگوهای پنهان بین یادداشت‌های مختلف من را کشف کن و نودهای مرتبط را به هم متصل کن." if i18n.get_language() == "fa" else "Discover hidden patterns across my notes and connect relevant nodes on the knowledge graph."

        self.input_edit.setPlainText(prompt)
        self._on_send_clicked()

    def send_quick_prompt(self, prompt: str):
        """Helper to inject prompt text and trigger send."""
        self.input_edit.setPlainText(prompt)
        self._on_send_clicked()

    def _on_send_clicked(self):
        if self._is_loading:
            return
        text = self.input_edit.toPlainText().strip()
        if not text:
            return

        self.add_user_message(text)
        self.input_edit.clear()
        self.set_loading(True)
        self.send_message_requested.emit(text)

    def add_user_message(self, text: str):
        time_str = datetime.now().strftime("%H:%M")
        self._history_items.append({
            "role": "user",
            "text": text,
            "time": time_str
        })
        self._streaming_text = ""
        self._render_full_chat()

    def stream_ai_chunk(self, delta_chunk: str, accumulated_text: str):
        """Called live in real-time as tokens arrive from Google Gemini API."""
        self._streaming_text = accumulated_text
        if not self._is_live_active:
            self.cortex.set_state("SPEAKING")
        self._render_full_chat()

    def add_ai_message(self, text: str, actions: Optional[List[AIChatAction]] = None, model_name: str = ""):
        """Called when AI streaming finishes and final actions are prepared."""
        time_str = datetime.now().strftime("%H:%M")
        mod = model_name or self._active_model_name or config.get_model_name()
        self._history_items.append({
            "role": "model",
            "text": text,
            "actions": actions or [],
            "model": mod,
            "time": time_str
        })
        self._streaming_text = ""
        self.set_loading(False)
        self._render_full_chat()

    def add_error_message(self, error_text: str):
        time_str = datetime.now().strftime("%H:%M")
        self._history_items.append({
            "role": "error",
            "text": error_text,
            "time": time_str
        })
        self._streaming_text = ""
        self.set_loading(False)
        self._render_full_chat()

    def _render_full_chat(self):
        """Renders complete chat history with live streaming tokens, unified background, and strict RTL alignment."""
        is_fa = (i18n.get_language() == "fa")
        is_light = (config.get_theme() == "light")
        dir_attr = "rtl" if is_fa else "ltr"
        text_align = "right" if is_fa else "left"
        dir_mode = Qt.LayoutDirection.RightToLeft if is_fa else Qt.LayoutDirection.LeftToRight
        align_mode = Qt.AlignmentFlag.AlignRight if is_fa else Qt.AlignmentFlag.AlignLeft
        
        # Apply strict text direction & alignment to the underlying QTextDocument
        opt = self.chat_browser.document().defaultTextOption()
        opt.setTextDirection(dir_mode)
        opt.setAlignment(align_mode | Qt.AlignmentFlag.AlignAbsolute)
        self.chat_browser.document().setDefaultTextOption(opt)
        self.chat_browser.setLayoutDirection(dir_mode)

        main_text_color = "#0f172a" if is_light else "#f1f5f9"
        user_meta_color = "#64748b" if is_light else "#94a3b8"
        ai_meta_color = "#0284c7" if is_light else "#38bdf8"
        divider_color = "#e2e8f0" if is_light else "#1e293b"

        bubbles_html = []

        for idx, item in enumerate(self._history_items):
            role = item.get("role")
            text = item.get("text", "")
            time_str = item.get("time", "")
            divider = f'<hr style="border: 0; height: 1px; background-color: {divider_color}; margin: 10px 0 10px 0;" />' if idx > 0 else ''

            if role == "user":
                formatted = _format_markdown_for_html(text, is_light=is_light, is_fa=is_fa)
                user_label = "شما" if is_fa else "You"
                bubbles_html.append(f"""
                {divider}
                <table width="100%" cellpadding="0" cellspacing="0" dir="{dir_attr}">
                  <tr>
                    <td align="{text_align}" dir="{dir_attr}" style="padding: 2px 0;">
                      <p align="{text_align}" dir="{dir_attr}" style="margin: 0 0 4px 0; padding: 0;">
                        <span style="color: {user_meta_color}; font-size: 11px; font-weight: bold;">👤 {user_label} • {time_str}</span>
                      </p>
                      <div align="{text_align}" dir="{dir_attr}" style="color: {main_text_color}; font-size: 13px; line-height: 160%; text-align: {text_align}; direction: {dir_attr};">
                        {formatted}
                      </div>
                    </td>
                  </tr>
                </table>
                """)

            elif role == "model":
                mod = item.get("model", config.get_model_name())
                actions = item.get("actions", [])
                formatted = _format_markdown_for_html(text, is_light=is_light, is_fa=is_fa)

                actions_html = ""
                if actions:
                    action_cards = []
                    for act in actions:
                        if act.action_type == "add_node":
                            tag_str = f" [#{', #'.join(act.tags)}]" if act.tags else ""
                            act_bg = "#dcfce7" if is_light else "#064e3b"
                            act_border = "#86efac" if is_light else "#059669"
                            act_color = "#14532d" if is_light else "#ecfdf5"
                            action_cards.append(f"""
                            <div align="{text_align}" dir="{dir_attr}" style="background-color: {act_bg}; border: 1px solid {act_border}; border-radius: 6px; padding: 6px 10px; margin-top: 6px; font-size: 12px; color: {act_color}; text-align: {text_align}; direction: {dir_attr};">
                                <b>➕ نود جدید ایجاد شد:</b> <code>[[{act.title}]]</code> (★{act.importance}/10){tag_str}
                            </div>
                            """)
                        elif act.action_type == "delete_node":
                            act_bg = "#fee2e2" if is_light else "#450a0a"
                            act_border = "#fca5a5" if is_light else "#dc2626"
                            act_color = "#7f1d1d" if is_light else "#fef2f2"
                            action_cards.append(f"""
                            <div align="{text_align}" dir="{dir_attr}" style="background-color: {act_bg}; border: 1px solid {act_border}; border-radius: 6px; padding: 6px 10px; margin-top: 6px; font-size: 12px; color: {act_color}; text-align: {text_align}; direction: {dir_attr};">
                                <b>🗑️ نود حذف شد:</b> <code>'{act.title}'</code>
                            </div>
                            """)
                        elif act.action_type == "connect_nodes":
                            act_bg = "#e0f2fe" if is_light else "#083344"
                            act_border = "#7dd3fc" if is_light else "#0891b2"
                            act_color = "#0c4a6e" if is_light else "#ecfeff"
                            action_cards.append(f"""
                            <div align="{text_align}" dir="{dir_attr}" style="background-color: {act_bg}; border: 1px solid {act_border}; border-radius: 6px; padding: 6px 10px; margin-top: 6px; font-size: 12px; color: {act_color}; text-align: {text_align}; direction: {dir_attr};">
                                <b>🔗 اتصال جدید:</b> <code>[[{act.source_title}]]</code> ↔ <code>[[{act.target_title}]]</code>
                            </div>
                            """)
                    actions_html = "".join(action_cards)

                bubbles_html.append(f"""
                {divider}
                <table width="100%" cellpadding="0" cellspacing="0" dir="{dir_attr}">
                  <tr>
                    <td align="{text_align}" dir="{dir_attr}" style="padding: 2px 0;">
                      <p align="{text_align}" dir="{dir_attr}" style="margin: 0 0 4px 0; padding: 0;">
                        <span style="color: {ai_meta_color}; font-size: 11px; font-weight: bold;">🤖 Gemini ({mod}) • {time_str}</span>
                      </p>
                      <div align="{text_align}" dir="{dir_attr}" style="color: {main_text_color}; font-size: 13px; line-height: 160%; text-align: {text_align}; direction: {dir_attr};">
                        {formatted}
                      </div>
                      {actions_html}
                    </td>
                  </tr>
                </table>
                """)

            elif role == "error":
                err_bg = "#fee2e2" if is_light else "#450a0a"
                err_border = "#fca5a5" if is_light else "#991b1b"
                err_color = "#991b1b" if is_light else "#fca5a5"
                bubbles_html.append(f"""
                {divider}
                <table width="100%" cellpadding="0" cellspacing="0" dir="{dir_attr}">
                  <tr>
                    <td align="{text_align}" dir="{dir_attr}" style="padding: 4px 0;">
                      <div align="{text_align}" dir="{dir_attr}" style="padding: 8px 12px; background-color: {err_bg}; border: 1px solid {err_border}; border-radius: 6px; color: {err_color}; font-size: 12px; text-align: {text_align}; direction: {dir_attr};">
                        <b>⚠️ خطا ({time_str}):</b><br>{text.replace(chr(10), '<br>')}
                      </div>
                    </td>
                  </tr>
                </table>
                """)

        # If currently streaming or waiting
        if self._is_loading:
            time_now = datetime.now().strftime("%H:%M")
            mod = self._active_model_name or config.get_model_name()
            divider = f'<hr style="border: 0; height: 1px; background-color: {divider_color}; margin: 10px 0 10px 0;" />' if self._history_items else ''

            if self._streaming_text:
                formatted_stream = _format_markdown_for_html(self._streaming_text, is_light=is_light, is_fa=is_fa)
                cursor_span = f"<span style='color: {ai_meta_color}; font-weight: bold;'>▋</span>"
                if formatted_stream.endswith("</div>"):
                    formatted_stream = formatted_stream[:-6] + f" {cursor_span}</div>"
                else:
                    formatted_stream += f" {cursor_span}"
                bubbles_html.append(f"""
                {divider}
                <table width="100%" cellpadding="0" cellspacing="0" dir="{dir_attr}">
                  <tr>
                    <td align="{text_align}" dir="{dir_attr}" style="padding: 2px 0;">
                      <p align="{text_align}" dir="{dir_attr}" style="margin: 0 0 4px 0; padding: 0;">
                        <span style="color: {ai_meta_color}; font-size: 11px; font-weight: bold;">🤖 Gemini ({mod}) • {time_now}</span>
                      </p>
                      <div align="{text_align}" dir="{dir_attr}" style="color: {main_text_color}; font-size: 13px; line-height: 160%; text-align: {text_align}; direction: {dir_attr};">
                        {formatted_stream}
                      </div>
                    </td>
                  </tr>
                </table>
                """)
            else:
                thinking_text = t("ai_chat_thinking")
                bubbles_html.append(f"""
                {divider}
                <table width="100%" cellpadding="0" cellspacing="0" dir="{dir_attr}">
                  <tr>
                    <td align="{text_align}" dir="{dir_attr}" style="padding: 2px 0;">
                      <p align="{text_align}" dir="{dir_attr}" style="margin: 0 0 4px 0; padding: 0;">
                        <span style="color: #f59e0b; font-size: 11px; font-weight: bold;">🤖 Gemini ({mod}) • {time_now}</span>
                      </p>
                      <div align="{text_align}" dir="{dir_attr}" style="color: #f59e0b; font-size: 13px; font-style: italic; line-height: 160%; text-align: {text_align}; direction: {dir_attr};">
                        {thinking_text}
                      </div>
                    </td>
                  </tr>
                </table>
                """)

        container_font = "'Vazirmatn', 'Segoe UI', Tahoma, sans-serif" if is_fa else "'Inter', 'Segoe UI', sans-serif"
        full_html = f"""<div dir="{dir_attr}" align="{text_align}" style="direction: {dir_attr}; text-align: {text_align}; font-family: {container_font}; padding: 2px;">
            {''.join(bubbles_html)}
        </div>"""
        self.chat_browser.setHtml(full_html)
        
        # Re-apply text option post setHtml
        opt = self.chat_browser.document().defaultTextOption()
        opt.setTextDirection(dir_mode)
        opt.setAlignment(align_mode | Qt.AlignmentFlag.AlignAbsolute)
        self.chat_browser.document().setDefaultTextOption(opt)

        # Scroll to bottom
        sb = self.chat_browser.verticalScrollBar()
        sb.setValue(sb.maximum())

    def update_theme_styling(self):
        """Refreshes the rendered chat view when the UI theme switches."""
        self._render_full_chat()

    def set_loading(self, loading: bool):
        self._is_loading = loading
        if loading:
            self.lbl_thinking.setText(t("ai_chat_thinking"))
            self.lbl_thinking.show()
            self.btn_send.setEnabled(False)
            self.input_edit.setEnabled(False)
            self.btn_chip_brainstorm.setEnabled(False)
            self.btn_chip_deep_dive.setEnabled(False)
            self.btn_chip_socratic.setEnabled(False)
            self.btn_chip_connect.setEnabled(False)
            if not self._is_live_active:
                self.cortex.set_state("THINKING")
        else:
            if not self._is_live_active:
                self.lbl_thinking.hide()
                self.cortex.set_state("IDLE")
            self.btn_send.setEnabled(True)
            self.input_edit.setEnabled(True)
            self.input_edit.setFocus()
            self.btn_chip_brainstorm.setEnabled(True)
            self.btn_chip_deep_dive.setEnabled(True)
            self.btn_chip_socratic.setEnabled(True)
            self.btn_chip_connect.setEnabled(True)

    def clear_chat(self):
        if self._is_loading:
            return
        self._history_items.clear()
        self._streaming_text = ""
        self.chat_browser.clear()

    def get_history(self) -> List[dict]:
        return list(self._history_items)

