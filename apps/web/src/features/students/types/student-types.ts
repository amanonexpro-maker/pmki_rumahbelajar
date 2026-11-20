import type { RegistrationStatus } from "@/lib/status";
import type { ClassLearningContextDTO } from "@/features/academic";

export type EducationLevelCode =
  | "TK"
  | "SD_1"
  | "SD_2"
  | "SD_3"
  | "SD_4"
  | "SD_5"
  | "SD_6"
  | "SMP_7"
  | "SMP_8";

export type GuardianRelationshipCode =
  | "AYAH"
  | "IBU"
  | "WALI"
  | "PENGASUH_RAAL"
  | "LAINNYA";

export const EDUCATION_LEVEL_LABELS: Record<EducationLevelCode, string> = {
  TK: "TK (A & B)",
  SD_1: "SD Kelas 1",
  SD_2: "SD Kelas 2",
  SD_3: "SD Kelas 3",
  SD_4: "SD Kelas 4",
  SD_5: "SD Kelas 5",
  SD_6: "SD Kelas 6",
  SMP_7: "SMP Kelas 7",
  SMP_8: "SMP Kelas 8",
};

export const GUARDIAN_RELATIONSHIP_LABELS: Record<
  GuardianRelationshipCode,
  string
> = {
  AYAH: "Ayah kandung",
  IBU: "Ibu kandung",
  WALI: "Wali keluarga",
  PENGASUH_RAAL: "Pengasuh Asrama RAAL Griya Asih",
  LAINNYA: "Kerabat lainnya",
};

export interface ConfidentialGuardianDTO {
  id: string;
  fullName: string;
  relationship: GuardianRelationshipCode;
  relationshipLabel: string;
  phone: string;
  occupation: string | null;
  address: string | null;
}

export interface StudentListItemDTO {
  id: string;
  organizationId: string;
  serviceUnitId: string;
  academicYearId: string;
  academicYearName: string;
  assignedClassId: string | null;
  assignedClassName: string | null;
  registrationNumber: string;
  fullName: string;
  nickname: string;
  birthDate: string;
  gender: "L" | "P";
  educationLevel: EducationLevelCode;
  educationLevelLabel: string;
  schoolName: string | null;
  district: string | null;
  isRaalResident: boolean;
  registrationStatus: RegistrationStatus;
  createdAt: string;
}

export interface StudentDetailDTO extends StudentListItemDTO {
  /** Confidential address: null when caller lacks `guardian.read` + scope */
  address: string | null;
  /** Confidential guardian record: null when caller lacks `guardian.read` + scope */
  guardian: ConfidentialGuardianDTO | null;
  guardianAccessDenied: boolean;
  consentSummary: {
    personalDataConsent: "GRANTED" | "DENIED" | "REVOKED";
    photoVideoConsent: "GRANTED" | "DENIED" | "REVOKED";
  } | null;
  learningContext: ClassLearningContextDTO | null;
}

export interface StudentListFilterParams {
  search?: string;
  status?: string;
  academicYearId?: string;
  classId?: string;
  educationLevel?: string;
  page?: number;
  pageSize?: number;
}

export interface StudentListResultDTO {
  items: StudentListItemDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pendingVerificationCount: number;
  awaitingPlacementCount: number;
}
