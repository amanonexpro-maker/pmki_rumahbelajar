"use client";

import * as React from "react";
import { reviewMediaAssetPrivacyAction } from "../actions/media-actions";
import type { MediaAssetDTO } from "../types/media-types";

export interface LocalMediaReviewState {
  privacyReviewed: boolean;
  eligibleForPublic: boolean;
}

export interface UseMediaSerialReviewOptions {
  assets: MediaAssetDTO[];
  currentUserId: string;
  canReview: boolean;
  reviewPending: boolean;
  setReviewPending: React.Dispatch<React.SetStateAction<boolean>>;
  isModalOpen: boolean;
  onEscapeModal: () => boolean;
  checkOnline: (onBlocked?: (message: string) => void) => boolean;
  onSuccess: () => void;
}

function focusMediaCard(assetId: string) {
  const el = document.getElementById(`media-card-${assetId}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    el.focus();
  }
}

/**
 * Manages serial media privacy review state, optimistic approval updates,
 * inline card errors, and global keyboard shortcuts (`ArrowLeft`, `ArrowRight`, `Enter`/`Space`, `Escape`).
 *
 * @param options - Asset list, user/permission flags, modal escape handler, and online/success callbacks.
 * @returns Focused asset state, optimistic/error maps, `effectiveAssets`, `handleKeyDown`, and `handleQuickApprove`.
 */
export function useMediaSerialReview({
  assets,
  currentUserId,
  canReview,
  reviewPending,
  setReviewPending,
  isModalOpen,
  onEscapeModal,
  checkOnline,
  onSuccess,
}: UseMediaSerialReviewOptions) {
  const [focusedAssetId, setFocusedAssetId] = React.useState<string | null>(
    null
  );
  const [localReviews, setLocalReviews] = React.useState<
    Record<string, LocalMediaReviewState>
  >({});
  const [inlineErrors, setInlineErrors] = React.useState<
    Record<string, string>
  >({});

  // Merge optimistic local review statuses with assets
  const effectiveAssets = React.useMemo(() => {
    return assets.map((a) => {
      const local = localReviews[a.id];
      if (local) {
        return {
          ...a,
          privacyReviewed: local.privacyReviewed,
          eligibleForPublic: local.eligibleForPublic,
        };
      }
      return a;
    });
  }, [assets, localReviews]);

  // Actionable unreviewed assets (excluding SoD-locked self-uploads)
  const actionableUnreviewed = React.useMemo(() => {
    return effectiveAssets.filter(
      (a) => !a.privacyReviewed && a.uploadedBy !== currentUserId
    );
  }, [effectiveAssets, currentUserId]);

  // Serial Quick Approve single item with auto-advance
  const handleQuickApprove = React.useCallback(
    async (asset: MediaAssetDTO) => {
      if (asset.uploadedBy === currentUserId || !canReview || reviewPending) {
        return;
      }

      if (
        !checkOnline((msg) =>
          setInlineErrors((prev) => ({ ...prev, [asset.id]: msg }))
        )
      ) {
        return;
      }

      // Optimistic update
      setLocalReviews((prev) => ({
        ...prev,
        [asset.id]: { privacyReviewed: true, eligibleForPublic: true },
      }));
      setInlineErrors((prev) => {
        const next = { ...prev };
        delete next[asset.id];
        return next;
      });

      // Advance focus to next eligible item
      const nextCandidates = effectiveAssets.filter(
        (a) =>
          a.id !== asset.id &&
          !a.privacyReviewed &&
          a.uploadedBy !== currentUserId
      );

      if (nextCandidates.length > 0) {
        const nextTarget = nextCandidates[0];
        setFocusedAssetId(nextTarget.id);
        focusMediaCard(nextTarget.id);
      }

      setReviewPending(true);
      try {
        const res = await reviewMediaAssetPrivacyAction({
          mediaId: asset.id,
          eligibleForPublic: true,
          reviewNotes: "Disetujui via tinjauan serial cepat",
        });

        if (!res.success) {
          // Revert optimistic update
          setLocalReviews((prev) => {
            const next = { ...prev };
            delete next[asset.id];
            return next;
          });
          setInlineErrors((prev) => ({
            ...prev,
            [asset.id]: res.error.message,
          }));
          return;
        }

        onSuccess();
      } catch {
        // Revert optimistic update on network timeout
        setLocalReviews((prev) => {
          const next = { ...prev };
          delete next[asset.id];
          return next;
        });
        setInlineErrors((prev) => ({
          ...prev,
          [asset.id]: "Gagal menyimpan karena gangguan koneksi.",
        }));
      } finally {
        setReviewPending(false);
      }
    },
    [
      canReview,
      checkOnline,
      currentUserId,
      effectiveAssets,
      onSuccess,
      reviewPending,
      setReviewPending,
    ]
  );

  // Global Keyboard Shortcuts for High-Efficiency Serial Review
  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (onEscapeModal()) {
          e.preventDefault();
        } else if (focusedAssetId) {
          setFocusedAssetId(null);
        }
        return;
      }

      if (e.key === "ArrowRight") {
        if (actionableUnreviewed.length === 0) return;
        const currentIdx = actionableUnreviewed.findIndex(
          (a) => a.id === focusedAssetId
        );
        const nextIdx = (currentIdx + 1) % actionableUnreviewed.length;
        const nextItem = actionableUnreviewed[nextIdx];
        setFocusedAssetId(nextItem.id);
        focusMediaCard(nextItem.id);
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowLeft") {
        if (actionableUnreviewed.length === 0) return;
        const currentIdx = actionableUnreviewed.findIndex(
          (a) => a.id === focusedAssetId
        );
        const prevIdx =
          (currentIdx - 1 + actionableUnreviewed.length) %
          actionableUnreviewed.length;
        const prevItem = actionableUnreviewed[prevIdx];
        setFocusedAssetId(prevItem.id);
        focusMediaCard(prevItem.id);
        e.preventDefault();
        return;
      }

      if (
        (e.key === "Enter" || e.key === " ") &&
        !isModalOpen &&
        focusedAssetId
      ) {
        const targetAsset = effectiveAssets.find(
          (a) => a.id === focusedAssetId
        );
        if (
          targetAsset &&
          !targetAsset.privacyReviewed &&
          targetAsset.uploadedBy !== currentUserId
        ) {
          e.preventDefault();
          void handleQuickApprove(targetAsset);
        }
      }
    },
    [
      actionableUnreviewed,
      currentUserId,
      effectiveAssets,
      focusedAssetId,
      handleQuickApprove,
      isModalOpen,
      onEscapeModal,
    ]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    focusedAssetId,
    setFocusedAssetId,
    localReviews,
    inlineErrors,
    effectiveAssets,
    handleKeyDown,
    handleQuickApprove,
  };
}

