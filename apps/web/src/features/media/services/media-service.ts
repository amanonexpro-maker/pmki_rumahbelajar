import { uuidv7 } from "uuidv7";
import { recordAuditLog } from "@/features/audit";
import { verifyAllStudentsHavePhotoVideoConsent } from "@/features/consent";
import { getHumanErrorMessage } from "@/lib/messages";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import {
  createPrivateStorageSignedReadUrl,
  createPrivateStorageSignedUploadUrl,
  getMediaBucketName,
  getMediaSignedUrlTtlSeconds,
} from "@/server/upload/storage-admin";
import {
  authorizeCreateMedia,
  authorizeReadMedia,
  authorizeReviewMediaWithSoD,
} from "../permissions/media-policy";
import {
  countUnreviewedMediaByUnitIds,
  findMediaAssetByFilePath,
  findMediaAssetById,
  findMediaAssetsByUnitIds,
  findPublicEligibleMediaAssets,
  insertMediaAsset,
  updateMediaAssetPrivacyStatus,
} from "../repositories/media-repository";
import {
  MEDIA_CATEGORY_LABELS,
  type CreateUploadUrlResultDTO,
  type MediaAssetDTO,
  type MediaCategoryCode,
} from "../types/media-types";
import {
  confirmMediaUploadSchema,
  createUploadUrlSchema,
  reviewMediaAssetSchema,
} from "../validators/media-validator";

/**
 * Media Domain Application Service (11 §15, 04 §19, 09 §30, ADR-13 D-23, D-29).
 *
 * 1. Three-step upload flow (`createMediaUploadUrl` -> client PUT -> `confirmMediaUpload`).
 * 2. Strict Separation of Duties on privacy review (`uploader !== reviewer`).
 * 3. Consent enforcement via `ConsentService.verifyAllStudentsHavePhotoVideoConsent`.
 * 4. Server-generated signed read URLs with TTL > page cache revalidate window.
 */
function sanitizeStorageFileName(rawName: string): string {
  return rawName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function createMediaUploadUrl(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<ActionResult<CreateUploadUrlResultDTO>> {
  const parsed = createUploadUrlSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const targetUnitId =
    parsed.data.serviceUnitId ?? user?.memberships[0]?.serviceUnitId;
  if (!targetUnitId) {
    return fail("SCOPE_DENIED", getHumanErrorMessage("SCOPE_DENIED"));
  }

  const authz = authorizeCreateMedia(user, targetUnitId);
  if (!authz.success) return authz;

  const safeName = sanitizeStorageFileName(parsed.data.fileName);
  const filePath = `units/${targetUnitId}/${uuidv7()}-${safeName}`;

  const signed = await createPrivateStorageSignedUploadUrl(filePath);
  if (!signed) {
    return fail(
      "INTERNAL_ERROR",
      "Gagal membuat tautan unggah berpenanda tangan di penyimpanan privat."
    );
  }

  return ok({
    filePath: signed.path,
    signedUrl: signed.signedUrl,
    token: signed.token,
    bucket: getMediaBucketName(),
  });
}

export async function confirmMediaUpload(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<ActionResult<MediaAssetDTO>> {
  const parsed = confirmMediaUploadSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const membership = parsed.data.serviceUnitId
    ? user?.memberships.find(
        (m) => m.serviceUnitId === parsed.data.serviceUnitId
      )
    : user?.memberships[0];

  if (!membership || !user?.id) {
    return fail("SCOPE_DENIED", getHumanErrorMessage("SCOPE_DENIED"));
  }

  const authz = authorizeCreateMedia(user, membership.serviceUnitId);
  if (!authz.success) return authz;

  // Idempotency guard: prevent duplicate confirmUpload on the same filePath
  const duplicate = await findMediaAssetByFilePath(
    membership.serviceUnitId,
    parsed.data.filePath
  );
  if (duplicate) {
    return fail(
      "RESOURCE_CONFLICT",
      "Berkas dokumentasi ini sudah pernah dikonfirmasi sebelumnya."
    );
  }

  const created = await insertMediaAsset({
    organizationId: membership.organizationId,
    serviceUnitId: membership.serviceUnitId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    filePath: parsed.data.filePath,
    mimeType: parsed.data.mimeType,
    fileSize: parsed.data.fileSize,
    category: parsed.data.category,
    capturedDate: parsed.data.capturedDate ?? null,
    actorId: user.id,
  });

  await recordAuditLog({
    organizationId: created.organizationId,
    serviceUnitId: created.serviceUnitId,
    actorId: user.id,
    action: "MediaUploaded",
    entityType: "media_asset",
    entityId: created.id,
    description: `Mengunggah dokumentasi "${created.title}" ke bucket privat (menunggu tinjauan privasi).`,
    metadata: {
      filePath: created.filePath,
      mimeType: created.mimeType,
      fileSize: created.fileSize,
      category: created.category,
      subjectStudentIds: parsed.data.subjectStudentIds ?? [],
    },
  });

  const cat = created.category as MediaCategoryCode;
  return ok({
    id: created.id,
    organizationId: created.organizationId,
    serviceUnitId: created.serviceUnitId,
    title: created.title,
    description: created.description,
    filePath: created.filePath,
    mimeType: created.mimeType,
    fileSize: created.fileSize,
    category: cat,
    categoryLabel: MEDIA_CATEGORY_LABELS[cat] ?? cat,
    privacyReviewed: created.privacyReviewed,
    eligibleForPublic: created.eligibleForPublic,
    reviewedBy: created.reviewedBy,
    reviewedAt: null,
    capturedDate: created.capturedDate,
    uploadedBy: created.createdBy,
    createdAt: created.createdAt.toISOString(),
    signedReadUrl: null,
    signedUrlTtlSeconds: null,
  });
}

export async function reviewMediaAssetPrivacy(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<
  ActionResult<{
    mediaId: string;
    privacyReviewed: boolean;
    eligibleForPublic: boolean;
  }>
> {
  const parsed = reviewMediaAssetSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const asset = await findMediaAssetById(parsed.data.mediaId);
  if (!asset) {
    return fail("RESOURCE_NOT_FOUND", "Dokumentasi tidak ditemukan.");
  }

  // Separation of Duties (U-10, 05 §15): Uploader CANNOT review their own upload
  const authz = authorizeReviewMediaWithSoD(
    user,
    asset.serviceUnitId,
    asset.createdBy
  );
  if (!authz.success) return authz;

  // Consent enforcement: if marking eligibleForPublic=true with subject students, all must have GRANTED photo/video consent
  if (
    parsed.data.eligibleForPublic &&
    parsed.data.subjectStudentIds &&
    parsed.data.subjectStudentIds.length > 0
  ) {
    const consentCheck = await verifyAllStudentsHavePhotoVideoConsent(
      parsed.data.subjectStudentIds
    );
    if (!consentCheck.allowed) {
      return fail(
        "POLICY_DENIED",
        "Dokumentasi tidak dapat disetujui untuk kanal publik karena terdapat peserta didik tanpa persetujuan foto & video aktif."
      );
    }
  }

  const updated = await updateMediaAssetPrivacyStatus({
    mediaId: asset.id,
    privacyReviewed: true,
    eligibleForPublic: parsed.data.eligibleForPublic,
    reviewerId: user?.id ?? null,
  });

  if (!updated) {
    return fail("INTERNAL_ERROR", getHumanErrorMessage("INTERNAL_ERROR"));
  }

  await recordAuditLog({
    organizationId: asset.organizationId,
    serviceUnitId: asset.serviceUnitId,
    actorId: user?.id ?? null,
    action: "MediaPrivacyReviewed",
    entityType: "media_asset",
    entityId: asset.id,
    description: updated.eligibleForPublic
      ? `Menyetujui dokumentasi "${asset.title}" sebagai layak tayang di publik setelah tinjauan privasi.`
      : `Menetapkan dokumentasi "${asset.title}" hanya untuk arsip internal (tidak layak publik).`,
    metadata: {
      privacyReviewed: updated.privacyReviewed,
      eligibleForPublic: updated.eligibleForPublic,
      reviewNotes: parsed.data.reviewNotes ?? null,
      subjectStudentIds: parsed.data.subjectStudentIds ?? [],
    },
  });

  return ok({
    mediaId: updated.id,
    privacyReviewed: updated.privacyReviewed,
    eligibleForPublic: updated.eligibleForPublic,
  });
}

/**
 * Generates a short-lived server signed URL for reading a private media asset (D-23, D-29).
 * - Public channel requests REQUIRE `privacyReviewed === true && eligibleForPublic === true`.
 * - If `subjectStudentIds` are supplied, live consent is re-verified; if any consent was
 *   REVOKED/DENIED, public eligibility is immediately blocked and revoked in DB.
 */
function resolveFallbackGalleryPath(filePath: string): string | null {
  const galleryMatch = filePath.match(/(griya_asih_\d+\.jpg)$/i);
  if (galleryMatch?.[1]) {
    return `/images/gallery/${galleryMatch[1]}`;
  }
  return null;
}

async function resolveMediaReadUrl(
  filePath: string,
  ttlSeconds: number
): Promise<string | null> {
  const signed = await createPrivateStorageSignedReadUrl(filePath, ttlSeconds);
  return signed?.signedUrl ?? resolveFallbackGalleryPath(filePath);
}

export async function getSignedMediaReadUrl(
  user: SessionUser | null | undefined,
  mediaId: string,
  options?: {
    forPublicChannel?: boolean;
    subjectStudentIds?: string[];
  }
): Promise<
  ActionResult<{
    mediaId: string;
    signedUrl: string;
    ttlSeconds: number;
    expiresAt: string;
  }>
> {
  const asset = await findMediaAssetById(mediaId);
  if (!asset) {
    return fail("RESOURCE_NOT_FOUND", "Dokumentasi tidak ditemukan.");
  }

  if (options?.subjectStudentIds && options.subjectStudentIds.length > 0) {
    const consentCheck = await verifyAllStudentsHavePhotoVideoConsent(
      options.subjectStudentIds
    );
    if (!consentCheck.allowed) {
      if (asset.eligibleForPublic) {
        await updateMediaAssetPrivacyStatus({
          mediaId: asset.id,
          privacyReviewed: asset.privacyReviewed,
          eligibleForPublic: false,
          reviewerId: user?.id ?? asset.reviewedBy,
        });
      }
      return fail(
        "POLICY_DENIED",
        "Persetujuan foto & video peserta didik telah dicabut. Dokumentasi ditarik dari akses publik."
      );
    }
  }

  if (options?.forPublicChannel) {
    if (!asset.privacyReviewed || !asset.eligibleForPublic) {
      return fail(
        "POLICY_DENIED",
        "Dokumentasi ini belum lolos tinjauan privasi untuk ditampilkan di kanal publik."
      );
    }
  } else {
    const authz = authorizeReadMedia(user, asset.serviceUnitId);
    if (!authz.success) return authz;
  }

  const ttlSeconds = getMediaSignedUrlTtlSeconds();
  const signed = await createPrivateStorageSignedReadUrl(
    asset.filePath,
    ttlSeconds
  );

  // If the file object exists in storage, return its Supabase signed URL;
  // for seeded gallery paths before physical file upload, return the verified gallery asset path
  const resolvedUrl =
    signed?.signedUrl ?? resolveFallbackGalleryPath(asset.filePath);
  if (!resolvedUrl) {
    return fail(
      "RESOURCE_NOT_FOUND",
      "Berkas dokumentasi belum tersedia di penyimpanan."
    );
  }
  const expiresAt =
    signed?.expiresAt ??
    new Date(Date.now() + ttlSeconds * 1000).toISOString();

  return ok({
    mediaId: asset.id,
    signedUrl: resolvedUrl,
    ttlSeconds,
    expiresAt,
  });
}

export async function isMediaAssetEligibleForPublic(
  mediaId: string,
  subjectStudentIds?: string[]
): Promise<boolean> {
  const asset = await findMediaAssetById(mediaId);
  if (!asset || !asset.privacyReviewed || !asset.eligibleForPublic) {
    return false;
  }
  if (subjectStudentIds && subjectStudentIds.length > 0) {
    const check =
      await verifyAllStudentsHavePhotoVideoConsent(subjectStudentIds);
    if (!check.allowed) {
      await updateMediaAssetPrivacyStatus({
        mediaId: asset.id,
        privacyReviewed: asset.privacyReviewed,
        eligibleForPublic: false,
        reviewerId: asset.reviewedBy,
      });
      return false;
    }
  }
  return true;
}

export async function listMediaAssetsForWorkspace(
  user: SessionUser | null | undefined,
  filters: { search?: string; category?: string; eligibility?: string } = {}
): Promise<ActionResult<MediaAssetDTO[]>> {
  const authz = authorizeReadMedia(user);
  if (!authz.success) return authz;

  const serviceUnitIds = Array.from(
    new Set((user?.memberships ?? []).map((m) => m.serviceUnitId))
  );
  if (serviceUnitIds.length === 0) {
    return fail("SCOPE_DENIED", getHumanErrorMessage("SCOPE_DENIED"));
  }

  const rows = await findMediaAssetsByUnitIds({
    serviceUnitIds,
    category: filters.category,
    eligibility: filters.eligibility,
  });

  const searchLower = filters.search?.trim().toLowerCase() ?? "";
  const ttlSeconds = getMediaSignedUrlTtlSeconds();

  const filteredRows = rows.filter(
    (row) =>
      !searchLower ||
      row.title.toLowerCase().includes(searchLower) ||
      (row.description ?? "").toLowerCase().includes(searchLower)
  );

  const items: MediaAssetDTO[] = await Promise.all(
    filteredRows.map(async (row) => {
      const cat = row.category as MediaCategoryCode;
      const signedReadUrl = await resolveMediaReadUrl(row.filePath, ttlSeconds);
      return {
        id: row.id,
        organizationId: row.organizationId,
        serviceUnitId: row.serviceUnitId,
        title: row.title,
        description: row.description,
        filePath: row.filePath,
        mimeType: row.mimeType,
        fileSize: row.fileSize,
        category: cat,
        categoryLabel: MEDIA_CATEGORY_LABELS[cat] ?? cat,
        privacyReviewed: row.privacyReviewed,
        eligibleForPublic: row.eligibleForPublic,
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
        capturedDate: row.capturedDate,
        uploadedBy: row.createdBy,
        createdAt: row.createdAt.toISOString(),
        signedReadUrl,
        signedUrlTtlSeconds: ttlSeconds,
      };
    })
  );

  return ok(items);
}

/**
 * Public Gallery Query (`04 §19`, `11 §15`, ADR-13 D-23, D-29).
 * ONLY returns media assets where `privacyReviewed === true && eligibleForPublic === true`.
 * Unreviewed or internal media assets are physically excluded at the SQL query level.
 * Generates server-side signed read URLs with TTL > page cache revalidate window.
 */
export async function listPublicGalleryMedia(
  serviceUnitId?: string
): Promise<MediaAssetDTO[]> {
  const rows = await findPublicEligibleMediaAssets(serviceUnitId);
  const ttlSeconds = getMediaSignedUrlTtlSeconds();

  const items = await Promise.all(
    rows.map(async (row) => {
      const cat = row.category as MediaCategoryCode;
      const signedReadUrl = await resolveMediaReadUrl(row.filePath, ttlSeconds);

      return {
        id: row.id,
        organizationId: row.organizationId,
        serviceUnitId: row.serviceUnitId,
        title: row.title,
        description: row.description,
        filePath: row.filePath,
        mimeType: row.mimeType,
        fileSize: row.fileSize,
        category: cat,
        categoryLabel: MEDIA_CATEGORY_LABELS[cat] ?? cat,
        privacyReviewed: row.privacyReviewed,
        eligibleForPublic: row.eligibleForPublic,
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
        capturedDate: row.capturedDate,
        uploadedBy: row.createdBy,
        createdAt: row.createdAt.toISOString(),
        signedReadUrl,
        signedUrlTtlSeconds: ttlSeconds,
      };
    })
  );

  return items;
}

export async function countUnreviewedMediaForDashboard(
  user: SessionUser | null | undefined
): Promise<number> {
  const authz = authorizeReadMedia(user);
  if (!authz.success) return 0;

  const serviceUnitIds = Array.from(
    new Set((user?.memberships ?? []).map((m) => m.serviceUnitId))
  );
  if (serviceUnitIds.length === 0) return 0;

  return countUnreviewedMediaByUnitIds(serviceUnitIds);
}

