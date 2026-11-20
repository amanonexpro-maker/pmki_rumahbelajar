/**
 * Canonical Indonesian Audit Action Labels (10-CONTENT-MICROCOPY-GUIDE.md §19).
 */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  StudentRegistered: "Pendaftaran peserta didik diterima",
  StudentVerified: "Status pendaftaran diperbarui",
  StudentPlaced: "Peserta didik ditempatkan ke kelas",
  StudentProfileUpdated: "Profil peserta didik diperbarui",
  AttendanceRecorded: "Presensi sesi belajar dicatat",
  DevelopmentNoteCreated: "Catatan perkembangan disimpan",
  ConsentUpdated: "Persetujuan diperbarui / dicabut",
  MediaUploaded: "Dokumentasi diunggah ke bucket privat",
  MediaPrivacyReviewed: "Tinjauan privasi dokumentasi disimpan",
  PublicationDraftCreated: "Draft konten publikasi dibuat",
  PublicationStatusChanged: "Status konten publikasi diperbarui",
  PublicationPublished: "Publikasi ditayangkan",
  ReportDraftCreated: "Draft laporan pelayanan disusun",
  ReportWorkflowTransitioned: "Tahap laporan pelayanan diperbarui",
  ReportApproved: "Laporan pelayanan disetujui resmi",
  UserProvisioned: "Pengguna baru dibuat",
  UserDeactivated: "Pengguna dinonaktifkan",
  UserActivated: "Pengguna diaktifkan kembali",
  UserRolesUpdated: "Peran diperbarui",
  CustomRoleCreated: "Peran kustom baru dibuat",
  PermissionOverrideGranted: "Hak akses khusus diberikan",
  PermissionOverrideRevoked: "Hak akses khusus dicabut",
  PermissionOverrideRemoved: "Override hak akses dihapus",
  UserScopeUpdated: "Lingkup penugasan diperbarui",
};

export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export interface AuditLogItemDTO {
  id: string;
  organizationId: string | null;
  serviceUnitId: string | null;
  actorId: string | null;
  actorName: string;
  action: string;
  actionLabel: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata: Record<string, unknown>;
  originalTimestamp: string | null;
  syncedAt: string | null;
  createdAt: string;
}

export interface AuditLogFilterParams {
  search?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogListResultDTO {
  items: AuditLogItemDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

