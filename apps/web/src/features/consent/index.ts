/**
 * Consent Domain Public API (11 §14).
 * Single gateway for all other domains checking Personal Data or Photo/Video consent.
 */
export const DOMAIN_NAME = "consent" as const;

export {
  countRevokedConsentsForDashboard,
  getStudentConsentStatus,
  isPersonalDataProcessingAllowed,
  isPhotoVideoPublicAllowed,
  listConsentsForWorkspace,
  recordInitialRegistrationConsent,
  updateStudentConsent,
  verifyAllStudentsHavePhotoVideoConsent,
} from "./services/consent-service";

export { updateStudentConsentAction } from "./actions/consent-actions";

export {
  authorizeReadConsents,
  authorizeUpdateConsent,
  canReadConfidentialConsentEvidence,
  canReadConsents,
  canUpdateConsent,
} from "./permissions/consent-policy";

export {
  CONSENT_STATUS_VALUES,
  updateStudentConsentSchema,
  type UpdateStudentConsentInput,
} from "./validators/consent-validator";

export type { StudentConsentRecordDTO } from "./types/consent-types";
export { ConsentWorkspaceClient } from "./components/consent-workspace-client";

