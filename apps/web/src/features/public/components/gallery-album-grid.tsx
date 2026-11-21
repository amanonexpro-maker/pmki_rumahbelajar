"use client";

import * as React from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { EnhancedPhotoLightbox } from "./enhanced-photo-lightbox";
import type { GalleryPhoto } from "../types/public-types";

export interface GalleryAlbumGridProps {
  photos: GalleryPhoto[];
  albumTitle: string;
}

/**
 * GalleryAlbumGrid (FASE 14 Hotfix Lanjutan).
 * Grid foto responsif untuk Halaman Detail Galeri.
 * - Desktop: 3 kolom (lg:grid-cols-3).
 * - Tablet: 2 kolom (sm:grid-cols-2).
 * - Mobile: 1 kolom (grid-cols-1) aspect-square imersif.
 * - Klik pada kartu foto membuka EnhancedPhotoLightbox (Light Theme & Swipe Native).
 */
export function GalleryAlbumGrid({ photos, albumTitle }: GalleryAlbumGridProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState<boolean>(false);

  const handleOpenPhoto = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsLightboxOpen(true);
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="p-8 text-center rounded-card bg-surface border border-border text-xs text-muted-foreground">
        Belum ada foto dalam album dokumentasi ini.
      </div>
    );
  }

  return (
    <>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6"
        role="region"
        aria-label={`Galeri foto ${albumTitle}`}
      >
        {photos.map((photo, index) => (
          <div
            key={`${photo.url}-${index}`}
            role="button"
            tabIndex={0}
            aria-label={`Buka foto ${index + 1} dari ${photos.length}: ${photo.caption || albumTitle}`}
            onClick={() => handleOpenPhoto(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOpenPhoto(index);
              }
            }}
            className="group relative aspect-square rounded-card overflow-hidden border border-border bg-surface-subtle shadow-xs cursor-pointer focus-ring transition-transform hover:-translate-y-0.5"
          >
            <Image
              src={photo.url}
              alt={photo.caption || `${albumTitle} - Foto ${index + 1}`}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Expand Icon Badge */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/85 backdrop-blur-xs border border-border text-secondary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-70 transition-opacity">
              <Maximize2 aria-hidden="true" className="w-4 h-4 shrink-0 text-foreground" />
            </div>

            {/* Hover Caption Overlay (Gradient untuk kontras teks) */}
            {photo.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3 pt-6 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="line-clamp-2 leading-relaxed font-sans font-medium">
                  {photo.caption}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal (Light Theme & Swipe) */}
      <EnhancedPhotoLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        photos={photos}
        initialIndex={selectedPhotoIndex}
        albumTitle={albumTitle}
      />
    </>
  );
}

