import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { therapySessions, therapyMessages, dailyCheckins, hypotheses, experiments, sessionSummaries } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const { sessionId, sessionType, message } = await request.json();

    // 1. Ensure or create therapy session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const newSession = await db.insert(therapySessions).values({
        sessionType: sessionType || 'weekly',
        mainTopic: sessionType === 'weekly' ? 'Wöchentliche KVT/ACT Struktursitzung' : 'Fokussierte Kognitionsanalyse',
        status: 'active',
      }).returning();
      currentSessionId = newSession[0].id;
    }

    // 2. Fetch clinical context from database
    const latestCheckins = await db.select().from(dailyCheckins).orderBy(desc(dailyCheckins.date)).limit(5);
    const activeHypotheses = await db.select().from(hypotheses).where(eq(hypotheses.status, 'active'));
    const activeExperiments = await db.select().from(experiments).where(eq(experiments.status, 'active'));
    const pastSummaries = await db.select().from(sessionSummaries).orderBy(desc(sessionSummaries.createdAt)).limit(3);
    const previousMessages = await db.select().from(therapyMessages).where(eq(therapyMessages.sessionId, currentSessionId)).orderBy(therapyMessages.createdAt);

    // Save user message to database
    await db.insert(therapyMessages).values({
      sessionId: currentSessionId,
      role: 'user',
      content: message,
    });

    // 3. Construct clinical system prompt
    const systemPrompt = `
Du bist "Meine KVT", ein hochkompetenter, strukturierter KI-Therapie-Begleiter für einen einzelnen Patienten.
Dein primärer theoretischer Rahmen ist Kognitive Verhaltenstherapie (KVT/CBT), ergänzt durch Akzeptanz- und Commitment-Therapie (ACT), Positive Affect Treatment (PAT / Belohnungsfokussierung) und Schematherapie.

PATIENTEN-KONTEXT & THERAPEUTISCHES MODELL:
- T0-Baseline: Stimmung 5.5, Erfüllung 4.0, Einsamkeit 7.0, Innere Ruhe 5.0, Positiver Affekt 4.0, Grübeln 6.5, Zukunftsangst 6.0, Neuheitsdrang 7.0, Energie 6.0, Lebenszufriedenheit 5.0.
- Zentrale Arbeitshypothesen:
  1. ADHS-assoziiertes Belohnungsmuster: Belohnungssystem reagiert stark auf Neuheit; Habituation wird fälschlich als Sinnverlust interpretiert.
  2. Erwartungs-Erlebens-Diskrepanz: Objektive Erfolge (z.B. Masterabschluss) erzeugen weniger Euphorie als erwartet -> Selbstbeobachtung ("Warum fühle ich mich nicht glücklicher?") -> Grübeln senkt die Stimmung weiter.
- Aktives Experiment: "Connection vs. Novelty" (Vor Tinder/Stimulation bei Einsamkeit 15-30 Min. mit einem Vertrauten sprechen).
- Therapieziele v0.1: Positiven Affekt entwickeln, Einsamkeits-Entkopplung von ständiger Neuheit, Schleife "mehr/neu" verändern.

SITZUNGSMODUS: ${sessionType || 'weekly'}
- "weekly": 1. Check-in & Experiment-Review, 2. Agenda festlegen, 3. Gezielte KVT/PAT-Intervention, 4. Nächsten experimentellen Schritt vereinbaren.
- "focused": Fokussierte Bearbeitung eines konkreten Schemas oder Erlebnisses.
- "quick": Akute Situationsklärung (z.B. akuter Einsamkeits- oder Dating-Impuls, max 5-10 Minuten).

KOMMUNIKATIONSREGELN:
- Antworte präzise, empathisch, sokratisch-leitend und auf den Punkt auf Deutsch.
- Vermeide allgemeines Chatbot-Geplänkel oder endlose Monologe. Stelle jeweils 1-2 gezielte, strukturierte Fragen.
- Halte die Unterscheidung zwischen Wollen, Erreichen und emotionalem Genuss präsent.
- Keine automatischen medizinischen Diagnosen stellen.
`;

    let assistantReply = '';

    if (openai) {
      const messagesPayload: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...previousMessages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messagesPayload,
        temperature: 0.7,
        max_tokens: 800,
      });

      assistantReply = completion.choices[0]?.message?.content || 'Ich habe deine Nachricht erhalten. Lass uns das strukturiert analysieren.';
    } else {
      // Intelligent clinical fallback response when OPENAI_API_KEY is not configured yet
      assistantReply = `Ich habe deine Gedanken erfasst. Lass uns das im Kontext unseres KVT-Modells betrachten:

1. **Beobachtung:** Du beschreibst hier genau die Schnittstelle zwischen deinem aktuellen Zustand und dem Impuls nach Veränderung bzw. Stimulation.
2. **Funktionale Analyse:** Welcher Gedanke ging diesem Impuls unmittelbar voraus? War es eher ein *„Ich halte dieses Alleinsein/diese Ruhe gerade schwer aus“* oder ein echtes, ruhiges Bedürfnis nach Kontakt?
3. **Experimenteller Test:** Hast du für diese Situation bereits unser Experiment *„Connection vs. Novelty“* im Kopf gehabt?

Wie intensiv schätzt du deine Einsamkeit und deinen Drang nach Neuem in genau diesem Augenblick auf einer Skala von 0 bis 10 ein?`;
    }

    // Save assistant reply to database
    await db.insert(therapyMessages).values({
      sessionId: currentSessionId,
      role: 'assistant',
      content: assistantReply,
    });

    return NextResponse.json({
      sessionId: currentSessionId,
      reply: assistantReply,
    });
  } catch (error) {
    console.error('Therapy chat error:', error);
    return NextResponse.json({ error: 'Fehler im Therapie-Chat' }, { status: 500 });
  }
}
