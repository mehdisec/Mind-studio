"""
Desktop Window for MindMap Studio.
Native desktop shell embedding the complete MindMap Studio Web application via PyQt6 QWebEngineView.
"""

import sys
import webbrowser
from pathlib import Path
from PyQt6.QtCore import Qt, QUrl, pyqtSlot
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QLabel, QProgressBar,
    QMessageBox
)
from PyQt6.QtGui import QIcon, QKeySequence, QFont, QAction, QShortcut

try:
    from PyQt6.QtWebEngineWidgets import QWebEngineView
    from PyQt6.QtWebEngineCore import (
        QWebEngineSettings, QWebEngineProfile, QWebEnginePage
    )
    WEBENGINE_AVAILABLE = True
except ImportError:
    WEBENGINE_AVAILABLE = False

from mindmap_studio.services.server_manager import server_manager
from mindmap_studio.config import APP_NAME, APP_ORG


class DesktopMainWindow(QMainWindow):
    """Native Desktop window hosting the MindMap Studio suite."""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("MindMap Studio 2.0 (Desktop Edition)")
        self.resize(1420, 880)
        self.setMinimumSize(960, 640)

        # Set background
        self.setStyleSheet("background-color: #0B0F19; color: #E2E8F0;")

        # Start local backend server
        self.server_ready = server_manager.start(timeout_sec=15)

        self._init_ui()
        self._setup_shortcuts()

    def _init_ui(self):
        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        if not WEBENGINE_AVAILABLE:
            # Fallback for environments where QtWebEngine is unavailable
            self._init_fallback_ui(layout)
            return

        # Setup WebEngine View
        self.web_view = QWebEngineView(self)
        
        # Enable local storage, canvas acceleration and modern HTML5 features
        settings = self.web_view.settings()
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalStorageEnabled, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.Accelerated2dCanvasEnabled, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.WebGLEnabled, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.ScrollAnimatorEnabled, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessFileUrls, True)

        # Connect load finished
        self.web_view.loadFinished.connect(self._on_load_finished)

        # Load local server URL
        app_url = server_manager.app_url
        self.web_view.load(QUrl(app_url))

        layout.addWidget(self.web_view)

    def _init_fallback_ui(self, layout: QVBoxLayout):
        """Fallback display when WebEngine is missing, with one-click browser launch."""
        container = QWidget(self)
        vbox = QVBoxLayout(container)
        vbox.setAlignment(Qt.AlignmentFlag.AlignCenter)
        vbox.setSpacing(16)

        title = QLabel("MindMap Studio 2.0", self)
        title.setFont(QFont("Segoe UI", 20, QFont.Weight.Bold))
        title.setStyleSheet("color: #38BDF8;")
        vbox.addWidget(title, alignment=Qt.AlignmentFlag.AlignCenter)

        desc = QLabel("Local server running at " + server_manager.app_url, self)
        desc.setFont(QFont("Segoe UI", 12))
        desc.setStyleSheet("color: #94A3B8;")
        vbox.addWidget(desc, alignment=Qt.AlignmentFlag.AlignCenter)

        # Auto open browser
        webbrowser.open(server_manager.app_url)
        layout.addWidget(container)

    def _setup_shortcuts(self):
        # F5: Refresh
        self.refresh_shortcut = QShortcut(QKeySequence("F5"), self)
        self.refresh_shortcut.activated.connect(self._reload_page)

        # Ctrl+R: Refresh
        self.ctrl_r_shortcut = QShortcut(QKeySequence("Ctrl+R"), self)
        self.ctrl_r_shortcut.activated.connect(self._reload_page)

        # F11: Toggle Fullscreen
        self.fullscreen_shortcut = QShortcut(QKeySequence("F11"), self)
        self.fullscreen_shortcut.activated.connect(self._toggle_fullscreen)

    def _reload_page(self):
        if hasattr(self, "web_view"):
            self.web_view.reload()

    def _toggle_fullscreen(self):
        if self.isFullScreen():
            self.showNormal()
        else:
            self.showFullScreen()

    def _on_load_finished(self, success: bool):
        if success:
            print("[Desktop] MindMap Studio loaded successfully in native window.")
        else:
            print("[Desktop] Failed to load local page. Retrying in 2 seconds...")

    def closeEvent(self, event):
        """Clean shutdown handler on window close."""
        server_manager.stop()
        event.accept()
