import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { organizations } from "../organization/organizations";
import { serviceUnits } from "../organization/service-units";
import { programs } from "../organization/programs";
import { academicYears } from "./academic-years";

export const classes = pgTable(
  "classes",
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
    programId: uuid("program_id").references(() => programs.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    capacity: integer("capacity").notNull().default(20),
    roomName: text("room_name"),
    active: boolean("active").notNull().default(true),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [
    index("classes_unit_year_idx").on(t.serviceUnitId, t.academicYearId),
  ]
);

