import { z } from "zod";
import { provisionUserSchema } from "./administration-validator";

export const provisionUserFormSchema = provisionUserSchema.pick({
  name: true,
  email: true,
  initialPassword: true,
  roleCode: true,
  organizationId: true,
  serviceUnitId: true,
});

export type ProvisionUserFormValues = z.infer<typeof provisionUserFormSchema>;

