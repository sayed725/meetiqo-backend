import { prisma } from '../../lib/prisma';

export async function getAdminStats() {
  const [totalUsers, totalEvents] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
  ]);
  const activeSessions = 0; // Session model not in schema

  const participations = await prisma.participation.findMany({
    where: { status: 'APPROVED' },
    include: { event: { select: { price: true } } },
  });

  const totalRevenue = participations.reduce((sum, p) => sum + (p.event.price ? Number(p.event.price) : 0), 0);

  return {
    totalUsers,
    totalEvents,
    totalRevenue,
    activeSessions,
  };
}

export async function getRecentUsers(query: Record<string, any>) {
  const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 10));
  
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
  });

  return { users };
}

export async function getFlaggedEvents() {
  // Assuming a 'reason' or similar isn't in schema, we will just return cancelled events for now as a placeholder
  // A real implementation would have a flag or report model.
  const events = await prisma.event.findMany({
    where: { status: 'CANCELLED' },
    include: { organizer: { select: { name: true } } },
    take: 10,
  });

  return { 
    events: events.map(e => ({
      ...e,
      reason: 'Cancelled by organizer or system',
    }))
  };
}
