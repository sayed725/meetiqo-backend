import type { Request, Response } from 'express';
import { getAdminStats, getRecentUsers, getFlaggedEvents } from './admin.service';

export async function getStatsController(req: Request, res: Response) {
  const stats = await getAdminStats();
  res.json({ success: true, data: stats });
}

export async function getUsersController(req: Request, res: Response) {
  const data = await getRecentUsers(req.query);
  res.json({ success: true, data });
}

export async function getFlaggedEventsController(req: Request, res: Response) {
  const data = await getFlaggedEvents();
  res.json({ success: true, data });
}
