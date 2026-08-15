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
} from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export interface TherapyContextData {
  systemPrompt: string;
  summaryContext: {
    latestCheckin: any;
    activeGoalsCount: number;
    activeHypothesesCount: number;
    activeExperiment: any;
    observationsCount: number;
  };
}

export async function buildTherapyContext(sessionType: string = 'weekly'): Promise<TherapyContextData> {
  // 1. Fetch Patient Profile
  const profiles = await db.select().from(patientProfile).limit(1).catch(() => []);
  const profile = profiles[0] || { displayName: 'Patient', timezone: 'Europe/Berlin' };

  // 2. Fetch Recent Check-ins (Last 7 entries)
  const checkins = await db
    .select()
    .from(dailyCheckins)
    .orderBy(desc(dailyCheckins.date))
    .limit(7)
    .catch(() => []);

  // 3. Fetch Active Therapy Goals
  const goals = await db
    .select()
    .from(therapyGoals)
    .where(eq(therapyGoals.status, 'active'))
    .orderBy(therapyGoals.orderIndex)
    .catch(() => []);

  // 4. Fetch Latest Case Formulation
  const formulations = await db
    .select()
    .from(caseFormulations)
    .orderBy(desc(caseFormulations.createdAt))
    .limit(1)
    .catch(() => []);
  const currentFormulation = formulations[0] || null;

  // 5. Fetch Active Hypotheses
  const activeHypotheses = await db
    .select()
    .from(hypotheses)
    .where(eq(hypotheses.status, 'active'))
    .orderBy(desc(hypotheses.confidence))
    .catch(() => []);

  // 6. Fetch Active Experiments & Observations
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
      .limit(5)
      .catch(() => []);
  }

  // 7. Fetch Recent Situations (Last 3)
  const recentSituations = await db
    .select()
    .from(situations)
    .orderBy(desc(situations.occurredAt))
    .limit(3)
    .catch(() => []);

  // 8. Fetch Recent Session Summaries (Last 2)
  const recentSummaries = await db
    .select()
    .from(sessionSummaries)
    .orderBy(desc(sessionSummaries.createdAt))
    .limit(2)
    .catch(() => []);

  // Format Check-in Data
  const checkinSummary = checkins.length > 0
    ? checkins.map((c) => {
        return `• Datum: ${c.date} | Stimmung: ${c.mood}, Erfüllung: ${c.fulfillment}, Einsamkeit: ${c.loneliness}, Innere Ruhe: ${c.innerCalm}, Freude: ${c.joy}, Grübeln: ${c.rumination}, Zukunftsangst: ${c.futureAnxiety}, Neuheitsdrang: ${c.noveltyDrive}, Energie: ${c.energy}, Lebenszufriedenheit: ${c.lifeSatisfaction}${c.note ? ` (Notiz: "${c.note}")` : ''}`;
      }).join('\n')
    : 'Noch keine aktuellen Check-ins in der Datenbank erfasst.';

  // Format Goals
  const goalsSummary = goals.length > 0
    ? goals.map((g, idx) => `${idx + 1}. ${g.title}: ${g.description}`).join('\n')
    : 'Keine aktiven Ziele definiert.';

  // Format Hypotheses with actual dynamic confidence
  const hypothesesSummary = activeHypotheses.length > 0
    ? activeHypotheses.map((h) => {
        const confPercent = Math.round(Number(h.confidence) * 100);
        return `• [${h.id}] ${h.title} (Vertrauen: ${confPercent}%): ${h.description}`;
      }).join('\n')
    : 'Keine aktiven Hypothesen hinterlegt.';

  // Format Active Experiment & Observations
  let experimentSummary = 'Kein aktives Experiment.';
  if (activeExp) {
    experimentSummary = `Titel: ${activeExp.title}\n• Hypothese: ${activeExp.hypothesis}\n• Erwartete Vorhersage: ${activeExp.prediction}\n• Handlungsauftrag: ${activeExp.instructions || 'N/A'}\n• Laufzeit: ${activeExp.startDate} bis ${activeExp.endDate}`;
    if (observations.length > 0) {
      experimentSummary += '\n• Bisherige Beobachtungen:\n' + observations.map((obs, idx) => {
        return `  ${idx + 1}. Auslöser: "${obs.triggerSituation || 'Einsamkeitsimpuls'}" -> Stimmung: ${obs.moodBefore ?? '?'}->${obs.moodAfter ?? '?'}, Einsamkeit: ${obs.lonelinessBefore}->${obs.lonelinessAfter ?? '?'}, Connection-Bedarf: ${obs.connectionNeedBefore}->${obs.connectionNeedAfter ?? '?'}, Romantik/Frau: ${obs.romanticSexualNeedBefore}->${obs.romanticSexualNeedAfter ?? '?'}, Neuheit: ${obs.noveltyDriveBefore}->${obs.noveltyDriveAfter ?? '?'}. Handlung: "${obs.actionTaken || 'N/A'}". ${obs.note ? `Notiz: "${obs.note}"` : ''}`;
      }).join('\n');
    } else {
      experimentSummary += '\n• Noch keine Beobachtungen protokolliert.';
    }
  }

  // Format Recent Situations
  const situationsSummary = recentSituations.length > 0
    ? recentSituations.map((s, idx) => {
        return `Situation ${idx + 1} (${s.title}):\n  • Ereignis: ${s.objectiveEvent}\n  • Erwartung: "${s.expectation || 'N/A'}" vs. Gefühl: "${s.actualFeeling || 'N/A'}"\n  • Automatischer Gedanke: "${s.automaticThoughts}"\n  • Reaktion: "${s.behaviorReaction}"\n  • Konsequenz (kurz/lang): "${s.shortTermConsequence || 'N/A'}" / "${s.longTermConsequence || 'N/A'}"`;
      }).join('\n')
    : 'Keine kürzlichen Situationsanalysen.';

  // Format Session Summaries
  const sessionSummaryText = recentSummaries.length > 0
    ? recentSummaries.map((sum, idx) => {
        return `Sitzung ${idx + 1}:\n  • Hauptthema: ${sum.mainIssue}\n  • Erkenntnis: ${sum.keyInsight}\n  • Vereinbarte Hausaufgabe: ${sum.homework}`;
      }).join('\n')
    : 'Keine früheren Sitzungszusammenfassungen.';

  // Build Dynamic Prompt
  const systemPrompt = `
Du bist "Meine KVT", ein hochkompetenter, evidenzbasierter KI-Therapie-Begleiter für einen einzelnen Patienten (${profile.displayName}, Zeitzone: ${profile.timezone}).
Dein theoretischer Rahmen ist Kognitive Verhaltenstherapie (KVT/CBT), Akzeptanz- und Commitment-Therapie (ACT), Positive Affect Treatment (PAT / Belohnungsfokussierung) und Schematherapie.

═══════════════════════════════════════════════════════════════
AKTUELLER DYNAMISCHER PATIENTEN- UND DATENBANK-KONTEXT:
═══════════════════════════════════════════════════════════════

1. AKTUELLE CHECK-IN VERLÄUFE (Letzte Tage aus DB):
${checkinSummary}

2. THERAPIEZIELE (v0.1 aus DB):
${goalsSummary}

3. KLINISCHE FALLFORMULIERUNG (${currentFormulation?.version || 'v0.1'}):
${currentFormulation?.summary || 'Erfolgsorientierter Patient mit hoher Stimulationsaffinität und Erwartungs-Erlebens-Diskrepanzen.'}

4. AKTIVE ARBEITSHYPOTHESEN (aus DB):
${hypothesesSummary}

5. AKTIVES VERHALTENSEXPERIMENT & BEOBACHTUNGEN (aus DB):
${experimentSummary}

6. JÜNGSTE SITUATIONSANALYSEN (aus DB):
${situationsSummary}

7. LETZTE SITZUNGSRÜCKBLICKE:
${sessionSummaryText}

═══════════════════════════════════════════════════════════════
SITZUNGSMODUS: ${sessionType.toUpperCase()}
═══════════════════════════════════════════════════════════════
${
  sessionType === 'weekly'
    ? `• Wöchentliche Struktursitzung:
       1. Begrüßung & Review der letzten Check-in-Werte und des aktiven Experiments.
       2. Gemeinsame Agenda festlegen.
       3. Gezielte KVT/PAT-Intervention zum Hauptthema (Kognitive Umstrukturierung, Wertebezug oder Affekt-Verstärkung).
       4. Nächsten experimentellen Schritt / Beobachtungsauftrag vereinbaren.`
    : sessionType === 'focused'
    ? `• Fokussierte Themenanalyse: Gezielte sokratische Bearbeitung eines spezifischen Themas oder Musters.`
    : `• Akute Kurzintervention: Schnelle, pragmatische Klärung eines akuten Impulses (z.B. Einsamkeit, Dating-Drang, Grübelschleife) in 5-10 Minuten.`
}

═══════════════════════════════════════════════════════════════
THERAPEUTISCHE HALTUNG & KOMMUNIKATIONSREGELN:
═══════════════════════════════════════════════════════════════
- **Epistemische Bescheidenheit:** Behandle Interpretationen und Zusammenhänge strikt als *Arbeitshypothesen*, niemals als feststehende Tatsachen (z.B. „Wir testen aktuell die Hypothese...“ statt „Du tust das nur, um...“).
- **Präzise & sokratisch:** Stelle jeweils 1–2 fokussierte Fragen. Vermeide ausschweifende Textwüsten.
- **Kontextbezug:** Beziehe dich direkt auf die konkreten Daten (z.B. die tatsächlichen Werte aus den Check-ins oder das laufende Experiment 001).
- **Deutsche Sprache:** Klar, empathisch, professionell auf Augenhöhe.
`;

  return {
    systemPrompt: systemPrompt.trim(),
    summaryContext: {
      latestCheckin: checkins[0] || null,
      activeGoalsCount: goals.length,
      activeHypothesesCount: activeHypotheses.length,
      activeExperiment: activeExp,
      observationsCount: observations.length,
    },
  };
}
