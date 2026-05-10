import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

export async function getDashboardStats(userId: string) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  const events = await prisma.event.findMany({
    where: { organizerId: userId },
    select: { id: true, createdAt: true, price: true, isPaid: true },
  });

  const eventIds = events.map(e => e.id);

  const participations = await prisma.participation.findMany({
    where: { eventId: { in: eventIds } },
    select: { joinedAt: true, status: true },
  });

  // Events stats
  const totalEvents = events.length;
  const eventsLastMonth = events.filter(e => e.createdAt < lastMonth).length;
  const eventsThisMonth = totalEvents - eventsLastMonth;
  const totalEventsTrend = eventsLastMonth > 0 ? Math.round(((eventsThisMonth - eventsLastMonth) / eventsLastMonth) * 100) : 100;

  // Participants stats
  const approvedParticipations = participations.filter(p => p.status === 'APPROVED');
  const totalParticipants = approvedParticipations.length;
  const partsLastMonth = approvedParticipations.filter(p => p.joinedAt < lastMonth).length;
  const partsThisMonth = totalParticipants - partsLastMonth;
  const totalParticipantsTrend = partsLastMonth > 0 ? Math.round(((partsThisMonth - partsLastMonth) / partsLastMonth) * 100) : 100;

  // Pending Requests stats
  const pendingParticipations = participations.filter(p => p.status === 'PENDING');
  const pendingRequests = pendingParticipations.length;
  const pendingLastMonth = pendingParticipations.filter(p => p.joinedAt < lastMonth).length;
  const pendingThisMonth = pendingRequests - pendingLastMonth;
  const pendingRequestsTrend = pendingLastMonth > 0 ? Math.round(((pendingThisMonth - pendingLastMonth) / pendingLastMonth) * 100) : 0;

  // Revenue stats
  let totalRevenue = 0;
  let revenueLastMonth = 0;

  for (const event of events) {
    if (event.isPaid) {
      const parts = approvedParticipations.filter(p => p.status === 'APPROVED'); // Need event mapping
    }
  }

  // Proper revenue calculation
  const approvedPartsWithEvent = await prisma.participation.findMany({
    where: { eventId: { in: eventIds }, status: 'APPROVED' },
    include: { event: { select: { price: true } } },
  });

  for (const p of approvedPartsWithEvent) {
    if (p.event.price) {
      const priceVal = Number(p.event.price);
      totalRevenue += priceVal;
      if (p.joinedAt < lastMonth) {
        revenueLastMonth += priceVal;
      }
    }
  }
  const revenueThisMonth = totalRevenue - revenueLastMonth;
  const totalRevenueTrend = revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : 100;

  return {
    totalEvents,
    totalEventsTrend,
    totalParticipants,
    totalParticipantsTrend,
    totalRevenue,
    totalRevenueTrend,
    pendingRequests,
    pendingRequestsTrend,
  };
}

export async function getParticipantsOverTime(userId: string, startDate?: string, endDate?: string) {
  const events = await prisma.event.findMany({ where: { organizerId: userId }, select: { id: true } });
  const eventIds = events.map(e => e.id);

  const whereClause: any = { eventId: { in: eventIds }, status: 'APPROVED' };
  if (startDate || endDate) {
    whereClause.joinedAt = {};
    if (startDate) whereClause.joinedAt.gte = new Date(startDate);
    if (endDate) whereClause.joinedAt.lte = new Date(endDate);
  }

  const participations = await prisma.participation.findMany({
    where: whereClause,
    select: { joinedAt: true },
    orderBy: { joinedAt: 'asc' },
  });

  const map = new Map<string, number>();
  for (const p of participations) {
    const d = p.joinedAt.toISOString().split('T')[0];
    map.set(d, (map.get(d) || 0) + 1);
  }

  let cumulative = 0;
  const chartData = [];
  for (const [date, count] of map.entries()) {
    cumulative += count;
    chartData.push({ date, participants: cumulative });
  }

  return { chartData };
}

export async function getEventsByCategory(userId: string) {
  const events = await prisma.event.findMany({
    where: { organizerId: userId },
    select: { category: true },
  });

  const map = new Map<string, number>();
  for (const e of events) {
    map.set(e.category, (map.get(e.category) || 0) + 1);
  }

  const categories = Array.from(map.entries()).map(([category, count]) => ({ category, count }));
  return { categories };
}

export async function getAnalyticsMetrics(userId: string) {
  const events = await prisma.event.findMany({ where: { organizerId: userId }, select: { id: true } });
  const eventIds = events.map(e => e.id);

  const reviews = await prisma.review.findMany({
    where: { eventId: { in: eventIds } },
    select: { rating: true },
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

  const participations = await prisma.participation.count({
    where: { eventId: { in: eventIds }, status: 'APPROVED' },
  });

  // Arbitrary engagement rate = (reviews / participants) * 100
  const engagementRate = participations > 0 ? (totalReviews / participations) * 100 : 0;

  return {
    avgRating,
    totalReviews,
    engagementRate,
  };
}
