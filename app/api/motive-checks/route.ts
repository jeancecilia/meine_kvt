import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabaseReady } from '@/lib/db';
import { motiveChecks } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const revalidate = 0;

export async function GET() {
  try {
    await ensureDatabaseReady();

    const items = await db
      .select()
      .from(motiveChecks)
      .orderBy(desc(motiveChecks.occurredAt))
      .limit(50);

    const totalCount = items.length;
    const distribution: Record<string, number> = {
      sexual: 0,
      connection_loneliness: 0,
      novelty_validation: 0,
      boredom: 0,
      mixed: 0,
    };

    items.forEach((item) => {
      const motive = item.dominantMotive || 'mixed';
      distribution[motive] = (distribution[motive] || 0) + 1;
    });

    return NextResponse.json({
      items,
      totalCount,
      distribution,
      sampleTarget: 20,
    });
  } catch (error: any) {
    console.error('Error fetching motive checks:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch motive checks' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseReady();

    const body = await req.json();
    const libido = parseFloat(body.libido ?? 0);
    const connection = parseFloat(body.connection ?? 0);
    const loneliness = parseFloat(body.loneliness ?? 0);
    const novelty = parseFloat(body.novelty ?? 0);
    const validation = parseFloat(body.validation ?? 0);
    const datingIntent = parseFloat(body.datingIntent ?? 0);
    const boredom = parseFloat(body.boredom ?? 0);
    const appName = body.appName || 'Tinder';
    const note = body.note || null;

    // CBT Motive Classification & Functional Routing Logic
    let dominantMotive: string = 'mixed';
    let experimentTriggered = 0;
    let feedbackMessage = '';

    const hasHighConnectionNeed = loneliness >= 5 || connection >= 5;
    const hasHighLibido = libido >= 6;
    const hasHighNoveltyOrValidation = novelty >= 7 || validation >= 7;
    const hasHighBoredom = boredom >= 7;

    if (hasHighConnectionNeed) {
      // Functional Target for Experiment 001
      dominantMotive = hasHighLibido ? 'mixed' : 'connection_loneliness';
      experimentTriggered = 1;
      feedbackMessage =
        `Einsamkeits-/Verbundenheitsanteil erkannt (Einsamkeit: ${loneliness}/10, Verbundenheit: ${connection}/10). ` +
        `Experiment 001 empfohlen: 15–30 Min. soziale Verbindung herstellen (Freund/Familie anrufen), danach Vorher/Nachher-Werte vergleichen. Dating ist danach uneingeschränkt erlaubt!`;
    } else if (hasHighLibido && loneliness < 5 && connection < 5) {
      // Healthy sexual desire – do not problematize
      dominantMotive = 'sexual';
      experimentTriggered = 0;
      feedbackMessage =
        `Dominantes Motiv: Sex/Libido (${libido}/10). Gesunde sexuelle Motivation – kein therapeutischer Eingriff erforderlich. Tinder wie gewünscht öffnen!`;
    } else if (hasHighNoveltyOrValidation) {
      dominantMotive = 'novelty_validation';
      experimentTriggered = 0;
      feedbackMessage =
        `Dominantes Motiv: Neuheit (${novelty}/10) / Bestätigung (${validation}/10). Als Evidenz erfasst – kein akutes Experiment ausgelöst.`;
    } else if (hasHighBoredom) {
      dominantMotive = 'boredom';
      experimentTriggered = 0;
      feedbackMessage =
        `Dominantes Motiv: Langeweile / Ablenkung (${boredom}/10). Kurzer Dopamin-/Habit-Impuls – als Evidenz erfasst.`;
    } else {
      dominantMotive = 'mixed';
      experimentTriggered = 0;
      feedbackMessage = `Motiv-Snapshot erfasst. Keine spezifische Intervention erforderlich.`;
    }

    const [created] = await db
      .insert(motiveChecks)
      .values({
        appName,
        libido: libido.toFixed(1),
        connection: connection.toFixed(1),
        loneliness: loneliness.toFixed(1),
        novelty: novelty.toFixed(1),
        validation: validation.toFixed(1),
        datingIntent: datingIntent.toFixed(1),
        boredom: boredom.toFixed(1),
        dominantMotive,
        experimentTriggered,
        feedbackMessage,
        note,
      })
      .returning();

    return NextResponse.json({
      success: true,
      motiveCheck: created,
      experimentTriggered: Boolean(experimentTriggered),
      dominantMotive,
      feedbackMessage,
    });
  } catch (error: any) {
    console.error('Error saving motive check:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save motive check' },
      { status: 500 }
    );
  }
}
