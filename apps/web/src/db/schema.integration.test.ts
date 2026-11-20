import { config as loadEnv } from "dotenv";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import postgres from "postgres";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 2 });

afterAll(async () => {
  await sql.end();
});

describe("Phase 2 — Database Schema, Constraints & Platform Hardening", () => {
  it("verifies public.users has NO password_hash and NO single role column (D-26/U-09)", async () => {
    const cols = await sql<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
    `;
    const names = cols.map((c) => c.column_name);
    expect(names).toContain("id");
    expect(names).toContain("email");
    expect(names).not.toContain("password_hash");
    expect(names).not.toContain("role");
  });

  it("verifies 11 system roles, 11 demo users, and GRANT/REVOKE overrides are seeded", async () => {
    const [{ count: roleCount }] = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM public.roles
    `;
    const [{ count: userCount }] = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM public.users
    `;
    const overrides = await sql<{ mode: string }[]>`
      SELECT mode FROM public.user_permissions ORDER BY mode
    `;

    expect(Number(roleCount)).toBe(11);
    expect(Number(userCount)).toBe(11);
    expect(overrides.map((o) => o.mode)).toEqual(["GRANT", "REVOKE"]);
  });

  it("rejects duplicate attendance_sessions on UNIQUE(class_id, session_date)", async () => {
    const [existing] = await sql<{
      organization_id: string;
      service_unit_id: string;
      class_id: string;
      teacher_id: string;
      session_date: string;
    }[]>`
      SELECT organization_id, service_unit_id, class_id, teacher_id, session_date::text
      FROM public.attendance_sessions
      LIMIT 1
    `;
    expect(existing).toBeDefined();

    await expect(
      sql`
        INSERT INTO public.attendance_sessions (id, organization_id, service_unit_id, class_id, teacher_id, session_date)
        VALUES (gen_random_uuid(), ${existing.organization_id}, ${existing.service_unit_id}, ${existing.class_id}, ${existing.teacher_id}, ${existing.session_date})
      `
    ).rejects.toThrow(/attendance_sessions_class_date_uidx|unique constraint/i);
  });

  it("enforces FK constraint on class_enrollments.student_id -> students.id", async () => {
    const [cls] = await sql<{ id: string; academic_year_id: string }[]>`
      SELECT id, academic_year_id FROM public.classes LIMIT 1
    `;
    expect(cls).toBeDefined();

    await expect(
      sql`
        INSERT INTO public.class_enrollments (id, student_id, class_id, academic_year_id)
        VALUES (gen_random_uuid(), gen_random_uuid(), ${cls.id}, ${cls.academic_year_id})
      `
    ).rejects.toThrow(/foreign key constraint/i);
  });

  it("enforces append-only immutability trigger on audit_logs (blocks UPDATE & DELETE)", async () => {
    const [log] = await sql<{ id: string }[]>`
      SELECT id FROM public.audit_logs LIMIT 1
    `;
    expect(log).toBeDefined();

    await expect(
      sql`UPDATE public.audit_logs SET description = 'tampered' WHERE id = ${log.id}`
    ).rejects.toThrow(/Append-only table audit_logs/i);

    await expect(
      sql`DELETE FROM public.audit_logs WHERE id = ${log.id}`
    ).rejects.toThrow(/Append-only table audit_logs/i);
  });

  it("enforces append-only immutability trigger on report_workflow_logs (blocks UPDATE & DELETE)", async () => {
    const [wf] = await sql<{ id: string }[]>`
      SELECT id FROM public.report_workflow_logs LIMIT 1
    `;
    expect(wf).toBeDefined();

    await expect(
      sql`UPDATE public.report_workflow_logs SET comment = 'tampered' WHERE id = ${wf.id}`
    ).rejects.toThrow(/Append-only table report_workflow_logs/i);

    await expect(
      sql`DELETE FROM public.report_workflow_logs WHERE id = ${wf.id}`
    ).rejects.toThrow(/Append-only table report_workflow_logs/i);
  });

  it("defaults development_notes.confidential to TRUE", async () => {
    const [col] = await sql<{ column_default: string | null }[]>`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'development_notes'
        AND column_name = 'confidential'
    `;
    expect(col?.column_default).toBe("true");
  });

  it("enables RLS and revokes ALL anon/authenticated grants on every public table (D-21/D-22)", async () => {
    const rlsStatus = await sql<{ tablename: string; rowsecurity: boolean }[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT LIKE '__drizzle%'
    `;
    expect(rlsStatus.length).toBeGreaterThanOrEqual(32);
    const unhardened = rlsStatus.filter((r) => !r.rowsecurity);
    expect(unhardened).toEqual([]);

    const grants = await sql<{ grantee: string; table_name: string }[]>`
      SELECT grantee, table_name
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND grantee IN ('anon', 'authenticated')
    `;
    expect(grants).toEqual([]);
  });

  it("provisions private Supabase Storage bucket `media` (public = false)", async () => {
    const [bucket] = await sql<{ id: string; public: boolean }[]>`
      SELECT id, public FROM storage.buckets WHERE id = 'media'
    `;
    expect(bucket).toEqual({ id: "media", public: false });
  });
});

