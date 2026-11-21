"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ICON_MAP } from "@/config/icons";
import type { GalleryPhoto } from "../types/public-types";

export interface EnhancedPhotoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  photos: GalleryPhoto[];
  initialIndex?: number;
  albumTitle?: string;
}

/**
 * EnhancedPhotoLightbox (FASE 14 Hotfix Lanjutan, Design Identity §9, UI-UX §15, §30).
 * Lightbox modal bertema TERANG (Light / Warm & Human):
 * - Menggunakan token --background/--surface/--foreground (bukan dark/black).
 * - Native touch swipe gesture (zero-dep) untuk navigasi halus di mobile.
 * - Tombol panah Prev/Next (desktop only, hidden on mobile).
 * - Indikator posisi X/N, caption per-foto, ESC key listener, focus trap, dan body scroll lock.
 */
export function EnhancedPhotoLightbox({
  isOpen,
  onClose,
  photos,
  initialIndex = 0,
  albumTitle = "Dokumentasi Kegiatan",
}: EnhancedPhotoLightboxProps) {
  const totalPhotos = photos.length;
  const [currentIndex, setCurrentIndex] = React.useState<number>(initialIndex);
  const [prevInitialIndex, setPrevInitialIndex] = React.useState<number>(initialIndex);

  // Sync initialIndex when changed (React adjusting state during render pattern)
  if (prevInitialIndex !== initialIndex) {
    setPrevInitialIndex(initialIndex);
    setCurrentIndex(Math.max(0, Math.min(initialIndex, totalPhotos - 1)));
  }

  const modalRef = React.useRef<HTMLDivElement | null>(null);

  // Touch swipe states
  const touchStartXRef = React.useRef<number | null>(null);
  const touchEndXRef = React.useRef<number | null>(null);

  const currentPhoto = photos[currentIndex];

  const handlePrev = React.useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1));
  }, [totalPhotos]);

  const handleNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0));
  }, [totalPhotos]);

  // Touch event handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const deltaX = touchStartXRef.current - touchEndXRef.current;
    const swipeThreshold = 45; // 45px swipe distance

    if (deltaX > swipeThreshold) {
      // Swiped left -> Next photo
      handleNext();
    } else if (deltaX < -swipeThreshold) {
      // Swiped right -> Previous photo
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Keyboard navigation & body scroll lock
  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Focus modal container on mount
    modalRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || totalPhotos === 0 || !currentPhoto) {
    return null;
  }

  const CloseIcon = ICON_MAP.tutup ?? X;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={albumTitle}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80 p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        // Tap outside panel to close
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col justify-between rounded-card bg-surface border border-border text-foreground overflow-hidden shadow-overlay focus:outline-hidden"
      >
        {/* Top Control Bar (Clean & Warm Light Theme) */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-surface-subtle shrink-0">
          <div className="min-w-0 pr-3">
            <h2 className="text-xs sm:text-sm font-bold text-foreground truncate">
              {albumTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Position Indicator X/N */}
            <span
              aria-live="polite"
              className="text-xs font-mono font-semibold px-2.5 py-1 rounded-pill bg-surface border border-border text-muted-foreground"
            >
              {currentIndex + 1} / {totalPhotos}
            </span>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau foto"
              className="min-w-11 min-h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-surface transition-colors focus-ring cursor-pointer"
            >
              <CloseIcon aria-hidden="true" className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Center Image Display with Swipe Listener */}
        <div
          className="relative flex-1 min-h-[45vh] sm:min-h-[55vh] flex items-center justify-center bg-surface-subtle border-y border-border-subtle overflow-hidden select-none touch-pan-y p-2 sm:p-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {currentPhoto.url && (
            <div className="relative w-full max-w-[min(100%,calc(60vh*4/5))] aspect-[4/5] bg-surface-subtle rounded-lg overflow-hidden flex items-center justify-center border border-border-subtle shadow-inner mx-auto">
              <Image
                key={currentPhoto.url}
                src={currentPhoto.url}
                alt={currentPhoto.caption || `${albumTitle} - Foto ${currentIndex + 1}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 600px"
                className="max-w-full max-h-full object-contain transition-opacity duration-200"
              />
            </div>
          )}

          {/* Desktop Left Button (Hidden on Mobile) */}
          {totalPhotos > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Foto sebelumnya"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 min-w-11 min-h-11 rounded-full items-center justify-center bg-surface/90 hover:bg-surface text-secondary-foreground hover:text-primary border border-border shadow-xs transition-colors focus-ring cursor-pointer z-10"
            >
              <ChevronLeft aria-hidden="true" className="w-6 h-6 shrink-0" />
            </button>
          )}

          {/* Desktop Right Button (Hidden on Mobile) */}
          {totalPhotos > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Foto selanjutnya"
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 min-w-11 min-h-11 rounded-full items-center justify-center bg-surface/90 hover:bg-surface text-secondary-foreground hover:text-primary border border-border shadow-xs transition-colors focus-ring cursor-pointer z-10"
            >
              <ChevronRight aria-hidden="true" className="w-6 h-6 shrink-0" />
            </button>
          )}

          {/* Mobile Swipe Hint Indicator */}
          <div className="sm:hidden absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-pill bg-surface/80 border border-border text-[10px] text-muted-foreground pointer-events-none z-10">
            Geser untuk navigasi foto
          </div>
        </div>

        {/* Bottom Caption Bar */}
        <div className="p-3 sm:p-4 bg-surface-subtle shrink-0 text-center border-t border-border-subtle">
          <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed max-w-2xl mx-auto">
            {currentPhoto.caption || "Dokumentasi kegiatan belajar bersama di Rumah Belajar Griya Asih Lawang."}
          </p>
        </div>
      </div>
    </div>
  );
}
