"use client";

import { cn } from "@/lib/cn";
import type { MediaAssetDTO } from "../types/media-types";
import {
  MediaCardActions,
  MediaStatusBadges,
  MediaThumbnailOverlay,
} from "./media-card-parts";

export interface MediaCardProps {
  asset: MediaAssetDTO;
  isFocused: boolean;
  isOwnUpload: boolean;
  canReview: boolean;
  cardError?: string;
  reviewPending: boolean;
  priority?: boolean;
  onFocus: (assetId: string) => void;
  onQuickApprove: (asset: MediaAssetDTO) => void;
  onReview: (asset: MediaAssetDTO) => void;
}

export function MediaCard({
  asset,
  isFocused,
  isOwnUpload,
  canReview,
  cardError,
  reviewPending,
  priority = false,
  onFocus,
  onQuickApprove,
  onReview,
}: MediaCardProps) {
  return (
    <article
      id={`media-card-${asset.id}`}
      tabIndex={0}
      onFocus={() => onFocus(asset.id)}
      style={{ contentVisibility: "auto", containIntrinsicSize: "360px" }}
      className={cn(
        "rounded-card border p-4 sm:p-5 space-y-4 flex flex-col justify-between transition-colors duration-200 outline-hidden focus-ring",
        isOwnUpload
          ? "border-border/70 bg-surface-subtle/80 opacity-80"
          : "border-border bg-surface",
        isFocused && !isOwnUpload && "ring-2 ring-primary border-primary"
      )}
    >
      <div className="space-y-3">
        <MediaStatusBadges
          categoryLabel={asset.categoryLabel}
          isOwnUpload={isOwnUpload}
          privacyReviewed={asset.privacyReviewed}
          eligibleForPublic={asset.eligibleForPublic}
        />

        <MediaThumbnailOverlay
          signedReadUrl={asset.signedReadUrl}
          title={asset.title}
          isOwnUpload={isOwnUpload}
          priority={priority}
        />

        <div>
          <h2 className="text-base font-semibold text-foreground">
            {asset.title}
          </h2>
          {asset.description && (
            <p className="text-xs text-secondary-foreground leading-relaxed mt-1">
              {asset.description}
            </p>
          )}
        </div>
      </div>

      {/* Inline Error and Retry Logic */}
      {cardError && (
        <div
          role="alert"
          className="rounded-control border border-danger/30 bg-danger-soft p-2.5 text-xs text-danger flex items-center justify-between gap-2"
        >
          <span>{cardError}</span>
          <button
            type="button"
            onClick={() => onQuickApprove(asset)}
            className="font-semibold underline hover:text-danger/80 transition-colors duration-200 shrink-0"
          >
            Coba lagi
          </button>
        </div>
      )}

      <MediaCardActions
        asset={asset}
        isOwnUpload={isOwnUpload}
        canReview={canReview}
        reviewPending={reviewPending}
        onQuickApprove={onQuickApprove}
        onReview={onReview}
      />
    </article>
  );
}
