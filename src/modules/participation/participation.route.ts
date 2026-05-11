import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { getMyEventsController } from './participation.controller';

export const participationRoutes = Router();

participationRoutes.get('/my-events', authenticate, getMyEventsController);
