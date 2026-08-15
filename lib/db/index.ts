import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.DATABASE_URL || 'file:local.db',
});

export const db = drizzle(client, { schema });

// Auto-initialize SQLite tables & seed T0 Baseline data
initTables();

async function initTables() {
  try {
    await client.executeMultiple(`
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
        mood INTEGER NOT NULL,
        fulfillment INTEGER NOT NULL,
        loneliness INTEGER NOT NULL,
        inner_calm INTEGER NOT NULL,
        joy INTEGER NOT NULL,
        rumination INTEGER NOT NULL,
        future_anxiety INTEGER NOT NULL,
        novelty_drive INTEGER NOT NULL,
        energy INTEGER NOT NULL,
        sleep_quality INTEGER NOT NULL,
        note TEXT,
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
        category TEXT NOT NULL DEFAULT 'Other',
        description TEXT NOT NULL,
        objective_situation TEXT,
        automatic_thoughts TEXT,
        short_term_consequence TEXT,
        long_term_consequence TEXT,
        ai_summary TEXT,
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
        metrics TEXT DEFAULT '{}',
        note TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS case_formulations (
        id TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        summary TEXT NOT NULL,
        historical_factors TEXT DEFAULT '[]',
        maintaining_factors TEXT DEFAULT '[]',
        protective_factors TEXT DEFAULT '[]',
        open_questions TEXT DEFAULT '[]',
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

    // Seed T0 Baseline if check-ins are empty
    const checkinCount = await client.execute('SELECT COUNT(*) as count FROM daily_checkins');
    if (Number(checkinCount.rows[0].count) === 0) {
      await client.execute({
        sql: `INSERT INTO daily_checkins (id, date, mood, fulfillment, loneliness, inner_calm, joy, rumination, future_anxiety, novelty_drive, energy, sleep_quality, note, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          't0-baseline-checkin',
          '2026-08-15',
          6, // Stimmung 5.5 -> 6
          4, // Erfüllung 4
          7, // Einsamkeit 7
          5, // Innere Ruhe 5
          4, // Freude 4
          7, // Grübeln 6.5 -> 7
          6, // Zukunftsangst 6
          7, // Neuheitsdrang 7
          6, // Energie 6
          5, // Lebenszufriedenheit 5
          'T0 Baseline Messung (Systematische Erfassung)',
          new Date().toISOString()
        ]
      });
    }

    // Seed Active Experiment 001 if experiments are empty
    const expCount = await client.execute('SELECT COUNT(*) as count FROM experiments');
    if (Number(expCount.rows[0].count) === 0) {
      await client.execute({
        sql: `INSERT INTO experiments (id, title, hypothesis, prediction, instructions, start_date, end_date, status, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'exp-001',
          'Experiment 001 – Connection vs. Novelty',
          'Einsamkeitsimpulse führen zu vorschnellem Suchen nach neuen Kontakten / Stimulation statt echter sozialer Verbindung.',
          'Ein 15-30 minütiges Gespräch mit einem Vertrauten reduziert Einsamkeit (7 -> <=4) und senkt den Impuls nach Dating-Stimulation.',
          'Bei Einsamkeit >= 5/10: Vor Tinder/Neuheit 15-30 Min. Freund/Familie anrufen, danach 4 Ratings durchführen.',
          '2026-08-15',
          '2026-08-22',
          'active',
          new Date().toISOString()
        ]
      });
    }

    // Seed Clinical Hypotheses if hypotheses are empty
    const hypCount = await client.execute('SELECT COUNT(*) as count FROM hypotheses');
    if (Number(hypCount.rows[0].count) === 0) {
      await client.execute({
        sql: `INSERT INTO hypotheses (id, title, description, confidence, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'hyp-001',
          'ADHD-related novelty/habituation pattern',
          'Belohnungssystem reagiert stark auf Neuheit; Gewöhnung in Erlebnissen & Beziehungen wird fälschlich als Sinnverlust interpretiert.',
          0.82,
          'active',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      });
      await client.execute({
        sql: `INSERT INTO hypotheses (id, title, description, confidence, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'hyp-002',
          'Erwartungs-Erlebens-Diskrepanz & Selbstbeobachtungsschleife',
          'Objektiver Erfolg (z.B. Masterabschluss) erzeugt nicht die erwartete Euphorie -> Selbstbeobachtung ("warum bin ich nicht glücklicher?") -> Grübeln.',
          0.78,
          'active',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      });
    }

    // Seed Situation 001 if situations are empty
    const sitCount = await client.execute('SELECT COUNT(*) as count FROM situations');
    if (Number(sitCount.rows[0].count) === 0) {
      await client.execute({
        sql: `INSERT INTO situations (id, occurred_at, category, description, objective_situation, automatic_thoughts, short_term_consequence, long_term_consequence, ai_summary, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'sit-001',
          new Date().toISOString(),
          'Erfolg & Einsamkeit',
          'Masterabschluss am Morgen bestanden. Kaum Euphorie („okay, abgehakt“). Nachmittags Mall, abends Tinder Bangkok Standortwechsel.',
          'Mitteilung über bestandenes Masterstudium erhalten. Nachmittags Spaziergang in der Mall.',
          'Eigentlich müsste ich glücklich sein. Scheiße, niemanden zum Reden. Soll ich einer alten Flamme schreiben?',
          'Mall-Spaziergang, Tinder-Standort nach Bangkok geändert.',
          'Erneutes Suchen nach Stimulation zur Überdeckung von Einsamkeit.',
          'Situation 001: Diskrepanz zwischen Erwartung (Euphorie) und Erleben nach Masterabschluss, gefolgt von Stimulationssuche.',
          new Date().toISOString()
        ]
      });
    }

  } catch (err) {
    console.error('LibSQL table creation & seed error:', err);
  }
}
