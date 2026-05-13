import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { createServer as createHttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { logger } from './lib/logger';
import { router } from './routes';
import { globalLimiter, authLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { setupNotificationSockets } from './sockets/notificationHandler';

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

export function createServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
  });

  app.use(helmet());
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
      customSuccessMessage: (req, res) =>
        `${req.method} ${req.url} completed ${res.statusCode} in ${(res as any).responseTime}ms`,
      customErrorMessage: (req, res) =>
        `${req.method} ${req.url} errored ${res.statusCode} in ${(res as any).responseTime}ms`,
    })
  );

  app.use(globalLimiter);
  app.use('/api/auth', authLimiter);

  // Root route for Railway health checks & quick status
  app.get('/', (_req, res) => {
    res.json({ name: 'Meetiqo API', status: 'running', version: '1.0.0' });
  });

  app.use('/api', router);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  setupNotificationSockets(io);

  app.use(notFound);
  app.use(errorHandler);

  (app as any).io = io;

  return httpServer;
}
