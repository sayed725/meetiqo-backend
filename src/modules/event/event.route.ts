import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { cacheEvents } from '../../middleware/cache';
import {
  getEvents,
  getMyEventsController,
  getEventBySlugController,
  createEventController,
  updateEventController,
  deleteEventController,
  publishEventController,
  joinEvent,
  updateParticipant,
  getParticipants,
  createReviewController,
  getReviewsController,
  saveEventController,
  unsaveEventController,
  getUserStatusController,
} from './event.controller';

export const eventRoutes = Router();

// Public
eventRoutes.get('/', cacheEvents(60), getEvents);
eventRoutes.get('/:slug', getEventBySlugController);

// Protected - me
eventRoutes.get('/me/all', authenticate, authorize('ADMIN', 'ORGANIZER'), getMyEventsController);

// Protected - create requires ORGANIZER or ADMIN
eventRoutes.post('/', authenticate, authorize('ADMIN', 'ORGANIZER'), createEventController);

// Protected - owner or ADMIN
eventRoutes.put('/:id', authenticate, updateEventController);
eventRoutes.patch('/:id/publish', authenticate, publishEventController);
eventRoutes.delete('/:id', authenticate, deleteEventController);

// Participation
eventRoutes.post('/:id/join', authenticate, joinEvent);
eventRoutes.get('/:id/participants', authenticate, getParticipants);
eventRoutes.patch('/:id/participants/:userId', authenticate, updateParticipant);

// Saved Events & User Status
eventRoutes.post('/:id/save', authenticate, saveEventController);
eventRoutes.delete('/:id/save', authenticate, unsaveEventController);
eventRoutes.get('/:id/user-status', authenticate, getUserStatusController);

// Reviews
eventRoutes.post('/:id/reviews', authenticate, createReviewController);
eventRoutes.get('/:id/reviews', getReviewsController);
