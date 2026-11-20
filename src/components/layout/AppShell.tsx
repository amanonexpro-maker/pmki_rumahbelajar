import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { User } from '../../types/index.ts';
import { Button, Icon, Sheet } from '../ui/index.ts';
import { PageContainer, type ContainerWidth } from './PageContainer.tsx';
import {
  Sidebar,
  SidebarNavigation,
  type SidebarNavGroup,
} from './Sidebar.tsx';
import { ThemePicker } from './ThemePicker.tsx';
import { WorkspaceHeader } from './WorkspaceHeader.tsx';

export interface AppShellProps {
  navGroups: SidebarNavGroup[];
  currentView: string;
  currentViewLabel: string;
  currentUser: User;
  allUsers: User[];
  onSelectView: (viewId: string) => void;
  onSwitchUser: (user: User) => void;
  onBackToPublic: () => void;
  contentWidth?: ContainerWidth;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  navGroups,
  currentView,
  currentViewLabel,
  currentUser,
  allUsers,
  onSelectView,
  onSwitchUser,
  onBackToPublic,
  contentWidth = 'default',
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <div className="flex-1 flex min-h-screen">
        {/* Desktop Persistent Sidebar (1024px+ / lg) */}
        <Sidebar
          groups={navGroups}
          currentView={currentView}
          currentUser={currentUser}
          onSelectView={onSelectView}
          onBackToPublic={onBackToPublic}
        />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <WorkspaceHeader
            currentViewLabel={currentViewLabel}
            currentUser={currentUser}
            allUsers={allUsers}
            onSwitchUser={onSwitchUser}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onBackToPublic={onBackToPublic}
          />

          {/* Mobile & Tablet Navigation Drawer (Sheet Primitive from UI-1) */}
          <Sheet
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            side="left"
            title="Griya Asih Lawang"
            description="PMKI Mupel Jawa Timur"
            className="w-72 max-w-[85vw] p-0"
            footer={
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-medium text-secondary-foreground">
                    Tema Tampilan
                  </span>
                  <ThemePicker />
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  leftIcon={<Icon icon={ArrowLeft} size="sm" />}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onBackToPublic();
                  }}
                >
                  Kembali ke Website Publik
                </Button>
              </div>
            }
          >
            <div className="-mx-6 -my-6">
              <SidebarNavigation
                groups={navGroups}
                currentView={currentView}
                currentUser={currentUser}
                onSelectView={onSelectView}
                onItemSelect={() => setMobileMenuOpen(false)}
                touchComfortable
              />
            </div>
          </Sheet>

          {/* Flexible Workspace Canvas */}
          <main id="workspace-main" className="flex-1 py-6 sm:py-8">
            <PageContainer width={contentWidth}>{children}</PageContainer>
          </main>
        </div>
      </div>
    </div>
  );
};

