# 🧠 Gemini Cortex AI Visualizer & Live Audio Engine

A lightweight, self-contained PyQt6 component containing the **3D Holographic AI Brain Cortex**, **Native Audio Waveform**, and **Gemini Live Bidirectional Streaming Engine**.

---

## 📦 What's Inside

* **`cortex_widget.py`**: Standalone PyQt6 `CortexVisualizer` widget (3D neural mesh, cosmic gas nebula, synaptic arcs, silk ribbon waves, equalizers).
* **`live_engine.py`**: Async `GeminiLiveEngine` using `google-genai` and `sounddevice` (16kHz in, 24kHz out, 50ms buffer slicing for instant interruption).
* **`controller.py`**: Thread-safe `CortexLiveController` bridge linking visualizer states with audio events.
* **`example_app.py`**: Ready-to-run PyQt6 application demo.

---

## 🚀 How to Use in Your Destination PyQt6 Project

### 1. Copy the folder
Copy the `gemini_cortex/` folder into your destination project root.

### 2. Install dependencies
```bash
pip install PyQt6 google-genai sounddevice
```

### 3. Embed into any PyQt6 Window / Layout
```python
from PyQt6.QtWidgets import QMainWindow, QVBoxLayout, QWidget
from gemini_cortex import CortexVisualizer, GeminiLiveEngine, CortexLiveController

class MyWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        
        # 1. Create Layout
        central = QWidget(self)
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)

        # 2. Add Cortex 3D Widget
        self.cortex = CortexVisualizer(self)
        layout.addWidget(self.cortex)

        # 3. Initialize Engine & Bridge
        self.engine = GeminiLiveEngine(
            api_key="YOUR_GEMINI_API_KEY",
            system_instruction="You are JARVIS. Answer directly and concisely.",
            voice_name="charon"  # e.g. charon, aoede, kore, fenrir, puck
        )
        self.controller = CortexLiveController(self.cortex, self.engine, self)

        # 4. (Optional) Listen to transcripts
        self.controller.userTranscriptReceived.connect(lambda text: print(f"User: {text}"))
        self.controller.aiTranscriptReceived.connect(lambda text: print(f"AI: {text}"))

        # 5. Start live audio
        self.controller.start()

    def closeEvent(self, event):
        self.controller.stop()
        event.accept()
```

---

## 🎮 Controller API Reference

* `controller.start()`: Connects and starts background microphone & speaker loops.
* `controller.stop()`: Closes session and terminates audio worker.
* `controller.interrupt()`: Instantly cuts off AI speech mid-sentence.
* `controller.toggle_mute()`: Toggles microphone on/off.
* `controller.send_text(text)`: Injects a text prompt into the live conversation.
