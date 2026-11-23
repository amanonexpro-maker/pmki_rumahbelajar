import { recordAuditLog, recordDomainAuditEvent } from "@/features/audit";
import { verifyAllStudentsHavePhotoVideoConsent } from "@/features/consent";
import {
  getSignedMediaReadUrl,
  isMediaAssetEligibleForPublic,
} from "@/features/media";
import { getHumanErrorMessage } from "@/lib/messages";
import { PUBLICATION_STATUS_META, type PublicationStatus } from "@/lib/status";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import {
  authorizeCreatePublication,
  authorizePublishPublicationWithSoD,
  authorizeReadPublications,
  authorizeReviewPublicationPrivacy,
  authorizeSubmitForPrivacyReview,
} from "../permissions/publishing-policy";
import {
  findPublicationById,
  findPublicationBySlug,
  findPublicationsByUnitIds,
  findPublishedPublicPosts,
  insertPublication,
  updatePublicationStatusById,
} from "../repositories/publishing-repository";
import {
  PUBLICATION_CATEGORY_LABELS,
  type PublicationCategoryCode,
  type PublicationDTO,
} from "../types/publishing-types";
import {
  createPublicationSchema,
  transitionPublicationStatusSchema,
} from "../validators/publishing-validator";

/**
 * Stored Publication Workflow State Machine (`04 §22`, `11 §17`, Product Owner Rule #5):
 * DRAFT -> PRIVACY_REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED
 */
const ALLOWED_PUBLICATION_TRANSITIONS: Record<
  PublicationStatus,
  readonly PublicationStatus[]
> = {
  DRAFT: ["PRIVACY_REVIEW", "ARCHIVED"],
  PRIVACY_REVIEW: ["APPROVED", "DRAFT", "ARCHIVED"],
  APPROVED: ["PUBLISHED", "PRIVACY_REVIEW", "DRAFT"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

export function isValidPublicationTransition(
  from: PublicationStatus,
  to: PublicationStatus
): boolean {
  return ALLOWED_PUBLICATION_TRANSITIONS[from].includes(to);
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
  const suffix = String(Date.now() % 100000).padStart(5, "0");
  return `${base || "publikasi"}-${suffix}`;
}

export async function createPublicationDraft(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<ActionResult<PublicationDTO>> {
  const parsed = createPublicationSchema.safeParse(rawInput);
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

  const authz = authorizeCreatePublication(user, membership.serviceUnitId);
  if (!authz.success) return authz;

  let slug = generateSlug(parsed.data.title);
  const existingSlug = await findPublicationBySlug(slug);
  if (existingSlug) {
    slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`;
  }

  const created = await insertPublication({
    organizationId: membership.organizationId,
    serviceUnitId: membership.serviceUnitId,
    title: parsed.data.title,
    slug,
    category: parsed.data.category,
    excerpt:
      parsed.data.excerpt?.trim() ||
      parsed.data.content.slice(0, 140).trim() + "...",
    content: parsed.data.content,
    coverMediaId: parsed.data.coverMediaId ?? null,
    eventDate: parsed.data.eventDate ?? null,
    eventLocation: parsed.data.eventLocation ?? null,
    actorId: user.id,
  });

  await recordAuditLog({
    organizationId: created.organizationId,
    serviceUnitId: created.serviceUnitId,
    actorId: user.id,
    action: "PublicationDraftCreated",
    entityType: "publication",
    entityId: created.id,
    description: `Membuat draft konten publikasi "${created.title}".`,
    metadata: {
      slug: created.slug,
      category: created.category,
      coverMediaId: created.coverMediaId,
    },
  });

  const cat = created.category as PublicationCategoryCode;
  return ok({
    id: created.id,
    organizationId: created.organizationId,
    serviceUnitId: created.serviceUnitId,
    title: created.title,
    slug: created.slug,
    category: cat,
    categoryLabel: PUBLICATION_CATEGORY_LABELS[cat] ?? cat,
    excerpt: created.excerpt,
    content: created.content,
    coverMediaId: created.coverMediaId,
    coverSignedUrl: null,
    status: created.status as PublicationStatus,
    publishedAt: null,
    eventDate: created.eventDate,
    eventLocation: created.eventLocation,
    authorId: created.createdBy,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
}

/**
 * Transitions publication workflow (`DRAFT -> PRIVACY_REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED`).
 * Enforces:
 * - Stored state machine rules (`isValidPublicationTransition`)
 * - Role permissions + scope per stage
 * - Cover media public eligibility via `MediaService.isMediaAssetEligibleForPublic`
 * - Subject student photo/video consent via `ConsentService.verifyAllStudentsHavePhotoVideoConsent`
 * - Strict Separation of Duties on `PUBLISHED` (`author !== publisher`, even for PLATFORM_ADMIN)
 */
export async function transitionPublicationStatus(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<
  ActionResult<{
    publicationId: string;
    previousStatus: PublicationStatus;
    newStatus: PublicationStatus;
    publishedAt: string | null;
    slug?: string;
  }>
> {
  const parsed = transitionPublicationStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const post = await findPublicationById(parsed.data.publicationId);
  if (!post) {
    return fail("RESOURCE_NOT_FOUND", "Konten publikasi tidak ditemukan.");
  }

  const currentStatus = post.status as PublicationStatus;
  const targetStatus = parsed.data.targetStatus;

  if (!isValidPublicationTransition(currentStatus, targetStatus)) {
    return fail(
      "RESOURCE_CONFLICT",
      `Perubahan status dari "${PUBLICATION_STATUS_META[currentStatus].label}" ke "${PUBLICATION_STATUS_META[targetStatus].label}" tidak sesuai urutan alur publikasi.`
    );
  }

  // Stage-specific RBAC & Policy checks
  if (targetStatus === "PRIVACY_REVIEW" || targetStatus === "DRAFT") {
    const authz = authorizeSubmitForPrivacyReview(user, post.serviceUnitId);
    if (!authz.success) return authz;
  } else if (targetStatus === "APPROVED") {
    const authz = authorizeReviewPublicationPrivacy(user, post.serviceUnitId);
    if (!authz.success) return authz;
  } else if (targetStatus === "PUBLISHED") {
    // Separation of Duties: Author CANNOT publish their own post (Product Owner Rule #5)
    const authz = authorizePublishPublicationWithSoD(
      user,
      post.serviceUnitId,
      post.createdBy
    );
    if (!authz.success) return authz;
  } else if (targetStatus === "ARCHIVED") {
    const authz = authorizeSubmitForPrivacyReview(user, post.serviceUnitId);
    if (!authz.success) {
      const pubAuthz = authorizeReviewPublicationPrivacy(
        user,
        post.serviceUnitId
      );
      if (!pubAuthz.success) return pubAuthz;
    }
  }

  // Consent & Cover Media Eligibility Gate before APPROVED or PUBLISHED
  if (targetStatus === "APPROVED" || targetStatus === "PUBLISHED") {
    if (
      parsed.data.subjectStudentIds &&
      parsed.data.subjectStudentIds.length > 0
    ) {
      const consentCheck = await verifyAllStudentsHavePhotoVideoConsent(
        parsed.data.subjectStudentIds
      );
      if (!consentCheck.allowed) {
        return fail(
          "POLICY_DENIED",
          "Publikasi tidak dapat disetujui atau diterbitkan karena terdapat peserta didik yang persetujuan foto/videonya tidak aktif atau telah dicabut."
        );
      }
    }

    if (post.coverMediaId) {
      const mediaEligible = await isMediaAssetEligibleForPublic(
        post.coverMediaId,
        parsed.data.subjectStudentIds
      );
      if (!mediaEligible) {
        return fail(
          "POLICY_DENIED",
          "Dokumentasi sampul belum lolos tinjauan privasi atau tidak layak publik. Tinjau dokumentasi terlebih dahulu."
        );
      }
    }
  }

  const publishedAt =
    targetStatus === "PUBLISHED"
      ? new Date()
      : targetStatus === "DRAFT"
        ? null
        : post.publishedAt;

  const updated = await updatePublicationStatusById({
    publicationId: post.id,
    status: targetStatus,
    publishedAt,
    actorId: user?.id ?? "",
  });

  if (!updated) {
    return fail("INTERNAL_ERROR", getHumanErrorMessage("INTERNAL_ERROR"));
  }

  if (targetStatus === "PUBLISHED") {
    await recordDomainAuditEvent({
      name: "PublicationPublished",
      organizationId: post.organizationId,
      serviceUnitId: post.serviceUnitId,
      actorId: user?.id ?? null,
      entityType: "publication",
      entityId: post.id,
      description: `Menerbitkan konten publikasi "${post.title}" ke portal publik.`,
      metadata: {
        slug: post.slug,
        previousStatus: currentStatus,
        newStatus: targetStatus,
        coverMediaId: post.coverMediaId,
        notes: parsed.data.notes ?? null,
      },
    });
  } else {
    await recordAuditLog({
      organizationId: post.organizationId,
      serviceUnitId: post.serviceUnitId,
      actorId: user?.id ?? null,
      action: "PublicationStatusChanged",
      entityType: "publication",
      entityId: post.id,
      description: `Mengubah status publikasi "${post.title}" dari ${PUBLICATION_STATUS_META[currentStatus].label} menjadi ${PUBLICATION_STATUS_META[targetStatus].label}.`,
      metadata: {
        previousStatus: currentStatus,
        newStatus: targetStatus,
        notes: parsed.data.notes ?? null,
      },
    });
  }

  return ok({
    publicationId: updated.id,
    previousStatus: currentStatus,
    newStatus: updated.status as PublicationStatus,
    publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
    slug: post.slug,
  });
}

export async function listPublicationsForWorkspace(
  user: SessionUser | null | undefined,
  filters: { search?: string; status?: string; category?: string } = {}
): Promise<ActionResult<PublicationDTO[]>> {
  const authz = authorizeReadPublications(user);
  if (!authz.success) return authz;

  const serviceUnitIds = Array.from(
    new Set((user?.memberships ?? []).map((m) => m.serviceUnitId))
  );
  if (serviceUnitIds.length === 0) {
    return fail("SCOPE_DENIED", getHumanErrorMessage("SCOPE_DENIED"));
  }

  const rows = await findPublicationsByUnitIds({
    serviceUnitIds,
    status: filters.status,
    category: filters.category,
  });

  const searchLower = filters.search?.trim().toLowerCase() ?? "";
  const filteredRows = rows.filter(
    (row) =>
      !searchLower ||
      row.title.toLowerCase().includes(searchLower) ||
      (row.excerpt ?? "").toLowerCase().includes(searchLower)
  );

  const items: PublicationDTO[] = await Promise.all(
    filteredRows.map(async (row) => {
      let coverSignedUrl: string | null = null;
      if (row.coverMediaId) {
        const signedRes = await getSignedMediaReadUrl(user, row.coverMediaId);
        if (signedRes.success) {
          coverSignedUrl = signedRes.data.signedUrl;
        }
      }

      const cat = row.category as PublicationCategoryCode;
      return {
        id: row.id,
        organizationId: row.organizationId,
        serviceUnitId: row.serviceUnitId,
        title: row.title,
        slug: row.slug,
        category: cat,
        categoryLabel: PUBLICATION_CATEGORY_LABELS[cat] ?? cat,
        excerpt: row.excerpt,
        content: row.content,
        coverMediaId: row.coverMediaId,
        coverSignedUrl,
        status: row.status as PublicationStatus,
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
        eventDate: row.eventDate,
        eventLocation: row.eventLocation,
        authorId: row.createdBy,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    })
  );

  return ok(items);
}

/**
 * Public News / Publications Query (`11 §17`).
 * Strictly returns ONLY `status === "PUBLISHED"` posts and resolves cover images
 * exclusively through `MediaService.getSignedMediaReadUrl(..., { forPublicChannel: true })`.
 */
export async function listPublishedPublicationsForPublic(
  serviceUnitId?: string
): Promise<PublicationDTO[]> {
  const rows = await findPublishedPublicPosts(serviceUnitId);
  const items: PublicationDTO[] = await Promise.all(
    rows.map(async (row) => {
      let coverSignedUrl: string | null = null;
      if (row.coverMediaId) {
        const signedRes = await getSignedMediaReadUrl(null, row.coverMediaId, {
          forPublicChannel: true,
        });
        if (signedRes.success) {
          coverSignedUrl = signedRes.data.signedUrl;
        }
      }

      const cat = row.category as PublicationCategoryCode;
      return {
        id: row.id,
        organizationId: row.organizationId,
        serviceUnitId: row.serviceUnitId,
        title: row.title,
        slug: row.slug,
        category: cat,
        categoryLabel: PUBLICATION_CATEGORY_LABELS[cat] ?? cat,
        excerpt: row.excerpt,
        content: row.content,
        coverMediaId: row.coverMediaId,
        coverSignedUrl,
        status: row.status as PublicationStatus,
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
        eventDate: row.eventDate,
        eventLocation: row.eventLocation,
        authorId: row.createdBy,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    })
  );

  return items;
}

/**
 * Public News / Publication Single Item Query by Slug (`11 §17`).
 * Strictly returns ONLY if `status === "PUBLISHED"` and resolves cover media
 * through `MediaService.getSignedMediaReadUrl(..., { forPublicChannel: true })`.
 */
export async function getPublishedPublicationBySlug(
  slug: string
): Promise<PublicationDTO | null> {
  const row = await findPublicationBySlug(slug);
  if (!row || row.status !== "PUBLISHED") {
    return null;
  }

  let coverSignedUrl: string | null = null;
  if (row.coverMediaId) {
    const signedRes = await getSignedMediaReadUrl(null, row.coverMediaId, {
      forPublicChannel: true,
    });
    if (signedRes.success) {
      coverSignedUrl = signedRes.data.signedUrl;
    }
  }

  const cat = row.category as PublicationCategoryCode;
  return {
    id: row.id,
    organizationId: row.organizationId,
    serviceUnitId: row.serviceUnitId,
    title: row.title,
    slug: row.slug,
    category: cat,
    categoryLabel: PUBLICATION_CATEGORY_LABELS[cat] ?? cat,
    excerpt: row.excerpt,
    content: row.content,
    coverMediaId: row.coverMediaId,
    coverSignedUrl,
    status: row.status as PublicationStatus,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    eventDate: row.eventDate,
    eventLocation: row.eventLocation,
    authorId: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

