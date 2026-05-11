import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { getMyReviewsController } from './review.controller';

export const reviewRoutes = Router();

reviewRoutes.get('/my-reviews', authenticate, getMyReviewsController);
