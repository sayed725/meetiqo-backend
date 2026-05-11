import type { Request, Response } from 'express';
import { logger } from '../../lib/logger';
import { getSavedEvents, updateUserProfile, changeUserPassword, getUserProfileStats } from './user.service';
import { updateProfileSchema, changePasswordSchema } from './user.validation';

export async function getSavedEventsController(req: Request, res: Response) {
  try {
    const result = await getSavedEvents(req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ err, userId: req.user!.id }, 'getSavedEvents failed');
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function updateProfileController(req: Request, res: Response) {
  const parse = updateProfileSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  try {
    const user = await updateUserProfile(req.user!.id, parse.data);
    res.json({ success: true, data: { user }, message: 'Profile updated successfully' });
  } catch (err) {
    logger.error({ err, userId: req.user!.id }, 'updateUserProfile failed');
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function changePasswordController(req: Request, res: Response) {
  const parse = changePasswordSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  try {
    await changeUserPassword(req.user!.id, parse.data);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    if (err.message === 'Incorrect current password' || err.message === 'User not found or password not set (e.g. Google Login)') {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    logger.error({ err, userId: req.user!.id }, 'changeUserPassword failed');
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getProfileController(req: Request, res: Response) {
  try {
    const userStats = await getUserProfileStats(req.user!.id);
    res.json({ success: true, data: userStats });
  } catch (err) {
    logger.error({ err, userId: req.user!.id }, 'getUserProfileStats failed');
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
