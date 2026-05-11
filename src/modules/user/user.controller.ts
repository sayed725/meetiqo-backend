import type { Request, Response } from 'express';
import { logger } from '../../lib/logger';
import { getSavedEvents } from './user.service';

export async function getSavedEventsController(req: Request, res: Response) {
  try {
    const result = await getSavedEvents(req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ err, userId: req.user!.id }, 'getSavedEvents failed');
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
