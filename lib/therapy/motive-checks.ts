import { client, ensureDatabaseReady } from '@/lib/db';

export type MotiveKey =
  | 'libido'
  | 'connection'
  | 'novelty'
  | 'validation'
  | 'dating_relationship'
  | 'boredom_distraction';

export interface MotiveRatings {
  mood: number;
  libido: number;
  connectionNeed: number;
  loneliness: number;
  noveltyDrive: number;
  validationNeed: number;
  datingRelationshipNeed: number;
  boredomDistraction: number;
}

export interface MotiveClassification {
  topMotive: MotiveKey | 'mixed';
  topScore: number;
  connectionRelevant: boolean;
  experimentRecommended: boolean;
  label: string;
  explanation: string;
}

const MOTIVE_LABELS: Record<MotiveKey, string> = {
  libido: 'Libido / Sex',
  connection: 'Verbundenheit',
  novelty: 'Neuheit / Kick',
  validation: 'Bestätigung',
  dating_relationship: 'Dating / Beziehung',
  boredom_distraction: 'Langeweile / Ablenkung',
};

export function classifyMotiveCheck(ratings: MotiveRatings): MotiveClassification {
  const motives: Array<[MotiveKey, number]> = [
    ['libido', ratings.libido],
    ['connection', ratings.connectionNeed],
    ['novelty', ratings.noveltyDrive],
    ['validation', ratings.validationNeed],
    ['dating_relationship', ratings.datingRelationshipNeed],
    ['boredom_distraction', ratings.boredomDistraction],
  ].sort((a, b) => b[1] - a[1]);

  const [first, second] = motives;
  const isMixed = first[1] >= 5 && second[1] >= 5 && first[1] - second[1] <= 1;
  const topMotive: MotiveKey | 'mixed' = isMixed ? 'mixed' : first[0];
  const connectionRelevant = ratings.loneliness >= 5 || ratings.connectionNeed >= 5;

  let label = isMixed ? 'Gemischte Motivation' : MOTIVE_LABELS[first[0]];
  let explanation = isMixed
    ? `Mehrere Motive sind gleichzeitig deutlich ausgeprägt (${MOTIVE_LABELS[first[0]]} ${first[1]}/10, ${MOTIVE_LABELS[second[0]]} ${second[1]}/10).`
    : `${MOTIVE_LABELS[first[0]]} ist im Moment der höchste erfasste Motivwert (${first[1]}/10).`;

  if (connectionRelevant) {
    explanation += ` Einsamkeit (${ratings.loneliness}/10) oder Verbundenheitsbedarf (${ratings.connectionNeed}/10) ist ebenfalls relevant; deshalb kann Experiment 001 sinnvoll getestet werden.`;
  } else {
    explanation += ` Einsamkeit (${ratings.loneliness}/10) und Verbundenheitsbedarf (${ratings.connectionNeed}/10) liegen unter dem Experiment-Schwellenwert; deshalb ist keine Connection-Intervention nötig.`;
  }

  return {
    topMotive,
    topScore: first[1],
    connectionRelevant,
    experimentRecommended: connectionRelevant,
    label,
    explanation,
  };
}

export async function ensureMotiveCheckStorage(): Promise<void> {
  await ensureDatabaseReady();

  await client`
    CREATE TABLE IF NOT EXISTS motive_checks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      trigger_situation TEXT,
      mood NUMERIC(3,1) NOT NULL,
      libido NUMERIC(3,1) NOT NULL,
      connection_need NUMERIC(3,1) NOT NULL,
      loneliness NUMERIC(3,1) NOT NULL,
      novelty_drive NUMERIC(3,1) NOT NULL,
      validation_need NUMERIC(3,1) NOT NULL,
      dating_relationship_need NUMERIC(3,1) NOT NULL,
      boredom_distraction NUMERIC(3,1) NOT NULL,
      top_motive TEXT NOT NULL,
      classification_label TEXT NOT NULL,
      experiment_recommended BOOLEAN NOT NULL DEFAULT FALSE,
      status TEXT NOT NULL DEFAULT 'logged',
      experiment_observation_id UUID,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `;

  await client`CREATE INDEX IF NOT EXISTS motive_checks_occurred_at_idx ON motive_checks (occurred_at DESC)`;
  await client`CREATE INDEX IF NOT EXISTS motive_checks_status_idx ON motive_checks (status)`;

  // Keep the currently active phase and experiment wording aligned with the refined method.
  await client`
    UPDATE treatment_modules
    SET title = 'Motive Decomposition',
        description = 'Bei Dating-/Tinder-Impulsen Libido, Verbundenheit, Einsamkeit, Neuheit, Bestätigung, Dating-/Beziehungsinteresse und Langeweile kurz getrennt erfassen. Nur bei relevanter Einsamkeit/Verbundenheit Experiment 001 auslösen.'
    WHERE id = 'm1-1'
  `;

  await client`
    UPDATE experiments
    SET title = 'Experiment 001 – Motive Decomposition',
        hypothesis = 'Arbeitshypothese: Dating-/Tinder-Impulse können verschiedene Funktionen haben. Einsamkeit bzw. fehlende Verbundenheit ist nur bei einem Teil der Situationen relevant; Libido, Neuheit, Bestätigung, echtes Dating-/Beziehungsinteresse oder Langeweile können unabhängig davon bestehen.',
        prediction = 'Wenn Einsamkeit/Verbundenheit ein relevanter Treiber ist, sollte echte soziale Verbindung diese Komponenten und ggf. den unmittelbaren Suchimpuls reduzieren, während Libido oder andere Motive teilweise stabil bleiben können.',
        instructions = 'Bei einem Dating-/Tinder-Impuls zuerst einen 10-Sekunden-Motivcheck durchführen. Nur wenn Einsamkeit oder Verbundenheitsbedarf >= 5/10 ist: 15–30 Min. echte soziale Verbindung herstellen und danach Stimmung, Einsamkeit, Verbundenheitsbedarf, Libido und Neuheitsdrang erneut bewerten. Bei niedriger Einsamkeit/Verbundenheit wird der Motivcheck nur protokolliert; keine Intervention nötig.'
    WHERE id = 'exp-001'
  `;
}

export async function getRecentMotiveChecks(limit = 20) {
  await ensureMotiveCheckStorage();
  const safeLimit = Math.max(1, Math.min(limit, 100));
  return client`
    SELECT *
    FROM motive_checks
    ORDER BY occurred_at DESC
    LIMIT ${safeLimit}
  `;
}

export function motiveLabel(key: string): string {
  if (key === 'mixed') return 'Gemischt';
  return MOTIVE_LABELS[key as MotiveKey] || key;
}
