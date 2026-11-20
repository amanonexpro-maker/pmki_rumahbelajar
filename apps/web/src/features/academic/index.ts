/**
 * Academic Domain Public API (11 §11).
 * Cross-domain consumers MUST ONLY import from this barrel file.
 */
export const DOMAIN_NAME = "academic" as const;

export {
  createAcademicClass,
  enrollStudentInClass,
  getActiveAcademicYear,
  getClassLearningContext,
  getClassSummaryById,
  listAcademicYears,
  listClassesForServiceUnit,
  listTeachersForServiceUnit,
  resolveTeacherForActor,
} from "./services/academic-service";

export {
  authorizeCreateClass,
  authorizeUpdateClass,
  canReadClasses,
  canReadSchedules,
} from "./permissions/academic-policy";

export {
  createClassSchema,
  enrollStudentToClassSchema,
  type CreateClassInput,
  type EnrollStudentToClassInput,
} from "./validators/academic-validator";

export type {
  AcademicYearDTO,
  ClassLearningContextDTO,
  ClassSummaryDTO,
  EnrollStudentResultDTO,
  ScheduleDetailDTO,
} from "./types/academic-types";
