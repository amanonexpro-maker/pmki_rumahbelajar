"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { FormBottomSheet } from "@/components/patterns";
import { Badge, Button, Icon } from "@/components/ui";
import { useConnectivity } from "@/hooks/use-connectivity";
import { cn } from "@/lib/cn";
import type { StudentImportPreviewResult } from "../services/student-import-service";

export interface ImportStudentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (importedCount: number) => void;
}

export function ImportStudentsSheet({
  open,
  onOpenChange,
  onImported,
}: ImportStudentsSheetProps) {
  const { status } = useConnectivity();
  const isOffline = status === "OFFLINE";
  const fileInputId = React.useId();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [preview, setPreview] =
    React.useState<StudentImportPreviewResult | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function resetState() {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setPending(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setPreview(null);
    setError(null);

    if (!file) return;
    if (isOffline) {
      setError("Impor peserta didik memerlukan koneksi internet aktif.");
      return;
    }

    setPending(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", "preview");

      const res = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error?.message ?? "Gagal memeriksa berkas Excel.");
        return;
      }
      setPreview(json.data as StudentImportPreviewResult);
    } catch {
      setError("Terjadi gangguan jaringan saat memeriksa berkas Excel.");
    } finally {
      setPending(false);
    }
  }

  async function handleCommit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setError("Pilih berkas Excel (.xlsx) terlebih dahulu.");
      return;
    }
    if (isOffline) {
      setError("Impor peserta didik memerlukan koneksi internet aktif.");
      return;
    }
    if (!preview || preview.validCount === 0) {
      setError("Tidak ada baris valid yang siap disimpan.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mode", "commit");

      const res = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error?.message ?? "Gagal menyimpan data peserta didik.");
        return;
      }

      const count = Number(json.data?.importedCount ?? 0);
      resetState();
      onOpenChange(false);
      onImported(count);
    } catch {
      setError("Terjadi gangguan jaringan saat menyimpan data peserta didik.");
    } finally {
      setPending(false);
    }
  }

  const submitLabel =
    preview && preview.validCount > 0
      ? `Simpan ${preview.validCount} peserta didik`
      : "Simpan peserta didik";

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Impor peserta didik (.xlsx)"
      description="Unggah data peserta didik menggunakan templat resmi. Seluruh data hasil impor berstatus Pendaftaran masuk (menunggu verifikasi)."
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
            variant="primary"
            loading={pending}
            disabled={isOffline || !preview || preview.validCount === 0}
            className={isMobile ? "w-full min-h-11" : undefined}
          >
            {submitLabel}
          </Button>
        </div>
      )}
    >
      {(formId) => (
        <form id={formId} onSubmit={handleCommit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger"
            >
              {error}
            </div>
          )}

          <div className="rounded-control border border-border bg-surface-subtle p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 text-xs">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Icon icon={FileSpreadsheet} size="xs" className="text-primary" />
                Templat resmi Rumah Belajar (.xlsx)
              </p>
              <p className="text-muted-foreground">
                Berisi format kolom standar serta panduan pengisian persetujuan wali.
              </p>
            </div>
            <Button
              asChild
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
            >
              <a href="/api/students/import/template" download>
                <Icon icon={Download} size="xs" />
                <span>Unduh templat (.xlsx)</span>
              </a>
            </Button>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={fileInputId}
              className="block text-sm font-medium text-foreground"
            >
              Pilih berkas Excel (.xlsx) *
            </label>
            <label
              htmlFor={fileInputId}
              className="flex items-center justify-between gap-3 rounded-control border border-dashed border-border bg-surface px-3.5 py-3 text-sm cursor-pointer hover:bg-surface-subtle transition-colors"
            >
              <span className="truncate text-foreground">
                {selectedFile ? selectedFile.name : "Belum ada berkas dipilih..."}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary shrink-0">
                <Icon icon={Upload} size="xs" />
                Pilih berkas
              </span>
            </label>
            <input
              id={fileInputId}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              disabled={pending || isOffline}
              className="sr-only"
            />
          </div>

          {preview && (
            <div className="space-y-2.5 rounded-control border border-border bg-surface p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-foreground">
                  Hasil pemeriksaan ({preview.totalRows} baris)
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">
                    {preview.validCount} siap disimpan
                  </Badge>
                  {preview.invalidCount > 0 && (
                    <Badge variant="danger" size="sm">
                      {preview.invalidCount} perlu diperbaiki
                    </Badge>
                  )}
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto divide-y divide-border-subtle text-xs">
                {preview.rows.map((row) => (
                  <div key={row.rowNumber} className="py-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground truncate">
                        Baris {row.rowNumber}: {row.fullName}
                      </span>
                      <Badge
                        variant={row.valid ? "success" : "danger"}
                        size="sm"
                      >
                        {row.valid ? "Valid" : "Bermasalah"}
                      </Badge>
                    </div>
                    {row.valid ? (
                      <p className="text-muted-foreground">
                        {row.educationLevelLabel} · Kel. {row.district} · Wali:{" "}
                        {row.guardianFullName}
                      </p>
                    ) : (
                      <ul className="list-disc pl-4 text-danger space-y-0.5">
                        {row.errors.map((errMsg, idx) => (
                          <li key={idx}>{errMsg}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}
    </FormBottomSheet>
  );
}
