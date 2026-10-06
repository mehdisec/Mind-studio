from __future__ import annotations

import asyncio
import queue
import re
import threading
import time
import traceback
from typing import Callable, Optional, Dict, Any, List

import sounddevice as sd
from google import genai
from google.genai import types


class GeminiLiveEngine:
    """
    Decoupled, ultra-low latency Gemini Live bidirectional audio streaming engine.
    Uses google-genai WebSocket live API, dedicated audio playback thread, and
    acoustic echo suppression for smooth real-time voice conversations.
    """

    DEFAULT_MODEL = "gemini-2.5-flash-native-audio-latest"
    SEND_SAMPLE_RATE    = 16000
    RECEIVE_SAMPLE_RATE = 24000
    CHANNELS            = 1
    CHUNK_SIZE          = 1024

    def __init__(
        self,
        api_key: str,
        system_instruction: str = "You are a helpful and efficient AI assistant.",
        voice_name: str = "charon",
        model: Optional[str] = None,
        tool_declarations: Optional[List[Dict[str, Any]]] = None,
        tool_executor: Optional[Callable[[str, Dict[str, Any]], Any]] = None,
    ):
        self.api_key            = api_key.strip()
        self.system_instruction = system_instruction
        self.voice_name         = voice_name or "charon"
        
        # Normalize model name for Live API (bidiGenerateContent requires native-audio models)
        raw_model = (model or self.DEFAULT_MODEL).strip()
        if raw_model.startswith("models/"):
            raw_model = raw_model[len("models/"):]
        if not ("native-audio" in raw_model or "live" in raw_model):
            raw_model = self.DEFAULT_MODEL
        self.model = raw_model

        self.tool_declarations  = tool_declarations or []
        self.tool_executor      = tool_executor

        self.session            = None
        self.out_queue          = None
        self._playback_queue: queue.Queue = queue.Queue(maxsize=2000)
        self._loop              = None
        self._is_speaking       = False
        self._speaking_lock     = threading.Lock()
        self._last_audio_played_time = 0.0
        self._muted             = False
        self._interrupted       = False
        self._running           = False
        self._thread: Optional[threading.Thread] = None
        self._audio_out_thread: Optional[threading.Thread] = None

        # Callbacks (can be connected to Qt signals)
        self.on_state_change: Optional[Callable[[str], None]] = None
        self.on_speaking_change: Optional[Callable[[bool], None]] = None
        self.on_user_transcript: Optional[Callable[[str], None]] = None
        self.on_ai_transcript: Optional[Callable[[str], None]] = None
        self.on_log: Optional[Callable[[str], None]] = None
        self.on_error: Optional[Callable[[str], None]] = None

    def start(self) -> None:
        """Starts the engine and dedicated audio output thread."""
        if self._running:
            return
        self._running = True
        self._interrupted = False
        self._clear_playback_queue()

        # Start dedicated low-latency audio output thread
        self._audio_out_thread = threading.Thread(
            target=self._play_audio_loop,
            daemon=True,
            name="GeminiLiveAudioOut"
        )
        self._audio_out_thread.start()

        # Start network event loop thread
        self._thread = threading.Thread(
            target=self._run_thread,
            daemon=True,
            name="GeminiLiveWorker"
        )
        self._thread.start()

    def stop(self) -> None:
        """Stops the engine and closes connections gracefully."""
        self._running = False
        self._clear_playback_queue()
        self._set_speaking(False)

    def set_muted(self, muted: bool) -> None:
        """Mutes or unmutes the microphone."""
        self._muted = muted
        self._notify_state("MUTED" if muted else ("SPEAKING" if self._is_speaking else "LISTENING"))

    def is_muted(self) -> bool:
        return self._muted

    def interrupt(self) -> None:
        """Instantly cuts off AI speech mid-sentence and discards queued audio buffer."""
        self._interrupted = True
        self._clear_playback_queue()
        self._set_speaking(False)
        self._log("SYS: Interrupted — listening...")

    def send_text(self, text: str) -> None:
        """Sends a text prompt into the active live session."""
        if not self._loop or not self.session:
            return
        asyncio.run_coroutine_threadsafe(
            self.session.send_client_content(
                turns={"parts": [{"text": text}]},
                turn_complete=True
            ),
            self._loop
        )

    def _clear_playback_queue(self) -> None:
        while not self._playback_queue.empty():
            try:
                self._playback_queue.get_nowait()
            except Exception:
                break

    # ── Internal Callbacks & State ──────────────────────────────────────

    def _set_speaking(self, value: bool) -> None:
        state_to_notify = None
        with self._speaking_lock:
            if self._is_speaking != value:
                self._is_speaking = value
                state_to_notify = "SPEAKING" if value else ("MUTED" if self._muted else "LISTENING")

        if state_to_notify is not None:
            if self.on_speaking_change:
                try:
                    self.on_speaking_change(value)
                except Exception:
                    pass
            self._notify_state(state_to_notify)

    def _notify_state(self, state: str) -> None:
        if self.on_state_change:
            try:
                self.on_state_change(state)
            except Exception:
                pass

    def _log(self, text: str) -> None:
        if self.on_log:
            try:
                self.on_log(text)
            except Exception:
                pass

    # ── Dedicated Audio Output Worker ───────────────────────────────────

    def _play_audio_loop(self) -> None:
        """Dedicated audio playback loop running on an isolated OS thread."""
        try:
            stream = sd.RawOutputStream(
                samplerate=self.RECEIVE_SAMPLE_RATE,
                channels=self.CHANNELS,
                dtype="int16",
                blocksize=self.CHUNK_SIZE,
            )
            stream.start()
        except Exception as e:
            self._log(f"ERR (Audio Output Device): {e}")
            if self.on_error:
                try:
                    self.on_error(f"Audio output device error: {e}")
                except Exception:
                    pass
            return

        try:
            while self._running:
                try:
                    chunk = self._playback_queue.get(timeout=0.05)
                except queue.Empty:
                    # Silence hangover period to prevent acoustic echo trigger
                    if self._is_speaking and (time.time() - self._last_audio_played_time > 0.3):
                        self._set_speaking(False)
                    continue

                if self._interrupted:
                    continue

                if not self._is_speaking:
                    self._set_speaking(True)

                self._last_audio_played_time = time.time()
                try:
                    stream.write(chunk)
                except Exception:
                    pass
        finally:
            self._set_speaking(False)
            try:
                stream.stop()
                stream.close()
            except Exception:
                pass

    # ── Background Async Network Loop ───────────────────────────────────

    def _run_thread(self) -> None:
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        try:
            self._loop.run_until_complete(self._main_loop())
        except Exception:
            pass
        finally:
            try:
                pending = [t for t in asyncio.all_tasks(self._loop) if not t.done()]
                for task in pending:
                    task.cancel()
                if pending:
                    self._loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                self._loop.run_until_complete(self._loop.shutdown_asyncgens())
            except Exception:
                pass
            finally:
                try:
                    self._loop.close()
                except Exception:
                    pass
                self._loop = None

    def _build_config(self) -> types.LiveConnectConfig:
        tools = [{"function_declarations": self.tool_declarations}] if self.tool_declarations else None
        return types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            output_audio_transcription={},
            input_audio_transcription={},
            system_instruction=types.Content(parts=[types.Part.from_text(text=self.system_instruction)]),
            tools=tools,
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=self.voice_name
                    )
                )
            ),
        )

    async def _main_loop(self) -> None:
        consecutive_failures = 0
        MAX_CONSECUTIVE_FAILURES = 3
        backoff = 3

        while self._running:
            try:
                self._notify_state("THINKING")
                self._log("SYS: Connecting to Gemini Live...")
                config = self._build_config()

                client = genai.Client(
                    api_key=self.api_key,
                    http_options={"api_version": "v1beta"}
                )

                async with (
                    client.aio.live.connect(model=self.model, config=config) as session,
                    asyncio.TaskGroup() as tg,
                ):
                    self.session        = session
                    self.out_queue      = asyncio.Queue(maxsize=100)
                    self._interrupted   = False
                    consecutive_failures = 0  # Reset on successful connection
                    backoff             = 3

                    self._notify_state("LISTENING")
                    self._log(f"SYS: Live connected with {self.model}.")

                    tg.create_task(self._send_realtime())
                    tg.create_task(self._listen_audio())
                    tg.create_task(self._receive_audio())

            except KeyboardInterrupt:
                break
            except asyncio.CancelledError:
                break
            except Exception as e:
                err = str(e)
                lower_err = err.lower()
                consecutive_failures += 1

                # 1. Quota Exhaustion / 429 Rate Limit -> STOP IMMEDIATELY (Prevent API lockout)
                if "429" in err or "resource_exhausted" in lower_err or "quota" in lower_err:
                    msg = "Gemini API Quota Exceeded (429 Rate Limit). Live voice session stopped to prevent account restriction."
                    self._log(f"ERR: {msg}")
                    self._notify_state("DISCONNECTED")
                    self._running = False
                    if self.on_error:
                        try:
                            self.on_error(msg)
                        except Exception:
                            pass
                    break

                # 2. Unsupported Live Model (1008) -> Auto-switch to native-audio model
                if "1008" in err or "not supported for bidigeneratecontent" in lower_err:
                    if self.model != "gemini-2.5-flash-native-audio-latest":
                        self._log(f"SYS: Model {self.model} not supported for Live Audio. Switching to gemini-2.5-flash-native-audio-latest...")
                        self.model = "gemini-2.5-flash-native-audio-latest"
                        consecutive_failures = 0
                        continue

                # 3. Authentication / Permission / Invalid API Key -> STOP IMMEDIATELY
                if any(kw in lower_err for kw in ("api key not valid", "1007", "401", "403", "unauthenticated", "permission_denied", "invalid argument")):
                    msg = "Invalid or unauthorized Gemini API Key. Live session stopped."
                    self._log(f"ERR: {msg}")
                    self._notify_state("DISCONNECTED")
                    self._running = False
                    if self.on_error:
                        try:
                            self.on_error(msg)
                        except Exception:
                            pass
                    break

                # 4. Consecutive Failures Guard -> STOP LOOP after 3 attempts
                if consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
                    msg = f"Connection failed after {consecutive_failures} attempts. Stopping Live session to prevent API rate limiting."
                    self._log(f"ERR: {msg}")
                    self._notify_state("DISCONNECTED")
                    self._running = False
                    if self.on_error:
                        try:
                            self.on_error(msg)
                        except Exception:
                            pass
                    break

                self._log(f"ERR ({consecutive_failures}/{MAX_CONSECUTIVE_FAILURES}): {err[:100]}")
            finally:
                self.session = None

            self._set_speaking(False)
            self._notify_state("SLEEPING")

            if self._running:
                self._log(f"NET: Reconnecting in {backoff}s...")
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 20)

    async def _send_realtime(self) -> None:
        """Sends captured microphone PCM audio chunks to Gemini Live with full mime rate headers."""
        try:
            while self._running:
                try:
                    pcm_data = await asyncio.wait_for(self.out_queue.get(), timeout=0.05)
                except asyncio.TimeoutError:
                    continue
                if self.session:
                    blob = types.Blob(
                        data=pcm_data,
                        mime_type=f"audio/pcm;rate={self.SEND_SAMPLE_RATE}"
                    )
                    await self.session.send_realtime_input(media=blob)
        except asyncio.CancelledError:
            pass

    async def _listen_audio(self) -> None:
        """Captures microphone input and buffers chunks with acoustic echo suppression."""
        loop = self._loop

        def callback(indata, frames, time_info, status):
            if not self._running or not loop or loop.is_closed():
                return
            
            # Acoustic echo suppression: do not transmit while AI is speaking or during hangover
            is_speaking = self._is_speaking or (time.time() - self._last_audio_played_time < 0.25)
            if not is_speaking and not self._muted and self.out_queue:
                data = indata.tobytes()
                try:
                    loop.call_soon_threadsafe(
                        self.out_queue.put_nowait,
                        data
                    )
                except Exception:
                    pass

        try:
            with sd.InputStream(
                samplerate=self.SEND_SAMPLE_RATE,
                channels=self.CHANNELS,
                dtype="int16",
                blocksize=self.CHUNK_SIZE,
                callback=callback,
            ):
                while self._running:
                    await asyncio.sleep(0.05)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            self._log(f"ERR (Mic): {e}")
            if self.on_error:
                try:
                    self.on_error(f"Microphone input error: {e}")
                except Exception:
                    pass

    async def _receive_audio(self) -> None:
        """Receives streaming audio and transcripts from Gemini Live session."""
        out_buf, in_buf = [], []
        _ctrl_re = re.compile(r"<ctrl\d+>", re.IGNORECASE)

        def clean(txt: str) -> str:
            t = _ctrl_re.sub("", txt)
            return re.sub(r"[\x00-\x08\x0b-\x1f]", "", t).strip()

        try:
            while self._running and self.session:
                async for response in self.session.receive():
                    if not self._running:
                        break

                    # Process Server Content (Audio, Transcripts, Parts & Turn Signals)
                    if response.server_content:
                        sc = response.server_content

                        # Server interruption signal
                        if sc.interrupted:
                            self._clear_playback_queue()
                            self._set_speaking(False)
                            self._interrupted = False
                            in_buf, out_buf = [], []

                        # Extract audio data exactly once directly from model_turn parts
                        if sc.model_turn and sc.model_turn.parts:
                            for part in sc.model_turn.parts:
                                if part.inline_data and part.inline_data.data:
                                    if not self._interrupted:
                                        self._playback_queue.put(part.inline_data.data)

                        # Output audio spoken transcript
                        if sc.output_transcription and sc.output_transcription.text:
                            txt = clean(sc.output_transcription.text)
                            if txt and (not out_buf or txt != out_buf[-1]):
                                out_buf.append(txt)

                        # User input audio speech transcript
                        if sc.input_transcription and sc.input_transcription.text:
                            txt = clean(sc.input_transcription.text)
                            if txt and (not in_buf or txt != in_buf[-1]):
                                in_buf.append(txt)

                        # Turn Complete: Emit completed sentences
                        if sc.turn_complete:
                            if self._interrupted:
                                self._interrupted = False
                                in_buf, out_buf = [], []
                                continue

                            full_in = " ".join(in_buf).strip()
                            if full_in and self.on_user_transcript:
                                self.on_user_transcript(full_in)
                            in_buf = []

                            full_out = " ".join(out_buf).strip()
                            if full_out and self.on_ai_transcript:
                                self.on_ai_transcript(full_out)
                            out_buf = []

                    # 3. Tool calling delegation (if tools are registered)
                    if response.tool_call and self.tool_executor:
                        fn_responses = []
                        for fc in response.tool_call.function_calls:
                            self._notify_state("THINKING")
                            res = self.tool_executor(fc.name, dict(fc.args or {}))
                            if asyncio.iscoroutine(res):
                                res = await res
                            fn_responses.append(types.FunctionResponse(
                                id=fc.id, name=fc.name, response={"result": str(res)}
                            ))
                        await self.session.send_tool_response(function_responses=fn_responses)
                        if not self._muted:
                            self._notify_state("LISTENING")

        except Exception as e:
            self._log(f"ERR (Recv): {e}")
            raise
