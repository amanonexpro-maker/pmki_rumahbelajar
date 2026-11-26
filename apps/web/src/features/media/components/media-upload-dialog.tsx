"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { DatePicker } from "@/components/patterns";
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
import { useMediaUpload } from "../hooks/use-media-upload";
import { MEDIA_CATEGORY_LABELS } from "../types/media-types";
import {
  MEDIA_CATEGORY_VALUES,
  mediaUploadFormSchema,
  type MediaUploadFormValues,
} from "../validators/media-validator";

export interface MediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  pending?: boolean;
}

function getDefaultValues(): Partial<MediaUploadFormValues> {
  return {
    title: "",
    description: "",
    category: "KEGIATAN",
    capturedDate: new Date().toISOString().slice(0, 10),
    file: undefined,
  };
}

export function MediaUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  pending = false,
}: MediaUploadDialogProps) {
  const { startUpload, isUploading, uploadError, resetError } =
    useMediaUpload();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MediaUploadFormValues>({
    resolver: zodResolver(mediaUploadFormSchema),
    defaultValues: getDefaultValues(),
  });

  const isPending = pending || isUploading;

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetError();
      reset(getDefaultValues());
    }
    onOpenChange(nextOpen);
  }

  async function handleFormSubmit(values: MediaUploadFormValues) {
    if (isPending) return;

    const succeeded = await startUpload(values.file, {
      title: values.title,
      description: values.description,
      category: values.category,
      capturedDate: values.capturedDate,
    });

    if (succeeded) {
      reset(getDefaultValues());
      onOpenChange(false);
      onSuccess();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unggah dokumentasi</DialogTitle>
          <DialogDescription>
            Berkas diunggah langsung ke bucket privat Supabase menggunakan
            tautan berpenanda tangan (signed upload URL) dan wajib melalui
            tinjauan privasi sebelum tampil di publik.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <DialogBody className="space-y-4">
            {uploadError && (
              <div
                role="alert"
                className="rounded-control border border-danger/30 bg-danger-soft px-3 py-2.5 text-xs text-danger"
              >
                {uploadError}
              </div>
            )}

            <div className="space-y-1">
              <label
                htmlFor="media-title"
                className="block text-xs font-medium text-foreground"
              >
                Judul dokumentasi *
              </label>
              <Input
                id="media-title"
                placeholder="Contoh: Kegiatan Membaca Bersama Sabtu Ceria"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-danger">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="media-category"
                  className="block text-xs font-medium text-foreground"
                >
                  Kategori dokumentasi *
                </label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="media-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                        {MEDIA_CATEGORY_VALUES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {MEDIA_CATEGORY_LABELS[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && (
                  <p className="text-xs text-danger">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Controller
                  control={control}
                  name="capturedDate"
                  render={({ field }) => (
                    <DatePicker
                      id="media-date"
                      label="Tanggal kegiatan"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.capturedDate && (
                  <p className="text-xs text-danger">
                    {errors.capturedDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="media-file"
                className="block text-xs font-medium text-foreground"
              >
                Berkas foto (JPEG, PNG, atau WebP · maks. 10 MB)
              </label>
              <Controller
                control={control}
                name="file"
                render={({ field }) => (
                  <Input
                    id="media-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onChange={(e) => {
                      const nextFile = e.target.files?.[0];
                      field.onChange(nextFile);
                    }}
                  />
                )}
              />
              {errors.file && (
                <p className="text-xs text-danger">{errors.file.message}</p>
              )}
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
                placeholder="Konteks kegiatan dan catatan peserta yang terlibat..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-danger">
                  {errors.description.message}
                </p>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleDialogOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? "Mengunggah..." : "Unggah dokumentasi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

