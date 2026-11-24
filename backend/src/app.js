import express from 'express';
import helmet from 'helmet';
import { json } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import notesRouter from './routes/notes.js';
import topicsRouter from './routes/topics.js';
import interviewsRouter from './routes/interviews.js';
import reportsRouter from './routes/reports.js';
import { hostGuard } from './middleware/hostGuard.js';
import { originGuard } from './middleware/originGuard.js';
import { errorHandler } from './middleware/errors.js';
import { rateLimit } from './middleware/rateLimit.js';

export function createApp({ db, config }) {
  const app = express();
  // expose config for middleware that may need it
  app.set('config', config);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:"],
        "font-src": ["'self'"],
        "connect-src": ["'self'"],
        "media-src": ["'self'", "blob:"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'none'"]
      }
    }
  }));

  // JSON body parser
  app.use(json({ limit: '1mb' }));

  // Host & Origin guards
  app.use(hostGuard);
  app.use(originGuard);

  // Rate limiting (simple placeholder)
  app.use(rateLimit);

  // API router base path
  const apiRouter = express.Router();
  apiRouter.use('/health', healthRouter);
  apiRouter.use('/auth', authRouter);
  apiRouter.use('/admin', adminRouter);
  apiRouter.use('/notes', notesRouter);
  apiRouter.use('/topics', topicsRouter);
  apiRouter.use('/interviews', interviewsRouter);
  apiRouter.use('/reports', reportsRouter);
  // unknown API routes -> 404 JSON
  apiRouter.use((req, res, next) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API route not found' } });
  });

  app.use('/api', apiRouter);

  // Static folder (if provided)
  if (config.staticDir) {
    app.use(express.static(config.staticDir));
    // fallback to index.html for non‑API GETs
    app.get('*', (req, res, next) => {
      if (req.method !== 'GET') return next();
      const indexPath = path.join(config.staticDir, 'index.html');
      res.sendFile(indexPath, err => {
        if (err) next();
      });
    });
  }

  // Final error handler
  app.use(errorHandler);

  return app;
}
