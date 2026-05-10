import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from './notification.controller';

export const notificationRoutes = Router();

notificationRoutes.get('/', authenticate, getNotifications);
notificationRoutes.patch('/:id/read', authenticate, markAsRead);
notificationRoutes.patch('/read-all', authenticate, markAllAsRead);
