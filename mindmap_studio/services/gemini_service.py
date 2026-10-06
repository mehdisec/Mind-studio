from dataclasses import dataclass, field
import json
import re
import urllib.request
import urllib.error
from typing import List, Optional, Tuple, Dict, Any
from PyQt6.QtCore import QObject, QThread, pyqtSignal

from mindmap_studio.models.graph_models import AIInsight, AIDeepDiveResult
from mindmap_studio.config import config


@dataclass
class AIChatAction:
    """Represents an autonomous graph action requested by the AI assistant."""
    action_type: str  # 'add_node', 'delete_node', 'connect_nodes'
    title: str = ""
    content: str = ""
    importance: int = 5
    tags: List[str] = field(default_factory=list)
    connects_to: List[str] = field(default_factory=list)
    source_title: str = ""
    target_title: str = ""
    node_id: str = ""


def test_api_connection(api_key: str, model_name: str) -> Tuple[bool, str]:
    """Tests API connectivity with a lightweight prompt."""
    try:
        resp = call_gemini_api("Reply 'OK'", api_key.strip(), model_name.strip())
        if resp:
            return True, "Success"
        return False, "Empty response from API"
    except Exception as e:
        return False, str(e)


def format_gemini_error(raw_msg: str) -> str:
    """Formats Gemini API errors into clear, actionable Persian descriptions."""
    lower = raw_msg.lower()
    if "429" in lower or "quota" in lower or "resource_exhausted" in lower or "rate limit" in lower:
        return "سهمیه درخواست یا مصرف توکن هوش مصنوعی موقتاً به پایان رسیده است (Rate Limit / Quota Exceeded). لطفاً دقایقی دیگر مجدداً تلاش کنید."
    if "401" in lower or "403" in lower or "api_key_invalid" in lower or "unauthenticated" in lower or "permission_denied" in lower:
        return "کلید API هوش مصنوعی نامعتبر یا منقضی شده است (Invalid API Key). لطفاً در منوی تنظیمات (Ctrl+,) کلید را بررسی کنید."
    if "503" in lower or "unavailable" in lower or "overloaded" in lower or "high demand" in lower:
        return "سرورهای هوش مصنوعی با بار ترافیکی بالا مواجه هستند (Service Unavailable / 503). لطفاً لحظاتی دیگر تلاش کنید."
    if "safety" in lower or "blocked" in lower or "recitation" in lower:
        return "درخواست توسط فیلترهای ایمنی یا قوانین محتوایی مدل مسدود گردید (Safety Block)."
    if "404" in lower or "not found" in lower:
        return "مدل هوش مصنوعی در دسترس نیست یا نسخه آن منقضی شده است (Model Not Found)."
    return raw_msg


def call_gemini_api(prompt: str, api_key: str, model_name: str = "gemini-3.6-flash") -> str:
    """Synchronous REST request to Google Gemini API with strict anti-loop and quota-protective guards."""
    clean_key = api_key.strip()
    clean_model = model_name.strip()
    if clean_model.startswith("models/"):
        clean_model = clean_model[7:]
    if not clean_model:
        clean_model = "gemini-3.6-flash"

    # Candidate active models in order
    candidate_models = [clean_model]
    for fallback in ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]:
        if fallback not in candidate_models:
            candidate_models.append(fallback)

    payload_dict = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 2048
        }
    }
    payload_bytes = json.dumps(payload_dict).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": clean_key
    }

    last_error_msg = None
    for idx, model in enumerate(candidate_models):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={clean_key}"
        req = urllib.request.Request(url, data=payload_bytes, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
        except urllib.error.HTTPError as e:
            err_msg = str(e)
            try:
                err_body = e.read().decode("utf-8")
                err_json = json.loads(err_body)
                if "error" in err_json:
                    err_msg = err_json["error"].get("message", str(e))
            except Exception:
                pass

            last_error_msg = f"HTTP {e.code}: {err_msg}"
            lower_err = err_msg.lower()

            # Quota exceeded (429) or Auth error (401/403) -> FAIL FAST immediately, NEVER retry
            if e.code in (429, 401, 403) or "quota" in lower_err or "resource_exhausted" in lower_err:
                raise RuntimeError(last_error_msg)

            # Only fallback if model itself was not found (404) and this is the first attempt
            if idx == 0 and (e.code == 404 or (e.code == 400 and any(kw in lower_err for kw in ("not found", "not supported", "is not a valid", "invalid model")))):
                continue
            raise RuntimeError(last_error_msg)
        except Exception as ex:
            # Network/timeout error: fail immediately without hammering alternative endpoints
            raise RuntimeError(f"Network error communicating with Gemini API: {ex}")

    if last_error_msg:
        raise RuntimeError(f"Could not connect to Gemini API: {last_error_msg}")
    raise RuntimeError("Could not connect to Gemini API.")


def stream_gemini_api(prompt: str, api_key: str, model_name: str = "gemini-3.6-flash", on_chunk=None) -> str:
    """Streams response from Google Gemini API via Server-Sent Events (SSE) with strict anti-loop safeguards."""
    clean_key = api_key.strip()
    clean_model = model_name.strip()
    if clean_model.startswith("models/"):
        clean_model = clean_model[7:]
    if not clean_model:
        clean_model = "gemini-3.6-flash"

    # Candidate active models in order
    candidate_models = [clean_model]
    for fallback in ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]:
        if fallback not in candidate_models:
            candidate_models.append(fallback)

    payload_dict = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 2048
        }
    }
    payload_bytes = json.dumps(payload_dict).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": clean_key
    }

    last_error_msg = None
    for idx, model in enumerate(candidate_models):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={clean_key}"
        req = urllib.request.Request(url, data=payload_bytes, headers=headers, method="POST")
        try:
            full_text = ""
            with urllib.request.urlopen(req, timeout=35) as resp:
                for line in resp:
                    line_str = line.decode("utf-8").strip()
                    if line_str.startswith("data: "):
                        raw_data = line_str[6:].strip()
                        if not raw_data:
                            continue
                        try:
                            data_json = json.loads(raw_data)
                            candidates = data_json.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts and "text" in parts[0]:
                                    chunk = parts[0]["text"]
                                    full_text += chunk
                                    if on_chunk:
                                        on_chunk(chunk, full_text)
                        except Exception:
                            pass
            if full_text:
                return full_text
        except urllib.error.HTTPError as e:
            err_msg = str(e)
            try:
                err_body = e.read().decode("utf-8")
                err_json = json.loads(err_body)
                if "error" in err_json:
                    err_msg = err_json["error"].get("message", str(e))
            except Exception:
                pass

            last_error_msg = f"HTTP {e.code}: {err_msg}"
            lower_err = err_msg.lower()

            # Quota exceeded (429) or Auth error (401/403) -> FAIL FAST immediately, NEVER retry
            if e.code in (429, 401, 403) or "quota" in lower_err or "resource_exhausted" in lower_err:
                raise RuntimeError(last_error_msg)

            # Only fallback if model itself was not found (404) and this is the first attempt
            if idx == 0 and (e.code == 404 or (e.code == 400 and any(kw in lower_err for kw in ("not found", "not supported", "is not a valid", "invalid model")))):
                continue
            raise RuntimeError(last_error_msg)
        except Exception as ex:
            # Network/timeout error: fail immediately without hammering alternative endpoints
            raise RuntimeError(f"Network error communicating with Gemini API: {ex}")

    if last_error_msg:
        raise RuntimeError(f"Could not connect to Gemini API: {last_error_msg}")
    raise RuntimeError("Could not connect to Gemini API.")


class GeminiWorkerThread(QThread):
    """Dedicated background QThread executing full Gemini deep-dive analysis (Insights + Socratic Questions)."""
    analysis_started = pyqtSignal()
    analysis_progress = pyqtSignal(str)
    analysis_finished = pyqtSignal(list, list)  # List[AIInsight], List[str] (Socratic questions)
    analysis_error = pyqtSignal(str)

    def __init__(self, topic: str, context_notes: str = "", importance: int = 5, 
                 api_key: str = "", model_name: str = "gemini-3.7-flash", parent=None):
        super().__init__(parent)
        self.topic = topic
        self.context_notes = context_notes
        self.importance = importance
        self.api_key = (api_key or config.get_gemini_api_key()).strip()
        self.model_name = model_name or config.get_model_name()
        self._is_cancelled = False

    def cancel(self):
        self._is_cancelled = True

    def run(self):
        self.analysis_started.emit()
        self.analysis_progress.emit("Connecting to Google Gemini API...")
        
        if not self.api_key:
            self.analysis_error.emit(
                "Gemini API Key is not configured.\n\n"
                "Please set your GEMINI_API_KEY in the Settings menu (Ctrl+,) or in the .env file."
            )
            return

        if self._is_cancelled:
            return

        try:
            self.analysis_progress.emit(f"Analyzing '{self.topic}' with Gemini AI...")
            
            prompt = self._build_prompt()
            response_text = call_gemini_api(prompt, self.api_key, self.model_name)
            
            if self._is_cancelled:
                return

            self.analysis_progress.emit("Parsing conceptual breakdown & Socratic questions...")
            insights, socratic_questions = self._parse_response(response_text)
            
            if not insights:
                self.analysis_error.emit("The AI response did not contain valid structured sub-concepts. Please try again.")
                return

            if self._is_cancelled:
                return

            self.analysis_progress.emit(f"Generated {len(insights)} insights & {len(socratic_questions)} Socratic questions.")
            self.analysis_finished.emit(insights, socratic_questions)
            
        except Exception as e:
            if self._is_cancelled:
                return
            formatted_msg = format_gemini_error(str(e))
            self.analysis_error.emit(formatted_msg)

    def _build_prompt(self) -> str:
        is_idea = bool(re.search(r'ایده|idea', self.topic, re.IGNORECASE))
        is_persian = (config.get_language() == "fa") or bool(re.search(r'[\u0600-\u06FF]', self.topic + " " + self.context_notes))
        lang_instruction = (
            "LANGUAGE: Strictly Persian (فارسی روان، دقیق، کاربردی و ساختاریافته)."
            if is_persian else
            "LANGUAGE: Concise English."
        )

        mode_directive = (
            "MODE: IDEA EXECUTION & MILESTONES (مراحل رسیدن به ایده)\n"
            "The topic is an 'IDEA / ایده'. Generate:\n"
            "1. Sequential actionable steps, phases, and milestones required to research, validate, design, build, and execute this idea into reality (مراحل گام‌به‌گام برای تحقق و پیاده‌سازی ایده).\n"
            "2. 5 critical Socratic questions probing the idea's feasibility, product-market fit, adoption bottlenecks, and critical execution risks."
            if is_idea else
            "MODE: CONCEPTUAL ARCHITECTURE & EXPANSION\n"
            "Generate:\n"
            "1. 8 to 10 distinct, high-impact sub-topics, mental models, and key conceptual associations.\n"
            "2. 5 profound Socratic questions probing core axioms, boundary limits, trade-offs, and counter-arguments."
        )

        sample_relation = "توسعه" if is_idea else "مبانی"

        return f"""You are an elite Knowledge Graph & Cognitive Strategist.
{mode_directive}

TARGET: "{self.topic}" (Importance: {self.importance}/10)
CONTEXT: {self.context_notes if self.context_notes else "None"}
{lang_instruction}

RULES:
- Return 8 to 10 items in "insights" array.
- "topic": Standalone title (1 to 5 words). Never prefix with parent topic or hyphens.
- "description": 1 concise sentence explaining value and connection.
- "relation_type": Short category (e.g. {'"امکان‌سنجی", "طراحی", "توسعه", "تست", "راه‌اندازی"' if is_idea else '"مبانی", "کاربرد", "معماری", "چالش", "آینده"'}).
- "socratic_questions": Exactly 5 direct questions testing assumptions, risks, and viability.
- Output ONLY valid raw JSON matching schema with NO markdown codeblocks or extra text.

JSON Schema:
{{
  "insights": [
    {{
      "topic": "Pure title",
      "description": "Brief explanation",
      "importance": 8,
      "relation_type": "{sample_relation}"
    }}
  ],
  "socratic_questions": [
    "Question 1?",
    "Question 2?",
    "Question 3?",
    "Question 4?",
    "Question 5?"
  ]
}}
"""

    def _parse_response(self, text: str) -> Tuple[List[AIInsight], List[str]]:
        """Extracts and parses insights and socratic questions from raw model output."""
        cleaned = text.strip()
        
        # Robustly extract outermost JSON object or array
        if "```" in cleaned:
            m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
            if m:
                cleaned = m.group(1).strip()

        first_brace = cleaned.find("{")
        first_bracket = cleaned.find("[")

        if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
            last_brace = cleaned.rfind("}")
            if last_brace != -1 and last_brace > first_brace:
                cleaned = cleaned[first_brace:last_brace + 1]
        elif first_bracket != -1:
            last_bracket = cleaned.rfind("]")
            if last_bracket != -1 and last_bracket > first_bracket:
                cleaned = cleaned[first_bracket:last_bracket + 1]

        insights: List[AIInsight] = []
        socratic_questions: List[str] = []

        try:
            parsed = json.loads(cleaned)
        except Exception as e:
            print(f"JSON parsing error: {e}, Raw text: {text}")
            return [], []

        # Case 1: Dictionary with "insights" and "socratic_questions"
        if isinstance(parsed, dict):
            raw_insights = parsed.get("insights", [])
            raw_questions = parsed.get("socratic_questions", [])

            for item in raw_insights:
                if isinstance(item, dict) and "topic" in item:
                    words = item.get("topic", "").split()
                    short_topic = " ".join(words[:10])
                    imp = int(item.get("importance", 5))
                    imp = max(1, min(10, imp))
                    insights.append(AIInsight(
                        topic=short_topic,
                        description=item.get("description", "").strip(),
                        importance=imp,
                        relation_type=item.get("relation_type", "Association").strip()
                    ))

            for q in raw_questions:
                if isinstance(q, str) and q.strip():
                    socratic_questions.append(q.strip())

        # Case 2: Legacy array format
        elif isinstance(parsed, list):
            for item in parsed:
                if isinstance(item, dict) and "topic" in item:
                    words = item.get("topic", "").split()
                    short_topic = " ".join(words[:10])
                    imp = int(item.get("importance", 5))
                    imp = max(1, min(10, imp))
                    insights.append(AIInsight(
                        topic=short_topic,
                        description=item.get("description", "").strip(),
                        importance=imp,
                        relation_type=item.get("relation_type", "Association").strip()
                    ))

        # Fallback questions if none returned
        if not socratic_questions and insights:
            socratic_questions = [
                f"What fundamental premise must hold true for '{self.topic}' to be valid?",
                f"How would this concept function under extreme conditions or reverse assumptions?",
                f"What is the most critical unintended consequence of applying '{self.topic}'?"
            ]

        return insights, socratic_questions


class GeminiSocraticWorkerThread(QThread):
    """Dedicated background QThread specifically for generating Socratic questions on any concept."""
    socratic_started = pyqtSignal()
    socratic_progress = pyqtSignal(str)
    socratic_finished = pyqtSignal(list)  # List[str]
    socratic_error = pyqtSignal(str)

    def __init__(self, topic: str, context_notes: str = "", 
                 api_key: str = "", model_name: str = "gemini-3.7-flash", parent=None):
        super().__init__(parent)
        self.topic = topic
        self.context_notes = context_notes
        self.api_key = (api_key or config.get_gemini_api_key()).strip()
        self.model_name = model_name or config.get_model_name()
        self._is_cancelled = False

    def cancel(self):
        self._is_cancelled = True

    def run(self):
        self.socratic_started.emit()
        self.socratic_progress.emit("Connecting to Gemini for Socratic Inquiry...")
        
        if not self.api_key:
            self.socratic_error.emit(
                "Gemini API Key is not configured.\n\n"
                "Please set your GEMINI_API_KEY in Settings (Ctrl+,) or in the .env file."
            )
            return

        if self._is_cancelled:
            return

        try:
            self.socratic_progress.emit(f"Formulating Socratic questions for '{self.topic}'...")
            prompt = self._build_prompt()
            response_text = call_gemini_api(prompt, self.api_key, self.model_name)

            if self._is_cancelled:
                return

            questions = self._parse_questions(response_text)
            if not questions:
                questions = [
                    f"What is the underlying assumption behind '{self.topic}'?",
                    f"What is the strongest counter-argument against '{self.topic}'?",
                    f"How would this concept evolve if scaled by 100x?"
                ]

            self.socratic_progress.emit(f"Formulated {len(questions)} Socratic questions.")
            self.socratic_finished.emit(questions)

        except Exception as e:
            if self._is_cancelled:
                return
            formatted_msg = format_gemini_error(str(e))
            self.socratic_error.emit(formatted_msg)

    def _build_prompt(self) -> str:
        is_idea = bool(re.search(r'ایده|idea', self.topic, re.IGNORECASE))
        is_persian = (config.get_language() == "fa") or bool(re.search(r'[\u0600-\u06FF]', self.topic + " " + self.context_notes))
        lang_mandate = "Strictly Persian (فارسی روان، عمیق و فلسفی)." if is_persian else "Strictly English."
        
        focus = (
            "Probe feasibility, product-market fit, execution bottlenecks, user adoption, and catastrophic failure modes of this IDEA."
            if is_idea else
            "Probe fundamental axioms, hidden dependencies, boundary breakdown conditions, and trade-offs of this CONCEPT."
        )

        return f"""You are Socrates, master of dialectic inquiry and cognitive stress-testing.
Construct EXACTLY 5 powerful, fundamental Socratic Questions for:

TARGET: "{self.topic}"
CONTEXT: {self.context_notes if self.context_notes else "None"}
LANGUAGE: {lang_mandate}
FOCUS: {focus}

RULES:
1. Exactly 5 razor-sharp, profound questions. No filler text or conversational pleasantries.
2. Return ONLY a valid JSON array of 5 strings with NO markdown ticks or preamble.

Example JSON output:
[
  "Question 1?",
  "Question 2?",
  "Question 3?",
  "Question 4?",
  "Question 5?"
]
"""

    def _parse_questions(self, text: str) -> List[str]:
        cleaned = text.strip()
        if "```" in cleaned:
            m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
            if m:
                cleaned = m.group(1).strip()

        first_bracket = cleaned.find("[")
        if first_bracket != -1:
            last_bracket = cleaned.rfind("]")
            if last_bracket != -1 and last_bracket > first_bracket:
                cleaned = cleaned[first_bracket:last_bracket + 1]

        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return [str(q).strip() for q in parsed if str(q).strip()]
        except Exception:
            pass

        # Fallback line parsing
        lines = [re.sub(r"^\d+[\.\-\)]\s*", "", l).strip() for l in text.split("\n") if l.strip().endswith("?")]
        return lines[:5]


class GeminiChatWorkerThread(QThread):
    """Background QThread executing full streaming conversation with autonomous graph mutations."""
    chat_started = pyqtSignal()
    chat_progress = pyqtSignal(str)
    chat_chunk_received = pyqtSignal(str, str)  # (delta_chunk, accumulated_text)
    chat_finished = pyqtSignal(str, list)       # (reply_text, List[AIChatAction])
    chat_error = pyqtSignal(str)

    def __init__(self, user_message: str, chat_history: List[dict],
                 vault_notes: List[dict], graph_nodes: List[dict],
                 selected_node: Optional[dict] = None,
                 api_key: str = "", model_name: str = "gemini-3.7-flash", parent=None):
        super().__init__(parent)
        self.user_message = user_message
        self.chat_history = chat_history
        self.vault_notes = vault_notes
        self.graph_nodes = graph_nodes
        self.selected_node = selected_node
        self.api_key = (api_key or config.get_gemini_api_key()).strip()
        self.model_name = model_name or config.get_model_name()
        self._is_cancelled = False

    def cancel(self):
        self._is_cancelled = True

    def run(self):
        self.chat_started.emit()
        self.chat_progress.emit("Connecting to AI Notebook Assistant...")

        if not self.api_key:
            self.chat_error.emit(
                "Gemini API Key is not configured.\n\n"
                "Please set your GEMINI_API_KEY in the Settings menu (Ctrl+,) or in the .env file."
            )
            return

        if self._is_cancelled:
            return

        try:
            self.chat_progress.emit(f"Reasoning with {self.model_name}...")
            prompt = self._build_chat_prompt()

            def _on_token(chunk: str, accumulated: str):
                if not self._is_cancelled:
                    self.chat_chunk_received.emit(chunk, accumulated)

            response_text = stream_gemini_api(
                prompt=prompt,
                api_key=self.api_key,
                model_name=self.model_name,
                on_chunk=_on_token
            )

            if self._is_cancelled:
                return

            reply_text, actions = self._parse_chat_response(response_text)
            self.chat_finished.emit(reply_text, actions)

        except Exception as e:
            if self._is_cancelled:
                return
            err_str = str(e)
            if "API_KEY_INVALID" in err_str or "API key not valid" in err_str:
                self.chat_error.emit("Invalid API Key. Please verify your GEMINI_API_KEY in Settings (Ctrl+,).")
            elif "429" in err_str or "quota" in err_str.lower():
                self.chat_error.emit("API Quota exceeded. Please wait a moment before asking again.")
            else:
                self.chat_error.emit(f"AI Assistant Error:\n{err_str}")

    def _build_chat_prompt(self) -> str:
        # Build Notebook Knowledge Base from Obsidian notes (concise & high-density for ultra-fast generation)
        notes_summary = []
        for n in self.vault_notes[:25]:  # Top relevant notes
            title = n.get("title", "")
            tags = ", ".join(n.get("tags", [])) if n.get("tags") else ""
            content = (n.get("content", "") or "").strip()
            truncated = content[:280] + ("..." if len(content) > 280 else "")
            notes_summary.append(f"### [[{title}]] (Tags: {tags})\n{truncated}")

        notes_block = "\n\n".join(notes_summary) if notes_summary else "No notes currently saved in Obsidian Vault."

        # Active Graph Nodes summary
        graph_summary = []
        for gn in self.graph_nodes[:35]:
            gt = gn.get("title", "")
            gi = gn.get("importance", 5)
            gl = ", ".join([f"[[{l}]]" for l in gn.get("links", []) if l])
            graph_summary.append(f"- [[{gt}]] (★{gi}/10) -> Links: [{gl}]")
        graph_block = "\n".join(graph_summary) if graph_summary else "No visual nodes on canvas."

        # Focused node
        focus_block = ""
        if self.selected_node:
            st = self.selected_node.get("title", "")
            sc = (self.selected_node.get("content", "") or "")[:400]
            focus_block = f"\nCURRENTLY SELECTED FOCUS NODE: [[{st}]]\nNote Content:\n{sc}\n"

        # Conversation History
        history_lines = []
        for h in (self.chat_history or [])[-6:]:
            role = "User" if h.get("role") == "user" else "Assistant"
            history_lines.append(f"{role}: {h.get('text', '')}")
        history_block = "\n".join(history_lines) if history_lines else "New Conversation."

        # Language mandate
        is_persian = (config.get_language() == "fa") or bool(
            re.search(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]', self.user_message)
        )
        lang_mandate = (
            "LANGUAGE MANDATE: The user is communicating in Persian. ALL your conversational explanations, deep analysis, Socratic questions, as well as all node titles and markdown contents in the ```actions``` block MUST BE STRICTLY AND ENTIRELY IN NATURAL, HIGH-QUALITY PERSIAN (زبان فارسی روان، تخصصی و ساختاریافته). Strictly do NOT use English for titles, questions, or notes unless explicitly requested."
            if is_persian else
            "LANGUAGE MANDATE: Provide all outputs in English."
        )

        return f"""You are an elite AI Thinking Assistant and Knowledge Graph Co-Pilot embedded inside MindMap Studio.
You have continuous, real-time access to the user's entire Obsidian Vault Notebook and Knowledge Graph.

===============================
📚 OBSIDIAN NOTEBOOK KNOWLEDGE BASE:
{notes_block}

===============================
🌐 VISUAL KNOWLEDGE GRAPH STATE:
{graph_block}
{focus_block}
===============================
CONVERSATION HISTORY:
{history_block}

===============================
USER'S LATEST MESSAGE:
{self.user_message}

===============================
INSTRUCTIONS & AUTONOMOUS GRAPH ACTIONS:
{lang_mandate}
1. Provide thoughtful, well-reasoned answers grounded directly in the user's notes and concepts. Format with Markdown.
2. If the user asks for Socratic questions or critical review of ideas, formulate EXACTLY 5 fundamental probing questions in a clean numbered list (1 to 5) with zero unnecessary preamble or postscript commentary.
3. If the user asks you to CREATE, ADD, CONNECT, or DELETE thoughts/nodes, perform them by appending an ```actions``` JSON block at the very end of your reply!
4. Format of actions block:
```actions
[
  {{
    "action": "add_node",
    "title": "Concise Node Title in Persian (max 8 words)",
    "content": "Rich markdown note content synthesizing the idea in Persian...",
    "importance": 8,
    "tags": ["relevant", "tags"],
    "connects_to": ["Existing Node Title 1", "Existing Node Title 2"]
  }},
  {{
    "action": "delete_node",
    "title": "Exact Title of Node to Delete"
  }},
  {{
    "action": "connect_nodes",
    "source_title": "Concept Alpha",
    "target_title": "Concept Beta"
  }}
]
```
5. If the user does not request any graph changes, DO NOT output any ```actions``` block. Keep your response conversational, concise, and helpful.
"""

    @staticmethod
    def _parse_chat_response(text: str) -> Tuple[str, List[AIChatAction]]:
        actions: List[AIChatAction] = []
        reply_text = text.strip()

        # Check for ```actions ... ``` or ```json ... ``` block
        match = re.search(r"```(?:actions|json)?\s*(\[\s*\{[\s\S]*?\}\s*\])\s*```", text)
        if match:
            raw_json = match.group(1).strip()
            # Remove the actions block from user-visible reply text
            reply_text = text[:match.start()].strip() + "\n" + text[match.end():].strip()
            reply_text = reply_text.strip()
            try:
                action_items = json.loads(raw_json)
                if isinstance(action_items, list):
                    for item in action_items:
                        act_type = item.get("action", "")
                        if act_type == "add_node":
                            actions.append(AIChatAction(
                                action_type="add_node",
                                title=item.get("title", "New AI Thought"),
                                content=item.get("content", ""),
                                importance=max(1, min(10, int(item.get("importance", 5)))),
                                tags=item.get("tags", ["ai-thought"]),
                                connects_to=item.get("connects_to", [])
                            ))
                        elif act_type == "delete_node":
                            actions.append(AIChatAction(
                                action_type="delete_node",
                                title=item.get("title", ""),
                                node_id=item.get("node_id", "")
                            ))
                        elif act_type == "connect_nodes":
                            actions.append(AIChatAction(
                                action_type="connect_nodes",
                                source_title=item.get("source_title", ""),
                                target_title=item.get("target_title", "")
                            ))
            except Exception as e:
                print(f"Error parsing AI chat actions: {e}")

        return reply_text, actions


# Backwards compatibility alias
GeminiWorker = GeminiWorkerThread


class GeminiService(QObject):
    """Facade for managing Gemini asynchronous jobs and thread lifecycle safely."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self._thread: Optional[GeminiWorkerThread] = None
        self._socratic_thread: Optional[GeminiSocraticWorkerThread] = None
        self._chat_thread: Optional[GeminiChatWorkerThread] = None

    def send_chat_message(self, user_message: str, chat_history: Optional[List[Dict[str, str]]] = None,
                          vault_notes: Optional[List[Dict[str, Any]]] = None,
                          graph_nodes: Optional[List[Dict[str, Any]]] = None,
                          selected_node: Optional[Dict[str, Any]] = None,
                          on_started=None, on_progress=None, on_chunk=None, on_finished=None, on_error=None):
        """Spawns background QThread to execute grounded chat query and autonomous graph actions."""
        if self._chat_thread is not None:
            try:
                self._chat_thread.cancel()
                if self._chat_thread.isRunning():
                    self._chat_thread.quit()
                    self._chat_thread.wait(300)
            except Exception:
                pass
            self._chat_thread = None

        self._chat_thread = GeminiChatWorkerThread(
            user_message=user_message,
            chat_history=chat_history,
            vault_notes=vault_notes,
            graph_nodes=graph_nodes,
            selected_node=selected_node,
            parent=self
        )

        if on_started:
            self._chat_thread.chat_started.connect(on_started)
        if on_progress:
            self._chat_thread.chat_progress.connect(on_progress)
        if on_chunk:
            self._chat_thread.chat_chunk_received.connect(on_chunk)
        if on_finished:
            self._chat_thread.chat_finished.connect(on_finished)
        if on_error:
            self._chat_thread.chat_error.connect(on_error)

        self._chat_thread.finished.connect(self._cleanup_chat_thread)
        self._chat_thread.start()

    def start_analysis(self, topic: str, context_notes: str, importance: int, 
                       on_started=None, on_progress=None, on_finished=None, on_error=None):
        """Spawns background QThread to perform Gemini analysis yielding both insights and Socratic questions."""
        self.stop_current()

        self._thread = GeminiWorkerThread(topic, context_notes, importance, parent=self)

        if on_started:
            self._thread.analysis_started.connect(on_started)
        if on_progress:
            self._thread.analysis_progress.connect(on_progress)
        if on_finished:
            self._thread.analysis_finished.connect(on_finished)
        if on_error:
            self._thread.analysis_error.connect(on_error)

        self._thread.finished.connect(self._cleanup_thread)
        self._thread.start()

    def generate_socratic_questions(self, topic: str, context_notes: str,
                                    on_started=None, on_progress=None, on_finished=None, on_error=None):
        """Spawns background QThread specifically to formulate challenging Socratic questions."""
        if self._socratic_thread is not None:
            try:
                self._socratic_thread.cancel()
                if self._socratic_thread.isRunning():
                    self._socratic_thread.quit()
                    self._socratic_thread.wait(300)
            except Exception:
                pass
            self._socratic_thread = None

        self._socratic_thread = GeminiSocraticWorkerThread(topic, context_notes, parent=self)

        if on_started:
            self._socratic_thread.socratic_started.connect(on_started)
        if on_progress:
            self._socratic_thread.socratic_progress.connect(on_progress)
        if on_finished:
            self._socratic_thread.socratic_finished.connect(on_finished)
        if on_error:
            self._socratic_thread.socratic_error.connect(on_error)

        self._socratic_thread.finished.connect(self._cleanup_socratic_thread)
        self._socratic_thread.start()

    def _cleanup_chat_thread(self):
        self._chat_thread = None

    def _cleanup_thread(self):
        """Cleanly releases reference when deep-dive thread execution finishes."""
        self._thread = None

    def _cleanup_socratic_thread(self):
        """Cleanly releases reference when Socratic thread execution finishes."""
        self._socratic_thread = None

    def stop_current(self):
        """Safely terminates any currently executing background threads."""
        if self._thread is not None:
            try:
                self._thread.cancel()
                if self._thread.isRunning():
                    self._thread.quit()
                    self._thread.wait(400)
            except (RuntimeError, Exception):
                pass
            self._thread = None

        if self._socratic_thread is not None:
            try:
                self._socratic_thread.cancel()
                if self._socratic_thread.isRunning():
                    self._socratic_thread.quit()
                    self._socratic_thread.wait(300)
            except Exception:
                pass
            self._socratic_thread = None

        if self._chat_thread is not None:
            try:
                self._chat_thread.cancel()
                if self._chat_thread.isRunning():
                    self._chat_thread.quit()
                    self._chat_thread.wait(300)
            except Exception:
                pass
            self._chat_thread = None
