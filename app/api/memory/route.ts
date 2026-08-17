import { NextResponse } from 'next/server';
import {
  getMemoryDashboardData,
  refreshAutomaticMemoryConsolidations,
  retrieveTherapeuticMemory,
} from '@/lib/therapy/memory';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    if (!query) {
      const dashboard = await getMemoryDashboardData();
      return NextResponse.json(dashboard);
    }

    const result = await retrieveTherapeuticMemory(query, 10);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Memory search error:', error);
    return NextResponse.json(
      { error: 'Langzeitgedächtnis konnte nicht durchsucht werden', detail: error?.message || String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.action !== 'refresh') {
      return NextResponse.json({ error: 'Unbekannte Memory-Aktion' }, { status: 400 });
    }
    await refreshAutomaticMemoryConsolidations(new Date());
    const dashboard = await getMemoryDashboardData();
    return NextResponse.json(dashboard);
  } catch (error: any) {
    console.error('Memory refresh error:', error);
    return NextResponse.json(
      { error: 'Memory-Konsolidierung fehlgeschlagen', detail: error?.message || String(error) },
      { status: 500 },
    );
  }
}
