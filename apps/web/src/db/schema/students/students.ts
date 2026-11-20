import {
  boolean,
  date,
  index,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import {
  archiveColumns,
  auditColumns,
  newId,
  registrationStatusEnum,
} from "../_shared";
import { organizations } from "../organization/organizations";
import { serviceUnits } from "../organization/service-units";
import { academicYears } from "../academic/academic-years";
import { classes } from "../academic/classes";

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    assignedClassId: uuid("assigned_class_id").references(() => classes.id, {
      onDelete: "set null",
    }),
    registrationNumber: text("registration_number").notNull().unique(),
    fullName: text("full_name").notNull(),
    nickname: text("nickname").notNull(),
    birthDate: date("birth_date").notNull(),
    gender: text("gender").notNull(),
    educationLevel: text("education_level").notNull(),
    schoolName: text("school_name"),
    address: text("address"),
    district: text("district"),
    isRaalResident: boolean("is_raal_resident").notNull().default(false),
    registrationStatus: registrationStatusEnum("registration_status")
      .notNull()
      .default("SUBMITTED"),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [
    index("students_reg_num_idx").on(t.registrationNumber),
    index("students_full_name_idx").on(t.fullName),
    index("students_status_idx").on(t.registrationStatus),
    index("students_unit_idx").on(t.serviceUnitId),
  ]
);

export type StudentRow = typeof students.$inferSelect;

