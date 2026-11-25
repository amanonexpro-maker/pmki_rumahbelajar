import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it, afterAll } from "vitest";
import postgres from "postgres";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

describe("Platform Wiring Verification (ADR-13)", () => {
  const dbUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const sql = dbUrl
    ? postgres(dbUrl, { prepare: false, max: 2 })
    : null;

  afterAll(async () => {
    if (sql) {
      await sql.end();
    }
  });

  it("connects to local Supabase PG17 with prepare: false", async () => {
    expect(dbUrl).toBeTruthy();
    if (!sql) return;

    const rows = await sql<{ version: string }[]>`SELECT current_setting('server_version') AS version`;
    expect(rows[0]?.version).toMatch(/^17\./);
  });

  it("reaches Supabase Auth health endpoint", async () => {
    expect(supabaseUrl).toBeTruthy();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: anonKey ? { apikey: anonKey } : undefined,
    });
    expect(res.ok).toBe(true);
  });

  it.skipIf(!process.env.CI)("reaches local Mailpit web API (port 55424)", async () => {
    const res = await fetch("http://127.0.0.1:55424/api/v1/messages");
    expect(res.ok).toBe(true);
  });

  it("keeps src/proxy.ts strictly edge-safe without Drizzle or postgres imports", () => {
    const targetFile = existsSync(path.resolve(process.cwd(), "src/proxy.ts"))
      ? path.resolve(process.cwd(), "src/proxy.ts")
      : path.resolve(process.cwd(), "src/middleware.ts");
    const middlewareSrc = readFileSync(targetFile, "utf-8");
    expect(middlewareSrc).not.toMatch(/drizzle-orm/);
    expect(middlewareSrc).not.toMatch(/from\s+["']postgres["']/);
    expect(middlewareSrc).not.toMatch(/@\/db\/client/);
    expect(middlewareSrc).toMatch(/hasSupabaseAuthCookie/);

    // Verify session.ts in Node runtime enforces getUser()
    const sessionSrc = readFileSync(
      path.resolve(process.cwd(), "src/server/auth/session.ts"),
      "utf-8"
    );
    expect(sessionSrc).toMatch(/supabase\.auth\.getUser\(\)/);
  });
});

