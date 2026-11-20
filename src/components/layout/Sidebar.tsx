import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, BookOpen, Lock } from 'lucide-react';
import { can } from '../../permissions/can.ts';
import { Permission, User } from '../../types/index.ts';
import { Badge, Button, Icon } from '../ui/index.ts';
import { cn } from '../../utils/cn.ts';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  requiredPermission?: Permission;
}

export interface SidebarNavGroup {
  id: string;
  title?: string;
  items: SidebarNavItem[];
}

export interface SidebarNavigationProps {
  groups: SidebarNavGroup[];
  currentView: string;
  currentUser: User;
  onSelectView: (viewId: string) => void;
  onItemSelect?: () => void;
  touchComfortable?: boolean;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  groups,
  currentView,
  currentUser,
  onSelectView,
  onItemSelect,
  touchComfortable = false,
}) => {
  return (
    <nav
      aria-label="Navigasi utama workspace"
      className="flex-1 px-3 py-4 space-y-5 overflow-y-auto"
    >
      {groups.map((group) => (
        <div key={group.id} className="space-y-1">
          {group.title && (
            <p className="px-3 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
              {group.title}
            </p>
          )}
          <ul className="space-y-0.5" role="list">
            {group.items.map((item) => {
              const isActive = currentView === item.id;
              const hasPermission = item.requiredPermission
                ? can(currentUser, item.requiredPermission)
                : true;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectView(item.id);
                      onItemSelect?.();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    title={
                      !hasPermission
                        ? `${item.label} (Akses terbatas untuk peran ${currentUser.role})`
                        : undefined
                    }
                    className={cn(
                      'group relative w-full flex items-center justify-between gap-2.5 px-3 rounded-control text-left transition-colors cursor-pointer focus-ring',
                      touchComfortable ? 'min-h-11 py-2.5 text-sm' : 'min-h-9 py-2 text-[13px]',
                      isActive
                        ? 'bg-primary-soft/80 text-foreground font-semibold'
                        : hasPermission
                        ? 'text-secondary-foreground hover:bg-surface-subtle hover:text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-surface-subtle hover:text-secondary-foreground font-normal'
                    )}
                  >
                    {/* Non-color active structural indicator (Section 4) */}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-pill bg-primary"
                      />
                    )}

                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        icon={item.icon}
                        size="sm"
                        strokeWidth={isActive ? 2.15 : 1.75}
                        className={cn(
                          'transition-colors',
                          isActive
                            ? 'text-primary'
                            : hasPermission
                            ? 'text-muted-foreground group-hover:text-foreground'
                            : 'text-muted-foreground/70'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>

                    <span className="flex items-center gap-1.5 shrink-0">
                      {!hasPermission && (
                        <Icon
                          icon={Lock}
                          size="xs"
                          label="Akses terbatas"
                          className="text-muted-foreground/80"
                        />
                      )}
                      {item.badge !== undefined && (
                        <Badge
                          variant={isActive ? 'primary' : 'neutral'}
                          size="sm"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export interface SidebarProps {
  groups: SidebarNavGroup[];
  currentView: string;
  currentUser: User;
  onSelectView: (viewId: string) => void;
  onBackToPublic: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  groups,
  currentView,
  currentUser,
  onSelectView,
  onBackToPublic,
}) => {
  return (
    <aside
      aria-label="Bilah sisi workspace"
      className="hidden lg:flex lg:flex-col w-64 bg-surface border-r border-border shrink-0 sticky top-0 h-screen select-none"
    >
      {/* Brand / Service Unit Context */}
      <div className="px-4 h-16 border-b border-border flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-control bg-primary-soft text-primary border border-primary/15 flex items-center justify-center shrink-0">
          <Icon icon={BookOpen} size="md" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-foreground truncate leading-tight">
            Griya Asih Lawang
          </h2>
          <p className="text-[11px] text-secondary-foreground truncate">
            PMKI Mupel Jawa Timur
          </p>
        </div>
      </div>

      {/* Grouped Navigation */}
      <SidebarNavigation
        groups={groups}
        currentView={currentView}
        currentUser={currentUser}
        onSelectView={onSelectView}
      />

      {/* Calm Footer Orientation Action */}
      <div className="p-3 border-t border-border shrink-0">
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          leftIcon={<Icon icon={ArrowLeft} size="xs" />}
          onClick={onBackToPublic}
          className="justify-start text-secondary-foreground hover:text-foreground"
        >
          Kembali ke Website Publik
        </Button>
      </div>
    </aside>
  );
};

