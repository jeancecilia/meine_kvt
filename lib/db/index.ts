import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://therapy:therapy_password@localhost:5432/therapy';

// postgres-js client configuration
export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

// Auto-initialize PostgreSQL tables & seed baseline clinical workflow
initTables();

async function initTables() {
  try {
    await client`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS patient_profile (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        display_name TEXT NOT NULL DEFAULT 'Patient',
        date_of_birth TEXT,
        timezone TEXT DEFAULT 'Europe/Berlin',
        therapy_start_date TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS daily_checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date TEXT NOT NULL UNIQUE,
        mood NUMERIC(3, 1) NOT NULL,
        fulfillment NUMERIC(3, 1) NOT NULL,
        loneliness NUMERIC(3, 1) NOT NULL,
        inner_calm NUMERIC(3, 1) NOT NULL,
        joy NUMERIC(3, 1) NOT NULL,
        rumination NUMERIC(3, 1) NOT NULL,
        future_anxiety NUMERIC(3, 1) NOT NULL,
        novelty_drive NUMERIC(3, 1) NOT NULL,
        energy NUMERIC(3, 1) NOT NULL,
        sleep_quality NUMERIC(3, 1) NOT NULL DEFAULT 6.0,
        life_satisfaction NUMERIC(3, 1) NOT NULL DEFAULT 5.0,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS therapy_goals (
        id TEXT PRIMARY KEY,
        order_index INTEGER NOT NULL DEFAULT 1,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        target_date TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS therapy_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        ended_at TIMESTAMP WITH TIME ZONE,
        session_type TEXT NOT NULL DEFAULT 'weekly',
        main_topic TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        risk_level INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS therapy_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        structured_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS situations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hypotheses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.50,
        status TEXT NOT NULL DEFAULT 'active',
        last_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hypothesis_evidence (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hypothesis_id TEXT NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
        source_type TEXT NOT NULL,
        source_id TEXT,
        direction TEXT NOT NULL,
        weight NUMERIC(3, 2) DEFAULT 1.00,
        description TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS experiments (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        hypothesis TEXT NOT NULL,
        prediction TEXT NOT NULL,
        instructions TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        result TEXT,
        learning TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS experiment_observations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
        observed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        trigger_situation TEXT,
        mood_before NUMERIC(3, 1),
        mood_after NUMERIC(3, 1),
        loneliness_before NUMERIC(3, 1) NOT NULL,
        loneliness_after NUMERIC(3, 1),
        connection_need_before NUMERIC(3, 1) NOT NULL,
        connection_need_after NUMERIC(3, 1),
        romantic_sexual_need_before NUMERIC(3, 1) NOT NULL,
        romantic_sexual_need_after NUMERIC(3, 1),
        novelty_drive_before NUMERIC(3, 1) NOT NULL,
        novelty_drive_after NUMERIC(3, 1),
        action_taken TEXT,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
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
        reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entry_type TEXT NOT NULL DEFAULT 'free',
        title TEXT,
        content TEXT NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS values (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain TEXT NOT NULL,
        title TEXT NOT NULL,
        importance INTEGER NOT NULL DEFAULT 5,
        current_alignment INTEGER NOT NULL DEFAULT 5,
        behavioral_definition TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    // Seed T0 Baseline Checkin (Exact 0.5-step decimal values)
    const todayStr = new Date().toISOString().split('T')[0];
    await client`
      INSERT INTO daily_checkins (
        date, mood, fulfillment, loneliness, inner_calm, joy, rumination,
        future_anxiety, novelty_drive, energy, sleep_quality, life_satisfaction, note
      )
      VALUES (
        ${todayStr}, 5.5, 4.0, 7.0, 5.0, 4.0, 6.5,
        6.0, 7.0, 6.0, 6.0, 5.0, 'T0 Baseline Messung – Systematische Erstanamnese'
      )
      ON CONFLICT (date) DO NOTHING;
    `;

    // Seed Therapy Goals v0.1
    await client`
      INSERT INTO therapy_goals (id, order_index, title, description, status, target_date)
      VALUES 
        ('goal-1', 1, 'Mehr positiven Affekt entwickeln', 'Häufiger und stärker Freude, Interesse, Verbundenheit und Zufriedenheit im normalen Alltag erleben; Anhedonie überwinden.', 'active', '2026-10-01'),
        ('goal-2', 2, 'Einsamkeits-Entkopplung von ständiger Neuheit', 'Wohlbefinden nicht rein davon abhängig machen, ob gerade eine neue Beziehung, neue Frau, Reise oder starke Stimulation vorhanden ist.', 'active', '2026-10-01'),
        ('goal-3', 3, 'Schleife „mehr / neu / nächstes Ziel“ verändern', 'Lernen zu unterscheiden zwischen echter Entfremdung und neurobiologischer Belohnungs-Habituation (Gewöhnungseffekt).', 'active', '2026-10-01')
      ON CONFLICT (id) DO NOTHING;
    `;

    // Seed Case Formulation v0.1
    await client`
      INSERT INTO case_formulations (
        id, version, summary, predisposing_factors, triggering_factors,
        maintaining_factors, protective_factors, working_hypotheses_ids
      )
      VALUES (
        'form-v0.1',
        'v0.1',
        'Erfolgsorientierter Patient mit hoher Stimulationsaffinität (ADHS-assoziiert) und verringerter Erlebensfähigkeit positiver Emotionen nach Zielerreichung. Primäre Aufrechterhaltungsschleife: Erfolg/Alltag -> Ausbleiben erwarteter Euphorie -> Selbstbeobachtung ("Warum bin ich nicht glücklich?") -> Grübeln -> Einsamkeitsverstärkung -> Suche nach intensiver neuer Stimulation (Dating/Reisen).',
        ${JSON.stringify(['ADHS-Belohnungsregulation (schnelle Habituation)', 'Hohe Leistungsorientierung & Selbstanspruch', 'Existenzielle Sinnfragen'])},
        ${JSON.stringify(['Erreichen langfristiger Ziele (z.B. Masterabschluss)', 'Ruhige Tage ohne feste Verpflichtungen', 'Alleinsein in der Freizeit'])},
        ${JSON.stringify(['Kognitive Erwartungsschleife ("Ich müsste euphorisch sein")', 'Fehlinterpretation von Habituation als Bedeutungsverlust', 'Kurzfristige Stimulationssuche zur Kompensation von Einsamkeit'])},
        ${JSON.stringify(['Hohe Reflexions- und Analysefähigkeit', 'Empirische Offenheit für Verhaltensexperimente', 'Gute soziale und berufliche Ressourcen'])},
        ${JSON.stringify(['hyp-001', 'hyp-002'])}
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    // Seed Hypotheses
    await client`
      INSERT INTO hypotheses (id, title, description, confidence, status)
      VALUES 
        ('hyp-001', 'ADHD-related novelty/habituation pattern', 'Belohnungssystem reagiert stark auf Neuheit; Habituation in Erlebnissen und Beziehungen wird fälschlich als Sinn- oder Kompatibilitätsverlust interpretiert.', 0.82, 'active'),
        ('hyp-002', 'Erwartungs-Erlebens-Diskrepanz & Selbstbeobachtungsschleife', 'Objektiver Erfolg (z.B. Master) löst weniger Euphorie aus als erwartet -> Selbstbeobachtung ("Warum empfinde ich nicht mehr?") -> Grübeln senkt die Stimmung weiter.', 0.78, 'active')
      ON CONFLICT (id) DO NOTHING;
    `;

    // Seed Situation 001 (Masterabschluss & Mall/Tinder)
    await client`
      INSERT INTO situations (
        title, category, objective_event, expectation, actual_feeling,
        emotion_ratings, automatic_thoughts, behavior_reaction,
        short_term_consequence, long_term_consequence, ai_analysis
      )
      VALUES (
        'Masterabschluss & Mall/Tinder',
        'Erfolg & Einsamkeit',
        'Mitteilung am Morgen über bestandenes Masterstudium erhalten. Nachmittags Spaziergang in der Mall.',
        'Eigentlich müsste ich jetzt froh, glücklich oder euphorisch sein.',
        'Kaum Belohnungsnachhall („okay, abgehakt“), Einsamkeit 7/10, Melancholie 5/10.',
        ${JSON.stringify({ loneliness: 7, melancholy: 5, boredom: 4 })},
        'Scheiße, niemanden zum Reden. Soll ich vielleicht irgendeiner alten Flamme schreiben, obwohl ich eigentlich gar keinen Bock auf sie habe?',
        'Mall-Spaziergang, Frauenkontakt gesucht, anschließend Tinder-Standort nach Bangkok geändert.',
        'Kurzfristige Hoffnung auf Ablenkung und Kontakt.',
        'Einsamkeitsursache bleibt ungelöst; Verwechslung von echtem Verbundenheitsbedürfnis mit neuer Frauen-Stimulation.',
        'Situationsanalyse 001: Klassische KVT-Diskrepanz zwischen Zielerreichung und emotionalem Nachhall, gefolgt von Stimulationssuche zur Affektregulation.'
      );
    `;

    // Seed Experiment 001
    const endSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    await client`
      INSERT INTO experiments (id, title, hypothesis, prediction, instructions, start_date, end_date, status)
      VALUES (
        'exp-001',
        'Experiment 001 – Connection vs. Novelty',
        'Dein erlebtes Bedürfnis ist menschliche Verbundenheit. Die gewählte Lösung wird vorschnell Stimulation durch eine neue Frau / Tinder.',
        'Ein 15-30 minütiges Gespräch mit einem vertrauten Freund oder Familienmitglied senkt die Einsamkeit spürbar (<=4) und reduziert den Impuls nach Dating-Stimulation.',
        'Bei Einsamkeit >= 5/10: Vor Tinder oder Kontaktsuche 15-30 Min. Freund/Familie anrufen und 4 Ratings vor/nachher erfassen.',
        ${todayStr},
        ${endSevenDays},
        'active'
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  } catch (err: any) {
    // Graceful log in case Postgres server is starting up or in offline mode
    console.warn('PostgreSQL initialization notice (will connect when DB is ready):', err?.message || err);
  }
}
