"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { EmptyState } from "@/components/compositions";
import { PageHeader, StatSummary } from "@/components/patterns";
import { Button, Icon } from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import type { MediaAssetDTO } from "@/features/media";
import { useTierCGuard } from "@/hooks/use-tier-c-guard";
import { useUrlQueryParams } from "@/hooks/use-url-query-params";
import { SUCCESS_MESSAGES } from "@/lib/messages";
import { PUBLICATION_STATUS_META, type PublicationStatus } from "@/lib/status";
import {
  createPublicationDraftAction,
  transitionPublicationStatusAction,
} from "../actions/publishing-actions";
import type { PublicationDTO } from "../types/publishing-types";
import type { CreatePublicationFormValues } from "../validators/publishing-validator";
import { PublishingFilterBar } from "./publishing-filter-bar";
import { PublishingItemCard } from "./publishing-item-card";

const DialogLoadingSkeleton = () => (
  <div
    role="status"
    aria-label="Memuat dialog..."
    className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-xs p-4"
  >
    <div className="h-64 w-full max-w-2xl animate-pulse rounded-card bg-surface border border-border" />
  </div>
);

const PublishingCreateDialog = dynamic(
  () =>
    import("./publishing-create-dialog").then(
      (mod) => mod.PublishingCreateDialog
    ),
  { ssr: false, loading: DialogLoadingSkeleton }
);

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

/**
 * Orchestrates the Publishing workspace: coordinates URL filter state,
 * draft creation dialog, publication cards, and editorial status transitions.
 */
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
  const { updateQuery: updateUrl, pathname, router } = useUrlQueryParams();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  const [feedback, setFeedback] = React.useState<{
    tone: "success" | "danger" | "warning";
    message: string;
  } | null>(null);
  const { withTierCGuard } = useTierCGuard("Publikasi", (message) =>
    setFeedback({ tone: "warning", message })
  );

  const handleOpenCreateDialog = React.useCallback(() => {
    setModalError(null);
    setCreateOpen(true);
  }, []);

  const handleResetFilters = React.useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  async function handleCreateDraft(
    values: CreatePublicationFormValues
  ): Promise<boolean> {
    if (pending) return false;

    const succeeded = await withTierCGuard(
      async () => {
        setPending(true);
        setModalError(null);
        setFeedback(null);

        try {
          const res = await createPublicationDraftAction({
            title: values.title,
            category: values.category,
            excerpt: values.excerpt?.trim() || null,
            content: values.content,
            coverMediaId: values.coverMediaId || null,
          });

          if (!res.success) {
            setModalError(res.error.message);
            return false;
          }

          setCreateOpen(false);
          setModalError(null);
          setFeedback({
            tone: "success",
            message: "Draft konten publikasi berhasil disimpan.",
          });
          router.refresh();
          return true;
        } finally {
          setPending(false);
        }
      },
      (msg) => setModalError(msg)
    );

    return Boolean(succeeded);
  }

  const handleTransition = React.useCallback(
    async (publicationId: string, targetStatus: PublicationStatus) => {
      if (pending) return;

      await withTierCGuard(async () => {
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
      });
    },
    [pending, router, withTierCGuard]
  );

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
              onClick={handleOpenCreateDialog}
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

      <PublishingFilterBar
        initialSearch={initialSearch}
        initialStatus={initialStatus}
        onUpdateQuery={updateUrl}
        onResetAll={handleResetFilters}
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
                onClick={handleOpenCreateDialog}
              >
                Tambah draft konten
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {publications.map((post) => (
            <PublishingItemCard
              key={post.id}
              publication={post}
              currentUserId={currentUserId}
              canCreate={canCreate}
              canReview={canReview}
              canPublish={canPublish}
              pending={pending}
              onTransition={handleTransition}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <PublishingCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          eligibleMedia={eligibleMedia}
          onSubmit={handleCreateDraft}
          pending={pending}
          modalError={modalError}
          onClearModalError={() => setModalError(null)}
        />
      )}
    </div>
  );
}
