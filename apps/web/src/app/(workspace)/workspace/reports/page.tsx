import type { Metadata } from "next";
import {
  getGovernanceOperationalMetrics,
  GovernanceWorkspaceClient,
  listGovernanceReportsForWorkspace,
} from "@/features/governance";
import { requireSession } from "@/server/auth/session";
import { can } from "@/server/permissions";

export const instant = false;

export const metadata: Metadata = {
  title: "Laporan | PMKI",
  description:
    "Tata kelola laporan pelayanan berjenjang Rumah Belajar PMKI dengan prinsip pemisahan tugas dan riwayat keputusan permanen.",
};

interface ReportsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    type?: string;
  }>;
}

export default async function WorkspaceReportsPage({
  searchParams,
}: ReportsPageProps) {
  const [session, resolvedParams] = await Promise.all([
    requireSession(),
    searchParams,
  ]);

  const primaryUnitId = session.memberships[0]?.serviceUnitId;
  const search = resolvedParams.search ?? "";
  const status = resolvedParams.status ?? "ALL";
  const reportType = resolvedParams.type ?? "ALL";

  const [reportsRes, metrics] = await Promise.all([
    listGovernanceReportsForWorkspace(session, { search, status, reportType }),
    getGovernanceOperationalMetrics(session),
  ]);

  if (!reportsRes.success) {
    return (
      <div
        role="alert"
        className="rounded-card border border-danger/30 bg-danger-soft p-6 text-sm text-danger"
      >
        <p className="font-semibold">Akses ditolak</p>
        <p className="mt-1">{reportsRes.error.message}</p>
      </div>
    );
  }

  const canCreate = can(session, "report.create", {
    serviceUnitId: primaryUnitId,
  });
  const canReview = can(session, "report.review", {
    serviceUnitId: primaryUnitId,
  });
  const canApprove = can(session, "report.approve", {
    serviceUnitId: primaryUnitId,
  });
  const canCreatePublication = can(session, "publication.create", {
    serviceUnitId: primaryUnitId,
  });

  return (
    <GovernanceWorkspaceClient
      reports={reportsRes.data}
      metrics={metrics}
      initialSearch={search}
      initialStatus={status}
      initialType={reportType}
      currentUserId={session.id}
      canCreate={canCreate}
      canReview={canReview}
      canApprove={canApprove}
      canCreatePublication={canCreatePublication}
    />
  );
}

