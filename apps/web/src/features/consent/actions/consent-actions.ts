"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/contracts/result";
import type { ConsentStatus } from "@/lib/status";
import { updateStudentConsent } from "../services/consent-service";

/**
 * Thin Server Action for Consent Domain (09 §6–8).
 */
export async function updateStudentConsentAction(
  payload: unknown
): Promise<
  ActionResult<{
    consentId: string;
    studentId: string;
    personalDataConsent: ConsentStatus;
    photoVideoConsent: ConsentStatus;
    revokedAt: string | null;
  }>
> {
  const session = await getCurrentSession();
  const result = await updateStudentConsent(session, payload);
  if (result.success) {
    revalidatePath("/workspace/consent");
    revalidatePath("/workspace/media");
    revalidatePath("/workspace/publishing");
    revalidatePath(`/workspace/students/${result.data.studentId}`);
    revalidatePath("/");
    revalidatePath("/kabar");
  }
  return result;
}

