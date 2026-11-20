import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { students } from "../students/students";
import { classes } from "./classes";
import { academicYears } from "./academic-years";

/**
 * Class Enrollments owned by Academic domain (U-03).
 * Students.PlacementService writes enrollments via AcademicService (never Academic repository).
 */
export const classEnrollments = pgTable(
  "class_enrollments",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "restrict" }),
    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("ACTIVE"),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [
    uniqueIndex("class_enrollments_unique_uidx").on(
      t.studentId,
      t.classId,
      t.academicYearId
    ),
    index("class_enrollments_class_idx").on(t.classId),
    index("class_enrollments_student_idx").on(t.studentId),
  ]
);

