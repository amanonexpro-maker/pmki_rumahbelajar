import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { resolveAccess } from "@/features/administration";
import type { SessionUser } from "@/server/auth/session";
import { measureServerOperation } from "@/server/monitoring/operational-telemetry";
import { buildContextualDashboardViewModel } from "./index";

async function loadSessionByEmail(email: string): Promise<SessionUser> {
  const [userRow] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!userRow) {
    throw new Error(`Seeded user ${email} not found. Run npm run db:seed.`);
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

describe("Fase 10 Integration — Contextual Workspace Dashboard (UI-3) Role-Aware Orchestration & Privacy", () => {
  let teacherSession!: SessionUser;
  let coordinatorSession!: SessionUser;
  let approverSession!: SessionUser;
  let auditorSession!: SessionUser;

  beforeAll(async () => {
    teacherSession = await loadSessionByEmail("guru.matematika@pmki.org");
    coordinatorSession = await loadSessionByEmail("pengurus.lawang@pmki.org");
    approverSession = await loadSessionByEmail("penyetuju.mupel@pmki.org");
    auditorSession = await loadSessionByEmail("auditor@pmki.org");
  });

  it("builds role-contextual dashboard view models via domain Public APIs", async () => {
    // 1. TEACHER view model
    const teacherMeasured = await measureServerOperation(
      "dashboard.buildTeacherViewModel",
      () => buildContextualDashboardViewModel(teacherSession),
      { isHeavyOperation: true }
    );
    expect(teacherMeasured.durationMs).toBeGreaterThan(0);
    const teacherVm = teacherMeasured.result;

    expect(teacherVm.primaryRoleLabel).toBe("Pengajar");
    expect(teacherVm.serviceUnitName).toContain("Rumah Belajar Griya Asih");
    expect(teacherVm.primaryAction?.label).toBe("Catat presensi");
    expect(teacherVm.secondaryAction?.label).toBe(
      "Tambah catatan perkembangan"
    );

    // Canonical summary metric labels (10 §5)
    const metricLabels = teacherVm.summaryMetrics.map((m) => m.label);
    expect(metricLabels).toEqual([
      "Peserta didik terdaftar",
      "Kelas aktif",
      "Pengajar",
      "Rata-rata kehadiran",
    ]);

    // Teacher's assigned class (SD Kelas 2) should be flagged as isCurrentUserTeacher
    expect(
      teacherVm.upcomingSchedules.some((s) => s.isCurrentUserTeacher)
    ).toBe(true);

    // Teacher does NOT have audit.read
    expect(teacherVm.canViewAuditLog).toBe(false);

    // 2. UNIT_COORDINATOR view model
    const coordVm = await buildContextualDashboardViewModel(coordinatorSession);
    expect(coordVm.primaryRoleLabel).toBe("Koordinator Unit");
    expect(coordVm.upcomingSchedules.length).toBeGreaterThan(0);

    // 3. APPROVER view model (SoD-filtered governance attention queue)
    const approverVm = await buildContextualDashboardViewModel(approverSession);
    expect(approverVm.primaryRoleLabel).toBe("Pejabat Penyetuju");
    expect(approverVm.primaryAction?.label).toBe("Tinjau laporan");
    // Seeded report is in PROGRAM_REVIEW created by UNIT_COORDINATOR (not APPROVER), so APPROVER sees it in attentionItems
    expect(
      approverVm.attentionItems.some((item) => item.category === "Laporan")
    ).toBe(true);

    // 4. AUDITOR view model (Read-only audit access, privacy-safe activity feed)
    const auditorVm = await buildContextualDashboardViewModel(auditorSession);
    expect(auditorVm.primaryRoleLabel).toBe("Auditor");
    expect(auditorVm.canViewAuditLog).toBe(true);
    expect(auditorVm.primaryAction?.label).toBe("Lihat jejak audit");
    expect(auditorVm.activityItems.length).toBeGreaterThan(0);

    // Privacy check: activity feed must never expose guardian phone numbers or confidential note bodies
    for (const act of auditorVm.activityItems) {
      expect(act.title).not.toMatch(/08\d{8,}/);
      expect(act.context).not.toMatch(/08\d{8,}/);
    }
  });
});

