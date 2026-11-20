import type { ConsentStatus } from "@/lib/status";

export interface StudentConsentRecordDTO {
  id: string;
  organizationId: string;
  serviceUnitId: string;
  studentId: string;
  studentFullName: string;
  studentRegistrationNumber: string;
  studentEducationLevelLabel: string;
  guardianId: string;
  personalDataConsent: ConsentStatus;
  photoVideoConsent: ConsentStatus;
  /** Confidential consent evidence/notes — null when caller lacks confidential consent access */
  notes: string | null;
  effectiveAt: string;
  revokedAt: string | null;
  updatedAt: string;
}

