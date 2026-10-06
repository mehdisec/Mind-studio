import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resolveJwtSecret = (): string => {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length > 0) {
    return process.env.JWT_SECRET.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ [SECURITY WARNING] JWT_SECRET is not set in production! Generating an ephemeral random secret.');
    return crypto.randomBytes(64).toString('hex');
  }

  return 'mindmap_studio_dev_secret_key_2026';
};

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
