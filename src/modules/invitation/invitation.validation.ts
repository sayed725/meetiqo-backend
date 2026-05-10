import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z.string().email(),
  message: z.string().optional(),
});

export const respondInvitationSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type RespondInvitationInput = z.infer<typeof respondInvitationSchema>;
