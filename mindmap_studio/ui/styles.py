"""
Impeccable DTCG Design System & Multi-Theme (Dark & Light) QSS Stylesheets for MindMap Studio.
Principles (ux-ui-agent-skills):
- /polish: 1px hairline borders (#1e293b / #e2e8f0), zero visual noise, no harsh pure blacks/whites
- /typeset: Clear scale hierarchy, wide display measures, 60-75ch body reading
- /colorize: Obsidian-slate and crisp warm-paper surfaces with purposeful sapphire (#0284c7) accents
- /distill: Purposeful controls with complete 8-state interactive feedback (resting, hover, focus, active, disabled)
"""

from mindmap_studio.config import config


DARK_THEME_QSS = """
/* =========================================================================
   1. Global Base & Window Styles (Dark Mode)
   ========================================================================= */
QMainWindow, QDialog, QWidget {
    background-color: #080c14;
    color: #f1f5f9;
    font-family: 'Segoe UI', 'Vazirmatn', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    font-size: 13px;
    selection-background-color: #0284c7;
    selection-color: #ffffff;
}

/* ToolTip Styling */
QToolTip {
    background-color: #0f172a;
    color: #f8fafc;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 500;
}

/* =========================================================================
   2. MenuBar & Context Menus
   ========================================================================= */
QMenuBar {
    background-color: #0b1120;
    color: #cbd5e1;
    border-bottom: 1px solid #1e293b;
    padding: 3px 8px;
    font-size: 12px;
}
QMenuBar::item {
    background: transparent;
    padding: 6px 12px;
    border-radius: 6px;
    margin-right: 2px;
}
QMenuBar::item:selected {
    background-color: #1e293b;
    color: #38bdf8;
}
QMenuBar::item:pressed {
    background-color: #0f172a;
}

QMenu {
    background-color: #0b1120;
    color: #f1f5f9;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 6px;
}
QMenu::item {
    padding: 7px 28px 7px 20px;
    border-radius: 5px;
    font-size: 12px;
}
QMenu::item:selected {
    background-color: #1e293b;
    color: #38bdf8;
}
QMenu::item:disabled {
    color: #475569;
}
QMenu::separator {
    height: 1px;
    background-color: #1e293b;
    margin: 5px 8px;
}

/* =========================================================================
   3. ToolBar & Navigation Controls
   ========================================================================= */
QToolBar {
    background-color: #0b1120;
    border-bottom: 1px solid #1e293b;
    padding: 6px 12px;
    spacing: 8px;
}
QToolBar::separator {
    width: 1px;
    background-color: #1e293b;
    margin: 4px 6px;
}

/* =========================================================================
   4. Buttons (Standard, Primary, AI, Danger)
   ========================================================================= */
QPushButton {
    background-color: #0f172a;
    color: #f1f5f9;
    border: 1px solid #334155;
    border-radius: 7px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 500;
    min-height: 20px;
}
QPushButton:hover {
    background-color: #1e293b;
    border-color: #475569;
    color: #38bdf8;
}
QPushButton:pressed {
    background-color: #090e1a;
    border-color: #0284c7;
}
QPushButton:checked {
    background-color: #0c4a6e;
    border-color: #0284c7;
    color: #38bdf8;
    font-weight: 600;
}
QPushButton:disabled {
    background-color: #080c14;
    border-color: #1e293b;
    color: #475569;
}

/* Primary Action Buttons (Crisp Sapphire) */
QPushButton#primaryBtn {
    background-color: #0284c7;
    border: 1px solid #0369a1;
    color: #ffffff;
    font-weight: 600;
}
QPushButton#primaryBtn:hover {
    background-color: #0369a1;
    border-color: #38bdf8;
}
QPushButton#primaryBtn:pressed {
    background-color: #075985;
}
QPushButton#primaryBtn:disabled {
    background-color: #1e293b;
    border-color: #334155;
    color: #64748b;
}

/* AI Specialized Buttons (Subtle Indigo / Violet) */
QPushButton#aiBtn {
    background-color: #1e1b4b;
    border: 1px solid #4338ca;
    color: #c7d2fe;
    font-weight: 600;
}
QPushButton#aiBtn:hover {
    background-color: #312e81;
    border-color: #6366f1;
    color: #ffffff;
}
QPushButton#aiBtn:pressed {
    background-color: #1e1b4b;
}

/* Danger / Delete Buttons */
QPushButton#dangerBtn {
    background-color: #450a0a;
    border: 1px solid #7f1d1d;
    color: #fecaca;
    font-weight: 600;
}
QPushButton#dangerBtn:hover {
    background-color: #7f1d1d;
    border-color: #ef4444;
    color: #ffffff;
}

/* =========================================================================
   5. Form Inputs (LineEdit, TextEdit, ComboBox, SpinBox)
   ========================================================================= */
QLineEdit, QTextEdit, QPlainTextEdit, QSpinBox, QDoubleSpinBox {
    background-color: #060911;
    color: #f8fafc;
    border: 1px solid #1e293b;
    border-radius: 7px;
    padding: 7px 11px;
    font-size: 13px;
    font-family: 'Segoe UI', 'Vazirmatn', -apple-system, sans-serif;
}
QLineEdit:focus, QTextEdit:focus, QPlainTextEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus {
    border: 1px solid #38bdf8;
    background-color: #090e1a;
}
QLineEdit:disabled, QTextEdit:disabled, QPlainTextEdit:disabled {
    background-color: #0b0f19;
    border-color: #1e293b;
    color: #64748b;
}

/* ComboBox */
QComboBox {
    background-color: #090e1a;
    color: #f8fafc;
    border: 1px solid #334155;
    border-radius: 7px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    min-height: 22px;
}
QComboBox:hover {
    border-color: #475569;
}
QComboBox:focus {
    border-color: #38bdf8;
}
QComboBox::drop-down {
    subcontrol-origin: padding;
    subcontrol-position: top right;
    width: 24px;
    border-left: 1px solid #1e293b;
}
QComboBox QAbstractItemView {
    background-color: #0b1120;
    color: #f8fafc;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 4px;
    selection-background-color: #1e293b;
    selection-color: #38bdf8;
}

/* CheckBox */
QCheckBox {
    color: #e2e8f0;
    font-size: 12px;
    spacing: 8px;
}
QCheckBox::indicator {
    width: 18px;
    height: 18px;
    border: 1px solid #334155;
    border-radius: 4px;
    background-color: #060911;
}
QCheckBox::indicator:hover {
    border-color: #38bdf8;
}
QCheckBox::indicator:checked {
    background-color: #0284c7;
    border-color: #38bdf8;
}

/* =========================================================================
   6. Tabs & Segmented Strips
   ========================================================================= */
QTabWidget::pane {
    border: 1px solid #1e293b;
    background-color: #090e1a;
    border-radius: 8px;
    top: -1px;
}
QTabBar::tab {
    background-color: #0b1120;
    color: #94a3b8;
    border: 1px solid #1e293b;
    border-bottom: none;
    padding: 8px 18px;
    margin-right: 3px;
    border-top-left-radius: 7px;
    border-top-right-radius: 7px;
    font-weight: 500;
    font-size: 12px;
}
QTabBar::tab:selected {
    background-color: #090e1a;
    color: #38bdf8;
    border-color: #334155;
    border-bottom: 2px solid #38bdf8;
    font-weight: 600;
}
QTabBar::tab:hover:!selected {
    background-color: #162032;
    color: #e2e8f0;
}

/* =========================================================================
   7. Sliders
   ========================================================================= */
QSlider::groove:horizontal {
    height: 5px;
    background: #1e293b;
    border-radius: 2px;
}
QSlider::sub-page:horizontal {
    background: #0284c7;
    border-radius: 2px;
}
QSlider::handle:horizontal {
    background: #f8fafc;
    border: 2px solid #38bdf8;
    width: 14px;
    margin-top: -5px;
    margin-bottom: -5px;
    border-radius: 7px;
}
QSlider::handle:horizontal:hover {
    background: #38bdf8;
}

/* =========================================================================
   8. ScrollBars (Ultra-Clean Minimal)
   ========================================================================= */
QScrollBar:vertical {
    background: transparent;
    width: 7px;
    margin: 0px;
}
QScrollBar::handle:vertical {
    background: #334155;
    min-height: 24px;
    border-radius: 3px;
}
QScrollBar::handle:vertical:hover {
    background: #475569;
}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    height: 0px;
}
QScrollBar:horizontal {
    background: transparent;
    height: 7px;
    margin: 0px;
}
QScrollBar::handle:horizontal {
    background: #334155;
    min-width: 24px;
    border-radius: 3px;
}
QScrollBar::handle:horizontal:hover {
    background: #475569;
}
QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {
    width: 0px;
}

/* =========================================================================
   9. GroupBox & Splitters
   ========================================================================= */
QGroupBox {
    border: 1px solid #1e293b;
    border-radius: 8px;
    margin-top: 18px;
    padding-top: 14px;
    font-weight: 600;
    color: #94a3b8;
}
QGroupBox::title {
    subcontrol-origin: margin;
    subcontrol-position: top left;
    padding: 0 8px;
    color: #38bdf8;
    font-size: 12px;
}

QSplitter::handle {
    background-color: #1e293b;
}
QSplitter::handle:hover {
    background-color: #38bdf8;
}
QSplitter::handle:horizontal {
    width: 2px;
}
QSplitter::handle:vertical {
    height: 2px;
}

/* =========================================================================
   10. StatusBar
   ========================================================================= */
QStatusBar {
    background-color: #0b1120;
    color: #94a3b8;
    border-top: 1px solid #1e293b;
    padding: 3px 8px;
    font-size: 12px;
}

/* =========================================================================
   11. Specific Panel & Component Styling (Dark Mode)
   ========================================================================= */
QFrame#topBar {
    background-color: #0b1120;
    border-bottom: 1px solid #1e293b;
}
QFrame#canvasToolBar {
    background-color: #090e1a;
    border-bottom: 1px solid #1e293b;
}
QFrame#sidebarFrame {
    background-color: #0b1120;
    border: 1px solid #1e293b;
    border-radius: 8px;
}
QFrame#inspectorFrame {
    background-color: #090e1a;
    border: 1px solid #1e293b;
    border-radius: 7px;
}
QListWidget#nodeList {
    background-color: #060911;
    border: 1px solid #1e293b;
    border-radius: 7px;
    padding: 4px;
    color: #f1f5f9;
    font-size: 12px;
}
QListWidget#nodeList::item {
    padding: 6px 10px;
    border-radius: 5px;
    margin-bottom: 2px;
}
QListWidget#nodeList::item:hover {
    background-color: #0f172a;
    color: #38bdf8;
}
QListWidget#nodeList::item:selected {
    background-color: #1e293b;
    color: #38bdf8;
    font-weight: 600;
}
QFrame#aiChatPanel {
    background-color: #080c14;
    border-top: 1px solid #1e293b;
}
QFrame#aiBannerFrame {
    background-color: #040810;
    border: 1px solid #1e293b;
    border-radius: 8px;
}
QPushButton#cortexLiveBtn {
    background-color: #0c4a6e;
    color: #38bdf8;
    border: 1px solid #0284c7;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
}
QPushButton#cortexLiveBtn:hover {
    background-color: #0284c7;
    color: #ffffff;
}
QPushButton#cortexLiveBtn[active="true"] {
    background-color: #ef4444;
    color: #ffffff;
    border-color: #dc2626;
}
QPushButton#cortexMuteBtn, QPushButton#cortexInterruptBtn {
    background-color: #0f172a;
    color: #94a3b8;
    border: 1px solid #1e293b;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 6px;
}
QPushButton#cortexMuteBtn:hover, QPushButton#cortexInterruptBtn:hover {
    background-color: #1e293b;
    color: #f1f5f9;
    border-color: #334155;
}
QPushButton#cortexMuteBtn:disabled, QPushButton#cortexInterruptBtn:disabled {
    color: #475569;
    border-color: #1e293b;
    background-color: #080c14;
}
QTextBrowser#aiChatBrowser {
    background-color: #0b1120;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 10px 14px;
    color: #f1f5f9;
    font-size: 13px;
    line-height: 1.6;
}
QPlainTextEdit#aiChatInput {
    background-color: #0b1120;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 6px 12px;
    color: #f8fafc;
    font-size: 13px;
}
QPlainTextEdit#aiChatInput:focus {
    border-color: #38bdf8;
}
QFrame#radialHeaderBar {
    background-color: #0b1120;
    border: 1px solid #1e293b;
    border-radius: 8px;
}
QFrame#radialSidePanel {
    background-color: #0b1120;
    border: 1px solid #1e293b;
    border-radius: 8px;
}
"""


LIGHT_THEME_QSS = """
/* =========================================================================
   1. Global Base & Window Styles (Light Mode)
   ========================================================================= */
QMainWindow, QDialog, QWidget {
    background-color: #f8fafc;
    color: #0f172a;
    font-family: 'Segoe UI', 'Vazirmatn', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    font-size: 13px;
    selection-background-color: #0284c7;
    selection-color: #ffffff;
}

/* ToolTip Styling */
QToolTip {
    background-color: #ffffff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 500;
}

/* =========================================================================
   2. MenuBar & Context Menus
   ========================================================================= */
QMenuBar {
    background-color: #f1f5f9;
    color: #334155;
    border-bottom: 1px solid #e2e8f0;
    padding: 3px 8px;
    font-size: 12px;
}
QMenuBar::item {
    background: transparent;
    padding: 6px 12px;
    border-radius: 6px;
    margin-right: 2px;
}
QMenuBar::item:selected {
    background-color: #e2e8f0;
    color: #0284c7;
}
QMenuBar::item:pressed {
    background-color: #cbd5e1;
}

QMenu {
    background-color: #ffffff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 6px;
}
QMenu::item {
    padding: 7px 28px 7px 20px;
    border-radius: 5px;
    font-size: 12px;
}
QMenu::item:selected {
    background-color: #f1f5f9;
    color: #0284c7;
}
QMenu::item:disabled {
    color: #94a3b8;
}
QMenu::separator {
    height: 1px;
    background-color: #e2e8f0;
    margin: 5px 8px;
}

/* =========================================================================
   3. ToolBar & Navigation Controls
   ========================================================================= */
QToolBar {
    background-color: #f1f5f9;
    border-bottom: 1px solid #e2e8f0;
    padding: 6px 12px;
    spacing: 8px;
}
QToolBar::separator {
    width: 1px;
    background-color: #e2e8f0;
    margin: 4px 6px;
}

/* =========================================================================
   4. Buttons (Standard, Primary, AI, Danger)
   ========================================================================= */
QPushButton {
    background-color: #ffffff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    border-radius: 7px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 500;
    min-height: 20px;
}
QPushButton:hover {
    background-color: #f1f5f9;
    border-color: #94a3b8;
    color: #0284c7;
}
QPushButton:pressed {
    background-color: #e2e8f0;
    border-color: #0284c7;
}
QPushButton:checked {
    background-color: #e0f2fe;
    border-color: #0284c7;
    color: #0284c7;
    font-weight: 600;
}
QPushButton:disabled {
    background-color: #f8fafc;
    border-color: #e2e8f0;
    color: #94a3b8;
}

/* Primary Action Buttons (Crisp Sapphire) */
QPushButton#primaryBtn {
    background-color: #0284c7;
    border: 1px solid #0369a1;
    color: #ffffff;
    font-weight: 600;
}
QPushButton#primaryBtn:hover {
    background-color: #0369a1;
    border-color: #0284c7;
}
QPushButton#primaryBtn:pressed {
    background-color: #075985;
}
QPushButton#primaryBtn:disabled {
    background-color: #e2e8f0;
    border-color: #cbd5e1;
    color: #94a3b8;
}

/* AI Specialized Buttons */
QPushButton#aiBtn {
    background-color: #eef2ff;
    border: 1px solid #c7d2fe;
    color: #4338ca;
    font-weight: 600;
}
QPushButton#aiBtn:hover {
    background-color: #e0e7ff;
    border-color: #818cf8;
    color: #3730a3;
}
QPushButton#aiBtn:pressed {
    background-color: #c7d2fe;
}

/* Danger / Delete Buttons */
QPushButton#dangerBtn {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    font-weight: 600;
}
QPushButton#dangerBtn:hover {
    background-color: #fee2e2;
    border-color: #ef4444;
    color: #991b1b;
}

/* =========================================================================
   5. Form Inputs (LineEdit, TextEdit, ComboBox, SpinBox)
   ========================================================================= */
QLineEdit, QTextEdit, QPlainTextEdit, QSpinBox, QDoubleSpinBox {
    background-color: #ffffff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    border-radius: 7px;
    padding: 7px 11px;
    font-size: 13px;
    font-family: 'Segoe UI', 'Vazirmatn', -apple-system, sans-serif;
}
QLineEdit:focus, QTextEdit:focus, QPlainTextEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus {
    border: 1px solid #0284c7;
    background-color: #ffffff;
}
QLineEdit:disabled, QTextEdit:disabled, QPlainTextEdit:disabled {
    background-color: #f1f5f9;
    border-color: #e2e8f0;
    color: #94a3b8;
}

/* ComboBox */
QComboBox {
    background-color: #ffffff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    border-radius: 7px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    min-height: 22px;
}
QComboBox:hover {
    border-color: #94a3b8;
}
QComboBox:focus {
    border-color: #0284c7;
}
QComboBox::drop-down {
    subcontrol-origin: padding;
    subcontrol-position: top right;
    width: 24px;
    border-left: 1px solid #e2e8f0;
}
QComboBox QAbstractItemView {
    background-color: #ffffff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 4px;
    selection-background-color: #f1f5f9;
    selection-color: #0284c7;
}

/* CheckBox */
QCheckBox {
    color: #0f172a;
    font-size: 12px;
    spacing: 8px;
}
QCheckBox::indicator {
    width: 18px;
    height: 18px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    background-color: #ffffff;
}
QCheckBox::indicator:hover {
    border-color: #0284c7;
}
QCheckBox::indicator:checked {
    background-color: #0284c7;
    border-color: #0284c7;
}

/* =========================================================================
   6. Tabs & Segmented Strips
   ========================================================================= */
QTabWidget::pane {
    border: 1px solid #e2e8f0;
    background-color: #f8fafc;
    border-radius: 8px;
    top: -1px;
}
QTabBar::tab {
    background-color: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
    border-bottom: none;
    padding: 8px 18px;
    margin-right: 3px;
    border-top-left-radius: 7px;
    border-top-right-radius: 7px;
    font-weight: 500;
    font-size: 12px;
}
QTabBar::tab:selected {
    background-color: #f8fafc;
    color: #0284c7;
    border-color: #cbd5e1;
    border-bottom: 2px solid #0284c7;
    font-weight: 600;
}
QTabBar::tab:hover:!selected {
    background-color: #e2e8f0;
    color: #0f172a;
}

/* =========================================================================
   7. Sliders
   ========================================================================= */
QSlider::groove:horizontal {
    height: 5px;
    background: #e2e8f0;
    border-radius: 2px;
}
QSlider::sub-page:horizontal {
    background: #0284c7;
    border-radius: 2px;
}
QSlider::handle:horizontal {
    background: #ffffff;
    border: 2px solid #0284c7;
    width: 14px;
    margin-top: -5px;
    margin-bottom: -5px;
    border-radius: 7px;
}
QSlider::handle:horizontal:hover {
    background: #0284c7;
}

/* =========================================================================
   8. ScrollBars
   ========================================================================= */
QScrollBar:vertical {
    background: transparent;
    width: 7px;
    margin: 0px;
}
QScrollBar::handle:vertical {
    background: #cbd5e1;
    min-height: 24px;
    border-radius: 3px;
}
QScrollBar::handle:vertical:hover {
    background: #94a3b8;
}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    height: 0px;
}
QScrollBar:horizontal {
    background: transparent;
    height: 7px;
    margin: 0px;
}
QScrollBar::handle:horizontal {
    background: #cbd5e1;
    min-width: 24px;
    border-radius: 3px;
}
QScrollBar::handle:horizontal:hover {
    background: #94a3b8;
}
QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {
    width: 0px;
}

/* =========================================================================
   9. GroupBox & Splitters
   ========================================================================= */
QGroupBox {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-top: 18px;
    padding-top: 14px;
    font-weight: 600;
    color: #475569;
}
QGroupBox::title {
    subcontrol-origin: margin;
    subcontrol-position: top left;
    padding: 0 8px;
    color: #0284c7;
    font-size: 12px;
}

QSplitter::handle {
    background-color: #e2e8f0;
}
QSplitter::handle:hover {
    background-color: #0284c7;
}
QSplitter::handle:horizontal {
    width: 2px;
}
QSplitter::handle:vertical {
    height: 2px;
}

/* =========================================================================
   10. StatusBar
   ========================================================================= */
QStatusBar {
    background-color: #f1f5f9;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding: 3px 8px;
    font-size: 12px;
}

/* =========================================================================
   11. Specific Panel & Component Styling (Light Mode)
   ========================================================================= */
QFrame#topBar {
    background-color: #f1f5f9;
    border-bottom: 1px solid #e2e8f0;
}
QFrame#canvasToolBar {
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
}
QFrame#sidebarFrame {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}
QFrame#inspectorFrame {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
}
QListWidget#nodeList {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    padding: 4px;
    color: #0f172a;
    font-size: 12px;
}
QListWidget#nodeList::item {
    padding: 6px 10px;
    border-radius: 5px;
    margin-bottom: 2px;
}
QListWidget#nodeList::item:hover {
    background-color: #f1f5f9;
    color: #0284c7;
}
QListWidget#nodeList::item:selected {
    background-color: #e0f2fe;
    color: #0284c7;
    font-weight: 600;
}
QFrame#aiChatPanel {
    background-color: #f8fafc;
    border-top: 1px solid #e2e8f0;
}
QFrame#aiBannerFrame {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}
QPushButton#cortexLiveBtn {
    background-color: #e0f2fe;
    color: #0284c7;
    border: 1px solid #38bdf8;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
}
QPushButton#cortexLiveBtn:hover {
    background-color: #0284c7;
    color: #ffffff;
}
QPushButton#cortexLiveBtn[active="true"] {
    background-color: #ef4444;
    color: #ffffff;
    border-color: #dc2626;
}
QPushButton#cortexMuteBtn, QPushButton#cortexInterruptBtn {
    background-color: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 6px;
}
QPushButton#cortexMuteBtn:hover, QPushButton#cortexInterruptBtn:hover {
    background-color: #e2e8f0;
    color: #0f172a;
    border-color: #cbd5e1;
}
QPushButton#cortexMuteBtn:disabled, QPushButton#cortexInterruptBtn:disabled {
    color: #94a3b8;
    border-color: #f1f5f9;
    background-color: #f8fafc;
}
QTextBrowser#aiChatBrowser {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 14px;
    color: #0f172a;
    font-size: 13px;
    line-height: 1.6;
}
QPlainTextEdit#aiChatInput {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 6px 12px;
    color: #0f172a;
    font-size: 13px;
}
QPlainTextEdit#aiChatInput:focus {
    border-color: #0284c7;
}
QFrame#radialHeaderBar {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}
QFrame#radialSidePanel {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}
"""


def get_theme_qss(theme: str = "") -> str:
    """Returns the QSS stylesheet for the specified theme or the active config theme."""
    active = theme or config.get_theme()
    if active == "light":
        return LIGHT_THEME_QSS
    return DARK_THEME_QSS
