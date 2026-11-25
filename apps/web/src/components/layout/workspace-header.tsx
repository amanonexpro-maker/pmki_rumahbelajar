"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import { ConnectivityIndicator } from "@/hooks/use-connectivity";

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
}

export function WorkspaceHeader({
  currentViewLabel,
  serviceUnitName = "Rumah Belajar Griya Asih",
  academicYearLabel = "TA 2026/2027",
  user,
}: WorkspaceHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/95 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile (< md): PMKI brand logo matching public navbar */}
        <Link
          href="/workspace"
          aria-label="Beranda Workspace PMKI"
          className="md:hidden h-9 w-9 rounded-control bg-surface border border-border-subtle flex items-center justify-center shrink-0 overflow-hidden focus-ring"
        >
          <picture className="flex items-center justify-center">
            <source srcSet="/pmki_app_icon.svg" type="image/svg+xml" />
            <img
              src="/pmki_app_icon.png"
              alt="Logo PMKI - Rumah Belajar Griya Asih Lawang"
              width={32}
              height={32}
              className="h-7 w-7 object-contain"
              loading="eager"
            />
          </picture>
        </Link>

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

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ConnectivityIndicator />

        {user && (
          <div className="flex items-center gap-2.5 md:pl-3 md:border-l md:border-border">
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

