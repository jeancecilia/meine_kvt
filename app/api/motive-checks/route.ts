import { NextRequest, NextResponse } from 'next/server';
import { client, db, ensureDatabaseReady } from '@/lib/db';
import { experimentObservations, motiveChecks } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export const revalidate = 0;

type MotiveKey =
  | 'sexual'
  | 'connection_loneliness'
  | 'novelty_validation'
  | 'dating_relationship'
  | 'boredom'
  | 'mixed';

const motiveLabels: Record<MotiveKey, string> = {
  sexual: 'Sex / Libido',
  connection_loneliness: 'Verbundenheit / Einsamkeitsregulation',
  novelty_validation: 'Neuheit / Bestätigung',
  dating_relationship: 'Dating / Beziehung',
  boredom: 'Langeweile / Ablenkung',
  mixed: 'Gemischte Motivation',
};

function rating(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(10, Math.round(parsed * 2) / 2));
}

async function ensureMotiveExperimentStorage() {
  await ensureDatabaseReady();
  await client`
    CREATE TABLE IF NOT EXISTS motive_check_experiments (
      motive_check_id UUID PRIMARY KEY REFERENCES motive_checks(id) ON DELETE CASCADE,
      trigger_situation TEXT,
      mood_before NUMERIC(3,1) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      experiment_observation_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      completed_at TIMESTAMPTZ
    )
  `;
  await client`CREATE INDEX IF NOT EXISTS motive_check_experiments_status_idx ON motive_check_experiments (status)`;

  // Keep the active Phase-1 module wording aligned with the refined functional analysis.
  await client`
    UPDATE treatment_modules
    SET title = 'Motive Decomposition',
        description = 'Dating-App-Impulse nach Funktion unterscheiden: Libido, Verbundenheit/Einsamkeit, Neuheit, Bestätigung, echtes Dating-/Beziehungsinteresse und Langeweile. Nur relevante Einsamkeit/Verbundenheit löst Experiment 001 aus.'
    WHERE id = 'm1-1'
  `;
}

function classifyMotives(input: {
  libido: number;
  connection: number;
  loneliness: number;
  novelty: number;
  validation: number;
  datingIntent: number;
  boredom: number;
}) {
  const scored: Array<[Exclude<MotiveKey, 'mixed'>, number]> = [
    ['sexual', input.libido],
    ['connection_loneliness', Math.max(input.connection, input.loneliness)],
    ['novelty_validation', Math.max(input.novelty, input.validation)],
    ['dating_relationship', input.datingIntent],
    ['boredom', input.boredom],
  ];
  scored.sort((a, b) => b[1] - a[1]);

  const [first, second] = scored;
  const mixed = first[1] >= 5 && second[1] >= 5 && first[1] - second[1] <= 1;
  const dominantMotive: MotiveKey = first[1] < 5 || mixed ? 'mixed' : first[0];
  const experimentTriggered = input.loneliness >= 5 || input.connection >= 5;

  const topDescription = mixed
    ? `${motiveLabels[first[0]]} (${first[1]}/10) und ${motiveLabels[second[0]]} (${second[1]}/10) sind gleichzeitig stark.`
    : first[1] < 5
      ? `Kein einzelnes Motiv ist stark ausgeprägt; höchster Wert ist ${motiveLabels[first[0]]} mit ${first[1]}/10.`
      : `Aktuell stärkstes Motiv: ${motiveLabels[first[0]]} (${first[1]}/10).`;

  let feedbackMessage = topDescription;
  if (experimentTriggered) {
    feedbackMessage += ` Gleichzeitig ist Einsamkeit (${input.loneliness}/10) oder Verbundenheitsbedarf (${input.connection}/10) relevant. Deshalb wird Experiment 001 angeboten, um genau diesen Anteil zu testen. Libido, Dating-Interesse oder Neuheitsdrang dürfen dabei selbstverständlich bestehen bleiben.`;
  } else if (dominantMotive === 'sexual') {
    feedbackMessage += ' Einsamkeit und Verbundenheitsbedarf liegen unter 5/10: kein therapeutischer Eingriff nötig; der sexuelle Impuls wird nur als normaler Motiv-Snapshot protokolliert.';
  } else if (dominantMotive === 'dating_relationship') {
    feedbackMessage += ' Das spricht aktuell eher für echtes Kennenlern-/Dating-Interesse als für Einsamkeitsregulation; kein Connection-Experiment nötig.';
  } else {
    feedbackMessage += ' Einsamkeit und Verbundenheitsbedarf liegen unter dem Experiment-Schwellenwert; der Snapshot wird nur als Evidenz gespeichert.';
  }

  return { dominantMotive, experimentTriggered, feedbackMessage };
}

export async function GET() {
  try {
    await ensureMotiveExperimentStorage();

    const items = await db
      .select()
      .from(motiveChecks)
      .orderBy(desc(motiveChecks.occurredAt))
      .limit(50);

    const pendingRows = await client`
      SELECT motive_check_id, trigger_situation, mood_before, status, experiment_observation_id, created_at, completed_at
      FROM motive_check_experiments
      ORDER BY created_at DESC
    `;
    const experimentByCheck = new Map(pendingRows.map((row: any) => [String(row.motive_check_id), row]));

    const totalCount = items.length;
    const distribution: Record<string, number> = {
      sexual: 0,
      connection_loneliness: 0,
      novelty_validation: 0,
      dating_relationship: 0,
      boredom: 0,
      mixed: 0,
    };

    const enrichedItems = items.map((item) => {
      const motive = (item.dominantMotive || 'mixed') as MotiveKey;
      distribution[motive] = (distribution[motive] || 0) + 1;
      const experiment = experimentByCheck.get(String(item.id));
      return {
        ...item,
        experimentStatus: experiment?.status || null,
        triggerSituation: experiment?.trigger_situation || null,
        moodBefore: experiment?.mood_before !== undefined ? Number(experiment.mood_before) : null,
        experimentObservationId: experiment?.experiment_observation_id || null,
      };
    });

    return NextResponse.json({
      items: enrichedItems,
      totalCount,
      distribution,
      sampleTarget: 20,
      pendingExperiments: enrichedItems.filter((item) => item.experimentStatus === 'pending'),
    });
  } catch (error: any) {
    console.error('Error fetching motive checks:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch motive checks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureMotiveExperimentStorage();

    const body = await req.json();
    const libido = rating(body.libido);
    const connection = rating(body.connection);
    const loneliness = rating(body.loneliness);
    const novelty = rating(body.novelty);
    const validation = rating(body.validation);
    const datingIntent = rating(body.datingIntent);
    const boredom = rating(body.boredom);
    const mood = rating(body.mood);
    const appName = body.appName || 'Tinder';
    const triggerSituation = typeof body.triggerSituation === 'string' && body.triggerSituation.trim()
      ? body.triggerSituation.trim()
      : null;
    const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null;

    const { dominantMotive, experimentTriggered, feedbackMessage } = classifyMotives({
      libido,
      connection,
      loneliness,
      novelty,
      validation,
      datingIntent,
      boredom,
    });

    const [created] = await db
      .insert(motiveChecks)
      .values({
        appName,
        libido: libido.toFixed(1),
        connection: connection.toFixed(1),
        loneliness: loneliness.toFixed(1),
        novelty: novelty.toFixed(1),
        validation: validation.toFixed(1),
        datingIntent: datingIntent.toFixed(1),
        boredom: boredom.toFixed(1),
        dominantMotive,
        experimentTriggered: experimentTriggered ? 1 : 0,
        feedbackMessage,
        note: triggerSituation ? `${triggerSituation}${note ? ` — ${note}` : ''}` : note,
      })
      .returning();

    if (experimentTriggered) {
      await client`
        INSERT INTO motive_check_experiments (motive_check_id, trigger_situation, mood_before, status)
        VALUES (${created.id}::uuid, ${triggerSituation}, ${mood}, 'pending')
        ON CONFLICT (motive_check_id) DO UPDATE SET
          trigger_situation = EXCLUDED.trigger_situation,
          mood_before = EXCLUDED.mood_before,
          status = 'pending'
      `;
    }

    return NextResponse.json({
      success: true,
      motiveCheck: {
        ...created,
        triggerSituation,
        moodBefore: mood,
        experimentStatus: experimentTriggered ? 'pending' : null,
      },
      experimentTriggered,
      dominantMotive,
      dominantMotiveLabel: motiveLabels[dominantMotive],
      feedbackMessage,
    });
  } catch (error: any) {
    console.error('Error saving motive check:', error);
    return NextResponse.json({ error: error?.message || 'Failed to save motive check' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureMotiveExperimentStorage();
    const body = await req.json();
    const id = String(body.id || '');
    const action = body.action === 'skip' ? 'skip' : 'complete';
    if (!id) return NextResponse.json({ error: 'id ist erforderlich' }, { status: 400 });

    const [check] = await db.select().from(motiveChecks).where(eq(motiveChecks.id, id)).limit(1);
    if (!check) return NextResponse.json({ error: 'Motivcheck nicht gefunden' }, { status: 404 });

    const pendingRows = await client`
      SELECT * FROM motive_check_experiments WHERE motive_check_id = ${id}::uuid LIMIT 1
    `;
    const pending: any = pendingRows[0];
    if (!pending) return NextResponse.json({ error: 'Kein offenes Experiment für diesen Motivcheck' }, { status: 404 });

    if (action === 'skip') {
      await client`
        UPDATE motive_check_experiments
        SET status = 'skipped', completed_at = NOW()
        WHERE motive_check_id = ${id}::uuid
      `;
      return NextResponse.json({ success: true, status: 'skipped' });
    }

    const moodAfter = rating(body.moodAfter);
    const lonelinessAfter = rating(body.lonelinessAfter);
    const connectionAfter = rating(body.connectionAfter);
    const libidoAfter = rating(body.libidoAfter);
    const noveltyAfter = rating(body.noveltyAfter);
    const actionTaken = typeof body.actionTaken === 'string' && body.actionTaken.trim()
      ? body.actionTaken.trim()
      : '15–30 Min. echte soziale Verbindung hergestellt';
    const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null;

    const [observation] = await db.insert(experimentObservations).values({
      experimentId: 'exp-001',
      triggerSituation: pending.trigger_situation || 'Dating-/Tinder-Impuls',
      moodBefore: String(pending.mood_before),
      moodAfter: String(moodAfter),
      lonelinessBefore: String(check.loneliness),
      lonelinessAfter: String(lonelinessAfter),
      connectionNeedBefore: String(check.connection),
      connectionNeedAfter: String(connectionAfter),
      libidoBefore: String(check.libido),
      libidoAfter: String(libidoAfter),
      romanticSexualNeedBefore: String(check.libido),
      romanticSexualNeedAfter: String(libidoAfter),
      noveltyDriveBefore: String(check.novelty),
      noveltyDriveAfter: String(noveltyAfter),
      actionTaken,
      note: note ? `Motive-Check ${id}: ${note}` : `Motive-Check ${id}`,
    }).returning();

    await client`
      UPDATE motive_check_experiments
      SET status = 'completed', experiment_observation_id = ${observation.id}::uuid, completed_at = NOW()
      WHERE motive_check_id = ${id}::uuid
    `;

    return NextResponse.json({ success: true, status: 'completed', observation });
  } catch (error: any) {
    console.error('Error updating motive check experiment:', error);
    return NextResponse.json({ error: error?.message || 'Motivcheck-Experiment konnte nicht aktualisiert werden' }, { status: 500 });
  }
}
