import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  createInvitationController,
  getReceivedInvitationsController,
  respondToInvitation,
} from './invitation.controller';

export const invitationRoutes = Router();

invitationRoutes.post('/:id/invite', authenticate, createInvitationController);
invitationRoutes.get('/received', authenticate, getReceivedInvitationsController);
invitationRoutes.patch('/:id/respond', authenticate, respondToInvitation);
