from __future__ import annotations

from typing import Optional
from PyQt6.QtCore import QObject, pyqtSignal

from .cortex_widget import CortexVisualizer
from .live_engine import GeminiLiveEngine


class CortexLiveController(QObject):
    """
    Thread-safe bridge between the GeminiLiveEngine worker thread and
    the PyQt6 CortexVisualizer widget.
    """

    stateUpdated           = pyqtSignal(str)
    speakingUpdated        = pyqtSignal(bool)
    userTranscriptReceived = pyqtSignal(str)
    aiTranscriptReceived   = pyqtSignal(str)
    logReceived            = pyqtSignal(str)
    errorReceived          = pyqtSignal(str)

    def __init__(
        self,
        visualizer: CortexVisualizer,
        engine: GeminiLiveEngine,
        parent: Optional[QObject] = None,
    ):
        super().__init__(parent)
        self.visualizer = visualizer
        self.engine     = engine

        # Connect Qt Signals to visualizer slots
        self.stateUpdated.connect(self.visualizer.set_state)
        self.speakingUpdated.connect(self.visualizer.set_speaking)

        # Wire Engine Callbacks -> Qt Signals (thread-safe dispatch)
        self.engine.on_state_change     = lambda s: self.stateUpdated.emit(str(s))
        self.engine.on_speaking_change  = lambda b: self.speakingUpdated.emit(bool(b))
        self.engine.on_user_transcript  = lambda t: self.userTranscriptReceived.emit(str(t))
        self.engine.on_ai_transcript    = lambda t: self.aiTranscriptReceived.emit(str(t))
        self.engine.on_log              = lambda l: self.logReceived.emit(str(l))
        self.engine.on_error            = lambda e: self.errorReceived.emit(str(e))

    def start(self) -> None:
        """Starts live audio session."""
        self.engine.start()

    def stop(self) -> None:
        """Stops live audio session."""
        self.engine.stop()

    def interrupt(self) -> None:
        """Interrupts AI speech."""
        self.engine.interrupt()

    def toggle_mute(self) -> bool:
        """Toggles microphone mute state and updates visualizer."""
        new_state = not self.engine.is_muted()
        self.engine.set_muted(new_state)
        self.visualizer.set_muted(new_state)
        return new_state

    def send_text(self, text: str) -> None:
        """Sends text command."""
        self.engine.send_text(text)
