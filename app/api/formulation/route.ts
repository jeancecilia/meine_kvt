import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { caseFormulations, hypotheses, therapyGoals } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const formulations = await db.select().from(caseFormulations).orderBy(desc(caseFormulations.createdAt));
    const hypothesisList = await db.select().from(hypotheses).orderBy(desc(hypotheses.confidence));
    const goalsList = await db.select().from(therapyGoals).orderBy(therapyGoals.orderIndex);

    return NextResponse.json({
      formulations,
      hypotheses: hypothesisList,
      goals: goalsList,
    });
  } catch (error: any) {
    console.error('Failed to fetch formulation data:', error);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.type === 'goal') {
      const newGoal = await db.insert(therapyGoals).values({
        id: body.id || `goal-${Date.now()}`,
        orderIndex: body.orderIndex || 1,
        title: body.title,
        description: body.description,
        status: body.status || 'active',
        targetDate: body.targetDate || null,
      }).returning();
      return NextResponse.json(newGoal[0]);
    }

    if (body.type === 'formulation') {
      const newFormulation = await db.insert(caseFormulations).values({
        id: body.id || `form-${Date.now()}`,
        version: body.version || 'v0.2',
        summary: body.summary,
        predisposingFactors: body.predisposingFactors || [],
        triggeringFactors: body.triggeringFactors || [],
        maintainingFactors: body.maintainingFactors || [],
        protectiveFactors: body.protectiveFactors || [],
        workingHypothesesIds: body.workingHypothesesIds || [],
        reviewedAt: new Date(),
      }).returning();
      return NextResponse.json(newFormulation[0]);
    }

    return NextResponse.json({ error: 'Unbekannter Typ' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to save formulation item:', error);
    return NextResponse.json({ error: 'Speichern fehlgeschlagen' }, { status: 500 });
  }
}
