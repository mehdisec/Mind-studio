import rateLimit from 'express-rate-limit';

// Rate Limiter for Authentication endpoints (Login, Register) - Anti-Brute-Force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    error: 'تعداد درخواست‌های احراز هویت بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر مجدداً تلاش کنید.'
  }
});

// Rate Limiter for AI Generative endpoints (Protects Gemini API Quotas & Token limits)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'تعداد درخواست‌های هوش مصنوعی بیش از حد مجاز است. لطفاً یک دقیقه دیگر مجدداً تلاش کنید.'
  }
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'تعداد درخواست‌ها بیش از حد مجاز است.'
  }
});
