import { Router } from 'express';
import { eventRoutes } from '../modules/event/event.route';
import { authRoutes } from '../modules/auth/auth.route';
import { aiRoutes } from '../modules/ai/ai.route';
import { notificationRoutes } from '../modules/notification/notification.route';
import { invitationRoutes } from '../modules/invitation/invitation.route';
import { contactRoutes } from '../modules/contact/contact.route';

export const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/ai', aiRoutes);
router.use('/invitations', invitationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/contact', contactRoutes);
