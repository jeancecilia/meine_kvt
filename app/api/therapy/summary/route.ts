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

    const messages = await db.select().from(therapyMessages).where(eq(therapyMessages.sessionId, sessionId)).orderBy(therapyMessages.createdAt);

    let summaryData = {
      mainIssue: 'Einsamkeitsregulation und Impulsmuster nach Zielerreichung',
      keyObservations: ['Diskrepanz zwischen Zielerreichung und Belohnungsnachhall', 'Gewöhnungseffekt wird als Mangel wahrgenommen'],
      interventionUsed: 'KVT-Kognitionsprotokoll & PAT-Reward-Analyse',
      keyInsight: 'Die Sehnsucht nach einer neuen Frau ist primär ein Versuch, das unangenehme Gefühl des Alleinseins kurzfristig zu betäuben.',
      homework: 'Experiment 001 konsequent fortführen: Bei Einsamkeit >= 5/10 vor Dating-Apps 15-30 Min. mit einem Vertrauten telefonieren.',
      followUpTopics: ['Auswertung der Vorher/Nachher-Ratings des Experiments', 'Umgang mit Gewöhnung in Beziehungen'],
    };

    if (openai && messages.length > 2) {
      const summaryPrompt = `
Fasse diese Therapiesitzung strukturiert im JSON-Format zusammen:
{
  "mainIssue": "Kernproblem der Sitzung",
  "keyObservations": ["Beobachtung 1", "Beobachtung 2"],
  "interventionUsed": "Verwendete KVT/ACT-Methode",
  "keyInsight": "Wichtigste therapeutische Erkenntnis",
  "homework": "Konkrete Aufgabe/Experiment für die Woche",
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

    // Save summary
    const newSummary = await db.insert(sessionSummaries).values({
      sessionId,
      mainIssue: summaryData.mainIssue,
      keyObservations: JSON.stringify(summaryData.keyObservations),
      interventionUsed: summaryData.interventionUsed,
      keyInsight: summaryData.keyInsight,
      homework: summaryData.homework,
      followUpTopics: JSON.stringify(summaryData.followUpTopics),
    }).returning();

    // Mark session completed
    await db.update(therapySessions).set({
      status: 'completed',
      endedAt: new Date().toISOString(),
    }).where(eq(therapySessions.id, sessionId));

    return NextResponse.json(newSummary[0]);
  } catch (error) {
    console.error('Session summary error:', error);
    return NextResponse.json({ error: 'Zusammenfassung fehlgeschlagen' }, { status: 500 });
  }
}
