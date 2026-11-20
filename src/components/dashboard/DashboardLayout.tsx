/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { storage } from '../../services/storage.ts';
import {
  AppShell,
  type ContainerWidth,
  type SidebarNavGroup,
} from '../layout/index.ts';
import { User } from '../../types/index.ts';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  TrendingUp,
  ShieldAlert,
  Newspaper,
  FileCheck2,
  Building2,
  History,
  Settings,
} from 'lucide-react';

export interface DashboardLayoutProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onBackToPublic: () => void;
  contentWidth?: ContainerWidth;
  children: React.ReactNode;
}

const VIEW_WIDTH_MAP: Record<string, ContainerWidth> = {
  overview: 'default',
  students: 'wide',
  attendance: 'wide',
  development: 'default',
  organization: 'default',
  'consent-media': 'default',
  publishing: 'default',
  reports: 'wide',
  'audit-log': 'wide',
  admin: 'default',
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentView,
  onSelectView,
  onBackToPublic,
  contentWidth,
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User>(storage.getCurrentUser());

  const allUsers = storage.getUsers();
  const studentCount = storage.getStudents().length;

  const handleSwitchUser = (user: User) => {
    storage.setCurrentUser(user);
    setCurrentUser(user);
  };

  /*
   * Navigation Hierarchy (Section 15 of UI-UX-DESIGN-SYSTEM.md)
   * Mapped strictly to existing working views without inventing fake routes.
   */
  const navGroups: SidebarNavGroup[] = [
    {
      id: 'overview',
      title: 'Overview',
      items: [
        {
          id: 'overview',
          label: 'Ringkasan Pelayanan',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      id: 'rumah-belajar',
      title: 'Rumah Belajar',
      items: [
        {
          id: 'students',
          label: 'Siswa & Pendaftaran',
          icon: Users,
          badge: studentCount,
          requiredPermission: 'student.read',
        },
        {
          id: 'attendance',
          label: 'Presensi Sesi Belajar',
          icon: CalendarCheck,
          requiredPermission: 'attendance.read',
        },
        {
          id: 'development',
          label: 'Catatan Perkembangan',
          icon: TrendingUp,
          requiredPermission: 'development.read',
        },
      ],
    },
    {
      id: 'programs',
      title: 'Programs',
      items: [
        {
          id: 'organization',
          label: 'Organisasi, Kelas & Guru',
          icon: Building2,
          requiredPermission: 'unit.read',
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      items: [
        {
          id: 'consent-media',
          label: 'Izin Privasi & Media',
          icon: ShieldAlert,
          requiredPermission: 'consent.read',
        },
        {
          id: 'publishing',
          label: 'Publikasi & Berita',
          icon: Newspaper,
          requiredPermission: 'publication.read',
        },
      ],
    },
    {
      id: 'reports',
      title: 'Reports',
      items: [
        {
          id: 'reports',
          label: 'Laporan & Persetujuan',
          icon: FileCheck2,
          requiredPermission: 'report.read',
        },
      ],
    },
    {
      id: 'administration',
      title: 'Administration',
      items: [
        {
          id: 'audit-log',
          label: 'Audit Trail Sistem',
          icon: History,
          requiredPermission: 'audit.read',
        },
        {
          id: 'admin',
          label: 'Administrasi & Hak Akses',
          icon: Settings,
          requiredPermission: 'user.read',
        },
      ],
    },
  ];

  const allNavItems = navGroups.flatMap((group) => group.items);
  const currentViewLabel =
    allNavItems.find((item) => item.id === currentView)?.label ||
    'Ringkasan Pelayanan';

  const resolvedWidth =
    contentWidth || VIEW_WIDTH_MAP[currentView] || 'default';

  return (
    <AppShell
      navGroups={navGroups}
      currentView={currentView}
      currentViewLabel={currentViewLabel}
      currentUser={currentUser}
      allUsers={allUsers}
      onSelectView={onSelectView}
      onSwitchUser={handleSwitchUser}
      onBackToPublic={onBackToPublic}
      contentWidth={resolvedWidth}
    >
      <React.Fragment key={currentUser.id}>{children}</React.Fragment>
    </AppShell>
  );
};
