import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { getSavedEventsController, updateProfileController, changePasswordController, getProfileController } from './user.controller';

export const userRoutes = Router();

userRoutes.get('/saved-events', authenticate, getSavedEventsController);
userRoutes.get('/profile', authenticate, getProfileController);
userRoutes.patch('/me', authenticate, updateProfileController);
userRoutes.patch('/me/password', authenticate, changePasswordController);
