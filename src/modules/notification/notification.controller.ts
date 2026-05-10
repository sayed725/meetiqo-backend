import type { Request, Response } from 'express';
import { logger } from '../../lib/logger';
import {
  getNotificationsPaginated,
  findNotificationByIdAndUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './notification.service';

export async function getNotifications(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

  const result = await getNotificationsPaginated(req.user!.id, page, limit);
  res.json({ success: true, data: result });
}

export async function markAsRead(req: Request, res: Response) {
  const notification = await findNotificationByIdAndUser(req.params.id, req.user!.id);
  if (!notification) {
    res.status(404).json({ success: false, message: 'Notification not found' });
    return;
  }

  await markNotificationAsRead(req.params.id);
  logger.info({ userId: req.user!.id, notificationId: req.params.id }, 'Notification marked as read');
  res.json({ success: true, message: 'Marked as read' });
}

export async function markAllAsRead(req: Request, res: Response) {
  await markAllNotificationsAsRead(req.user!.id);
  logger.info({ userId: req.user!.id }, 'All notifications marked as read');
  res.json({ success: true, message: 'All marked as read' });
}
