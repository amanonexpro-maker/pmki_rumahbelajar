"use client";

import * as React from "react";
import { ICON_MAP } from "@/config/icons";

export interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content?: string;
  gracefulMsg?: string;
}

/**
 * PrivacyPolicyModal (Fase 14 Step 4, UI-UX §28, §30).
 * Accessible modal / bottom-sheet untuk menampilkan informasi hukum & kebijakan privasi.
 * - Mobile (< md): Bottom sheet (rounded-t-card, max-h-[85vh]).
 * - Desktop (>= md): Centered dialog (rounded-card, max-w-lg).
 * - Aksesibilitas: role="dialog", aria-modal="true", focus trap, ESC to close,
 *   body scroll lock, restore focus on close, respects prefers-reduced-motion.
 * - Menggunakan ICON_MAP (anti-drift) dan semantic tokens.
 */
export function PrivacyPolicyModal({
  open,
  onClose,
  title,
  content,
  gracefulMsg = "Informasi sedang disiapkan oleh pengurus.",
}: PrivacyPolicyModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<Element | null>(null);

  const CloseIcon = ICON_MAP.tutup;
  const InfoIcon = ICON_MAP.info;

  // Simpan trigger element sebelum membuka modal untuk restore focus
  React.useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
    }
  }, [open]);

  // Handle ESC key & body scroll lock
  React.useEffect(() => {
    if (!open) return;

    const originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap (Tab cycle inside modal)
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Initial focus on modal container / close button
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const closeBtn = modalRef.current.querySelector<HTMLElement>('button[aria-label="Tutup"]');
        closeBtn?.focus();
      }
    }, 50);

    return () => {
      document.documentElement.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(focusTimer);

      // Restore focus to original trigger
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Bottom-Sheet Panel */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="relative z-10 w-full md:max-w-lg bg-surface text-foreground rounded-t-card md:rounded-card border border-border-subtle shadow-overlay p-6 max-h-[85vh] overflow-y-auto space-y-4 transition-transform duration-200 motion-reduce:transition-none"
      >
        {/* Header: Title + Close Button */}
        <div className="flex items-center justify-between gap-4 border-b border-border-subtle pb-3">
          <h2 id="legal-modal-title" className="font-sans text-lg font-bold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-ring transition-colors duration-200"
          >
            <CloseIcon aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body / Graceful Fallback */}
        <div className="pt-1">
          {content !== undefined && content.trim().length > 0 ? (
            <div className="prose prose-sm text-sm text-foreground whitespace-pre-line leading-relaxed">
              {content}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-control bg-surface-subtle border border-border-subtle">
              <InfoIcon aria-hidden="true" className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {gracefulMsg}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

