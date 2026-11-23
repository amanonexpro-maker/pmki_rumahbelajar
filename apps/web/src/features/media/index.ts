/**
 * Media Domain Public API (11 §15).
 * Cross-domain consumers (Publishing, Public Gallery) MUST ONLY import from this barrel file.
 */
export const DOMAIN_NAME = "media" as const;

export {
  confirmMediaUpload,
  countUnreviewedMediaForDashboard,
  createMediaUploadUrl,
  getSignedMediaReadUrl,
  isMediaAssetEligibleForPublic,
  listMediaAssetsForWorkspace,
  listPublicGalleryMedia,
  reviewMediaAssetPrivacy,
} from "./services/media-service";

export {
  confirmMediaUploadAction,
  createMediaUploadUrlAction,
  reviewMediaAssetPrivacyAction,
} from "./actions/media-actions";

export {
  authorizeCreateMedia,
  authorizeReadMedia,
  authorizeReviewMediaWithSoD,
  canCreateMedia,
  canReadMedia,
  canReviewMediaAsset,
} from "./permissions/media-policy";

export {
  ALLOWED_MEDIA_MIME_TYPES,
  confirmMediaUploadSchema,
  createUploadUrlSchema,
  MAX_MEDIA_FILE_SIZE_BYTES,
  MEDIA_CATEGORY_VALUES,
  reviewMediaAssetSchema,
  type ConfirmMediaUploadInput,
  type CreateUploadUrlInput,
  type ReviewMediaAssetInput,
} from "./validators/media-validator";

export {
  MEDIA_CATEGORY_LABELS,
  type CreateUploadUrlResultDTO,
  type MediaAssetDTO,
  type MediaCategoryCode,
} from "./types/media-types";

export { MediaWorkspaceClient } from "./components/media-workspace-client";

