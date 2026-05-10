import dotenv from 'dotenv';
dotenv.config();

import { createServer } from './server';
import { logger } from './lib/logger';
import { redis } from './lib/redis';
import { prisma } from './lib/prisma';

const port = parseInt(process.env.PORT || '5001', 10);

const httpServer = createServer();

const server = httpServer.listen(port, () => {
  logger.info(`Meetiqo API running on http://localhost:${port}`);
});

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');
    await redis.quit();
    await prisma.$disconnect();
    logger.info('Connections closed. Exiting.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});
