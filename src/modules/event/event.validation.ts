import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.enum(['TECH', 'MUSIC', 'BUSINESS', 'HEALTH', 'SPORTS', 'ART', 'EDUCATION', 'SOCIAL', 'OTHER']),
  type: z.enum(['PUBLIC', 'PRIVATE']),
  location: z.string().min(1).max(300),
  address: z.string().max(300).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  maxParticipants: z.number().int().min(1).max(10000).optional(),
  price: z.number().min(0).default(0),
  bannerImage: z.string().url().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const updateParticipationSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'LEFT']),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type UpdateParticipationInput = z.infer<typeof updateParticipationSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
