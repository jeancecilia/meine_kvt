import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { values } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db.select().from(values).orderBy(asc(values.createdAt));
    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Values GET error:', error);
    return NextResponse.json({ error: 'Werte konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.domain || !body.title) {
      return NextResponse.json({ error: 'Domäne und Wert sind erforderlich' }, { status: 400 });
    }

    const created = await db.insert(values).values({
      domain: body.domain,
      title: body.title,
      importance: Number(body.importance ?? 5),
      currentAlignment: Number(body.currentAlignment ?? 5),
      behavioralDefinition: body.behavioralDefinition || null,
    }).returning();

    return NextResponse.json(created[0]);
  } catch (error: any) {
    console.error('Values POST error:', error);
    return NextResponse.json({ error: 'Wert konnte nicht gespeichert werden' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });

    const updated = await db.update(values).set({
      domain: body.domain,
      title: body.title,
      importance: Number(body.importance),
      currentAlignment: Number(body.currentAlignment),
      behavioralDefinition: body.behavioralDefinition || null,
    }).where(eq(values.id, body.id)).returning();

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error('Values PUT error:', error);
    return NextResponse.json({ error: 'Wert konnte nicht aktualisiert werden' }, { status: 500 });
  }
}
