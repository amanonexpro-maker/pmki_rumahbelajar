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
  /**
   * Satu sumber markup form; dirender di dalam DUA wadah.
   * Dapat berupa render factory function `(formId: string) => ReactNode` agar elemen `<form id={formId}>`
   * memiliki id unik terisolasi per wadah dan tidak terduplikasi di DOM (R1/R2).
   */
  children: React.ReactNode | ((formId: string) => React.ReactNode);
  /**
   * Footer (Batal + submit); opsional.
   * Dapat berupa render factory function `(formId: string, isMobile: boolean) => ReactNode`
   * agar tombol submit menargetkan formId wadah aktif dan tombol aksi mobile mendukung fullWidth (R1/R5).
   */
  footer?:
    | React.ReactNode
    | ((formId: string, isMobile: boolean) => React.ReactNode);
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
 * - Menghasilkan ID form unik via React.useId() untuk masing-masing wadah (desktop vs mobile)
 *   untuk mencegah tabrakan id DOM dan menjaga asosiasi button form={formId} tetap presisi.
 */
const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

function subscribeDesktopMedia(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(DESKTOP_MEDIA_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getDesktopSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function getDesktopServerSnapshot(): boolean {
  return true;
}

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
  const dialogFormId = React.useId();
  const sheetFormId = React.useId();
  const isDesktop = React.useSyncExternalStore(
    subscribeDesktopMedia,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  );

  const renderChildren = (formId: string) =>
    typeof children === "function" ? children(formId) : children;

  const renderFooter = (formId: string, isMobile: boolean) =>
    typeof footer === "function" ? footer(formId, isMobile) : footer;

  return (
    <>
      {/* Desktop Dialog (>= 768px) */}
      <Dialog open={open && isDesktop} onOpenChange={onOpenChange}>
        <DialogContent
          overlayClassName="hidden md:block"
          className={cn("hidden md:flex", dialogClassName)}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <DialogBody className={bodyClassName}>
            {renderChildren(dialogFormId)}
          </DialogBody>
          {footer && (
            <DialogFooter>{renderFooter(dialogFormId, false)}</DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Sheet (< 768px) */}
      <Sheet open={open && !isDesktop} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          overlayClassName="md:hidden"
          className="md:hidden"
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <SheetBody className={bodyClassName}>
            {renderChildren(sheetFormId)}
          </SheetBody>
          {footer && (
            <SheetFooter>{renderFooter(sheetFormId, true)}</SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
