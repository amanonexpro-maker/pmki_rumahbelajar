"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Image as ImageIcon,
  Lock,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { EmptyState } from "@/components/compositions";
import {
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
import { useConnectivity } from "@/hooks/use-connectivity";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import { checkTierCOnlineAvailability } from "@/lib/offline";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: connectivityStatus } = useConnectivity();

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

  const [reviewingAsset, setReviewingAsset] =
    React.useState<MediaAssetDTO | null>(null);
  const [reviewEligible, setReviewEligible] = React.useState(true);
  const [reviewNotes, setReviewNotes] = React.useState("");
  const [reviewPending, setReviewPending] = React.useState(false);

  const [feedback, setFeedback] = React.useState<{
    tone: "success" | "danger" | "warning";
    message: string;
  } | null>(null);

  const updateUrl = React.useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === "ALL") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  React.useEffect(() => {
    if (searchInput === initialSearch) return;
    const t = window.setTimeout(() => {
      updateUrl({ search: searchInput.trim() || null });
    }, 300);
    return () => window.clearTimeout(t);
  }, [initialSearch, searchInput, updateUrl]);

  async function handleThreeStepUpload(e: React.FormEvent) {
    e.preventDefault();
    if (uploadPending) return;

    const tierCheck = checkTierCOnlineAvailability(
      "Tata Kelola & Persetujuan Laporan",
      connectivityStatus !== "OFFLINE"
    );
    if (!tierCheck.allowed) {
      setFeedback({ tone: "warning", message: tierCheck.message });
      return;
    }

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
  }

  async function handleConfirmReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewingAsset || reviewPending) return;

    const tierCheck = checkTierCOnlineAvailability(
      "Tata Kelola & Persetujuan Laporan",
      connectivityStatus !== "OFFLINE"
    );
    if (!tierCheck.allowed) {
      setFeedback({ tone: "warning", message: tierCheck.message });
      return;
    }

    setReviewPending(true);
    setFeedback(null);
    try {
      const res = await reviewMediaAssetPrivacyAction({
        mediaId: reviewingAsset.id,
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
  }

  const eligibleCount = assets.filter(
    (a) => a.privacyReviewed && a.eligibleForPublic
  ).length;
  const unreviewedCount = assets.filter((a) => !a.privacyReviewed).length;

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
              leftIcon={<Icon icon={Plus} size="sm" />}
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
            value: `${assets.length} berkas`,
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

      {assets.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
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
          {assets.map((asset) => {
            const isOwnUpload = asset.uploadedBy === currentUserId;
            return (
              <article
                key={asset.id}
                className="rounded-card border border-border bg-surface p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="neutral" size="sm">
                      {asset.categoryLabel}
                    </Badge>
                    {!asset.privacyReviewed ? (
                      <Badge variant="warning" size="sm">
                        Menunggu tinjauan privasi
                      </Badge>
                    ) : asset.eligibleForPublic ? (
                      <Badge variant="success" size="sm">
                        <Icon icon={CheckCircle2} size="xs" />
                        <span>Layak tayang di publik</span>
                      </Badge>
                    ) : (
                      <Badge variant="info" size="sm">
                        <Icon icon={Lock} size="xs" />
                        <span>Hanya arsip internal</span>
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-base font-semibold text-foreground">
                    {asset.title}
                  </h2>
                  {asset.description && (
                    <p className="text-xs text-secondary-foreground leading-relaxed">
                      {asset.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground font-mono">
                    Bucket privat · TTL URL {asset.signedUrlTtlSeconds ?? 3600}d
                  </span>

                  {canReview && (
                    <div>
                      {isOwnUpload ? (
                        <span
                          className="text-muted-foreground italic"
                          title="Pemisahan tugas: pengunggah tidak dapat meninjau dokumentasinya sendiri"
                        >
                          Menunggu peninjau lain (SoD)
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setReviewingAsset(asset);
                            setReviewEligible(true);
                            setReviewNotes("");
                          }}
                          leftIcon={<Icon icon={ShieldCheck} size="xs" />}
                        >
                          Tinjau dokumentasi
                        </Button>
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

                <div className="space-y-1">
                  <label
                    htmlFor="media-date"
                    className="block text-xs font-medium text-foreground"
                  >
                    Tanggal kegiatan
                  </label>
                  <Input
                    id="media-date"
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                  />
                </div>
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

