import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Configure apps/web/.env.local according to .env.example."
  );
}

/**
 * Runtime PostgreSQL client (ADR-13 / D-25).
 * Uses `prepare: false` for Supabase Transaction Pooler (port 6543 in prod, 54322 local).
 */
const globalForDb = globalThis as unknown as {
  pmkiPgClient?: ReturnType<typeof postgres>;
  pmkiDb?: ReturnType<typeof drizzle>;
};

export const pgClient =
  globalForDb.pmkiPgClient ??
  postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 30,
  });

export const db =
  globalForDb.pmkiDb ??
  drizzle(pgClient, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pmkiPgClient = pgClient;
  globalForDb.pmkiDb = db;
}
export type Database = typeof db;

