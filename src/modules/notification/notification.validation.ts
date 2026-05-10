import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
}).optional();

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;
