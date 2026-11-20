import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { publications } from "@/db/schema";
import type { PublicationStatus } from "@/lib/status";
import type { PublicationCategoryCode } from "../types/publishing-types";

/**
 * Publishing Domain Repository (11 §17, §24).
 * STRICT BOUNDARY: Only queries `publications`. Never queries `media_assets`, `consents`, or `students`.
 */
export async function findPublicationById(publicationId: string) {
  const [row] = await db
    .select()
    .from(publications)
    .where(
      and(eq(publications.id, publicationId), isNull(publications.archivedAt))
    )
    .limit(1);
  return row ?? null;
}

export async function findPublicationBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(publications)
    .where(and(eq(publications.slug, slug), isNull(publications.archivedAt)))
    .limit(1);
  return row ?? null;
}

export async function findPublicationsByUnitIds(params: {
  serviceUnitIds: string[];
  status?: string;
  category?: string;
}) {
  if (params.serviceUnitIds.length === 0) return [];
  const conditions = [
    inArray(publications.serviceUnitId, params.serviceUnitIds),
    isNull(publications.archivedAt),
  ];

  if (params.status && params.status !== "ALL") {
    conditions.push(
      eq(publications.status, params.status as PublicationStatus)
    );
  }
  if (params.category && params.category !== "ALL") {
    conditions.push(eq(publications.category, params.category));
  }

  return db
    .select()
    .from(publications)
    .where(and(...conditions))
    .orderBy(desc(publications.updatedAt), desc(publications.createdAt));
}

export async function findPublishedPublicPosts(serviceUnitId?: string) {
  const conditions = [
    eq(publications.status, "PUBLISHED"),
    isNull(publications.archivedAt),
  ];
  if (serviceUnitId) {
    conditions.push(eq(publications.serviceUnitId, serviceUnitId));
  }

  return db
    .select()
    .from(publications)
    .where(and(...conditions))
    .orderBy(desc(publications.publishedAt), desc(publications.createdAt));
}

export async function insertPublication(params: {
  organizationId: string;
  serviceUnitId: string;
  title: string;
  slug: string;
  category: PublicationCategoryCode;
  excerpt?: string | null;
  content: string;
  coverMediaId?: string | null;
  eventDate?: string | null;
  eventLocation?: string | null;
  actorId: string;
}) {
  const [inserted] = await db
    .insert(publications)
    .values({
      organizationId: params.organizationId,
      serviceUnitId: params.serviceUnitId,
      title: params.title,
      slug: params.slug,
      category: params.category,
      excerpt: params.excerpt ?? null,
      content: params.content,
      coverMediaId: params.coverMediaId ?? null,
      status: "DRAFT",
      eventDate: params.eventDate ?? null,
      eventLocation: params.eventLocation ?? null,
      createdBy: params.actorId,
      updatedBy: params.actorId,
    })
    .returning();
  return inserted;
}

export async function updatePublicationStatusById(params: {
  publicationId: string;
  status: PublicationStatus;
  publishedAt?: Date | null;
  actorId: string;
}) {
  const [updated] = await db
    .update(publications)
    .set({
      status: params.status,
      ...(params.publishedAt !== undefined
        ? { publishedAt: params.publishedAt }
        : {}),
      updatedAt: new Date(),
      updatedBy: params.actorId,
    })
    .where(eq(publications.id, params.publicationId))
    .returning();
  return updated ?? null;
}

