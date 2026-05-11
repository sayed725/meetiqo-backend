import { prisma } from '../../lib/prisma';

export async function getMyReviews(userId: string) {
  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      event: {
        select: { title: true, slug: true, bannerImage: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    reviews,
  };
}
