# Multi-stage Dockerfile for MindMap Studio Full-Stack App
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Install Backend Dependencies & Generate Prisma Client
COPY mindmap-web/backend/package*.json ./mindmap-web/backend/
COPY mindmap-web/backend/prisma ./mindmap-web/backend/prisma/
RUN cd mindmap-web/backend && npm ci && npx prisma generate

# 2. Install Frontend Dependencies
COPY mindmap-web/frontend/package*.json ./mindmap-web/frontend/
RUN cd mindmap-web/frontend && npm ci

# 3. Copy source code and build
COPY mindmap-web/backend ./mindmap-web/backend
COPY mindmap-web/frontend ./mindmap-web/frontend

RUN cd mindmap-web/frontend && npm run build
RUN cd mindmap-web/backend && npm run build

# --- Production Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install required production tools & sqlite
RUN apk add --no-cache openssl bash curl

# Copy build artifacts and production modules
COPY --from=builder --chown=node:node /app/mindmap-web/backend/package*.json ./
COPY --from=builder --chown=node:node /app/mindmap-web/backend/prisma ./prisma
COPY --from=builder --chown=node:node /app/mindmap-web/backend/dist ./dist
COPY --from=builder --chown=node:node /app/mindmap-web/backend/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/mindmap-web/frontend/dist ../frontend/dist

# Set permissions for node user
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose backend / SPA combined port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Initialize db and start
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
