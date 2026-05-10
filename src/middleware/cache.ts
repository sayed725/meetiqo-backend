import type { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

export function cacheEvents(duration: number = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = `events:list:${JSON.stringify(req.query)}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info({ cacheKey }, 'Cache hit for events list');
        res.json(JSON.parse(cached));
        return;
      }

      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        redis.setex(cacheKey, duration, JSON.stringify(body)).catch(() => {});
        return originalJson(body);
      };

      next();
    } catch {
      next();
    }
  };
}

export async function invalidateEventCache() {
  const keys = await redis.keys('events:list:*');
  if (keys.length > 0) {
    await redis.del(...keys);
    logger.info({ count: keys.length }, 'Event cache invalidated');
  }
}
