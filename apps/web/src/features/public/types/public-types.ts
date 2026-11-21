import type { MediaCategoryCode } from "@/features/media";
import type { PublicationCategoryCode } from "@/features/publishing";

/**
 * Public Experience Read Models (`11 §20`, `03 §7, §13–19`, `UI-UX §6, §14–18`, `UI-12`).
 * Owned by `features/public`. Consumes cross-domain data strictly via Public APIs.
 */

export interface PublicProgramItemDTO {
  id: string;
  number: string;
  title: string;
  description: string;
  highlights: string[];
  targetNote: string;
  accentTone: "info" | "learning" | "success" | "activity";
  badgeText?: string;
  storyHighlight?: string;
}

export interface PublicGradeTargetDTO {
  id: string;
  badgeLabel: string;
  extraBadge?: string;
  title: string;
  description: string;
  focusLabel: string;
  focusText: string;
  accentTone: "primary" | "info" | "warning";
}

export interface PublicScheduleSlotDTO {
  time: string;
  activity: string;
  description: string;
  tag: string;
  accentTone: "primary" | "info" | "activity" | "learning" | "success";
}

export interface PublicVolunteerTeacherDTO {
  name: string;
  originInstitution: string;
  focusRole: string;
  isCoordinator?: boolean;
}

export interface PublicCoordinatorContactDTO {
  initials: string;
  name: string;
  roleLabel: string;
  institutionLabel: string;
  phoneDisplay: string;
  whatsappUrl: string;
  accentTone: "primary" | "learning";
}

export interface PublicGalleryItemDTO {
  id: string;
  slug?: string;
  title: string;
  description: string;
  category: MediaCategoryCode;
  categoryLabel: string;
  capturedDate: string;
  signedReadUrl: string;
  signedUrlTtlSeconds: number;
  privacyReviewed: true;
  eligibleForPublic: true;
}

export interface PublicNewsItemDTO {
  id: string;
  title: string;
  slug: string;
  category: PublicationCategoryCode;
  categoryLabel: string;
  excerpt: string;
  content: string;
  coverSignedUrl: string;
  publishedAt: string | null;
  publishedDateFormatted: string;
  authorLabel: string;
  eventDate: string | null;
  eventLocation: string | null;
}

/**
 * Dual-Mode Public Content Contract (FASE 14 Hotfix Lanjutan):
 * Menyajikan ArticleContent (Warta/Berita) atau GalleryAlbumContent (Dokumentasi Foto).
 */
export interface ArticleContent {
  type: "article";
  title: string;
  slug: string;
  date: string;
  publishedDateFormatted: string;
  author: string;
  categoryLabel: string;
  excerpt: string;
  bodyHtml: string;
  content: string;
  coverImage?: string;
  coverSignedUrl?: string;
  eventDate?: string | null;
  eventLocation?: string | null;
}

export interface GalleryPhoto {
  url: string;
  caption: string;
}

export interface GalleryAlbumContent {
  type: "gallery_album";
  title: string;
  slug: string;
  date: string;
  description: string;
  author: string;
  categoryLabel: string;
  coverImage?: string;
  photos: GalleryPhoto[];
}

export type PublicContent = ArticleContent | GalleryAlbumContent;

export interface PublicPortalDataDTO {
  serviceUnitName: string;
  organizationName: string;
  locationFull: string;
  subDistrictsLabel: string;
  scheduleDay: string;
  scheduleHours: string;
  heroHeadline: string;
  heroSubheadline: string;
  missionHeadline: string;
  ctaHeadline: string;
  sloganEnglish: string;
  sloganIndonesian: string;
  philosophyQuote: string;
  metrics: {
    registeredStudentsLabel: string;
    registeredStudentsValue: string;
    volunteerTeachersLabel: string;
    volunteerTeachersValue: string;
    educationLevelsLabel: string;
    educationLevelsValue: string;
  };
  programs: PublicProgramItemDTO[];
  gradeTargets: PublicGradeTargetDTO[];
  scheduleSlots: PublicScheduleSlotDTO[];
  volunteerTeachers: PublicVolunteerTeacherDTO[];
  coordinators: PublicCoordinatorContactDTO[];
  galleryItems: PublicGalleryItemDTO[];
  newsItems: PublicNewsItemDTO[];
}

