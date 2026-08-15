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
      observedAt: body.observedAt || new Date().toISOString(),
      triggerSituation: body.triggerSituation || null,
      lonelinessBefore: parseFloat(body.lonelinessBefore),
      lonelinessAfter: body.lonelinessAfter !== undefined && body.lonelinessAfter !== null ? parseFloat(body.lonelinessAfter) : null,
      connectionNeedBefore: parseFloat(body.connectionNeedBefore),
      connectionNeedAfter: body.connectionNeedAfter !== undefined && body.connectionNeedAfter !== null ? parseFloat(body.connectionNeedAfter) : null,
      romanticSexualNeedBefore: parseFloat(body.romanticSexualNeedBefore),
      romanticSexualNeedAfter: body.romanticSexualNeedAfter !== undefined && body.romanticSexualNeedAfter !== null ? parseFloat(body.romanticSexualNeedAfter) : null,
      noveltyDriveBefore: parseFloat(body.noveltyDriveBefore),
      noveltyDriveAfter: body.noveltyDriveAfter !== undefined && body.noveltyDriveAfter !== null ? parseFloat(body.noveltyDriveAfter) : null,
      actionTaken: body.actionTaken || null,
      note: body.note || null,
    }).returning();

    return NextResponse.json(newObs[0]);
  } catch (error) {
    console.error('Failed to save observation:', error);
    return NextResponse.json({ error: 'Beobachtung konnte nicht gespeichert werden' }, { status: 500 });
  }
}
