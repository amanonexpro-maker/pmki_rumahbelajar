import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Configure apps/web/.env.local according to .env.example."
  );
}

/**
 * Runtime PostgreSQL client (ADR-13 / D-25).
 * Uses `prepare: false` for Supabase Transaction Pooler (port 6543 in prod, 54322 local).
 *
 * R7 (FASE 18 Step 4, Cold Start Hardening): `drizzle(pgClient)` is intentionally
 * constructed WITHOUT the `{ schema }` relational config object. This codebase never
 * uses the Drizzle relational query API (`db.query.<table>.findMany/findFirst`) nor
 * `relations()` helpers — all domain repositories use the query builder
 * (`db.select()/.insert()/.update()`), which only needs individual table objects
 * imported directly by each repository. Passing `{ schema }` here would force eager
 * evaluation of all ~32 domain table modules (and any future relation graphs) on
 * first module load, inflating cold start. If the relational query API becomes
 * required in the future, reintroduce `import * as schema from "./schema"` and
 * `drizzle(pgClient, { schema })` deliberately.
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

export const db = globalForDb.pmkiDb ?? drizzle(pgClient);

if (process.env.NODE_ENV !== "production") {
  globalForDb.pmkiPgClient = pgClient;
  globalForDb.pmkiDb = db;
}
export type Database = typeof db;

