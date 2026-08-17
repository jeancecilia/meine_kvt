import { client, ensureDatabaseReady } from '@/lib/db';

export async function ensureSocialExposureStorage(): Promise<void> {
  await ensureDatabaseReady();

  await client`
    CREATE TABLE IF NOT EXISTS social_exposure_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      context TEXT,
      target_type TEXT NOT NULL DEFAULT 'other',
      purposes JSONB NOT NULL DEFAULT '[]'::jsonb,
      fear_prediction TEXT,
      social_anxiety_before NUMERIC(3,1) NOT NULL,
      expected_rejection_before NUMERIC(3,1) NOT NULL,
      avoidance_urge_before NUMERIC(3,1) NOT NULL,
      pressure_to_approach_before NUMERIC(3,1) NOT NULL,
      choice_freedom_before NUMERIC(3,1) NOT NULL,
      performed BOOLEAN NOT NULL DEFAULT TRUE,
      action_description TEXT,
      people_approached INTEGER NOT NULL DEFAULT 0,
      safety_behaviors TEXT,
      social_anxiety_after NUMERIC(3,1),
      actual_outcome TEXT,
      outcome_details TEXT,
      choice_freedom_after NUMERIC(3,1),
      learning TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `;

  await client`CREATE INDEX IF NOT EXISTS social_exposure_logs_occurred_at_idx ON social_exposure_logs (occurred_at DESC)`;

  await client`
    INSERT INTO treatment_modules (id, phase_id, type, title, description, status, order_index)
    SELECT
      'm1-4',
      'phase-1-reward',
      'cbt',
      'Soziale Exposition / Annäherungsverhalten',
      'Reales Ansprechen von Menschen funktional getrennt von Dating-App-Nutzung betrachten. Es kann bewusstes Expositions-/Annäherungsverhalten bei früherer sozialer Angst sein. Angst, Vermeidung, Befürchtung, Sicherheitsverhalten, tatsächliches Ergebnis und Wahlfreiheit beobachten.',
      'active',
      4
    WHERE EXISTS (SELECT 1 FROM treatment_phases WHERE id = 'phase-1-reward')
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      order_index = EXCLUDED.order_index
  `;

  // New anamnesis information becomes formulation v0.2 instead of silently
  // overwriting v0.1. The social-anxiety history remains explicitly provisional
  // until the focused session clarifies severity and remaining avoidance.
  await client`
    INSERT INTO case_formulations (
      id, version, summary, predisposing_factors, triggering_factors,
      maintaining_factors, protective_factors, working_hypotheses_ids,
      reviewed_at, created_at
    )
    SELECT
      'form-v0.2',
      'v0.2',
      'Arbeitsmodell v0.2: frühere depressive Vulnerabilität bei erhaltenem Antrieb, aktuell niedriger positiver Affekt und Erfüllung sowie relevante Einsamkeit. Bereichsübergreifendes Novelty-/Habituationsmuster bei bekanntem ADHS und die Bewertung „ich müsste glücklicher sein“ bleiben empirisch zu prüfende Mechanismen. Zusätzlich berichtet der Patient historische Züge sozialer Angst/sozialer Hemmung und seit etwa einem Jahr bewusstes, eigeninitiiertes Aufsuchen sozialer Situationen sowie aktives Ansprechen fremder Menschen mit subjektiv deutlichem Nutzen. Reales Ansprechen darf daher nicht aus dem Verhalten allein als Einsamkeits- oder Neuheitsregulation interpretiert werden; es kann adaptives Expositions-/Annäherungsverhalten sein. Ausmaß und aktuelle Restrelevanz sozialer Angst werden in einer fokussierten Sitzung weiter geklärt.',
      COALESCE(predisposing_factors, '[]'::jsonb) || '["Historisch berichtete Züge sozialer Angst/sozialer Hemmung; genaue Ausprägung und aktuelle Restrelevanz noch zu klären"]'::jsonb,
      triggering_factors,
      maintaining_factors,
      COALESCE(protective_factors, '[]'::jsonb) || '["Seit etwa einem Jahr eigeninitiierte soziale Exposition/Annäherungsverhalten mit subjektiv deutlichem Nutzen", "Hohe Bereitschaft, trotz Unbehagen reale Verhaltensexperimente und Exposition durchzuführen"]'::jsonb,
      working_hypotheses_ids,
      NOW(),
      NOW()
    FROM case_formulations
    WHERE id = 'form-v0.1'
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function getRecentSocialExposureLogs(limit = 10) {
  await ensureSocialExposureStorage();
  const safeLimit = Math.max(1, Math.min(limit, 100));
  return client`
    SELECT *
    FROM social_exposure_logs
    ORDER BY occurred_at DESC
    LIMIT ${safeLimit}
  `;
}
