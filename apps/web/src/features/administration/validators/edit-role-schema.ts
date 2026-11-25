import { z } from "zod";
import { updateUserRolesSchema } from "./administration-validator";

export const editUserRolesFormSchema = updateUserRolesSchema.pick({
  roleCodes: true,
});

export type EditUserRolesFormValues = z.infer<typeof editUserRolesFormSchema>;

