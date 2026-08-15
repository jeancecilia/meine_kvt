import { NextResponse } from 'next/server';
import { createSession, verifyPassword } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!verifyPassword(password)) {
      return NextResponse.json({ error: 'Ungültiges Passwort' }, { status: 401 });
    }

    await createSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
