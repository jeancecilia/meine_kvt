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

// Versioned master treatment plan
export const treatmentPlans = pgTable('treatment_plans', {
  id: text('id').primaryKey(),
  version: text('version').notNull().unique(),
  title: text('title').notNull(),
  overallGoal: text('overall_goal').notNull(),
  status: text('status').notNull().default('active'), // 'draft' | 'active' | 'completed' | 'superseded'
  startedAt: text('started_at').notNull(),
  plannedEndAt: text('planned_end_at'),
  reviewDueAt: text('review_due_at'),
  supersedesPlanId: text('supersedes_plan_id'),
  changeReason: text('change_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const treatmentPhases = pgTable('treatment_phases', {
  id: text('id').primaryKey(),
  treatmentPlanId: text('treatment_plan_id').references(() => treatmentPlans.id, { onDelete: 'cascade' }).notNull(),
  phaseNumber: integer('phase_number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  objective: text('objective').notNull(),
  status: text('status').notNull().default('planned'), // 'planned' | 'active' | 'completed' | 'paused'
  plannedStart: text('planned_start'),
  plannedEnd: text('planned_end'),
  actualStart: text('actual_start'),
  actualEnd: text('actual_end'),
  successCriteria: jsonb('success_criteria').default([]),
  exitCriteria: jsonb('exit_criteria').default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const treatmentModules = pgTable('treatment_modules', {
  id: text('id').primaryKey(),
  phaseId: text('phase_id').references(() => treatmentPhases.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // assessment | cbt | positive_affect | act | adhd_reward | schema | interpersonal | cbasp | relapse_prevention
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('planned'), // planned | active | completed | paused
  orderIndex: integer('order_index').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const treatmentPlanReviews = pgTable('treatment_plan_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  treatmentPlanId: text('treatment_plan_id').references(() => treatmentPlans.id, { onDelete: 'cascade' }).notNull(),
  reviewedAt: timestamp('reviewed_at').defaultNow().notNull(),
  progressSummary: text('progress_summary').notNull(),
  whatWorked: jsonb('what_worked').default([]),
  whatDidNotWork: jsonb('what_did_not_work').default([]),
  hypothesisChanges: jsonb('hypothesis_changes').default([]),
  recommendedChanges: jsonb('recommended_changes').default([]),
  nextReviewAt: text('next_review_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Daily Check-ins (0.0-10.0 numeric ratings with UNIQUE date for idempotent upserts)
export const dailyCheckins = pgTable('daily_checkins', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: text('date').notNull().unique(),
  mood: numeric('mood', { precision: 3, scale: 1 }).notNull(),
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

// Therapy Goals
export const therapyGoals = pgTable('therapy_goals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  treatmentPlanId: text('treatment_plan_id').references(() => treatmentPlans.id, { onDelete: 'set null' }),
  orderIndex: integer('order_index').notNull().default(1),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('active'),
  targetDate: text('target_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Therapy Sessions
export const therapySessions = pgTable('therapy_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  treatmentPlanId: text('treatment_plan_id').references(() => treatmentPlans.id, { onDelete: 'set null' }),
  treatmentPhaseId: text('treatment_phase_id').references(() => treatmentPhases.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  sessionType: text('session_type').notNull().default('weekly'),
  mainTopic: text('main_topic'),
  status: text('status').notNull().default('active'),
  riskLevel: integer('risk_level').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const therapyMessages = pgTable('therapy_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => therapySessions.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  structuredData: jsonb('structured_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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

// Situations (Structured CBT Situation Analysis)
export const situations = pgTable('situations', {
  id: uuid('id').defaultRandom().primaryKey(),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  title: text('title').notNull().default('Situation'),
  category: text('category').notNull().default('Other'),
  objectiveEvent: text('objective_event').notNull(),
  expectation: text('expectation'),
  actualFeeling: text('actual_feeling'),
  emotionRatings: jsonb('emotion_ratings').default({}),
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
  confidence: numeric('confidence', { precision: 3, scale: 2 }).notNull().default('0.50'),
  status: text('status').notNull().default('active'),
  lastReviewedAt: timestamp('last_reviewed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const hypothesisEvidence = pgTable('hypothesis_evidence', {
  id: uuid('id').defaultRandom().primaryKey(),
  hypothesisId: text('hypothesis_id').references(() => hypotheses.id, { onDelete: 'cascade' }).notNull(),
  sourceType: text('source_type').notNull(),
  sourceId: text('source_id'),
  direction: text('direction').notNull(),
  weight: numeric('weight', { precision: 3, scale: 2 }).default('1.00'),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Behavioral Experiments
export const experiments = pgTable('experiments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  treatmentPlanId: text('treatment_plan_id').references(() => treatmentPlans.id, { onDelete: 'set null' }),
  treatmentPhaseId: text('treatment_phase_id').references(() => treatmentPhases.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  hypothesis: text('hypothesis').notNull(),
  prediction: text('prediction').notNull(),
  instructions: text('instructions'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').notNull().default('active'),
  result: text('result'),
  learning: text('learning'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const experimentObservations = pgTable('experiment_observations', {
  id: uuid('id').defaultRandom().primaryKey(),
  experimentId: text('experiment_id').references(() => experiments.id, { onDelete: 'cascade' }).notNull(),
  observedAt: timestamp('observed_at').defaultNow().notNull(),
  triggerSituation: text('trigger_situation'),
  moodBefore: numeric('mood_before', { precision: 3, scale: 1 }),
  moodAfter: numeric('mood_after', { precision: 3, scale: 1 }),
  lonelinessBefore: numeric('loneliness_before', { precision: 3, scale: 1 }).notNull(),
  lonelinessAfter: numeric('loneliness_after', { precision: 3, scale: 1 }),
  connectionNeedBefore: numeric('connection_need_before', { precision: 3, scale: 1 }).notNull(),
  connectionNeedAfter: numeric('connection_need_after', { precision: 3, scale: 1 }),
  libidoBefore: numeric('libido_before', { precision: 3, scale: 1 }),
  libidoAfter: numeric('libido_after', { precision: 3, scale: 1 }),
  romanticSexualNeedBefore: numeric('romantic_sexual_need_before', { precision: 3, scale: 1 }).notNull(),
  romanticSexualNeedAfter: numeric('romantic_sexual_need_after', { precision: 3, scale: 1 }),
  noveltyDriveBefore: numeric('novelty_drive_before', { precision: 3, scale: 1 }).notNull(),
  noveltyDriveAfter: numeric('novelty_drive_after', { precision: 3, scale: 1 }),
  actionTaken: text('action_taken'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Dating-App / Tinder Motive Checks (10-Second Functional Snapshot)
export const motiveChecks = pgTable('motive_checks', {
  id: uuid('id').defaultRandom().primaryKey(),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  appName: text('app_name').default('Tinder').notNull(),
  libido: numeric('libido', { precision: 3, scale: 1 }).notNull(),
  connection: numeric('connection', { precision: 3, scale: 1 }).notNull(),
  loneliness: numeric('loneliness', { precision: 3, scale: 1 }).notNull(),
  novelty: numeric('novelty', { precision: 3, scale: 1 }).notNull(),
  validation: numeric('validation', { precision: 3, scale: 1 }).notNull(),
  datingIntent: numeric('dating_intent', { precision: 3, scale: 1 }).notNull(),
  boredom: numeric('boredom', { precision: 3, scale: 1 }).notNull(),
  dominantMotive: text('dominant_motive').notNull(), // 'sexual' | 'connection_loneliness' | 'novelty_validation' | 'boredom' | 'mixed'
  experimentTriggered: integer('experiment_triggered').notNull().default(0), // 0 or 1
  feedbackMessage: text('feedback_message'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Case Formulations (Versioned v0.1, v0.2...)
export const caseFormulations = pgTable('case_formulations', {
  id: text('id').primaryKey(),
  version: text('version').notNull(),
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

// Standardized outcome assessments (PHQ-9 etc.)
export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  treatmentPlanId: text('treatment_plan_id').references(() => treatmentPlans.id, { onDelete: 'set null' }),
  treatmentPhaseId: text('treatment_phase_id').references(() => treatmentPhases.id, { onDelete: 'set null' }),
  instrument: text('instrument').notNull(),
  assessmentDate: text('assessment_date').notNull(),
  totalScore: numeric('total_score', { precision: 5, scale: 1 }),
  severity: text('severity'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assessmentResponses = pgTable('assessment_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  assessmentId: uuid('assessment_id').references(() => assessments.id, { onDelete: 'cascade' }).notNull(),
  itemKey: text('item_key').notNull(),
  prompt: text('prompt').notNull(),
  response: integer('response').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
