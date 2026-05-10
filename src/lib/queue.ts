import { Queue, Worker, type Job } from 'bullmq';
import { redis, isRedisMock } from './redis';
import { logger } from './logger';

export const notificationQueue = isRedisMock
  ? ({} as Queue)
  : new Queue('notifications', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    });

if (!isRedisMock) {
  const notificationWorker = new Worker(
    'notifications',
    async (job: Job) => {
      logger.info(
        { jobId: job.id, name: job.name, data: job.data },
        'Processing notification job'
      );

      const { type, userId, title, body, metadata } = job.data;

      logger.info(
        { type, userId, title },
        'Notification sent'
      );

      return { sent: true, userId, type };
    },
    { connection: redis }
  );

  notificationWorker.on('completed', (job) => {
    logger.info({ jobId: job?.id }, 'Notification job completed');
  });

  notificationWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Notification job failed');
  });
}

export async function addNotificationJob(data: {
  type: string;
  userId: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  if (isRedisMock) {
    logger.info({ data }, 'Mock notification job (Redis not available)');
    return { id: 'mock', ...data };
  }
  return notificationQueue.add('send-notification', data);
}
