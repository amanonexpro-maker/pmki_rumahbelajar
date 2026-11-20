import type { ErrorCode } from "@/server/contracts/result";

/**
 * Human-readable Indonesian messages (10-CONTENT-MICROCOPY-GUIDE.md §12–17)
 * and mapping from API Error Codes (09 §24) so technical codes never leak to UI.
 */

export const ERROR_CODE_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHORIZED: "Silakan masuk terlebih dahulu untuk melanjutkan.",
  PERMISSION_DENIED: "Anda tidak memiliki akses untuk tindakan ini.",
  SCOPE_DENIED: "Data ini berada di luar cakupan unit layanan Anda.",
  POLICY_DENIED:
    "Tindakan ini tidak dapat dilakukan sesuai kebijakan tata kelola.",
  VALIDATION_FAILED: "Periksa kembali data yang Anda masukkan.",
  RESOURCE_NOT_FOUND: "Data tidak ditemukan.",
  RESOURCE_CONFLICT: "Data sudah pernah diproses atau mengalami konflik.",
  INTERNAL_ERROR: "Gagal menyimpan perubahan. Silakan coba kembali.",
};

export function getHumanErrorMessage(code: ErrorCode): string {
  return ERROR_CODE_MESSAGES[code];
}

export const VALIDATION_MESSAGES = {
  studentNameRequired: "Masukkan nama lengkap peserta didik.",
  classRequired: "Pilih kelas terlebih dahulu.",
  whatsappRequired: "Masukkan nomor WhatsApp yang dapat dihubungi.",
  consentChoiceRequired: "Pilih salah satu opsi persetujuan.",
} as const;

export const SUCCESS_MESSAGES = {
  registrationSubmitted: "Pendaftaran berhasil dikirim.",
  attendanceSaved: "Presensi berhasil disimpan.",
  developmentNoteAdded: "Catatan perkembangan berhasil ditambahkan.",
  consentUpdated: "Persetujuan berhasil diperbarui.",
  publicationPublished: "Publikasi berhasil diterbitkan.",
  changesSaved: "Perubahan berhasil disimpan.",
} as const;

export const OFFLINE_MESSAGES = {
  savedLocally:
    "Koneksi internet tidak tersedia. Perubahan disimpan secara lokal.",
  syncPending: "Menunggu koneksi untuk menyinkronkan data.",
} as const;

export const PRIVACY_MESSAGES = {
  mediaConsentIndependent:
    "Persetujuan publikasi foto dan video tidak mempengaruhi partisipasi peserta didik dalam kegiatan belajar.",
  auditLogged: "Keputusan akan dicatat dalam jejak audit.",
  sodApprovalRestricted:
    "Persetujuan akhir tidak dapat diberikan oleh penyusun laporan.",
} as const;

