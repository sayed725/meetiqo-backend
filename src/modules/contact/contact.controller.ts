import type { Request, Response } from 'express';
import { createContactSchema } from './contact.validation';
import { logContactSubmission } from './contact.service';

export async function createContact(req: Request, res: Response) {
  const parse = createContactSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  await logContactSubmission(parse.data);

  res.status(201).json({
    success: true,
    message: 'Message received. We will get back to you soon.',
  });
}
