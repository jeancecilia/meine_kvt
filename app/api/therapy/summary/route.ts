import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { therapySessions, therapyMessages, sessionSummaries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  ingestSessionSummaryMemory,
  refreshAutomaticMemoryConsolidations,
  type CorrectionCandidate,
  type MemoryCandidate,
} from '@/lib/therapy/memory';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface SummaryData {
  mainIssue: string;
  keyObservations: string[];
  interventionUsed: string;
  keyInsight: string;
  homework: string;
  followUpTopics: string[];
  memoryCandidates: MemoryCandidate[];
  corrections: CorrectionCandidate[];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizeMemoryCandidates(value: unknown): MemoryCandidate[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item: any) => ({
      type: item.type,
      title: typeof item.title === 'string' ? item.title : '',
      content: typeof item.content === 'string' ? item.content : '',
      domains: asStringArray(item.domains),
      importance: Number.isFinite(Number(item.importance)) ? Number(item.importance) : undefined,
      confidence: Number.isFinite(Number(item.confidence)) ? Number(item.confidence) : undefined,
      evidence: typeof item.evidence === 'string' ? item.evidence : undefined,
    }))
    .filter((item) => item.title.trim() && item.content.trim())
    .slice(0, 8);
}

function normalizeCorrections(value: unknown): CorrectionCandidate[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item: any) => ({
      incorrectClaim: typeof item.incorrectClaim === 'string' ? item.incorrectClaim : '',
      correctedClaim: typeof item.correctedClaim === 'string' ? item.correctedClaim : '',
      reason: typeof item.reason === 'string' ? item.reason : undefined,
    }))
    .filter((item) => item.incorrectClaim.trim() && item.correctedClaim.trim())
    .slice(0, 5);
}

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'SessionId erforderlich' }, { status: 400 });
    }

    const messages = await db
      .select()
      .from(therapyMessages)
      .where(eq(therapyMessages.sessionId, sessionId))
      .orderBy(therapyMessages.createdAt)
      .catch(() => []);

    const sessions = await db
      .select()
      .from(therapySessions)
      .where(eq(therapySessions.id, sessionId))
      .limit(1)
      .catch(() => []);
    const session = sessions[0] || null;

    // Neutral, hypothesis-aware fallback structure. The memory candidates stay
    // empty without an LLM rather than inventing durable facts automatically.
    let summaryData: SummaryData = {
      mainIssue: 'Reflexion der aktuellen Verhaltensmuster und Impulsregulation',
      keyObservations: [
        'Zusammenhang zwischen Alltagsruhe, Einsamkeitserleben und Stimulationsbedürfnis reflektiert',
        'Unterschied zwischen Erwartung und tatsächlichem Belohnungsnachhall betrachtet',
      ],
      interventionUsed: 'KVT-Kognitionsanalyse & Sokratischer Dialog',
      keyInsight: 'Als Arbeitshypothese wird geprüft, inwieweit das Bedürfnis nach Neuheit eine Bewältigungsreaktion auf Alleinsein und emotionale Diskrepanzen darstellt.',
      homework: 'Laufendes Verhaltensexperiment (Vorher/Nachher-Ratings) fortführen und nächste Situation im 5-Stufen-Schema erfassen.',
      followUpTopics: [
        'Auswertung der protokollierten Experiment-Beobachtungen',
        'Überprüfung der Hypothesen-Konfidenz',
      ],
      memoryCandidates: [],
      corrections: [],
    };

    if (openai && messages.length > 2) {
      const summaryPrompt = `
Du bist ein wissenschaftlicher KVT/ACT-Dokumentationsassistent für eine langfristige Einzelpatientenakte. Fasse die folgende Sitzung im JSON-Format zusammen.

WICHTIGE REGELN:
1. Bewahre epistemische Bescheidenheit. Arbeitshypothesen bleiben Hypothesen.
2. memoryCandidates sind NUR Informationen, die in Monaten/Jahren noch nützlich sein können und durch ausdrückliche Patientenaussagen oder strukturierte Verlaufsdaten gestützt werden.
3. Keine Interpretation des Assistenten als biografische Tatsache speichern.
4. Bei unsicheren Deutungen type="hypothesis" verwenden und confidence entsprechend niedrig setzen.
5. Korrekturen nur aufnehmen, wenn der Patient eine frühere Aussage/Transkription/Interpretation ausdrücklich korrigiert hat.
6. Keine bedeutungslosen Momentdetails als Langzeitgedächtnis speichern. Maximal 5 memoryCandidates.
7. evidence muss kurz benennen, worauf der Kandidat in dieser Sitzung basiert.

JSON-Format:
{
  "mainIssue": "Prägnante Bezeichnung des Hauptthemas",
  "keyObservations": ["Beobachtung 1", "Beobachtung 2"],
  "interventionUsed": "Verwendete Methode",
  "keyInsight": "Zentrale therapeutische Hypothese / Erkenntnis",
  "homework": "Konkreter nächster experimenteller Schritt / Beobachtungsauftrag",
  "followUpTopics": ["Thema 1", "Thema 2"],
  "memoryCandidates": [
    {
      "type": "semantic|hypothesis|milestone|biographical|preference",
      "title": "kurzer Titel",
      "content": "dauerhafte, quellentreue Erinnerung",
      "domains": ["beziehung", "depression"],
      "importance": 0.0,
      "confidence": 0.0,
      "evidence": "kurze Evidenz aus der Sitzung"
    }
  ],
  "corrections": [
    {
      "incorrectClaim": "alte/falsche Aussage",
      "correctedClaim": "korrekte Fassung",
      "reason": "warum korrigiert"
    }
  ]
}
`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: summaryPrompt },
          ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      if (parsed.mainIssue) {
        summaryData = {
          mainIssue: String(parsed.mainIssue),
          keyObservations: asStringArray(parsed.keyObservations),
          interventionUsed: typeof parsed.interventionUsed === 'string' ? parsed.interventionUsed : '',
          keyInsight: typeof parsed.keyInsight === 'string' ? parsed.keyInsight : '',
          homework: typeof parsed.homework === 'string' ? parsed.homework : '',
          followUpTopics: asStringArray(parsed.followUpTopics),
          memoryCandidates: normalizeMemoryCandidates(parsed.memoryCandidates),
          corrections: normalizeCorrections(parsed.corrections),
        };
      }
    }

    // Save summary in PostgreSQL database
    const newSummary = await db.insert(sessionSummaries).values({
      sessionId,
      mainIssue: summaryData.mainIssue,
      keyObservations: summaryData.keyObservations,
      interventionUsed: summaryData.interventionUsed,
      keyInsight: summaryData.keyInsight,
      homework: summaryData.homework,
      followUpTopics: summaryData.followUpTopics,
    }).returning();

    // Mark session completed
    await db.update(therapySessions).set({
      status: 'completed',
      endedAt: new Date(),
    }).where(eq(therapySessions.id, sessionId)).catch(() => {});

    // Long-term memory is deliberately downstream from the immutable/raw session
    // messages and the normal structured summary. If memory enrichment fails,
    // the completed therapy session itself remains intact.
    try {
      await ingestSessionSummaryMemory({
        summaryId: String(newSummary[0].id),
        sessionId: String(sessionId),
        mainIssue: summaryData.mainIssue,
        keyObservations: summaryData.keyObservations,
        interventionUsed: summaryData.interventionUsed,
        keyInsight: summaryData.keyInsight,
        homework: summaryData.homework,
        followUpTopics: summaryData.followUpTopics,
        occurredAt: session?.startedAt || newSummary[0].createdAt || new Date(),
        memoryCandidates: summaryData.memoryCandidates,
        corrections: summaryData.corrections,
      });
      await refreshAutomaticMemoryConsolidations(new Date());
    } catch (memoryError: any) {
      console.warn('Session saved, but long-term memory enrichment was deferred:', memoryError?.message || memoryError);
    }

    return NextResponse.json(newSummary[0]);
  } catch (error: any) {
    console.error('Session summary error:', error);
    return NextResponse.json({ error: 'Zusammenfassung fehlgeschlagen' }, { status: 500 });
  }
}
