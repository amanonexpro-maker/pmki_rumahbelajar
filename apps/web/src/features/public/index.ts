/**
 * Public Experience Feature Public API (`11-DOMAIN-DRIVEN-FEATURE-ARCHITECTURE.md`, `07 §14`).
 * Cross-domain imports MUST only import from this index.ts.
 */
export const DOMAIN_NAME = "public" as const;

export {
  CANONICAL_PUBLIC_COPY,
  filterAndMapPublicGalleryItems,
  filterAndMapPublicNewsItems,
  getPublicPortalData,
  PUBLIC_COORDINATOR_CONTACTS,
  PUBLIC_GRADE_TARGETS,
  PUBLIC_PROGRAMS_LIST,
  PUBLIC_SCHEDULE_SLOTS,
  PUBLIC_VOLUNTEER_TEACHERS,
} from "./services/public-portal-service";

export {
  PUBLIC_GALLERY_FILTER_VALUES,
  publicContactInquirySchema,
  publicGalleryFilterSchema,
  publicStudentRegistrationSchema,
  publicVolunteerRegistrationSchema,
  type PublicContactInquiryInput,
  type PublicGalleryFilterCode,
  type PublicStudentRegistrationInput,
  type PublicVolunteerRegistrationInput,
} from "./validators/public-validator";

export type {
  PublicCoordinatorContactDTO,
  PublicGalleryItemDTO,
  PublicGradeTargetDTO,
  PublicNewsItemDTO,
  PublicPortalDataDTO,
  PublicProgramItemDTO,
  PublicScheduleSlotDTO,
  PublicVolunteerTeacherDTO,
} from "./types/public-types";

export { PublicNavbar } from "./components/public-navbar";
export { PublicFooter } from "./components/public-footer";
export { PublicMissionSection } from "./components/public-mission-section";
export { PublicProgramsSection } from "./components/public-programs-section";
export { PublicCommunityStorySection } from "./components/public-community-story-section";
export { PublicContactForm } from "./components/public-contact-form";
export { PublicRegistrationCtaSection } from "./components/public-registration-cta-section";
export { PublicCuratedHome } from "./components/public-curated-home";
export { KabarFeedView, type KabarTabFilter } from "./components/kabar-feed-view";
export { KabarEmptyState } from "./components/kabar-empty-state";
export { KabarAlbumLightbox } from "./components/kabar-album-lightbox";
export { PrivacyPolicyModal } from "./components/privacy-policy-modal";
export { ProgramDetailAccordion } from "./components/program-detail-accordion";
export { VolunteerGrid } from "./components/volunteer-grid";
export {
  KontakActionCenter,
  type KontakTabId,
} from "./components/kontak-action-center";
