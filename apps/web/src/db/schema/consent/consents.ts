import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
  archiveColumns,
  auditColumns,
  consentStatusEnum,
  newId,
} from "../_shared";
import { organizations } from "../organization/organizations";
import { serviceUnits } from "../organization/service-units";
import { students } from "../students/students";
import { guardians } from "../students/guardians";

/**
 * Consents (04 §18): Personal Data Consent is strictly separate from Photo/Video Consent.
 */
export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    guardianId: uuid("guardian_id")
      .notNull()
      .references(() => guardians.id, { onDelete: "restrict" }),
    personalDataConsent: consentStatusEnum("personal_data_consent").notNull(),
    photoVideoConsent: consentStatusEnum("photo_video_consent")
      .notNull()
      .default("DENIED"),
    notes: text("notes"),
    effectiveAt: timestamp("effective_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [
    index("consents_student_idx").on(t.studentId),
    index("consents_unit_idx").on(t.serviceUnitId),
  ]
);

