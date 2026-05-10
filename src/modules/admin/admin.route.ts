import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { getStatsController, getUsersController, getFlaggedEventsController } from './admin.controller';

export const adminRoutes = Router();

adminRoutes.use(authenticate, authorize('ADMIN'));

adminRoutes.get('/stats', getStatsController);
adminRoutes.get('/users', getUsersController);
adminRoutes.get('/flagged-events', getFlaggedEventsController);
