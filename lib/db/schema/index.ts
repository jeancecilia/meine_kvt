import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Single Patient Profile
export const patientProfile = sqliteTable('patient_profile', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  displayName: text('display_name').notNull().default('Patient'),
  dateOfBirth: text('date_of_birth'),
  timezone: text('timezone').default('UTC'),
  therapyStartDate: text('therapy_start_date'),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
  updatedAt: text('updated_at').default(new Date().toISOString()).notNull(),
});

// Daily Check-ins (0-10 ratings across 10 dimensions)
export const dailyCheckins = sqliteTable('daily_checkins', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text('date').notNull(),
  mood: integer('mood').notNull(), // 0-10
  fulfillment: integer('fulfillment').notNull(), // 0-10
  loneliness: integer('loneliness').notNull(), // 0-10
  innerCalm: integer('inner_calm').notNull(), // 0-10
  joy: integer('joy').notNull(), // 0-10
  rumination: integer('rumination').notNull(), // 0-10
  futureAnxiety: integer('future_anxiety').notNull(), // 0-10
  noveltyDrive: integer('novelty_drive').notNull(), // 0-10
  energy: integer('energy').notNull(), // 0-10
  sleepQuality: integer('sleep_quality').notNull(), // 0-10
  note: text('note'),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});

// Therapy Sessions
export const therapySessions = sqliteTable('therapy_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  startedAt: text('started_at').default(new Date().toISOString()).notNull(),
  endedAt: text('ended_at'),
  sessionType: text('session_type').notNull().default('weekly'), // 'weekly' | 'focused' | 'quick'
  mainTopic: text('main_topic'),
  status: text('status').notNull().default('active'), // 'active' | 'completed' | 'cancelled'
  riskLevel: integer('risk_level').notNull().default(0), // 0-3
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});

// Therapy Session Messages
export const therapyMessages = sqliteTable('therapy_messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').references(() => therapySessions.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  structuredData: text('structured_data', { mode: 'json' }),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});

// Session Summaries
export const sessionSummaries = sqliteTable('session_summaries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').references(() => therapySessions.id, { onDelete: 'cascade' }).notNull(),
  mainIssue: text('main_issue').notNull(),
  keyObservations: text('key_observations', { mode: 'json' }).default('[]'),
  interventionUsed: text('intervention_used'),
  keyInsight: text('key_insight'),
  homework: text('homework'),
  followUpTopics: text('follow_up_topics', { mode: 'json' }).default('[]'),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});

// Situations (CBT Situation Logging)
export const situations = sqliteTable('situations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  occurredAt: text('occurred_at').default(new Date().toISOString()).notNull(),
  category: text('category').notNull().default('Other'),
  description: text('description').notNull(),
  objectiveSituation: text('objective_situation'),
  automaticThoughts: text('automatic_thoughts'),
  shortTermConsequence: text('short_term_consequence'),
  longTermConsequence: text('long_term_consequence'),
  aiSummary: text('ai_summary'),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});

// Clinical Hypotheses
export const hypotheses = sqliteTable('hypotheses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  confidence: real('confidence').notNull().default(0.5), // 0.0 - 1.0
  status: text('status').notNull().default('active'), // 'active' | 'confirmed' | 'rejected'
  lastReviewedAt: text('last_reviewed_at').default(new Date().toISOString()),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
  updatedAt: text('updated_at').default(new Date().toISOString()).notNull(),
});

// Hypothesis Evidence
export const hypothesisEvidence = sqliteTable('hypothesis_evidence', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  hypothesisId: text('hypothesis_id').references(() => hypotheses.id, { onDelete: 'cascade' }).notNull(),
  sourceType: text('source_type').notNull(), // 'situation' | 'session' | 'checkin' | 'journal'
  sourceId: text('source_id'),
  direction: text('direction').notNull(), // 'supports' | 'contradicts' | 'neutral'
  weight: real('weight').default(1.0),
  description: text('description').notNull(),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});

// Behavioral Experiments
export const experiments = sqliteTable('experiments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  hypothesis: text('hypothesis').notNull(),
  prediction: text('prediction').notNull(),
  instructions: text('instructions'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').notNull().default('active'), // 'planned' | 'active' | 'completed' | 'abandoned'
  result: text('result'),
  learning: text('learning'),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});

// Experiment Observations
export const experimentObservations = sqliteTable('experiment_observations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  experimentId: text('experiment_id').references(() => experiments.id, { onDelete: 'cascade' }).notNull(),
  observedAt: text('observed_at').default(new Date().toISOString()).notNull(),
  metrics: text('metrics', { mode: 'json' }).default('{}'),
  note: text('note'),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});

// Case Formulations (Versioned)
export const caseFormulations = sqliteTable('case_formulations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  version: integer('version').notNull(),
  summary: text('summary').notNull(),
  historicalFactors: text('historical_factors', { mode: 'json' }).default('[]'),
  maintainingFactors: text('maintaining_factors', { mode: 'json' }).default('[]'),
  protectiveFactors: text('protective_factors', { mode: 'json' }).default('[]'),
  openQuestions: text('open_questions', { mode: 'json' }).default('[]'),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});

// Journal Entries
export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  entryType: text('entry_type').notNull().default('free'), // 'free' | 'thought' | 'insight' | 'relationship' | 'dream' | 'memory' | 'therapy_note'
  title: text('title'),
  content: text('content').notNull(),
  tags: text('tags', { mode: 'json' }).default('[]'),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});

// Values (ACT Framework)
export const values = sqliteTable('values', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  domain: text('domain').notNull(), // 'relationships' | 'work' | 'health' | 'creativity' etc.
  title: text('title').notNull(),
  importance: integer('importance').notNull().default(5), // 0-10
  currentAlignment: integer('current_alignment').notNull().default(5), // 0-10
  behavioralDefinition: text('behavioral_definition'),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});
