import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config';

export interface AIInsight {
  topic: string;
  description: string;
  importance: number;
  relationType: string;
}

export interface AIDeepDiveResponse {
  topic: string;
  insights: AIInsight[];
  socraticQuestions: string[];
}

export interface AIRoadmapItem {
  phase: string;
  title: string;
  brief: string;
  importance: number;
}

export interface AIRoadmapResponse {
  topic: string;
  roadmap: AIRoadmapItem[];
}

const DEFAULT_CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.1-pro-preview',
];

// Resolve API Key and candidate models from request headers/body or server config
function resolveApiCredentials(req: AuthRequest): { apiKey: string; candidateModels: string[] } {
  const customKey = (req.body?.apiKey || (req.headers['x-gemini-api-key'] as string) || '').trim();
  const apiKey = customKey || (config.geminiApiKey || '').trim();

  const customModel = (req.body?.model || (req.headers['x-gemini-model'] as string) || '').trim();
  const models = [
    customModel,
    config.geminiModel,
    ...DEFAULT_CANDIDATE_MODELS,
  ].filter((m): m is string => Boolean(m && typeof m === 'string'));

  const candidateModels = Array.from(new Set(models));
  return { apiKey, candidateModels };
}

// Helper: Map raw Gemini / HTTP errors into clear Persian and descriptive technical messages
function formatGeminiError(status: number, rawMessage: string): string {
  const lower = (rawMessage || '').toLowerCase();
  if (status === 429 || lower.includes('quota') || lower.includes('resource_exhausted') || lower.includes('rate limit')) {
    return 'سهمیه درخواست یا مصرف توکن هوش مصنوعی موقتاً به پایان رسیده است (Rate Limit / Quota Exceeded). لطفاً دقایقی دیگر مجدداً تلاش کنید.';
  }
  if (status === 401 || status === 403 || lower.includes('api_key_invalid') || lower.includes('unauthenticated') || lower.includes('permission_denied')) {
    return 'کلید API هوش مصنوعی نامعتبر است یا منقضی شده است (Invalid API Key). لطفاً کلید دسترسی را در تنظیمات بررسی کنید.';
  }
  if (status === 503 || lower.includes('unavailable') || lower.includes('overloaded') || lower.includes('high demand')) {
    return 'سرورهای هوش مصنوعی در حال حاضر با بار ترافیکی سنگین مواجه هستند (Service Unavailable / Overloaded). لطفاً لحظاتی بعد مجدداً امتحان کنید.';
  }
  if (lower.includes('safety') || lower.includes('blocked') || lower.includes('recitation')) {
    return 'درخواست ارسالی توسط فیلترهای ایمنی یا قوانین محتوایی مدل مسدود گردید (Safety/Policy Block).';
  }
  if (status === 404 || lower.includes('not found')) {
    return 'مدل هوش مصنوعی در دسترس نیست یا نسخه آن منسوخ شده است (Model Not Found).';
  }
  return rawMessage || 'عدم دریافت پاسخ از سرور هوش مصنوعی';
}

// Clean any repetitive parent topic prefix (e.g. "Parent - SubTopic" -> "SubTopic")
function cleanSubTopicTitle(rawTitle: string, parentTopic: string): string {
  let title = String(rawTitle || '').trim();
  if (!title) return 'مفهوم پیشنهادی';

  // 1. Remove parent topic prefix if prepended
  const escapedParent = parentTopic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const prefixRegex = new RegExp(`^${escapedParent}\\s*[-:—–\\|/]\\s*`, 'i');
  title = title.replace(prefixRegex, '').trim();

  // 2. Remove leading hyphens, bullets, or numbers (e.g. "- ", "1. ", "• ")
  title = title.replace(/^(?:[-–—•\*\s]+|\d+[\.\)]\s*)/, '').trim();

  // 3. Fallback if empty
  return title || rawTitle.trim();
}

// ----------------------------------------------------
// Test Connection Endpoint for Settings
// ----------------------------------------------------
export async function testAIConnection(req: AuthRequest, res: Response): Promise<void> {
  const startTime = Date.now();
  const { apiKey, candidateModels } = resolveApiCredentials(req);

  if (!apiKey) {
    res.status(400).json({ success: false, error: 'کلید API هوش مصنوعی وارد نشده است.' });
    return;
  }

  let lastErrorStatus = 500;
  let lastErrorMessage = '';
  let activeModel = '';

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Reply 'OK'" }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 64,
          },
        }),
      });

      if (!response.ok) {
        lastErrorStatus = response.status;
        const errData: any = await response.json().catch(() => ({}));
        lastErrorMessage = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.warn(`Test connection model ${model} returned HTTP ${response.status}: ${lastErrorMessage}`);
        continue;
      }

      const data: any = await response.json();
      const candidates = data.candidates || [];
      if (candidates.length > 0) {
        activeModel = model;
        break;
      }
    } catch (err: any) {
      lastErrorMessage = err.message || 'خطای شبکه در برقراری ارتباط';
      console.warn(`Test connection error on ${model}:`, err.message);
    }
  }

  const latencyMs = Date.now() - startTime;

  if (activeModel) {
    res.json({
      success: true,
      message: 'اتصال به سرویس هوش مصنوعی با موفقیت برقرار شد.',
      model: activeModel,
      latencyMs,
    });
  } else {
    const friendlyError = formatGeminiError(lastErrorStatus, lastErrorMessage);
    res.status(lastErrorStatus || 502).json({
      success: false,
      error: friendlyError,
      rawDetail: lastErrorMessage,
    });
  }
}

// ----------------------------------------------------
// Mode A: Sub-Topics & Idea Execution Steps (Ultra-Token-Optimized)
// ----------------------------------------------------
export async function generateSubTopics(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { topic, contextNotes = '', importance = 5 } = req.body;
    if (!topic || !topic.trim()) {
      res.status(400).json({ error: 'Topic is required' });
      return;
    }

    const cleanTopic = topic.trim();
    const { apiKey, candidateModels } = resolveApiCredentials(req);
    if (!apiKey) {
      res.status(500).json({ error: 'Gemini API Key is not configured' });
      return;
    }

    const isIdea = /ایده|idea/i.test(cleanTopic);
    const isPersian = /[\u0600-\u06FF]/.test(cleanTopic + ' ' + contextNotes);
    const lang = isPersian ? 'Strictly Persian (فارسی روان و ساختاریافته).' : 'Strictly English.';

    const instruction = isIdea
      ? 'Topic is an "IDEA / ایده". Generate 6 to 8 sequential actionable steps/milestones to research, validate, build, and execute this idea into reality (مراحل گام‌به‌گام پیاده‌سازی ایده).'
      : 'Generate 6 to 8 key sub-topics, mental models, or conceptual facets for this concept.';

    const prompt = `Knowledge Graph Strategist.
${instruction}

TARGET: "${cleanTopic}" (Importance: ${importance}/10)
CONTEXT: ${contextNotes ? contextNotes.trim() : 'None'}
LANGUAGE: ${lang}

RULES:
- Return 6 to 8 items in "insights".
- "topic": 1 to 5 words standalone title. NO parent prefix or hyphens.
- "description": 1 concise sentence explaining value/connection.
- "relationType": Short category (${isIdea ? '"امکان‌سنجی", "طراحی", "توسعه", "تست", "راه‌اندازی"' : '"مبانی", "کاربرد", "معماری", "چالش", "آینده"'}).
- Output raw JSON ONLY matching schema. No markdown codeblocks or intro text.

JSON Schema:
{
  "insights": [
    {
      "topic": "Pure title",
      "description": "Brief explanation",
      "importance": 8,
      "relationType": "${isIdea ? 'توسعه' : 'مبانی'}"
    }
  ]
}`;

    let rawResponse = '';
    let lastErrorStatus = 500;
    let lastErrorMessage = '';

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          lastErrorStatus = response.status;
          const errData: any = await response.json().catch(() => ({}));
          lastErrorMessage = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          console.warn(`Model ${model} returned HTTP ${response.status}: ${lastErrorMessage}`);
          continue;
        }

        const data: any = await response.json();
        const candidates = data.candidates || [];
        if (candidates.length > 0) {
          const candidate = candidates[0];
          if (candidate.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
            lastErrorMessage = `پاسخ به دلیل ${candidate.finishReason} متوقف گردید.`;
          }
          const parts = candidate?.content?.parts || [];
          const textParts = parts.filter((p: any) => p.text && !p.thought);
          const text = textParts.length > 0 ? textParts[textParts.length - 1].text : (parts[0]?.text || '');
          if (text) {
            rawResponse = text;
            break;
          }
        }
      } catch (err: any) {
        lastErrorMessage = err.message || 'خطای اتصال به شبکه';
        console.warn(`Error trying ${model}:`, err.message);
      }
    }

    if (!rawResponse) {
      const friendlyError = formatGeminiError(lastErrorStatus, lastErrorMessage);
      res.status(lastErrorStatus || 502).json({
        error: friendlyError,
        rawDetail: lastErrorMessage,
      });
      return;
    }

    let cleaned = rawResponse.trim();
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) cleaned = jsonMatch[1].trim();

    const parsed = JSON.parse(cleaned);
    const rawInsights = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.insights)
      ? parsed.insights
      : Array.isArray(parsed.data)
      ? parsed.data
      : Array.isArray(parsed.subtopics)
      ? parsed.subtopics
      : [];

    const insights: AIInsight[] = rawInsights.slice(0, 10).map((i: any) => ({
      topic: cleanSubTopicTitle(i.topic || i.title || i.name, cleanTopic),
      description: String(i.description || i.brief || '').trim(),
      importance: Math.max(1, Math.min(10, parseInt(i.importance, 10) || 7)),
      relationType: String(i.relationType || i.relation_type || i.phase || (isIdea ? 'گام اجرایی' : 'زیرشاخه')).trim(),
    }));

    res.json({ topic: cleanTopic, insights });
  } catch (error: any) {
    console.error('generateSubTopics Error:', error);
    res.status(500).json({ error: `Sub-topics error: ${error.message}` });
  }
}

// ----------------------------------------------------
// Mode B: Socratic Dialectic Questions (Ultra-Token-Optimized)
// ----------------------------------------------------
export async function generateSocraticQuestions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { topic, contextNotes = '' } = req.body;
    if (!topic || !topic.trim()) {
      res.status(400).json({ error: 'Topic is required' });
      return;
    }

    const cleanTopic = topic.trim();
    const { apiKey, candidateModels } = resolveApiCredentials(req);
    if (!apiKey) {
      res.status(500).json({ error: 'Gemini API Key is not configured' });
      return;
    }

    const isIdea = /ایده|idea/i.test(cleanTopic);
    const isPersian = /[\u0600-\u06FF]/.test(cleanTopic + ' ' + contextNotes);
    const lang = isPersian ? 'Strictly Persian (فارسی روان و فلسفی-کاربردی).' : 'Strictly English.';
    const focus = isIdea
      ? 'Focus: Feasibility, product-market fit, adoption bottlenecks, and critical risks of this idea.'
      : 'Focus: Axioms, hidden assumptions, breakdown limits, and counter-arguments of this concept.';

    const prompt = `You are Socrates. Construct EXACTLY 5 powerful critical thinking questions for:
TARGET: "${cleanTopic}"
CONTEXT: ${contextNotes ? contextNotes.trim() : 'None'}
LANGUAGE: ${lang}
${focus}

RULES:
- Exactly 5 direct questions. No filler text or conversational pleasantries.
- Output raw JSON array of 5 strings ONLY. No markdown codeblocks.

JSON:
[
  "پرسش ۱؟",
  "پرسش ۲؟",
  "پرسش ۳؟",
  "پرسش ۴؟",
  "پرسش ۵؟"
]`;

    let rawResponse = '';
    let lastErrorStatus = 500;
    let lastErrorMessage = '';

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          lastErrorStatus = response.status;
          const errData: any = await response.json().catch(() => ({}));
          lastErrorMessage = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          console.warn(`Socratic model ${model} returned HTTP ${response.status}: ${lastErrorMessage}`);
          continue;
        }

        const data: any = await response.json();
        const candidates = data.candidates || [];
        if (candidates.length > 0) {
          const candidate = candidates[0];
          if (candidate.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
            lastErrorMessage = `پاسخ به دلیل ${candidate.finishReason} متوقف گردید.`;
          }
          const parts = candidate?.content?.parts || [];
          const textParts = parts.filter((p: any) => p.text && !p.thought);
          const text = textParts.length > 0 ? textParts[textParts.length - 1].text : (parts[0]?.text || '');
          if (text) {
            rawResponse = text;
            break;
          }
        }
      } catch (err: any) {
        lastErrorMessage = err.message || 'خطای اتصال به شبکه';
        console.warn(`Error trying ${model} for Socratic:`, err.message);
      }
    }

    if (!rawResponse) {
      const friendlyError = formatGeminiError(lastErrorStatus, lastErrorMessage);
      res.status(lastErrorStatus || 502).json({
        error: friendlyError,
        rawDetail: lastErrorMessage,
      });
      return;
    }

    let cleaned = rawResponse.trim();
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) cleaned = jsonMatch[1].trim();

    const parsed = JSON.parse(cleaned);
    const rawList: any[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.socraticQuestions)
      ? parsed.socraticQuestions
      : Array.isArray(parsed.questions)
      ? parsed.questions
      : Array.isArray(parsed.data)
      ? parsed.data
      : [];

    const questions: string[] = rawList.map((q: any) => String(q?.question || q).trim()).filter(Boolean);

    res.json({ topic: cleanTopic, socraticQuestions: questions });
  } catch (error: any) {
    console.error('generateSocraticQuestions Error:', error);
    res.status(500).json({ error: `Socratic error: ${error.message}` });
  }
}

// ----------------------------------------------------
// Legacy / Combined Analysis
// ----------------------------------------------------
export async function generateDeepDive(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { topic, contextNotes = '', importance = 5 } = req.body;

    if (!topic || !topic.trim()) {
      res.status(400).json({ error: 'Topic is required for deep-dive analysis' });
      return;
    }

    const cleanTopic = topic.trim();
    const { apiKey, candidateModels } = resolveApiCredentials(req);
    if (!apiKey) {
      res.status(500).json({ error: 'Gemini API Key is not configured on the server' });
      return;
    }

    const isIdea = /ایده|idea/i.test(cleanTopic);
    const isPersian = /[\u0600-\u06FF]/.test(cleanTopic + ' ' + contextNotes);
    const langInstruction = isPersian
      ? 'LANGUAGE: Strictly Persian (فارسی روان، دقیق، کاربردی و ساختاریافته).'
      : 'LANGUAGE: Concise English.';

    const modeDirective = isIdea
      ? `MODE: IDEA EXECUTION & MILESTONES (مراحل رسیدن به ایده)
The topic is an "IDEA / ایده". Generate:
1. Sequential actionable steps, phases, and milestones required to research, validate, design, build, and execute this idea into reality (مراحل گام‌به‌گام برای تحقق و پیاده‌سازی ایده).
2. 5 critical Socratic questions probing the idea's feasibility, product-market fit, adoption bottlenecks, and critical execution risks.`
      : `MODE: CONCEPTUAL ARCHITECTURE & EXPANSION
Generate:
1. 8 to 10 distinct, high-impact sub-topics, mental models, and key conceptual associations.
2. 5 profound Socratic questions probing core axioms, boundary limits, trade-offs, and counter-arguments.`;

    const prompt = `You are an elite Knowledge Graph & Cognitive Strategist.
${modeDirective}

TARGET: "${cleanTopic}" (Importance: ${importance}/10)
CONTEXT: ${contextNotes ? contextNotes.trim() : 'None'}
${langInstruction}

RULES:
- Return 8 to 10 items in "insights" array.
- "topic": Standalone title (1 to 5 words). Never prefix with parent topic or hyphens.
- "description": 1 concise sentence explaining value and connection.
- "relationType": Short category (e.g. ${isIdea ? '"امکان‌سنجی", "طراحی", "توسعه", "تست", "راه‌اندازی"' : '"مبانی", "کاربرد", "معماری", "چالش", "آینده"'}).
- "socraticQuestions": Exactly 5 direct questions testing assumptions, risks, and viability.
- Output ONLY valid raw JSON matching schema with NO markdown codeblocks or extra text.

JSON Schema:
{
  "insights": [
    {
      "topic": "Pure title",
      "description": "Brief explanation",
      "importance": 8,
      "relationType": "${isIdea ? 'توسعه' : 'مبانی'}"
    }
  ],
  "socraticQuestions": [
    "Question 1?",
    "Question 2?",
    "Question 3?",
    "Question 4?",
    "Question 5?"
  ]
}
`;

    let rawResponse = '';
    let lastErrorStatus = 500;
    let lastErrorMessage = '';

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          lastErrorStatus = response.status;
          const errData: any = await response.json().catch(() => ({}));
          lastErrorMessage = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          console.warn(`Deep-Dive model ${model} returned HTTP ${response.status}: ${lastErrorMessage}`);
          continue;
        }

        const data: any = await response.json();
        const candidates = data.candidates || [];
        if (candidates.length > 0) {
          const candidate = candidates[0];
          if (candidate.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
            lastErrorMessage = `پاسخ به دلیل ${candidate.finishReason} متوقف گردید.`;
          }
          const parts = candidate?.content?.parts || [];
          const textParts = parts.filter((p: any) => p.text && !p.thought);
          const text = textParts.length > 0 ? textParts[textParts.length - 1].text : (parts[0]?.text || '');
          if (text) {
            rawResponse = text;
            break;
          }
        }
      } catch (err: any) {
        lastErrorMessage = err.message || 'خطای اتصال به شبکه';
        console.warn(`Error trying ${model} for Deep-Dive:`, err.message);
      }
    }

    if (!rawResponse) {
      const friendlyError = formatGeminiError(lastErrorStatus, lastErrorMessage);
      res.status(lastErrorStatus || 502).json({
        error: friendlyError,
        rawDetail: lastErrorMessage,
      });
      return;
    }

    // Parse JSON from Gemini response
    let cleaned = rawResponse.trim();
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleaned = jsonMatch[1].trim();
    } else {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
    }

    const parsed = JSON.parse(cleaned);
    const rawInsights = Array.isArray(parsed.insights) ? parsed.insights : [];

    // Sanitize and limit to 10 clean sub-topics
    const insights: AIInsight[] = rawInsights.slice(0, 10).map((i: any) => ({
      topic: cleanSubTopicTitle(i.topic, cleanTopic),
      description: String(i.description || '').trim(),
      importance: Math.max(1, Math.min(10, parseInt(i.importance, 10) || 5)),
      relationType: String(i.relationType || i.relation_type || 'مفهوم').trim(),
    }));

    const socraticQuestions: string[] = (
      parsed.socraticQuestions ||
      parsed.socratic_questions ||
      []
    ).map((q: any) => String(q).trim());

    res.json({
      topic: cleanTopic,
      insights,
      socraticQuestions,
    });
  } catch (error: any) {
    console.error('Gemini AI Deep-Dive Error:', error);
    res.status(500).json({ error: `AI analysis error: ${error.message}` });
  }
}

// ----------------------------------------------------
// 2. Mode 2: Execution Roadmap & Milestones (Roadmap phases and execution milestones)
// ----------------------------------------------------
export async function generateLineageExpansion(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { topic, lineagePath = [], contextNotes = '' } = req.body;

    if (!topic || !topic.trim()) {
      res.status(400).json({ error: 'Topic is required for roadmap expansion' });
      return;
    }

    const cleanTopic = topic.trim();
    const { apiKey, candidateModels } = resolveApiCredentials(req);
    if (!apiKey) {
      res.status(500).json({ error: 'Gemini API Key is not configured on the server' });
      return;
    }

    const lineagePathStr = Array.isArray(lineagePath)
      ? lineagePath.join(' ➔ ')
      : String(lineagePath || cleanTopic);

    const isPersian = /[\u0600-\u06FF]/.test(cleanTopic + ' ' + lineagePathStr + ' ' + contextNotes);
    const langInstruction = isPersian
      ? 'LANGUAGE MANDATE: All generated phase labels, milestone titles, and briefs MUST BE ENTIRELY IN PERSIAN (زبان فارسی روان، کاربردی و شفاف).'
      : 'LANGUAGE MANDATE: Provide all phase labels, milestone titles, and briefs in clear, actionable English.';

    const prompt = `You are an elite strategic execution architect, technical roadmap strategist, and knowledge graph engine.
Analyze the target concept/goal within its context and ancestral graph path, and generate a comprehensive, highly actionable STEP-BY-STEP IMPLEMENTATION ROADMAP / MILESTONES (مراحل، فازهای اجرایی، مایل‌استون‌ها و اقدامات لازم برای رسیدن به این ایده یا پیاده‌سازی آن).

TARGET GOAL / CONCEPT: "${cleanTopic}"
ANCESTRAL / GRAPH LINEAGE: "${lineagePathStr}"
CONTEXT NOTES: "${contextNotes ? contextNotes.trim() : 'None provided'}"

${langInstruction}

INSTRUCTIONS:
1. Generate the sequential milestones and execution phases required to achieve, implement, or master this concept.
2. DO NOT artificially restrict to 4 items. Provide the optimal number of steps (typically 4 to 8 concrete milestones) based on the depth and nature of the goal.
3. "phase": The milestone/phase badge (e.g. "فاز ۱: پایه‌ریزی و تحقیق", "فاز ۲: طراحی معماری", "مایل‌استون ۳: پیاده‌سازی اولیه", "فاز ۴: تست و بهینه‌سازی", "فاز ۵: توسعه و بهره‌برداری").
4. "title": Standalone, action-oriented milestone title (1 to 5 words, DO NOT prefix with parent topic or dashes).
5. "brief": Clear, practical summary of what must be accomplished in this milestone (10 to 20 words).
6. "importance": Criticality rating from 6 to 10.

Output raw JSON ONLY matching this exact schema:
{
  "roadmap": [
    {
      "phase": "فاز ۱: اکتشاف و نیازمندی‌ها",
      "title": "تحلیل نیازها و امکان‌سنجی اولیه",
      "brief": "بررسی زیرساخت‌های لازم، سناریوهای کاربردی و استخراج معیارهای موفقیت.",
      "importance": 8
    },
    {
      "phase": "فاز ۲: طراحی ساختار",
      "title": "مدل‌سازی معماری و انتخاب ابزارها",
      "brief": "طراحی استانداردهای فنی، معماری داده و انتخاب تکنولوژی‌های متناسب.",
      "importance": 9
    }
  ]
}
Strictly output raw JSON only. No markdown codeblocks, no intro/outro text. Match Target Language.
`;

    let rawResponse = '';
    let lastErrorStatus = 500;
    let lastErrorMessage = '';

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          lastErrorStatus = response.status;
          const errData: any = await response.json().catch(() => ({}));
          lastErrorMessage = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          console.warn(`Roadmap model ${model} returned HTTP ${response.status}: ${lastErrorMessage}`);
          continue;
        }

        const data: any = await response.json();
        const candidates = data.candidates || [];
        if (candidates.length > 0) {
          const candidate = candidates[0];
          if (candidate.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
            lastErrorMessage = `پاسخ به دلیل ${candidate.finishReason} متوقف گردید.`;
          }
          const parts = candidate?.content?.parts || [];
          const textParts = parts.filter((p: any) => p.text && !p.thought);
          const text = textParts.length > 0 ? textParts[textParts.length - 1].text : (parts[0]?.text || '');
          if (text) {
            rawResponse = text;
            break;
          }
        }
      } catch (err: any) {
        lastErrorMessage = err.message || 'خطای اتصال به شبکه';
        console.warn(`Error trying ${model} for Roadmap:`, err.message);
      }
    }

    if (!rawResponse) {
      const friendlyError = formatGeminiError(lastErrorStatus, lastErrorMessage);
      res.status(lastErrorStatus || 502).json({
        error: friendlyError,
        rawDetail: lastErrorMessage,
      });
      return;
    }

    // Parse JSON
    let cleaned = rawResponse.trim();
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleaned = jsonMatch[1].trim();
    } else {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
    }

    const parsed = JSON.parse(cleaned);
    const rawList: any[] = Array.isArray(parsed.roadmap)
      ? parsed.roadmap
      : Array.isArray(parsed.expansion)
      ? parsed.expansion
      : [];

    const roadmap: AIRoadmapItem[] = rawList.map((item, idx) => ({
      phase: String(item.phase || item.relation || `گام ${idx + 1}`).trim(),
      title: cleanSubTopicTitle(item.title || item.topic, cleanTopic),
      brief: String(item.brief || item.description || '').trim(),
      importance: Math.max(1, Math.min(10, parseInt(item.importance, 10) || 7)),
    }));

    res.json({
      topic: cleanTopic,
      roadmap,
    });
  } catch (error: any) {
    console.error('Gemini Roadmap Expansion Error:', error);
    res.status(500).json({ error: `Roadmap expansion error: ${error.message}` });
  }
}
