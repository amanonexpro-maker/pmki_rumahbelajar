"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/server/contracts/result";
import { getCurrentSession } from "@/server/auth/session";
import { getHumanErrorMessage } from "@/lib/messages";
import {
  changePasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updateMyProfileSchema,
} from "../validators/auth-validator";
import {
  changeAuthenticatedUserPassword,
  requestPasswordReset,
  signInWithEmailPassword,
  signOutCurrentUser,
  updateMyProfile,
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

export async function changeMyPasswordAction(
  payload: unknown
): Promise<ActionResult<{ updated: true }>> {
  const parsed = changePasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ?? getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const result = await changeAuthenticatedUserPassword(parsed.data);
  if (result.success) {
    revalidatePath("/workspace", "layout");
  }
  return result;
}

export async function updateMyProfileAction(
  payload: unknown
): Promise<ActionResult<{ updated: true }>> {
  const session = await getCurrentSession();
  if (!session) {
    return fail("UNAUTHORIZED", getHumanErrorMessage("UNAUTHORIZED"));
  }

  const parsed = updateMyProfileSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ?? getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const result = await updateMyProfile(session, parsed.data);
  if (result.success) {
    revalidatePath("/workspace", "layout");
    revalidatePath("/workspace/profile");
    revalidatePath("/");
  }
  return result;
}

