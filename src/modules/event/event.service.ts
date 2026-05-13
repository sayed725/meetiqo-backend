import { prisma } from '../../lib/prisma';
import type { CreateEventInput, UpdateEventInput } from './event.validation';

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .substring(0, 60);
  return `${base}-${Date.now().toString(36)}`;
}

function buildWhere(query: Record<string, any>) {
  const where: any = { status: 'PUBLISHED' };

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.category) where.category = query.category;
  if (query.type) where.type = query.type;
  if (query.isPaid !== undefined) where.isPaid = query.isPaid === 'true';
  if (query.startDate) where.startDate = { gte: new Date(query.startDate) };
  if (query.ids) {
    const idsArray = query.ids.split(',').map((id: string) => id.trim()).filter(Boolean);
    if (idsArray.length > 0) {
      where.id = { in: idsArray };
    }
  }

  return where;
}

const includeDefault: any = {
  organizer: { select: { id: true, name: true, avatar: true } },
  _count: { select: { participations: { where: { status: 'APPROVED' } } } },
};

// Event services
export async function getEventsList(query: Record<string, any>) {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 12));
  const skip = (page - 1) * limit;
  const sortBy = (query.sortBy as string) || 'date';

  const where = buildWhere(query);
  const total = await prisma.event.count({ where });

  let events: any[];

  if (sortBy === 'popular') {
    const all = await prisma.event.findMany({ where, select: { id: true } });
    const counts = await prisma.participation.groupBy({
      by: ['eventId'],
      where: { eventId: { in: all.map((e) => e.id) }, status: 'APPROVED' },
      _count: { eventId: true },
    });
    const countMap = new Map(counts.map((c) => [c.eventId, c._count.eventId]));
    const sortedIds = all
      .map((e) => ({ id: e.id, count: countMap.get(e.id) || 0 }))
      .sort((a, b) => b.count - a.count)
      .map((e) => e.id);

    const paginatedIds = sortedIds.slice(skip, skip + limit);
    events = await prisma.event.findMany({
      where: { id: { in: paginatedIds } },
      include: includeDefault,
    });
    const eventMap = new Map(events.map((e) => [e.id, e]));
    events = paginatedIds.map((id) => eventMap.get(id)).filter(Boolean);
  } else {
    const orderBy: any = sortBy === 'price' ? { price: 'asc' } : { startDate: 'asc' };

    events = await prisma.event.findMany({
      where,
      include: includeDefault,
      orderBy,
      skip,
      take: limit,
    });
  }

  return { events, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getMyEvents(organizerId: string, query: Record<string, any>) {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 12));
  const skip = (page - 1) * limit;

  const where: any = { organizerId };
  if (query.status) {
    where.status = query.status;
  }

  const total = await prisma.event.count({ where });
  const events = await prisma.event.findMany({
    where,
    include: includeDefault,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  return { events, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getEventBySlug(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      organizer: { select: { id: true, name: true, avatar: true } },
      participations: {
        where: { status: 'APPROVED' },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      reviews: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { participations: { where: { status: 'APPROVED' } } } },
    },
  });

  if (!event) return null;

  const avg = await prisma.review.aggregate({
    where: { eventId: event.id },
    _avg: { rating: true },
  });

  return {
    ...event,
    averageRating: avg._avg.rating ? Number(avg._avg.rating.toFixed(1)) : null,
  };
}

export async function createEvent(data: CreateEventInput, organizerId: string) {
  return prisma.event.create({
    data: {
      ...data,
      slug: generateSlug(data.title),
      organizerId,
      status: data.status || 'DRAFT',
      isPaid: data.price > 0,
    },
    include: includeDefault,
  });
}

export async function getEventOwner(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    select: { organizerId: true },
  });
  return event?.organizerId ?? null;
}

export async function updateEvent(id: string, data: UpdateEventInput) {
  return prisma.event.update({
    where: { id },
    data: {
      ...data,
      isPaid: data.price !== undefined ? data.price > 0 : undefined,
    },
    include: includeDefault,
  });
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } });
}

export async function publishEvent(id: string) {
  return prisma.event.update({
    where: { id },
    data: { status: 'PUBLISHED' },
    include: includeDefault,
  });
}

// Participation services
export async function getEventForJoin(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, type: true, organizerId: true, maxParticipants: true, status: true, title: true },
  });
}

export async function getParticipation(userId: string, eventId: string) {
  return prisma.participation.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
}

export async function countApprovedParticipants(eventId: string) {
  return prisma.participation.count({
    where: { eventId, status: 'APPROVED' },
  });
}

export async function createParticipation(userId: string, eventId: string, status: string) {
  return prisma.participation.create({
    data: {
      userId,
      eventId,
      status: status as any,
      role: 'ATTENDEE',
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function updateParticipationStatus(eventId: string, userId: string, status: string) {
  return prisma.participation.update({
    where: { userId_eventId: { userId, eventId } },
    data: { status: status as any },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function getParticipantsByEvent(eventId: string) {
  return prisma.participation.findMany({
    where: { eventId },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    orderBy: { joinedAt: 'desc' },
  });
}

// Review services
export async function getUserParticipation(userId: string, eventId: string) {
  return prisma.participation.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
}

export async function getUserReview(userId: string, eventId: string) {
  return prisma.review.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
}

export async function createReview(data: { rating: number; comment?: string }, userId: string, eventId: string) {
  return prisma.review.create({
    data: {
      ...data,
      userId,
      eventId,
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function getReviewsByEvent(eventId: string, query: Record<string, any>) {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 12));
  const skip = (page - 1) * limit;

  const total = await prisma.review.count({ where: { eventId } });

  const reviews = await prisma.review.findMany({
    where: { eventId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const avg = await prisma.review.aggregate({
    where: { eventId },
    _avg: { rating: true },
  });

  return {
    reviews,
    averageRating: avg._avg.rating ? Number(avg._avg.rating.toFixed(1)) : null,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function saveEventToUser(userId: string, eventId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { savedEvents: { connect: { id: eventId } } },
  });
}

export async function unsaveEventFromUser(userId: string, eventId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { savedEvents: { disconnect: { id: eventId } } },
  });
}

export async function checkEventSaved(userId: string, eventId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { savedEvents: { where: { id: eventId }, select: { id: true } } },
  });
  return (user?.savedEvents?.length || 0) > 0;
}
