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

