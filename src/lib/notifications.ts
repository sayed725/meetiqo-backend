import { Server } from 'socket.io';
import { prisma } from './prisma';
import { logger } from './logger';
import type { NotificationType, Prisma } from '@prisma/client';

export async function createAndNotify(
  io: Server | undefined,
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  metadata?: Prisma.InputJsonValue
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        metadata: metadata || {},
      },
    });

    if (io) {
      io.to(`user:${userId}`).emit('notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        metadata: notification.metadata,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (err) {
    logger.error({ err, userId }, 'Failed to create notification');
    throw err;
  }
}
