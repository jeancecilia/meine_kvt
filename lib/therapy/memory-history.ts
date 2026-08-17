import { createHash } from 'node:crypto';
import { client, ensureDatabaseReady } from '@/lib/db';
import { ensureTherapeuticMemoryStorage } from '@/lib/therapy/memory';

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 20);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function clamp01(value: unknown, fallback = 0.5): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : fallback;
}

function localDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function ensureHistoryStorage(): Promise<void> {
  await ensureDatabaseReady();
  await ensureTherapeuticMemoryStorage();
  await client`
    CREATE TABLE IF NOT EXISTS hypothesis_revisions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      revision_key TEXT NOT NULL UNIQUE,
      hypothesis_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      confidence NUMERIC(3,2) NOT NULL,
      status TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'state_snapshot',
      source_id TEXT,
      recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `;
  await client`CREATE INDEX IF NOT EXISTS hypothesis_revisions_hypothesis_idx ON hypothesis_revisions(hypothesis_id, recorded_at DESC)`;
}

export async function syncHypothesisHistory(): Promise<void> {
  await ensureHistoryStorage();
  const hypotheses = await client`
    SELECT id, title, description, confidence, status, updated_at
    FROM hypotheses
    ORDER BY updated_at ASC
  `;

  for (const hypothesis of hypotheses) {
    const fingerprint = hash(JSON.stringify({
      title: hypothesis.title,
      description: hypothesis.description,
      confidence: String(hypothesis.confidence),
      status: hypothesis.status,
    }));
    const revisionKey = `${hypothesis.id}:${fingerprint}`;

    const inserted = await client`
      INSERT INTO hypothesis_revisions (
        revision_key, hypothesis_id, title, description, confidence, status,
        source_type, source_id, recorded_at
      ) VALUES (
        ${revisionKey},
        ${hypothesis.id},
        ${hypothesis.title},
        ${hypothesis.description},
        ${clamp01(hypothesis.confidence)},
        ${hypothesis.status},
        'hypothesis_state',
        ${hypothesis.id},
        COALESCE(${hypothesis.updated_at}, NOW())
      )
      ON CONFLICT (revision_key) DO NOTHING
      RETURNING id::text
    `;

    // Only create a new history-memory when the actual hypothesis state changed.
    if (!inserted.length) continue;

    await client`
      INSERT INTO therapeutic_memories (
        memory_key, memory_type, title, content, domains, importance, confidence,
        status, occurred_at, source_type, source_id, source_label, updated_at
      ) VALUES (
        ${`hypothesis-history:${revisionKey}`},
        'hypothesis_history',
        ${`Historischer Hypothesenstand: ${hypothesis.title}`},
        ${`Beschreibung: ${hypothesis.description}\nDamals dokumentiertes Arbeitsvertrauen: ${Math.round(clamp01(hypothesis.confidence) * 100)}%. Status: ${hypothesis.status}.`},
        '["hypothese","verlauf"]'::jsonb,
        0.48,
        ${clamp01(hypothesis.confidence)},
        'active',
        COALESCE(${hypothesis.updated_at}, NOW()),
        'hypothesis_revision',
        ${revisionKey},
        'Versionierter Hypothesenstand',
        NOW()
      )
      ON CONFLICT (memory_key) DO NOTHING
    `;
  }
}

function trend(first: any, last: any): string[] {
  if (!first || !last || first.date === last.date) return [];
  const dimensions: Array<[string, string, boolean]> = [
    ['Stimmung', 'mood', true],
    ['Erfüllung', 'fulfillment', true],
    ['Einsamkeit', 'loneliness', false],
    ['Innere Ruhe', 'inner_calm', true],
    ['Freude', 'joy', true],
    ['Grübeln', 'rumination', false],
    ['Zukunftsangst', 'future_anxiety', false],
    ['Neuheitsdrang', 'novelty_drive', false],
    ['Energie', 'energy', true],
    ['Lebenszufriedenheit', 'life_satisfaction', true],
  ];
  return dimensions.flatMap(([label, key, positive]) => {
    const from = Number(first[key]);
    const to = Number(last[key]);
    if (!Number.isFinite(from) || !Number.isFinite(to) || Math.abs(to - from) < 0.5) return [];
    const direction = to > from ? 'gestiegen' : 'gesunken';
    const clinicalDirection = (to > from) === positive ? 'günstige Richtung' : 'ungünstige Richtung';
    return [`${label}: ${from.toFixed(1)} → ${to.toFixed(1)} (${direction}; ${clinicalDirection})`];
  });
}

async function syncPhaseSnapshots(referenceDate: Date): Promise<void> {
  await ensureHistoryStorage();
  const profile = await client`SELECT timezone FROM patient_profile ORDER BY created_at ASC LIMIT 1`;
  const timeZone = profile[0]?.timezone || 'Europe/Berlin';
  const today = localDate(referenceDate, timeZone);

  const phases = await client`
    SELECT id, phase_number, title, description, objective, status,
           planned_start, planned_end, actual_start, actual_end
    FROM treatment_phases
    WHERE status IN ('active', 'completed')
    ORDER BY phase_number ASC
  `;

  for (const phase of phases) {
    const start = phase.actual_start || phase.planned_start;
    if (!start || start > today) continue;
    const end = phase.status === 'completed'
      ? (phase.actual_end || phase.planned_end || today)
      : today;

    const sessions = await client`
      SELECT ss.main_issue, ss.key_insight, ss.follow_up_topics, ss.created_at
      FROM session_summaries ss
      JOIN therapy_sessions ts ON ts.id = ss.session_id
      WHERE ts.treatment_phase_id = ${phase.id}
      ORDER BY ss.created_at ASC
    `;
    const checkins = await client`
      SELECT date, mood, fulfillment, loneliness, inner_calm, joy, rumination,
             future_anxiety, novelty_drive, energy, life_satisfaction
      FROM daily_checkins
      WHERE date BETWEEN ${start} AND ${end}
      ORDER BY date ASC
    `;
    const memories = await client`
      SELECT memory_key, title, content, importance
      FROM therapeutic_memories
      WHERE status = 'active'
        AND memory_type <> 'hypothesis_history'
        AND COALESCE(occurred_at, created_at)::date BETWEEN ${start}::date AND ${end}::date
      ORDER BY importance DESC
      LIMIT 20
    `;

    const insights = sessions.map((session) => session.key_insight).filter(Boolean) as string[];
    const openQuestions = sessions
      .flatMap((session) => asStringArray(session.follow_up_topics))
      .slice(-8);
    const trends = trend(checkins[0], checkins[checkins.length - 1]);
    const keyChanges = [...trends, ...insights.slice(-5)].slice(0, 10);
    const stablePatterns = memories
      .slice(0, 6)
      .map((memory) => `${memory.title}: ${memory.content}`);
    const sourceCount = sessions.length + checkins.length + memories.length;

    const summaryParts = [
      `Phase ${phase.phase_number} – ${phase.title} (${phase.status}).`,
      `Therapeutisches Ziel: ${phase.objective}`,
      sessions.length ? `${sessions.length} strukturierte Sitzung(en) in dieser Phase.` : 'Noch keine strukturierte Sitzung mit dieser Phase verknüpft.',
      checkins.length ? `${checkins.length} Check-in(s) im Phasenzeitraum.` : 'Noch keine Check-ins im Phasenzeitraum.',
      insights.length ? `Jüngste Erkenntnis: ${insights[insights.length - 1]}` : null,
    ].filter(Boolean);

    await client`
      INSERT INTO memory_consolidations (
        period_key, period_type, period_start, period_end, title, summary,
        key_changes, stable_patterns, open_questions, important_memory_keys,
        source_count, updated_at
      ) VALUES (
        ${`phase:${phase.id}`},
        'phase',
        ${start},
        ${end},
        ${`Phasen-Snapshot: Phase ${phase.phase_number} – ${phase.title}`},
        ${summaryParts.join(' ')},
        ${JSON.stringify(keyChanges)}::jsonb,
        ${JSON.stringify(stablePatterns)}::jsonb,
        ${JSON.stringify(openQuestions)}::jsonb,
        ${JSON.stringify(memories.slice(0, 12).map((memory) => memory.memory_key))}::jsonb,
        ${sourceCount},
        NOW()
      )
      ON CONFLICT (period_key) DO UPDATE SET
        period_end = EXCLUDED.period_end,
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        key_changes = EXCLUDED.key_changes,
        stable_patterns = EXCLUDED.stable_patterns,
        open_questions = EXCLUDED.open_questions,
        important_memory_keys = EXCLUDED.important_memory_keys,
        source_count = EXCLUDED.source_count,
        updated_at = NOW()
    `;
  }
}

export async function syncLongitudinalHistory(referenceDate = new Date()): Promise<void> {
  await syncHypothesisHistory();
  await syncPhaseSnapshots(referenceDate);
}
