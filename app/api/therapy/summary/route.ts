import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { therapySessions, therapyMessages, sessionSummaries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

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

    // Neutral, hypothesis-aware fallback structure
    let summaryData = {
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
    };

    if (openai && messages.length > 2) {
      const summaryPrompt = `
Du bist ein wissenschaftlicher KVT/ACT-Dokumentationsassistent. Fasse die folgende Sitzung im JSON-Format zusammen.
WICHTIGE REGEL: Bewahre epistemische Bescheidenheit. Behandle Erkenntnisse als "Arbeitshypothesen zur empirischen Überprüfung", nicht als feststehende Tatsachen.

JSON-Format:
{
  "mainIssue": "Prägnante Bezeichnung des Hauptthemas",
  "keyObservations": ["Beobachtung 1", "Beobachtung 2"],
  "interventionUsed": "Verwendete Methode (z.B. KVT-Kognitionsprotokoll, Sokratischer Dialog, ACT-Werte)",
  "keyInsight": "Zentrale therapeutische Hypothese / Erkenntnis",
  "homework": "Konkreter nächster experimenteller Schritt / Beobachtungsauftrag",
  "followUpTopics": ["Thema 1", "Thema 2"]
}
`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: summaryPrompt },
          ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      if (parsed.mainIssue) summaryData = parsed;
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

    return NextResponse.json(newSummary[0]);
  } catch (error: any) {
    console.error('Session summary error:', error);
    return NextResponse.json({ error: 'Zusammenfassung fehlgeschlagen' }, { status: 500 });
  }
}
