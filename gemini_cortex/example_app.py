"""
example_app.py — Demonstration of embedding Gemini Cortex in any PyQt6 Application.
"""

import sys
import os
import json
from pathlib import Path

from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLineEdit, QTextEdit, QLabel
)

# Import the standalone package
from gemini_cortex import CortexVisualizer, GeminiLiveEngine, CortexLiveController


def get_api_key() -> str:
    # Try reading from current workspace config or environment variable
    candidate_paths = [
        Path(__file__).resolve().parent.parent / "config" / "api_keys.json",
        Path("config/api_keys.json"),
    ]
    for p in candidate_paths:
        if p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                if "gemini_api_key" in data and data["gemini_api_key"]:
                    return data["gemini_api_key"]
            except Exception:
                pass
    return os.environ.get("GEMINI_API_KEY", "")


class MainWindow(QMainWindow):
    def __init__(self, api_key: str):
        super().__init__()
        self.setWindowTitle("AI Assistant — Cortex HUD & Live Voice")
        self.resize(800, 600)
        self.setStyleSheet("background-color: #00060a; color: #8ffcff;")

        # Central Widget & Layout
        central = QWidget(self)
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        # 1. 3D Cortex Visualizer
        self.cortex = CortexVisualizer(self)
        layout.addWidget(self.cortex, stretch=3)

        # 2. Conversation & Log Display
        self.log_box = QTextEdit(self)
        self.log_box.setReadOnly(True)
        self.log_box.setStyleSheet(
            "background-color: #010d14; border: 1px solid #0d3347; "
            "color: #8ffcff; font-family: Consolas; font-size: 11px; border-radius: 4px;"
        )
        layout.addWidget(self.log_box, stretch=1)

        # 3. Input Controls & Action Buttons
        ctrl_layout = QHBoxLayout()
        
        self.input_field = QLineEdit(self)
        self.input_field.setPlaceholderText("Type a message or just talk through your microphone...")
        self.input_field.setStyleSheet(
            "background-color: #010d14; border: 1px solid #1a5c7a; "
            "color: #ffffff; padding: 8px; border-radius: 4px; font-size: 13px;"
        )
        self.input_field.returnPressed.connect(self._send_text)
        ctrl_layout.addWidget(self.input_field)

        self.btn_send = QPushButton("Send", self)
        self.btn_send.setStyleSheet(
            "background-color: #007a99; color: white; padding: 8px 16px; "
            "font-weight: bold; border-radius: 4px;"
        )
        self.btn_send.clicked.connect(self._send_text)
        ctrl_layout.addWidget(self.btn_send)

        self.btn_mute = QPushButton("Mute Mic", self)
        self.btn_mute.setStyleSheet(
            "background-color: #010d14; border: 1px solid #00d4ff; color: #00d4ff; "
            "padding: 8px 14px; font-weight: bold; border-radius: 4px;"
        )
        self.btn_mute.clicked.connect(self._toggle_mute)
        ctrl_layout.addWidget(self.btn_mute)

        self.btn_interrupt = QPushButton("Interrupt (ESC)", self)
        self.btn_interrupt.setStyleSheet(
            "background-color: #ff3355; color: white; padding: 8px 14px; "
            "font-weight: bold; border-radius: 4px;"
        )
        self.btn_interrupt.clicked.connect(self._interrupt)
        ctrl_layout.addWidget(self.btn_interrupt)

        layout.addLayout(ctrl_layout)

        # 4. Initialize Gemini Live Engine & Controller Bridge
        self.engine = GeminiLiveEngine(
            api_key=api_key,
            system_instruction=(
                "You are an advanced, intelligent AI assistant. "
                "Respond naturally, concisely, and efficiently in the user's language."
            ),
            voice_name="charon",
        )
        self.controller = CortexLiveController(self.cortex, self.engine, self)

        # Connect Transcript & Log Signals to UI
        self.controller.userTranscriptReceived.connect(lambda t: self._append_log(f"You: {t}"))
        self.controller.aiTranscriptReceived.connect(lambda t: self._append_log(f"AI: {t}"))
        self.controller.logReceived.connect(lambda l: self._append_log(f"[{l}]"))

        # Start live session
        self.controller.start()

    def _append_log(self, text: str):
        self.log_box.append(text)

    def _send_text(self):
        text = self.input_field.text().strip()
        if text:
            self._append_log(f"You (Text): {text}")
            self.controller.send_text(text)
            self.input_field.clear()

    def _toggle_mute(self):
        is_muted = self.controller.toggle_mute()
        self.btn_mute.setText("Unmute Mic" if is_muted else "Mute Mic")
        self.btn_mute.setStyleSheet(
            "background-color: #ff3355; color: white; padding: 8px 14px; font-weight: bold; border-radius: 4px;"
            if is_muted else
            "background-color: #010d14; border: 1px solid #00d4ff; color: #00d4ff; padding: 8px 14px; font-weight: bold; border-radius: 4px;"
        )

    def _interrupt(self):
        self.controller.interrupt()

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Escape:
            self._interrupt()
        else:
            super().keyPressEvent(event)

    def closeEvent(self, event):
        self.controller.stop()
        event.accept()


if __name__ == "__main__":
    app = QApplication(sys.argv)
    api_key = get_api_key()
    if not api_key:
        print("[WARNING] No API key found. Pass your GEMINI_API_KEY environment variable or configure config/api_keys.json.")
    window = MainWindow(api_key=api_key)
    window.show()
    sys.exit(app.exec())
