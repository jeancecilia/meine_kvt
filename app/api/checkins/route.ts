import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyCheckins, patientProfile } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';

function getLocalDateString(timezone: string = 'Europe/Berlin'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Formats as YYYY-MM-DD
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export async function GET() {
  try {
    const list = await db.select().from(dailyCheckins).orderBy(desc(dailyCheckins.date)).limit(30);
    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Failed to fetch checkins:', error);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Determine target timezone from patient profile or body
    const profiles = await db.select().from(patientProfile).limit(1).catch(() => []);
    const timezone = body.timezone || profiles[0]?.timezone || 'Europe/Berlin';
    const dateStr = body.date || getLocalDateString(timezone);

    const valuesToInsert = {
      date: dateStr,
      mood: String(body.mood),
      fulfillment: String(body.fulfillment),
      loneliness: String(body.loneliness),
      innerCalm: String(body.innerCalm),
      joy: String(body.joy),
      rumination: String(body.rumination),
      futureAnxiety: String(body.futureAnxiety),
      noveltyDrive: String(body.noveltyDrive),
      energy: String(body.energy),
      sleepQuality: String(body.sleepQuality ?? '6.0'),
      lifeSatisfaction: String(body.lifeSatisfaction ?? body.sleepQuality ?? '5.0'),
      note: body.note || null,
      updatedAt: new Date(),
    };

    // PostgreSQL Upsert: ON CONFLICT (date) DO UPDATE
    const upserted = await db
      .insert(dailyCheckins)
      .values(valuesToInsert)
      .onConflictDoUpdate({
        target: dailyCheckins.date,
        set: {
          mood: valuesToInsert.mood,
          fulfillment: valuesToInsert.fulfillment,
          loneliness: valuesToInsert.loneliness,
          innerCalm: valuesToInsert.innerCalm,
          joy: valuesToInsert.joy,
          rumination: valuesToInsert.rumination,
          futureAnxiety: valuesToInsert.futureAnxiety,
          noveltyDrive: valuesToInsert.noveltyDrive,
          energy: valuesToInsert.energy,
          sleepQuality: valuesToInsert.sleepQuality,
          lifeSatisfaction: valuesToInsert.lifeSatisfaction,
          note: valuesToInsert.note,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(upserted[0]);
  } catch (error: any) {
    console.error('Failed to save checkin:', error);
    return NextResponse.json({ error: 'Check-in konnte nicht gespeichert werden' }, { status: 500 });
  }
}
