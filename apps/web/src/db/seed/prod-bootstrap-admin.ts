import { config as loadEnv } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

import { db, pgClient } from "../client";
import {
  auditLogs,
  organizations,
  permissions,
  programs,
  rolePermissions,
  roles,
  serviceUnits,
  userMemberships,
  userRoles,
  users,
} from "../schema";

/**
 * Production Bootstrap Admin Script (ADR-13 D-26, D-30, Fase 10 Task #13).
 *
 * Unlike `dev-seed.ts` (which is strictly blocked in production and contains 11 demo users + sample students),
 * this script is the ONLY production-sanctioned bootstrap utility:
 * 1. Seeds canonical RBAC metadata (`roles`, `permissions`, `role_permissions`).
 * 2. Seeds root organizations (`PMKI_SINODAL`, `PMKI_MUPEL_JATIM`) and pilot unit (`RB_GRIYA_ASIH_LAWANG`).
 * 3. Provisions the single initial `PLATFORM_ADMIN` account via Supabase Admin API using
 *    `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` environment variables.
 * 4. Seeds ZERO demo users, ZERO sample students, and ZERO mock operational records.
 */

const PERMISSION_REGISTRY: {
  code: string;
  name: string;
  module: string;
}[] = [
  { code: "student.read", name: "Lihat peserta didik", module: "students" },
  { code: "student.create", name: "Tambah peserta didik", module: "students" },
  { code: "student.update", name: "Ubah peserta didik", module: "students" },
  { code: "student.verify", name: "Verifikasi pendaftaran", module: "students" },
  { code: "student.archive", name: "Arsipkan peserta didik", module: "students" },
  { code: "student.import", name: "Impor peserta didik", module: "students" },
  { code: "student.export", name: "Ekspor peserta didik", module: "students" },
  { code: "guardian.read", name: "Lihat data wali", module: "students" },
  { code: "guardian.create", name: "Tambah data wali", module: "students" },
  { code: "guardian.update", name: "Ubah data wali", module: "students" },
  { code: "academic-year.read", name: "Lihat tahun ajaran", module: "academic" },
  { code: "academic-year.manage", name: "Kelola tahun ajaran", module: "academic" },
  { code: "class.read", name: "Lihat kelas", module: "academic" },
  { code: "class.create", name: "Tambah kelas", module: "academic" },
  { code: "class.update", name: "Ubah kelas", module: "academic" },
  { code: "class.archive", name: "Arsipkan kelas", module: "academic" },
  { code: "teacher.read", name: "Lihat pengajar", module: "academic" },
  { code: "teacher.create", name: "Tambah pengajar", module: "academic" },
  { code: "teacher.update", name: "Ubah pengajar", module: "academic" },
  { code: "schedule.read", name: "Lihat jadwal", module: "academic" },
  { code: "schedule.create", name: "Tambah jadwal", module: "academic" },
  { code: "schedule.update", name: "Ubah jadwal", module: "academic" },
  { code: "attendance.read", name: "Lihat kehadiran", module: "attendance" },
  { code: "attendance.record", name: "Catat presensi", module: "attendance" },
  { code: "attendance.update", name: "Ubah presensi", module: "attendance" },
  { code: "attendance.export", name: "Ekspor kehadiran", module: "attendance" },
  { code: "development.read", name: "Lihat catatan perkembangan", module: "development" },
  { code: "development.create", name: "Tambah catatan perkembangan", module: "development" },
  { code: "development.update", name: "Ubah catatan perkembangan", module: "development" },
  { code: "development.review", name: "Tinjau catatan perkembangan", module: "development" },
  { code: "consent.read", name: "Lihat persetujuan", module: "consent" },
  { code: "consent.create", name: "Catat persetujuan", module: "consent" },
  { code: "consent.update", name: "Perbarui persetujuan", module: "consent" },
  { code: "consent.review", name: "Tinjau persetujuan", module: "consent" },
  { code: "media.read", name: "Lihat dokumentasi", module: "media" },
  { code: "media.create", name: "Unggah dokumentasi", module: "media" },
  { code: "media.update", name: "Ubah dokumentasi", module: "media" },
  { code: "media.review", name: "Tinjau privasi dokumentasi", module: "media" },
  { code: "media.publish", name: "Terbitkan dokumentasi", module: "media" },
  { code: "report.read", name: "Lihat laporan", module: "governance" },
  { code: "report.create", name: "Susun laporan", module: "governance" },
  { code: "report.update", name: "Ubah laporan", module: "governance" },
  { code: "report.review", name: "Tinjau laporan", module: "governance" },
  { code: "report.approve", name: "Setujui laporan", module: "governance" },
  { code: "publication.read", name: "Lihat publikasi", module: "publishing" },
  { code: "publication.create", name: "Buat publikasi", module: "publishing" },
  { code: "publication.update", name: "Ubah publikasi", module: "publishing" },
  { code: "publication.review", name: "Tinjau publikasi", module: "publishing" },
  { code: "publication.publish", name: "Terbitkan publikasi", module: "publishing" },
  { code: "publication.archive", name: "Arsipkan publikasi", module: "publishing" },
  { code: "audit.read", name: "Lihat jejak audit", module: "audit" },
  { code: "user.read", name: "Lihat pengguna", module: "administration" },
  { code: "user.create", name: "Tambah pengguna", module: "administration" },
  { code: "user.update", name: "Ubah pengguna", module: "administration" },
  { code: "user.activate", name: "Aktifkan pengguna", module: "administration" },
  { code: "user.deactivate", name: "Nonaktifkan pengguna", module: "administration" },
  { code: "role.read", name: "Lihat peran", module: "administration" },
  { code: "role.manage", name: "Kelola peran", module: "administration" },
  { code: "permission.read", name: "Lihat hak akses", module: "administration" },
  { code: "permission.manage", name: "Kelola hak akses", module: "administration" },
  { code: "organization.read", name: "Lihat organisasi", module: "organization" },
  { code: "organization.manage", name: "Kelola organisasi", module: "organization" },
  { code: "service-unit.read", name: "Lihat unit layanan", module: "organization" },
  { code: "service-unit.manage", name: "Kelola unit layanan", module: "organization" },
];

const SYSTEM_ROLES: { code: string; name: string; description: string }[] = [
  { code: "PLATFORM_ADMIN", name: "Administrator Platform", description: "Administrasi lintas platform." },
  { code: "ORG_ADMIN", name: "Administrator Organisasi", description: "Administrasi tingkat organisasi Mupel/Sinodal." },
  { code: "UNIT_COORDINATOR", name: "Koordinator Unit", description: "Koordinator operasional harian unit layanan." },
  { code: "PROGRAM_COORDINATOR", name: "Koordinator Program", description: "Koordinator program pembelajaran." },
  { code: "TEACHER", name: "Pengajar", description: "Operator kegiatan belajar, presensi, dan catatan perkembangan." },
  { code: "VOLUNTEER", name: "Relawan", description: "Pendamping operasional terbatas." },
  { code: "EDITOR", name: "Penyusun Konten", description: "Penyusun publikasi dan dokumentasi." },
  { code: "REVIEWER", name: "Peninjau", description: "Peninjau laporan, privasi media, dan persetujuan." },
  { code: "APPROVER", name: "Pejabat Penyetuju", description: "Otoritas persetujuan akhir laporan dan publikasi." },
  { code: "AUDITOR", name: "Auditor", description: "Akses baca penuh jejak audit dan tata kelola (read-only)." },
  { code: "STAKEHOLDER", name: "Pemangku Kepentingan", description: "Konsumen laporan ringkasan terpublikasi (read-only)." },
];

async function bootstrapProductionAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME ?? "Administrator Platform PMKI";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
    );
  }
  if (!adminEmail || !adminPassword || adminPassword.length < 8) {
    throw new Error(
      "BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (min 8 chars) are required for production bootstrap."
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Seed canonical roles & permissions
  for (const r of SYSTEM_ROLES) {
    await db.insert(roles).values(r).onConflictDoNothing({ target: roles.code });
  }
  for (const p of PERMISSION_REGISTRY) {
    await db
      .insert(permissions)
      .values(p)
      .onConflictDoNothing({ target: permissions.code });
  }

  const allRoles = await db.select().from(roles);
  const allPerms = await db.select().from(permissions);
  const platformAdminRole = allRoles.find((r) => r.code === "PLATFORM_ADMIN");
  if (!platformAdminRole) {
    throw new Error("PLATFORM_ADMIN role missing after seed.");
  }

  for (const perm of allPerms) {
    await db
      .insert(rolePermissions)
      .values({ roleId: platformAdminRole.id, permissionId: perm.id })
      .onConflictDoNothing();
  }

  // 2. Seed root organizations & pilot service unit
  await db
    .insert(organizations)
    .values({
      code: "PMKI_SINODAL",
      name: "PMKI Sinodal (Pusat)",
      type: "SINODAL",
    })
    .onConflictDoNothing({ target: organizations.code });

  const [orgSinodal] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.code, "PMKI_SINODAL"));

  await db
    .insert(organizations)
    .values({
      parentId: orgSinodal.id,
      code: "PMKI_MUPEL_JATIM",
      name: "PMKI Mupel Jawa Timur",
      type: "MUPEL",
    })
    .onConflictDoNothing({ target: organizations.code });

  const [orgJatim] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.code, "PMKI_MUPEL_JATIM"));

  await db
    .insert(serviceUnits)
    .values({
      organizationId: orgJatim.id,
      code: "RB_GRIYA_ASIH_LAWANG",
      name: "Rumah Belajar Griya Asih Lawang",
      location: 'RAAL "Griya Asih" Lawang, Kab. Malang, Jawa Timur',
    })
    .onConflictDoNothing({ target: serviceUnits.code });

  const [unitGriyaAsih] = await db
    .select()
    .from(serviceUnits)
    .where(eq(serviceUnits.code, "RB_GRIYA_ASIH_LAWANG"));

  await db
    .insert(programs)
    .values({
      organizationId: orgJatim.id,
      serviceUnitId: unitGriyaAsih.id,
      code: "PROG_BIMBEL_SABTU",
      name: "Bimbingan Belajar Sabtu (Happy Learning)",
    })
    .onConflictDoNothing({ target: programs.code });

  const [progBimbel] = await db
    .select()
    .from(programs)
    .where(eq(programs.code, "PROG_BIMBEL_SABTU"));

  // 3. Provision single initial PLATFORM_ADMIN via Supabase Auth Admin API
  const { data: listData, error: listErr } =
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;

  const existingAuth = listData.users.find(
    (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
  );

  let adminUid: string;
  if (existingAuth) {
    adminUid = existingAuth.id;
  } else {
    const { data: createdAuth, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: adminName },
      });
    if (createErr || !createdAuth.user) {
      throw createErr ?? new Error("Failed to provision bootstrap admin user");
    }
    adminUid = createdAuth.user.id;
  }

  await db
    .insert(users)
    .values({
      id: adminUid,
      name: adminName,
      email: adminEmail,
      active: true,
    })
    .onConflictDoNothing({ target: users.email });

  await db
    .insert(userRoles)
    .values({ userId: adminUid, roleId: platformAdminRole.id })
    .onConflictDoNothing();

  await db
    .insert(userMemberships)
    .values({
      userId: adminUid,
      organizationId: orgSinodal.id,
      serviceUnitId: unitGriyaAsih.id,
      programId: progBimbel.id,
    })
    .onConflictDoNothing();

  await db.insert(auditLogs).values({
    organizationId: orgSinodal.id,
    serviceUnitId: unitGriyaAsih.id,
    actorId: adminUid,
    action: "PRODUCTION_ADMIN_BOOTSTRAPPED",
    entityType: "user",
    entityId: adminUid,
    description:
      "Inisialisasi akun Administrator Platform pertama melalui Supabase Admin API.",
  });

  console.log(
    `Production bootstrap completed idempotently for PLATFORM_ADMIN (${adminEmail}).`
  );
}

bootstrapProductionAdmin()
  .catch((err) => {
    console.error("Production bootstrap failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pgClient.end();
  });

