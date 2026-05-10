import type { Request, Response } from 'express';
import { logger } from '../../lib/logger';
import { createAndNotify } from '../../lib/notifications';
import { createInvitationSchema, respondInvitationSchema } from './invitation.validation';
import {
  getEventForInvitation,
  checkExistingParticipation,
  checkExistingInvitation,
  createInvitation,
  getReceivedInvitations,
  findInvitationByIdAndReceiver,
  updateInvitationStatus,
  acceptInvitation,
} from './invitation.service';

export async function createInvitationController(req: Request, res: Response) {
  const parse = createInvitationSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  const { receiverId, message } = parse.data;
  const eventId = req.params.id;

  const event = await getEventForInvitation(eventId);
  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found' });
    return;
  }
  if (event.organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const existingParticipation = await checkExistingParticipation(receiverId, eventId);
  if (existingParticipation) {
    res.status(409).json({ success: false, message: 'User already participating or requested' });
    return;
  }

  const existingInvitation = await checkExistingInvitation(receiverId, eventId);
  if (existingInvitation) {
    res.status(409).json({ success: false, message: 'Invitation already sent' });
    return;
  }

  const invitation = await createInvitation(req.user!.id, receiverId, eventId, message);

  const io = (req.app as any).io;
  await createAndNotify(
    io,
    receiverId,
    'INVITATION',
    'New Invitation',
    `${invitation.sender.name} invited you to "${invitation.event.title}"`,
    { eventId, invitationId: invitation.id }
  );

  logger.info({ senderId: req.user!.id, receiverId, eventId }, 'Invitation created');
  res.status(201).json({ success: true, data: invitation });
}

export async function getReceivedInvitationsController(req: Request, res: Response) {
  const invitations = await getReceivedInvitations(req.user!.id);
  res.json({ success: true, data: invitations });
}

export async function respondToInvitation(req: Request, res: Response) {
  const parse = respondInvitationSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  const invitation = await findInvitationByIdAndReceiver(req.params.id, req.user!.id);
  if (!invitation) {
    res.status(404).json({ success: false, message: 'Invitation not found' });
    return;
  }

  const updated = await updateInvitationStatus(req.params.id, parse.data.status);

  if (parse.data.status === 'ACCEPTED') {
    await acceptInvitation(req.user!.id, invitation.event.id);
  }

  logger.info({ invitationId: req.params.id, userId: req.user!.id, status: parse.data.status }, 'Invitation responded');
  res.json({ success: true, data: updated });
}
