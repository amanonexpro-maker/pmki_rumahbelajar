import { pgEnum, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

/**
 * Application-layer UUID v7 generator for all domain entity primary keys (04 §4, U-03).
 * NOTE: `users.id` uses Supabase Auth UUID v4 directly (D-25/D-26), NOT this helper.
 */
export function newId(): string {
  return uuidv7();
}

export const organizationTypeEnum = pgEnum("organization_type", [
  "SINODAL",
  "MUPEL",
  "JEMAAT",
]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "SUBMITTED",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "CLASS_PLACEMENT",
  "ACTIVE",
  "WAITLIST",
  "REJECTED",
  "CANCELLED",
]);

export const guardianRelationshipEnum = pgEnum("guardian_relationship", [
  "AYAH",
  "IBU",
  "WALI",
  "PENGASUH_RAAL",
  "LAINNYA",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "PRESENT",
  "ABSENT",
  "SICK",
  "PERMITTED",
]);

export const consentStatusEnum = pgEnum("consent_status", [
  "GRANTED",
  "DENIED",
  "REVOKED",
]);

export const mediaCategoryEnum = pgEnum("media_category", [
  "KEGIATAN",
  "ACARA",
  "FASILITAS",
  "PENGURUS",
]);

export const reportTypeEnum = pgEnum("report_type", [
  "ACTIVITY",
  "ATTENDANCE",
  "STUDENT_DEVELOPMENT",
  "STAKEHOLDER",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "DRAFT",
  "PROGRAM_REVIEW",
  "UNIT_VALIDATION",
  "ORGANIZATION_APPROVAL",
  "APPROVED",
  "REJECTED",
]);

export const dataClassificationEnum = pgEnum("data_classification", [
  "PUBLIC",
  "STAKEHOLDER",
  "INTERNAL",
  "CONFIDENTIAL",
]);

export const publicationStatusEnum = pgEnum("publication_status", [
  "DRAFT",
  "PRIVACY_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "ARCHIVED",
]);

export const permissionOverrideModeEnum = pgEnum("permission_override_mode", [
  "GRANT",
  "REVOKE",
]);

export const syncOperationStatusEnum = pgEnum("sync_operation_status", [
  "PROCESSED",
  "CONFLICT",
  "REJECTED",
]);

export const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
};

export const archiveColumns = {
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  archivedBy: uuid("archived_by"),
};

