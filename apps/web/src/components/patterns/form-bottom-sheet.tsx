"use client";

import * as React from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export interface FormBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Wajib: dipakai SheetTitle / DialogTitle (a11y). */
  title: React.ReactNode;
  /** Disarankan: SheetDescription / DialogDescription; bila kosong, jangan render deskripsi kosong. */
  description?: React.ReactNode;
  /** Satu sumber markup form; dirender di dalam DUA wadah. */
  children: React.ReactNode;
  /** Footer (Batal + submit); opsional. */
  footer?: React.ReactNode;
  /** Kelas tambahan DialogContent desktop (mis. "max-w-2xl"). */
  dialogClassName?: string;
  /** Padding SheetBody; pakai "p-0" untuk konten ber-scroll sendiri (wizard). */
  bodyClassName?: string;
}

/**
 * FormBottomSheet (Fase 19 Step 2 - P2, W4, UI-UX §30–31).
 * - Menghadirkan form responsif dua wadah: Dialog centered di desktop (>= 768px)
 *   dan Sheet bottom dengan grabber di mobile (< 768px).
 * - Tidak memakai hook JS useMediaQuery agar SSR-safe dan bebas hydration mismatch.
 * - Wadah desktop memakai kelas `hidden md:block`.
 * - Wadah mobile memakai kelas `md:hidden` dengan `side="bottom"`.
 */
export function FormBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dialogClassName,
  bodyClassName,
}: FormBottomSheetProps) {
  return (
    <>
      {/* Desktop Dialog (>= 768px) */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("hidden md:block", dialogClassName)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <DialogBody className={bodyClassName}>{children}</DialogBody>
          {footer && <DialogFooter>{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Sheet (< 768px) */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="md:hidden">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <SheetBody className={bodyClassName}>{children}</SheetBody>
          {footer && <SheetFooter>{footer}</SheetFooter>}
        </SheetContent>
      </Sheet>
    </>
  );
}

