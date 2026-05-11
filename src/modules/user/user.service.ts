import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import type { UpdateProfileInput, ChangePasswordInput } from './user.validation';

export async function getSavedEvents(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      savedEvents: {
        include: {
          organizer: {
            select: { name: true, avatar: true },
          },
          _count: {
            select: { participations: true },
          },
        },
      },
    },
  });

  return {
    events: user?.savedEvents || [],
  };
}

export async function updateUserProfile(userId: string, data: UpdateProfileInput) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      avatar: data.avatar || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      updatedAt: true,
    },
  });
}

export async function changeUserPassword(userId: string, data: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.password) {
    throw new Error('User not found or password not set (e.g. Google Login)');
  }

  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) {
    throw new Error('Incorrect current password');
  }

  const newHashedPassword = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: newHashedPassword },
  });
}

export async function getUserProfileStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          savedEvents: true,
          receivedInvitations: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) throw new Error('User not found');
  return user;
}
