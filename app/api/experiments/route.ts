import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { experiments, experimentObservations } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db.select().from(experiments).orderBy(desc(experiments.createdAt));
    const observations = await db.select().from(experimentObservations).orderBy(desc(experimentObservations.observedAt));
    
    // Group observations by experiment
    const expWithObs = list.map((exp) => ({
      ...exp,
      observations: observations.filter((obs) => obs.experimentId === exp.id),
    }));

    return NextResponse.json(expWithObs);
  } catch (error) {
    console.error('Failed to fetch experiments:', error);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newExp = await db.insert(experiments).values({
      title: body.title,
      hypothesis: body.hypothesis,
      prediction: body.prediction,
      instructions: body.instructions || null,
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      endDate: body.endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: body.status || 'active',
    }).returning();

    return NextResponse.json(newExp[0]);
  } catch (error) {
    console.error('Failed to save experiment:', error);
    return NextResponse.json({ error: 'Experiment konnte nicht gespeichert werden' }, { status: 500 });
  }
}
