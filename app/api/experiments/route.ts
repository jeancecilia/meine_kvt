import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { experiments, experimentObservations, treatmentPlans, treatmentPhases } from '@/lib/db/schema';
import { asc, desc, eq } from 'drizzle-orm';
import { ensureMotiveCheckStorage } from '@/lib/therapy/motive-checks';

export async function GET() {
  try {
    await ensureMotiveCheckStorage();
    const list = await db.select().from(experiments).orderBy(desc(experiments.createdAt));
    const observations = await db.select().from(experimentObservations).orderBy(desc(experimentObservations.observedAt));

    return NextResponse.json(list.map((exp) => ({
      ...exp,
      observations: observations.filter((obs) => obs.experimentId === exp.id),
    })));
  } catch (error: any) {
    console.error('Failed to fetch experiments:', error);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureMotiveCheckStorage();
    const body = await request.json();

    const plans = await db.select().from(treatmentPlans).where(eq(treatmentPlans.status, 'active')).limit(1).catch(() => []);
    const activePlan = plans[0] || null;

    let activePhase: any = null;
    if (activePlan) {
      const phases = await db
        .select()
        .from(treatmentPhases)
        .where(eq(treatmentPhases.treatmentPlanId, activePlan.id))
        .orderBy(asc(treatmentPhases.phaseNumber))
        .catch(() => []);
      activePhase = phases.find((phase) => phase.status === 'active') || null;
    }

    const newExp = await db.insert(experiments).values({
      id: body.id || `exp-${Date.now()}`,
      treatmentPlanId: body.treatmentPlanId || activePlan?.id || null,
      treatmentPhaseId: body.treatmentPhaseId || activePhase?.id || null,
      title: body.title,
      hypothesis: body.hypothesis,
      prediction: body.prediction,
      instructions: body.instructions || null,
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      endDate: body.endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: body.status || 'active',
    }).returning();

    return NextResponse.json(newExp[0]);
  } catch (error: any) {
    console.error('Failed to save experiment:', error);
    return NextResponse.json({ error: 'Experiment konnte nicht gespeichert werden' }, { status: 500 });
  }
}
