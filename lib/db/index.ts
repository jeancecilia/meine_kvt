import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { bootstrapDatabase } from './bootstrap';

const connectionString = process.env.DATABASE_URL || 'postgres://therapy:therapy_password@localhost:5432/therapy';

export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

// Keep startup resilient: the app can build even when PostgreSQL is not reachable yet.
void bootstrapDatabase(client);
