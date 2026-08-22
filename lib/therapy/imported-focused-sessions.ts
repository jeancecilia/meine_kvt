import { ensureFocusedSessionMemory20260817 } from '@/lib/therapy/focused-session-memory';
import { ensureFocusedSessionMemory20260822 } from '@/lib/therapy/focused-session-memory-2026-08-22';

/**
 * Materialize structured therapy sessions that were conducted outside the app
 * and imported from the surrounding ChatGPT work. Keep historical order explicit
 * because later formulations build on earlier ones. Every importer is idempotent.
 */
export async function ensureImportedFocusedSessions(): Promise<void> {
  await ensureFocusedSessionMemory20260817();
  await ensureFocusedSessionMemory20260822();
}
