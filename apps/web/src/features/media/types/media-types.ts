export type MediaCategoryCode =
  | "KEGIATAN"
  | "ACARA"
  | "FASILITAS"
  | "PENGURUS";

export const MEDIA_CATEGORY_LABELS: Record<MediaCategoryCode, string> = {
  KEGIATAN: "Kegiatan belajar",
  ACARA: "Dokumentasi acara",
  FASILITAS: "Sarana & fasilitas",
  PENGURUS: "Pengurus & pengajar",
};

export interface CreateUploadUrlResultDTO {
  filePath: string;
  signedUrl: string;
  token: string;
  bucket: string;
}

export interface MediaAssetDTO {
  id: string;
  organizationId: string;
  serviceUnitId: string;
  title: string;
  description: string | null;
  filePath: string;
  mimeType: string | null;
  fileSize: number | null;
  category: MediaCategoryCode;
  categoryLabel: string;
  privacyReviewed: boolean;
  eligibleForPublic: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  capturedDate: string | null;
  uploadedBy: string | null;
  createdAt: string;
  signedReadUrl: string | null;
  signedUrlTtlSeconds: number | null;
}

