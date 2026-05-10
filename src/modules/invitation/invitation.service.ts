import { prisma } from '../../lib/prisma';

export async function getEventForInvitation(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, title: true },
  });
}

export async function checkExistingParticipation(userId: string, eventId: string) {
  return prisma.participation.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
}

export async function checkExistingInvitation(receiverId: string, eventId: string) {
  return prisma.invitation.findUnique({
    where: { receiverId_eventId: { receiverId, eventId } },
  });
}

export async function createInvitation(senderId: string, receiverId: string, eventId: string, message?: string) {
  return prisma.invitation.create({
    data: {
      senderId,
      receiverId,
      eventId,
      message: message || null,
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      event: { select: { id: true, title: true, slug: true, startDate: true } },
    },
  });
}

export async function getReceivedInvitations(receiverId: string) {
  return prisma.invitation.findMany({
    where: { receiverId },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      event: { select: { id: true, title: true, slug: true, startDate: true, location: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findInvitationByIdAndReceiver(id: string, receiverId: string) {
  return prisma.invitation.findFirst({
    where: { id, receiverId },
    include: { event: { select: { id: true } } },
  });
}

export async function updateInvitationStatus(id: string, status: string) {
  return prisma.invitation.update({
    where: { id },
    data: { status: status as any },
  });
}

export async function acceptInvitation(userId: string, eventId: string) {
  return prisma.participation.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: {
      userId,
      eventId,
      status: 'APPROVED',
      role: 'ATTENDEE',
    },
    update: { status: 'APPROVED' },
  });
}
