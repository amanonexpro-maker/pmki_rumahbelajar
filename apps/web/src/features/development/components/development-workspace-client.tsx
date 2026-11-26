"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CloudOff,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/compositions";
import { PageHeader } from "@/components/patterns";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import type { StudentListItemDTO } from "@/features/students";
import { useConnectivity } from "@/hooks/use-connectivity";
import { useDraftRecovery } from "@/hooks/use-draft-recovery";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { OFFLINE_MESSAGES, SUCCESS_MESSAGES } from "@/lib/messages";
import type { SyncStatus } from "@/lib/status";
import { upsertDevelopmentNoteAction } from "../actions/development-actions";
import type {
  DevelopmentCategoryDTO,
  DevelopmentNoteDTO,
} from "../types/development-types";

interface DevelopmentDraftData {
  noteId: string | null;
  studentId: string;
  categoryId: string;
  observation: string;
  progress: string;
  followUp: string;
  confidential: boolean;
}

export interface DevelopmentWorkspaceClientProps {
  notes: DevelopmentNoteDTO[];
  categories: DevelopmentCategoryDTO[];
  students: StudentListItemDTO[];
  initialStudentId: string;
  initialCategoryId: string;
  canCreate: boolean;
}

export function DevelopmentWorkspaceClient({
  notes,
  categories,
  students,
  initialStudentId,
  initialCategoryId,
  canCreate,
}: DevelopmentWorkspaceClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: connectivityStatus, markSynced } = useConnectivity();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [syncBadgeState, setSyncBadgeState] =
    React.useState<SyncStatus | null>(null);
  const [feedbackBanner, setFeedbackBanner] = React.useState<{
    tone: "success" | "warning" | "danger";
    message: string;
  } | null>(null);

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
    setFeedbackBanner({
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

  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate || submitting) return;

    const payload = {
      noteId: draft.noteId,
      studentId: draft.studentId,
      categoryId: draft.categoryId,
      observation: draft.observation.trim(),
      progress: draft.progress.trim() || null,
      followUp: draft.followUp.trim() || null,
      confidential: draft.confidential,
    };

    const isOffline =
      connectivityStatus === "OFFLINE" ||
      (typeof navigator !== "undefined" && navigator.onLine === false);

    if (isOffline) {
      await saveDraftNow(draft);
      await enqueue({
        operation: "DEVELOPMENT_NOTE_UPSERT",
        entityType: "development_note",
        entityId: draft.noteId ?? `${draft.studentId}:${Date.now()}`,
        payload,
      });
      setDialogOpen(false);
      setSyncBadgeState("PENDING_SYNC");
      setFeedbackBanner({
        tone: "warning",
        message: `${OFFLINE_MESSAGES.savedLocally} ${OFFLINE_MESSAGES.syncPending}`,
      });
      return;
    }

    setSubmitting(true);
    setFeedbackBanner(null);

    try {
      const res = await upsertDevelopmentNoteAction(payload);
      if (!res.success) {
        setFeedbackBanner({
          tone: "danger",
          message: res.error.message,
        });
        return;
      }

      await clearDraft();
      markSynced();
      setDialogOpen(false);
      setSyncBadgeState("SYNCED");
      setFeedbackBanner({
        tone: "success",
        message: SUCCESS_MESSAGES.developmentNoteAdded,
      });
      router.refresh();
    } catch {
      await saveDraftNow(draft);
      await enqueue({
        operation: "DEVELOPMENT_NOTE_UPSERT",
        entityType: "development_note",
        entityId: draft.noteId ?? `${draft.studentId}:${Date.now()}`,
        payload,
      });
      setDialogOpen(false);
      setSyncBadgeState("PENDING_SYNC");
      setFeedbackBanner({
        tone: "warning",
        message: `${OFFLINE_MESSAGES.savedLocally} ${OFFLINE_MESSAGES.syncPending}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perkembangan Peserta"
        description="Catat pengamatan, kemajuan belajar, dan rencana tindak lanjut peserta didik. Catatan bersifat rahasia secara bawaan dan berversi (tidak menimpa riwayat sebelumnya)."
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
            onValueChange={(value) => updateUrl({ studentId: value })}
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
            onValueChange={(value) => updateUrl({ categoryId: value })}
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
      </div>

      {hasRecoveredDraft && draft.observation.trim().length > 0 && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-warning/30 bg-warning-soft px-4 py-2.5 text-xs text-foreground"
        >
          <div className="flex items-center gap-2">
            <Icon icon={CloudOff} size="xs" className="text-warning" />
            <span>
              Draft catatan perkembangan lokal tersedia di perangkat ini
              (Disimpan lokal).
            </span>
          </div>
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
      )}

      {feedbackBanner && (
        <div
          role={feedbackBanner.tone === "danger" ? "alert" : "status"}
          className={
            feedbackBanner.tone === "success"
              ? "rounded-control border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
              : feedbackBanner.tone === "warning"
                ? "rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-foreground"
                : "rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          }
        >
          {feedbackBanner.message}
        </div>
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
              className="rounded-card border border-border bg-surface p-5 space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
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
                        <Icon icon={Lock} size="xs" />
                        <span>Catatan rahasia</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dicatat oleh {note.teacherName} ·{" "}
                    {new Date(note.updatedAt).toLocaleString("id-ID")}
                  </p>
                </div>

                {canCreate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditRevisionDialog(note)}
                    leftIcon={<Icon icon={Pencil} size="xs" />}
                  >
                    Tambah revisi (v{note.version + 1})
                  </Button>
                )}
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
        </div>
      )}

      {/* Dialog: Tambah / Revisi Catatan Perkembangan */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft.noteId
                ? "Tambah revisi catatan perkembangan"
                : "Tambah catatan perkembangan"}
            </DialogTitle>
            <DialogDescription>
              {draft.noteId
                ? "Perubahan akan disimpan sebagai versi baru tanpa menghapus riwayat revisi sebelumnya."
                : "Dokumentasikan pengamatan perkembangan peserta didik. Secara bawaan catatan bersifat rahasia."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveNote}>
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="note-student"
                    className="block text-xs font-medium text-foreground"
                  >
                    Peserta didik *
                  </label>
                  <Select
                    value={draft.studentId}
                    disabled={Boolean(draft.noteId)}
                    onValueChange={(val) => {
                      setDraft((prev) => {
                        const next = { ...prev, studentId: val };
                        void saveDraftNow(next);
                        return next;
                      });
                    }}
                  >
                    <SelectTrigger id="note-student">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                      {students.map((st) => (
                        <SelectItem key={st.id} value={st.id}>
                          {st.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="note-category"
                    className="block text-xs font-medium text-foreground"
                  >
                    Kategori perkembangan *
                  </label>
                  <Select
                    value={draft.categoryId}
                    onValueChange={(val) => {
                      setDraft((prev) => {
                        const next = { ...prev, categoryId: val };
                        void saveDraftNow(next);
                        return next;
                      });
                    }}
                  >
                    <SelectTrigger id="note-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="note-observation"
                  className="block text-xs font-medium text-foreground"
                >
                  Hasil pengamatan *
                </label>
                <Textarea
                  id="note-observation"
                  rows={3}
                  required
                  placeholder="Tuliskan hasil pengamatan perilaku, literasi, atau pemahaman peserta didik..."
                  value={draft.observation}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSyncBadgeState("LOCAL_SAVED");
                    setDraft((prev) => {
                      const next = { ...prev, observation: val };
                      void saveDraftNow(next);
                      return next;
                    });
                  }}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="note-progress"
                  className="block text-xs font-medium text-foreground"
                >
                  Kemajuan belajar (opsional)
                </label>
                <Textarea
                  id="note-progress"
                  rows={2}
                  placeholder="Perkembangan positif yang terlihat dibanding sesi sebelumnya..."
                  value={draft.progress}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSyncBadgeState("LOCAL_SAVED");
                    setDraft((prev) => {
                      const next = { ...prev, progress: val };
                      void saveDraftNow(next);
                      return next;
                    });
                  }}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="note-followup"
                  className="block text-xs font-medium text-foreground"
                >
                  Rencana tindak lanjut (opsional)
                </label>
                <Textarea
                  id="note-followup"
                  rows={2}
                  placeholder="Langkah pendampingan pada pertemuan berikutnya..."
                  value={draft.followUp}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSyncBadgeState("LOCAL_SAVED");
                    setDraft((prev) => {
                      const next = { ...prev, followUp: val };
                      void saveDraftNow(next);
                      return next;
                    });
                  }}
                />
              </div>

              <label className="flex items-start gap-2.5 rounded-control border border-border bg-surface-subtle/50 p-3 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={draft.confidential}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDraft((prev) => {
                      const next = { ...prev, confidential: checked };
                      void saveDraftNow(next);
                      return next;
                    });
                  }}
                />
                <span>
                  <strong>Catatan rahasia (CONFIDENTIAL — bawaan):</strong>{" "}
                  Hanya dapat dilihat oleh pengajar pencatat dan koordinator
                  peninjau yang memiliki izin <code>development.review</code>.
                </span>
              </label>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting
                  ? "Menyimpan..."
                  : "Simpan catatan perkembangan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

