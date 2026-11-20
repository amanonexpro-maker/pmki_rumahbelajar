import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema/identity/users";
import {
  deleteUserPermissionOverride,
  resolveAccess,
  upsertUserPermissionOverride,
} from "@/features/administration";
import type { SessionUser } from "@/server/auth/session";
import { authorize, can } from "@/server/permissions";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MAILPIT_API = "http://127.0.0.1:55424/api/v1/messages";
const OTHER_UNIT_ID = "01950000-0000-7000-8000-999999999999";

async function buildSessionFromDb(email: string): Promise<SessionUser> {
  const [userRow] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!userRow) {
    throw new Error(`Seeded user ${email} not found in public.users`);
  }

  const access = await resolveAccess(userRow.id);
  return {
    id: userRow.id,
    email: userRow.email,
    name: access.name,
    roles: access.roles,
    permissions: access.permissions,
    memberships: access.memberships,
  };
}

describe("Fase 3 Integration — Supabase Auth + Dynamic RBAC + Mailpit", () => {
  let teacherId = "";

  beforeAll(async () => {
    const [teacher] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "guru.matematika@pmki.org"))
      .limit(1);

    if (!teacher) {
      throw new Error("Seeded demo users missing. Run npm run db:seed first.");
    }
    teacherId = teacher.id;
  });

  afterAll(async () => {
    // Restore clean seeded override state for guru.matematika@pmki.org
    if (teacherId) {
      await deleteUserPermissionOverride({
        userId: teacherId,
        permissionCode: "development.create",
      });
      await upsertUserPermissionOverride({
        userId: teacherId,
        permissionCode: "guardian.read",
        mode: "GRANT",
        reason: "Restored seeded demo GRANT override after integration test",
      });
    }
  });

  it("blocks public self-signup (enable_signup=false)", async () => {
    expect(SUPABASE_URL).toBeTruthy();
    expect(SUPABASE_ANON_KEY).toBeTruthy();

    const anonClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await anonClient.auth.signUp({
      email: `unauthorized.${Date.now()}@pmki.org`,
      password: "Password123!",
    });

    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });

  it("authenticates seeded user via Supabase Auth and verifies with getUser()", async () => {
    const anonClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: signInData, error: signInError } =
      await anonClient.auth.signInWithPassword({
        email: "guru.matematika@pmki.org",
        password: process.env.PMKI_DEMO_PASSWORD || "PmkiDemo2026!",
      });

    expect(signInError).toBeNull();
    expect(signInData.session?.access_token).toBeTruthy();

    const { data: verified, error: getUserError } =
      await anonClient.auth.getUser(signInData.session!.access_token);

    expect(getUserError).toBeNull();
    expect(verified.user?.id).toBe(teacherId);
  });

  it("enforces TEACHER default -> dynamic GRANT -> dynamic REVOKE instantly without re-login", async () => {
    // 1. Baseline TEACHER without overrides
    await deleteUserPermissionOverride({
      userId: teacherId,
      permissionCode: "guardian.read",
    });
    await deleteUserPermissionOverride({
      userId: teacherId,
      permissionCode: "development.create",
    });

    const baseline = await buildSessionFromDb("guru.matematika@pmki.org");
    const unitId = baseline.memberships[0]?.serviceUnitId;
    expect(unitId).toBeTruthy();

    expect(can(baseline, "attendance.record", { serviceUnitId: unitId })).toBe(true);
    expect(can(baseline, "guardian.read", { serviceUnitId: unitId })).toBe(false);
    expect(can(baseline, "development.create", { serviceUnitId: unitId })).toBe(true);

    // 2. Dynamic GRANT guardian.read -> immediately allowed on next request
    await upsertUserPermissionOverride({
      userId: teacherId,
      permissionCode: "guardian.read",
      mode: "GRANT",
      reason: "Fase 3 integration test: dynamic GRANT",
    });
    const afterGrant = await buildSessionFromDb("guru.matematika@pmki.org");
    expect(can(afterGrant, "guardian.read", { serviceUnitId: unitId })).toBe(true);

    // 3. Dynamic REVOKE development.create -> immediately denied (REVOKE wins)
    await upsertUserPermissionOverride({
      userId: teacherId,
      permissionCode: "development.create",
      mode: "REVOKE",
      reason: "Fase 3 integration test: dynamic REVOKE",
    });
    const afterRevoke = await buildSessionFromDb("guru.matematika@pmki.org");
    expect(can(afterRevoke, "development.create", { serviceUnitId: unitId })).toBe(false);

    // 4. Cross service-unit access -> SCOPE_DENIED
    const crossUnit = authorize(afterRevoke, "attendance.record", {
      serviceUnitId: OTHER_UNIT_ID,
    });
    expect(crossUnit.success).toBe(false);
    if (!crossUnit.success) {
      expect(crossUnit.error.code).toBe("SCOPE_DENIED");
    }
  });

  it("enforces Separation of Duties for both APPROVER and PLATFORM_ADMIN", async () => {
    const approver = await buildSessionFromDb("penyetuju.mupel@pmki.org");
    const admin = await buildSessionFromDb("superadmin@pmki.org");

    const approverSelf = authorize(approver, "report.approve", {
      serviceUnitId: approver.memberships[0]?.serviceUnitId,
      requireSeparationOfDuties: true,
      resourceOwnerId: approver.id,
    });
    expect(approverSelf.success).toBe(false);
    if (!approverSelf.success) {
      expect(approverSelf.error.code).toBe("POLICY_DENIED");
    }

    const adminSelf = authorize(admin, "report.approve", {
      serviceUnitId: admin.memberships[0]?.serviceUnitId,
      requireSeparationOfDuties: true,
      resourceOwnerId: admin.id,
    });
    expect(adminSelf.success).toBe(false);
    if (!adminSelf.success) {
      expect(adminSelf.error.code).toBe("POLICY_DENIED");
    }
  });

  it("delivers password recovery email to local Mailpit", async () => {
    const anonClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await anonClient.auth.resetPasswordForEmail(
      "guru.matematika@pmki.org",
      { redirectTo: "http://localhost:3000/auth/login" }
    );
    expect(error).toBeNull();

    const response = await fetch(MAILPIT_API);
    expect(response.ok).toBe(true);
    const body = (await response.json()) as {
      messages?: Array<{ To?: Array<{ Address?: string }> }>;
    };

    const delivered = body.messages?.some((msg) =>
      msg.To?.some((recipient) => recipient.Address === "guru.matematika@pmki.org")
    );
    expect(delivered).toBe(true);
  });
});
