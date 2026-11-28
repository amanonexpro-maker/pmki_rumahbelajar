"use client";

import * as React from "react";
import { FeedbackBanner, FormBottomSheet } from "@/components/patterns";
import {
  Button,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import type { StudentListItemDTO } from "@/features/students";
import type { DevelopmentCategoryDTO } from "../types/development-types";

export interface DevelopmentDraftData {
  noteId: string | null;
  studentId: string;
  categoryId: string;
  observation: string;
  progress: string;
  followUp: string;
  confidential: boolean;
}

export interface NoteFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: DevelopmentDraftData;
  students: StudentListItemDTO[];
  categories: DevelopmentCategoryDTO[];
  submitting: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
  onUpdateDraft: (
    updater: (prev: DevelopmentDraftData) => DevelopmentDraftData,
    markLocalSaved?: boolean
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function NoteFormSheet({
  open,
  onOpenChange,
  draft,
  students,
  categories,
  submitting,
  errorMessage,
  onClearError,
  onUpdateDraft,
  onSubmit,
}: NoteFormSheetProps) {
  const studentFieldId = React.useId();
  const categoryFieldId = React.useId();
  const observationFieldId = React.useId();
  const progressFieldId = React.useId();
  const followUpFieldId = React.useId();
  const confidentialFieldId = React.useId();

  const renderFooter = (formId: string, isMobile: boolean) => (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onOpenChange(false)}
        disabled={submitting}
        fullWidth={isMobile}
      >
        Batal
      </Button>
      <Button
        type="submit"
        form={formId}
        variant="primary"
        disabled={submitting}
        fullWidth={isMobile}
      >
        {submitting ? "Menyimpan..." : "Simpan catatan perkembangan"}
      </Button>
    </>
  );

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        draft.noteId
          ? "Tambah revisi catatan perkembangan"
          : "Tambah catatan perkembangan"
      }
      description={
        draft.noteId
          ? "Perubahan akan disimpan sebagai versi baru tanpa menghapus riwayat revisi sebelumnya."
          : "Dokumentasikan pengamatan perkembangan peserta didik. Secara bawaan catatan bersifat rahasia."
      }
      footer={renderFooter}
    >
      {(formId) => (
        <form id={formId} onSubmit={onSubmit} className="space-y-4">
          {errorMessage && (
            <FeedbackBanner
              tone="danger"
              message={errorMessage}
              onDismiss={onClearError}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor={studentFieldId}
                className="block text-xs font-medium text-foreground"
              >
                Peserta didik *
              </label>
              <Select
                value={draft.studentId}
                disabled={Boolean(draft.noteId)}
                onValueChange={(val) =>
                  onUpdateDraft((prev) => ({ ...prev, studentId: val }))
                }
              >
                <SelectTrigger id={studentFieldId}>
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
                htmlFor={categoryFieldId}
                className="block text-xs font-medium text-foreground"
              >
                Kategori perkembangan *
              </label>
              <Select
                value={draft.categoryId}
                onValueChange={(val) =>
                  onUpdateDraft((prev) => ({ ...prev, categoryId: val }))
                }
              >
                <SelectTrigger id={categoryFieldId}>
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
              htmlFor={observationFieldId}
              className="block text-xs font-medium text-foreground"
            >
              Hasil pengamatan *
            </label>
            <Textarea
              id={observationFieldId}
              rows={3}
              required
              placeholder="Tuliskan hasil pengamatan perilaku, literasi, atau pemahaman peserta didik..."
              value={draft.observation}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateDraft((prev) => ({ ...prev, observation: val }), true);
              }}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor={progressFieldId}
              className="block text-xs font-medium text-foreground"
            >
              Kemajuan belajar (opsional)
            </label>
            <Textarea
              id={progressFieldId}
              rows={2}
              placeholder="Perkembangan positif yang terlihat dibanding sesi sebelumnya..."
              value={draft.progress}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateDraft((prev) => ({ ...prev, progress: val }), true);
              }}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor={followUpFieldId}
              className="block text-xs font-medium text-foreground"
            >
              Rencana tindak lanjut (opsional)
            </label>
            <Textarea
              id={followUpFieldId}
              rows={2}
              placeholder="Langkah pendampingan pada pertemuan berikutnya..."
              value={draft.followUp}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateDraft((prev) => ({ ...prev, followUp: val }), true);
              }}
            />
          </div>

          <label
            htmlFor={confidentialFieldId}
            className="flex items-start gap-2.5 rounded-control border border-border bg-surface-subtle/50 p-3 text-xs text-foreground cursor-pointer"
          >
            <Checkbox
              id={confidentialFieldId}
              checked={draft.confidential}
              onCheckedChange={(checked) =>
                onUpdateDraft((prev) => ({
                  ...prev,
                  confidential: checked === true,
                }))
              }
              className="mt-0.5"
            />
            <span className="leading-relaxed">
              <strong>Catatan rahasia (CONFIDENTIAL — bawaan):</strong> Hanya
              dapat dilihat oleh pengajar pencatat dan koordinator peninjau yang
              memiliki izin <code>development.review</code>.
            </span>
          </label>
        </form>
      )}
    </FormBottomSheet>
  );
}

