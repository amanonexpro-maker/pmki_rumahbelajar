import type { PublicationStatus } from "@/lib/status";

export type PublicationCategoryCode =
  | "BERITA"
  | "AGENDA"
  | "PENGUMUMAN"
  | "ARTIKEL";

export const PUBLICATION_CATEGORY_LABELS: Record<
  PublicationCategoryCode,
  string
> = {
  BERITA: "Berita kegiatan",
  AGENDA: "Agenda pelayanan",
  PENGUMUMAN: "Pengumuman resmi",
  ARTIKEL: "Artikel literasi",
};

export interface PublicationDTO {
  id: string;
  organizationId: string;
  serviceUnitId: string;
  title: string;
  slug: string;
  category: PublicationCategoryCode;
  categoryLabel: string;
  excerpt: string | null;
  content: string;
  coverMediaId: string | null;
  coverSignedUrl: string | null;
  status: PublicationStatus;
  publishedAt: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

