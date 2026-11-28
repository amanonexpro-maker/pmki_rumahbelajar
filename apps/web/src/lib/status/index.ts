/**
 * Single Source of Truth for Role & Status Labels (10-CONTENT-MICROCOPY-GUIDE.md §6–7).
 * Standard UI capitalization: Sentence case for statuses; canonical labels for roles.
 */

export type SystemRole =
  | "PLATFORM_ADMIN"
  | "ORG_ADMIN"
  | "UNIT_COORDINATOR"
  | "PROGRAM_COORDINATOR"
  | "TEACHER"
  | "VOLUNTEER"
  | "EDITOR"
  | "REVIEWER"
  | "APPROVER"
  | "AUDITOR"
  | "STAKEHOLDER";

export type StatusTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

export const ROLE_LABELS: Record<SystemRole, string> = {
  PLATFORM_ADMIN: "Administrator Platform",
  ORG_ADMIN: "Administrator Organisasi",
  UNIT_COORDINATOR: "Koordinator Unit",
  PROGRAM_COORDINATOR: "Koordinator Program",
  TEACHER: "Pengajar",
  VOLUNTEER: "Relawan",
  EDITOR: "Penyusun Konten",
  REVIEWER: "Peninjau",
  APPROVER: "Pejabat Penyetuju",
  AUDITOR: "Auditor",
  STAKEHOLDER: "Pemangku Kepentingan",
};

export type RegistrationStatus =
  | "SUBMITTED"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "CLASS_PLACEMENT"
  | "ACTIVE"
  | "WAITLIST"
  | "REJECTED"
  | "CANCELLED";

export const REGISTRATION_STATUS_META: Record<RegistrationStatus, StatusMeta> = {
  SUBMITTED: { label: "Pendaftaran masuk", tone: "warning" },
  PENDING_VERIFICATION: { label: "Menunggu verifikasi", tone: "warning" },
  VERIFIED: { label: "Terverifikasi", tone: "info" },
  CLASS_PLACEMENT: { label: "Penempatan kelas", tone: "info" },
  ACTIVE: { label: "Aktif belajar", tone: "success" },
  WAITLIST: { label: "Daftar tunggu", tone: "neutral" },
  REJECTED: { label: "Ditolak", tone: "danger" },
  CANCELLED: { label: "Dibatalkan", tone: "neutral" },
};

export type AttendanceStatus = "PRESENT" | "ABSENT" | "SICK" | "PERMITTED";

export const ATTENDANCE_STATUS_META: Record<AttendanceStatus, StatusMeta> = {
  PRESENT: { label: "Hadir", tone: "success" },
  ABSENT: { label: "Tidak hadir", tone: "danger" },
  SICK: { label: "Sakit", tone: "warning" },
  PERMITTED: { label: "Izin", tone: "info" },
};

export type ConsentStatus = "GRANTED" | "DENIED" | "REVOKED";

export const CONSENT_STATUS_META: Record<ConsentStatus, StatusMeta> = {
  GRANTED: { label: "Disetujui", tone: "success" },
  DENIED: { label: "Tidak diizinkan", tone: "neutral" },
  REVOKED: { label: "Izin dicabut", tone: "danger" },
};

export type ReportStatus =
  | "DRAFT"
  | "PROGRAM_REVIEW"
  | "UNIT_VALIDATION"
  | "ORGANIZATION_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export const REPORT_STATUS_META: Record<ReportStatus, StatusMeta> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PROGRAM_REVIEW: { label: "Tinjauan program", tone: "info" },
  UNIT_VALIDATION: { label: "Validasi unit", tone: "warning" },
  ORGANIZATION_APPROVAL: { label: "Persetujuan organisasi", tone: "warning" },
  APPROVED: { label: "Disetujui", tone: "success" },
  REJECTED: { label: "Ditolak", tone: "danger" },
};

export type PublicationStatus =
  | "DRAFT"
  | "PRIVACY_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED";

export const PUBLICATION_STATUS_META: Record<PublicationStatus, StatusMeta> = {
  DRAFT: { label: "Draft konten", tone: "neutral" },
  PRIVACY_REVIEW: { label: "Tinjauan privasi", tone: "warning" },
  APPROVED: { label: "Disetujui editorial", tone: "info" },
  PUBLISHED: { label: "Tayang di publik", tone: "success" },
  ARCHIVED: { label: "Diarsipkan", tone: "neutral" },
};

export type SyncStatus = "LOCAL_SAVED" | "UNSYNCED" | "PENDING_SYNC" | "SYNCED";

export const SYNC_STATUS_META: Record<SyncStatus, StatusMeta> = {
  LOCAL_SAVED: { label: "Disimpan lokal", tone: "warning" },
  UNSYNCED: { label: "Belum tersinkronisasi", tone: "warning" },
  PENDING_SYNC: { label: "Menunggu sinkronisasi", tone: "info" },
  SYNCED: { label: "Tersinkronisasi", tone: "success" },
};

export function getRoleLabel(role: SystemRole): string {
  return ROLE_LABELS[role];
}

export type AuditEntityType =
  | "student"
  | "attendance_session"
  | "development_note"
  | "consent"
  | "media_asset"
  | "publication"
  | "report"
  | "user"
  | "role"
  | "user_permission"
  | "user_membership";

export const AUDIT_ENTITY_META: Record<AuditEntityType, { label: string }> = {
  student: { label: "Peserta didik" },
  attendance_session: { label: "Sesi kehadiran" },
  development_note: { label: "Catatan perkembangan" },
  consent: { label: "Persetujuan wali" },
  media_asset: { label: "Dokumentasi" },
  publication: { label: "Publikasi" },
  report: { label: "Laporan pelayanan" },
  user: { label: "Pengguna" },
  role: { label: "Peran" },
  user_permission: { label: "Override hak akses" },
  user_membership: { label: "Lingkup penugasan" },
} as const;

export function getAuditEntityLabel(code: string): string {
  return AUDIT_ENTITY_META[code as AuditEntityType]?.label ?? code;
}

export const PERMISSION_LABELS: Record<string, string> = {
  "student.read": "Lihat peserta didik",
  "student.create": "Tambah peserta didik",
  "student.update": "Ubah peserta didik",
  "student.verify": "Verifikasi pendaftaran",
  "student.archive": "Arsipkan peserta didik",
  "student.import": "Impor peserta didik",
  "student.export": "Ekspor peserta didik",
  "guardian.read": "Lihat data wali",
  "guardian.create": "Tambah data wali",
  "guardian.update": "Ubah data wali",
  "academic-year.read": "Lihat tahun ajaran",
  "academic-year.manage": "Kelola tahun ajaran",
  "class.read": "Lihat kelas",
  "class.create": "Tambah kelas",
  "class.update": "Ubah kelas",
  "class.archive": "Arsipkan kelas",
  "teacher.read": "Lihat pengajar",
  "teacher.create": "Tambah pengajar",
  "teacher.update": "Ubah pengajar",
  "schedule.read": "Lihat jadwal",
  "schedule.create": "Tambah jadwal",
  "schedule.update": "Ubah jadwal",
  "attendance.read": "Lihat kehadiran",
  "attendance.record": "Catat presensi",
  "attendance.update": "Ubah presensi",
  "attendance.export": "Ekspor kehadiran",
  "development.read": "Lihat catatan perkembangan",
  "development.create": "Tambah catatan perkembangan",
  "development.update": "Ubah catatan perkembangan",
  "development.review": "Tinjau catatan perkembangan",
  "consent.read": "Lihat persetujuan",
  "consent.create": "Catat persetujuan",
  "consent.update": "Perbarui persetujuan",
  "consent.review": "Tinjau persetujuan",
  "media.read": "Lihat dokumentasi",
  "media.create": "Unggah dokumentasi",
  "media.update": "Ubah dokumentasi",
  "media.review": "Tinjau privasi dokumentasi",
  "media.publish": "Terbitkan dokumentasi",
  "report.read": "Lihat laporan",
  "report.create": "Susun laporan",
  "report.update": "Ubah laporan",
  "report.review": "Tinjau laporan",
  "report.approve": "Setujui laporan",
  "publication.read": "Lihat publikasi",
  "publication.create": "Buat publikasi",
  "publication.update": "Ubah publikasi",
  "publication.review": "Tinjau publikasi",
  "publication.publish": "Terbitkan publikasi",
  "publication.archive": "Arsipkan publikasi",
  "audit.read": "Lihat jejak audit",
  "user.read": "Lihat pengguna",
  "user.create": "Tambah pengguna",
  "user.update": "Ubah pengguna",
  "user.activate": "Aktifkan pengguna",
  "user.deactivate": "Nonaktifkan pengguna",
  "role.read": "Lihat peran",
  "role.manage": "Kelola peran",
  "permission.read": "Lihat hak akses",
  "permission.manage": "Kelola hak akses",
  "organization.read": "Lihat organisasi",
  "organization.manage": "Kelola organisasi",
  "service-unit.read": "Lihat unit layanan",
  "service-unit.manage": "Kelola unit layanan",
};

export function getPermissionLabel(code: string): string {
  return PERMISSION_LABELS[code] ?? code;
}



