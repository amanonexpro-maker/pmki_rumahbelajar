"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EmptyState, StatusBadge } from "@/components/compositions";
import {
  PageHeader,
  SearchToolbar,
  StatSummary,
  WorkflowProgress,
  type WorkflowStageItem,
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
import type { MediaAssetDTO } from "@/features/media";
import { useConnectivity } from "@/hooks/use-connectivity";
import { cn } from "@/lib/cn";
import { PRIVACY_MESSAGES, SUCCESS_MESSAGES } from "@/lib/messages";
import { checkTierCOnlineAvailability } from "@/lib/offline";
import { PUBLICATION_STATUS_META, type PublicationStatus } from "@/lib/status";
import {
  createPublicationDraftAction,
  transitionPublicationStatusAction,
} from "../actions/publishing-actions";
import {
  PUBLICATION_CATEGORY_LABELS,
  type PublicationCategoryCode,
  type PublicationDTO,
} from "../types/publishing-types";
import { PUBLICATION_CATEGORY_VALUES } from "../validators/publishing-validator";

const STORAGE_KEY_PREFIX = "pmki_draft_pub_";
const DRAFT_KEY = `${STORAGE_KEY_PREFIX}new`;

interface LocalPublicationDraft {
  title: string;
  category: PublicationCategoryCode;
  excerpt: string;
  content: string;
  coverMediaId: string;
}

function buildPublicationStages(
  status: PublicationStatus
): WorkflowStageItem[] {
  const steps: Array<{
    id: PublicationStatus;
    label: string;
    actorHint: string;
  }> = [
    {
      id: "DRAFT",
      label: PUBLICATION_STATUS_META.DRAFT.label,
      actorHint: "Penyusun Konten",
    },
    {
      id: "PRIVACY_REVIEW",
      label: PUBLICATION_STATUS_META.PRIVACY_REVIEW.label,
      actorHint: "Peninjau",
    },
    {
      id: "APPROVED",
      label: PUBLICATION_STATUS_META.APPROVED.label,
      actorHint: "Siap terbit",
    },
    {
      id: "PUBLISHED",
      label: PUBLICATION_STATUS_META.PUBLISHED.label,
      actorHint: "Pejabat Penyetuju (SoD)",
    },
  ];

  if (status === "ARCHIVED") {
    return steps.map((s) => ({ ...s, state: "archived" }));
  }

  const currentIdx = steps.findIndex((s) => s.id === status);
  return steps.map((s, idx) => ({
    ...s,
    state:
      status === "PUBLISHED" || idx < currentIdx
        ? "completed"
        : idx === currentIdx
          ? "current"
          : "upcoming",
  }));
}

export interface PublishingWorkspaceClientProps {
  publications: PublicationDTO[];
  eligibleMedia: MediaAssetDTO[];
  initialSearch: string;
  initialStatus: string;
  currentUserId: string;
  canCreate: boolean;
  canReview: boolean;
  canPublish: boolean;
}

export function PublishingWorkspaceClient({
  publications,
  eligibleMedia,
  initialSearch,
  initialStatus,
  currentUserId,
  canCreate,
  canReview,
  canPublish,
}: PublishingWorkspaceClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: connectivityStatus } = useConnectivity();

  const [searchInput, setSearchInput] = React.useState(initialSearch);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] =
    React.useState<PublicationCategoryCode>("BERITA");
  const [excerpt, setExcerpt] = React.useState("");
  const [content, setContent] = React.useState("");
  const [coverMediaId, setCoverMediaId] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  // Local Storage Hygiene & Draft Recovery State
  const [hasRecoveredDraft, setHasRecoveredDraft] = React.useState(false);
  const [draftDismissed, setDraftDismissed] = React.useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = React.useState(false);

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

  // Check and recover draft when create modal opens
  React.useEffect(() => {
    if (!createOpen || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed: Partial<LocalPublicationDraft> = JSON.parse(saved);
        if (
          parsed.title?.trim() ||
          parsed.content?.trim() ||
          parsed.excerpt?.trim()
        ) {
          setTitle(parsed.title ?? "");
          setCategory(parsed.category ?? "BERITA");
          setExcerpt(parsed.excerpt ?? "");
          setContent(parsed.content ?? "");
          setCoverMediaId(parsed.coverMediaId ?? "");
          setHasRecoveredDraft(true);
          setDraftDismissed(false);
        }
      }
    } catch {
      // Storage unavailable or invalid JSON -> ignore gracefully
    }
  }, [createOpen]);

  // Debounced auto-save to localStorage (non-sensitive text fields only)
  React.useEffect(() => {
    if (!createOpen || typeof window === "undefined") return;
    if (!title.trim() && !content.trim() && !excerpt.trim()) return;

    const timer = window.setTimeout(() => {
      try {
        const payload: LocalPublicationDraft = {
          title,
          category,
          excerpt,
          content,
          coverMediaId,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch {
        // Silently catch quota exceeded or private mode errors
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [createOpen, title, category, excerpt, content, coverMediaId]);

  function handleClearDraft() {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
    }
    setTitle("");
    setCategory("BERITA");
    setExcerpt("");
    setContent("");
    setCoverMediaId("");
    setHasRecoveredDraft(false);
    setDraftDismissed(true);
    setClearConfirmOpen(false);
    setModalError(null);
  }

  async function handleCreateDraft(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;

    const tierCheck = checkTierCOnlineAvailability(
      "Publikasi",
      connectivityStatus !== "OFFLINE"
    );
    if (!tierCheck.allowed) {
      setModalError(tierCheck.message);
      return;
    }

    setPending(true);
    setModalError(null);
    setFeedback(null);

    try {
      const res = await createPublicationDraftAction({
        title,
        category,
        excerpt: excerpt.trim() || null,
        content,
        coverMediaId: coverMediaId || null,
      });

      if (!res.success) {
        setModalError(res.error.message);
        return;
      }

      // Automatically clean up localStorage draft upon verified server save
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
      }

      setCreateOpen(false);
      setTitle("");
      setExcerpt("");
      setContent("");
      setCoverMediaId("");
      setHasRecoveredDraft(false);
      setModalError(null);

      setFeedback({
        tone: "success",
        message: "Draft konten publikasi berhasil disimpan.",
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleTransition(
    publicationId: string,
    targetStatus: PublicationStatus
  ) {
    if (pending) return;

    const tierCheck = checkTierCOnlineAvailability(
      "Publikasi",
      connectivityStatus !== "OFFLINE"
    );
    if (!tierCheck.allowed) {
      setFeedback({ tone: "warning", message: tierCheck.message });
      return;
    }

    setPending(true);
    setFeedback(null);
    try {
      const res = await transitionPublicationStatusAction({
        publicationId,
        targetStatus,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return;
      }
      setFeedback({
        tone: "success",
        message:
          targetStatus === "PUBLISHED"
            ? SUCCESS_MESSAGES.publicationPublished
            : `Status konten berhasil diperbarui menjadi "${PUBLICATION_STATUS_META[targetStatus].label}".`,
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const publishedCount = publications.filter(
    (p) => p.status === "PUBLISHED"
  ).length;
  const reviewCount = publications.filter(
    (p) => p.status === "PRIVACY_REVIEW" || p.status === "APPROVED"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publikasi"
        description="Kelola alur editorial berita dan kegiatan Rumah Belajar: Draft konten → Tinjauan privasi → Disetujui editorial → Tayang di publik (dengan pemisahan tugas penulis ≠ penerbit)."
        primaryAction={
          canCreate ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setModalError(null);
                setCreateOpen(true);
              }}
              leftIcon={<Icon icon={ICON_MAP.plus} size="sm" />}
            >
              Tambah draft konten
            </Button>
          ) : undefined
        }
      />

      <StatSummary
        items={[
          {
            id: "total",
            label: "Total konten publikasi",
            value: `${publications.length} konten`,
          },
          {
            id: "review",
            label: "Tinjauan & siap terbit",
            value: `${reviewCount} konten`,
          },
          {
            id: "published",
            label: "Tayang di publik",
            value: `${publishedCount} konten`,
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
        searchPlaceholder="Cari judul publikasi..."
        filterCount={initialStatus !== "ALL" ? 1 : 0}
        onResetAll={() => {
          setSearchInput("");
          router.push(pathname);
        }}
        desktopFilters={
          <select
            aria-label="Filter status publikasi"
            value={initialStatus}
            onChange={(e) => updateUrl({ status: e.target.value })}
            className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
          >
            <option value="ALL">Semua status publikasi</option>
            <option value="DRAFT">{PUBLICATION_STATUS_META.DRAFT.label}</option>
            <option value="PRIVACY_REVIEW">
              {PUBLICATION_STATUS_META.PRIVACY_REVIEW.label}
            </option>
            <option value="APPROVED">
              {PUBLICATION_STATUS_META.APPROVED.label}
            </option>
            <option value="PUBLISHED">
              {PUBLICATION_STATUS_META.PUBLISHED.label}
            </option>
            <option value="ARCHIVED">
              {PUBLICATION_STATUS_META.ARCHIVED.label}
            </option>
          </select>
        }
      />

      {publications.length === 0 ? (
        <EmptyState
          icon={ICON_MAP.kabar}
          title="Belum ada konten publikasi."
          description="Susun draft berita atau kegiatan Rumah Belajar untuk diajukan ke tahap tinjauan privasi."
          action={
            canCreate ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setModalError(null);
                  setCreateOpen(true);
                }}
              >
                Tambah draft konten
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {publications.map((post) => {
            const isAuthor = post.authorId === currentUserId;
            return (
              <article
                key={post.id}
                className="rounded-card border border-border bg-surface p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral" size="sm">
                        {post.categoryLabel}
                      </Badge>
                      <StatusBadge domain="publication" status={post.status} />
                    </div>
                    <h2 className="text-base font-semibold text-foreground">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-xs text-secondary-foreground leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                  </div>

                  {/* Current State -> Available Action -> Next State */}
                  <div className="flex flex-wrap items-center gap-2">
                    {post.status === "DRAFT" && canCreate && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          void handleTransition(post.id, "PRIVACY_REVIEW")
                        }
                        leftIcon={<Icon icon={ICON_MAP.send} size="xs" />}
                      >
                        Ajukan tinjauan privasi
                      </Button>
                    )}

                    {post.status === "PRIVACY_REVIEW" && canReview && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          void handleTransition(post.id, "APPROVED")
                        }
                        leftIcon={<Icon icon={ICON_MAP.shieldCheck} size="xs" />}
                      >
                        Setujui tinjauan privasi
                      </Button>
                    )}

                    {post.status === "APPROVED" && canPublish && (
                      <>
                        {isAuthor ? (
                          <span className="text-xs text-muted-foreground italic">
                            Menunggu pejabat penerbit lain (SoD: penulis ≠
                            penerbit)
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              void handleTransition(post.id, "PUBLISHED")
                            }
                            leftIcon={<Icon icon={ICON_MAP.globe} size="xs" />}
                          >
                            Terbitkan konten
                          </Button>
                        )}
                      </>
                    )}

                    {post.status === "PUBLISHED" && canPublish && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          void handleTransition(post.id, "ARCHIVED")
                        }
                      >
                        Arsipkan konten
                      </Button>
                    )}
                  </div>
                </div>

                <WorkflowProgress
                  compact
                  stages={buildPublicationStages(post.status)}
                />
              </article>
            );
          })}
        </div>
      )}

      {/* Dialog: Tambah draft konten dengan Local Draft Recovery */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DialogTitle>Tambah draft konten</DialogTitle>
              {hasRecoveredDraft && (
                <button
                  type="button"
                  onClick={() => setClearConfirmOpen(true)}
                  className="text-xs text-muted-foreground hover:text-danger transition-colors duration-200 inline-flex items-center gap-1"
                >
                  <ICON_MAP.trash className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Bersihkan draf lokal</span>
                </button>
              )}
            </div>
            <DialogDescription>
              Tulis draft konten publikasi baru. Konten akan berstatus Draft
              konten dan wajib melalui Tinjauan privasi sebelum dapat
              diterbitkan. {PRIVACY_MESSAGES.auditLogged}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDraft}>
            <DialogBody className="space-y-4">
              {/* Draft Recovery Notification Banner */}
              {hasRecoveredDraft && !draftDismissed && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-control border border-success/30 bg-success-soft px-3.5 py-2.5 text-xs text-success"
                >
                  <div className="flex items-center gap-2">
                    <ICON_MAP.checkCircle
                      className="w-4 h-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-medium">
                      Draf lokal ditemukan. Konten telah dipulihkan dari
                      perangkat ini.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDraftDismissed(true)}
                      className="text-xs font-semibold underline hover:text-success/80 transition-colors duration-200"
                    >
                      Lanjutkan edit
                    </button>
                    <span className="text-success/40">·</span>
                    <button
                      type="button"
                      onClick={() => setClearConfirmOpen(true)}
                      className="text-xs font-medium text-danger hover:underline transition-colors duration-200"
                    >
                      Mulai baru (Hapus draf)
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Clear Draft Warning */}
              {clearConfirmOpen && (
                <div className="rounded-control border border-danger/30 bg-danger-soft p-3 text-xs text-danger space-y-2">
                  <p className="font-medium">
                    Apakah Anda yakin ingin menghapus draf lokal ini? Naskah
                    yang belum disimpan akan hilang.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="px-3 py-1 bg-danger text-danger-foreground rounded-control text-xs font-medium hover:bg-danger-hover transition-colors duration-200"
                    >
                      Ya, hapus draf
                    </button>
                    <button
                      type="button"
                      onClick={() => setClearConfirmOpen(false)}
                      className="px-3 py-1 bg-surface border border-border text-foreground rounded-control text-xs font-medium hover:bg-surface-subtle transition-colors duration-200"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Inline Form Error Notification */}
              {modalError && (
                <div
                  role="alert"
                  className="rounded-control border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-xs text-danger"
                >
                  {modalError}
                </div>
              )}

              <div className="space-y-1">
                <label
                  htmlFor="pub-title"
                  className="block text-xs font-medium text-foreground"
                >
                  Judul konten *
                </label>
                <Input
                  id="pub-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Semangat Belajar Matematika Sabtu Ceria di Griya Asih"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="pub-category"
                  className="block text-xs font-medium text-foreground"
                >
                  Kategori *
                </label>
                <select
                  id="pub-category"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as PublicationCategoryCode)
                  }
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                >
                  {PUBLICATION_CATEGORY_VALUES.map((cat) => (
                    <option key={cat} value={cat}>
                      {PUBLICATION_CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visual Media Picker Grid Enhancement */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-foreground">
                    Foto sampul warta (Kurasi Layak Publik)
                  </label>
                  {coverMediaId && (
                    <button
                      type="button"
                      onClick={() => setCoverMediaId("")}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      Hapus pilihan
                    </button>
                  )}
                </div>

                <div
                  role="radiogroup"
                  aria-label="Pilih foto sampul dari dokumentasi yang telah lolos tinjauan privasi"
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto p-1.5 border border-border rounded-control bg-surface-subtle"
                >
                  {/* Option: Tanpa Foto Sampul */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!coverMediaId}
                    onClick={() => setCoverMediaId("")}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-control border text-center transition-colors duration-200 aspect-[4/5] focus-ring",
                      !coverMediaId
                        ? "border-primary bg-primary-soft/30 ring-2 ring-primary font-medium text-primary"
                        : "border-border bg-surface text-muted-foreground hover:bg-surface hover:text-foreground"
                    )}
                  >
                    <div className="w-8 h-8 rounded-pill bg-surface border border-border flex items-center justify-center mb-1.5">
                      <ICON_MAP.tutup
                        className="w-4 h-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-xs font-medium">Tanpa sampul</span>
                  </button>

                  {/* Options: Eligible Media Assets from Verified Backend */}
                  {eligibleMedia.map((m) => {
                    const isSelected = coverMediaId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setCoverMediaId(m.id)}
                        className={cn(
                          "group relative flex flex-col rounded-control border overflow-hidden text-left transition-colors duration-200 aspect-[4/5] focus-ring bg-surface",
                          isSelected
                            ? "border-primary ring-2 ring-primary"
                            : "border-border hover:border-border-strong"
                        )}
                      >
                        {/* 4:5 Thumbnail Container */}
                        <div className="relative w-full flex-1 bg-surface-subtle overflow-hidden flex items-center justify-center">
                          {m.signedReadUrl ? (
                            <img
                              src={m.signedReadUrl}
                              alt={m.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          ) : (
                            <ICON_MAP.image
                              className="w-8 h-8 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}

                          {/* Layak Publik Green Indicator Badge */}
                          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-surface/90 text-success backdrop-blur-xs shadow-xs border border-success/30">
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-success shrink-0"
                              aria-hidden="true"
                            />
                            <span>Layak</span>
                          </span>

                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                              <ICON_MAP.centang
                                className="w-3 h-3"
                                aria-hidden="true"
                              />
                            </span>
                          )}
                        </div>

                        {/* Caption Footer */}
                        <div className="p-1.5 bg-surface border-t border-border">
                          <p
                            className="text-[11px] font-medium text-foreground truncate"
                            title={m.title}
                          >
                            {m.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="pub-excerpt"
                  className="block text-xs font-medium text-foreground"
                >
                  Ringkasan singkat (opsional)
                </label>
                <Input
                  id="pub-excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Ringkasan 1–2 kalimat untuk kartu berita publik..."
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="pub-content"
                  className="block text-xs font-medium text-foreground"
                >
                  Isi naskah publikasi *
                </label>
                <Textarea
                  id="pub-content"
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan isi berita atau cerita kegiatan dengan bahasa hangat dan menghormati privasi peserta didik..."
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan draft konten"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
