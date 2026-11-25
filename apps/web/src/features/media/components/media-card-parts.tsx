"use client";

import Image from "next/image";
import { Badge, Button, Icon } from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { cn } from "@/lib/cn";
import type { MediaAssetDTO } from "../types/media-types";

export interface MediaStatusBadgesProps {
  categoryLabel: string;
  isOwnUpload: boolean;
  privacyReviewed: boolean;
  eligibleForPublic: boolean;
}

export function MediaStatusBadges({
  categoryLabel,
  isOwnUpload,
  privacyReviewed,
  eligibleForPublic,
}: MediaStatusBadgesProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Badge variant="neutral" size="sm">
        {categoryLabel}
      </Badge>

      {isOwnUpload ? (
        <Badge
          variant="neutral"
          size="sm"
          className="inline-flex items-center gap-1 bg-surface border border-border text-muted-foreground"
        >
          <ICON_MAP.lock
            className="w-3 h-3 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
          <span>Menunggu peninjau lain (SoD)</span>
        </Badge>
      ) : !privacyReviewed ? (
        <Badge variant="warning" size="sm">
          Menunggu tinjauan privasi
        </Badge>
      ) : eligibleForPublic ? (
        <Badge variant="success" size="sm">
          <Icon icon={ICON_MAP.checkCircle} size="xs" />
          <span>Layak tayang di publik</span>
        </Badge>
      ) : (
        <Badge variant="info" size="sm">
          <Icon icon={ICON_MAP.lock} size="xs" />
          <span>Hanya arsip internal</span>
        </Badge>
      )}
    </div>
  );
}

export interface MediaThumbnailOverlayProps {
  signedReadUrl: string | null;
  title: string;
  isOwnUpload: boolean;
  priority: boolean;
}

export function MediaThumbnailOverlay({
  signedReadUrl,
  title,
  isOwnUpload,
  priority,
}: MediaThumbnailOverlayProps) {
  return (
    <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] bg-surface-subtle rounded-control overflow-hidden border border-border flex items-center justify-center">
      {signedReadUrl ? (
        <Image
          src={signedReadUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          className={cn(
            "object-cover transition-transform duration-200",
            isOwnUpload && "grayscale-[35%]"
          )}
        />
      ) : (
        <ICON_MAP.image
          className="w-10 h-10 text-muted-foreground"
          aria-hidden="true"
        />
      )}

      {/* SoD Lock Visual Overlay */}
      {isOwnUpload && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-xs flex items-center justify-center p-3 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/95 border border-border shadow-xs text-xs font-semibold text-secondary-foreground">
            <ICON_MAP.lock
              className="w-3.5 h-3.5 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
            <span>Terkunci: Pemilik Unggahan (SoD)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export interface MediaCardActionsProps {
  asset: MediaAssetDTO;
  isOwnUpload: boolean;
  canReview: boolean;
  reviewPending: boolean;
  onQuickApprove: (asset: MediaAssetDTO) => void;
  onReview: (asset: MediaAssetDTO) => void;
}

export function MediaCardActions({
  asset,
  isOwnUpload,
  canReview,
  reviewPending,
  onQuickApprove,
  onReview,
}: MediaCardActionsProps) {
  return (
    <div className="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground font-mono">
        Bucket privat · TTL {asset.signedUrlTtlSeconds ?? 3600}d
      </span>

      {canReview && (
        <div className="flex items-center gap-2">
          {isOwnUpload ? (
            <span
              className="text-xs text-muted-foreground italic text-right"
              title="Pemisahan tugas: Anda tidak dapat menyetujui unggahan Anda sendiri demi integritas data."
            >
              Anda adalah pengunggah (SoD)
            </span>
          ) : (
            <>
              {!asset.privacyReviewed && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={reviewPending}
                  onClick={() => onQuickApprove(asset)}
                  leftIcon={<Icon icon={ICON_MAP.checkCircle} size="xs" />}
                >
                  Setujui publik
                </Button>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={reviewPending}
                onClick={() => onReview(asset)}
                leftIcon={<Icon icon={ICON_MAP.shieldCheck} size="xs" />}
              >
                Tinjau detail
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

