import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { serviceUnits } from "../organization/service-units";
import { classes } from "./classes";
import { teachers } from "./teachers";
import { subjects } from "./subjects";

export const schedules = pgTable(
  "schedules",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    dayOfWeek: text("day_of_week").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    location: text("location"),
    active: boolean("active").notNull().default(true),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [
    index("schedules_class_idx").on(t.classId),
    index("schedules_teacher_idx").on(t.teacherId),
  ]
);

