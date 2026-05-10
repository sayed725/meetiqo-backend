import type { Request, Response } from 'express';
import { getDashboardStats, getParticipantsOverTime, getEventsByCategory, getAnalyticsMetrics } from './analytics.service';

export async function statsController(req: Request, res: Response) {
  const stats = await getDashboardStats(req.user!.id);
  res.json({ success: true, data: stats });
}

export async function participantsController(req: Request, res: Response) {
  const { startDate, endDate } = req.query;
  const data = await getParticipantsOverTime(req.user!.id, startDate as string, endDate as string);
  res.json({ success: true, data });
}

export async function categoryController(req: Request, res: Response) {
  const data = await getEventsByCategory(req.user!.id);
  res.json({ success: true, data });
}

export async function metricsController(req: Request, res: Response) {
  const data = await getAnalyticsMetrics(req.user!.id);
  res.json({ success: true, data });
}
