import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { bootstrapDatabase } from './bootstrap';

const connectionString = process.env.DATABASE_URL || 'postgres://therapy:therapy_password@localhost:5433/therapy';

const rawClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * Next.js production bundles can hand Postgres.js Date objects originating from
 * another JS realm/module context. Postgres.js detects dates with `instanceof Date`;
 * if that check misses, the raw Date reaches its wire-buffer writer and throws
 * ERR_INVALID_ARG_TYPE. Normalize top-level tagged-template Date parameters to
 * ISO strings at the single database boundary. PostgreSQL still infers/casts the
 * target timestamp/date type from the surrounding SQL expression or column.
 */
function normalizeSqlParameter(value: unknown): unknown {
  if (Object.prototype.toString.call(value) !== '[object Date]') return value;

  const date = value as Date;
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Invalid Date cannot be used as a PostgreSQL parameter');
  }

  return date.toISOString();
}

export const client = new Proxy(rawClient, {
  apply(target, thisArg, argArray) {
    const [strings, ...values] = argArray;
    const isTaggedTemplate = Array.isArray(strings) && Array.isArray(strings.raw);

    if (!isTaggedTemplate) {
      return Reflect.apply(target, thisArg, argArray);
    }

    return Reflect.apply(target, thisArg, [
      strings,
      ...values.map(normalizeSqlParameter),
    ]);
  },
}) as typeof rawClient;

export const db = drizzle(client, { schema });

let readinessPromise: Promise<void> | null = null;

/**
 * Idempotently bootstrap/migrate the database and verify that the treatment-plan
 * layer is actually available before plan-dependent routes continue.
 *
 * A failed attempt is deliberately not cached so a running dev/production server
 * can recover when PostgreSQL becomes available a moment later.
 */
export function ensureDatabaseReady(): Promise<void> {
  if (!readinessPromise) {
    readinessPromise = (async () => {
      await bootstrapDatabase(client);

      // bootstrapDatabase is intentionally tolerant during startup. Verify the
      // treatment-plan seed so callers never mistake a bootstrap failure for an
      // empty treatment plan.
      const rows = await db
        .select({ id: schema.treatmentPlans.id })
        .from(schema.treatmentPlans)
        .limit(1);

      if (rows.length === 0) {
        throw new Error('Database bootstrap completed without creating treatment plan v0.1');
      }
    })().catch((error) => {
      readinessPromise = null;
      throw error;
    });
  }

  return readinessPromise;
}

// Warm the database on normal server startup without making Next.js builds depend
// on a reachable database. Plan-dependent routes explicitly await the same promise.
void ensureDatabaseReady().catch((error) => {
  console.warn('Database warm-up deferred:', error?.message || error);
});
