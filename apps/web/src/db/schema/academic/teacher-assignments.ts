import { boolean, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { auditColumns, newId } from "../_shared";
import { teachers } from "./teachers";
import { classes } from "./classes";
import { academicYears } from "./academic-years";

export const teacherAssignments = pgTable(
  "teacher_assignments",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    isMainTeacher: boolean("is_main_teacher").notNull().default(false),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex("teacher_assignments_unique_uidx").on(
      t.teacherId,
      t.classId,
      t.academicYearId
    ),
  ]
);

