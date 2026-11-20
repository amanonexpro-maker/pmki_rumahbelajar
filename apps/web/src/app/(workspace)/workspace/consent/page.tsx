import type { Metadata } from "next";
import {
  ConsentWorkspaceClient,
  listConsentsForWorkspace,
} from "@/features/consent";
import { requireSession } from "@/server/auth/session";
import { can } from "@/server/permissions";

export const instant = false;

export const metadata: Metadata = {
  title: "Persetujuan | PMKI",
  description:
    "Kelola Persetujuan Data dan Persetujuan Foto & Video peserta didik Rumah Belajar PMKI.",
};

interface ConsentPageProps {
  searchParams: Promise<{
    search?: string;
    photoStatus?: string;
  }>;
}

export default async function WorkspaceConsentPage({
  searchParams,
}: ConsentPageProps) {
  const [session, resolvedParams] = await Promise.all([
    requireSession(),
    searchParams,
  ]);

  const primaryUnitId = session.memberships[0]?.serviceUnitId;
  const search = resolvedParams.search ?? "";
  const photoStatus = resolvedParams.photoStatus ?? "ALL";

  const listRes = await listConsentsForWorkspace(session, {
    search,
    photoVideoStatus: photoStatus,
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

  const canUpdate =
    can(session, "consent.update", { serviceUnitId: primaryUnitId }) ||
    can(session, "consent.review", { serviceUnitId: primaryUnitId });

  return (
    <ConsentWorkspaceClient
      consents={listRes.data}
      initialSearch={search}
      initialPhotoStatus={photoStatus}
      canUpdate={canUpdate}
    />
  );
}

