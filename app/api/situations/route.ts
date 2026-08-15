import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { situations } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db.select().from(situations).orderBy(desc(situations.occurredAt));
    return NextResponse.json(list);
  } catch (error) {
    console.error('Failed to fetch situations:', error);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newSituation = await db.insert(situations).values({
      occurredAt: body.occurredAt || new Date().toISOString(),
      title: body.title || 'Situationsanalyse',
      category: body.category || 'Alltag & Emotionen',
      objectiveEvent: body.objectiveEvent || '',
      expectation: body.expectation || '',
      actualFeeling: body.actualFeeling || '',
      emotionRatings: body.emotionRatings ? JSON.stringify(body.emotionRatings) : '{}',
      automaticThoughts: body.automaticThoughts || '',
      behaviorReaction: body.behaviorReaction || '',
      shortTermConsequence: body.shortTermConsequence || '',
      longTermConsequence: body.longTermConsequence || '',
      aiAnalysis: body.aiAnalysis || null,
    }).returning();

    return NextResponse.json(newSituation[0]);
  } catch (error) {
    console.error('Failed to save situation:', error);
    return NextResponse.json({ error: 'Situation konnte nicht gespeichert werden' }, { status: 500 });
  }
}
