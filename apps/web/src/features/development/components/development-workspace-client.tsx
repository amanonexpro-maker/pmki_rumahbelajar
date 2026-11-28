"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CloudOff,
  Download,
  History,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  TrendingUp,
} from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/compositions";
import {
  FeedbackBanner,
  FloatingFeedbackToast,
  PageHeader,
} from "@/components/patterns";
import {
  Badge,
  Button,
  Icon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import type { StudentListItemDTO } from "@/features/students";
import { useConnectivity } from "@/hooks/use-connectivity";
import { useDraftRecovery } from "@/hooks/use-draft-recovery";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { OFFLINE_MESSAGES, SUCCESS_MESSAGES } from "@/lib/messages";
import type { SyncStatus } from "@/lib/status";
import { formatDateID, formatTimeID } from "@/utils/date-formatter";
import {
  listDevelopmentNoteRevisionsAction,
  upsertDevelopmentNoteAction,
} from "../actions/development-actions";
import type {
  DevelopmentCategoryDTO,
  DevelopmentNoteDTO,
  DevelopmentNoteRevisionDTO,
} from "../types/development-types";
import { CategoryQuickFilter } from "./category-quick-filter";
import { NoteFormSheet, type DevelopmentDraftData } from "./note-form-sheet";
import { NoteRevisionsSheet } from "./note-revisions-sheet";

export interface DevelopmentWorkspaceClientProps {
  notes: DevelopmentNoteDTO[];
  categories: DevelopmentCategoryDTO[];
  students: StudentListItemDTO[];
  initialStudentId: string;
  initialCategoryId: string;
  page?: number;
  totalPages?: number;
  totalCount?: number;
  canCreate: boolean;
}

export function DevelopmentWorkspaceClient({
  notes,
  categories,
  students,
  initialStudentId,
  initialCategoryId,
  page = 1,
  totalPages = 1,
  totalCount,
  canCreate,
}: DevelopmentWorkspaceClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: connectivityStatus, markSynced } = useConnectivity();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [syncBadgeState, setSyncBadgeState] =
    React.useState<SyncStatus | null>(null);
  const [toastFeedback, setToastFeedback] = React.useState<{
    tone: "success" | "warning" | "danger";
    message: string;
  } | null>(null);

  // Revision history sheet state
  const [revisionsNote, setRevisionsNote] =
    React.useState<DevelopmentNoteDTO | null>(null);
  const [revisionsLoading, setRevisionsLoading] = React.useState(false);
  const [revisionsError, setRevisionsError] = React.useState<string | null>(
    null
  );
  const [revisions, setRevisions] = React.useState<
    DevelopmentNoteRevisionDTO[]
  >([]);
  const [pdfActionMode, setPdfActionMode] = React.useState<
    "download" | "share" | null
  >(null);
  const pdfCacheRef = React.useRef<
    Map<string, { blob: Blob; filename: string }>
  >(new Map());

  const selectedStudent = React.useMemo(
    () => students.find((s) => s.id === initialStudentId) ?? null,
    [students, initialStudentId]
  );

  function triggerIframeDownload(downloadUrl: string) {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.setAttribute("aria-hidden", "true");
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    window.setTimeout(() => {
      iframe.remove();
    }, 15_000);
  }

  async function handleExportStudentPdf(mode: "download" | "share") {
    if (initialStudentId === "ALL" || pdfActionMode) return;
    setPdfActionMode(mode);
    try {
      const pdfUrl = `/api/development/summary-pdf?studentId=${encodeURIComponent(initialStudentId)}`;

      if (mode === "download") {
        const checkRes = await fetch(`${pdfUrl}&check=1`);
        if (!checkRes.ok) {
          const errPayload = (await checkRes.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          setToastFeedback({
            tone: "danger",
            message:
              errPayload?.error?.message ??
              (checkRes.status === 404
                ? "Endpoint unduh ringkasan PDF tidak ditemukan (404). Muat ulang halaman lalu coba lagi."
                : "Gagal membuat ringkasan perkembangan PDF."),
          });
          return;
        }

        triggerIframeDownload(pdfUrl);
        setToastFeedback({
          tone: "success",
          message: "Ringkasan perkembangan PDF sedang diunduh.",
        });
        return;
      }

      const cacheKey = `${initialStudentId}:${notes.length}:${notes[0]?.updatedAt ?? ""}`;
      let cached = pdfCacheRef.current.get(cacheKey);

      if (!cached) {
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          const errPayload = (await response.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          setToastFeedback({
            tone: "danger",
            message:
              errPayload?.error?.message ??
              (response.status === 404
                ? "Endpoint unduh ringkasan PDF tidak ditemukan (404). Muat ulang halaman lalu coba lagi."
                : "Gagal membuat ringkasan perkembangan PDF."),
          });
          return;
        }

        const blob = await response.blob();
        const disposition = response.headers.get("Content-Disposition") ?? "";
        const filenameMatch = /filename="([^"]+)"/.exec(disposition);
        const filename =
          filenameMatch?.[1] ?? "ringkasan-perkembangan-peserta-didik.pdf";
        cached = { blob, filename };
        pdfCacheRef.current.set(cacheKey, cached);
      }

      const { blob, filename } = cached;
      const pdfFile = new File([blob], filename, { type: "application/pdf" });
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `Ringkasan Perkembangan · ${selectedStudent?.fullName ?? "Peserta Didik"}`,
            text: `Berikut ringkasan perkembangan ${selectedStudent?.fullName ?? "peserta didik"} dari Rumah Belajar PMKI.`,
          });
          setToastFeedback({
            tone: "success",
            message: "Ringkasan perkembangan PDF siap dibagikan.",
          });
          return;
        } catch (shareError) {
          if (
            shareError instanceof Error &&
            shareError.name === "AbortError"
          ) {
            return;
          }
        }
      }

      triggerIframeDownload(pdfUrl);
      setToastFeedback({
        tone: "warning",
        message:
          "Perangkat ini belum mendukung berbagi file langsung; PDF sedang diunduh.",
      });
    } catch {
      setToastFeedback({
        tone: "danger",
        message: "Terjadi gangguan saat membuat ringkasan perkembangan PDF.",
      });
    } finally {
      setPdfActionMode(null);
    }
  }

  const defaultDraft = React.useMemo<DevelopmentDraftData>(
    () => ({
      noteId: null,
      studentId:
        initialStudentId !== "ALL"
          ? initialStudentId
          : (students[0]?.id ?? ""),
      categoryId:
        initialCategoryId !== "ALL"
          ? initialCategoryId
          : (categories[0]?.id ?? ""),
      observation: "",
      progress: "",
      followUp: "",
      confidential: true,
    }),
    [categories, initialCategoryId, initialStudentId, students]
  );

  const draftKey = `development:${defaultDraft.studentId || "default"}`;
  const {
    draft,
    setDraft,
    hasRecoveredDraft,
    saveDraftNow,
    clearDraft,
  } = useDraftRecovery<DevelopmentDraftData>(
    draftKey,
    "development_note",
    defaultDraft
  );

  const { pendingCount, enqueue, flushQueue } = useOfflineQueue(() => {
    setSyncBadgeState("SYNCED");
    setToastFeedback({
      tone: "success",
      message: SUCCESS_MESSAGES.developmentNoteAdded,
    });
    router.refresh();
  });

  function updateUrl(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(updates)) {
      if (!v || v === "ALL") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function openNewNoteDialog() {
    setFormError(null);
    setDraft({
      noteId: null,
      studentId:
        initialStudentId !== "ALL"
          ? initialStudentId
          : (students[0]?.id ?? ""),
      categoryId:
        initialCategoryId !== "ALL"
          ? initialCategoryId
          : (categories[0]?.id ?? ""),
      observation: hasRecoveredDraft ? draft.observation : "",
      progress: hasRecoveredDraft ? draft.progress : "",
      followUp: hasRecoveredDraft ? draft.followUp : "",
      confidential: true,
    });
    setDialogOpen(true);
  }

  function openEditRevisionDialog(note: DevelopmentNoteDTO) {
    setFormError(null);
    setDraft({
      noteId: note.id,
      studentId: note.studentId,
      categoryId: note.categoryId,
      observation: note.observation,
      progress: note.progress ?? "",
      followUp: note.followUp ?? "",
      confidential: note.confidential,
    });
    setDialogOpen(true);
  }

  async function openRevisionsSheet(note: DevelopmentNoteDTO) {
    setRevisionsNote(note);
    setRevisions([]);
    setRevisionsError(null);
    setRevisionsLoading(true);
    try {
      const res = await listDevelopmentNoteRevisionsAction(note.id);
      if (!res.success) {
        setRevisionsError(res.error.message);
        return;
      }
      setRevisions(res.data);
    } catch {
      setRevisionsError("Gagal memuat riwayat revisi catatan perkembangan.");
    } finally {
      setRevisionsLoading(false);
    }
  }

  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate || submitting) return;
    setSubmitting(true);
    setFormError(null);

    const payload = {
      noteId: draft.noteId,
      studentId: draft.studentId,
      categoryId: draft.categoryId,
      observation: draft.observation.trim(),
      progress: draft.progress.trim() || null,
      followUp: draft.followUp.trim() || null,
      confidential: draft.confidential,
    };

    try {
      if (connectivityStatus === "OFFLINE") {
        await enqueue({
          operation: "DEVELOPMENT_NOTE_UPSERT",
          entityType: "development_note",
          entityId: draft.noteId ?? draft.studentId,
          payload: {
            ...payload,
            recordedOfflineAt: new Date().toISOString(),
            isOfflineSync: true,
          },
        });
        await clearDraft();
        setSyncBadgeState("PENDING_SYNC");
        setDialogOpen(false);
        setToastFeedback({
          tone: "warning",
          message: OFFLINE_MESSAGES.savedLocally,
        });
        return;
      }

      const res = await upsertDevelopmentNoteAction(payload);
      if (!res.success) {
        setFormError(res.error.message);
        return;
      }

      await clearDraft();
      markSynced();
      setSyncBadgeState("SYNCED");
      setDialogOpen(false);
      setToastFeedback({
        tone: "success",
        message: res.data.isNewRevisionOnExisting
          ? `Revisi catatan perkembangan v${res.data.version} berhasil disimpan.`
          : SUCCESS_MESSAGES.developmentNoteAdded,
      });
      router.refresh();
    } catch {
      await enqueue({
        operation: "DEVELOPMENT_NOTE_UPSERT",
        entityType: "development_note",
        entityId: draft.noteId ?? draft.studentId,
        payload: {
          ...payload,
          recordedOfflineAt: new Date().toISOString(),
          isOfflineSync: true,
        },
      });
      await clearDraft();
      setSyncBadgeState("PENDING_SYNC");
      setDialogOpen(false);
      setToastFeedback({
        tone: "warning",
        message: OFFLINE_MESSAGES.savedLocally,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perkembangan Peserta"
        description="Catatan kemajuan belajar, karakter, dan rencana tindak lanjut secara berversi. Bersifat rahasia (CONFIDENTIAL) secara bawaan."
        badge={
          syncBadgeState ? (
            <StatusBadge domain="sync" status={syncBadgeState} />
          ) : undefined
        }
        primaryAction={
          canCreate ? (
            <Button
              type="button"
              variant="primary"
              onClick={openNewNoteDialog}
              leftIcon={<Icon icon={Plus} size="sm" />}
            >
              Tambah catatan perkembangan
            </Button>
          ) : undefined
        }
        secondaryActions={
          pendingCount > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void flushQueue()}
              leftIcon={<Icon icon={RefreshCw} size="xs" />}
            >
              Sinkronkan antrean ({pendingCount})
            </Button>
          ) : undefined
        }
      />

      {/* URL Filter Bar (?studentId=&categoryId=) */}
      <div className="rounded-card border border-border bg-surface p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor="dev-student-filter"
            className="block text-xs font-medium text-secondary-foreground"
          >
            Filter peserta didik
          </label>
          <Select
            value={initialStudentId}
            onValueChange={(value) =>
              updateUrl({ studentId: value, page: null })
            }
          >
            <SelectTrigger id="dev-student-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
              <SelectItem value="ALL">Semua peserta didik</SelectItem>
              {students.map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  {st.fullName} ({st.educationLevelLabel})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="dev-category-filter"
            className="block text-xs font-medium text-secondary-foreground"
          >
            Filter kategori perkembangan
          </label>
          <Select
            value={initialCategoryId}
            onValueChange={(value) =>
              updateUrl({ categoryId: value, page: null })
            }
          >
            <SelectTrigger id="dev-category-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
              <SelectItem value="ALL">Semua kategori</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CategoryQuickFilter
          categories={categories}
          activeCategoryId={initialCategoryId}
          onSelectCategory={(catId) =>
            updateUrl({ categoryId: catId, page: null })
          }
        />
      </div>

      {initialStudentId !== "ALL" && (
        <div className="rounded-card border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              Ringkasan PDF
              {selectedStudent ? ` · ${selectedStudent.fullName}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Unduh atau bagikan ringkasan perkembangan ke orang tua/wali.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={
                pdfActionMode !== null || connectivityStatus === "OFFLINE"
              }
              onClick={() => void handleExportStudentPdf("download")}
              leftIcon={<Icon icon={Download} size="xs" />}
              className="w-full sm:w-auto"
            >
              {pdfActionMode === "download" ? "Mengunduh..." : "Unduh PDF"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={
                pdfActionMode !== null || connectivityStatus === "OFFLINE"
              }
              onClick={() => void handleExportStudentPdf("share")}
              leftIcon={<Icon icon={Share2} size="xs" />}
              className="w-full sm:w-auto"
            >
              {pdfActionMode === "share" ? "Menyiapkan..." : "Bagikan"}
            </Button>
          </div>
        </div>
      )}

      {hasRecoveredDraft && draft.observation.trim().length > 0 && (
        <FeedbackBanner
          tone="warning"
          message={
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <span className="flex items-center gap-1.5">
                <Icon icon={CloudOff} size="xs" />
                <span>
                  Draft catatan perkembangan lokal tersedia di perangkat ini
                  (Disimpan lokal).
                </span>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={openNewNoteDialog}
                >
                  Lanjutkan menulis
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void clearDraft()}
                >
                  Hapus draft
                </Button>
              </div>
            </div>
          }
        />
      )}

      {notes.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Belum ada catatan perkembangan."
          description="Tambahkan catatan perkembangan peserta didik untuk mendokumentasikan hasil pengamatan belajar dan karakter secara berkala."
          action={
            canCreate ? (
              <Button
                type="button"
                variant="primary"
                onClick={openNewNoteDialog}
              >
                Tambah catatan perkembangan
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <article
              key={note.id}
              className="rounded-card border border-border bg-surface p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">
                      {note.studentFullName}
                    </h2>
                    <Badge variant="primary" size="sm">
                      {note.categoryName}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      Versi {note.version}
                    </Badge>
                    {note.confidential && (
                      <Badge variant="confidential" size="sm">
                        Catatan rahasia
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dicatat oleh {note.teacherName} ·{" "}
                    {formatDateID(note.updatedAt)},{" "}
                    {formatTimeID(note.updatedAt)} WIB
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void openRevisionsSheet(note)}
                    leftIcon={<Icon icon={History} size="xs" />}
                    className="w-full sm:w-auto min-h-11 sm:min-h-9"
                  >
                    Riwayat revisi
                  </Button>
                  {canCreate && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditRevisionDialog(note)}
                      leftIcon={<Icon icon={Pencil} size="xs" />}
                      className="w-full sm:w-auto min-h-11 sm:min-h-9"
                    >
                      Revisi (v{note.version + 1})
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-border-subtle text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Pengamatan
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {note.observation}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Kemajuan belajar
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {note.progress || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Rencana tindak lanjut
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {note.followUp || "—"}
                  </p>
                </div>
              </div>
            </article>
          ))}

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-secondary-foreground">
              <span>
                Halaman <strong className="text-foreground">{page}</strong> dari{" "}
                <strong className="text-foreground">{totalPages}</strong> (
                {totalCount ?? notes.length} catatan)
              </span>
              <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() =>
                    updateUrl({ page: page - 1 <= 1 ? null : String(page - 1) })
                  }
                  className="w-full sm:w-auto min-h-11 sm:min-h-9"
                >
                  Sebelumnya
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => updateUrl({ page: String(page + 1) })}
                  className="w-full sm:w-auto min-h-11 sm:min-h-9"
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <NoteFormSheet
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        draft={draft}
        students={students}
        categories={categories}
        submitting={submitting}
        errorMessage={formError}
        onClearError={() => setFormError(null)}
        onUpdateDraft={(updater, markLocalSaved) => {
          if (markLocalSaved) setSyncBadgeState("LOCAL_SAVED");
          setDraft((prev) => {
            const next = updater(prev);
            void saveDraftNow(next);
            return next;
          });
        }}
        onSubmit={handleSaveNote}
      />

      <NoteRevisionsSheet
        open={Boolean(revisionsNote)}
        onOpenChange={(open) => {
          if (!open) setRevisionsNote(null);
        }}
        studentName={revisionsNote?.studentFullName ?? ""}
        categoryName={revisionsNote?.categoryName ?? ""}
        loading={revisionsLoading}
        error={revisionsError}
        revisions={revisions}
      />

      {toastFeedback && (
        <FloatingFeedbackToast
          tone={toastFeedback.tone}
          message={toastFeedback.message}
          onDismiss={() => setToastFeedback(null)}
        />
      )}
    </div>
  );
}
