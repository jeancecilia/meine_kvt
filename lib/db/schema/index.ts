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

// Daily Check-ins (0.0-10.0 ratings across 10 core dimensions + distinct sleep quality & life satisfaction)
export const dailyCheckins = sqliteTable('daily_checkins', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text('date').notNull(),
  mood: real('mood').notNull(), // 0.0-10.0 (e.g. 5.5)
  fulfillment: real('fulfillment').notNull(), // 0.0-10.0 (e.g. 4.0)
  loneliness: real('loneliness').notNull(), // 0.0-10.0 (e.g. 7.0)
  innerCalm: real('inner_calm').notNull(), // 0.0-10.0 (e.g. 5.0)
  joy: real('joy').notNull(), // 0.0-10.0 (e.g. 4.0)
  rumination: real('rumination').notNull(), // 0.0-10.0 (e.g. 6.5)
  futureAnxiety: real('future_anxiety').notNull(), // 0.0-10.0 (e.g. 6.0)
  noveltyDrive: real('novelty_drive').notNull(), // 0.0-10.0 (e.g. 7.0)
  energy: real('energy').notNull(), // 0.0-10.0 (e.g. 6.0)
  sleepQuality: real('sleep_quality').notNull().default(6.0), // Separate sleep quality
  lifeSatisfaction: real('life_satisfaction').notNull().default(5.0), // Separate life satisfaction (e.g. 5.0)
  note: text('note'),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});

// Therapy Goals (Versioned Therapy Objectives)
export const therapyGoals = sqliteTable('therapy_goals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderIndex: integer('order_index').notNull().default(1),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'achieved' | 'paused'
  targetDate: text('target_date'),
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

// Situations (Structured 5-Step CBT Situation Analysis)
export const situations = sqliteTable('situations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  occurredAt: text('occurred_at').default(new Date().toISOString()).notNull(),
  title: text('title').notNull().default('Situation'),
  category: text('category').notNull().default('Other'),
  objectiveEvent: text('objective_event').notNull(),
  expectation: text('expectation'),
  actualFeeling: text('actual_feeling'),
  emotionRatings: text('emotion_ratings', { mode: 'json' }).default('{}'), // e.g. {"loneliness": 7, "melancholy": 5}
  automaticThoughts: text('automatic_thoughts').notNull(),
  behaviorReaction: text('behavior_reaction').notNull(),
  shortTermConsequence: text('short_term_consequence'),
  longTermConsequence: text('long_term_consequence'),
  aiAnalysis: text('ai_analysis'),
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

// Experiment Observations (Concrete Before vs After Ratings)
export const experimentObservations = sqliteTable('experiment_observations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  experimentId: text('experiment_id').references(() => experiments.id, { onDelete: 'cascade' }).notNull(),
  observedAt: text('observed_at').default(new Date().toISOString()).notNull(),
  triggerSituation: text('trigger_situation'),
  lonelinessBefore: real('loneliness_before').notNull(),
  lonelinessAfter: real('loneliness_after'),
  connectionNeedBefore: real('connection_need_before').notNull(),
  connectionNeedAfter: real('connection_need_after'),
  romanticSexualNeedBefore: real('romantic_sexual_need_before').notNull(),
  romanticSexualNeedAfter: real('romantic_sexual_need_after'),
  noveltyDriveBefore: real('novelty_drive_before').notNull(),
  noveltyDriveAfter: real('novelty_drive_after'),
  actionTaken: text('action_taken'), // e.g. "15 Min mit Freund X telefoniert"
  note: text('note'),
  createdAt: text('created_at').default(new Date().toISOString()).notNull(),
});

// Case Formulations (Versioned v0.1, v0.2...)
export const caseFormulations = sqliteTable('case_formulations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  version: text('version').notNull(), // 'v0.1'
  summary: text('summary').notNull(),
  predisposingFactors: text('predisposing_factors', { mode: 'json' }).default('[]'),
  triggeringFactors: text('triggering_factors', { mode: 'json' }).default('[]'),
  maintainingFactors: text('maintaining_factors', { mode: 'json' }).default('[]'),
  protectiveFactors: text('protective_factors', { mode: 'json' }).default('[]'),
  workingHypothesesIds: text('working_hypotheses_ids', { mode: 'json' }).default('[]'),
  reviewedAt: text('reviewed_at').default(new Date().toISOString()),
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
