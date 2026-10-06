import express from 'express';
import cors from 'cors';
import { config } from './config';
import routes from './routes';
import { initDatabaseAndSeed } from './db';

const app = express();

// Middlewares
const allowedOrigins = config.corsOrigin === '*' 
  ? '*' 
  : config.corsOrigin.split(',').map(o => o.trim());

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-api-key', 'x-gemini-model'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

import path from 'path';

// API Routes
app.use('/api', routes);

// Serve Static Frontend (Compiled Vite SPA)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// SPA Catch-All Route (fallback to index.html for client routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server
async function startServer() {
  try {
    await initDatabaseAndSeed();

    app.listen(config.port, () => {
      console.log(`🚀 MindMap Studio Backend running at http://localhost:${config.port}`);
      console.log(`📡 Health Check: http://localhost:${config.port}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
