"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { Avatar, Button, Icon } from "@/components/ui";
import { ConnectivityIndicator } from "@/hooks/use-connectivity";
import { ThemePicker } from "./theme-picker";

export interface WorkspaceHeaderUser {
  name: string;
  roleLabel: string;
  avatarUrl?: string | null;
}

export interface WorkspaceHeaderProps {
  currentViewLabel: string;
  serviceUnitName?: string;
  academicYearLabel?: string;
  user?: WorkspaceHeaderUser;
  onOpenMobileMenu: () => void;
  rightSlot?: React.ReactNode;
}

export function WorkspaceHeader({
  currentViewLabel,
  serviceUnitName = "Rumah Belajar Griya Asih Lawang",
  academicYearLabel = "TA 2026/2027",
  user,
  onOpenMobileMenu,
  rightSlot,
}: WorkspaceHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/95 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Buka menu navigasi"
          onClick={onOpenMobileMenu}
          className="md:hidden h-11 w-11 shrink-0"
        >
          <Icon icon={Menu} size="md" />
        </Button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-secondary-foreground">
            <span className="truncate font-medium">{serviceUnitName}</span>
            <span
              aria-hidden="true"
              className="hidden sm:inline text-muted-foreground"
            >
              ·
            </span>
            <span className="hidden sm:inline text-muted-foreground">
              {academicYearLabel}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground truncate">
            {currentViewLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <ConnectivityIndicator />

        <div className="hidden md:flex items-center">
          <ThemePicker />
        </div>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="hidden xl:inline-flex"
        >
          <Link href="/">
            <Icon icon={ArrowLeft} size="xs" />
            <span>Website publik</span>
          </Link>
        </Button>

        {rightSlot}

        {user && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-border">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <div className="hidden sm:block text-left leading-tight min-w-0">
              <p className="text-xs font-semibold text-foreground truncate max-w-36">
                {user.name}
              </p>
              <p className="text-[11px] font-medium text-primary truncate max-w-36">
                {user.roleLabel}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

