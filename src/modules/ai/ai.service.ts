import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { logger } from '../../lib/logger';
import { callGemini } from '../../lib/gemini';
import type { GenerateDescriptionInput, PlanEventInput } from './ai.validation';

async function logAIHistory(
  userId: string,
  featureType: 'DESCRIPTION' | 'RECOMMENDATION' | 'PLANNER' | 'SUMMARIZER',
  input: unknown,
  output: unknown,
  tokensUsed: number
) {
  try {
    await prisma.aIHistory.create({
      data: {
        userId,
        featureType,
        input: input as any,
        output: output as any,
        tokensUsed,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to log AIHistory');
  }
}

export async function generateEventDescription(data: GenerateDescriptionInput, userId: string) {
  const prompt = `
You are an expert event copywriter. Create an engaging event description based on the details below.
Return ONLY a valid JSON object with this exact structure:
{
  "improvedTitle": string,
  "description": string (300-500 words, engaging and persuasive),
  "tags": string[] (exactly 5 relevant tags),
  "suggestedBannerPrompt": string (a detailed prompt for generating a banner image)
}

Event Details:
- Title: ${data.title}
- Category: ${data.category}
- Location: ${data.location}
- Target Audience: ${data.targetAudience}
- Key Points: ${data.keyPoints.join(', ')}
`;

  const raw = await callGemini(prompt);
  const result = JSON.parse(raw);
  await logAIHistory(userId, 'DESCRIPTION', data, result, 1);
  return result;
}

export async function getEventRecommendations(userId: string) {
  const cacheKey = `recs:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info({ userId }, 'Returning cached recommendations');
    return JSON.parse(cached);
  }

  const joinedEvents = await prisma.participation.findMany({
    where: { userId, status: 'APPROVED' },
    take: 5,
    orderBy: { joinedAt: 'desc' },
    include: { event: { select: { category: true } } },
  });

  const userCategories = [...new Set(joinedEvents.map((p) => p.event.category))];

  const userProfile = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const upcomingEvents = await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      startDate: { gte: new Date() },
    },
    take: 20,
    orderBy: { startDate: 'asc' },
    select: {
      id: true,
      title: true,
      category: true,
      location: true,
      startDate: true,
      description: true,
      type: true,
      price: true,
      isPaid: true,
    },
  });

  const prompt = `
You are an event recommendation engine. Based on the user's past activity and available upcoming events, recommend the best events.
Return ONLY a valid JSON object with this exact structure:
{
  "recommendedEventIds": string[] (ordered by relevance, max 5),
  "reasoning": string (brief explanation of why these events were chosen)
}

User Context:
- Name: ${userProfile?.name || 'User'}
- Past event categories: ${userCategories.join(', ') || 'None'}
- Number of past events: ${joinedEvents.length}

Available Upcoming Events:
${upcomingEvents.map((e) => `- ID: ${e.id}, Title: "${e.title}", Category: ${e.category}, Location: ${e.location}, Date: ${e.startDate.toISOString()}, Type: ${e.type}, Price: ${e.isPaid ? '$' + e.price : 'Free'}`).join('\n')}
`;

  const raw = await callGemini(prompt);
  const result = JSON.parse(raw);

  await logAIHistory(userId, 'RECOMMENDATION', { userCategories, upcomingCount: upcomingEvents.length }, result, 1);

  try {
    await redis.setex(cacheKey, 3600, JSON.stringify(result));
  } catch (err) {
    logger.warn({ err }, 'Redis cache write failed');
  }

  return result;
}

export async function planEvent(data: PlanEventInput, userId: string) {
  const prompt = `
You are an expert event planner. Create a detailed event plan based on the details below.
Return ONLY a valid JSON object with this exact structure:
{
  "timeline": [
    { "time": string, "activity": string, "duration": string, "notes": string }
  ],
  "checklistBefore": string[],
  "checklistDuring": string[],
  "checklistAfter": string[],
  "estimatedBudgetBreakdown": {
    "venue": string,
    "catering": string,
    "marketing": string,
    "technology": string,
    "staffing": string,
    "miscellaneous": string,
    "total": string
  }
}

Event Details:
- Title: ${data.title}
- Date: ${data.date}
- Duration: ${data.duration} hours
- Expected Attendees: ${data.expectedAttendees}
- Event Type: ${data.eventType}
- Goals: ${data.goals.join(', ')}
`;

  const raw = await callGemini(prompt);
  const result = JSON.parse(raw);

  await logAIHistory(userId, 'PLANNER', data, result, 1);
  return result;
}

export async function summarizeEventReviews(eventId: string, userId: string) {
  const reviews = await prisma.review.findMany({
    where: { eventId },
    include: { user: { select: { name: true } } },
  });

  if (reviews.length < 3) {
    throw new Error('At least 3 reviews are required');
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const prompt = `
You are a review analyst. Summarize the following event reviews into actionable insights.
Return ONLY a valid JSON object with this exact structure:
{
  "summary": string (concise overview of all reviews),
  "overallSentiment": "POSITIVE" | "MIXED" | "NEGATIVE",
  "keyPraises": string[] (top 3-5 positive points),
  "keyComplaints": string[] (top 3-5 negative points),
  "improvementSuggestions": string[] (3-5 actionable suggestions),
  "averageRating": number (the average rating provided)
}

Average Rating: ${avgRating.toFixed(1)}

Reviews:
${reviews.map((r) => `- Rating: ${r.rating}/5, Comment: "${r.comment || 'No comment'}"`).join('\n')}
`;

  const raw = await callGemini(prompt);
  const result = JSON.parse(raw);
  result.averageRating = avgRating;

  await logAIHistory(userId, 'SUMMARIZER', { eventId, reviewCount: reviews.length }, result, 1);
  return result;
}
