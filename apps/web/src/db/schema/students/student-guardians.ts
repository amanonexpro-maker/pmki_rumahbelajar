import { boolean, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { auditColumns, guardianRelationshipEnum, newId } from "../_shared";
import { students } from "./students";
import { guardians } from "./guardians";

export const studentGuardians = pgTable(
  "student_guardians",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    guardianId: uuid("guardian_id")
      .notNull()
      .references(() => guardians.id, { onDelete: "cascade" }),
    relationship: guardianRelationshipEnum("relationship").notNull(),
    isPrimary: boolean("is_primary").notNull().default(true),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex("student_guardians_pair_uidx").on(t.studentId, t.guardianId),
  ]
);

