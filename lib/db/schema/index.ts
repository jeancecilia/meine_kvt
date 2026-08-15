import { pgTable, text, integer, numeric, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

// Single Patient Profile
export const patientProfile = pgTable('patient_profile', {
  id: uuid('id').defaultRandom().primaryKey(),
  displayName: text('display_name').notNull().default('Patient'),
  dateOfBirth: text('date_of_birth'),
  timezone: text('timezone').default('Europe/Berlin'),
  therapyStartDate: text('therapy_start_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Daily Check-ins (0.0-10.0 numeric ratings with UNIQUE date for idempotent upserts)
export const dailyCheckins = pgTable('daily_checkins', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: text('date').notNull().unique(),
  mood: numeric('mood', { precision: 3, scale: 1 }).notNull(), // 0.0-10.0
  fulfillment: numeric('fulfillment', { precision: 3, scale: 1 }).notNull(),
  loneliness: numeric('loneliness', { precision: 3, scale: 1 }).notNull(),
  innerCalm: numeric('inner_calm', { precision: 3, scale: 1 }).notNull(),
  joy: numeric('joy', { precision: 3, scale: 1 }).notNull(),
  rumination: numeric('rumination', { precision: 3, scale: 1 }).notNull(),
  futureAnxiety: numeric('future_anxiety', { precision: 3, scale: 1 }).notNull(),
  noveltyDrive: numeric('novelty_drive', { precision: 3, scale: 1 }).notNull(),
  energy: numeric('energy', { precision: 3, scale: 1 }).notNull(),
  sleepQuality: numeric('sleep_quality', { precision: 3, scale: 1 }).notNull().default('6.0'),
  lifeSatisfaction: numeric('life_satisfaction', { precision: 3, scale: 1 }).notNull().default('5.0'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Therapy Goals (Versioned Objectives)
export const therapyGoals = pgTable('therapy_goals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderIndex: integer('order_index').notNull().default(1),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'achieved' | 'paused'
  targetDate: text('target_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Therapy Sessions
export const therapySessions = pgTable('therapy_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  sessionType: text('session_type').notNull().default('weekly'), // 'weekly' | 'focused' | 'quick'
  mainTopic: text('main_topic'),
  status: text('status').notNull().default('active'), // 'active' | 'completed' | 'cancelled'
  riskLevel: integer('risk_level').notNull().default(0), // 0-3
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Therapy Session Messages
export const therapyMessages = pgTable('therapy_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => therapySessions.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  structuredData: jsonb('structured_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Session Summaries
export const sessionSummaries = pgTable('session_summaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => therapySessions.id, { onDelete: 'cascade' }).notNull(),
  mainIssue: text('main_issue').notNull(),
  keyObservations: jsonb('key_observations').default([]),
  interventionUsed: text('intervention_used'),
  keyInsight: text('key_insight'),
  homework: text('homework'),
  followUpTopics: jsonb('follow_up_topics').default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Situations (Structured 5-Step CBT Situation Analysis)
export const situations = pgTable('situations', {
  id: uuid('id').defaultRandom().primaryKey(),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  title: text('title').notNull().default('Situation'),
  category: text('category').notNull().default('Other'),
  objectiveEvent: text('objective_event').notNull(),
  expectation: text('expectation'),
  actualFeeling: text('actual_feeling'),
  emotionRatings: jsonb('emotion_ratings').default({}), // e.g. {"loneliness": 7, "melancholy": 5}
  automaticThoughts: text('automatic_thoughts').notNull(),
  behaviorReaction: text('behavior_reaction').notNull(),
  shortTermConsequence: text('short_term_consequence'),
  longTermConsequence: text('long_term_consequence'),
  aiAnalysis: text('ai_analysis'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Clinical Hypotheses
export const hypotheses = pgTable('hypotheses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  confidence: numeric('confidence', { precision: 3, scale: 2 }).notNull().default('0.50'), // 0.00 - 1.00
  status: text('status').notNull().default('active'), // 'active' | 'confirmed' | 'rejected'
  lastReviewedAt: timestamp('last_reviewed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Hypothesis Evidence
export const hypothesisEvidence = pgTable('hypothesis_evidence', {
  id: uuid('id').defaultRandom().primaryKey(),
  hypothesisId: text('hypothesis_id').references(() => hypotheses.id, { onDelete: 'cascade' }).notNull(),
  sourceType: text('source_type').notNull(), // 'situation' | 'session' | 'checkin' | 'journal'
  sourceId: text('source_id'),
  direction: text('direction').notNull(), // 'supports' | 'contradicts' | 'neutral'
  weight: numeric('weight', { precision: 3, scale: 2 }).default('1.00'),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Behavioral Experiments
export const experiments = pgTable('experiments', {
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Experiment Observations (Concrete Before vs After Ratings including mood_before/mood_after)
export const experimentObservations = pgTable('experiment_observations', {
  id: uuid('id').defaultRandom().primaryKey(),
  experimentId: text('experiment_id').references(() => experiments.id, { onDelete: 'cascade' }).notNull(),
  observedAt: timestamp('observed_at').defaultNow().notNull(),
  triggerSituation: text('trigger_situation'),
  moodBefore: numeric('mood_before', { precision: 3, scale: 1 }), // 0.0 - 10.0
  moodAfter: numeric('mood_after', { precision: 3, scale: 1 }),
  lonelinessBefore: numeric('loneliness_before', { precision: 3, scale: 1 }).notNull(),
  lonelinessAfter: numeric('loneliness_after', { precision: 3, scale: 1 }),
  connectionNeedBefore: numeric('connection_need_before', { precision: 3, scale: 1 }).notNull(),
  connectionNeedAfter: numeric('connection_need_after', { precision: 3, scale: 1 }),
  romanticSexualNeedBefore: numeric('romantic_sexual_need_before', { precision: 3, scale: 1 }).notNull(),
  romanticSexualNeedAfter: numeric('romantic_sexual_need_after', { precision: 3, scale: 1 }),
  noveltyDriveBefore: numeric('novelty_drive_before', { precision: 3, scale: 1 }).notNull(),
  noveltyDriveAfter: numeric('novelty_drive_after', { precision: 3, scale: 1 }),
  actionTaken: text('action_taken'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Case Formulations (Versioned v0.1, v0.2...)
export const caseFormulations = pgTable('case_formulations', {
  id: text('id').primaryKey(),
  version: text('version').notNull(), // 'v0.1'
  summary: text('summary').notNull(),
  predisposingFactors: jsonb('predisposing_factors').default([]),
  triggeringFactors: jsonb('triggering_factors').default([]),
  maintainingFactors: jsonb('maintaining_factors').default([]),
  protectiveFactors: jsonb('protective_factors').default([]),
  workingHypothesesIds: jsonb('working_hypotheses_ids').default([]),
  reviewedAt: timestamp('reviewed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Journal Entries
export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  entryType: text('entry_type').notNull().default('free'),
  title: text('title'),
  content: text('content').notNull(),
  tags: jsonb('tags').default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Values (ACT Framework)
export const values = pgTable('values', {
  id: uuid('id').defaultRandom().primaryKey(),
  domain: text('domain').notNull(),
  title: text('title').notNull(),
  importance: integer('importance').notNull().default(5),
  currentAlignment: integer('current_alignment').notNull().default(5),
  behavioralDefinition: text('behavioral_definition'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
