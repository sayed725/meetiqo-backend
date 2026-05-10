import type { Request, Response } from 'express';
import { logger } from '../../lib/logger';
import { createAndNotify } from '../../lib/notifications';
import { invalidateEventCache } from '../../middleware/cache';
import {
  createEventSchema,
  updateEventSchema,
  updateParticipationSchema,
  createReviewSchema,
} from './event.validation';
import {
  getEventsList,
  getEventBySlug,
  createEvent,
  getEventOwner,
  updateEvent,
  deleteEvent,
  publishEvent,
  getEventForJoin,
  getParticipation,
  countApprovedParticipants,
  createParticipation,
  updateParticipationStatus,
  getParticipantsByEvent,
  getUserParticipation,
  getUserReview,
  createReview,
  getReviewsByEvent,
} from './event.service';

export async function getEvents(req: Request, res: Response) {
  const result = await getEventsList(req.query);
  logger.info({ page: result.page, limit: 12, total: result.total, sortBy: req.query.sortBy }, 'Fetched events list');
  res.json({ success: true, data: result });
}

export async function getEventBySlugController(req: Request, res: Response) {
  const event = await getEventBySlug(req.params.slug);
  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found' });
    return;
  }
  logger.info({ slug: req.params.slug }, 'Fetched event by slug');
  res.json({ success: true, data: event });
}

export async function createEventController(req: Request, res: Response) {
  const parse = createEventSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  const event = await createEvent(parse.data, req.user!.id);
  await invalidateEventCache();
  logger.info({ eventId: event.id, organizerId: req.user!.id }, 'Event created');

  res.status(201).json({ success: true, data: event });
}

export async function updateEventController(req: Request, res: Response) {
  const parse = updateEventSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  const organizerId = await getEventOwner(req.params.id);
  if (!organizerId) {
    res.status(404).json({ success: false, message: 'Event not found' });
    return;
  }
  if (organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Not authorized to update this event' });
    return;
  }

  const event = await updateEvent(req.params.id, parse.data);
  await invalidateEventCache();
  logger.info({ eventId: event.id }, 'Event updated');

  res.json({ success: true, data: event });
}

export async function deleteEventController(req: Request, res: Response) {
  const organizerId = await getEventOwner(req.params.id);
  if (!organizerId) {
    res.status(404).json({ success: false, message: 'Event not found' });
    return;
  }
  if (organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    return;
  }

  await deleteEvent(req.params.id);
  await invalidateEventCache();
  logger.info({ eventId: req.params.id, userId: req.user!.id }, 'Event deleted');

  res.json({ success: true, message: 'Event deleted' });
}

export async function publishEventController(req: Request, res: Response) {
  const organizerId = await getEventOwner(req.params.id);
  if (!organizerId) {
    res.status(404).json({ success: false, message: 'Event not found' });
    return;
  }
  if (organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const event = await publishEvent(req.params.id);
  await invalidateEventCache();
  logger.info({ eventId: event.id }, 'Event published');

  res.json({ success: true, data: event });
}

// Participation controllers
export async function joinEvent(req: Request, res: Response) {
  const event = await getEventForJoin(req.params.id);
  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found' });
    return;
  }
  if (event.status !== 'PUBLISHED') {
    res.status(400).json({ success: false, message: 'Event is not published' });
    return;
  }

  const existing = await getParticipation(req.user!.id, event.id);
  if (existing) {
    res.status(409).json({ success: false, message: 'Already joined or requested' });
    return;
  }

  if (event.maxParticipants) {
    const count = await countApprovedParticipants(event.id);
    if (count >= event.maxParticipants) {
      res.status(400).json({ success: false, message: 'Event is full' });
      return;
    }
  }

  const status = event.type === 'PUBLIC' ? 'APPROVED' : 'PENDING';
  const participation = await createParticipation(req.user!.id, event.id, status);

  if (event.type === 'PRIVATE') {
    const io = (req.app as any).io;
    await createAndNotify(
      io,
      event.organizerId,
      'JOIN_REQUEST',
      'New Join Request',
      `${participation.user.name} requested to join "${event.title}"`,
      { eventId: event.id, participationId: participation.id }
    );
  }

  logger.info(
    { userId: req.user!.id, eventId: event.id, status: participation.status },
    'User joined event'
  );

  res.status(201).json({ success: true, data: participation });
}

export async function updateParticipant(req: Request, res: Response) {
  const parse = updateParticipationSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  const organizerId = await getEventOwner(req.params.id);
  if (!organizerId) {
    res.status(404).json({ success: false, message: 'Event not found' });
    return;
  }
  if (organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const participation = await updateParticipationStatus(req.params.id, req.params.userId, parse.data.status);

  const io = (req.app as any).io;
  const event = await getEventForJoin(req.params.id);
  const title = event?.title || 'the event';

  if (parse.data.status === 'APPROVED') {
    await createAndNotify(
      io,
      req.params.userId,
      'EVENT_UPDATE',
      'Request Approved',
      `Your request to join "${title}" has been approved`,
      { eventId: req.params.id }
    );
  } else if (parse.data.status === 'REJECTED') {
    await createAndNotify(
      io,
      req.params.userId,
      'EVENT_UPDATE',
      'Request Rejected',
      `Your request to join "${title}" was rejected`,
      { eventId: req.params.id }
    );
  }

  logger.info(
    { eventId: req.params.id, userId: req.params.userId, status: parse.data.status },
    'Participation status updated'
  );

  res.json({ success: true, data: participation });
}

export async function getParticipants(req: Request, res: Response) {
  const organizerId = await getEventOwner(req.params.id);
  if (!organizerId) {
    res.status(404).json({ success: false, message: 'Event not found' });
    return;
  }
  if (organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const participants = await getParticipantsByEvent(req.params.id);
  logger.info({ eventId: req.params.id }, 'Fetched participants');

  res.json({ success: true, data: participants });
}

// Review controllers
export async function createReviewController(req: Request, res: Response) {
  const parse = createReviewSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  const participation = await getUserParticipation(req.user!.id, req.params.id);
  if (!participation || participation.status !== 'APPROVED') {
    res.status(403).json({ success: false, message: 'You must be an approved participant to review' });
    return;
  }

  const existingReview = await getUserReview(req.user!.id, req.params.id);
  if (existingReview) {
    res.status(409).json({ success: false, message: 'You have already reviewed this event' });
    return;
  }

  const review = await createReview(parse.data, req.user!.id, req.params.id);
  const organizerId = await getEventOwner(req.params.id);
  const title = (await getEventForJoin(req.params.id))?.title || 'the event';

  const io = (req.app as any).io;
  if (organizerId) {
    await createAndNotify(
      io,
      organizerId,
      'REVIEW',
      'New Review',
      `${review.user.name} left a ${review.rating}-star review on "${title}"`,
      { eventId: req.params.id, reviewId: review.id, rating: review.rating }
    );
  }

  logger.info(
    { userId: req.user!.id, eventId: req.params.id, rating: review.rating },
    'Review created'
  );

  res.status(201).json({ success: true, data: review });
}

export async function getReviewsController(req: Request, res: Response) {
  const result = await getReviewsByEvent(req.params.id, req.query);
  res.json({ success: true, data: result });
}
