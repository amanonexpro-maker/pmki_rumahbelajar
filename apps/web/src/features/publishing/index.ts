/**
 * Publishing Domain Public API (11 §17).
 * Cross-domain consumers MUST ONLY import from this barrel file.
 */
export const DOMAIN_NAME = "publishing" as const;

export {
  createPublicationDraft,
  getPublishedPublicationBySlug,
  isValidPublicationTransition,
  listPublicationsForWorkspace,
  listPublishedPublicationsForPublic,
  listPublishedPublicationsForPublic as listPublishedContent,
  transitionPublicationStatus,
} from "./services/publishing-service";

export {
  createPublicationDraftAction,
  transitionPublicationStatusAction,
} from "./actions/publishing-actions";

export {
  authorizeCreatePublication,
  authorizePublishPublicationWithSoD,
  authorizeReadPublications,
  authorizeReviewPublicationPrivacy,
  authorizeSubmitForPrivacyReview,
  canCreatePublication,
  canPublishPublicationWithSoD,
  canReadPublications,
} from "./permissions/publishing-policy";

export {
  createPublicationSchema,
  PUBLICATION_CATEGORY_VALUES,
  PUBLICATION_STATUS_VALUES,
  transitionPublicationStatusSchema,
  type CreatePublicationInput,
  type TransitionPublicationStatusInput,
} from "./validators/publishing-validator";

export {
  PUBLICATION_CATEGORY_LABELS,
  type PublicationCategoryCode,
  type PublicationDTO,
} from "./types/publishing-types";

export { PublishingWorkspaceClient } from "./components/publishing-workspace-client";

