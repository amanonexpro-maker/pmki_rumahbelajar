/**
 * Students Domain Public API (11 §10).
 * Cross-domain consumers MUST ONLY import from this barrel file.
 */
export const DOMAIN_NAME = "students" as const;

export {
  isValidVerificationTransition,
  submitPublicRegistration,
  verifyStudentRegistration,
} from "./services/registration-service";

export { placeStudentInClass } from "./services/placement-service";

export { getConfidentialGuardianForStudent } from "./services/guardian-service";

export {
  countStudentsForDashboard,
  getStudentDetailForWorkspace,
  listStudentsForWorkspace,
  updateStudentProfile,
} from "./services/student-service";

export {
  placeStudentInClassAction,
  submitPublicRegistrationAction,
  updateStudentProfileAction,
  verifyStudentRegistrationAction,
} from "./actions/student-actions";

export {
  authorizeCreateStudent,
  authorizeReadStudents,
  authorizeUpdateStudent,
  authorizeVerifyStudent,
  canReadConfidentialGuardian,
  canReadStudents,
  canUpdateConfidentialGuardian,
} from "./permissions/student-policy";

export {
  EDUCATION_LEVEL_VALUES,
  GUARDIAN_RELATIONSHIP_VALUES,
  placeStudentSchema,
  publicRegistrationSchema,
  registrationStep1Schema,
  registrationStep2Schema,
  registrationStep3Schema,
  registrationStep4Schema,
  updateStudentProfileSchema,
  verifyStudentSchema,
  type PlaceStudentInput,
  type PublicRegistrationInput,
  type UpdateStudentProfileInput,
  type VerifyStudentInput,
} from "./validators/student-validator";

export {
  EDUCATION_LEVEL_LABELS,
  GUARDIAN_RELATIONSHIP_LABELS,
  type ConfidentialGuardianDTO,
  type EducationLevelCode,
  type GuardianRelationshipCode,
  type StudentDetailDTO,
  type StudentListFilterParams,
  type StudentListItemDTO,
  type StudentListResultDTO,
} from "./types/student-types";

export { PublicRegistrationWizard } from "./components/public-registration-wizard";
export { StudentsWorkspaceClient } from "./components/students-workspace-client";
export { StudentDetailClient } from "./components/student-detail-client";

