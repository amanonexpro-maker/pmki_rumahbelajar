"use client";

import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { Badge, Button, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface SidebarNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  requiredPermission?: string;
}

export interface SidebarNavGroup {
  id: string;
  title?: string;
  items: SidebarNavItem[];
}

export interface SidebarNavigationProps {
  groups: SidebarNavGroup[];
  currentPath: string;
  userPermissions?: string[];
  onItemSelect?: () => void;
  touchComfortable?: boolean;
}

export function SidebarNavigation({
  groups,
  currentPath,
  userPermissions,
  onItemSelect,
  touchComfortable = false,
}: SidebarNavigationProps) {
  return (
    <nav
      aria-label="Navigasi utama workspace"
      className="flex-1 px-3 py-4 space-y-5 overflow-y-auto"
    >
      {groups.map((group) => {
        const visibleItems = group.items.filter((item) => {
          if (!item.requiredPermission || !userPermissions) return true;
          return userPermissions.includes(item.requiredPermission);
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={group.id} className="space-y-1">
            {group.title && (
              <p className="px-3 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5" role="list">
              {visibleItems.map((item) => {
                const isActive =
                  currentPath === item.href ||
                  (item.href !== "/workspace" &&
                    currentPath.startsWith(`${item.href}/`));

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onItemSelect}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative w-full flex items-center justify-between gap-2.5 px-3 rounded-control text-left transition-colors focus-ring",
                        touchComfortable
                          ? "min-h-11 py-2.5 text-sm"
                          : "min-h-10 py-2 text-[13px]",
                        isActive
                          ? "bg-primary-soft/80 text-foreground font-semibold"
                          : "text-secondary-foreground hover:bg-surface-subtle hover:text-foreground font-medium"
                      )}
                    >
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
                            "transition-colors",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>

                      {item.badge !== undefined && (
                        <Badge
                          variant={isActive ? "primary" : "neutral"}
                          size="sm"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export interface SidebarProps {
  groups: SidebarNavGroup[];
  currentPath: string;
  userPermissions?: string[];
  serviceUnitName?: string;
  organizationName?: string;
}

export function Sidebar({
  groups,
  currentPath,
  userPermissions,
  serviceUnitName = "Griya Asih Lawang",
  organizationName = "PMKI Mupel Jawa Timur",
}: SidebarProps) {
  return (
    <aside
      aria-label="Navigasi samping"
      className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col bg-surface border-r border-border sticky top-0 h-screen"
    >
      <div className="h-16 px-4 border-b border-border flex items-center gap-3 shrink-0">
        <div className="h-9 w-9 rounded-control bg-surface border border-border-subtle flex items-center justify-center shrink-0 overflow-hidden">
          <picture className="flex items-center justify-center">
            <source srcSet="/pmki_app_icon.svg" type="image/svg+xml" />
            <img
              src="/pmki_app_icon.png"
              alt="App Icon PMKI - Rumah Belajar Griya Asih Lawang"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              loading="eager"
            />
          </picture>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate leading-tight">
            {serviceUnitName}
          </p>
          <p className="text-[11px] font-medium text-secondary-foreground truncate">
            {organizationName}
          </p>
        </div>
      </div>

      <SidebarNavigation
        groups={groups}
        currentPath={currentPath}
        userPermissions={userPermissions}
      />

      <div className="p-3 border-t border-border shrink-0">
        <Button
          asChild
          variant="ghost"
          size="sm"
          fullWidth
          className="justify-start text-secondary-foreground hover:text-foreground"
        >
          <Link href="/">
            <Icon icon={ArrowLeft} size="xs" />
            <span>Kembali ke website publik</span>
          </Link>
        </Button>
      </div>
    </aside>
  );
}

