import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.DATABASE_URL || 'file:local.db',
});

export const db = drizzle(client, { schema });

// Auto-initialize SQLite tables & seed baseline clinical workflow
initTables();

async function initTables() {
  try {
    await client.executeMultiple(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;

      CREATE TABLE IF NOT EXISTS patient_profile (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL DEFAULT 'Patient',
        date_of_birth TEXT,
        timezone TEXT DEFAULT 'UTC',
        therapy_start_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS daily_checkins (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        mood REAL NOT NULL,
        fulfillment REAL NOT NULL,
        loneliness REAL NOT NULL,
        inner_calm REAL NOT NULL,
        joy REAL NOT NULL,
        rumination REAL NOT NULL,
        future_anxiety REAL NOT NULL,
        novelty_drive REAL NOT NULL,
        energy REAL NOT NULL,
        sleep_quality REAL NOT NULL DEFAULT 6.0,
        life_satisfaction REAL NOT NULL DEFAULT 5.0,
        note TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS therapy_goals (
        id TEXT PRIMARY KEY,
        order_index INTEGER NOT NULL DEFAULT 1,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        target_date TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS therapy_sessions (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        session_type TEXT NOT NULL DEFAULT 'weekly',
        main_topic TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        risk_level INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS therapy_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        structured_data TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS session_summaries (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
        main_issue TEXT NOT NULL,
        key_observations TEXT DEFAULT '[]',
        intervention_used TEXT,
        key_insight TEXT,
        homework TEXT,
        follow_up_topics TEXT DEFAULT '[]',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS situations (
        id TEXT PRIMARY KEY,
        occurred_at TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'Situation',
        category TEXT NOT NULL DEFAULT 'Other',
        objective_event TEXT NOT NULL,
        expectation TEXT,
        actual_feeling TEXT,
        emotion_ratings TEXT DEFAULT '{}',
        automatic_thoughts TEXT NOT NULL,
        behavior_reaction TEXT NOT NULL,
        short_term_consequence TEXT,
        long_term_consequence TEXT,
        ai_analysis TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hypotheses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 0.5,
        status TEXT NOT NULL DEFAULT 'active',
        last_reviewed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hypothesis_evidence (
        id TEXT PRIMARY KEY,
        hypothesis_id TEXT NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
        source_type TEXT NOT NULL,
        source_id TEXT,
        direction TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL
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
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS experiment_observations (
        id TEXT PRIMARY KEY,
        experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
        observed_at TEXT NOT NULL,
        trigger_situation TEXT,
        loneliness_before REAL NOT NULL,
        loneliness_after REAL,
        connection_need_before REAL NOT NULL,
        connection_need_after REAL,
        romantic_sexual_need_before REAL NOT NULL,
        romantic_sexual_need_after REAL,
        novelty_drive_before REAL NOT NULL,
        novelty_drive_after REAL,
        action_taken TEXT,
        note TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS case_formulations (
        id TEXT PRIMARY KEY,
        version TEXT NOT NULL,
        summary TEXT NOT NULL,
        predisposing_factors TEXT DEFAULT '[]',
        triggering_factors TEXT DEFAULT '[]',
        maintaining_factors TEXT DEFAULT '[]',
        protective_factors TEXT DEFAULT '[]',
        working_hypotheses_ids TEXT DEFAULT '[]',
        reviewed_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        entry_type TEXT NOT NULL DEFAULT 'free',
        title TEXT,
        content TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "values" (
        id TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        title TEXT NOT NULL,
        importance INTEGER NOT NULL DEFAULT 5,
        current_alignment INTEGER NOT NULL DEFAULT 5,
        behavioral_definition TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // Seed T0 Baseline Checkin (Exact 0.5-step decimal values)
    await client.execute({
      sql: `INSERT OR IGNORE INTO daily_checkins (id, date, mood, fulfillment, loneliness, inner_calm, joy, rumination, future_anxiety, novelty_drive, energy, sleep_quality, life_satisfaction, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        't0-baseline-checkin',
        new Date().toISOString().split('T')[0],
        5.5, // Stimmung / Wohlbefinden 5.5
        4.0, // Erfüllung 4.0
        7.0, // Einsamkeit 7.0
        5.0, // Innere Ruhe 5.0
        4.0, // Freude / Positiver Affekt 4.0
        6.5, // Grübeln 6.5
        6.0, // Zukunftsangst 6.0
        7.0, // Neuheitsdrang 7.0
        6.0, // Energie 6.0
        6.0, // Schlafqualität 6.0
        5.0, // Lebenszufriedenheit 5.0
        'T0 Baseline Messung – Systematische Erstanamnese',
        new Date().toISOString()
      ]
    });

    // Seed Therapy Goals v0.1
    await client.execute({
      sql: `INSERT OR IGNORE INTO therapy_goals (id, order_index, title, description, status, target_date, created_at)
            VALUES 
            ('goal-1', 1, 'Mehr positiven Affekt entwickeln', 'Häufiger und stärker Freude, Interesse, Verbundenheit und Zufriedenheit im normalen Alltag erleben; Anhedonie überwinden.', 'active', '2026-10-01', ?),
            ('goal-2', 2, 'Einsamkeits-Entkopplung von ständiger Neuheit', 'Wohlbefinden nicht rein davon abhängig machen, ob gerade eine neue Beziehung, neue Frau, Reise oder starke Stimulation vorhanden ist.', 'active', '2026-10-01', ?),
            ('goal-3', 3, 'Schleife „mehr / neu / nächstes Ziel“ verändern', 'Lernen zu unterscheiden zwischen echter Entfremdung und neurobiologischer Belohnungs-Habituation (Gewöhnungseffekt).', 'active', '2026-10-01', ?)`,
      args: [new Date().toISOString(), new Date().toISOString(), new Date().toISOString()]
    });

    // Seed Case Formulation v0.1
    await client.execute({
      sql: `INSERT OR IGNORE INTO case_formulations (id, version, summary, predisposing_factors, triggering_factors, maintaining_factors, protective_factors, working_hypotheses_ids, reviewed_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'form-v0.1',
        'v0.1',
        'Erfolgsorientierter Patient mit hoher Stimulationsaffinität (ADHS-assoziiert) und verringerter Erlebensfähigkeit positiver Emotionen nach Zielerreichung. Primäre Aufrechterhaltungsschleife: Erfolg/Alltag -> Ausbleiben erwarteter Euphorie -> Selbstbeobachtung ("Warum bin ich nicht glücklich?") -> Grübeln -> Einsamkeitsverstärkung -> Suche nach intensiver neuer Stimulation (Dating/Reisen).',
        JSON.stringify(['ADHS-Belohnungsregulation (schnelle Habituation)', 'Hohe Leistungsorientierung & Selbstanspruch', 'Existenzielle Sinnfragen']),
        JSON.stringify(['Erreichen langfristiger Ziele (z.B. Masterabschluss)', 'Ruhige Tage ohne feste Verpflichtungen', 'Alleinsein in der Freizeit']),
        JSON.stringify(['Kognitive Erwartungsschleife ("Ich müsste euphorisch sein")', 'Fehlinterpretation von Habituation als Bedeutungsverlust', 'Kurzfristige Stimulationssuche zur Kompensation von Einsamkeit']),
        JSON.stringify(['Hohe Reflexions- und Analysefähigkeit', 'Empirische Offenheit für Verhaltensexperimente', 'Gute soziale und berufliche Ressourcen']),
        JSON.stringify(['hyp-001', 'hyp-002']),
        new Date().toISOString(),
        new Date().toISOString()
      ]
    });

    // Seed Hypotheses
    await client.execute({
      sql: `INSERT OR IGNORE INTO hypotheses (id, title, description, confidence, status, created_at, updated_at)
            VALUES 
            ('hyp-001', 'ADHD-related novelty/habituation pattern', 'Belohnungssystem reagiert stark auf Neuheit; Habituation in Erlebnissen und Beziehungen wird fälschlich als Sinn- oder Kompatibilitätsverlust interpretiert.', 0.82, 'active', ?, ?),
            ('hyp-002', 'Erwartungs-Erlebens-Diskrepanz & Selbstbeobachtungsschleife', 'Objektiver Erfolg (z.B. Master) löst weniger Euphorie aus als erwartet -> Selbstbeobachtung ("Warum empfinde ich nicht mehr?") -> Grübeln senkt die Stimmung weiter.', 0.78, 'active', ?, ?)`,
      args: [new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), new Date().toISOString()]
    });

    // Seed Situation 001 (Masterabschluss & Mall/Tinder)
    await client.execute({
      sql: `INSERT OR IGNORE INTO situations (id, occurred_at, title, category, objective_event, expectation, actual_feeling, emotion_ratings, automatic_thoughts, behavior_reaction, short_term_consequence, long_term_consequence, ai_analysis, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'sit-001',
        new Date().toISOString(),
        'Masterabschluss & Mall/Tinder',
        'Erfolg & Einsamkeit',
        'Mitteilung am Morgen über bestandenes Masterstudium erhalten. Nachmittags Spaziergang in der Mall.',
        'Eigentlich müsste ich jetzt froh, glücklich oder euphorisch sein.',
        'Kaum Belohnungsnachhall („okay, abgehakt“), Einsamkeit 7/10, Melancholie 5/10.',
        JSON.stringify({ loneliness: 7, melancholy: 5, boredom: 4 }),
        'Scheiße, niemanden zum Reden. Soll ich vielleicht irgendeiner alten Flamme schreiben, obwohl ich eigentlich gar keinen Bock auf sie habe?',
        'Mall-Spaziergang, Frauenkontakt gesucht, anschließend Tinder-Standort nach Bangkok geändert.',
        'Kurzfristige Hoffnung auf Ablenkung und Kontakt.',
        'Einsamkeitsursache bleibt ungelöst; Verwechslung von echtem Verbundenheitsbedürfnis mit neuer Frauen-Stimulation.',
        'Situationsanalyse 001: Klassische KVT-Diskrepanz zwischen Zielerreichung und emotionalem Nachhall, gefolgt von Stimulationssuche zur Affektregulation.',
        new Date().toISOString()
      ]
    });

    // Seed Experiment 001
    await client.execute({
      sql: `INSERT OR IGNORE INTO experiments (id, title, hypothesis, prediction, instructions, start_date, end_date, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'exp-001',
        'Experiment 001 – Connection vs. Novelty',
        'Dein erlebtes Bedürfnis ist menschliche Verbundenheit. Die gewählte Lösung wird vorschnell Stimulation durch eine neue Frau / Tinder.',
        'Ein 15-30 minütiges Gespräch mit einem vertrauten Freund oder Familienmitglied senkt die Einsamkeit spürbar (<=4) und reduziert den Impuls nach Dating-Stimulation.',
        'Bei Einsamkeit >= 5/10: Vor Tinder oder Kontaktsuche 15-30 Min. Freund/Familie anrufen und 4 Ratings vor/nachher erfassen.',
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        'active',
        new Date().toISOString()
      ]
    });

  } catch (err) {
    console.error('LibSQL table creation & seed error:', err);
  }
}
