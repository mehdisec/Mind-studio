import crypto from 'crypto';

interface CaptchaEntry {
  answer: string;
  expiresAt: number;
}

// In-memory store for active captchas (auto-cleaned)
const captchaStore = new Map<string, CaptchaEntry>();

// Clean expired captchas periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of captchaStore.entries()) {
    if (entry.expiresAt < now) {
      captchaStore.delete(id);
    }
  }
}, 60 * 1000);

export function generateCaptcha(): { captchaId: string; captchaSvg: string; captchaUrl?: string } {
  // Use distinct, unambiguous characters (avoid easily confused letters/digits)
  const chars = '34679ACDEFHKMNPRTWXY';
  let text = '';
  for (let i = 0; i < 4; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const captchaId = crypto.randomUUID();
  // 5 minutes expiry
  captchaStore.set(captchaId, {
    answer: text.toLowerCase(),
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  // Render SVG with noise lines and skewed text
  const width = 130;
  const height = 44;

  const charElements = text.split('').map((ch, idx) => {
    const x = 18 + idx * 26 + (Math.random() - 0.5) * 6;
    const y = 30 + (Math.random() - 0.5) * 6;
    const rotate = (Math.random() - 0.5) * 24;
    const colors = ['#38BDF8', '#818CF8', '#C084FC', '#F472B6', '#34D399', '#FBBF24'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `<text x="${x}" y="${y}" fill="${color}" font-family="monospace, sans-serif" font-size="24" font-weight="900" transform="rotate(${rotate}, ${x}, ${y})">${ch}</text>`;
  }).join('');

  // Noise lines
  const lines = Array.from({ length: 4 }).map(() => {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    const stroke = Math.random() > 0.5 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(168, 85, 247, 0.4)';
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.5" />`;
  }).join('');

  // Background dots
  const dots = Array.from({ length: 18 }).map(() => {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    const r = Math.random() * 1.5 + 0.5;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255, 255, 255, 0.25)" />`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background: #0f172a; border-radius: 8px;">
    ${dots}
    ${lines}
    ${charElements}
  </svg>`;

  return {
    captchaId,
    captchaSvg: svg,
    captchaUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
  };
}

export function verifyCaptcha(captchaId: string, answer: string): boolean {
  if (!captchaId || !answer) return false;
  const entry = captchaStore.get(captchaId);
  if (!entry) return false;

  // Single-use: delete immediately to prevent replay
  captchaStore.delete(captchaId);

  if (entry.expiresAt < Date.now()) return false;
  
  // Normalize Persian/Arabic digits to English digits
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let norm = answer;
  for (let i = 0; i < 10; i++) {
    norm = norm.replace(new RegExp(persianDigits[i], 'g'), String(i)).replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }

  const cleanInput = norm.replace(/[\s\-_]/g, '').toLowerCase();
  const cleanStored = entry.answer.replace(/[\s\-_]/g, '').toLowerCase();
  return cleanStored === cleanInput;
}
