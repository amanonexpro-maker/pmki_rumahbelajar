import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import type { MediaCategoryCode } from "../types/media-types";

/**
 * Media Domain Repository (11 §15, §24).
 * STRICT BOUNDARY: Only queries `media_assets`. Never queries `consents`, `students`, or `publications`.
 */
export async function findMediaAssetById(mediaId: string) {
  const [row] = await db
    .select()
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, mediaId), isNull(mediaAssets.archivedAt)))
    .limit(1);
  return row ?? null;
}

export async function findMediaAssetByFilePath(
  serviceUnitId: string,
  filePath: string
) {
  const [row] = await db
    .select()
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.serviceUnitId, serviceUnitId),
        eq(mediaAssets.filePath, filePath),
        isNull(mediaAssets.archivedAt)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function findMediaAssetsByUnitIds(params: {
  serviceUnitIds: string[];
  category?: string;
  eligibility?: string;
}) {
  if (params.serviceUnitIds.length === 0) return [];
  const conditions = [
    inArray(mediaAssets.serviceUnitId, params.serviceUnitIds),
    isNull(mediaAssets.archivedAt),
  ];

  if (params.category && params.category !== "ALL") {
    conditions.push(
      eq(mediaAssets.category, params.category as MediaCategoryCode)
    );
  }

  if (params.eligibility === "PUBLIC") {
    conditions.push(eq(mediaAssets.privacyReviewed, true));
    conditions.push(eq(mediaAssets.eligibleForPublic, true));
  } else if (params.eligibility === "UNREVIEWED") {
    conditions.push(eq(mediaAssets.privacyReviewed, false));
  } else if (params.eligibility === "INTERNAL") {
    conditions.push(eq(mediaAssets.eligibleForPublic, false));
  }

  return db
    .select()
    .from(mediaAssets)
    .where(and(...conditions))
    .orderBy(desc(mediaAssets.createdAt));
}

export async function findPublicEligibleMediaAssets(serviceUnitId?: string) {
  const conditions = [
    eq(mediaAssets.privacyReviewed, true),
    eq(mediaAssets.eligibleForPublic, true),
    isNull(mediaAssets.archivedAt),
  ];
  if (serviceUnitId) {
    conditions.push(eq(mediaAssets.serviceUnitId, serviceUnitId));
  }

  return db
    .select()
    .from(mediaAssets)
    .where(and(...conditions))
    .orderBy(desc(mediaAssets.capturedDate), desc(mediaAssets.createdAt));
}

export async function insertMediaAsset(params: {
  organizationId: string;
  serviceUnitId: string;
  title: string;
  description?: string | null;
  filePath: string;
  mimeType: string;
  fileSize: number;
  category: MediaCategoryCode;
  capturedDate?: string | null;
  actorId: string;
}) {
  const [inserted] = await db
    .insert(mediaAssets)
    .values({
      organizationId: params.organizationId,
      serviceUnitId: params.serviceUnitId,
      title: params.title,
      description: params.description ?? null,
      filePath: params.filePath,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      category: params.category,
      privacyReviewed: false,
      eligibleForPublic: false,
      capturedDate: params.capturedDate ?? null,
      createdBy: params.actorId,
      updatedBy: params.actorId,
    })
    .returning();
  return inserted;
}

export async function updateMediaAssetPrivacyStatus(params: {
  mediaId: string;
  privacyReviewed: boolean;
  eligibleForPublic: boolean;
  reviewerId: string | null;
}) {
  const [updated] = await db
    .update(mediaAssets)
    .set({
      privacyReviewed: params.privacyReviewed,
      eligibleForPublic: params.eligibleForPublic,
      reviewedBy: params.reviewerId,
      reviewedAt: params.privacyReviewed ? new Date() : null,
      updatedAt: new Date(),
      updatedBy: params.reviewerId,
    })
    .where(eq(mediaAssets.id, params.mediaId))
    .returning();
  return updated ?? null;
}

export async function countUnreviewedMediaByUnitIds(
  serviceUnitIds: string[]
): Promise<number> {
  if (serviceUnitIds.length === 0) return 0;
  const [row] = await db
    .select({ total: count() })
    .from(mediaAssets)
    .where(
      and(
        inArray(mediaAssets.serviceUnitId, serviceUnitIds),
        eq(mediaAssets.privacyReviewed, false),
        isNull(mediaAssets.archivedAt)
      )
    );
  return Number(row?.total ?? 0);
}

