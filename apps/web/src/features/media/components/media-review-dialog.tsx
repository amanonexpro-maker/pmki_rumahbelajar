"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from "@/components/ui";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import type { MediaAssetDTO } from "../types/media-types";
import {
  mediaReviewFormSchema,
  type MediaReviewFormValues,
} from "../validators/media-validator";

export interface MediaReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: MediaAssetDTO | null;
  onSubmit: (values: MediaReviewFormValues) => Promise<void> | void;
  pending: boolean;
}

const DEFAULT_VALUES: MediaReviewFormValues = {
  eligibleForPublic: true,
  reviewNotes: "",
};

export function MediaReviewDialog({
  open,
  onOpenChange,
  asset,
  onSubmit,
  pending,
}: MediaReviewDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MediaReviewFormValues>({
    resolver: zodResolver(mediaReviewFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, asset?.id, reset]);

  async function handleConfirmReview(values: MediaReviewFormValues) {
    if (!asset || pending) return;
    await onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tinjau dokumentasi</DialogTitle>
          <DialogDescription>
            Tentukan kelayakan publikasi untuk{" "}
            <strong className="text-foreground">{asset?.title}</strong>.
            Pastikan seluruh peserta didik yang tampak telah memiliki
            Persetujuan Foto & Video aktif. {PRIVACY_MESSAGES.auditLogged}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleConfirmReview)} noValidate>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="review-eligibility"
                className="block text-sm font-medium text-foreground"
              >
                Keputusan kelayakan privasi
              </label>
              <Controller
                control={control}
                name="eligibleForPublic"
                render={({ field }) => (
                  <select
                    id="review-eligibility"
                    value={field.value ? "PUBLIC" : "INTERNAL"}
                    onChange={(e) =>
                      field.onChange(e.target.value === "PUBLIC")
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
                )}
              />
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
                placeholder="Catatan hasil pemeriksaan privasi anak..."
                {...register("reviewNotes")}
              />
              {errors.reviewNotes && (
                <p className="text-xs text-danger">
                  {errors.reviewNotes.message}
                </p>
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
              {pending ? "Menyimpan..." : "Simpan keputusan tinjauan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

