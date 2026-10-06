#!/usr/bin/env python3
"""
MindMap Studio - Application Entry Point
Physics-driven interactive knowledge graph with Obsidian Vault and Google Gemini AI integration.
Supports full Persian / English bilingual localization with dynamic RTL/LTR layouts.
"""

import sys
import os
from pathlib import Path

# Ensure root directory is on Python path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont

from mindmap_studio.ui.desktop_window import DesktopMainWindow as MainWindow
from mindmap_studio.config import APP_NAME, APP_ORG
from mindmap_studio.i18n import i18n


def main():
    # Setup High-DPI and Rendering attributes
    if hasattr(Qt.ApplicationAttribute, "AA_EnableHighDpiScaling"):
        QApplication.setAttribute(Qt.ApplicationAttribute.AA_EnableHighDpiScaling, True)
    if hasattr(Qt.ApplicationAttribute, "AA_UseHighDpiPixmaps"):
        QApplication.setAttribute(Qt.ApplicationAttribute.AA_UseHighDpiPixmaps, True)

    app = QApplication(sys.argv)
    app.setApplicationName(APP_NAME)
    app.setOrganizationName(APP_ORG)
    
    # Set default modern font supporting English & Persian typography
    font = QFont("Segoe UI", 10)
    app.setFont(font)

    # Initialize layout direction according to saved language preference
    i18n._apply_layout_direction()

    window = MainWindow()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
