"""
Settings and Configuration Dialog for MindMap Studio.
Manages Language (Bilingual Persian & English), Application Theme (Dark/Light),
Gemini API key, Obsidian Vault directory, model selection, and physics preferences.
"""

from pathlib import Path
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QFileDialog, QGroupBox, QComboBox, QCheckBox,
    QMessageBox
)

from mindmap_studio.config import config, DEFAULT_MODEL
from mindmap_studio.i18n import t, i18n


class SettingsDialog(QDialog):
    """Settings modal dialog with language and theme selection."""
    settings_saved = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.resize(580, 520)
        self._init_ui()
        self._load_current_settings()
        self.retranslate_ui()

    def _init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(14)

        # 0. Language & Localization Group
        self.lang_group = QGroupBox()
        lang_layout = QVBoxLayout(self.lang_group)
        lang_layout.setContentsMargins(12, 14, 12, 12)
        lang_layout.setSpacing(8)

        self.lbl_lang = QLabel()
        self.lbl_lang.setStyleSheet("font-weight: 600; color: #38bdf8; font-size: 12px;")
        lang_layout.addWidget(self.lbl_lang)

        self.combo_language = QComboBox()
        self.combo_language.addItem("🇮🇷 فارسی (Persian)", "fa")
        self.combo_language.addItem("🇬🇧 English (انگلیسی)", "en")
        lang_layout.addWidget(self.combo_language)
        layout.addWidget(self.lang_group)

        # 0.5 Theme & Appearance Group
        self.theme_group = QGroupBox()
        theme_layout = QVBoxLayout(self.theme_group)
        theme_layout.setContentsMargins(12, 14, 12, 12)
        theme_layout.setSpacing(8)

        self.lbl_theme = QLabel()
        self.lbl_theme.setStyleSheet("font-weight: 600; color: #38bdf8; font-size: 12px;")
        theme_layout.addWidget(self.lbl_theme)

        self.combo_theme = QComboBox()
        self.combo_theme.addItem("🌙 Dark Theme", "dark")
        self.combo_theme.addItem("☀️ Light Theme", "light")
        theme_layout.addWidget(self.combo_theme)
        layout.addWidget(self.theme_group)

        # 1. Google Gemini AI Group
        self.ai_group = QGroupBox()
        ai_layout = QVBoxLayout(self.ai_group)
        ai_layout.setContentsMargins(12, 14, 12, 12)
        ai_layout.setSpacing(10)

        # API Key
        self.lbl_key = QLabel()
        self.lbl_key.setStyleSheet("font-weight: 600; color: #38bdf8; font-size: 12px;")
        ai_layout.addWidget(self.lbl_key)

        key_row = QHBoxLayout()
        key_row.setSpacing(8)
        self.edit_api_key = QLineEdit()
        self.edit_api_key.setFixedHeight(34)
        self.edit_api_key.setEchoMode(QLineEdit.EchoMode.Password)
        key_row.addWidget(self.edit_api_key, stretch=1)

        self.btn_toggle_key = QPushButton()
        self.btn_toggle_key.setFixedHeight(34)
        self.btn_toggle_key.setFixedWidth(80)
        self.btn_toggle_key.clicked.connect(self._toggle_key_visibility)
        key_row.addWidget(self.btn_toggle_key)

        self.btn_test_api = QPushButton()
        self.btn_test_api.setFixedHeight(34)
        self.btn_test_api.setStyleSheet("""
            QPushButton {
                background-color: #064e3b;
                color: #ecfdf5;
                font-weight: 600;
                border: 1px solid #059669;
                border-radius: 7px;
                padding: 4px 12px;
                font-size: 12px;
            }
            QPushButton:hover {
                background-color: #047857;
                border-color: #10b981;
            }
            QPushButton:disabled {
                background-color: #1e293b;
                border-color: #334155;
                color: #64748b;
            }
        """)
        self.btn_test_api.clicked.connect(self._test_api_connection)
        key_row.addWidget(self.btn_test_api)

        ai_layout.addLayout(key_row)

        # Model selection
        model_row = QHBoxLayout()
        model_row.setSpacing(8)
        self.lbl_model = QLabel()
        self.lbl_model.setStyleSheet("color: #94a3b8; font-size: 12px;")
        self.lbl_model.setFixedWidth(70)
        
        self.combo_model = QComboBox()
        self.combo_model.setEditable(True)
        self.combo_model.setFixedHeight(34)
        self.combo_model.addItems([
            "gemini-flash-latest",
            "gemini-3.7-flash",
            "gemini-flash-lite-latest",
            "gemini-3-flash-preview",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro"
        ])
        model_row.addWidget(self.lbl_model)
        model_row.addWidget(self.combo_model, stretch=1)
        ai_layout.addLayout(model_row)

        layout.addWidget(self.ai_group)

        # 2. Obsidian Vault Persistence Group
        self.vault_group = QGroupBox()
        vault_layout = QVBoxLayout(self.vault_group)
        vault_layout.setContentsMargins(12, 14, 12, 12)
        vault_layout.setSpacing(10)

        self.lbl_vault = QLabel()
        self.lbl_vault.setStyleSheet("font-weight: 600; color: #38bdf8; font-size: 12px;")
        vault_layout.addWidget(self.lbl_vault)

        vault_row = QHBoxLayout()
        vault_row.setSpacing(8)
        self.edit_vault_path = QLineEdit()
        self.edit_vault_path.setFixedHeight(34)
        vault_row.addWidget(self.edit_vault_path, stretch=1)

        self.btn_browse = QPushButton()
        self.btn_browse.setFixedHeight(34)
        self.btn_browse.clicked.connect(self._browse_vault)
        vault_row.addWidget(self.btn_browse)
        vault_layout.addLayout(vault_row)

        layout.addWidget(self.vault_group)

        # 3. Preferences Group
        self.pref_group = QGroupBox()
        pref_layout = QVBoxLayout(self.pref_group)
        pref_layout.setContentsMargins(12, 14, 12, 12)
        
        self.chk_physics = QCheckBox()
        self.chk_physics.setChecked(True)
        pref_layout.addWidget(self.chk_physics)

        layout.addWidget(self.pref_group)

        layout.addStretch()

        # Action Buttons
        btn_layout = QHBoxLayout()
        btn_layout.setSpacing(10)
        btn_layout.addStretch()

        self.btn_cancel = QPushButton()
        self.btn_cancel.setFixedHeight(34)
        self.btn_cancel.clicked.connect(self.reject)
        btn_layout.addWidget(self.btn_cancel)

        self.btn_save = QPushButton()
        self.btn_save.setObjectName("primaryBtn")
        self.btn_save.setFixedHeight(34)
        self.btn_save.clicked.connect(self._save_settings)
        btn_layout.addWidget(self.btn_save)

        layout.addLayout(btn_layout)

    def retranslate_ui(self):
        """Updates all texts in the dialog according to current language."""
        self.setWindowTitle(t("settings_dialog_title"))
        self.lang_group.setTitle(t("settings_group_lang"))
        self.lbl_lang.setText(t("settings_lbl_lang"))

        self.theme_group.setTitle(t("settings_group_theme"))
        self.lbl_theme.setText(t("settings_lbl_theme"))
        cur_theme_data = self.combo_theme.currentData() or config.get_theme()
        self.combo_theme.setItemText(0, t("settings_theme_dark"))
        self.combo_theme.setItemText(1, t("settings_theme_light"))
        idx = self.combo_theme.findData(cur_theme_data)
        if idx >= 0:
            self.combo_theme.setCurrentIndex(idx)
        
        self.ai_group.setTitle(t("settings_group_ai"))
        self.lbl_key.setText(t("settings_lbl_api_key"))
        self.edit_api_key.setPlaceholderText(t("settings_placeholder_api_key"))
        self.btn_test_api.setText(t("settings_btn_test_api"))
        
        is_hidden = self.edit_api_key.echoMode() == QLineEdit.EchoMode.Password
        self.btn_toggle_key.setText(t("settings_btn_show") if is_hidden else t("settings_btn_hide"))
        
        self.lbl_model.setText(t("settings_lbl_model"))
        if self.combo_model.lineEdit():
            self.combo_model.lineEdit().setPlaceholderText(t("settings_custom_model_hint"))
        
        self.vault_group.setTitle(t("settings_group_vault"))
        self.lbl_vault.setText(t("settings_lbl_vault_path"))
        self.edit_vault_path.setPlaceholderText(t("settings_placeholder_vault"))
        self.btn_browse.setText(t("settings_btn_browse"))
        
        self.pref_group.setTitle(t("settings_group_pref"))
        self.chk_physics.setText(t("settings_chk_physics"))
        
        self.btn_cancel.setText(t("settings_btn_cancel"))
        self.btn_save.setText(t("settings_btn_save"))

    def _load_current_settings(self):
        # Load language
        cur_lang = config.get_language()
        idx = self.combo_language.findData(cur_lang)
        if idx >= 0:
            self.combo_language.setCurrentIndex(idx)

        # Load theme
        cur_theme = config.get_theme()
        t_idx = self.combo_theme.findData(cur_theme)
        if t_idx >= 0:
            self.combo_theme.setCurrentIndex(t_idx)

        self.edit_api_key.setText(config.get_gemini_api_key())
        self.edit_vault_path.setText(config.get_vault_path())
        
        current_model = config.get_model_name()
        index = self.combo_model.findText(current_model)
        if index >= 0:
            self.combo_model.setCurrentIndex(index)
        else:
            self.combo_model.setEditText(current_model)
            
        self.chk_physics.setChecked(config.get_physics_enabled())

    def _toggle_key_visibility(self):
        if self.edit_api_key.echoMode() == QLineEdit.EchoMode.Password:
            self.edit_api_key.setEchoMode(QLineEdit.EchoMode.Normal)
            self.btn_toggle_key.setText(t("settings_btn_hide"))
        else:
            self.edit_api_key.setEchoMode(QLineEdit.EchoMode.Password)
            self.btn_toggle_key.setText(t("settings_btn_show"))

    def _test_api_connection(self):
        """Tests the current API key and model selection."""
        api_key = self.edit_api_key.text().strip()
        model_name = self.combo_model.currentText().strip() or "gemini-2.5-flash"

        if not api_key:
            QMessageBox.warning(self, t("settings_group_ai"), t("settings_placeholder_api_key"))
            return

        self.btn_test_api.setEnabled(False)
        self.btn_test_api.setText("⏳ Testing...")
        
        from mindmap_studio.services.gemini_service import test_api_connection
        success, msg = test_api_connection(api_key, model_name)
        
        self.btn_test_api.setEnabled(True)
        self.btn_test_api.setText(t("settings_btn_test_api"))

        if success:
            QMessageBox.information(self, t("settings_group_ai"), t("settings_api_test_ok"))
        else:
            QMessageBox.warning(self, t("settings_group_ai"), t("settings_api_test_fail", error=msg))

    def _browse_vault(self):
        current = self.edit_vault_path.text() or str(Path.home())
        selected = QFileDialog.getExistingDirectory(self, t("settings_group_vault"), current)
        if selected:
            self.edit_vault_path.setText(selected)

    def _save_settings(self):
        vault_path = self.edit_vault_path.text().strip()
        if vault_path and not Path(vault_path).is_dir():
            QMessageBox.warning(self, t("settings_invalid_path_title"), t("settings_invalid_path_body"))
            return

        # Save language
        chosen_lang = self.combo_language.currentData() or "fa"
        i18n.set_language(chosen_lang)

        # Save theme
        chosen_theme = self.combo_theme.currentData() or "dark"
        config.set_theme(chosen_theme)

        config.set_gemini_api_key(self.edit_api_key.text().strip())
        config.set_vault_path(vault_path)
        
        model_text = self.combo_model.currentText().strip() or "gemini-2.5-flash"
        config.set_model_name(model_text)
        config.set_physics_enabled(self.chk_physics.isChecked())

        self.settings_saved.emit()
        self.accept()
