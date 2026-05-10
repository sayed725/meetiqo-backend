import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../lib/prisma';
import type { RegisterUserInput } from './auth.validation';

const googleClient = new OAuth2Client();

export const userSelect = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  role: true,
  isVerified: true,
  isBanned: true,
  createdAt: true,
} as const;

const userSelectWithPassword = {
  ...userSelect,
  password: true,
} as const;

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: userSelect,
  });
}

export async function findUserByEmailWithPassword(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: userSelectWithPassword,
  });
}

export async function createUser(data: RegisterUserInput) {
  const hashed = await bcrypt.hash(data.password, 12);
  return prisma.user.create({
    data: { email: data.email, name: data.name, password: hashed, role: 'USER' },
    select: userSelect,
  });
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

export async function verifyGoogleToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

export async function createGoogleUser(email: string, name: string, avatar?: string) {
  return prisma.user.create({
    data: {
      email,
      name,
      avatar,
      isVerified: true,
      role: 'USER',
    },
    select: userSelectWithPassword,
  });
}

export async function updateGoogleUser(id: string, avatar?: string | null) {
  return prisma.user.update({
    where: { id },
    data: { isVerified: true, avatar: avatar ?? undefined },
    select: userSelectWithPassword,
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
}
