import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { getSavedEventsController } from './user.controller';

export const userRoutes = Router();

userRoutes.get('/saved-events', authenticate, getSavedEventsController);
