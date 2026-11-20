import type { Metadata } from "next";
import {
  AuditWorkspaceClient,
  listAuditLogsForWorkspace,
} from "@/features/audit";
import { requireSession } from "@/server/auth/session";

export const instant = false;

export const metadata: Metadata = {
  title: "Jejak Audit | PMKI",
  description:
    "Jejak audit sistem Platform Pelayanan Terpadu PMKI yang bersifat baca-saja dan permanen.",
};

interface AuditPageProps {
  searchParams: Promise<{
    search?: string;
    action?: string;
    entityType?: string;
    page?: string;
  }>;
}

export default async function WorkspaceAuditPage({
  searchParams,
}: AuditPageProps) {
  const [session, resolvedParams] = await Promise.all([
    requireSession(),
    searchParams,
  ]);

  const search = resolvedParams.search ?? "";
  const action = resolvedParams.action ?? "ALL";
  const entityType = resolvedParams.entityType ?? "ALL";
  const parsedPage = Number.parseInt(resolvedParams.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const listRes = await listAuditLogsForWorkspace(session, {
    search,
    action,
    entityType,
    page,
    pageSize: 20,
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

  return (
    <AuditWorkspaceClient
      listResult={listRes.data}
      initialSearch={search}
      initialAction={action}
      initialEntityType={entityType}
    />
  );
}

