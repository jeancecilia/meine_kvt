import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { experimentObservations } from '@/lib/db/schema';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const newObs = await db.insert(experimentObservations).values({
      experimentId: id,
      observedAt: body.observedAt ? new Date(body.observedAt) : new Date(),
      triggerSituation: body.triggerSituation || null,
      moodBefore: body.moodBefore !== undefined && body.moodBefore !== null ? String(body.moodBefore) : null,
      moodAfter: body.moodAfter !== undefined && body.moodAfter !== null ? String(body.moodAfter) : null,
      lonelinessBefore: String(body.lonelinessBefore),
      lonelinessAfter: body.lonelinessAfter !== undefined && body.lonelinessAfter !== null ? String(body.lonelinessAfter) : null,
      connectionNeedBefore: String(body.connectionNeedBefore),
      connectionNeedAfter: body.connectionNeedAfter !== undefined && body.connectionNeedAfter !== null ? String(body.connectionNeedAfter) : null,
      romanticSexualNeedBefore: String(body.romanticSexualNeedBefore),
      romanticSexualNeedAfter: body.romanticSexualNeedAfter !== undefined && body.romanticSexualNeedAfter !== null ? String(body.romanticSexualNeedAfter) : null,
      noveltyDriveBefore: String(body.noveltyDriveBefore),
      noveltyDriveAfter: body.noveltyDriveAfter !== undefined && body.noveltyDriveAfter !== null ? String(body.noveltyDriveAfter) : null,
      actionTaken: body.actionTaken || null,
      note: body.note || null,
    }).returning();

    return NextResponse.json(newObs[0]);
  } catch (error: any) {
    console.error('Failed to save observation:', error);
    return NextResponse.json({ error: 'Beobachtung konnte nicht gespeichert werden' }, { status: 500 });
  }
}
