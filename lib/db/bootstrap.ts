const PLAN_ID = 'plan-v0.1';
const PHASE_0_ID = 'phase-0-intake';
const PHASE_1_ID = 'phase-1-reward';
const T0_DATE = '2026-08-15';

export async function bootstrapDatabase(client: any) {
  try {
    await client`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS patient_profile (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        display_name TEXT NOT NULL DEFAULT 'Patient',
        date_of_birth TEXT,
        timezone TEXT DEFAULT 'Europe/Berlin',
        therapy_start_date TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS treatment_plans (
        id TEXT PRIMARY KEY,
        version TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        overall_goal TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        started_at TEXT NOT NULL,
        planned_end_at TEXT,
        review_due_at TEXT,
        supersedes_plan_id TEXT,
        change_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS treatment_phases (
        id TEXT PRIMARY KEY,
        treatment_plan_id TEXT NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
        phase_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        objective TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'planned',
        planned_start TEXT,
        planned_end TEXT,
        actual_start TEXT,
        actual_end TEXT,
        success_criteria JSONB DEFAULT '[]'::jsonb,
        exit_criteria JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        UNIQUE (treatment_plan_id, phase_number)
      );

      CREATE TABLE IF NOT EXISTS treatment_modules (
        id TEXT PRIMARY KEY,
        phase_id TEXT NOT NULL REFERENCES treatment_phases(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'planned',
        order_index INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS treatment_plan_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        treatment_plan_id TEXT NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
        reviewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        progress_summary TEXT NOT NULL,
        what_worked JSONB DEFAULT '[]'::jsonb,
        what_did_not_work JSONB DEFAULT '[]'::jsonb,
        hypothesis_changes JSONB DEFAULT '[]'::jsonb,
        recommended_changes JSONB DEFAULT '[]'::jsonb,
        next_review_at TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS daily_checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date TEXT NOT NULL UNIQUE,
        mood NUMERIC(3,1) NOT NULL,
        fulfillment NUMERIC(3,1) NOT NULL,
        loneliness NUMERIC(3,1) NOT NULL,
        inner_calm NUMERIC(3,1) NOT NULL,
        joy NUMERIC(3,1) NOT NULL,
        rumination NUMERIC(3,1) NOT NULL,
        future_anxiety NUMERIC(3,1) NOT NULL,
        novelty_drive NUMERIC(3,1) NOT NULL,
        energy NUMERIC(3,1) NOT NULL,
        sleep_quality NUMERIC(3,1) NOT NULL DEFAULT 6.0,
        life_satisfaction NUMERIC(3,1) NOT NULL DEFAULT 5.0,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS therapy_goals (
        id TEXT PRIMARY KEY,
        treatment_plan_id TEXT REFERENCES treatment_plans(id) ON DELETE SET NULL,
        order_index INTEGER NOT NULL DEFAULT 1,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        target_date TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS therapy_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        treatment_plan_id TEXT REFERENCES treatment_plans(id) ON DELETE SET NULL,
        treatment_phase_id TEXT REFERENCES treatment_phases(id) ON DELETE SET NULL,
        started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        ended_at TIMESTAMPTZ,
        session_type TEXT NOT NULL DEFAULT 'weekly',
        main_topic TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        risk_level INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS therapy_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        structured_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS session_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
        main_issue TEXT NOT NULL,
        key_observations JSONB DEFAULT '[]'::jsonb,
        intervention_used TEXT,
        key_insight TEXT,
        homework TEXT,
        follow_up_topics JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS situations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        title TEXT NOT NULL DEFAULT 'Situation',
        category TEXT NOT NULL DEFAULT 'Other',
        objective_event TEXT NOT NULL,
        expectation TEXT,
        actual_feeling TEXT,
        emotion_ratings JSONB DEFAULT '{}'::jsonb,
        automatic_thoughts TEXT NOT NULL,
        behavior_reaction TEXT NOT NULL,
        short_term_consequence TEXT,
        long_term_consequence TEXT,
        ai_analysis TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hypotheses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        confidence NUMERIC(3,2) NOT NULL DEFAULT 0.50,
        status TEXT NOT NULL DEFAULT 'active',
        last_reviewed_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hypothesis_evidence (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hypothesis_id TEXT NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
        source_type TEXT NOT NULL,
        source_id TEXT,
        direction TEXT NOT NULL,
        weight NUMERIC(3,2) DEFAULT 1.00,
        description TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS experiments (
        id TEXT PRIMARY KEY,
        treatment_plan_id TEXT REFERENCES treatment_plans(id) ON DELETE SET NULL,
        treatment_phase_id TEXT REFERENCES treatment_phases(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        hypothesis TEXT NOT NULL,
        prediction TEXT NOT NULL,
        instructions TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        result TEXT,
        learning TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS experiment_observations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
        observed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        trigger_situation TEXT,
        mood_before NUMERIC(3,1),
        mood_after NUMERIC(3,1),
        loneliness_before NUMERIC(3,1) NOT NULL,
        loneliness_after NUMERIC(3,1),
        connection_need_before NUMERIC(3,1) NOT NULL,
        connection_need_after NUMERIC(3,1),
        romantic_sexual_need_before NUMERIC(3,1) NOT NULL,
        romantic_sexual_need_after NUMERIC(3,1),
        novelty_drive_before NUMERIC(3,1) NOT NULL,
        novelty_drive_after NUMERIC(3,1),
        action_taken TEXT,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS case_formulations (
        id TEXT PRIMARY KEY,
        version TEXT NOT NULL,
        summary TEXT NOT NULL,
        predisposing_factors JSONB DEFAULT '[]'::jsonb,
        triggering_factors JSONB DEFAULT '[]'::jsonb,
        maintaining_factors JSONB DEFAULT '[]'::jsonb,
        protective_factors JSONB DEFAULT '[]'::jsonb,
        working_hypotheses_ids JSONB DEFAULT '[]'::jsonb,
        reviewed_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entry_type TEXT NOT NULL DEFAULT 'free',
        title TEXT,
        content TEXT NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS values (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain TEXT NOT NULL,
        title TEXT NOT NULL,
        importance INTEGER NOT NULL DEFAULT 5,
        current_alignment INTEGER NOT NULL DEFAULT 5,
        behavioral_definition TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        treatment_plan_id TEXT REFERENCES treatment_plans(id) ON DELETE SET NULL,
        treatment_phase_id TEXT REFERENCES treatment_phases(id) ON DELETE SET NULL,
        instrument TEXT NOT NULL,
        assessment_date TEXT NOT NULL,
        total_score NUMERIC(5,1),
        severity TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS assessment_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        item_key TEXT NOT NULL,
        prompt TEXT NOT NULL,
        response INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `;

    // Migrate existing databases created before the treatment-plan layer.
    await client`ALTER TABLE therapy_goals ADD COLUMN IF NOT EXISTS treatment_plan_id TEXT REFERENCES treatment_plans(id) ON DELETE SET NULL`;
    await client`ALTER TABLE therapy_sessions ADD COLUMN IF NOT EXISTS treatment_plan_id TEXT REFERENCES treatment_plans(id) ON DELETE SET NULL`;
    await client`ALTER TABLE therapy_sessions ADD COLUMN IF NOT EXISTS treatment_phase_id TEXT REFERENCES treatment_phases(id) ON DELETE SET NULL`;
    await client`ALTER TABLE experiments ADD COLUMN IF NOT EXISTS treatment_plan_id TEXT REFERENCES treatment_plans(id) ON DELETE SET NULL`;
    await client`ALTER TABLE experiments ADD COLUMN IF NOT EXISTS treatment_phase_id TEXT REFERENCES treatment_phases(id) ON DELETE SET NULL`;

    // T0 baseline is a historical measurement and must not move with deployment date.
    await client`
      INSERT INTO daily_checkins (
        date, mood, fulfillment, loneliness, inner_calm, joy, rumination,
        future_anxiety, novelty_drive, energy, sleep_quality, life_satisfaction, note
      ) VALUES (
        ${T0_DATE}, 5.5, 4.0, 7.0, 5.0, 4.0, 6.5,
        6.0, 7.0, 6.0, 6.0, 5.0, 'T0 Baseline Messung – systematische Erstanamnese'
      ) ON CONFLICT (date) DO NOTHING
    `;

    await client`
      INSERT INTO treatment_plans (
        id, version, title, overall_goal, status, started_at, planned_end_at, review_due_at, change_reason
      ) VALUES (
        ${PLAN_ID}, 'v0.1', '12-Wochen KVT/ACT-Therapieplan',
        'Mehr positiven Affekt und alltägliche Freude entwickeln, Einsamkeit reduzieren und die Schleife aus Neuheitssuche, Habituation und dem Gefühl „es müsste mehr geben“ empirisch verstehen und verändern.',
        'active', '2026-08-15', '2026-11-07', '2026-08-29',
        'Initialer Therapieplan auf Basis von Intake, T0-Baseline und Fallformulierung v0.1.'
      ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        overall_goal = EXCLUDED.overall_goal,
        status = EXCLUDED.status,
        planned_end_at = EXCLUDED.planned_end_at,
        review_due_at = EXCLUDED.review_due_at
    `;

    const phases = [
      [PHASE_0_ID, 0, 'Intake & Baseline', 'Anamnese, T0, Therapieziele, Safety und erste Arbeitshypothesen.', 'Ein belastbares Ausgangsmodell schaffen, ohne Hypothesen mit Diagnosen oder Tatsachen zu verwechseln.', 'completed', '2026-08-15', '2026-08-15', '2026-08-15', '2026-08-15', ['T0 erfasst', 'Therapieziele definiert', 'Fallformulierung v0.1 vorhanden'], ['Baseline und Sicherheitsstatus sind dokumentiert']],
      [PHASE_1_ID, 1, 'Muster & Belohnungsregulation', 'Einsamkeit, Verbundenheit, Sexualität, Neuheit und Belohnungs-Habituation differenzieren.', 'Verstehen, welche Mechanismen Dating-/Neuheitsimpulse und den geringen Belohnungsnachhall tatsächlich aufrechterhalten.', 'active', '2026-08-15', '2026-08-29', '2026-08-15', null, ['Mindestens mehrere reale Beobachtungen aus Experiment 001', 'Connection vs. Novelty anhand Daten besser differenzierbar', 'Belohnungsnachhall bei mindestens einem weiteren positiven Ereignis beobachtet'], ['Genügend Daten, um Phase 2 gezielt zu planen']],
      ['phase-2-positive-affect', 2, 'Positiver Affekt', 'Belohnungsantizipation, tatsächliches Genießen und positiven Nachhall getrennt trainieren und messen.', 'Mehr Freude im Alltag wahrnehmen und positive Erfahrungen länger emotional verfügbar machen.', 'planned', '2026-08-30', '2026-09-12', null, null, ['Reward-Prediction-Protokolle durchgeführt', 'Savoring getestet', 'Positive-Data-Log liefert wiederkehrende Muster'], ['Klarheit darüber, welcher Reward-Prozess am stärksten beeinträchtigt ist']],
      ['phase-3-depression-cbt', 3, 'Depressions-KVT', 'Soll-Regeln, Grübeln, Vergleiche und negative Bewertungen der eigenen Stimmung bearbeiten.', 'Sekundäres Leiden durch „Ich müsste glücklicher sein“ und dysfunktionale Grübelschleifen reduzieren.', 'planned', '2026-09-13', '2026-09-26', null, null, ['Zentrale Soll-Regeln identifiziert', 'Mindestens ein Verhaltensexperiment zu einer Kernannahme', 'Grübelreaktionen früher erkannt'], ['Kognitive Muster sind operationalisiert und alternative Reaktionen erprobt']],
      ['phase-4-act-values', 4, 'ACT / Erfüllung & Werte', 'Werteklärung, Defusion, Akzeptanz und werteorientiertes Handeln statt permanenter Glückskontrolle.', 'Ein erfülltes Leben stärker an gewählten Werten und weniger an momentaner Intensität oder Neuheit ausrichten.', 'planned', '2026-09-27', '2026-10-10', null, null, ['Values Map ausgefüllt', 'Ziele und Werte sauber getrennt', 'Committed Actions in mehreren Lebensbereichen getestet'], ['Werte können konkrete Entscheidungen im Alltag steuern']],
      ['phase-5-interpersonal', 5, 'Beziehungen / Schema / Interpersonal', 'Nähe, Bestätigung, Habituation, Partnerwahl und interpersonelle Konsequenzen realer Situationen untersuchen.', 'Echte Inkompatibilität von Gewöhnung, Einsamkeitsregulation und Neuheitsreiz besser unterscheiden.', 'planned', '2026-10-11', '2026-10-24', null, null, ['Mehrere konkrete Beziehungs-/Interaktionsanalysen', 'Wichtige Grundannahmen geprüft', 'Langfristige Beziehungswerte operationalisiert'], ['Beziehungsentscheidungen können anhand Qualität und Werte statt nur Intensität bewertet werden']],
      ['phase-6-integration', 6, 'Integration & Rückfallprävention', 'T0 vs. T12, Hypothesenbilanz, Warnzeichen, Rückfallplan und persönliches psychologisches Betriebshandbuch.', 'Wirksame Strategien konsolidieren und einen konkreten Plan für zukünftige Rückfälle oder Neuheitsschleifen erstellen.', 'planned', '2026-10-25', '2026-11-07', null, null, ['T0/T12 verglichen', 'Hypothesen aktualisiert', 'Warnzeichen und Reaktionsplan dokumentiert', 'Psychologisches Betriebshandbuch erstellt'], ['Erhaltungs- und Rückfallplan ist konkret genug für eigenständige Anwendung']],
    ];

    for (const phase of phases) {
      await client`
        INSERT INTO treatment_phases (
          id, treatment_plan_id, phase_number, title, description, objective, status,
          planned_start, planned_end, actual_start, actual_end, success_criteria, exit_criteria
        ) VALUES (
          ${phase[0]}, ${PLAN_ID}, ${phase[1]}, ${phase[2]}, ${phase[3]}, ${phase[4]}, ${phase[5]},
          ${phase[6]}, ${phase[7]}, ${phase[8]}, ${phase[9]}, ${JSON.stringify(phase[10])}::jsonb, ${JSON.stringify(phase[11])}::jsonb
        ) ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          objective = EXCLUDED.objective,
          status = EXCLUDED.status,
          planned_start = EXCLUDED.planned_start,
          planned_end = EXCLUDED.planned_end,
          actual_start = EXCLUDED.actual_start,
          actual_end = EXCLUDED.actual_end,
          success_criteria = EXCLUDED.success_criteria,
          exit_criteria = EXCLUDED.exit_criteria
      `;
    }

    const modules = [
      ['m0-1', PHASE_0_ID, 'assessment', 'Anamnese & T0', 'Biografische, depressive, ADHS-, medikamentöse und psychosoziale Ausgangslage erfassen.', 'completed', 1],
      ['m0-2', PHASE_0_ID, 'assessment', 'Therapieziele & Safety', 'Ziele operationalisieren und Sicherheitsstatus als festen Querschnitt definieren.', 'completed', 2],
      ['m0-3', PHASE_0_ID, 'cbt', 'Fallformulierung v0.1', 'Prädisponierende, auslösende, aufrechterhaltende und schützende Faktoren als Arbeitshypothesen strukturieren.', 'completed', 3],
      ['m1-1', PHASE_1_ID, 'adhd_reward', 'Connection vs. Novelty', 'Verbundenheitsbedarf, romantisch-sexuelles Bedürfnis und Neuheitsdrang in realen Situationen getrennt messen.', 'active', 1],
      ['m1-2', PHASE_1_ID, 'positive_affect', 'Reward / Habituation', 'Wollen, Erreichen, Genießen und positiven Nachhall bei Erfolgen und neuen Reizen differenzieren.', 'active', 2],
      ['m1-3', PHASE_1_ID, 'cbt', 'Experiment 001', 'Bei Einsamkeit zuerst echte soziale Verbindung testen und Before/After-Werte erfassen.', 'active', 3],
      ['m2-1', 'phase-2-positive-affect', 'positive_affect', 'Reward Prediction', 'Erwartete und tatsächliche Freude vor/nach Aktivitäten vergleichen.', 'planned', 1],
      ['m2-2', 'phase-2-positive-affect', 'positive_affect', 'Savoring', 'Positive Erfahrungen kurz bewusst aufrechterhalten und Nachhall messen.', 'planned', 2],
      ['m2-3', 'phase-2-positive-affect', 'positive_affect', 'Positive Data Log', 'Positive Ereignisse, Intensität, Dauer und Abbruchbedingungen systematisch protokollieren.', 'planned', 3],
      ['m2-4', 'phase-2-positive-affect', 'positive_affect', 'Belohnungsnachhall', 'Positive Affekte über mehrere Zeitpunkte nach Zielerreichung beobachten.', 'planned', 4],
      ['m3-1', 'phase-3-depression-cbt', 'cbt', 'Kognitive Umstrukturierung', 'Evidenz, Gegenbelege, Alternativhypothesen und Verhaltensexperimente nutzen.', 'planned', 1],
      ['m3-2', 'phase-3-depression-cbt', 'cbt', 'Die Glücks-Sollregel', '„Ich müsste glücklich sein“ und ähnliche Soll-Regeln empirisch prüfen.', 'planned', 2],
      ['m3-3', 'phase-3-depression-cbt', 'cbt', 'Grübelmanagement', 'Trigger, Funktion und alternative Reaktionen auf Grübelschleifen trainieren.', 'planned', 3],
      ['m3-4', 'phase-3-depression-cbt', 'cbt', 'Verhaltensexperimente', 'Kernannahmen in konkreten Alltagssituationen falsifizierbar testen.', 'planned', 4],
      ['m4-1', 'phase-4-act-values', 'act', 'Values Map', 'Wichtigkeit und aktuelle Ausrichtung zentraler Lebensbereiche erfassen.', 'planned', 1],
      ['m4-2', 'phase-4-act-values', 'act', 'Defusion', 'Gedanken als mentale Ereignisse statt als Handlungsbefehle behandeln.', 'planned', 2],
      ['m4-3', 'phase-4-act-values', 'act', 'Akzeptanz & Willingness', 'Unangenehme innere Zustände tolerieren, ohne sofort über Neuheit zu regulieren.', 'planned', 3],
      ['m4-4', 'phase-4-act-values', 'act', 'Committed Action', 'Konkrete Handlungen aus Werten statt aus kurzfristiger Stimmungsoptimierung ableiten.', 'planned', 4],
      ['m5-1', 'phase-5-interpersonal', 'schema', 'Grundannahmen & Bedürfnisse', 'Annahmen über Liebe, Vollständigkeit, Intensität und Beziehungssicherheit prüfen.', 'planned', 1],
      ['m5-2', 'phase-5-interpersonal', 'interpersonal', 'Interpersonelle Situationsanalyse', 'Gewünschtes Ergebnis, eigenes Verhalten, Reaktion des Gegenübers und tatsächliches Ergebnis vergleichen.', 'planned', 2],
      ['m5-3', 'phase-5-interpersonal', 'cbasp', 'Habituation vs. Inkompatibilität', 'Beziehungsentscheidungen über Zeit und Konsequenzen statt nur momentane Intensität bewerten.', 'planned', 3],
      ['m5-4', 'phase-5-interpersonal', 'interpersonal', 'Nähe / Einsamkeit / Bestätigung', 'Unterschiedliche soziale und romantische Bedürfnisse sauber auseinanderhalten.', 'planned', 4],
      ['m6-1', 'phase-6-integration', 'assessment', 'T0 vs. T12', 'Verlaufsdaten und standardisierte Messungen gegenüberstellen.', 'planned', 1],
      ['m6-2', 'phase-6-integration', 'cbt', 'Hypothesenbilanz', 'Unterstützte, widerlegte und offene Arbeitshypothesen dokumentieren.', 'planned', 2],
      ['m6-3', 'phase-6-integration', 'relapse_prevention', 'Rückfallprävention', 'Warnzeichen, Risikokonstellationen und konkrete Gegenmaßnahmen festlegen.', 'planned', 3],
      ['m6-4', 'phase-6-integration', 'relapse_prevention', 'Psychologisches Betriebshandbuch', 'Persönliche Wenn-Dann-Regeln für Einsamkeit, Habituation, Erfolg und Neuheitsschleifen erstellen.', 'planned', 4],
    ];

    for (const module of modules) {
      await client`
        INSERT INTO treatment_modules (id, phase_id, type, title, description, status, order_index)
        VALUES (${module[0]}, ${module[1]}, ${module[2]}, ${module[3]}, ${module[4]}, ${module[5]}, ${module[6]})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          order_index = EXCLUDED.order_index
      `;
    }

    await client`
      INSERT INTO therapy_goals (id, treatment_plan_id, order_index, title, description, status, target_date)
      VALUES
        ('goal-1', ${PLAN_ID}, 1, 'Mehr positiven Affekt entwickeln', 'Häufiger und stärker Freude, Interesse, Verbundenheit und Zufriedenheit im normalen Alltag erleben.', 'active', '2026-11-07'),
        ('goal-2', ${PLAN_ID}, 2, 'Einsamkeit weniger bestimmend machen', 'Wohlbefinden weniger davon abhängig machen, ob gerade neue romantische oder andere intensive Stimulation verfügbar ist.', 'active', '2026-11-07'),
        ('goal-3', ${PLAN_ID}, 3, 'Schleife „mehr / neu / nächstes Ziel“ verstehen und verändern', 'Echte Unzufriedenheit oder Inkompatibilität besser von Habituation und Neuheitsverlust unterscheiden.', 'active', '2026-11-07')
      ON CONFLICT (id) DO UPDATE SET
        treatment_plan_id = EXCLUDED.treatment_plan_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        target_date = EXCLUDED.target_date
    `;

    await client`
      INSERT INTO case_formulations (
        id, version, summary, predisposing_factors, triggering_factors,
        maintaining_factors, protective_factors, working_hypotheses_ids
      ) VALUES (
        'form-v0.1', 'v0.1',
        'Arbeitsmodell: frühere depressive Vulnerabilität bei erhaltenem Antrieb, aktuell niedriger positiver Affekt und Erfüllung sowie relevante Einsamkeit. Bereichsübergreifendes Novelty-/Habituationsmuster bei bekanntem ADHS und die Bewertung „ich müsste glücklicher sein“ werden als getrennte, empirisch zu prüfende aufrechterhaltende Mechanismen behandelt.',
        ${JSON.stringify(['Familiäre depressive Vulnerabilität', 'Frühere deutlich stärkere depressive Phase', 'ADHS-Diagnose und ausgeprägtes bereichsübergreifendes Neuheitsmuster'])}::jsonb,
        ${JSON.stringify(['Alleinsein und wahrgenommene fehlende Verbundenheit', 'Zielerreichung ohne erwarteten emotionalen Nachhall', 'Existenz- und Sinnfragen'])}::jsonb,
        ${JSON.stringify(['Mögliche Vermischung von Einsamkeit, Neuheitsdrang und romantisch-sexueller Kontaktsuche', 'Selbstbeobachtung und Soll-Regeln bezüglich Glück', 'Schnelle Habituation an Ziele, Projekte und Beziehungen als offene Hypothese'])}::jsonb,
        ${JSON.stringify(['Sport und Aktivität', 'Soziale und familiäre Kontakte', 'Hohe Reflexionsfähigkeit', 'Berufliche und persönliche Handlungsfähigkeit', 'Keine aktuelle Suizidalität'])}::jsonb,
        ${JSON.stringify(['hyp-001', 'hyp-002'])}::jsonb
      ) ON CONFLICT (id) DO UPDATE SET
        summary = EXCLUDED.summary,
        predisposing_factors = EXCLUDED.predisposing_factors,
        triggering_factors = EXCLUDED.triggering_factors,
        maintaining_factors = EXCLUDED.maintaining_factors,
        protective_factors = EXCLUDED.protective_factors,
        working_hypotheses_ids = EXCLUDED.working_hypotheses_ids,
        reviewed_at = NOW()
    `;

    await client`
      INSERT INTO hypotheses (id, title, description, confidence, status)
      VALUES
        ('hyp-001', 'ADHS-/Neuheits- und Habituationsmuster', 'Arbeitshypothese: Neuheit erzeugt überdurchschnittlich viel Motivation; Gewöhnung könnte in mehreren Lebensbereichen teilweise als Verlust von Bedeutung oder Passung interpretiert werden.', 0.82, 'active'),
        ('hyp-002', 'Erwartungs-Erlebens-Diskrepanz & Selbstbeobachtungsschleife', 'Arbeitshypothese: Wenn positive Ereignisse weniger Euphorie auslösen als erwartet, kann die Bewertung „warum bin ich nicht glücklicher?“ zusätzlich Grübeln und negative Stimmung verstärken.', 0.78, 'active')
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        confidence = EXCLUDED.confidence,
        status = EXCLUDED.status,
        updated_at = NOW()
    `;

    const situationId = '00000000-0000-4000-8000-000000000001';
    await client`
      INSERT INTO situations (
        id, occurred_at, title, category, objective_event, expectation, actual_feeling,
        emotion_ratings, automatic_thoughts, behavior_reaction,
        short_term_consequence, long_term_consequence, ai_analysis
      ) VALUES (
        ${situationId}::uuid, '2026-08-14T08:00:00+07:00', 'Masterabschluss & Mall/Tinder', 'Erfolg & Einsamkeit',
        'Mitteilung über bestandenes Masterstudium erhalten; später Spaziergang in der Mall und Wunsch nach Kontakt.',
        'Eigentlich müsste ich jetzt froh, glücklich oder euphorisch sein.',
        'Kaum Belohnungsnachhall („okay, abgehakt“); später Einsamkeit 7/10 und Melancholie etwa 5/10.',
        ${JSON.stringify({ loneliness: 7, melancholy: 5 })}::jsonb,
        'Scheiße, niemanden zum Reden. Soll ich vielleicht irgendeiner alten Flamme schreiben, obwohl ich eigentlich gar keinen Bock auf sie habe?',
        'Spaziergang, Suche nach ansprechenden Kontakten, später Tinder-Standort nach Bangkok geändert.',
        'Kurzfristig entsteht Aussicht auf Kontakt, Neuheit und Stimulation.',
        'Offene Frage: Welcher Anteil des Suchimpulses wird durch Einsamkeit/Verbundenheitsbedarf, romantisch-sexuelles Interesse oder Neuheitsdrang vermittelt?',
        'Situation 001 unterstützt die Untersuchung zweier getrennter Prozesse: geringer positiver Nachhall nach Zielerreichung sowie anschließende Kontakt-/Neuheitssuche. Die kausale Verbindung ist noch nicht geklärt.'
      ) ON CONFLICT (id) DO UPDATE SET
        expectation = EXCLUDED.expectation,
        actual_feeling = EXCLUDED.actual_feeling,
        automatic_thoughts = EXCLUDED.automatic_thoughts,
        behavior_reaction = EXCLUDED.behavior_reaction,
        long_term_consequence = EXCLUDED.long_term_consequence,
        ai_analysis = EXCLUDED.ai_analysis
    `;
    await client`DELETE FROM situations WHERE title = 'Masterabschluss & Mall/Tinder' AND id <> ${situationId}::uuid`;

    await client`
      INSERT INTO experiments (
        id, treatment_plan_id, treatment_phase_id, title, hypothesis, prediction,
        instructions, start_date, end_date, status
      ) VALUES (
        'exp-001', ${PLAN_ID}, ${PHASE_1_ID}, 'Experiment 001 – Connection vs. Novelty',
        'Arbeitshypothese: Bei einem Teil der akuten Dating-/Kontaktsuchimpulse trägt Einsamkeit bzw. fehlende Verbundenheit relevant bei; romantisch-sexuelles Interesse und Neuheitsdrang können gleichzeitig eigenständig bestehen.',
        'Wenn Verbundenheitsbedarf ein relevanter Treiber ist, sollte ein echtes 15–30-minütiges Gespräch Einsamkeit und den unmittelbaren Suchimpuls teilweise senken; romantisch-sexuelles Bedürfnis oder Neuheitsdrang können dabei weniger stark verändert bleiben.',
        'Bei Einsamkeit >= 5/10: Stimmung, Einsamkeit, Verbundenheitsbedarf, romantisch-sexuelles Bedürfnis und Neuheitsdrang vorher bewerten; dann 15–30 Min. echte soziale Verbindung herstellen; dieselben Werte danach erneut erfassen. Danach ist Dating weiterhin erlaubt.',
        '2026-08-15', '2026-08-22', 'active'
      ) ON CONFLICT (id) DO UPDATE SET
        treatment_plan_id = EXCLUDED.treatment_plan_id,
        treatment_phase_id = EXCLUDED.treatment_phase_id,
        hypothesis = EXCLUDED.hypothesis,
        prediction = EXCLUDED.prediction,
        instructions = EXCLUDED.instructions,
        status = EXCLUDED.status
    `;
  } catch (err: any) {
    console.warn('PostgreSQL bootstrap notice:', err?.message || err);
  }
}
