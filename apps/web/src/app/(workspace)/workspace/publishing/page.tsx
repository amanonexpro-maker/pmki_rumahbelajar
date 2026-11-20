import type { Metadata } from "next";
import { listPublicGalleryMedia } from "@/features/media";
import {
  listPublicationsForWorkspace,
  PublishingWorkspaceClient,
} from "@/features/publishing";
import { requireSession } from "@/server/auth/session";
import { can } from "@/server/permissions";

export const instant = false;

export const metadata: Metadata = {
  title: "Publikasi | PMKI",
  description:
    "Kelola alur editorial dan tinjauan privasi konten publikasi Rumah Belajar PMKI.",
};

interface PublishingPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

export default async function WorkspacePublishingPage({
  searchParams,
}: PublishingPageProps) {
  const [session, resolvedParams] = await Promise.all([
    requireSession(),
    searchParams,
  ]);

  const primaryUnitId = session.memberships[0]?.serviceUnitId;
  const search = resolvedParams.search ?? "";
  const status = resolvedParams.status ?? "ALL";

  const [listRes, eligibleMedia] = await Promise.all([
    listPublicationsForWorkspace(session, { search, status }),
    listPublicGalleryMedia(primaryUnitId),
  ]);

  if (!listRes.success) {
    return (
      <div
        role="alert"
        className="rounded-card border border-danger/30 bg-danger-soft p-6 text-sm text-danger"
      >
        <p className="font-semibold">Akses ditolak</p>
        <p className="mt-1">{listRes.error.message}</p>
      </div>
    );
  }

  const canCreate =
    can(session, "publication.create", { serviceUnitId: primaryUnitId }) ||
    can(session, "publication.update", { serviceUnitId: primaryUnitId });
  const canReview = can(session, "publication.review", {
    serviceUnitId: primaryUnitId,
  });
  const canPublish = can(session, "publication.publish", {
    serviceUnitId: primaryUnitId,
  });

  return (
    <PublishingWorkspaceClient
      publications={listRes.data}
      eligibleMedia={eligibleMedia}
      initialSearch={search}
      initialStatus={status}
      currentUserId={session.id}
      canCreate={canCreate}
      canReview={canReview}
      canPublish={canPublish}
    />
  );
}

