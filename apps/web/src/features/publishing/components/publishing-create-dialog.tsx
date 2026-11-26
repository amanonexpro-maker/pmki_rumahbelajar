"use client";

import * as React from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import type { MediaAssetDTO } from "@/features/media";
import { cn } from "@/lib/cn";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import { PUBLICATION_CATEGORY_LABELS } from "../types/publishing-types";
import {
  clearLocalPublicationDraft,
  loadLocalPublicationDraft,
  saveLocalPublicationDraft,
} from "../utils/publishing-utils";
import {
  createPublicationFormSchema,
  PUBLICATION_CATEGORY_VALUES,
  type CreatePublicationFormValues,
} from "../validators/publishing-validator";

export interface PublishingCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eligibleMedia: MediaAssetDTO[];
  onSubmit: (values: CreatePublicationFormValues) => Promise<boolean>;
  pending: boolean;
  modalError: string | null;
  onClearModalError: () => void;
}

const DEFAULT_VALUES: CreatePublicationFormValues = {
  title: "",
  category: "BERITA",
  excerpt: "",
  content: "",
  coverMediaId: "",
};

export function PublishingCreateDialog({
  open,
  onOpenChange,
  eligibleMedia,
  onSubmit,
  pending,
  modalError,
  onClearModalError,
}: PublishingCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <PublishingCreateForm
          onOpenChange={onOpenChange}
          eligibleMedia={eligibleMedia}
          onSubmit={onSubmit}
          pending={pending}
          modalError={modalError}
          onClearModalError={onClearModalError}
        />
      )}
    </Dialog>
  );
}

function PublishingCreateForm({
  onOpenChange,
  eligibleMedia,
  onSubmit,
  pending,
  modalError,
  onClearModalError,
}: Omit<PublishingCreateDialogProps, "open">) {
  const [initialDraft] = React.useState(() => loadLocalPublicationDraft());
  const [hasRecoveredDraft, setHasRecoveredDraft] = React.useState(() =>
    Boolean(initialDraft)
  );
  const [draftDismissed, setDraftDismissed] = React.useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = React.useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreatePublicationFormValues>({
    resolver: zodResolver(createPublicationFormSchema),
    defaultValues: initialDraft
      ? {
          title: initialDraft.title ?? "",
          category: initialDraft.category ?? "BERITA",
          excerpt: initialDraft.excerpt ?? "",
          content: initialDraft.content ?? "",
          coverMediaId: initialDraft.coverMediaId ?? "",
        }
      : DEFAULT_VALUES,
  });

  const watchedValues = useWatch({ control });
  const coverMediaId = watchedValues.coverMediaId ?? "";

  // Debounced auto-save to localStorage (non-sensitive text fields only)
  React.useEffect(() => {
    const titleVal = watchedValues.title ?? "";
    const contentVal = watchedValues.content ?? "";
    const excerptVal = watchedValues.excerpt ?? "";
    if (!titleVal.trim() && !contentVal.trim() && !excerptVal.trim()) return;

    const timer = window.setTimeout(() => {
      saveLocalPublicationDraft({
        title: titleVal,
        category: watchedValues.category ?? "BERITA",
        excerpt: excerptVal,
        content: contentVal,
        coverMediaId: watchedValues.coverMediaId ?? "",
      });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [watchedValues]);

  function handleClearDraft() {
    clearLocalPublicationDraft();
    reset(DEFAULT_VALUES);
    setHasRecoveredDraft(false);
    setDraftDismissed(true);
    setClearConfirmOpen(false);
    onClearModalError();
  }

  async function handleFormSubmit(values: CreatePublicationFormValues) {
    if (pending) return;
    const succeeded = await onSubmit(values);
    if (succeeded) {
      clearLocalPublicationDraft();
      reset(DEFAULT_VALUES);
      setHasRecoveredDraft(false);
    }
  }

  return (
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

        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
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
                    Draf lokal ditemukan. Konten telah dipulihkan dari perangkat
                    ini.
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
                  Apakah Anda yakin ingin menghapus draf lokal ini? Naskah yang
                  belum disimpan akan hilang.
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
                placeholder="Contoh: Semangat Belajar Matematika Sabtu Ceria di Griya Asih"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-danger">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="pub-category"
                className="block text-xs font-medium text-foreground"
              >
                Kategori *
              </label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="pub-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                      {PUBLICATION_CATEGORY_VALUES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {PUBLICATION_CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-xs text-danger">{errors.category.message}</p>
              )}
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
                    onClick={() => setValue("coverMediaId", "")}
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
                  onClick={() => setValue("coverMediaId", "")}
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
                      onClick={() => setValue("coverMediaId", m.id)}
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
                          <Image
                            src={m.signedReadUrl}
                            alt={m.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 150px"
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
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
                placeholder="Ringkasan 1–2 kalimat untuk kartu berita publik..."
                {...register("excerpt")}
              />
              {errors.excerpt && (
                <p className="text-xs text-danger">{errors.excerpt.message}</p>
              )}
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
                placeholder="Tuliskan isi berita atau cerita kegiatan dengan bahasa hangat dan menghormati privasi peserta didik..."
                {...register("content")}
              />
              {errors.content && (
                <p className="text-xs text-danger">{errors.content.message}</p>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
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
  );
}

