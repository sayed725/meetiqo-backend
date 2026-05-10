import type { Request, Response } from 'express';
import { logger } from '../../lib/logger';
import { registerUserSchema, loginUserSchema, googleAuthSchema } from './auth.validation';
import {
  findUserByEmail,
  findUserByEmailWithPassword,
  createUser,
  verifyPassword,
  generateToken,
  verifyGoogleToken,
  createGoogleUser,
  updateGoogleUser,
  findUserById,
} from './auth.service';

export async function register(req: Request, res: Response) {
  const parse = registerUserSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  const existing = await findUserByEmail(parse.data.email);
  if (existing) {
    res.status(409).json({ success: false, message: 'Email already in use' });
    return;
  }

  const user = await createUser(parse.data);
  logger.info({ userId: user.id, email: user.email }, 'User registered');

  const token = generateToken(user);
  res.status(201).json({ success: true, data: { user, token } });
}

export async function login(req: Request, res: Response) {
  const parse = loginUserSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  const user = await findUserByEmailWithPassword(parse.data.email);
  if (!user || !user.password) {
    logger.warn({ email: parse.data.email }, 'Failed login attempt: user not found or no password');
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  if (user.isBanned) {
    logger.warn({ userId: user.id, email: user.email }, 'Login attempt for banned user');
    res.status(403).json({ success: false, message: 'Account banned' });
    return;
  }

  const valid = await verifyPassword(parse.data.password, user.password);
  if (!valid) {
    logger.warn({ email: parse.data.email }, 'Failed login attempt: incorrect password');
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const { password: _password, ...safeUser } = user as any;
  const token = generateToken(safeUser);

  logger.info({ userId: user.id, email: user.email }, 'User logged in');
  res.json({ success: true, data: { user: safeUser, token } });
}

export async function googleAuth(req: Request, res: Response) {
  const parse = googleAuthSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', error: parse.error.format() });
    return;
  }

  let payload;
  try {
    payload = await verifyGoogleToken(parse.data.idToken);
  } catch (err) {
    logger.warn({ err }, 'Google ID token verification failed');
    res.status(400).json({ success: false, message: 'Invalid Google token' });
    return;
  }

  if (!payload || !payload.email) {
    res.status(400).json({ success: false, message: 'Invalid Google token payload' });
    return;
  }

  const email = payload.email;
  const name = payload.name || email.split('@')[0];

  let user = await findUserByEmailWithPassword(email);

  if (!user) {
    user = await createGoogleUser(email, name, payload.picture);
    logger.info({ userId: user.id, email }, 'User created via Google OAuth');
  } else {
    if (!user.isVerified || (payload.picture && !user.avatar)) {
      user = await updateGoogleUser(user.id, payload.picture || user.avatar);
    }
    logger.info({ userId: user.id, email }, 'User logged in via Google OAuth');
  }

  const { password: _password, ...safeUser } = user as any;
  const token = generateToken(safeUser);

  res.json({ success: true, data: { user: safeUser, token } });
}

export async function me(req: Request, res: Response) {
  const user = await findUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.json({ success: true, data: user });
}

export async function logout(_req: Request, res: Response) {
  res.json({ success: true, message: 'Logged out successfully' });
}
