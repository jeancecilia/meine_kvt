import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyCheckins } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db.select().from(dailyCheckins).orderBy(desc(dailyCheckins.date)).limit(14);
    return NextResponse.json(list);
  } catch (error) {
    console.error('Failed to fetch checkins:', error);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const today = new Date().toISOString().split('T')[0];

    const newCheckin = await db.insert(dailyCheckins).values({
      date: today,
      mood: Number(body.mood),
      fulfillment: Number(body.fulfillment),
      loneliness: Number(body.loneliness),
      innerCalm: Number(body.innerCalm),
      joy: Number(body.joy),
      rumination: Number(body.rumination),
      futureAnxiety: Number(body.futureAnxiety),
      noveltyDrive: Number(body.noveltyDrive),
      energy: Number(body.energy),
      sleepQuality: Number(body.sleepQuality),
      note: body.note || null,
    }).returning();

    return NextResponse.json(newCheckin[0]);
  } catch (error) {
    console.error('Failed to save checkin:', error);
    return NextResponse.json({ error: 'Check-in konnte nicht gespeichert werden' }, { status: 500 });
  }
}
