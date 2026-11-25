"use client";

import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Badge, Button, Icon } from "@/components/ui";
import type { UserPersona } from "@/lib/auth/personas";
import { cn } from "@/lib/cn";
import { ThemePicker } from "./theme-picker";

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
  personas?: readonly UserPersona[];
  items: SidebarNavItem[];
}

export interface SidebarNavigationProps {
  groups: SidebarNavGroup[];
  currentPath: string;
  userPermissions?: string[];
  userPersona?: UserPersona;
  onItemSelect?: () => void;
  touchComfortable?: boolean;
  isCollapsed?: boolean;
}

export function SidebarNavigation({
  groups,
  currentPath,
  userPermissions,
  userPersona,
  onItemSelect,
  touchComfortable = false,
  isCollapsed = false,
}: SidebarNavigationProps) {
  return (
    <nav
      aria-label="Navigasi utama workspace"
      className={cn(
        "flex-1 overflow-y-auto",
        isCollapsed ? "px-2 py-3 space-y-2 no-scrollbar" : "px-3 py-4 space-y-5"
      )}
    >
      {groups.map((group) => {
        if (
          group.personas &&
          userPersona &&
          !group.personas.includes(userPersona)
        ) {
          return null;
        }

        const visibleItems = group.items.filter((item) => {
          if (!item.requiredPermission || !userPermissions) return true;
          return userPermissions.includes(item.requiredPermission);
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={group.id} className="space-y-1">
            {group.title && !isCollapsed && (
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
                      aria-label={isCollapsed ? item.label : undefined}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center rounded-control text-left transition-colors focus-ring",
                        isCollapsed
                          ? "h-10 w-10 mx-auto justify-center px-0"
                          : "w-full justify-between gap-2.5 px-3",
                        !isCollapsed &&
                          (touchComfortable
                            ? "min-h-11 py-2.5 text-sm"
                            : "min-h-10 py-2 text-[13px]"),
                        isActive
                          ? "bg-primary-soft/80 text-foreground font-semibold"
                          : "text-secondary-foreground hover:bg-surface-subtle hover:text-foreground font-medium"
                      )}
                    >
                      {isActive && !isCollapsed && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-2 bottom-2 w-1 rounded-r-pill bg-primary"
                        />
                      )}

                      <span
                        className={cn(
                          "flex items-center min-w-0",
                          !isCollapsed && "gap-2.5"
                        )}
                      >
                        <Icon
                          icon={item.icon}
                          size="sm"
                          strokeWidth={isActive ? 2.15 : 1.75}
                          className={cn(
                            "transition-colors shrink-0",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </span>

                      {!isCollapsed && item.badge !== undefined && (
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
  userPersona?: UserPersona;
  serviceUnitName?: string;
  organizationName?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  footerActionSlot?: React.ReactNode;
  collapsedFooterActionSlot?: React.ReactNode;
}

export function Sidebar({
  groups,
  currentPath,
  userPermissions,
  userPersona,
  serviceUnitName = "Griya Asih Lawang",
  organizationName = "PMKI Mupel Jawa Timur",
  isCollapsed = false,
  onToggle,
  footerActionSlot,
  collapsedFooterActionSlot,
}: SidebarProps) {
  return (
    <aside
      aria-label="Navigasi samping"
      className={cn(
        "hidden md:flex md:shrink-0 md:flex-col bg-surface border-r border-border sticky top-0 h-screen transition-[width] duration-200 ease-in-out",
        isCollapsed ? "md:w-16" : "md:w-64"
      )}
    >
      <div
        className={cn(
          "h-16 border-b border-border flex items-center shrink-0",
          isCollapsed ? "justify-center px-2" : "justify-between px-4 gap-2"
        )}
      >
        {isCollapsed && onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={false}
            aria-label="Perluas menu samping"
            title="Perluas menu samping"
            className="group h-10 w-10 rounded-control bg-surface border border-border-subtle hover:border-primary/40 hover:bg-primary-soft/50 flex items-center justify-center shrink-0 overflow-hidden transition-colors duration-150 cursor-pointer focus-ring"
          >
            <picture className="flex items-center justify-center group-hover:hidden">
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
            <Icon
              icon={PanelLeftOpen}
              size="sm"
              className="hidden group-hover:block text-primary"
            />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
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

            {onToggle && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggle}
                aria-expanded={true}
                aria-label="Ciutkan menu samping"
                title="Ciutkan menu samping"
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              >
                <Icon icon={PanelLeftClose} size="sm" />
              </Button>
            )}
          </>
        )}
      </div>

      <SidebarNavigation
        groups={groups}
        currentPath={currentPath}
        userPermissions={userPermissions}
        userPersona={userPersona}
        isCollapsed={isCollapsed}
      />

      <div
        className={cn(
          "border-t border-border shrink-0",
          isCollapsed ? "p-2 space-y-1.5" : "p-3 space-y-2.5"
        )}
      >
        {isCollapsed ? (
          <>
            <div className="flex justify-center">
              <ThemePicker compact />
            </div>
            {(collapsedFooterActionSlot ?? footerActionSlot) && (
              <div className="flex justify-center">
                {collapsedFooterActionSlot ?? footerActionSlot}
              </div>
            )}
            <div className="flex justify-center">
              <Button
                asChild
                variant="secondary"
                size="icon"
                className="h-10 w-10 sm:h-10 sm:w-10 text-secondary-foreground hover:text-foreground"
              >
                <Link
                  href="/"
                  aria-label="Halaman publik"
                  title="Halaman publik"
                >
                  <Icon icon={ArrowLeft} size="sm" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <ThemePicker />
              {footerActionSlot}
            </div>
            <Button
              asChild
              variant="secondary"
              size="sm"
              fullWidth
              className="justify-start whitespace-nowrap"
            >
              <Link href="/">
                <Icon icon={ArrowLeft} size="xs" />
                <span>Halaman publik</span>
              </Link>
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}

