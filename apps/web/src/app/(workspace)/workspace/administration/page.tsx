import type { Metadata } from "next";
import {
  AdministrationWorkspaceClient,
  getAdministrationWorkspaceView,
} from "@/features/administration";
import { requireSession } from "@/server/auth/session";
import { can } from "@/server/permissions";

export const instant = false;

export const metadata: Metadata = {
  title: "Administrasi | PMKI",
  description:
    "Kelola Pengguna, Peran Kustom, Registri Hak Akses, Override Akses Dinamis, dan Penetapan Lingkup Platform Pelayanan Terpadu PMKI.",
};

interface AdministrationPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function WorkspaceAdministrationPage({
  searchParams,
}: AdministrationPageProps) {
  const [session, resolvedParams] = await Promise.all([
    requireSession(),
    searchParams,
  ]);

  const viewRes = await getAdministrationWorkspaceView(session);
  if (!viewRes.success) {
    return (
      <div
        role="alert"
        className="rounded-card border border-danger/30 bg-danger-soft p-6 text-sm text-danger"
      >
        <p className="font-semibold">Akses ditolak</p>
        <p className="mt-1">{viewRes.error.message}</p>
      </div>
    );
  }

  const canManageUsers =
    can(session, "user.create") ||
    can(session, "user.update") ||
    can(session, "role.manage");
  const canManageRoles = can(session, "role.manage");
  const canManagePermissions =
    can(session, "permission.manage") || can(session, "role.manage");

  return (
    <AdministrationWorkspaceClient
      view={viewRes.data}
      initialTab={resolvedParams.tab ?? "users"}
      currentUserId={session.id}
      canManageUsers={canManageUsers}
      canManageRoles={canManageRoles}
      canManagePermissions={canManagePermissions}
    />
  );
}

