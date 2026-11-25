"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Button,
  Icon,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";
import type { UserPersona } from "@/lib/auth/personas";
import { SidebarNavigation, type SidebarNavGroup } from "./sidebar";
import { ThemePicker } from "./theme-picker";

export interface MobileNavigationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: SidebarNavGroup[];
  currentPath: string;
  userPermissions?: string[];
  userPersona?: UserPersona;
  serviceUnitName?: string;
  organizationName?: string;
  footerActionSlot?: React.ReactNode;
}

export function MobileNavigation({
  open,
  onOpenChange,
  groups,
  currentPath,
  userPermissions,
  userPersona,
  serviceUnitName = "Griya Asih Lawang",
  organizationName = "PMKI Mupel Jawa Timur",
  footerActionSlot,
}: MobileNavigationProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 max-w-[85vw] p-0">
        <SheetHeader>
          <div className="flex items-center gap-3">
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
            <div className="min-w-0 text-left">
              <SheetTitle>{serviceUnitName}</SheetTitle>
              <SheetDescription>{organizationName}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="p-0">
          <SidebarNavigation
            groups={groups}
            currentPath={currentPath}
            userPermissions={userPermissions}
            userPersona={userPersona}
            touchComfortable
            onItemSelect={() => onOpenChange(false)}
          />
        </SheetBody>

        <SheetFooter className="flex-col items-stretch gap-3">
          <div className="flex items-center justify-between gap-3">
            <ThemePicker />
            {footerActionSlot}
          </div>
          <Button asChild variant="secondary" size="md" fullWidth>
            <Link href="/" onClick={() => onOpenChange(false)}>
              <Icon icon={ArrowLeft} size="sm" />
              <span>Halaman publik</span>
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

