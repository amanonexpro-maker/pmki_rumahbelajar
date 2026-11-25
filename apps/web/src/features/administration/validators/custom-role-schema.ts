import { z } from "zod";
import { createCustomRoleSchema } from "./administration-validator";

export const createCustomRoleFormSchema = createCustomRoleSchema;

export type CreateCustomRoleFormValues = z.infer<
  typeof createCustomRoleFormSchema
>;

