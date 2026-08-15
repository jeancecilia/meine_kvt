import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { treatmentPlans, treatmentPhases, treatmentModules, treatmentPlanReviews } from '@/lib/db/schema';
import { asc, desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const plans = await db
      .select()
      .from(treatmentPlans)
      .orderBy(desc(treatmentPlans.createdAt))
      .catch(() => []);

    const plan = plans.find((item) => item.status === 'active') || plans[0] || null;
    if (!plan) return NextResponse.json({ plan: null, phases: [], modules: [], reviews: [] });

    const phases = await db
      .select()
      .from(treatmentPhases)
      .where(eq(treatmentPhases.treatmentPlanId, plan.id))
      .orderBy(asc(treatmentPhases.phaseNumber));

    const modules = await db.select().from(treatmentModules).orderBy(asc(treatmentModules.orderIndex));
    const phaseIds = new Set(phases.map((phase) => phase.id));

    const reviews = await db
      .select()
      .from(treatmentPlanReviews)
      .where(eq(treatmentPlanReviews.treatmentPlanId, plan.id))
      .orderBy(desc(treatmentPlanReviews.reviewedAt));

    return NextResponse.json({
      plan,
      phases,
      modules: modules.filter((module) => phaseIds.has(module.phaseId)),
      reviews,
    });
  } catch (error: any) {
    console.error('Treatment plan GET error:', error);
    return NextResponse.json({ error: 'Therapieplan konnte nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { treatmentPlanId, progressSummary } = body;

    if (!treatmentPlanId || !progressSummary) {
      return NextResponse.json({ error: 'treatmentPlanId und progressSummary sind erforderlich' }, { status: 400 });
    }

    const review = await db.insert(treatmentPlanReviews).values({
      treatmentPlanId,
      progressSummary,
      whatWorked: body.whatWorked || [],
      whatDidNotWork: body.whatDidNotWork || [],
      hypothesisChanges: body.hypothesisChanges || [],
      recommendedChanges: body.recommendedChanges || [],
      nextReviewAt: body.nextReviewAt || null,
    }).returning();

    if (body.nextReviewAt) {
      await db.update(treatmentPlans)
        .set({ reviewDueAt: body.nextReviewAt })
        .where(eq(treatmentPlans.id, treatmentPlanId));
    }

    return NextResponse.json(review[0]);
  } catch (error: any) {
    console.error('Treatment plan review error:', error);
    return NextResponse.json({ error: 'Therapieplan-Review konnte nicht gespeichert werden' }, { status: 500 });
  }
}
