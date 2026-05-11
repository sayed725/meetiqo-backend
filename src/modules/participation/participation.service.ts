import { prisma } from '../../lib/prisma';

export async function getMyJoinedEvents(userId: string) {
  const participations = await prisma.participation.findMany({
    where: { userId },
    include: {
      event: {
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
    orderBy: {
      joinedAt: 'desc',
    },
  });

  return {
    events: participations.map(p => p.event),
  };
}
