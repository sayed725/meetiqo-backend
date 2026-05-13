import type { Request, Response } from 'express';
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';
import { generateDescriptionSchema, planEventSchema, summarizeReviewsSchema } from './ai.validation';
import { generateEventDescription, getEventRecommendations, planEvent, summarizeEventReviews } from './ai.service';

export async function generateDescription(req: Request, res: Response) {
  const parse = generateDescriptionSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  try {
    const result = await generateEventDescription(parse.data, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ err, userId: req.user!.id }, 'generateDescription failed');
    res.status(500).json({ success: false, message: 'AI service error' });
  }
}

export async function getRecommendations(req: Request, res: Response) {
  try {
    const result = await getEventRecommendations(req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ err, userId: req.user!.id }, 'getRecommendations failed');
    res.status(500).json({ success: false, message: 'AI service error' });
  }
}

export async function planEventController(req: Request, res: Response) {
  const parse = planEventSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  try {
    const result = await planEvent(parse.data, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ err, userId: req.user!.id }, 'planEvent failed');
    res.status(500).json({ success: false, message: 'AI service error' });
  }
}

export async function summarizeReviews(req: Request, res: Response) {
  const parse = summarizeReviewsSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  try {
    const result = await summarizeEventReviews(parse.data.eventId, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err.message === 'At least 3 reviews are required') {
      res.status(400).json({ success: false, message: 'Not enough reviews', error: err.message });
      return;
    }
    logger.error({ err, userId: req.user!.id, eventId: parse.data.eventId }, 'summarizeReviews failed');
    res.status(500).json({ success: false, message: 'AI service error' });
  }
}

export async function getEventInsightsController(req: Request, res: Response) {
  try {
    const result = await import('./ai.service.js').then(m => m.generateEventInsights(req.params.id, req.user!.id));
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ err, userId: req.user!.id, eventId: req.params.id }, 'getEventInsights failed');
    res.status(500).json({ success: false, message: 'AI service error' });
  }
}
