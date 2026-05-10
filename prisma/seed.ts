import { PrismaClient, Category, EventType, EventStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('demo123', 10);

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@meetiqo.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@meetiqo.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@meetiqo.com' },
    update: {},
    create: {
      name: 'Sarah Chen',
      email: 'organizer@meetiqo.com',
      password: hashedPassword,
      role: UserRole.ORGANIZER,
      isVerified: true,
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@meetiqo.com' },
    update: {},
    create: {
      name: 'Alex Johnson',
      email: 'user@meetiqo.com',
      password: hashedPassword,
      role: UserRole.USER,
      isVerified: true,
    },
  });

  console.log(`Created users: ${admin.name}, ${organizer.name}, ${regularUser.name}`);

  // Create events
  const events = [
    {
      title: 'Tech Startup Networking Night',
      slug: 'tech-startup-networking-night',
      description:
        'An evening of networking with founders, investors, and tech enthusiasts. Meet potential co-founders, investors, and mentors in a relaxed atmosphere with drinks and snacks.\n\nWhat to bring:\n- Business cards\n- Your elevator pitch\n- An open mind',
      category: Category.TECH,
      type: EventType.PUBLIC,
      status: EventStatus.PUBLISHED,
      location: 'WeWork Downtown, San Francisco, CA',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      price: 0,
      isPaid: false,
      maxParticipants: 80,
      organizerId: organizer.id,
    },
    {
      title: 'AI & Machine Learning Workshop',
      slug: 'ai-ml-workshop-2025',
      description:
        'Hands-on workshop covering the latest in LLMs, computer vision, and MLOps. Build a working prototype by the end of the day.\n\nPrerequisites:\n- Basic Python knowledge\n- Laptop with Python installed\n- Curiosity about AI',
      category: Category.EDUCATION,
      type: EventType.PUBLIC,
      status: EventStatus.PUBLISHED,
      location: 'TechHub Campus, Austin, TX',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      price: 49.99,
      isPaid: true,
      maxParticipants: 40,
      organizerId: organizer.id,
    },
    {
      title: 'Indie Music Festival: Spring Edition',
      slug: 'indie-music-festival-spring',
      description:
        'A day-long outdoor festival featuring 15+ indie bands across 3 stages. Food trucks, craft vendors, and good vibes.\n\nLineup includes local favorites and touring acts. All ages welcome.',
      category: Category.MUSIC,
      type: EventType.PUBLIC,
      status: EventStatus.PUBLISHED,
      location: 'Zilker Park, Austin, TX',
      startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      price: 25,
      isPaid: true,
      maxParticipants: 500,
      organizerId: organizer.id,
    },
    {
      title: 'Business Strategy Bootcamp',
      slug: 'business-strategy-bootcamp',
      description:
        'Intensive 2-day bootcamp for founders and product leaders. Learn go-to-market strategy, pricing models, and growth tactics from industry veterans.\n\nIncludes workbook, meals, and 1:1 office hours.',
      category: Category.BUSINESS,
      type: EventType.PRIVATE,
      status: EventStatus.PUBLISHED,
      location: 'The Hub Coworking, New York, NY',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      price: 199,
      isPaid: true,
      maxParticipants: 25,
      organizerId: organizer.id,
    },
    {
      title: 'Morning Yoga & Wellness Retreat',
      slug: 'morning-yoga-wellness-retreat',
      description:
        'Start your day with a guided yoga session followed by a healthy brunch. Perfect for beginners and experienced practitioners alike.\n\nBring your own mat or rent one on-site.',
      category: Category.HEALTH,
      type: EventType.PUBLIC,
      status: EventStatus.PUBLISHED,
      location: 'Sunrise Park, Denver, CO',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      price: 15,
      isPaid: true,
      maxParticipants: 30,
      organizerId: organizer.id,
    },
    {
      title: 'Basketball Tournament: Community League',
      slug: 'bball-tournament-community',
      description:
        '3-on-3 community basketball tournament. Teams of 3-5 players. Prizes for winners and MVP.\n\nRegistration includes jersey, refreshments, and entry to the afterparty.',
      category: Category.SPORTS,
      type: EventType.PUBLIC,
      status: EventStatus.PUBLISHED,
      location: 'Community Center Gym, Chicago, IL',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      price: 10,
      isPaid: true,
      maxParticipants: 60,
      organizerId: organizer.id,
    },
    {
      title: 'Digital Art Exhibition: Future Visions',
      slug: 'digital-art-exhibition-future',
      description:
        'Explore immersive digital art installations from 20 emerging artists. VR experiences, projection mapping, and interactive displays.\n\nOpening night includes artist talks and a cocktail reception.',
      category: Category.ART,
      type: EventType.PUBLIC,
      status: EventStatus.PUBLISHED,
      location: 'Modern Gallery, Los Angeles, CA',
      startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
      price: 18,
      isPaid: true,
      maxParticipants: 200,
      organizerId: organizer.id,
    },
    {
      title: 'Community Potluck & Social Mixer',
      slug: 'community-potluck-mixer',
      description:
        'Bring a dish to share and meet your neighbors! A casual evening of food, conversation, and community building.\n\nWe will provide plates, utensils, and non-alcoholic beverages. Feel free to bring your favorite homemade dish or a store-bought treat.',
      category: Category.SOCIAL,
      type: EventType.PUBLIC,
      status: EventStatus.PUBLISHED,
      location: 'Riverside Community Hall, Portland, OR',
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      price: 0,
      isPaid: false,
      maxParticipants: 50,
      organizerId: organizer.id,
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: {},
      create: event,
    });
  }

  console.log(`Created ${events.length} events`);

  // Create a participation for the regular user in one event
  const networkingEvent = await prisma.event.findUnique({
    where: { slug: 'tech-startup-networking-night' },
  });

  if (networkingEvent) {
    await prisma.participation.upsert({
      where: {
        userId_eventId: { userId: regularUser.id, eventId: networkingEvent.id },
      },
      update: {},
      create: {
        userId: regularUser.id,
        eventId: networkingEvent.id,
        status: 'APPROVED',
        role: 'ATTENDEE',
      },
    });
    console.log(`Added ${regularUser.name} to ${networkingEvent.title}`);
  }

  // Create a review
  if (networkingEvent) {
    await prisma.review.upsert({
      where: {
        userId_eventId: { userId: regularUser.id, eventId: networkingEvent.id },
      },
      update: {},
      create: {
        userId: regularUser.id,
        eventId: networkingEvent.id,
        rating: 5,
        comment: 'Great networking event! Met some amazing people and the venue was perfect.',
      },
    });
    console.log(`Created review for ${networkingEvent.title}`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
