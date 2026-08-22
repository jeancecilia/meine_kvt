import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db, ensureDatabaseReady } from '@/lib/db';
import { therapySessions, therapyMessages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { buildTherapyContext } from '@/lib/therapy/context';
import { evaluateSafetyRisk } from '@/lib/therapy/safety';
import { ensureFocusedSessionMemory20260817 } from '@/lib/therapy/focused-session-memory';
import { ensureFocusedSessionMemory20260822 } from '@/lib/therapy/focused-session-memory-2026-08-22';
import { syncLongitudinalHistory } from '@/lib/therapy/memory-history';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const { sessionId, sessionType, message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Nachricht erforderlich' }, { status: 400 });
    }

    const safetyCheck = evaluateSafetyRisk(message);
    if (safetyCheck.isHighRisk) {
      return NextResponse.json({
        sessionId,
        reply: safetyCheck.deescalationMessage,
        isHighRisk: true,
        resources: safetyCheck.resources,
      });
    }

    // Guarantee that the treatment-plan schema and v0.1 seeds exist before the
    // therapy context or a new session tries to reference them.
    await ensureDatabaseReady();

    // Persist structured learnings imported from the surrounding ChatGPT work
    // before generating future therapy responses. Imports are idempotent and
    // intentionally contain structured memory rather than verbatim transcripts.
    await ensureFocusedSessionMemory20260817();
    await ensureFocusedSessionMemory20260822();

    // Snapshot hypothesis revisions and the current/completed treatment phases
    // before retrieval so changes remain reconstructable months or years later.
    await syncLongitudinalHistory(new Date()).catch((error) => {
      console.warn('Longitudinal history sync deferred:', error?.message || error);
    });

    // The current user message is the retrieval query. This lets an old but
    // relevant episode from months ago re-enter context even when it is not one
    // of the three most recent session summaries.
    const contextData = await buildTherapyContext(sessionType || 'weekly', message);

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const plan = contextData.summaryContext.activePlan;
      const phase = contextData.summaryContext.activePhase;
      const newSession = await db.insert(therapySessions).values({
        treatmentPlanId: plan?.id || null,
        treatmentPhaseId: phase?.id || null,
        sessionType: sessionType || 'weekly',
        mainTopic: sessionType === 'weekly'
          ? `Wöchentliche Struktursitzung${phase ? ` – Phase ${phase.phaseNumber}: ${phase.title}` : ''}`
          : sessionType === 'quick'
          ? 'Akute Kurzintervention'
          : `Fokussierte Themenanalyse${phase ? ` – ${phase.title}` : ''}`,
        status: 'active',
      }).returning();
      currentSessionId = newSession[0].id;
    }

    const previousMessages = await db
      .select()
      .from(therapyMessages)
      .where(eq(therapyMessages.sessionId, currentSessionId))
      .orderBy(therapyMessages.createdAt)
      .catch(() => []);

    await db.insert(therapyMessages).values({
      sessionId: currentSessionId,
      role: 'user',
      content: message,
    }).catch((err) => console.warn('Could not save user message:', err?.message));

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
        temperature: 0.6,
        max_tokens: 900,
      });

      assistantReply = completion.choices[0]?.message?.content || 'Ich habe deine Nachricht erfasst. Lass uns sie innerhalb unserer aktuellen Therapiephase strukturiert prüfen.';
    } else {
      const expName = contextData.summaryContext.activeExperiment?.title || 'das aktuelle Experiment';
      const phase = contextData.summaryContext.activePhase;
      assistantReply = `Wir bleiben bei unserer aktuellen Arbeitshypothese und prüfen sie anhand der Daten statt sie vorauszusetzen.\n\n${phase ? `Aktuelle Phase: **Phase ${phase.phaseNumber} – ${phase.title}**.` : ''}\nAktuelles Experiment: **${expName}**.\n\nWas war unmittelbar vor dem Impuls stärker: Einsamkeit/Verbundenheitsbedarf, romantisch-sexuelles Interesse oder der Wunsch nach Neuheit? Und wie hoch waren diese drei Komponenten jeweils von 0–10?`;
    }

    await db.insert(therapyMessages).values({
      sessionId: currentSessionId,
      role: 'assistant',
      content: assistantReply,
    }).catch((err) => console.warn('Could not save assistant message:', err?.message));

    return NextResponse.json({
      sessionId: currentSessionId,
      reply: assistantReply,
      treatmentPlan: contextData.summaryContext.activePlan,
      treatmentPhase: contextData.summaryContext.activePhase,
    });
  } catch (error: any) {
    console.error('Therapy chat error:', error);
    return NextResponse.json(
      { error: 'Fehler im Therapie-Chat', detail: error?.message || String(error) },
      { status: 500 },
    );
  }
}
