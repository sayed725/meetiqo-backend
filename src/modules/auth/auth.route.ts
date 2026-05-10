import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  register,
  login,
  googleAuth,
  me,
  logout,
} from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/google', googleAuth);
authRoutes.get('/me', authenticate, me);
authRoutes.post('/logout', logout);
