import { prisma } from '../../lib/prisma';

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
