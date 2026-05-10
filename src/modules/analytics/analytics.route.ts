import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { statsController, participantsController, categoryController, metricsController } from './analytics.controller';

export const analyticsRoutes = Router();

analyticsRoutes.use(authenticate, authorize('ORGANIZER', 'ADMIN'));

analyticsRoutes.get('/stats', statsController);
analyticsRoutes.get('/participants', participantsController);
analyticsRoutes.get('/events-by-category', categoryController);
analyticsRoutes.get('/metrics', metricsController);
