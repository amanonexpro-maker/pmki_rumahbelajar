"use client";

import * as React from "react";
import Image from "next/image";
import { ICON_MAP } from "@/config/icons";

export interface LightboxPhoto {
  url: string;
  caption?: string;
}

export interface LightboxAlbum {
  title: string;
  date: string;
  count: number;
  photos: LightboxPhoto[];
}

export interface KabarAlbumLightboxProps {
  open: boolean;
  onClose: () => void;
  album: LightboxAlbum | null;
}

/**
 * KabarAlbumLightbox (Fase 14 Step 7, UI-UX §15, §30).
 * Modal imersif fullscreen di mobile (<md) & dialog terpusat di desktop (>=md).
 * - Menghormati privasi anak: hanya menampilkan media yang telah terverifikasi consent di level server.
 * - Navigasi keyboard (ArrowLeft/ArrowRight/Escape), swipe/button prev-next, dan indikator posisi X/N.
 * - Tombol share WhatsApp keluarga, caption per foto, focus trap, dan body scroll lock.
 */
export function KabarAlbumLightbox({
  open,
  onClose,
  album,
}: KabarAlbumLightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<Element | null>(null);

  const CloseIcon = ICON_MAP.tutup;
  const photos = album?.photos ?? [];
  const currentPhoto = photos[currentIndex];
  const totalPhotos = photos.length;

  // Simpan trigger element saat modal dibuka
  React.useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
    }
  }, [open]);

  // Handle ESC, Arrow Keys & Body Scroll Lock
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
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1));
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentIndex((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0));
        return;
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Initial focus on close button
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const closeBtn = modalRef.current.querySelector<HTMLElement>(
          'button[aria-label="Tutup"]'
        );
        closeBtn?.focus();
      }
    }, 50);

    return () => {
      document.documentElement.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);

      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [open, onClose, totalPhotos]);

  if (!open || !album || totalPhotos === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0));
  };

  // Pesan WhatsApp ramah keluarga
  const waShareText = encodeURIComponent(
    `Lihat dokumentasi "${album.title}" dari Rumah Belajar Griya Asih: ${currentPhoto?.url ?? ""}`
  );
  const waShareUrl = `https://wa.me/?text=${waShareText}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-album-title"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col justify-between rounded-card bg-neutral-950/80 border border-neutral-800 text-white overflow-hidden shadow-2xl"
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-800 bg-neutral-950/60 shrink-0">
          <div className="min-w-0 pr-3">
            <h2
              id="lightbox-album-title"
              className="text-xs sm:text-sm font-bold text-neutral-100 truncate"
            >
              {album.title}
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">{album.date}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Position Indicator X/N */}
            <span
              aria-live="polite"
              className="text-xs font-mono font-semibold px-2.5 py-1 rounded-pill bg-neutral-800 text-neutral-300"
            >
              {currentIndex + 1} / {totalPhotos}
            </span>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="min-w-11 min-h-11 rounded-full flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors focus-ring"
            >
              {CloseIcon && <CloseIcon aria-hidden="true" className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Center Image Display with Prev/Next Controls */}
        <div className="relative flex-1 min-h-[45vh] sm:min-h-[55vh] max-h-[65vh] flex items-center justify-center bg-black/40 overflow-hidden">
          {currentPhoto?.url && (
            <div className="relative w-full h-full aspect-video sm:aspect-auto flex items-center justify-center">
              <Image
                src={currentPhoto.url}
                alt={currentPhoto.caption ?? album.title}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-contain"
                priority
              />
            </div>
          )}

          {/* Navigation Buttons (Bila lebih dari 1 foto) */}
          {totalPhotos > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Foto sebelumnya"
                className="absolute left-2 top-1/2 -translate-y-1/2 min-w-11 min-h-11 rounded-full bg-neutral-900/70 hover:bg-neutral-900 text-white flex items-center justify-center transition-colors focus-ring border border-neutral-700"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Foto berikutnya"
                className="absolute right-2 top-1/2 -translate-y-1/2 min-w-11 min-h-11 rounded-full bg-neutral-900/70 hover:bg-neutral-900 text-white flex items-center justify-center transition-colors focus-ring border border-neutral-700"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Bottom Bar: Caption & Share Button */}
        <div className="p-3 sm:p-4 border-t border-neutral-800 bg-neutral-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <p className="text-xs sm:text-sm text-neutral-300 italic line-clamp-2 leading-relaxed">
            {currentPhoto?.caption || album.title}
          </p>

          <a
            href={waShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 rounded-control bg-success hover:bg-success/90 text-white font-semibold text-xs transition-colors focus-ring self-start sm:self-auto shrink-0 shadow-xs"
          >
            <span>Bagikan ke WhatsApp</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
