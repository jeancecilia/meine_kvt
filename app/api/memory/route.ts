import { NextResponse } from 'next/server';
import {
  getMemoryDashboardData,
  refreshAutomaticMemoryConsolidations,
  retrieveTherapeuticMemory,
} from '@/lib/therapy/memory';
import { ensureImportedFocusedSessions } from '@/lib/therapy/imported-focused-sessions';
import { syncLongitudinalHistory } from '@/lib/therapy/memory-history';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    // Opening/searching the memory workspace is enough to persist structured
    // focused-session imports into PostgreSQL, even before therapy chat is used.
    await ensureImportedFocusedSessions();

    // Keep current hypothesis revisions and treatment-phase snapshots in sync
    // whenever the memory workspace is opened or searched.
    await syncLongitudinalHistory(new Date());

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

    await ensureImportedFocusedSessions();
    await refreshAutomaticMemoryConsolidations(new Date());
    await syncLongitudinalHistory(new Date());
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
