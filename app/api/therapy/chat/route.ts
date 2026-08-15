import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { therapySessions, therapyMessages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { buildTherapyContext } from '@/lib/therapy/context';
import { evaluateSafetyRisk } from '@/lib/therapy/safety';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const { sessionId, sessionType, message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Nachricht erforderlich' }, { status: 400 });
    }

    // 1. Safety Pre-Check
    const safetyCheck = evaluateSafetyRisk(message);
    if (safetyCheck.isHighRisk) {
      return NextResponse.json({
        sessionId,
        reply: safetyCheck.deescalationMessage,
        isHighRisk: true,
        resources: safetyCheck.resources,
      });
    }

    // 2. Ensure or create therapy session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const newSession = await db.insert(therapySessions).values({
        sessionType: sessionType || 'weekly',
        mainTopic: sessionType === 'weekly' ? 'Wöchentliche KVT/ACT Struktursitzung' : 'Fokussierte Kognitionsanalyse',
        status: 'active',
      }).returning();
      currentSessionId = newSession[0].id;
    }

    // 3. Build Dynamic Therapy Context directly from PostgreSQL database
    const contextData = await buildTherapyContext(sessionType || 'weekly');

    // Fetch previous messages for this session
    const previousMessages = await db
      .select()
      .from(therapyMessages)
      .where(eq(therapyMessages.sessionId, currentSessionId))
      .orderBy(therapyMessages.createdAt)
      .catch(() => []);

    // Save user message to database
    await db.insert(therapyMessages).values({
      sessionId: currentSessionId,
      role: 'user',
      content: message,
    }).catch((err) => console.warn('Could not save user message:', err?.message));

    // 4. Generate Assistant Response
    let assistantReply = '';

    if (openai) {
      const messagesPayload: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: contextData.systemPrompt },
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
      // Dynamic, epistemically humble fallback response that quotes actual data
      const expName = contextData.summaryContext.activeExperiment?.title || 'unser aktives Experiment';
      assistantReply = `Ich habe deine Schilderung erfasst. Lass uns das im Lichte unserer aktuellen Datenbankdaten betrachten:

1. **Beobachtung & Einordnung:** Du beschreibst hier einen konkreten Moment zwischen deinem aktuellen Zustand und dem Impuls nach Veränderung bzw. Stimulation.
2. **Arbeitshypothese prüfen:** Als offene Arbeitshypothese untersuchen wir aktuell, ob das Bedürfnis primär zwischenmenschliche Verbundenheit oder eher neurobiologische Neuheit ist.
3. **Experimenteller Bezug (${expName}):** Welche Beobachtung machst du bezüglich deiner aktuellen Stimmung und Einsamkeit im Vergleich zu unserem Testauftrag?

Wie intensiv schätzt du deine Einsamkeit und deinen Drang nach Neuem in genau diesem Moment ein?`;
    }

    // Save assistant reply to database
    await db.insert(therapyMessages).values({
      sessionId: currentSessionId,
      role: 'assistant',
      content: assistantReply,
    }).catch((err) => console.warn('Could not save assistant message:', err?.message));

    return NextResponse.json({
      sessionId: currentSessionId,
      reply: assistantReply,
    });
  } catch (error: any) {
    console.error('Therapy chat error:', error);
    return NextResponse.json({ error: 'Fehler im Therapie-Chat' }, { status: 500 });
  }
}
