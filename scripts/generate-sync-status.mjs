import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL
  || 'postgres://therapy:therapy_password@localhost:5433/therapy';

const sql = postgres(connectionString, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 5,
});

function toIso(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid timestamp returned by PostgreSQL: ${String(value)}`);
  }
  return date.toISOString();
}

async function relationExists(name) {
  const rows = await sql`
    SELECT to_regclass(${`public.${name}`})::text AS relation
  `;
  return Boolean(rows[0]?.relation);
}

async function buildStatus() {
  const checkinRows = await sql`
    SELECT
      COUNT(*)::int AS count,
      MAX(updated_at) AS last_checkin_at
    FROM daily_checkins
  `;

  const sessionRows = await sql`
    SELECT COUNT(*) FILTER (WHERE status = 'completed')::int AS count
    FROM therapy_sessions
  `;

  let activeMemoryCount = 0;
  let latestMemoryUpdatedAt = null;

  if (await relationExists('therapeutic_memories')) {
    const memoryRows = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_count,
        MAX(updated_at) FILTER (WHERE status = 'active') AS latest_memory_updated_at
      FROM therapeutic_memories
    `;
    activeMemoryCount = Number(memoryRows[0]?.active_count || 0);
    latestMemoryUpdatedAt = toIso(memoryRows[0]?.latest_memory_updated_at);
  }

  const database = {
    last_checkin_at: toIso(checkinRows[0]?.last_checkin_at),
    checkin_count: Number(checkinRows[0]?.count || 0),
    active_memory_count: activeMemoryCount,
    latest_memory_updated_at: latestMemoryUpdatedAt,
    completed_session_count: Number(sessionRows[0]?.count || 0),
  };

  // The hash intentionally covers metadata only. No ratings, notes, therapy text,
  // IDs, prompts, hypotheses or other clinical content are selected or hashed.
  const stateHash = createHash('sha256')
    .update(JSON.stringify(database))
    .digest('hex');

  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    database,
    state_hash: `sha256:${stateHash}`,
  };
}

try {
  const status = await buildStatus();
  const outputPath = resolve(process.cwd(), 'sync-status.json');
  await writeFile(outputPath, `${JSON.stringify(status, null, 2)}\n`, 'utf8');

  console.log('Updated sync-status.json');
  console.log(`  last_checkin_at: ${status.database.last_checkin_at || 'none'}`);
  console.log(`  checkin_count: ${status.database.checkin_count}`);
  console.log(`  active_memory_count: ${status.database.active_memory_count}`);
  console.log(`  completed_session_count: ${status.database.completed_session_count}`);
  console.log(`  state_hash: ${status.state_hash}`);
} finally {
  await sql.end({ timeout: 5 });
}
