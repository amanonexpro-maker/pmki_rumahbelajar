"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { EmptyState } from "@/components/compositions";
import {
  FeedbackBanner,
  FloatingFeedbackToast,
  PageHeader,
  StatSummary,
} from "@/components/patterns";
import { Button, Icon } from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { useTierCGuard } from "@/hooks/use-tier-c-guard";
import { useUrlQueryParams } from "@/hooks/use-url-query-params";
import { reviewMediaAssetPrivacyAction } from "../actions/media-actions";
import { useMediaSerialReview } from "../hooks/use-media-serial-review";
import type { MediaAssetDTO } from "../types/media-types";
import { MediaCard } from "./media-card";
import { MediaFilterBar } from "./media-filter-bar";

const DialogLoadingSkeleton = () => (
  <div
    role="status"
    aria-label="Memuat dialog..."
    className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-xs p-4"
  >
    <div className="h-64 w-full max-w-lg animate-pulse rounded-card bg-surface border border-border" />
  </div>
);

const MediaUploadDialog = dynamic(
  () => import("./media-upload-dialog").then((mod) => mod.MediaUploadDialog),
  { ssr: false, loading: DialogLoadingSkeleton }
);

const MediaReviewDialog = dynamic(
  () => import("./media-review-dialog").then((mod) => mod.MediaReviewDialog),
  { ssr: false, loading: DialogLoadingSkeleton }
);

export interface MediaWorkspaceClientProps {
  assets: MediaAssetDTO[];
  initialSearch: string;
  initialCategory: string;
  initialEligibility: string;
  currentUserId: string;
  canCreate: boolean;
  canReview: boolean;
}

/**
 * Orchestrates the Media workspace: coordinates URL filter state, serial
 * keyboard review, upload/review dialogs, and global workspace feedback.
 */
export function MediaWorkspaceClient({
  assets,
  initialSearch,
  initialCategory,
  initialEligibility,
  currentUserId,
  canCreate,
  canReview,
}: MediaWorkspaceClientProps) {
  const { updateQuery: updateUrl, pathname, router } = useUrlQueryParams();

  const [uploadOpen, setUploadOpen] = React.useState(false);

  // Review & Serial Workflow State
  const [reviewingAsset, setReviewingAsset] =
    React.useState<MediaAssetDTO | null>(null);
  const [reviewPending, setReviewPending] = React.useState(false);

  const [feedback, setFeedback] = React.useState<{
    tone: "success" | "danger" | "warning";
    message: string;
  } | null>(null);
  const { checkOnline, withTierCGuard } = useTierCGuard(
    "Tata Kelola & Persetujuan Laporan",
    (message) => setFeedback({ tone: "warning", message })
  );

  const handleEscapeModal = React.useCallback(() => {
    if (reviewingAsset) {
      setReviewingAsset(null);
      return true;
    }
    if (uploadOpen) {
      setUploadOpen(false);
      return true;
    }
    return false;
  }, [reviewingAsset, uploadOpen]);

  const handleRefresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const handleResetFilters = React.useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  const {
    focusedAssetId,
    setFocusedAssetId,
    inlineErrors,
    effectiveAssets,
    handleQuickApprove,
  } = useMediaSerialReview({
    assets,
    currentUserId,
    canReview,
    reviewPending,
    setReviewPending,
    isModalOpen: Boolean(reviewingAsset) || uploadOpen,
    onEscapeModal: handleEscapeModal,
    checkOnline,
    onSuccess: handleRefresh,
  });

  const handleQuickApproveClick = React.useCallback(
    (target: MediaAssetDTO) => {
      void handleQuickApprove(target);
    },
    [handleQuickApprove]
  );

  const handleReviewClick = React.useCallback((target: MediaAssetDTO) => {
    setReviewingAsset(target);
  }, []);

  // Sisa Ditinjau calculation
  const unreviewedCount = React.useMemo(() => {
    return effectiveAssets.filter((a) => !a.privacyReviewed).length;
  }, [effectiveAssets]);

  const eligibleCount = React.useMemo(() => {
    return effectiveAssets.filter(
      (a) => a.privacyReviewed && a.eligibleForPublic
    ).length;
  }, [effectiveAssets]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumentasi"
        description="Kelola dokumentasi foto kegiatan Rumah Belajar pada bucket privat. Dokumentasi wajib lolos tinjauan privasi dengan prinsip pemisahan tugas (pengunggah ≠ peninjau) sebelum layak tampil di publik."
        primaryAction={
          canCreate ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => setUploadOpen(true)}
              leftIcon={<Icon icon={ICON_MAP.plus} size="sm" />}
            >
              Unggah dokumentasi
            </Button>
          ) : undefined
        }
      />

      <StatSummary
        items={[
          {
            id: "total",
            label: "Total dokumentasi",
            value: `${effectiveAssets.length} berkas`,
          },
          {
            id: "unreviewed",
            label: "Menunggu tinjauan privasi",
            value: `${unreviewedCount} berkas`,
          },
          {
            id: "eligible",
            label: "Layak tayang publik",
            value: `${eligibleCount} berkas`,
          },
        ]}
      />

      {/* Sticky Progress & Serial Navigation Toolbar */}
      <div className="sticky top-0 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 bg-background/95 backdrop-blur-sm border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            Sisa Ditinjau:
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-soft text-warning-foreground border border-warning/30 tabular-nums">
            {unreviewedCount} berkas
          </span>
          <span className="text-xs text-muted-foreground hidden md:inline ml-2">
            Shortcut: <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-[10px] font-mono">Tab / Panah</kbd> untuk pilih, <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-[10px] font-mono">Enter / Space</kbd> untuk setujui cepat.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-secondary-foreground font-mono">
            Pemisahan Tugas (SoD) Aktif
          </span>
        </div>
      </div>

      {feedback && feedback.tone !== "success" && (
        <FeedbackBanner
          tone={feedback.tone}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {feedback && feedback.tone === "success" && (
        <FloatingFeedbackToast
          tone="success"
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <MediaFilterBar
        initialSearch={initialSearch}
        initialCategory={initialCategory}
        initialEligibility={initialEligibility}
        onUpdateQuery={updateUrl}
        onResetAll={handleResetFilters}
      />

      {effectiveAssets.length === 0 ? (
        <EmptyState
          icon={ICON_MAP.image}
          title="Belum ada dokumentasi."
          description="Unggah dokumentasi kegiatan belajar untuk ditinjau kelayakan privasinya."
          action={
            canCreate ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setUploadOpen(true)}
              >
                Unggah dokumentasi
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {effectiveAssets.map((asset, idx) => (
            <MediaCard
              key={asset.id}
              asset={asset}
              isFocused={focusedAssetId === asset.id}
              isOwnUpload={asset.uploadedBy === currentUserId}
              canReview={canReview}
              cardError={inlineErrors[asset.id]}
              reviewPending={reviewPending}
              priority={idx < 2}
              onFocus={setFocusedAssetId}
              onQuickApprove={handleQuickApproveClick}
              onReview={handleReviewClick}
            />
          ))}
        </div>
      )}

      {uploadOpen && (
        <MediaUploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onSuccess={() => {
            setFeedback({
              tone: "success",
              message:
                "Dokumentasi berhasil disimpan di bucket privat dan menunggu tinjauan privasi.",
            });
            router.refresh();
          }}
        />
      )}

      {Boolean(reviewingAsset) && (
        <MediaReviewDialog
          open={Boolean(reviewingAsset)}
          onOpenChange={(open) => {
            if (!open) setReviewingAsset(null);
          }}
          asset={reviewingAsset}
          pending={reviewPending}
          onSubmit={async (values) => {
            if (!reviewingAsset || reviewPending) return;
            const currentAsset = reviewingAsset;
            await withTierCGuard(async () => {
              setReviewPending(true);
              setFeedback(null);
              try {
                const res = await reviewMediaAssetPrivacyAction({
                  mediaId: currentAsset.id,
                  eligibleForPublic: values.eligibleForPublic,
                  reviewNotes: values.reviewNotes?.trim() || null,
                });
                if (!res.success) {
                  setFeedback({ tone: "danger", message: res.error.message });
                  return;
                }
                setReviewingAsset(null);
                setFeedback({
                  tone: "success",
                  message:
                    "Keputusan tinjauan privasi dokumentasi berhasil disimpan dan dicatat dalam jejak audit.",
                });
                router.refresh();
              } finally {
                setReviewPending(false);
              }
            });
          }}
        />
      )}
    </div>
  );
}
