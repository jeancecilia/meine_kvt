import { NextResponse } from 'next/server';
import { client } from '@/lib/db';
import {
  classifyMotiveCheck,
  ensureMotiveCheckStorage,
  getRecentMotiveChecks,
  type MotiveRatings,
} from '@/lib/therapy/motive-checks';

function clampRating(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(10, Math.round(parsed * 2) / 2));
}

function mapRow(row: any) {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    triggerSituation: row.trigger_situation,
    mood: Number(row.mood),
    libido: Number(row.libido),
    connectionNeed: Number(row.connection_need),
    loneliness: Number(row.loneliness),
    noveltyDrive: Number(row.novelty_drive),
    validationNeed: Number(row.validation_need),
    datingRelationshipNeed: Number(row.dating_relationship_need),
    boredomDistraction: Number(row.boredom_distraction),
    topMotive: row.top_motive,
    classificationLabel: row.classification_label,
    experimentRecommended: Boolean(row.experiment_recommended),
    status: row.status,
    experimentObservationId: row.experiment_observation_id,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const rows = await getRecentMotiveChecks(30);
    return NextResponse.json(rows.map(mapRow));
  } catch (error: any) {
    console.error('Motive checks GET error:', error);
    return NextResponse.json({ error: 'Motivchecks konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureMotiveCheckStorage();
    const body = await request.json();

    const ratings: MotiveRatings = {
      mood: clampRating(body.mood),
      libido: clampRating(body.libido),
      connectionNeed: clampRating(body.connectionNeed),
      loneliness: clampRating(body.loneliness),
      noveltyDrive: clampRating(body.noveltyDrive),
      validationNeed: clampRating(body.validationNeed),
      datingRelationshipNeed: clampRating(body.datingRelationshipNeed),
      boredomDistraction: clampRating(body.boredomDistraction),
    };

    const classification = classifyMotiveCheck(ratings);
    const status = classification.experimentRecommended ? 'experiment_pending' : 'logged';
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();

    const rows = await client`
      INSERT INTO motive_checks (
        occurred_at, trigger_situation, mood, libido, connection_need, loneliness,
        novelty_drive, validation_need, dating_relationship_need, boredom_distraction,
        top_motive, classification_label, experiment_recommended, status, note
      ) VALUES (
        ${occurredAt}, ${body.triggerSituation || null}, ${ratings.mood}, ${ratings.libido},
        ${ratings.connectionNeed}, ${ratings.loneliness}, ${ratings.noveltyDrive},
        ${ratings.validationNeed}, ${ratings.datingRelationshipNeed}, ${ratings.boredomDistraction},
        ${classification.topMotive}, ${classification.label}, ${classification.experimentRecommended},
        ${status}, ${body.note || null}
      )
      RETURNING *
    `;

    return NextResponse.json({
      check: mapRow(rows[0]),
      classification,
    });
  } catch (error: any) {
    console.error('Motive checks POST error:', error);
    return NextResponse.json({ error: 'Motivcheck konnte nicht gespeichert werden' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureMotiveCheckStorage();
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'id ist erforderlich' }, { status: 400 });
    }

    const allowedStatus = ['logged', 'experiment_pending', 'completed', 'skipped'];
    const status = allowedStatus.includes(body.status) ? body.status : 'completed';

    const rows = await client`
      UPDATE motive_checks
      SET status = ${status},
          experiment_observation_id = COALESCE(${body.experimentObservationId || null}::uuid, experiment_observation_id),
          note = COALESCE(${body.note || null}, note)
      WHERE id = ${body.id}::uuid
      RETURNING *
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: 'Motivcheck nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(mapRow(rows[0]));
  } catch (error: any) {
    console.error('Motive checks PATCH error:', error);
    return NextResponse.json({ error: 'Motivcheck konnte nicht aktualisiert werden' }, { status: 500 });
  }
}
