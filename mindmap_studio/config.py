"""
Configuration and settings management for MindMap Studio.
"""

import os
from pathlib import Path
from PyQt6.QtCore import QSettings
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

APP_NAME = "MindMap Studio"
APP_ORG = "MindTracker"
DEFAULT_MODEL = "gemini-1.5-flash"
DEFAULT_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Physics parameters for Anti-Gravity layout (Node spacing and non-overlapping separation)
PHYSICS_DEFAULTS = {
    "repulsion": 9600.0,
    "spring_stiffness": 0.048,
    "spring_length": 84.0,  # 30% reduction from 120.0
    "damping": 0.75,
    "center_gravity": 0.0,
    "min_separation": 56.0,  # 30% reduction from 80.0
    "time_step": 0.036,      # Increased by 20% from 0.03
    "max_velocity": 12.0,    # Increased by 20% from 10.0
    "settle_threshold": 0.05,
}

# Node appearance - Compact Minimal Design with Fixed Size
def get_node_style_for_importance(importance: int = 5):
    """
    Returns visual attributes: solid slate fill, compact minimal size, and clean borders.
    """
    fill_color = "#334155"    # Solid slate
    border_color = "#64748b"  # Clean lighter slate border
    glow_color = "rgba(148, 163, 184, 0.25)"
    
    radius = 4.55             # Compact minimal dot node (30% smaller)
    border_width = 1.2
    glow_radius = 3.0
    
    return {
        "radius": radius,
        "fill_color": fill_color,
        "border_color": border_color,
        "glow_color": glow_color,
        "border_width": border_width,
        "glow_radius": glow_radius
    }




class ConfigManager:
    """Manages persistent application settings using QSettings and environment variables."""
    
    def __init__(self):
        self.settings = QSettings(APP_ORG, APP_NAME)
        
    def get_gemini_api_key(self) -> str:
        """Fetch Gemini API key from QSettings, .env fallback, or default key."""
        key = self.settings.value("gemini_api_key", "").strip()
        if not key:
            key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not key:
            key = DEFAULT_API_KEY
        return key

    def get_api_key(self) -> str:
        """Alias for get_gemini_api_key."""
        return self.get_gemini_api_key()
        
    def set_gemini_api_key(self, api_key: str):
        self.settings.setValue("gemini_api_key", api_key.strip())
        
    def get_vault_path(self) -> str:
        """Fetch current active Obsidian Vault directory."""
        path = self.settings.value("obsidian_vault_path", "").strip()
        if not path:
            path = os.environ.get("DEFAULT_VAULT_PATH", "").strip()
        return path
        
    def set_vault_path(self, path: str):
        self.settings.setValue("obsidian_vault_path", path.strip())
        
    def get_model_name(self) -> str:
        return self.settings.value("gemini_model", DEFAULT_MODEL)
        
    def set_model_name(self, model: str):
        self.settings.setValue("gemini_model", model)
        
    def get_physics_enabled(self) -> bool:
        val = self.settings.value("physics_enabled", True)
        if isinstance(val, str):
            return val.lower() in ("true", "1", "yes")
        if isinstance(val, int):
            return val != 0
        return bool(val)
        
    def set_physics_enabled(self, enabled: bool):
        self.settings.setValue("physics_enabled", bool(enabled))

    def get_language(self) -> str:
        """Returns the configured UI language ('fa' or 'en'). Default is 'fa'."""
        lang = self.settings.value("ui_language", "fa")
        if lang not in ("fa", "en"):
            lang = "fa"
        return lang

    def set_language(self, lang: str):
        if lang in ("fa", "en"):
            self.settings.setValue("ui_language", lang)

    def get_theme(self) -> str:
        """Returns the configured UI theme ('dark' or 'light'). Default is 'dark'."""
        theme = self.settings.value("ui_theme", "dark")
        if theme not in ("dark", "light"):
            theme = "dark"
        return theme

    def set_theme(self, theme: str):
        if theme in ("dark", "light"):
            self.settings.setValue("ui_theme", theme)


# Global singleton configuration manager
config = ConfigManager()

