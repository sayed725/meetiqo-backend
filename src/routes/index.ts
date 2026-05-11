import { Router } from 'express';
import { eventRoutes } from '../modules/event/event.route';
import { authRoutes } from '../modules/auth/auth.route';
import { aiRoutes } from '../modules/ai/ai.route';
import { notificationRoutes } from '../modules/notification/notification.route';
import { invitationRoutes } from '../modules/invitation/invitation.route';
import { contactRoutes } from '../modules/contact/contact.route';
import { analyticsRoutes } from '../modules/analytics/analytics.route';
import { adminRoutes } from '../modules/admin/admin.route';
import { userRoutes } from '../modules/user/user.route';
import { participationRoutes } from '../modules/participation/participation.route';
import { reviewRoutes } from '../modules/review/review.route';

export const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/participations', participationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/ai', aiRoutes);
router.use('/invitations', invitationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/contact', contactRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
