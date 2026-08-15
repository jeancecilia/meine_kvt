# AI Therapy Companion – App Specification

**Status:** MVP / v0.1  
**User model:** Single-Tenant, Single-Patient  
**Primary user:** The patient himself  
**Primary purpose:** Structured AI-assisted psychotherapy/self-help workflow based primarily on CBT/KVT for depression, enriched with ACT, schema-focused and interpersonal elements.

---

## 1. Product Goal

The app is a **single-user therapeutic companion** for one patient.

It is not designed as a therapist dashboard, clinic system, multi-user SaaS, or practice-management tool.

The patient uses the app directly to:

- track mood and relevant psychological dimensions,
- conduct structured AI-assisted therapy sessions,
- document situations, thoughts, emotions and behavior,
- work with CBT/KVT interventions,
- use ACT-based values and acceptance work,
- identify recurring schemas and interpersonal patterns,
- formulate and test therapeutic hypotheses,
- define weekly exercises and behavioral experiments,
- monitor symptom development over time,
- preserve a structured therapeutic memory across sessions.

The product should feel like a **personal therapy workspace**, not like a medical record system.

---

# 2. Core Therapeutic Model

The app uses **CBT/KVT as the primary framework**.

Additional methods are used selectively:

### CBT / KVT
Primary framework for:

- depressive thoughts,
- rumination,
- maladaptive interpretations,
- avoidance,
- behavioral patterns,
- cognitive distortions,
- behavioral experiments,
- relapse prevention.

### ACT
Used mainly for:

- meaning and fulfillment,
- excessive pursuit of happiness,
- difficulty tolerating ordinary life,
- values clarification,
- acceptance of uncomfortable internal states,
- cognitive defusion,
- values-based action.

### Schema-focused elements
Used for:

- recurring emotional themes,
- persistent assumptions about love, achievement or fulfillment,
- recurring "something is missing" patterns,
- expectations such as:
  - "The right partner will make me complete."
  - "If something stops feeling exciting, it must be wrong."
  - "I should feel happier than I do."

No automatic personality-disorder diagnosis should be generated.

### Interpersonal / CBASP-inspired elements
Used for:

- loneliness,
- relationship patterns,
- approach/withdrawal cycles,
- novelty and habituation in relationships,
- interaction analysis,
- discrepancies between intended and actual interpersonal outcomes.

---

# 3. Clinical Working Hypotheses

The system must distinguish **hypotheses from facts**.

Initial working hypotheses may include:

1. Depressive vulnerability / residual depressive symptoms.
2. ADHD-related reward regulation and novelty seeking.
3. Chronic dissatisfaction / reduced fulfillment.
4. Loneliness as a mood amplifier.
5. Habituation being misinterpreted as loss of meaning or compatibility.
6. Strong future-oriented reward seeking.
7. Interpersonal needs for closeness and validation.
8. Existential concerns and meaning-related rumination.

The AI should never silently convert these into diagnoses.

Each hypothesis should have:

- `title`
- `description`
- `status`
- `confidence`
- `supporting_evidence`
- `contradicting_evidence`
- `last_reviewed_at`

Example:

```json
{
  "title": "ADHD-related novelty/habituation pattern",
  "confidence": 0.82,
  "status": "active"
}
```

The confidence score is only an internal reasoning aid, not a medical probability.

---

# 4. Product Principles

## 4.1 Single-user first

No:

- organizations,
- tenants,
- therapists,
- teams,
- admin panels,
- roles,
- billing,
- subscriptions,
- user invitations.

Only one patient account exists.

---

## 4.2 AI is structured, not free-form

The app must not simply be a generic chat window.

Every therapy session should have a structured flow:

1. Check-in
2. Review of previous week
3. Review of homework / experiment
4. Identify central issue
5. Functional or cognitive analysis
6. Intervention
7. Reflection
8. New exercise / experiment
9. Session summary
10. Update case formulation if warranted

---

## 4.3 Separate raw data from therapeutic memory

The system stores:

### Raw data
Original material:

- journal entries,
- chat messages,
- situation logs,
- daily check-ins,
- questionnaire responses.

### Therapeutic memory
Compressed structured knowledge:

- case formulation,
- active hypotheses,
- important recurring patterns,
- current goals,
- active experiments,
- recent session summaries,
- clinically relevant longitudinal changes.

The AI should usually receive **therapeutic memory + relevant retrieved raw data**, not the entire database.

---

## 4.4 Avoid overanalysis

The product should not encourage endless introspection.

The AI should repeatedly move from:

**insight → experiment → observation → review**

rather than:

**analysis → more analysis → more analysis**

---

# 5. Recommended Tech Stack

## Frontend

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **React Hook Form**
- **Zod**
- **Recharts** for charts
- **PWA support**
- responsive mobile-first design

---

## Backend

Use the same Next.js project where practical.

Recommended:

- Next.js Route Handlers / Server Actions
- separate service layer for therapeutic logic
- no direct database access from client
- all AI calls server-side

---

## Database

- **PostgreSQL**
- self-hosted with Docker
- one database
- one user account
- no multi-tenancy

Recommended ORM:

- **Drizzle ORM**

Alternative:

- Prisma

Drizzle is preferred because the schema remains close to PostgreSQL and the project is likely to use SQL-specific features later.

---

## Deployment

Docker Compose:

```text
reverse-proxy
      |
      v
nextjs-app
      |
      v
postgresql
```

Optional services later:

```text
pgvector
object-storage
backup-job
```

Do not add Redis, Kafka, message queues or microservices in v0.1.

---

## Reverse Proxy

Recommended:

- **Caddy**

Reasons:

- simple configuration,
- automatic HTTPS,
- low maintenance.

Alternative:

- Traefik
- Nginx

---

## AI

Use the **OpenAI Responses API** server-side.

AI responsibilities:

- structured therapy conversation,
- session summaries,
- pattern extraction,
- case-formulation updates,
- homework generation,
- behavioral experiment creation,
- retrieval query generation,
- safety classification.

Prefer structured JSON output for all machine-readable AI operations.

---

## Semantic retrieval

Not required for the first prototype.

Later:

- PostgreSQL + `pgvector`

Use embeddings for:

- similar situations,
- recurring relationship patterns,
- related previous session material,
- previous experiments,
- earlier statements about the same topic.

Do not introduce a separate vector database unless PostgreSQL becomes insufficient.

---

# 6. Suggested Repository Structure

```text
therapy-companion/
├── app/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── check-in/
│   │   ├── therapy/
│   │   ├── situations/
│   │   ├── experiments/
│   │   ├── values/
│   │   ├── journal/
│   │   ├── formulation/
│   │   └── progress/
│   ├── api/
│   │   ├── therapy/
│   │   ├── checkins/
│   │   ├── situations/
│   │   ├── experiments/
│   │   ├── assessments/
│   │   └── ai/
│   └── layout.tsx
│
├── components/
│   ├── therapy/
│   ├── checkin/
│   ├── charts/
│   ├── forms/
│   └── ui/
│
├── lib/
│   ├── db/
│   │   ├── schema/
│   │   ├── queries/
│   │   └── migrations/
│   ├── ai/
│   │   ├── prompts/
│   │   ├── schemas/
│   │   ├── context-builder.ts
│   │   ├── orchestrator.ts
│   │   └── safety.ts
│   ├── therapy/
│   │   ├── formulation.ts
│   │   ├── experiments.ts
│   │   ├── scoring.ts
│   │   └── retrieval.ts
│   └── auth/
│
├── docker/
│   ├── postgres/
│   └── backups/
│
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

# 7. Main Navigation

## Desktop

Left sidebar:

1. Today
2. Check-in
3. Therapy
4. Situations
5. Experiments
6. Values
7. Journal
8. Case Formulation
9. Progress
10. Settings

---

## Mobile

Bottom navigation:

- Today
- Therapy
- `+`
- Progress
- More

The center `+` opens:

- Log situation
- Quick mood check
- Add thought
- Add journal note
- Add insight

---

# 8. Primary User Flow

## 8.1 First Launch

### Screen 1 — Welcome

Short explanation:

> This app helps you structure your therapeutic work over time.

Actions:

- Start setup
- Restore existing data

---

### Screen 2 — Basic profile

Fields:

- display name
- age
- therapy start date
- timezone
- preferred weekly review day
- optional current medication note

No complex onboarding.

---

### Screen 3 — Initial therapeutic baseline

Collect:

- current mood
- loneliness
- fulfillment
- inner calm
- joy
- rumination
- future anxiety
- novelty drive
- general life satisfaction

All on `0–10`.

Then optional structured questionnaires.

---

### Screen 4 — Initial therapy goals

Patient defines up to 3 primary goals.

Example:

1. Understand persistent dissatisfaction.
2. Reduce depressive background mood.
3. Make relationship decisions less dependent on novelty.

Each goal gets:

- description
- baseline score
- target state
- importance score

---

### Screen 5 — Initial case formulation

Generated collaboratively with AI.

The patient must be able to:

- approve,
- edit,
- reject,
- annotate

each major hypothesis.

No AI-generated formulation becomes canonical without user confirmation.

---

# 9. Home / Today Screen

The home screen should answer:

> "What matters today?"

Suggested layout:

## Header

```text
Good morning
Saturday, 15 August
```

---

## Current state

Cards:

- Mood
- Fulfillment
- Loneliness
- Joy
- Rumination
- Novelty drive

Show current score and 7-day trend.

---

## Active experiment

Example:

> **Experiment:** Distinguish habituation from true loss of interest  
> Day 4 of 7

Actions:

- Add observation
- Review experiment

---

## AI observation

One concise longitudinal observation.

Example:

> Low mood this week appears more strongly associated with loneliness than with inactivity.

Must be presented as a **hypothesis**, not a conclusion.

---

## Upcoming weekly review

```text
Weekly review
Saturday
```

Action:

- Start early

---

## Quick actions

- 30-second check-in
- Log a situation
- Start therapy session
- Write journal note

---

# 10. Daily Check-In Flow

Target completion time:

**30–60 seconds**

Fields:

| Dimension | Scale |
|---|---:|
| Mood | 0–10 |
| Fulfillment | 0–10 |
| Loneliness | 0–10 |
| Inner calm | 0–10 |
| Joy | 0–10 |
| Rumination | 0–10 |
| Future anxiety | 0–10 |
| Novelty drive | 0–10 |
| Energy | 0–10 |
| Sleep quality | 0–10 |

Optional:

- short note
- tags
- significant event

The user should be able to save without writing text.

---

# 11. Situation Logging Flow

This is one of the most important modules.

## Step 1 — What happened?

Free text.

Example:

> I met someone new and suddenly felt much more alive.

---

## Step 2 — Context

Select one:

- Relationship / dating
- Work
- Project
- Travel
- Family
- Friendship
- Health
- Finances
- Meaning / existential
- Other

---

## Step 3 — Automatic CBT analysis

AI proposes:

### Situation
What objectively happened?

### Automatic thoughts
What went through your mind?

### Emotions
- sadness
- loneliness
- excitement
- anxiety
- boredom
- emptiness
- frustration
- desire
- shame
- other

Intensity `0–10`.

### Behavior
What did you do?

### Short-term consequence
What happened immediately?

### Long-term consequence
What might this reinforce?

---

## Step 4 — User correction

The user can edit all AI interpretations.

---

## Step 5 — Pattern link

AI may suggest links:

> Similar to 4 previous situations involving novelty and rapid reward.

Possible tags:

- novelty
- habituation
- loneliness
- rejection
- comparison
- achievement
- rumination
- avoidance
- validation
- existential anxiety

---

# 12. Therapy Session Flow

## Start Session

The user selects:

### A. Weekly structured session
Default.

### B. Work on a specific issue
Example:
- relationship
- loneliness
- work anxiety
- meaning
- rumination

### C. Quick intervention
10-minute focused session.

---

# 13. Weekly Therapy Session Structure

## Stage 1 — Safety and state check

Very brief.

Ask:

- current mood
- current distress
- current suicidal thoughts / intent

Do not turn every session into a long risk interview.

If acute risk is detected, normal therapeutic flow stops and the app switches to the safety flow.

---

## Stage 2 — Review previous week

AI summarizes:

- mood changes,
- notable situations,
- recurring patterns,
- experiment progress,
- major deviations from baseline.

The user confirms or corrects the summary.

---

## Stage 3 — Homework / experiment review

Questions:

- What did you try?
- What happened?
- What did you expect?
- What actually happened?
- What did you learn?

---

## Stage 4 — Choose central issue

AI proposes at most 3 candidates.

Example:

1. Loneliness after an otherwise active week.
2. Loss of interest after initial novelty.
3. Rumination about professional success.

Patient chooses one.

---

## Stage 5 — Functional analysis

Recommended format:

```text
Trigger
↓
Thought / interpretation
↓
Emotion
↓
Urge
↓
Behavior
↓
Immediate consequence
↓
Long-term consequence
```

---

## Stage 6 — Intervention selection

The system chooses one primary therapeutic approach.

Possible interventions:

### CBT
- cognitive restructuring
- evidence examination
- behavioral experiment
- rumination interruption
- behavioral alternatives

### ACT
- values clarification
- cognitive defusion
- acceptance exercise
- willingness
- committed action

### Schema-focused
- identify recurring belief
- schema trigger
- emotional need
- alternative adult response

### Interpersonal
- intended interpersonal outcome
- actual behavior
- response of other person
- actual outcome
- alternative interaction

The AI should not use all methods simultaneously.

---

## Stage 7 — Session insight

At the end, generate:

- 1 key insight
- 1 unresolved question
- 1 pattern to watch

---

## Stage 8 — Weekly experiment

Exactly one primary experiment.

Example:

### Hypothesis
> Reduced excitement after repeated exposure does not necessarily mean the activity or relationship is wrong.

### Experiment
Continue one previously valued activity for seven days without replacing it with a new one.

### Observe
- anticipated interest
- actual interest
- boredom
- urge for novelty
- satisfaction after activity

---

## Stage 9 — Session summary

AI generates a structured summary.

The summary should include:

```json
{
  "main_issue": "",
  "key_observations": [],
  "intervention_used": "",
  "key_insight": "",
  "active_hypotheses_changed": [],
  "homework": "",
  "experiment_id": "",
  "follow_up_topics": []
}
```

---

# 14. Case Formulation Screen

This is a central long-term screen.

Sections:

## Current clinical picture

Short human-readable summary.

---

## Historical factors

Examples:

- family depression history
- adolescent depressive period
- prior substance/steroid exposure
- ADHD diagnosis
- medication history

---

## Current maintaining factors

Examples:

- novelty seeking
- loneliness
- rumination
- future-focused reward seeking
- interpretation of habituation
- existential concerns

---

## Protective factors

Examples:

- exercise
- social contacts
- family connection
- introspective ability
- goal orientation
- no current substance abuse

---

## Active hypotheses

Cards with:

- title
- explanation
- current confidence
- evidence for
- evidence against
- last update

---

## Formulation version history

Never silently overwrite the case formulation.

Store:

```text
v0.1
v0.2
v0.3
...
```

The user can compare changes.

---

# 15. Values / ACT Module

Domains:

- relationships
- family
- friendship
- work
- learning
- health
- adventure
- creativity
- contribution
- independence
- stability
- spirituality / meaning
- other

For each domain:

### Importance
`0–10`

### Current alignment
`0–10`

### What does this value mean behaviorally?

Example:

> Value: intimacy  
> Behavior: communicate honestly, remain emotionally present, show care consistently.

Important:

A **value** is not a goal.

Example:

```text
Goal:
Find a partner.

Value:
Live lovingly and connected.
```

---

# 16. Experiments Module

Every experiment has:

```text
Title
Hypothesis
Prediction
Behavior
Observation window
Metrics
Result
Learning
Status
```

Statuses:

- planned
- active
- completed
- abandoned

Example:

```text
Hypothesis:
Novelty loss is being mistaken for loss of compatibility.

Prediction:
Interest will partially recover when attention is redirected from excitement to values and actual quality.

Duration:
7 days
```

---

# 17. Journal Module

The journal is intentionally simple.

Entry types:

- Free journal
- Thought
- Insight
- Relationship note
- Dream
- Memory
- Therapy note

AI features:

- summarize
- identify themes
- link to previous entries
- convert into situation analysis

Never automatically interpret every journal entry.

---

# 18. Progress Screen

The purpose is **longitudinal understanding**, not gamification.

Charts:

- Mood
- Fulfillment
- Loneliness
- Joy
- Rumination
- Future anxiety
- Novelty drive
- Energy

Views:

- 7 days
- 30 days
- 90 days
- all time

---

## Correlations

Later version may calculate:

- loneliness vs mood
- novelty drive vs fulfillment
- sleep vs mood
- social contact vs loneliness
- exercise vs mood

Any correlation shown must state:

> Correlation does not establish causation.

---

## Therapy markers

Overlay:

- therapy sessions
- major life events
- medication changes
- new relationships
- trips
- completed experiments

---

# 19. Questionnaire Module

Potential instruments:

- PHQ-9
- optional anxiety measure
- optional ADHD measure
- optional loneliness scale
- custom therapy dimensions

Questionnaires should not dominate the product.

Suggested schedule:

### PHQ-9
- baseline
- every 2–4 weeks
- major deterioration

Custom daily dimensions remain the main longitudinal tracking method.

---

# 20. Safety Flow

Because the app handles depressive symptoms, it needs a clear safety pathway.

## Risk states

### Level 0
No suicidal thoughts.

Normal app flow.

### Level 1
Passive thoughts without intent.

AI acknowledges, assesses briefly and recommends human support where appropriate.

### Level 2
Current suicidal thoughts with unclear intent.

Normal therapy flow pauses.

The app asks about immediate safety and directs the user toward real-world human support.

### Level 3
Intent, plan, preparation or immediate danger.

Stop standard therapeutic coaching.

Display emergency-oriented guidance and encourage immediate contact with local emergency / crisis resources or a trusted person.

The AI must not attempt to "therapy-chat" its way through acute imminent risk.

---

# 21. Data Model

Recommended primary tables:

```text
patient_profile
daily_checkins
assessments
assessment_answers
therapy_sessions
therapy_messages
session_summaries
journal_entries
situations
situation_thoughts
situation_emotions
situation_behaviors
case_formulations
hypotheses
hypothesis_evidence
therapy_goals
values
experiments
experiment_observations
interpersonal_events
medication_history
life_events
safety_checks
attachments
ai_events
```

---

# 22. Suggested PostgreSQL Schema

## `patient_profile`

```text
id
display_name
date_of_birth
timezone
therapy_start_date
created_at
updated_at
```

Single row.

---

## `daily_checkins`

```text
id
date
mood
fulfillment
loneliness
inner_calm
joy
rumination
future_anxiety
novelty_drive
energy
sleep_quality
note
created_at
```

All scale values:

```text
0–10
```

---

## `therapy_sessions`

```text
id
started_at
ended_at
session_type
main_topic
status
risk_level
created_at
```

Types:

```text
weekly
focused
quick
```

---

## `therapy_messages`

```text
id
session_id
role
content
structured_data
created_at
```

Roles:

```text
user
assistant
system
```

---

## `session_summaries`

```text
id
session_id
main_issue
key_observations
intervention_used
key_insight
homework
follow_up_topics
created_at
```

Prefer JSONB for arrays.

---

## `situations`

```text
id
occurred_at
category
description
objective_situation
automatic_thoughts
short_term_consequence
long_term_consequence
ai_summary
created_at
```

---

## `hypotheses`

```text
id
title
description
confidence
status
created_at
updated_at
last_reviewed_at
```

---

## `hypothesis_evidence`

```text
id
hypothesis_id
source_type
source_id
direction
weight
description
created_at
```

Direction:

```text
supports
contradicts
neutral
```

---

## `experiments`

```text
id
title
hypothesis
prediction
instructions
start_date
end_date
status
result
learning
created_at
```

---

## `experiment_observations`

```text
id
experiment_id
observed_at
metrics
note
created_at
```

`metrics` can be JSONB.

---

## `case_formulations`

```text
id
version
summary
historical_factors
maintaining_factors
protective_factors
open_questions
created_at
```

Never update the row in place.

Create a new version.

---

# 23. AI Architecture

Recommended flow:

```text
User input
   ↓
Safety pre-check
   ↓
Intent classification
   ↓
Context builder
   ↓
Relevant database retrieval
   ↓
Therapy orchestrator
   ↓
OpenAI
   ↓
Structured response parser
   ↓
User-facing answer
   ↓
Background structured extraction
   ↓
Database update
```

"Background" here means as part of the same request or immediate server workflow, not asynchronous unseen therapeutic work.

---

# 24. Context Builder

The LLM should not receive all historical data.

For a normal therapy session include:

```text
1. Current case formulation
2. Active hypotheses
3. Current therapy goals
4. Active experiment
5. Previous session summary
6. Relevant events since previous session
7. 7–14 day check-in trends
8. Retrieved similar historical situations
9. Current user message
```

---

# 25. Retrieval Priority

Rank context sources:

1. Current safety state
2. Active experiment
3. Last session
4. Current case formulation
5. Last 14 days
6. Similar situations
7. Older journal material

The AI should prefer recent and explicitly confirmed information over old inferred information.

---

# 26. AI Output Contract

The therapy AI should return both:

## User-facing response

Natural therapeutic conversation.

## Structured metadata

Example:

```json
{
  "mode": "cbt",
  "main_theme": "novelty_habituation",
  "observations": [
    "Loss of excitement followed achievement of the desired state."
  ],
  "hypothesis_updates": [
    {
      "hypothesis_id": "uuid",
      "direction": "supports",
      "strength": 0.2
    }
  ],
  "suggested_experiment": null,
  "requires_case_formulation_update": false,
  "risk_level": 0
}
```

---

# 27. Therapy AI System Behavior

The AI should:

- ask targeted questions,
- challenge assumptions respectfully,
- distinguish facts from interpretations,
- avoid automatically validating every conclusion,
- use behavioral experiments,
- encourage concrete action,
- recognize repeated patterns,
- use previous sessions when relevant,
- avoid excessive reassurance,
- avoid diagnosing personality disorders based on isolated behavior,
- avoid medication instructions,
- flag significant deterioration,
- treat suicidal risk separately.

---

# 28. Example Therapy Logic

User:

> I met someone new yesterday and suddenly felt much happier.

Possible AI reasoning framework:

```text
Possible mechanisms:
- social connection
- novelty reward
- reduced loneliness
- romantic anticipation
- validation
```

The AI should ask questions that differentiate these mechanisms.

It should not immediately conclude:

> "You need a relationship."

or:

> "This is just ADHD."

---

# 29. Weekly Review Algorithm

At the beginning of the weekly review:

Calculate:

```text
7-day average
previous 7-day average
change
min
max
number of check-ins
```

For:

- mood
- fulfillment
- loneliness
- joy
- rumination
- novelty drive

Then identify notable events.

Example output:

```text
Mood: +0.6
Loneliness: -1.1
Fulfillment: +0.2
Novelty drive: +1.4
```

AI then generates at most 3 hypotheses about what influenced the changes.

---

# 30. Authentication

Because the system is single-user:

Keep authentication minimal.

Recommended:

- one account
- email/password
- hashed password
- server session cookie

Possible library:

- Auth.js

Do not implement:

- registration
- social login
- organizations
- invite flows
- roles
- permissions matrix

---

# 31. API Routes

Example:

```text
POST   /api/checkins
GET    /api/checkins
POST   /api/situations
GET    /api/situations
POST   /api/therapy/session
POST   /api/therapy/message
POST   /api/therapy/session/:id/finish
GET    /api/therapy/session/:id
GET    /api/formulation
POST   /api/formulation/review
GET    /api/hypotheses
POST   /api/experiments
POST   /api/experiments/:id/observe
GET    /api/progress
POST   /api/journal
```

---

# 32. Docker Compose

Suggested services:

```yaml
services:
  app:
    build: .
    restart: unless-stopped
    depends_on:
      - postgres
    environment:
      DATABASE_URL: ${DATABASE_URL}
      OPENAI_API_KEY: ${OPENAI_API_KEY}

  postgres:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_DB: therapy
      POSTGRES_USER: therapy
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  caddy:
    image: caddy:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data

volumes:
  postgres_data:
  caddy_data:
```

---

# 33. Backup Strategy

Minimum:

- daily PostgreSQL dump,
- retention of recent backups,
- manual export button.

Example:

```text
daily:
pg_dump → compressed backup

keep:
30 daily
12 monthly
```

---

# 34. PWA Behavior

The web app should be installable.

Features:

- manifest
- app icons
- standalone mode
- responsive layout
- cached shell
- quick check-in while mobile

Offline support can be incremental.

Do not attempt full offline therapy chat in v0.1.

---

# 35. Notifications

Optional v0.2.

Possible reminders:

- daily check-in
- weekly therapy review
- active experiment observation
- questionnaire due

Avoid excessive wellness notifications.

The app should not behave like a streak-based habit app.

---

# 36. MVP v0.1

Build only:

## Required

1. Single-user login
2. Dashboard
3. Daily check-in
4. Therapy chat
5. Weekly structured session
6. Situation logging
7. Case formulation
8. Hypotheses
9. Experiments
10. Progress charts
11. Journal
12. Safety check
13. Database backup/export

---

## Defer

- native mobile app
- therapist portal
- multi-user
- billing
- subscriptions
- wearable integration
- HealthKit
- Google Fit
- voice mode
- advanced embeddings
- automated PDF therapist reports
- external calendar integration
- social features

---

# 37. Suggested Development Order

## Phase 1 — Foundation

1. Next.js project
2. Tailwind + shadcn/ui
3. PostgreSQL Docker
4. Drizzle
5. single-user auth
6. Docker Compose
7. base layout

---

## Phase 2 — Tracking

1. daily check-in
2. dashboard
3. progress charts
4. journal
5. situations

---

## Phase 3 — Therapy Engine

1. OpenAI integration
2. session model
3. therapy chat
4. structured output
5. session summary
6. context builder

---

## Phase 4 — Longitudinal Intelligence

1. case formulation
2. hypotheses
3. hypothesis evidence
4. experiments
5. weekly review
6. trend analysis

---

## Phase 5 — Polish

1. PWA
2. mobile UX
3. export
4. backups
5. notifications
6. pgvector retrieval if needed

---

# 38. First Real User Journey

## Day 0

Patient opens app.

1. Login
2. Baseline
3. Define 3 goals
4. Import/create initial case formulation
5. Complete initial daily check-in
6. Start first AI session
7. Receive first experiment

---

## Day 1–6

Patient occasionally:

- completes 30-second check-in,
- logs relevant situations,
- adds experiment observations,
- writes journal notes.

No requirement to use the app constantly.

---

## Day 7

Patient opens weekly therapy session.

The app automatically prepares:

- current scores,
- changes from previous week,
- relevant situations,
- experiment results,
- previous session summary,
- active hypotheses.

AI and patient conduct one structured session.

At the end:

- summary saved,
- formulation optionally updated,
- one new experiment created,
- follow-up topics stored.

---

# 39. UX Tone

The app should feel:

- calm,
- intelligent,
- adult,
- neutral,
- analytical but humane.

Avoid:

- infantilizing language,
- excessive emojis,
- gamification,
- streaks,
- "You got this!" style copy,
- clinical hospital aesthetics,
- overly spiritual presentation.

Desired style:

> personal research lab + high-quality therapy workspace

---

# 40. Visual Direction

Suggested UI:

- generous whitespace
- soft cards
- large readable typography
- restrained accent color
- no bright mental-health cliché gradients
- charts as secondary information
- therapy conversation as the primary content area

Desktop should support long-form sessions comfortably.

Mobile should optimize quick capture.

---

# 41. MVP Success Criteria

The MVP succeeds if after 4–8 weeks the patient can answer:

1. What patterns repeatedly precede low mood?
2. What most strongly predicts loneliness?
3. What triggers novelty seeking?
4. Does habituation repeatedly get interpreted as loss of meaning?
5. Which therapeutic interventions actually helped?
6. Are scores improving, stable or deteriorating?
7. Which experiments changed beliefs?
8. Which hypotheses became more or less plausible?
9. What are the patient's current values and goals?
10. What should the next therapy session focus on?

If the application cannot answer these questions, it is storing information but not creating therapeutic value.

---

# 42. Recommended v0.1 Stack Summary

```text
Frontend:
Next.js
React
TypeScript
Tailwind
shadcn/ui

Backend:
Next.js server layer
Route Handlers / Server Actions

Database:
PostgreSQL 18
Drizzle ORM

Infrastructure:
Docker
Docker Compose
Caddy

AI:
OpenAI Responses API
Structured Outputs

Charts:
Recharts

Validation:
Zod

Forms:
React Hook Form

Auth:
Minimal single-user Auth.js setup

Later:
pgvector
PWA notifications
advanced retrieval
```

---

# 43. Final Product Definition

The app is:

> **A single-patient, AI-assisted longitudinal psychotherapy workspace that combines structured CBT/KVT, ACT, schema-oriented and interpersonal techniques with daily measurement, behavioral experiments and persistent therapeutic memory.**

The central loop is:

```text
Observe
↓
Understand
↓
Form hypothesis
↓
Run experiment
↓
Measure
↓
Review
↓
Update formulation
```

That loop should drive the entire product.

---

# 44. Immediate Next Build Target

The first usable vertical slice should be:

```text
Login
↓
Dashboard
↓
Daily Check-In
↓
Therapy Session
↓
Session Summary
↓
Experiment
↓
Weekly Review
```

Only after this works end-to-end should additional modules be expanded.

