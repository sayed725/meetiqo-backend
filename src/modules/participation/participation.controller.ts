import type { Request, Response } from 'express';
import { logger } from '../../lib/logger';
import { getMyJoinedEvents } from './participation.service';

export async function getMyEventsController(req: Request, res: Response) {
  try {
    const result = await getMyJoinedEvents(req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ err, userId: req.user!.id }, 'getMyEvents failed');
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
