import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  generateDescription,
  getRecommendations,
  planEventController,
  summarizeReviews,
  getEventInsightsController,
} from './ai.controller';

export const aiRoutes = Router();

aiRoutes.post('/generate-description', authenticate, authorize('ORGANIZER', 'ADMIN'), generateDescription);
aiRoutes.post('/recommendations', authenticate, authorize('USER', 'ORGANIZER', 'ADMIN'), getRecommendations);
aiRoutes.post('/plan-event', authenticate, authorize('ORGANIZER', 'ADMIN'), planEventController);
aiRoutes.post('/summarize-reviews', authenticate, authorize('ORGANIZER', 'ADMIN'), summarizeReviews);
aiRoutes.get('/event-insights/:id', authenticate, getEventInsightsController);
