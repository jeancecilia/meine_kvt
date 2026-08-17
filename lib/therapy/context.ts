import { db } from '@/lib/db';
import {
  dailyCheckins,
  therapyGoals,
  caseFormulations,
  hypotheses,
  experiments,
  experimentObservations,
  situations,
  sessionSummaries,
  patientProfile,
  treatmentPlans,
  treatmentPhases,
  treatmentModules,
  treatmentPlanReviews,
  motiveChecks,
} from '@/lib/db/schema';
import { asc, desc, eq } from 'drizzle-orm';

export interface TherapyContextData {
  systemPrompt: string;
  summaryContext: {
    latestCheckin: any;
    activeGoalsCount: number;
    activeHypothesesCount: number;
    activeExperiment: any;
    observationsCount: number;
    activePlan: any;
    activePhase: any;
    activeModules: any[];
  };
}

export async function buildTherapyContext(sessionType: string = 'weekly'): Promise<TherapyContextData> {
  const profiles = await db.select().from(patientProfile).limit(1).catch(() => []);
  const profile = profiles[0] || { displayName: 'Patient', timezone: 'Europe/Berlin' };

  // Master treatment plan must come before individual techniques.
  const plans = await db
    .select()
    .from(treatmentPlans)
    .where(eq(treatmentPlans.status, 'active'))
    .orderBy(desc(treatmentPlans.createdAt))
    .limit(1)
    .catch(() => []);
  const activePlan = plans[0] || null;

  let activePhase: any = null;
  let activeModules: any[] = [];
  let latestPlanReview: any = null;

  if (activePlan) {
    const phases = await db
      .select()
      .from(treatmentPhases)
      .where(eq(treatmentPhases.treatmentPlanId, activePlan.id))
      .orderBy(asc(treatmentPhases.phaseNumber))
      .catch(() => []);
    activePhase = phases.find((p) => p.status === 'active') || phases.find((p) => p.status === 'planned') || null;

    if (activePhase) {
      activeModules = await db
        .select()
        .from(treatmentModules)
        .where(eq(treatmentModules.phaseId, activePhase.id))
        .orderBy(asc(treatmentModules.orderIndex))
        .catch(() => []);
    }

    const reviews = await db
      .select()
      .from(treatmentPlanReviews)
      .where(eq(treatmentPlanReviews.treatmentPlanId, activePlan.id))
      .orderBy(desc(treatmentPlanReviews.reviewedAt))
      .limit(1)
      .catch(() => []);
    latestPlanReview = reviews[0] || null;
  }

  const checkins = await db
    .select()
    .from(dailyCheckins)
    .orderBy(desc(dailyCheckins.date))
    .limit(7)
    .catch(() => []);

  const goals = await db
    .select()
    .from(therapyGoals)
    .where(eq(therapyGoals.status, 'active'))
    .orderBy(therapyGoals.orderIndex)
    .catch(() => []);

  const formulations = await db
    .select()
    .from(caseFormulations)
    .orderBy(desc(caseFormulations.createdAt))
    .limit(1)
    .catch(() => []);
  const currentFormulation = formulations[0] || null;

  const activeHypotheses = await db
    .select()
    .from(hypotheses)
    .where(eq(hypotheses.status, 'active'))
    .orderBy(desc(hypotheses.confidence))
    .catch(() => []);

  const activeExps = await db
    .select()
    .from(experiments)
    .where(eq(experiments.status, 'active'))
    .limit(1)
    .catch(() => []);
  const activeExp = activeExps[0] || null;

  let observations: any[] = [];
  if (activeExp) {
    observations = await db
      .select()
      .from(experimentObservations)
      .where(eq(experimentObservations.experimentId, activeExp.id))
      .orderBy(desc(experimentObservations.observedAt))
      .limit(8)
      .catch(() => []);
  }

  const recentSituations = await db
    .select()
    .from(situations)
    .orderBy(desc(situations.occurredAt))
    .limit(4)
    .catch(() => []);

  const recentSummaries = await db
    .select()
    .from(sessionSummaries)
    .orderBy(desc(sessionSummaries.createdAt))
    .limit(3)
    .catch(() => []);

  const recentMotiveChecks = await db
    .select()
    .from(motiveChecks)
    .orderBy(desc(motiveChecks.occurredAt))
    .limit(5)
    .catch(() => []);

  const planSummary = activePlan
    ? `Version: ${activePlan.version}\nTitel: ${activePlan.title}\nGesamtziel: ${activePlan.overallGoal}\nZeitraum: ${activePlan.startedAt} bis ${activePlan.plannedEndAt || 'offen'}\nNächster formaler Review: ${activePlan.reviewDueAt || 'nicht gesetzt'}`
    : 'Kein aktiver Therapieplan in der Datenbank.';

  const phaseSummary = activePhase
    ? `Phase ${activePhase.phaseNumber}: ${activePhase.title} [${activePhase.status}]\nZiel: ${activePhase.objective}\nBeschreibung: ${activePhase.description}\nErfolgskriterien: ${JSON.stringify(activePhase.successCriteria || [])}`
    : 'Keine aktive Therapiephase.';

  const modulesSummary = activeModules.length > 0
    ? activeModules.map((m, idx) => `${idx + 1}. [${m.status}] ${m.title} (${m.type}): ${m.description}`).join('\n')
    : 'Keine Module für die aktuelle Phase hinterlegt.';

  const planReviewSummary = latestPlanReview
    ? `Letzter Review: ${latestPlanReview.progressSummary}\nNächster Review: ${latestPlanReview.nextReviewAt || 'offen'}`
    : 'Noch kein formaler Therapieplan-Review; Plan v0.1 ist die aktuelle Ausgangsversion.';

  const checkinSummary = checkins.length > 0
    ? checkins.map((c) => `• ${c.date}: Stimmung ${c.mood}, Erfüllung ${c.fulfillment}, Einsamkeit ${c.loneliness}, Ruhe ${c.innerCalm}, Freude ${c.joy}, Grübeln ${c.rumination}, Zukunftsangst ${c.futureAnxiety}, Neuheit ${c.noveltyDrive}, Energie ${c.energy}, Lebenszufriedenheit ${c.lifeSatisfaction}${c.note ? ` — ${c.note}` : ''}`).join('\n')
    : 'Noch keine aktuellen Check-ins.';

  const goalsSummary = goals.length > 0
    ? goals.map((g, idx) => `${idx + 1}. ${g.title}: ${g.description}`).join('\n')
    : 'Keine aktiven Ziele definiert.';

  const hypothesesSummary = activeHypotheses.length > 0
    ? activeHypotheses.map((h) => `• [${h.id}] ${h.title} (Arbeitsvertrauen ${Math.round(Number(h.confidence) * 100)}%): ${h.description}`).join('\n')
    : 'Keine aktiven Arbeitshypothesen.';

  let experimentSummary = 'Kein aktives Experiment.';
  if (activeExp) {
    experimentSummary = `Titel: ${activeExp.title}\nHypothese: ${activeExp.hypothesis}\nVorhersage: ${activeExp.prediction}\nAuftrag: ${activeExp.instructions || 'N/A'}\nLaufzeit: ${activeExp.startDate} bis ${activeExp.endDate}`;
    if (observations.length > 0) {
      experimentSummary += '\nBeobachtungen:\n' + observations.map((obs, idx) =>
        `${idx + 1}. Stimmung ${obs.moodBefore ?? '?'}→${obs.moodAfter ?? '?'}, Einsamkeit ${obs.lonelinessBefore}→${obs.lonelinessAfter ?? '?'}, Connection ${obs.connectionNeedBefore}→${obs.connectionNeedAfter ?? '?'}, Libido ${obs.libidoBefore ?? obs.romanticSexualNeedBefore}→${obs.libidoAfter ?? obs.romanticSexualNeedAfter ?? '?'}, Neuheit ${obs.noveltyDriveBefore}→${obs.noveltyDriveAfter ?? '?'}; Handlung: ${obs.actionTaken || 'N/A'}${obs.note ? `; Notiz: ${obs.note}` : ''}`
      ).join('\n');
    } else {
      experimentSummary += '\nNoch keine realen Beobachtungen protokolliert.';
    }
  }

  const motiveChecksSummary = recentMotiveChecks.length > 0
    ? recentMotiveChecks.map((mc, idx) => `${idx + 1}. [${mc.dominantMotive}] Libido: ${mc.libido}, Verbundenheit: ${mc.connection}, Einsamkeit: ${mc.loneliness}, Neuheit: ${mc.novelty}, Bestätigung: ${mc.validation}, Langeweile: ${mc.boredom} -> ${mc.feedbackMessage || ''}`).join('\n')
    : 'Noch keine 10s-Motivchecks erfasst.';

  const situationsSummary = recentSituations.length > 0
    ? recentSituations.map((s, idx) => `Situation ${idx + 1} — ${s.title}:\n• Ereignis: ${s.objectiveEvent}\n• Erwartung: ${s.expectation || 'N/A'}\n• Gefühl: ${s.actualFeeling || 'N/A'}\n• Gedanke: ${s.automaticThoughts}\n• Reaktion: ${s.behaviorReaction}\n• Langfristige offene Frage/Folge: ${s.longTermConsequence || 'N/A'}`).join('\n')
    : 'Keine kürzlichen Situationsanalysen.';

  const sessionSummaryText = recentSummaries.length > 0
    ? recentSummaries.map((sum, idx) => `Sitzung ${idx + 1}: Hauptthema ${sum.mainIssue}; Erkenntnis: ${sum.keyInsight || 'offen'}; Aufgabe: ${sum.homework || 'keine'}`).join('\n')
    : 'Keine früheren Sitzungszusammenfassungen.';

  const systemPrompt = `
Du bist "Meine KVT", ein strukturierter KI-Therapie-Begleiter für einen einzelnen Patienten (${profile.displayName}, Zeitzone: ${profile.timezone}).
Primärer Rahmen: Kognitive Verhaltenstherapie (KVT/CBT). Ergänzend werden ACT, Positive-Affect-/Reward-Arbeit, Schema- und interpersonelle/CBASP-orientierte Elemente ausschließlich plan- und phasenbezogen eingesetzt.

═══════════════════════════════════════════════════════════════
1. AKTUELLER THERAPIEPLAN — STEUERUNGSRAHMEN
═══════════════════════════════════════════════════════════════
${planSummary}

AKTUELLE PHASE:
${phaseSummary}

MODULE DIESER PHASE:
${modulesSummary}

LETZTER FORMALER PLAN-REVIEW:
${planReviewSummary}

═══════════════════════════════════════════════════════════════
2. KLINISCHE DATEN & VERLAUFSKONTEXT
═══════════════════════════════════════════════════════════════
TÄGLICHE CHECK-INS (letzte Tage):
${checkinSummary}

THERAPIEZIELE:
${goalsSummary}

FALLFORMULIERUNG (${currentFormulation?.version || 'keine Version'}):
${currentFormulation?.summary || 'Noch keine Fallformulierung.'}

ARBEITSHYPOTHESEN:
${hypothesesSummary}

AKTIVES EXPERIMENT (Phase 1):
${experimentSummary}

JÜNGSTE 10s-MOTIVCHECKS (Tinder/Dating-App Funktionsanalyse):
${motiveChecksSummary}

JÜNGSTE SITUATIONEN:
${situationsSummary}

LETZTE SITZUNGEN:
${sessionSummaryText}

═══════════════════════════════════════════════════════════════
3. SITZUNGSMODUS: ${sessionType.toUpperCase()}
═══════════════════════════════════════════════════════════════
${sessionType === 'weekly'
  ? `Wöchentliche Struktursitzung:\n1. Kurzer Safety-/Zustandscheck.\n2. Daten, Motivchecks und Experiment seit letzter Sitzung reviewen.\n3. Gemeinsame Agenda.\n4. Eine Intervention passend zur aktuellen Phase.\n5. Höchstens einen primären experimentellen Schritt vereinbaren.\n6. Prüfen, ob ein Plan-Review nötig ist.`
  : sessionType === 'focused'
  ? 'Fokussierte Bearbeitung eines konkreten Themas mit Bezug zur aktuellen Phase. Wenn das Thema klar außerhalb der Phase liegt, zunächst begründen, ob eine Planabweichung sinnvoll ist.'
  : 'Kurze pragmatische Klärung eines akuten Impulses. Keine neue große Therapieagenda eröffnen.'}

═══════════════════════════════════════════════════════════════
4. THERAPEUTISCHE HALTUNG
═══════════════════════════════════════════════════════════════
- Epistemische Bescheidenheit: Fakten, Selbstbericht, Interpretation und Arbeitshypothese klar unterscheiden.
- Funktionsanalyse vor Verhaltensbewertung: Dating-App-Impulse dienen distinkten Motiven (Sex/Libido, Verbundenheit, Einsamkeitsregulation, Neuheit/Thrill, Bestätigung, Langeweile). Echte sexuelle Motivation ist gesund und normal und wird niemals problematisiert oder als Pathologie behandelt!
- Präzise und sokratisch: jeweils 1–2 fokussierte Fragen statt Textwüsten.
- Datenbezug: konkrete Check-ins, Situationen, Motiv-Checks und Experimente nutzen.
- Von Einsicht zu Verhalten: Analyse soll in Beobachtung, Experiment oder wertebezogene Handlung münden.
- Keine automatischen medizinischen oder Persönlichkeitsdiagnosen.
- Keine Medikamentenänderungen anweisen.
`;

  return {
    systemPrompt: systemPrompt.trim(),
    summaryContext: {
      latestCheckin: checkins[0] || null,
      activeGoalsCount: goals.length,
      activeHypothesesCount: activeHypotheses.length,
      activeExperiment: activeExp,
      observationsCount: observations.length,
      activePlan,
      activePhase,
      activeModules,
    },
  };
}
