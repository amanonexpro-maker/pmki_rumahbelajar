"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/server/contracts/result";
import { getHumanErrorMessage } from "@/lib/messages";
import {
  loginSchema,
  resetPasswordSchema,
} from "../validators/auth-validator";
import {
  requestPasswordReset,
  signInWithEmailPassword,
  signOutCurrentUser,
} from "../services/auth-service";

/**
 * Thin Server Actions for Identity domain (09 §6–8).
 * Zod parse -> Service call -> revalidatePath. No business logic here.
 */
export async function loginAction(
  payload: unknown
): Promise<ActionResult<{ userId: string }>> {
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const result = await signInWithEmailPassword(parsed.data);
  if (result.success) {
    revalidatePath("/workspace", "layout");
  }
  return result;
}

export async function logoutAction(): Promise<ActionResult<{ signedOut: true }>> {
  const result = await signOutCurrentUser();
  if (result.success) {
    revalidatePath("/", "layout");
  }
  return result;
}

export async function requestPasswordResetAction(
  payload: unknown
): Promise<ActionResult<{ requested: true }>> {
  const parsed = resetPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  return requestPasswordReset(parsed.data);
}

