"use client";

import * as React from "react";
import { FeedbackBanner, FormBottomSheet } from "@/components/patterns";
import { Badge, Button, Skeleton } from "@/components/ui";
import { formatDateID, formatTimeID } from "@/utils/date-formatter";
import type { DevelopmentNoteRevisionDTO } from "../types/development-types";

export interface NoteRevisionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  categoryName: string;
  loading: boolean;
  error: string | null;
  revisions: DevelopmentNoteRevisionDTO[];
}

export function NoteRevisionsSheet({
  open,
  onOpenChange,
  studentName,
  categoryName,
  loading,
  error,
  revisions,
}: NoteRevisionsSheetProps) {
  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Riwayat revisi · ${studentName}`}
      description={`Jejak versi catatan perkembangan (${categoryName}). Setiap pembaruan tersimpan sebagai versi terpisah tanpa menimpa catatan lama.`}
      footer={(_, isMobile) => (
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
          fullWidth={isMobile}
        >
          Tutup
        </Button>
      )}
    >
      <div className="space-y-3">
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-card" />
            <Skeleton className="h-24 w-full rounded-card" />
          </div>
        )}

        {error && !loading && <FeedbackBanner tone="danger" message={error} />}

        {!loading && !error && revisions.length === 0 && (
          <p className="text-sm text-secondary-foreground py-4 text-center">
            Belum ada arsip revisi sebelumnya untuk catatan ini.
          </p>
        )}

        {!loading &&
          !error &&
          revisions.map((rev) => (
            <div
              key={rev.id}
              className="rounded-card border border-border bg-surface-subtle/40 p-4 space-y-2.5 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm">
                    Versi {rev.version}
                  </Badge>
                  {rev.confidential && (
                    <Badge variant="confidential" size="sm">
                      Rahasia
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {rev.actorName ? `${rev.actorName} · ` : ""}
                  {formatDateID(rev.createdAt)}, {formatTimeID(rev.createdAt)}{" "}
                  WIB
                </span>
              </div>

              <div className="space-y-1.5 text-xs sm:text-sm">
                <p className="text-foreground leading-relaxed">
                  <span className="font-medium text-muted-foreground">
                    Pengamatan:{" "}
                  </span>
                  {rev.observation}
                </p>
                {rev.progress && (
                  <p className="text-foreground leading-relaxed">
                    <span className="font-medium text-muted-foreground">
                      Kemajuan:{" "}
                    </span>
                    {rev.progress}
                  </p>
                )}
                {rev.followUp && (
                  <p className="text-foreground leading-relaxed">
                    <span className="font-medium text-muted-foreground">
                      Tindak lanjut:{" "}
                    </span>
                    {rev.followUp}
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>
    </FormBottomSheet>
  );
}

