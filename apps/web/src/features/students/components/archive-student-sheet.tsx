"use client";

import * as React from "react";
import { FormBottomSheet } from "@/components/patterns";
import { Button, Checkbox, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { PRIVACY_MESSAGES } from "@/lib/messages";

export interface ArchiveStudentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "archive" | "restore";
  targetCount: number;
  studentName?: string;
  onSubmit: (
    reason: string
  ) => Promise<{ success: true } | { success: false; error: string }>;
  pending: boolean;
}

export function ArchiveStudentSheet({
  open,
  onOpenChange,
  mode = "archive",
  targetCount,
  studentName,
  onSubmit,
  pending,
}: ArchiveStudentSheetProps) {
  const [reason, setReason] = React.useState("");
  const [confirmed, setConfirmed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const reasonId = React.useId();
  const confirmId = React.useId();

  const isRestore = mode === "restore";
  const isBulk = targetCount > 1;

  function resetForm() {
    setReason("");
    setConfirmed(false);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!isRestore && trimmed.length < 5) {
      setError("Tuliskan alasan pengarsipan minimal 5 karakter.");
      return;
    }
    if (!confirmed) {
      setError(
        isRestore
          ? "Centang kotak konfirmasi pemulihan terlebih dahulu."
          : "Centang kotak konfirmasi pengarsipan terlebih dahulu."
      );
      return;
    }
    setError(null);
    const res = await onSubmit(trimmed);
    if (!res.success) {
      setError(res.error);
      return;
    }
    resetForm();
  }

  const title = isRestore
    ? isBulk
      ? `Konfirmasi pemulihan ${targetCount} peserta didik`
      : "Konfirmasi pemulihan peserta didik"
    : isBulk
      ? `Konfirmasi pengarsipan ${targetCount} peserta didik`
      : "Konfirmasi pengarsipan peserta didik";

  const targetSubject = isBulk
    ? `${targetCount} peserta didik terpilih`
    : (studentName ?? "Peserta didik ini");

  const description = isRestore
    ? `${targetSubject} akan dikembalikan ke daftar aktif dan dapat diakses kembali pada kegiatan belajar. ${PRIVACY_MESSAGES.auditLogged}`
    : `${targetSubject} akan dipindahkan dari daftar aktif tanpa menghapus riwayat audit atau catatan historis. ${PRIVACY_MESSAGES.auditLogged}`;

  const submitLabel = isRestore
    ? isBulk
      ? `Ya, pulihkan ${targetCount} peserta didik`
      : "Ya, pulihkan peserta didik"
    : isBulk
      ? `Ya, arsipkan ${targetCount} peserta didik`
      : "Ya, arsipkan peserta didik";

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      footer={(formId, isMobile) => (
        <div
          className={cn(
            "flex gap-2 w-full",
            isMobile ? "flex-col-reverse" : "justify-end"
          )}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
            className={isMobile ? "w-full min-h-11" : undefined}
          >
            Batal
          </Button>
          <Button
            type="submit"
            form={formId}
            variant={isRestore ? "primary" : "destructive"}
            loading={pending}
            disabled={!confirmed}
            className={isMobile ? "w-full min-h-11" : undefined}
          >
            {submitLabel}
          </Button>
        </div>
      )}
    >
      {(formId) => (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor={reasonId}
              className="block text-sm font-medium text-foreground"
            >
              {isRestore
                ? "Catatan pemulihan (opsional)"
                : "Alasan pengarsipan *"}
            </label>
            <Textarea
              id={reasonId}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isRestore
                  ? "Contoh: Peserta didik kembali mengikuti kegiatan belajar."
                  : "Contoh: Pembersihan data uji coba atau peserta didik sudah lulus/pindah."
              }
              required={!isRestore}
            />
          </div>

          <label
            htmlFor={confirmId}
            className="flex items-start gap-2.5 rounded-control border border-border bg-surface-subtle p-3 text-xs text-foreground cursor-pointer"
          >
            <Checkbox
              id={confirmId}
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              className="mt-0.5"
            />
            <span className="leading-relaxed">
              {isRestore
                ? "Saya yakin ingin memulihkan peserta didik ini ke daftar aktif."
                : "Saya yakin ingin memindahkan peserta didik ini ke daftar arsip."}
            </span>
          </label>
        </form>
      )}
    </FormBottomSheet>
  );
}
