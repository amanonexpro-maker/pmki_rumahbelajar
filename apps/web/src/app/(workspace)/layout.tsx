import * as React from "react";
import { AppShell } from "@/components/layout";
import { LogoutButton } from "@/features/identity";
import { getRoleLabel, type SystemRole } from "@/lib/status";
import { requireSession } from "@/server/auth/session";

export const instant = false;

function formatPrimaryRoleLabel(roles: string[]): string {
  const firstRole = roles[0] as SystemRole | undefined;
  if (!firstRole) return "Pengguna";
  return getRoleLabel(firstRole) ?? firstRole;
}

/**
 * Protected Workspace Layout (05 §20, D-28).
 * Enforces server-side authentication via `requireSession()` (which calls
 * `supabase.auth.getUser()` + per-request DB RBAC resolution).
 */
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <AppShell
      user={{
        name: session.name,
        roleLabel: formatPrimaryRoleLabel(session.roles),
      }}
      userPermissions={session.permissions}
      userPersona={session.persona}
      headerRightSlot={<LogoutButton />}
      mobileFooterActionSlot={<LogoutButton showLabelOnMobile />}
      collapsedFooterActionSlot={<LogoutButton compact />}
    >
      {children}
    </AppShell>
  );
}

