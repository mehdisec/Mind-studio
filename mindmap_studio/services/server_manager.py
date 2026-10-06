"""
Local Node.js Backend Server Manager for Desktop Edition.
Spawns and monitors the local MindMap Studio backend process.
"""

import os
import sys
import time
import subprocess
import urllib.request
import atexit
from pathlib import Path
from typing import Optional

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "mindmap-web" / "backend"
BACKEND_ENTRY = BACKEND_DIR / "dist" / "index.js"
HEALTH_URL = "http://localhost:5000/api/health"


class LocalServerManager:
    """Manages the background Node.js server lifecycle for the desktop app."""

    def __init__(self, port: int = 5000):
        self.port = port
        self.health_url = f"http://localhost:{port}/api/health"
        self.app_url = f"http://localhost:{port}"
        self.process: Optional[subprocess.Popen] = None
        self._owned_process = False

        # Register exit handler
        atexit.register(self.stop)

    def is_server_running(self) -> bool:
        """Check if the backend server is already up and healthy."""
        try:
            req = urllib.request.Request(self.health_url, headers={"User-Agent": "MindMapStudio-Desktop/2.0"})
            with urllib.request.urlopen(req, timeout=1.5) as response:
                return response.status == 200
        except Exception:
            return False

    def start(self, timeout_sec: int = 15) -> bool:
        """Ensure the backend server is running. Starts process if needed."""
        if self.is_server_running():
            print(f"[Desktop] Backend server is already running at {self.app_url}")
            return True

        if not BACKEND_ENTRY.exists():
            print(f"[Desktop] Warning: {BACKEND_ENTRY} not found. Trying fallback build...")
            try:
                subprocess.run(["npm", "run", "build"], cwd=str(BACKEND_DIR), shell=True, check=True)
            except Exception as e:
                print(f"[Desktop] Error building backend: {e}")

        print(f"[Desktop] Launching local backend server from {BACKEND_DIR}...")
        
        # Configure flags for Windows to prevent annoying console popup
        creationflags = 0
        if sys.platform == "win32":
            creationflags = subprocess.CREATE_NO_WINDOW

        env = os.environ.copy()
        env["PORT"] = str(self.port)

        try:
            self.process = subprocess.Popen(
                ["node", "dist/index.js"],
                cwd=str(BACKEND_DIR),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=creationflags
            )
            self._owned_process = True
        except Exception as err:
            print(f"[Desktop] Failed to spawn node process: {err}")
            return False

        # Wait for server to become healthy
        start_time = time.time()
        while time.time() - start_time < timeout_sec:
            if self.is_server_running():
                print(f"[Desktop] Backend server successfully started and verified at {self.app_url}!")
                return True
            time.sleep(0.3)

        print("[Desktop] Timeout waiting for backend server to start.")
        return False

    def stop(self):
        """Cleanly terminate the local backend process if we spawned it."""
        if self._owned_process and self.process:
            print("[Desktop] Stopping local backend server...")
            try:
                self.process.terminate()
                self.process.wait(timeout=3)
            except Exception:
                try:
                    self.process.kill()
                except Exception:
                    pass
            self.process = None
            self._owned_process = False


# Global singleton instance
server_manager = LocalServerManager()
