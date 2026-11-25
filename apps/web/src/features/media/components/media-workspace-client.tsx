"use client";

import * as React from "react";
import Image from "next/image";
import { EmptyState } from "@/components/compositions";
import {
  DatePicker,
  PageHeader,
  SearchToolbar,
  StatSummary,
} from "@/components/patterns";
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
  Input,
  Textarea,
} from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { useTierCGuard } from "@/hooks/use-tier-c-guard";
import { useUrlQueryParams } from "@/hooks/use-url-query-params";
import { cn } from "@/lib/cn";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import {
  confirmMediaUploadAction,
  createMediaUploadUrlAction,
  reviewMediaAssetPrivacyAction,
} from "../actions/media-actions";
import {
  MEDIA_CATEGORY_LABELS,
  type MediaAssetDTO,
  type MediaCategoryCode,
} from "../types/media-types";
import { MEDIA_CATEGORY_VALUES } from "../validators/media-validator";

export interface MediaWorkspaceClientProps {
  assets: MediaAssetDTO[];
  initialSearch: string;
  initialCategory: string;
  initialEligibility: string;
  currentUserId: string;
  canCreate: boolean;
  canReview: boolean;
}

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

  const [searchInput, setSearchInput] = React.useState(initialSearch);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadTitle, setUploadTitle] = React.useState("");
  const [uploadDesc, setUploadDesc] = React.useState("");
  const [uploadCategory, setUploadCategory] =
    React.useState<MediaCategoryCode>("KEGIATAN");
  const [uploadDate, setUploadDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadPending, setUploadPending] = React.useState(false);

  // Review & Serial Workflow State
  const [reviewingAsset, setReviewingAsset] =
    React.useState<MediaAssetDTO | null>(null);
  const [reviewEligible, setReviewEligible] = React.useState(true);
  const [reviewNotes, setReviewNotes] = React.useState("");
  const [reviewPending, setReviewPending] = React.useState(false);

  // Serial keyboard navigation focus
  const [focusedAssetId, setFocusedAssetId] = React.useState<string | null>(
    null
  );

  // Optimistic review state
  const [localReviews, setLocalReviews] = React.useState<
    Record<string, { privacyReviewed: boolean; eligibleForPublic: boolean }>
  >({});

  // Inline error state per media card (no screen-blocking global toast)
  const [inlineErrors, setInlineErrors] = React.useState<
    Record<string, string>
  >({});

  const [feedback, setFeedback] = React.useState<{
    tone: "success" | "danger" | "warning";
    message: string;
  } | null>(null);
  const { checkOnline, withTierCGuard } = useTierCGuard(
    "Tata Kelola & Persetujuan Laporan",
    (message) => setFeedback({ tone: "warning", message })
  );

  React.useEffect(() => {
    if (searchInput === initialSearch) return;
    const t = window.setTimeout(() => {
      updateUrl({ search: searchInput.trim() || null });
    }, 300);
    return () => window.clearTimeout(t);
  }, [initialSearch, searchInput, updateUrl]);

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

  // Sisa Ditinjau calculation
  const unreviewedCount = React.useMemo(() => {
    return effectiveAssets.filter((a) => !a.privacyReviewed).length;
  }, [effectiveAssets]);

  const eligibleCount = React.useMemo(() => {
    return effectiveAssets.filter(
      (a) => a.privacyReviewed && a.eligibleForPublic
    ).length;
  }, [effectiveAssets]);

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
        const el = document.getElementById(`media-card-${nextTarget.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          el.focus();
        }
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

        router.refresh();
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
      reviewPending,
      router,
    ]
  );

  // Global Keyboard Shortcuts for High-Efficiency Serial Review
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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
        if (reviewingAsset) {
          setReviewingAsset(null);
          e.preventDefault();
        } else if (uploadOpen) {
          setUploadOpen(false);
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
        const el = document.getElementById(`media-card-${nextItem.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          el.focus();
        }
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
        const el = document.getElementById(`media-card-${prevItem.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          el.focus();
        }
        e.preventDefault();
        return;
      }

      if (
        (e.key === "Enter" || e.key === " ") &&
        !reviewingAsset &&
        !uploadOpen &&
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
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    actionableUnreviewed,
    currentUserId,
    effectiveAssets,
    focusedAssetId,
    handleQuickApprove,
    reviewingAsset,
    uploadOpen,
  ]);

  async function handleThreeStepUpload(e: React.FormEvent) {
    e.preventDefault();
    if (uploadPending) return;

    await withTierCGuard(async () => {
      const fileName = selectedFile?.name ?? "dokumentasi-kegiatan.jpg";
      const mimeType =
        (selectedFile?.type as "image/jpeg" | "image/png" | "image/webp") ||
        "image/jpeg";
      const fileSize = selectedFile?.size ?? 128000;

      setUploadPending(true);
      setFeedback(null);

      try {
        // Step 1: Server Action generates signed upload URL in private bucket "media"
        const urlRes = await createMediaUploadUrlAction({
          fileName,
          mimeType,
          fileSize,
        });
        if (!urlRes.success) {
          setFeedback({ tone: "danger", message: urlRes.error.message });
          return;
        }

        // Step 2: Client PUTs file directly to Supabase Storage signed upload URL
        if (selectedFile) {
          const putRes = await fetch(urlRes.data.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": mimeType },
            body: selectedFile,
          });
          if (!putRes.ok) {
            setFeedback({
              tone: "danger",
              message: "Gagal mengunggah berkas ke penyimpanan privat.",
            });
            return;
          }
        }

        // Step 3: Server Action confirms upload, persists media_assets row + audit log
        const confirmRes = await confirmMediaUploadAction({
          title: uploadTitle,
          description: uploadDesc.trim() || null,
          filePath: urlRes.data.filePath,
          mimeType,
          fileSize,
          category: uploadCategory,
          capturedDate: uploadDate || null,
        });

        if (!confirmRes.success) {
          setFeedback({ tone: "danger", message: confirmRes.error.message });
          return;
        }

        setUploadOpen(false);
        setUploadTitle("");
        setUploadDesc("");
        setSelectedFile(null);
        setFeedback({
          tone: "success",
          message:
            "Dokumentasi berhasil disimpan di bucket privat dan menunggu tinjauan privasi.",
        });
        router.refresh();
      } finally {
        setUploadPending(false);
      }
    });
  }

  async function handleConfirmReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewingAsset || reviewPending) return;
    const currentAsset = reviewingAsset;

    await withTierCGuard(async () => {
      setReviewPending(true);
      setFeedback(null);
      try {
        const res = await reviewMediaAssetPrivacyAction({
          mediaId: currentAsset.id,
          eligibleForPublic: reviewEligible,
          reviewNotes: reviewNotes.trim() || null,
        });
        if (!res.success) {
          setFeedback({ tone: "danger", message: res.error.message });
          return;
        }
        setReviewingAsset(null);
        setReviewNotes("");
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
  }

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

      {feedback && (
        <div
          role={feedback.tone === "danger" ? "alert" : "status"}
          className={
            feedback.tone === "success"
              ? "rounded-control border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
              : feedback.tone === "warning"
                ? "rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-foreground"
                : "rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          }
        >
          {feedback.message}
        </div>
      )}

      <SearchToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Cari judul dokumentasi..."
        filterCount={
          (initialCategory !== "ALL" ? 1 : 0) +
          (initialEligibility !== "ALL" ? 1 : 0)
        }
        onResetAll={() => {
          setSearchInput("");
          router.push(pathname);
        }}
        desktopFilters={
          <>
            <select
              aria-label="Filter kategori dokumentasi"
              value={initialCategory}
              onChange={(e) => updateUrl({ category: e.target.value })}
              className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
            >
              <option value="ALL">Semua kategori</option>
              {MEDIA_CATEGORY_VALUES.map((cat) => (
                <option key={cat} value={cat}>
                  {MEDIA_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter status kelayakan publik"
              value={initialEligibility}
              onChange={(e) => updateUrl({ eligibility: e.target.value })}
              className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
            >
              <option value="ALL">Semua status tinjauan</option>
              <option value="UNREVIEWED">Menunggu tinjauan privasi</option>
              <option value="PUBLIC">Layak tayang di publik</option>
              <option value="INTERNAL">Hanya arsip internal</option>
            </select>
          </>
        }
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
          {effectiveAssets.map((asset, idx) => {
            const isOwnUpload = asset.uploadedBy === currentUserId;
            const isFocused = focusedAssetId === asset.id;
            const cardError = inlineErrors[asset.id];

            return (
              <article
                id={`media-card-${asset.id}`}
                tabIndex={0}
                onFocus={() => setFocusedAssetId(asset.id)}
                key={asset.id}
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
                  {/* Card Header Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="neutral" size="sm">
                      {asset.categoryLabel}
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
                    ) : !asset.privacyReviewed ? (
                      <Badge variant="warning" size="sm">
                        Menunggu tinjauan privasi
                      </Badge>
                    ) : asset.eligibleForPublic ? (
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

                  {/* 4:5 Aspect Ratio Thumbnail */}
                  <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] bg-surface-subtle rounded-control overflow-hidden border border-border flex items-center justify-center">
                    {asset.signedReadUrl ? (
                      <Image
                        src={asset.signedReadUrl}
                        alt={asset.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={idx < 2}
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
                      onClick={() => void handleQuickApprove(asset)}
                      className="font-semibold underline hover:text-danger/80 transition-colors duration-200 shrink-0"
                    >
                      Coba lagi
                    </button>
                  </div>
                )}

                {/* Card Action Footer */}
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
                              onClick={() => void handleQuickApprove(asset)}
                              leftIcon={
                                <Icon icon={ICON_MAP.checkCircle} size="xs" />
                              }
                            >
                              Setujui publik
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={reviewPending}
                            onClick={() => {
                              setReviewingAsset(asset);
                              setReviewEligible(true);
                              setReviewNotes("");
                            }}
                            leftIcon={
                              <Icon icon={ICON_MAP.shieldCheck} size="xs" />
                            }
                          >
                            Tinjau detail
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Dialog: Unggah dokumentasi (3-step signed URL upload) */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unggah dokumentasi</DialogTitle>
            <DialogDescription>
              Berkas diunggah langsung ke bucket privat Supabase menggunakan
              tautan berpenanda tangan (signed upload URL) dan wajib melalui
              tinjauan privasi sebelum tampil di publik.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleThreeStepUpload}>
            <DialogBody className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="media-title"
                  className="block text-xs font-medium text-foreground"
                >
                  Judul dokumentasi *
                </label>
                <Input
                  id="media-title"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Contoh: Kegiatan Membaca Bersama Sabtu Ceria"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="media-category"
                    className="block text-xs font-medium text-foreground"
                  >
                    Kategori dokumentasi *
                  </label>
                  <select
                    id="media-category"
                    value={uploadCategory}
                    onChange={(e) =>
                      setUploadCategory(e.target.value as MediaCategoryCode)
                    }
                    className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                  >
                    {MEDIA_CATEGORY_VALUES.map((cat) => (
                      <option key={cat} value={cat}>
                        {MEDIA_CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <DatePicker
                  id="media-date"
                  label="Tanggal kegiatan"
                  value={uploadDate}
                  onChange={(v) => setUploadDate(v)}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="media-file"
                  className="block text-xs font-medium text-foreground"
                >
                  Berkas foto (JPEG, PNG, atau WebP · maks. 10 MB)
                </label>
                <Input
                  id="media-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setSelectedFile(e.target.files?.[0] ?? null)
                  }
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="media-desc"
                  className="block text-xs font-medium text-foreground"
                >
                  Keterangan dokumentasi (opsional)
                </label>
                <Textarea
                  id="media-desc"
                  rows={2}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Konteks kegiatan dan catatan peserta yang terlibat..."
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setUploadOpen(false)}
                disabled={uploadPending}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={uploadPending}>
                {uploadPending ? "Mengunggah..." : "Unggah dokumentasi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tinjau dokumentasi */}
      <Dialog
        open={Boolean(reviewingAsset)}
        onOpenChange={(open) => {
          if (!open) setReviewingAsset(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tinjau dokumentasi</DialogTitle>
            <DialogDescription>
              Tentukan kelayakan publikasi untuk{" "}
              <strong className="text-foreground">
                {reviewingAsset?.title}
              </strong>
              . Pastikan seluruh peserta didik yang tampak telah memiliki
              Persetujuan Foto & Video aktif. {PRIVACY_MESSAGES.auditLogged}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmReview}>
            <DialogBody className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="review-eligibility"
                  className="block text-sm font-medium text-foreground"
                >
                  Keputusan kelayakan privasi
                </label>
                <select
                  id="review-eligibility"
                  value={reviewEligible ? "PUBLIC" : "INTERNAL"}
                  onChange={(e) =>
                    setReviewEligible(e.target.value === "PUBLIC")
                  }
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                >
                  <option value="PUBLIC">
                    Layak tayang di publik (Persetujuan wali terverifikasi)
                  </option>
                  <option value="INTERNAL">
                    Hanya arsip internal (Batasi dari galeri publik)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="review-media-notes"
                  className="block text-sm font-medium text-foreground"
                >
                  Catatan tinjauan privasi (opsional)
                </label>
                <Textarea
                  id="review-media-notes"
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Catatan hasil pemeriksaan privasi anak..."
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReviewingAsset(null)}
                disabled={reviewPending}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={reviewPending}>
                {reviewPending ? "Menyimpan..." : "Simpan keputusan tinjauan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
