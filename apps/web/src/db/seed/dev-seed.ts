import fs from "node:fs";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

if (process.env.NODE_ENV === "production") {
  throw new Error(
    "FORBIDDEN: dev-seed.ts MUST NEVER run in production (ADR-13 / D-30)."
  );
}

import { db, pgClient } from "../client";
import {
  academicYears,
  attendanceRecords,
  attendanceSessions,
  auditLogs,
  classEnrollments,
  classes,
  consents,
  developmentCategories,
  developmentNoteRevisions,
  developmentNotes,
  guardians,
  mediaAssets,
  organizations,
  permissions,
  programs,
  publications,
  reportWorkflowLogs,
  reports,
  rolePermissions,
  roles,
  schedules,
  serviceUnits,
  studentGuardians,
  students,
  subjects,
  teacherAssignments,
  teachers,
  userMemberships,
  userPermissions,
  userRoles,
  users,
} from "../schema";

/**
 * Full Permission Registry (05-AUTHORIZATION-RBAC-BLUEPRINT.md §8).
 */
const PERMISSION_REGISTRY: {
  code: string;
  name: string;
  module: string;
}[] = [
  // Students
  { code: "student.read", name: "Lihat peserta didik", module: "students" },
  { code: "student.create", name: "Tambah peserta didik", module: "students" },
  { code: "student.update", name: "Ubah peserta didik", module: "students" },
  { code: "student.verify", name: "Verifikasi pendaftaran", module: "students" },
  { code: "student.archive", name: "Arsipkan peserta didik", module: "students" },
  { code: "student.import", name: "Impor peserta didik", module: "students" },
  { code: "student.export", name: "Ekspor peserta didik", module: "students" },
  // Guardians
  { code: "guardian.read", name: "Lihat data wali", module: "students" },
  { code: "guardian.create", name: "Tambah data wali", module: "students" },
  { code: "guardian.update", name: "Ubah data wali", module: "students" },
  // Academic Years, Classes, Teachers, Schedules
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
  // Attendance
  { code: "attendance.read", name: "Lihat kehadiran", module: "attendance" },
  { code: "attendance.record", name: "Catat presensi", module: "attendance" },
  { code: "attendance.update", name: "Ubah presensi", module: "attendance" },
  { code: "attendance.export", name: "Ekspor kehadiran", module: "attendance" },
  // Development
  { code: "development.read", name: "Lihat catatan perkembangan", module: "development" },
  { code: "development.create", name: "Tambah catatan perkembangan", module: "development" },
  { code: "development.update", name: "Ubah catatan perkembangan", module: "development" },
  { code: "development.review", name: "Tinjau catatan perkembangan", module: "development" },
  // Consent
  { code: "consent.read", name: "Lihat persetujuan", module: "consent" },
  { code: "consent.create", name: "Catat persetujuan", module: "consent" },
  { code: "consent.update", name: "Perbarui persetujuan", module: "consent" },
  { code: "consent.review", name: "Tinjau persetujuan", module: "consent" },
  // Media
  { code: "media.read", name: "Lihat dokumentasi", module: "media" },
  { code: "media.create", name: "Unggah dokumentasi", module: "media" },
  { code: "media.update", name: "Ubah dokumentasi", module: "media" },
  { code: "media.review", name: "Tinjau privasi dokumentasi", module: "media" },
  { code: "media.publish", name: "Terbitkan dokumentasi", module: "media" },
  // Reports
  { code: "report.read", name: "Lihat laporan", module: "governance" },
  { code: "report.create", name: "Susun laporan", module: "governance" },
  { code: "report.update", name: "Ubah laporan", module: "governance" },
  { code: "report.review", name: "Tinjau laporan", module: "governance" },
  { code: "report.approve", name: "Setujui laporan", module: "governance" },
  // Publications
  { code: "publication.read", name: "Lihat publikasi", module: "publishing" },
  { code: "publication.create", name: "Buat publikasi", module: "publishing" },
  { code: "publication.update", name: "Ubah publikasi", module: "publishing" },
  { code: "publication.review", name: "Tinjau publikasi", module: "publishing" },
  { code: "publication.publish", name: "Terbitkan publikasi", module: "publishing" },
  { code: "publication.archive", name: "Arsipkan publikasi", module: "publishing" },
  // Audit
  { code: "audit.read", name: "Lihat jejak audit", module: "audit" },
  // Administration
  { code: "user.read", name: "Lihat pengguna", module: "administration" },
  { code: "user.create", name: "Tambah pengguna", module: "administration" },
  { code: "user.update", name: "Ubah pengguna", module: "administration" },
  { code: "user.activate", name: "Aktifkan pengguna", module: "administration" },
  { code: "user.deactivate", name: "Nonaktifkan pengguna", module: "administration" },
  { code: "role.read", name: "Lihat peran", module: "administration" },
  { code: "role.manage", name: "Kelola peran", module: "administration" },
  { code: "permission.read", name: "Lihat hak akses", module: "administration" },
  { code: "permission.manage", name: "Kelola hak akses", module: "administration" },
  // Organization
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

const ALL_CODES = PERMISSION_REGISTRY.map((p) => p.code);

const DEFAULT_ROLE_MATRIX: Record<string, string[]> = {
  PLATFORM_ADMIN: ALL_CODES,
  ORG_ADMIN: ALL_CODES.filter((c) => c !== "organization.manage"),
  UNIT_COORDINATOR: [
    "student.read", "student.create", "student.update", "student.verify", "student.archive",
    "guardian.read", "guardian.create", "guardian.update",
    "academic-year.read", "class.read", "class.create", "class.update",
    "teacher.read", "schedule.read", "schedule.create", "schedule.update",
    "attendance.read", "attendance.record", "attendance.update", "attendance.export",
    "development.read", "development.create", "development.update", "development.review",
    "consent.read", "consent.create", "consent.update", "consent.review",
    "media.read", "media.review",
    "report.read", "report.create", "report.review",
    "publication.read", "publication.create", "publication.review",
    "user.read", "service-unit.read",
  ],
  PROGRAM_COORDINATOR: [
    "student.read", "attendance.read", "attendance.record", "attendance.update",
    "development.read", "development.create", "development.update", "development.review",
    "report.read", "report.create", "publication.read", "class.read", "schedule.read",
  ],
  TEACHER: [
    "student.read", "attendance.read", "attendance.record",
    "development.read", "development.create", "class.read", "schedule.read",
  ],
  VOLUNTEER: ["student.read", "attendance.read", "class.read", "schedule.read"],
  EDITOR: [
    "publication.read", "publication.create", "publication.update",
    "media.read", "media.create", "media.update",
  ],
  REVIEWER: ["report.read", "report.review", "publication.read", "publication.review", "media.read", "media.review", "consent.read", "consent.review"],
  APPROVER: ["report.read", "report.approve", "publication.read", "publication.publish"],
  AUDITOR: ["audit.read", "report.read", "publication.read", "consent.read", "student.read"],
  STAKEHOLDER: ["publication.read", "report.read"],
};

/**
 * Complete 11 Demo Users (U-07 & U-08: 1 per official role 05 §6).
 */
const DEMO_USERS: {
  email: string;
  name: string;
  roleCode: string;
  orgCode: "PMKI_SINODAL" | "PMKI_MUPEL_JATIM";
}[] = [
  { email: "superadmin@pmki.org", name: "Administrator PMKI", roleCode: "PLATFORM_ADMIN", orgCode: "PMKI_SINODAL" },
  { email: "orgadmin.jatim@pmki.org", name: "Sekretaris Mupel Jatim", roleCode: "ORG_ADMIN", orgCode: "PMKI_MUPEL_JATIM" },
  { email: "pengurus.lawang@pmki.org", name: "Ms. Evi S.Pd", roleCode: "UNIT_COORDINATOR", orgCode: "PMKI_MUPEL_JATIM" },
  { email: "koordinator.program@pmki.org", name: "Theresia Maria S.Pd", roleCode: "PROGRAM_COORDINATOR", orgCode: "PMKI_MUPEL_JATIM" },
  { email: "guru.matematika@pmki.org", name: "Budi Santoso S.Pd", roleCode: "TEACHER", orgCode: "PMKI_MUPEL_JATIM" },
  { email: "relawan.lawang@pmki.org", name: "Agustinus Wibowo", roleCode: "VOLUNTEER", orgCode: "PMKI_MUPEL_JATIM" },
  { email: "lilian@pmki.org", name: "Ms. Lilian (Humas)", roleCode: "EDITOR", orgCode: "PMKI_MUPEL_JATIM" },
  { email: "peninjau.privasi@pmki.org", name: "Clara Novita S.Pd", roleCode: "REVIEWER", orgCode: "PMKI_MUPEL_JATIM" },
  { email: "penyetuju.mupel@pmki.org", name: "Pdt. Andreas (BPH Mupel)", roleCode: "APPROVER", orgCode: "PMKI_MUPEL_JATIM" },
  { email: "auditor@pmki.org", name: "Auditor Independen PMKI", roleCode: "AUDITOR", orgCode: "PMKI_SINODAL" },
  { email: "pemangku@pmki.org", name: "Perwakilan Jemaat Lawang", roleCode: "STAKEHOLDER", orgCode: "PMKI_MUPEL_JATIM" },
];

async function ensureAuthUser(
  supabaseAdmin: Pick<ReturnType<typeof createClient>, "auth">,
  email: string,
  name: string
): Promise<string> {
  const { data: listData, error: listError } =
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listError) throw listError;

  const existing = listData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (existing) return existing.id;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: "PmkiDemo2026!",
    email_confirm: true,
    user_metadata: { name },
  });
  if (error || !data.user) {
    throw error ?? new Error(`Failed to create auth user ${email}`);
  }
  return data.user.id;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local"
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Organizations
  await db
    .insert(organizations)
    .values({
      code: "PMKI_SINODAL",
      name: "PMKI Sinodal (Pusat)",
      type: "SINODAL",
      address: "Kantor Sinode PMKI, Jakarta",
      contactEmail: "sekretariat@pmki.org",
      contactPhone: "+62 21-555-0100",
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
      address: "Jl. Pelayanan Kasih No. 12, Jawa Timur",
      contactEmail: "mupel.jatim@pmki.org",
      contactPhone: "+62 31-888-2345",
    })
    .onConflictDoNothing({ target: organizations.code });

  const [orgJatim] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.code, "PMKI_MUPEL_JATIM"));

  // 2. Service Unit & Program
  await db
    .insert(serviceUnits)
    .values({
      organizationId: orgJatim.id,
      code: "RB_GRIYA_ASIH_LAWANG",
      name: "Rumah Belajar Griya Asih Lawang",
      description:
        "Pilot pelayanan bimbingan belajar inklusif di wilayah Kalirejo & Lawang.",
      location:
        'RAAL (Rumah Asuh Anak & Lansia) "Griya Asih" Lawang, Kab. Malang, Jawa Timur',
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
      description:
        "Program bimbingan Matematika, Bahasa Inggris, Karakter, dan Literasi Membaca 1 Jam.",
    })
    .onConflictDoNothing({ target: programs.code });

  const [progBimbel] = await db
    .select()
    .from(programs)
    .where(eq(programs.code, "PROG_BIMBEL_SABTU"));

  // 3. Roles & Permissions (05 §6, §8, §9)
  for (const r of SYSTEM_ROLES) {
    await db
      .insert(roles)
      .values(r)
      .onConflictDoNothing({ target: roles.code });
  }
  for (const p of PERMISSION_REGISTRY) {
    await db
      .insert(permissions)
      .values(p)
      .onConflictDoNothing({ target: permissions.code });
  }

  const allRoles = await db.select().from(roles);
  const allPerms = await db.select().from(permissions);
  const roleByCode = new Map(allRoles.map((r) => [r.code, r]));
  const permByCode = new Map(allPerms.map((p) => [p.code, p]));

  for (const [roleCode, permCodes] of Object.entries(DEFAULT_ROLE_MATRIX)) {
    const roleRow = roleByCode.get(roleCode);
    if (!roleRow) continue;
    for (const pCode of permCodes) {
      const permRow = permByCode.get(pCode);
      if (!permRow) continue;
      await db
        .insert(rolePermissions)
        .values({ roleId: roleRow.id, permissionId: permRow.id })
        .onConflictDoNothing();
    }
  }

  // 4. Provision 11 Demo Users via Supabase Auth Admin API -> public.users + user_roles + user_memberships
  const userIdByRole = new Map<string, string>();
  for (const demo of DEMO_USERS) {
    const uid = await ensureAuthUser(supabaseAdmin, demo.email, demo.name);
    userIdByRole.set(demo.roleCode, uid);

    await db
      .insert(users)
      .values({ id: uid, name: demo.name, email: demo.email, active: true })
      .onConflictDoNothing({ target: users.email });

    const roleRow = roleByCode.get(demo.roleCode);
    if (roleRow) {
      await db
        .insert(userRoles)
        .values({ userId: uid, roleId: roleRow.id })
        .onConflictDoNothing();
    }

    const orgId = demo.orgCode === "PMKI_SINODAL" ? orgSinodal.id : orgJatim.id;
    await db
      .insert(userMemberships)
      .values({
        userId: uid,
        organizationId: orgId,
        serviceUnitId: unitGriyaAsih.id,
        programId: progBimbel.id,
      })
      .onConflictDoNothing();
  }

  // Example Dynamic Overrides (05 §10–11):
  // - GRANT `guardian.read` to TEACHER (Pak Budi)
  // - REVOKE `attendance.read` from VOLUNTEER (example revoke override)
  const teacherUid = userIdByRole.get("TEACHER");
  const volunteerUid = userIdByRole.get("VOLUNTEER");
  const guardianReadPerm = permByCode.get("guardian.read");
  const attendanceReadPerm = permByCode.get("attendance.read");
  if (teacherUid && guardianReadPerm) {
    await db
      .insert(userPermissions)
      .values({
        userId: teacherUid,
        permissionId: guardianReadPerm.id,
        mode: "GRANT",
        reason: "Contoh override GRANT untuk komunikasi wali kelas",
      })
      .onConflictDoNothing();
  }
  if (volunteerUid && attendanceReadPerm) {
    await db
      .insert(userPermissions)
      .values({
        userId: volunteerUid,
        permissionId: attendanceReadPerm.id,
        mode: "REVOKE",
        reason: "Contoh override REVOKE (revoke selalu menang)",
      })
      .onConflictDoNothing();
  }

  // 5. Academic Years, Subjects, Development Categories, Teachers, Classes
  const existingYears = await db.select().from(academicYears);
  let activeYear = existingYears.find((y) => y.name === "2026/2027");
  if (!activeYear) {
    const inserted = await db
      .insert(academicYears)
      .values([
        {
          serviceUnitId: unitGriyaAsih.id,
          name: "2026/2027",
          startDate: "2026-07-01",
          endDate: "2027-06-30",
          active: true,
        },
        {
          serviceUnitId: unitGriyaAsih.id,
          name: "2025/2026",
          startDate: "2025-07-07",
          endDate: "2026-06-30",
          active: false,
        },
      ])
      .returning();
    activeYear = inserted[0];
  }

  const existingSubjects = await db.select().from(subjects);
  let subjectMath = existingSubjects.find((s) => s.code === "MTK");
  if (existingSubjects.length === 0) {
    const inserted = await db
      .insert(subjects)
      .values([
        { serviceUnitId: unitGriyaAsih.id, code: "MTK", name: "Matematika & Berhitung Ceria" },
        { serviceUnitId: unitGriyaAsih.id, code: "ENG", name: "Bahasa Inggris & Percakapan" },
        { serviceUnitId: unitGriyaAsih.id, code: "KAR", name: "Pendidikan Karakter & Budi Pekerti" },
        { serviceUnitId: unitGriyaAsih.id, code: "LIT", name: "Kelas Khusus Membaca (Literasi 1 Jam)" },
      ])
      .returning();
    subjectMath = inserted[0];
  }

  const existingCats = await db.select().from(developmentCategories);
  let catLiteracy = existingCats.find((c) => c.code === "LITERACY");
  if (existingCats.length === 0) {
    const inserted = await db
      .insert(developmentCategories)
      .values([
        { serviceUnitId: unitGriyaAsih.id, code: "ACADEMIC", name: "Akademik" },
        { serviceUnitId: unitGriyaAsih.id, code: "CHARACTER", name: "Karakter" },
        { serviceUnitId: unitGriyaAsih.id, code: "LITERACY", name: "Literasi Membaca" },
        { serviceUnitId: unitGriyaAsih.id, code: "DISCIPLINE", name: "Kedisiplinan" },
        { serviceUnitId: unitGriyaAsih.id, code: "SOCIAL", name: "Empati & Sosial" },
      ])
      .returning();
    catLiteracy = inserted[2];
  }

  const existingTeachers = await db.select().from(teachers);
  let teacherBudi = existingTeachers.find((t) => t.name === "Budi Santoso S.Pd");
  if (existingTeachers.length === 0) {
    const inserted = await db
      .insert(teachers)
      .values([
        {
          userId: userIdByRole.get("UNIT_COORDINATOR"),
          organizationId: orgJatim.id,
          serviceUnitId: unitGriyaAsih.id,
          name: "Ms. Evi S.Pd",
          phone: "+62 812-323-5318",
          email: "pengurus.lawang@pmki.org",
          originSchool: "Sekolah Katholik Lawang",
          isCoordinator: true,
        },
        {
          userId: userIdByRole.get("TEACHER"),
          organizationId: orgJatim.id,
          serviceUnitId: unitGriyaAsih.id,
          name: "Budi Santoso S.Pd",
          phone: "+62 815-1122-3344",
          email: "guru.matematika@pmki.org",
          originSchool: "SDN Lawang 1",
          isCoordinator: false,
        },
      ])
      .returning();
    teacherBudi = inserted[1];
  }

  const existingClasses = await db.select().from(classes);
  let classSd2 = existingClasses.find((c) => c.name === "SD Kelas 2");
  if (existingClasses.length === 0 && activeYear) {
    const inserted = await db
      .insert(classes)
      .values([
        {
          organizationId: orgJatim.id,
          serviceUnitId: unitGriyaAsih.id,
          academicYearId: activeYear.id,
          programId: progBimbel.id,
          name: "SD Kelas 2",
          category: "SD",
          capacity: 20,
          roomName: "Ruang Belajar A",
        },
        {
          organizationId: orgJatim.id,
          serviceUnitId: unitGriyaAsih.id,
          academicYearId: activeYear.id,
          programId: progBimbel.id,
          name: "SMP Kelas 7-8",
          category: "SMP",
          capacity: 20,
          roomName: "Ruang Belajar B",
        },
      ])
      .returning();
    classSd2 = inserted[0];
  }

  if (teacherBudi && classSd2 && activeYear) {
    await db
      .insert(teacherAssignments)
      .values({
        teacherId: teacherBudi.id,
        classId: classSd2.id,
        academicYearId: activeYear.id,
        isMainTeacher: true,
      })
      .onConflictDoNothing();

    const existingSched = await db.select().from(schedules);
    if (existingSched.length === 0 && subjectMath) {
      await db.insert(schedules).values({
        serviceUnitId: unitGriyaAsih.id,
        classId: classSd2.id,
        teacherId: teacherBudi.id,
        subjectId: subjectMath.id,
        dayOfWeek: "Sabtu",
        startTime: "15:00",
        endTime: "15:45",
        location: "Ruang Belajar A — RAAL Griya Asih",
      });
    }
  }

  // 6. Sample Student, Guardian, Enrollment, Consent, Attendance, Development Note, Report, Publication, Audit
  const existingStudents = await db.select().from(students);
  if (existingStudents.length === 0 && activeYear && classSd2 && teacherBudi && catLiteracy) {
    const [stud1] = await db
      .insert(students)
      .values({
        organizationId: orgJatim.id,
        serviceUnitId: unitGriyaAsih.id,
        academicYearId: activeYear.id,
        assignedClassId: classSd2.id,
        registrationNumber: "RBGA-2026-0001",
        fullName: "Rafael Putra Pratama",
        nickname: "Rafael",
        birthDate: "2018-04-12",
        gender: "L",
        educationLevel: "SD_2",
        schoolName: "SDN Kalirejo 1",
        address: "Jl. Kalirejo RT 03/02, Lawang",
        district: "Kalirejo",
        registrationStatus: "ACTIVE",
      })
      .returning();

    const [guard1] = await db
      .insert(guardians)
      .values({
        serviceUnitId: unitGriyaAsih.id,
        fullName: "Ibu Maria Pratama",
        phone: "081234567890",
        occupation: "Karyawan Pabrik",
        address: "Jl. Kalirejo RT 03/02, Lawang",
      })
      .returning();

    await db.insert(studentGuardians).values({
      studentId: stud1.id,
      guardianId: guard1.id,
      relationship: "IBU",
      isPrimary: true,
    });

    await db.insert(classEnrollments).values({
      studentId: stud1.id,
      classId: classSd2.id,
      academicYearId: activeYear.id,
      status: "ACTIVE",
    });

    await db.insert(consents).values({
      organizationId: orgJatim.id,
      serviceUnitId: unitGriyaAsih.id,
      studentId: stud1.id,
      guardianId: guard1.id,
      personalDataConsent: "GRANTED",
      photoVideoConsent: "GRANTED",
      notes: "Disetujui wali saat pendaftaran awal.",
    });

    const [sess1] = await db
      .insert(attendanceSessions)
      .values({
        organizationId: orgJatim.id,
        serviceUnitId: unitGriyaAsih.id,
        classId: classSd2.id,
        teacherId: teacherBudi.id,
        sessionDate: "2026-11-14",
        notes: "Sesi Sabtu lancar, fokus latihan perkalian dasar.",
      })
      .returning();

    await db.insert(attendanceRecords).values({
      sessionId: sess1.id,
      studentId: stud1.id,
      status: "PRESENT",
    });

    const [note1] = await db
      .insert(developmentNotes)
      .values({
        organizationId: orgJatim.id,
        serviceUnitId: unitGriyaAsih.id,
        studentId: stud1.id,
        teacherId: teacherBudi.id,
        categoryId: catLiteracy.id,
        observation: "Rafael menunjukkan kemajuan membaca kalimat pendek secara mandiri.",
        progress: "Sudah lancar membaca dua suku kata tanpa mengeja.",
        followUp: "Lanjutkan bacaan cerita pendek 10 menit di sesi berikutnya.",
        confidential: true,
        version: 1,
      })
      .returning();

    await db.insert(developmentNoteRevisions).values({
      noteId: note1.id,
      version: 1,
      observation: note1.observation,
      progress: note1.progress,
      followUp: note1.followUp,
      confidential: note1.confidential,
      actorId: userIdByRole.get("TEACHER"),
    });

    const coordinatorUid = userIdByRole.get("UNIT_COORDINATOR")!;
    const [rep1] = await db
      .insert(reports)
      .values({
        organizationId: orgJatim.id,
        serviceUnitId: unitGriyaAsih.id,
        title: "Laporan Kegiatan Belajar November 2026",
        reportType: "ACTIVITY",
        period: "2026-11",
        summary: "Rekap kegiatan belajar Sabtu dan perkembangan kelas literasi.",
        status: "PROGRAM_REVIEW",
        classification: "INTERNAL",
        createdBy: coordinatorUid,
      })
      .returning();

    await db.insert(reportWorkflowLogs).values({
      reportId: rep1.id,
      action: "SUBMIT_FOR_REVIEW",
      fromStatus: "DRAFT",
      toStatus: "PROGRAM_REVIEW",
      comment: "Diajukan untuk tinjauan program.",
      actorId: coordinatorUid,
    });

    const editorUid = userIdByRole.get("EDITOR")!;
    const [media1] = await db
      .insert(mediaAssets)
      .values({
        organizationId: orgJatim.id,
        serviceUnitId: unitGriyaAsih.id,
        title: "Suasana Belajar Sabtu Griya Asih",
        description: "Kegiatan pendampingan tatap muka bersama pengajar relawan.",
        filePath: "griya-asih/griya_asih_4.jpg",
        category: "KEGIATAN",
        privacyReviewed: true,
        eligibleForPublic: true,
        reviewedBy: userIdByRole.get("REVIEWER"),
        createdBy: editorUid,
      })
      .returning();

    await db.insert(publications).values({
      organizationId: orgJatim.id,
      serviceUnitId: unitGriyaAsih.id,
      title: "Semangat Belajar Bersama di Rumah Belajar Griya Asih",
      slug: "semangat-belajar-bersama-griya-asih",
      category: "BERITA",
      excerpt: "Cerita kebersamaan peserta didik dan pengajar relawan di Lawang.",
      content:
        "Setiap hari Sabtu pukul 15.00 hingga 17.15 WIB, peserta didik dan pengajar relawan berkumpul untuk belajar Matematika, Bahasa Inggris, Karakter, dan Literasi Membaca.",
      coverMediaId: media1.id,
      status: "PUBLISHED",
      publishedAt: new Date("2026-11-15T08:00:00Z"),
      createdBy: editorUid,
    });

    await db.insert(auditLogs).values({
      organizationId: orgJatim.id,
      serviceUnitId: unitGriyaAsih.id,
      actorId: userIdByRole.get("PLATFORM_ADMIN"),
      action: "SEED_INITIALIZED",
      entityType: "service_unit",
      entityId: unitGriyaAsih.id,
      description: "Inisialisasi data contoh pengembangan Rumah Belajar Griya Asih.",
    });
  }

  // 7. Ensure Full Authentic Public Gallery Media Assets & Publications (UI-12 Parity)
  const editorUid = userIdByRole.get("EDITOR")!;
  const reviewerUid = userIdByRole.get("REVIEWER")!;

  const AUTHENTIC_MEDIA_SEED: {
    filePath: string;
    localFile: string;
    title: string;
    description: string;
    category: "KEGIATAN" | "PENGURUS" | "ACARA";
    capturedDate: string;
    privacyReviewed: boolean;
    eligibleForPublic: boolean;
  }[] = [
    {
      filePath: "griya-asih/griya_asih_4.jpg",
      localFile: "griya_asih_4.jpg",
      title: "Suasana Belajar Sabtu Griya Asih",
      description:
        "Pengajar relawan mendampingi peserta didik dengan meja belajar lipat individual dalam suasana Happy Learning.",
      category: "KEGIATAN",
      capturedDate: "2026-08-15",
      privacyReviewed: true,
      eligibleForPublic: true,
    },
    {
      filePath: "griya-asih/griya_asih_1.jpg",
      localFile: "griya_asih_1.jpg",
      title: "Dedikasi Pengurus Rumah Belajar Griya Asih",
      description:
        "Pengurus Rumah Belajar Griya Asih bersama pembina pelayanan di RAAL Lawang.",
      category: "PENGURUS",
      capturedDate: "2025-07-07",
      privacyReviewed: true,
      eligibleForPublic: true,
    },
    {
      filePath: "griya-asih/griya_asih_2.jpg",
      localFile: "griya_asih_2.jpg",
      title: "Kegembiraan Peserta Didik Rumah Belajar Griya Asih",
      description:
        "Peserta didik berkumpul bersama dalam perayaan Dirgahayu Republik Indonesia dengan penuh semangat.",
      category: "ACARA",
      capturedDate: "2025-08-17",
      privacyReviewed: true,
      eligibleForPublic: true,
    },
    {
      filePath: "griya-asih/griya_asih_3.jpg",
      localFile: "griya_asih_3.jpg",
      title: "Peresmian Pengurus Departemen Pelkes Sub Bidang PMKI Sinodal",
      description:
        "Serah terima plakat Rumah Belajar Griya Asih bersama jajaran Departemen Pelkes PMKI Sinodal.",
      category: "PENGURUS",
      capturedDate: "2025-07-07",
      privacyReviewed: true,
      eligibleForPublic: true,
    },
    {
      filePath: "griya-asih/griya_asih_5.jpg",
      localFile: "griya_asih_5.jpg",
      title: "Diskusi Kelompok Matematika Ceria",
      description:
        "Peserta didik saling berdiskusi dan membantu menyelesaikan latihan soal berhitung.",
      category: "KEGIATAN",
      capturedDate: "2026-09-05",
      privacyReviewed: true,
      eligibleForPublic: true,
    },
    {
      filePath: "griya-asih/griya_asih_7.jpg",
      localFile: "griya_asih_7.jpg",
      title: "Pojok Baca dan Literasi Peserta Didik TK & SD",
      description:
        "Kelas membaca intensif 1 jam bagi peserta didik yang membutuhkan penguatan membaca mandiri.",
      category: "KEGIATAN",
      capturedDate: "2026-09-12",
      privacyReviewed: true,
      eligibleForPublic: true,
    },
    {
      filePath: "griya-asih/griya_asih_8.jpg",
      localFile: "griya_asih_8.jpg",
      title: "Kelompok Belajar Peserta Didik SMP Kelas 7 & 8",
      description:
        "Belajar bersama pengajar relawan untuk materi matematika penalaran dan Bahasa Inggris lanjutan.",
      category: "KEGIATAN",
      capturedDate: "2026-09-19",
      privacyReviewed: true,
      eligibleForPublic: true,
    },
    {
      filePath: "griya-asih/griya_asih_9.jpg",
      localFile: "griya_asih_9.jpg",
      title: "Foto Bersama di Halaman Rumah Belajar Griya Asih",
      description:
        "Seluruh peserta didik dan pengajar relawan dengan seragam biru Rumah Belajar Griya Asih Lawang.",
      category: "ACARA",
      capturedDate: "2026-10-03",
      privacyReviewed: true,
      eligibleForPublic: true,
    },
    {
      filePath: "griya-asih/griya_asih_10.jpg",
      localFile: "griya_asih_10.jpg",
      title: "Sesi Pembinaan Karakter dan Budi Pekerti",
      description:
        "Peserta didik mendengarkan kisah teladan dan latihan memberi salam santun serta empati kepada sesama.",
      category: "KEGIATAN",
      capturedDate: "2026-10-17",
      privacyReviewed: true,
      eligibleForPublic: true,
    },
    {
      filePath: "griya-asih/griya_asih_11.jpg",
      localFile: "griya_asih_11.jpg",
      title: "Suasana Ruang Belajar Nyaman dan Terbuka",
      description:
        "Pendampingan satu per satu oleh pengajar relawan dari sekolah Katolik dan sekolah negeri sekitar Lawang.",
      category: "KEGIATAN",
      capturedDate: "2026-10-24",
      privacyReviewed: true,
      eligibleForPublic: true,
    },
    {
      filePath: "griya-asih/griya_asih_12.jpg",
      localFile: "griya_asih_12.jpg",
      title: "Dokumentasi Internal Belum Ditinjau Privasi",
      description:
        "Arsip internal dokumentasi sesi yang belum melalui tinjauan privasi wali.",
      category: "KEGIATAN",
      capturedDate: "2026-11-01",
      privacyReviewed: false,
      eligibleForPublic: false,
    },
  ];

  const existingMedia = await db.select().from(mediaAssets);
  const mediaByPath = new Map(existingMedia.map((m) => [m.filePath, m]));

  for (const item of AUTHENTIC_MEDIA_SEED) {
    const localImgPath = path.resolve(
      process.cwd(),
      "public",
      "images",
      "gallery",
      item.localFile
    );
    if (fs.existsSync(localImgPath)) {
      const fileBuffer = fs.readFileSync(localImgPath);
      await supabaseAdmin.storage
        .from("media")
        .upload(item.filePath, fileBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });
    }

    if (!mediaByPath.has(item.filePath)) {
      const [insertedMedia] = await db
        .insert(mediaAssets)
        .values({
          organizationId: orgJatim.id,
          serviceUnitId: unitGriyaAsih.id,
          title: item.title,
          description: item.description,
          filePath: item.filePath,
          mimeType: "image/jpeg",
          category: item.category,
          capturedDate: item.capturedDate,
          privacyReviewed: item.privacyReviewed,
          eligibleForPublic: item.eligibleForPublic,
          reviewedBy: item.privacyReviewed ? reviewerUid : null,
          reviewedAt: item.privacyReviewed ? new Date() : null,
          createdBy: editorUid,
        })
        .returning();
      if (insertedMedia) {
        mediaByPath.set(item.filePath, insertedMedia);
      }
    }
  }

  const AUTHENTIC_PUBLICATIONS_SEED: {
    slug: string;
    title: string;
    category: "BERITA" | "ARTIKEL" | "AGENDA" | "PENGUMUMAN";
    excerpt: string;
    content: string;
    coverPath: string;
    status: "PUBLISHED" | "APPROVED";
    publishedAt: Date | null;
    eventDate?: string;
    eventLocation?: string;
  }[] = [
    {
      slug: "tahun-ajaran-2026-2027-buka-kelas-smp-8",
      title: "Tahun Ajaran 2026/2027: Griya Asih Buka Kelas Baru SMP Kelas 8",
      category: "BERITA",
      excerpt:
        "Merespons antusiasme dan permohonan orang tua wali peserta didik, Rumah Belajar Griya Asih Lawang resmi menambah jenjang kelas SMP Kelas 8.",
      content: `Di tahun ajaran 2026/2027 ini, pengurus Rumah Belajar Griya Asih Lawang bersepakat untuk menambah 1 kelas baru yaitu SMP Kelas 8. Sebelumnya pelayanan mencakup jenjang TK sampai dengan SMP Kelas 7.

Keputusan penting ini diambil berkaitan langsung dengan permintaan peserta didik dan orang tua wali agar dapat terus melanjutkan bimbingan belajar bersama para pengajar relawan di Griya Asih.

"Kami melihat semangat belajar anak-anak luar biasa. Dengan ditambahkannya kelas 8, kami menyiapkan metode penalaran matematika yang lebih mendalam, Bahasa Inggris lanjutan dengan metode percakapan serta role-play, dan buku referensi khusus," tutur Ms. Evi selaku Koordinator Unit.

Rumah Belajar Griya Asih kini didukung oleh 13 pengajar relawan berdedikasi yang berasal dari guru sekolah Katolik dan guru sekolah negeri di sekitar Lawang. Pembelajaran dilaksanakan setiap hari Sabtu pukul 15.00 s/d 17.15 WIB.`,
      coverPath: "griya-asih/griya_asih_8.jpg",
      status: "PUBLISHED",
      publishedAt: new Date("2026-08-01T09:00:00Z"),
    },
    {
      slug: "keberhasilan-kelas-khusus-membaca-1-jam",
      title: "Keberhasilan Kelas Membaca 1 Jam: Membuka Potensi Literasi Peserta Didik",
      category: "ARTIKEL",
      excerpt:
        "Tiga peserta didik kelas 2 yang sebelumnya belum lancar membaca kini berhasil membaca mandiri dengan percaya diri mengikuti pelajaran.",
      content: `Bagi peserta didik yang belum lancar membaca, Rumah Belajar Griya Asih membuka kelas khusus di mana pengajar relawan memberikan bimbingan membaca intensif selama 1 jam. Sesi ini dirancang personal dan menyenangkan agar peserta didik menemukan kegembiraan belajar ("Happy Learning").

Bukti nyata keberhasilan program ini tampak pada 3 peserta didik kelas 2 yang semula belum lancar membaca. Setelah rutin mengikuti sesi khusus membaca, saat ini mereka telah berhasil membaca dengan lancar sehingga di tahun ajaran 2026/2027 sudah dapat mengikuti kelas pembelajaran sesuai jenjangnya.

Kami percaya bahwa setiap anak memiliki kesempatan untuk berkembang. Dengan pendampingan yang tulus dan penuh kasih, peserta didik dapat bertumbuh menjadi pribadi yang percaya diri dan penuh rasa ingin tahu.`,
      coverPath: "griya-asih/griya_asih_7.jpg",
      status: "PUBLISHED",
      publishedAt: new Date("2026-09-15T10:00:00Z"),
    },
    {
      slug: "jadwal-bimbingan-belajar-semester-ganjil",
      title: "Jadwal Bimbingan Belajar Semester Ganjil 2026/2027",
      category: "AGENDA",
      excerpt:
        "Bimbingan belajar rutin setiap hari Sabtu pukul 15.00 – 17.15 WIB bertempat di RAAL Griya Asih Lawang.",
      content: `Diumumkan kepada seluruh orang tua dan wali peserta didik bahwa jadwal kegiatan bimbingan belajar Rumah Belajar Griya Asih berjalan rutin:

- Hari: Setiap Hari Sabtu
- Waktu: Pukul 15.00 s/d 17.15 WIB
- Tempat: RAAL (Rumah Asuh Anak & Lansia) "Griya Asih" Lawang, Kab. Malang
- Mata Pelajaran: Matematika Ceria, Bahasa Inggris Praktis, Pendidikan Karakter, dan Kelas Khusus Membaca (1 Jam).

Peserta didik diharapkan hadir 15 menit sebelum jam belajar dimulai dengan membawa buku catatan dan alat tulis masing-masing. Rumah belajar yang terbuka bagi semua anak di wilayah Kalirejo, Lawang, dan sekitarnya tanpa memandang latar belakang suku maupun agama.`,
      coverPath: "griya-asih/griya_asih_4.jpg",
      status: "PUBLISHED",
      publishedAt: new Date("2026-10-01T08:00:00Z"),
      eventDate: "2026-11-28",
      eventLocation: 'RAAL "Griya Asih" Lawang (Setiap Sabtu, 15.00 – 17.15 WIB)',
    },
    {
      slug: "sosialisasi-persiapan-ebta-sd-kelas-6",
      title: "Sosialisasi Persiapan Ujian Akhir Matematika SD Kelas 6",
      category: "PENGUMUMAN",
      excerpt:
        "Peserta didik kelas 6 mendapatkan modul pengayaan soal ujian akhir dan bimbingan penyelesaian soal cerita.",
      content: `Menghadapi evaluasi belajar tahap akhir, Rumah Belajar Griya Asih memberikan penguatan materi matematika berhitung angka besar dan penalaran soal cerita kepada peserta didik kelas 6 SD bersama pengajar relawan Antonius Kevin S.Pd.`,
      coverPath: "griya-asih/griya_asih_5.jpg",
      status: "APPROVED",
      publishedAt: null,
    },
  ];

  const existingPubs = await db.select().from(publications);
  const pubBySlug = new Map(existingPubs.map((p) => [p.slug, p]));

  for (const pub of AUTHENTIC_PUBLICATIONS_SEED) {
    if (!pubBySlug.has(pub.slug)) {
      const coverMedia = mediaByPath.get(pub.coverPath);
      await db.insert(publications).values({
        organizationId: orgJatim.id,
        serviceUnitId: unitGriyaAsih.id,
        title: pub.title,
        slug: pub.slug,
        category: pub.category,
        excerpt: pub.excerpt,
        content: pub.content,
        coverMediaId: coverMedia?.id ?? null,
        status: pub.status,
        publishedAt: pub.publishedAt,
        eventDate: pub.eventDate ?? null,
        eventLocation: pub.eventLocation ?? null,
        createdBy: editorUid,
      });
    }
  }

  console.log("PMKI dev-seed completed idempotently (11 roles, 11 demo users, full permission registry).");
}

main()
  .catch((err) => {
    console.error("dev-seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pgClient.end();
  });
