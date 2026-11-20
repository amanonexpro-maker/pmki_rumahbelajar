"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/contracts/result";
import { upsertDevelopmentNote } from "../services/development-service";

/**
 * Thin Server Action for Development Domain (09 §6–8).
 */
export async function upsertDevelopmentNoteAction(
  payload: unknown
): Promise<
  ActionResult<{
    noteId: string;
    version: number;
    confidential: boolean;
    isNewRevisionOnExisting: boolean;
  }>
> {
  const session = await getCurrentSession();
  const result = await upsertDevelopmentNote(session, payload);
  if (result.success) {
    revalidatePath("/workspace/development");
  }
  return result;
}

