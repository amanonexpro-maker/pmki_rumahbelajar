"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/contracts/result";
import {
  confirmMediaUpload,
  createMediaUploadUrl,
  reviewMediaAssetPrivacy,
} from "../services/media-service";
import type {
  CreateUploadUrlResultDTO,
  MediaAssetDTO,
} from "../types/media-types";

/**
 * Thin Server Actions for Media Domain (09 §6–8, §30, ADR-13 D-23).
 */
export async function createMediaUploadUrlAction(
  payload: unknown
): Promise<ActionResult<CreateUploadUrlResultDTO>> {
  const session = await getCurrentSession();
  return createMediaUploadUrl(session, payload);
}

export async function confirmMediaUploadAction(
  payload: unknown
): Promise<ActionResult<MediaAssetDTO>> {
  const session = await getCurrentSession();
  const result = await confirmMediaUpload(session, payload);
  if (result.success) {
    revalidatePath("/workspace/media");
    revalidatePath("/workspace/publishing");
    revalidatePath("/");
    revalidatePath("/kabar");
  }
  return result;
}

export async function reviewMediaAssetPrivacyAction(
  payload: unknown
): Promise<
  ActionResult<{
    mediaId: string;
    privacyReviewed: boolean;
    eligibleForPublic: boolean;
  }>
> {
  const session = await getCurrentSession();
  const result = await reviewMediaAssetPrivacy(session, payload);
  if (result.success) {
    revalidatePath("/workspace/media");
    revalidatePath("/workspace/publishing");
    revalidatePath("/");
    revalidatePath("/kabar");
  }
  return result;
}

