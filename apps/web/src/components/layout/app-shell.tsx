"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  FileCheck2,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  Newspaper,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { ConnectivityTopBanner } from "@/hooks/use-connectivity";
import type { UserPersona } from "@/lib/auth/personas";
import { MobileNavigation } from "./mobile-navigation";
import { PageContainer, type ContainerWidth } from "./page-container";
import { Sidebar, type SidebarNavGroup } from "./sidebar";
import { WorkspaceBottomNav } from "./workspace-bottom-nav";
import { WorkspaceHeader, type WorkspaceHeaderUser } from "./workspace-header";

/**
 * Default Canonical Workspace Navigation (10-CONTENT-MICROCOPY-GUIDE.md §5 & §5A).
 * Navigation labels use Title Case; zero non-canonical terms.
 */
export const DEFAULT_WORKSPACE_NAV: SidebarNavGroup[] = [
  {
    id: "ringkasan",
    title: "Ringkasan",
    personas: ["GURU", "PENGURUS", "SUPERADMIN"],
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/workspace",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "rumah-belajar",
    title: "Rumah Belajar",
    personas: ["GURU", "PENGURUS", "SUPERADMIN"],
    items: [
      {
        id: "students",
        label: "Peserta Didik",
        href: "/workspace/students",
        icon: Users,
        requiredPermission: "student.read",
      },
      {
        id: "attendance",
        label: "Kehadiran",
        href: "/workspace/attendance",
        icon: CalendarCheck,
        requiredPermission: "attendance.read",
      },
      {
        id: "development",
        label: "Perkembangan Peserta",
        href: "/workspace/development",
        icon: TrendingUp,
        requiredPermission: "development.read",
      },
      {
        id: "academic",
        label: "Kelas & Pengajar",
        href: "/workspace/academic",
        icon: Building2,
        requiredPermission: "unit.read",
      },
    ],
  },
  {
    id: "tata-kelola",
    title: "Tata Kelola",
    personas: ["PENGURUS", "SUPERADMIN"],
    items: [
      {
        id: "consent",
        label: "Persetujuan",
        href: "/workspace/consent",
        icon: ShieldCheck,
        requiredPermission: "consent.read",
      },
      {
        id: "media",
        label: "Dokumentasi",
        href: "/workspace/media",
        icon: ImageIcon,
        requiredPermission: "media.read",
      },
      {
        id: "publishing",
        label: "Publikasi",
        href: "/workspace/publishing",
        icon: Newspaper,
        requiredPermission: "publication.read",
      },
      {
        id: "reports",
        label: "Laporan",
        href: "/workspace/reports",
        icon: FileCheck2,
        requiredPermission: "report.read",
      },
    ],
  },
  {
    id: "sistem",
    title: "Sistem",
    personas: ["SUPERADMIN"],
    items: [
      {
        id: "audit",
        label: "Jejak Audit",
        href: "/workspace/audit",
        icon: History,
        requiredPermission: "audit.read",
      },
      {
        id: "administration",
        label: "Administrasi",
        href: "/workspace/administration",
        icon: Settings,
        requiredPermission: "user.read",
      },
    ],
  },
];

export interface AppShellProps {
  navGroups?: SidebarNavGroup[];
  user?: WorkspaceHeaderUser;
  userPermissions?: string[];
  userPersona?: UserPersona;
  contentWidth?: ContainerWidth;
  headerRightSlot?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  navGroups = DEFAULT_WORKSPACE_NAV,
  user,
  userPermissions,
  userPersona,
  contentWidth = "default",
  headerRightSlot,
  children,
}: AppShellProps) {
  const pathname = usePathname() || "/workspace";
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const activeItem = navGroups
    .flatMap((g) => g.items)
    .find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/workspace" && pathname.startsWith(`${item.href}/`))
    );

  const currentViewLabel = activeItem?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <div className="flex-1 flex min-h-screen">
        <Sidebar
          groups={navGroups}
          currentPath={pathname}
          userPermissions={userPermissions}
          userPersona={userPersona}
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <WorkspaceHeader
            currentViewLabel={currentViewLabel}
            user={user}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            rightSlot={headerRightSlot}
          />

          <ConnectivityTopBanner />

          <MobileNavigation
            open={mobileMenuOpen}
            onOpenChange={setMobileMenuOpen}
            groups={navGroups}
            currentPath={pathname}
            userPermissions={userPermissions}
            userPersona={userPersona}
          />

          <WorkspaceBottomNav
            groups={navGroups}
            userPermissions={userPermissions}
            currentPath={pathname}
          />

          <main className="flex-1 py-6 sm:py-8">
            <PageContainer width={contentWidth}>{children}</PageContainer>
          </main>
        </div>
      </div>
    </div>
  );
}

