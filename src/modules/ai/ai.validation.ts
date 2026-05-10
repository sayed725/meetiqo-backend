import { z } from 'zod';

export const generateDescriptionSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1),
  location: z.string().min(1),
  targetAudience: z.string().min(1),
  keyPoints: z.array(z.string()).min(1).max(10),
});

export const planEventSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().min(1),
  duration: z.number().min(0.5).max(72),
  expectedAttendees: z.number().int().min(1),
  eventType: z.enum(['PUBLIC', 'PRIVATE']),
  goals: z.array(z.string()).min(1).max(10),
});

export const summarizeReviewsSchema = z.object({
  eventId: z.string().min(1),
});

export type GenerateDescriptionInput = z.infer<typeof generateDescriptionSchema>;
export type PlanEventInput = z.infer<typeof planEventSchema>;
export type SummarizeReviewsInput = z.infer<typeof summarizeReviewsSchema>;
