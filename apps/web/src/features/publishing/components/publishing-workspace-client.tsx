"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe, Newspaper, Plus, Send, ShieldCheck } from "lucide-react";
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
import type { MediaAssetDTO } from "@/features/media";
import { useConnectivity } from "@/hooks/use-connectivity";
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

  async function handleCreateDraft(e: React.FormEvent) {
    e.preventDefault();
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
      const res = await createPublicationDraftAction({
        title,
        category,
        excerpt: excerpt.trim() || null,
        content,
        coverMediaId: coverMediaId || null,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return;
      }
      setCreateOpen(false);
      setTitle("");
      setExcerpt("");
      setContent("");
      setCoverMediaId("");
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
              onClick={() => setCreateOpen(true)}
              leftIcon={<Icon icon={Plus} size="sm" />}
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
          icon={Newspaper}
          title="Belum ada konten publikasi."
          description="Susun draft berita atau kegiatan Rumah Belajar untuk diajukan ke tahap tinjauan privasi."
          action={
            canCreate ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setCreateOpen(true)}
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
                        leftIcon={<Icon icon={Send} size="xs" />}
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
                        leftIcon={<Icon icon={ShieldCheck} size="xs" />}
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
                            leftIcon={<Icon icon={Globe} size="xs" />}
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

      {/* Dialog: Tambah draft konten */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah draft konten</DialogTitle>
            <DialogDescription>
              Tulis draft konten publikasi baru. Konten akan berstatus Draft
              konten dan wajib melalui Tinjauan privasi sebelum dapat
              diterbitkan. {PRIVACY_MESSAGES.auditLogged}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDraft}>
            <DialogBody className="space-y-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="space-y-1">
                  <label
                    htmlFor="pub-cover"
                    className="block text-xs font-medium text-foreground"
                  >
                    Dokumentasi sampul (Layak publik)
                  </label>
                  <select
                    id="pub-cover"
                    value={coverMediaId}
                    onChange={(e) => setCoverMediaId(e.target.value)}
                    className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                  >
                    <option value="">Tanpa foto sampul</option>
                    {eligibleMedia.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
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
                  rows={4}
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

