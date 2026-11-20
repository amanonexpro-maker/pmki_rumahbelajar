import type { Metadata } from "next";
import {
  listMediaAssetsForWorkspace,
  MediaWorkspaceClient,
} from "@/features/media";
import { requireSession } from "@/server/auth/session";
import { can } from "@/server/permissions";

export const instant = false;

export const metadata: Metadata = {
  title: "Dokumentasi | PMKI",
  description:
    "Kelola dokumentasi kegiatan Rumah Belajar PMKI pada bucket penyimpanan privat dengan tinjauan privasi berprinsip pemisahan tugas.",
};

interface MediaPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    eligibility?: string;
  }>;
}

export default async function WorkspaceMediaPage({
  searchParams,
}: MediaPageProps) {
  const [session, resolvedParams] = await Promise.all([
    requireSession(),
    searchParams,
  ]);

  const primaryUnitId = session.memberships[0]?.serviceUnitId;
  const search = resolvedParams.search ?? "";
  const category = resolvedParams.category ?? "ALL";
  const eligibility = resolvedParams.eligibility ?? "ALL";

  const listRes = await listMediaAssetsForWorkspace(session, {
    search,
    category,
    eligibility,
  });

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

  const canCreate = can(session, "media.create", {
    serviceUnitId: primaryUnitId,
  });
  const canReview = can(session, "media.review", {
    serviceUnitId: primaryUnitId,
  });

  return (
    <MediaWorkspaceClient
      assets={listRes.data}
      initialSearch={search}
      initialCategory={category}
      initialEligibility={eligibility}
      currentUserId={session.id}
      canCreate={canCreate}
      canReview={canReview}
    />
  );
}

