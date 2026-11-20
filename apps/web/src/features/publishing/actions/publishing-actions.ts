"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/contracts/result";
import type { PublicationStatus } from "@/lib/status";
import {
  createPublicationDraft,
  transitionPublicationStatus,
} from "../services/publishing-service";
import type { PublicationDTO } from "../types/publishing-types";

/**
 * Thin Server Actions for Publishing Domain (09 §6–8).
 */
export async function createPublicationDraftAction(
  payload: unknown
): Promise<ActionResult<PublicationDTO>> {
  const session = await getCurrentSession();
  const result = await createPublicationDraft(session, payload);
  if (result.success) {
    revalidatePath("/workspace/publishing");
  }
  return result;
}

export async function transitionPublicationStatusAction(
  payload: unknown
): Promise<
  ActionResult<{
    publicationId: string;
    previousStatus: PublicationStatus;
    newStatus: PublicationStatus;
    publishedAt: string | null;
  }>
> {
  const session = await getCurrentSession();
  const result = await transitionPublicationStatus(session, payload);
  if (result.success) {
    revalidatePath("/workspace/publishing");
    revalidatePath("/");
  }
  return result;
}

