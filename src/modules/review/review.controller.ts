import type { Request, Response } from 'express';
import { logger } from '../../lib/logger';
import { getMyReviews } from './review.service';

export async function getMyReviewsController(req: Request, res: Response) {
  try {
    const result = await getMyReviews(req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ err, userId: req.user!.id }, 'getMyReviews failed');
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
