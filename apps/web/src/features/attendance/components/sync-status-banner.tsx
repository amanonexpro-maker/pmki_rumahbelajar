"use client";

import { FeedbackBanner } from "@/components/patterns";
import { Button, Icon } from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import type { AttendanceFeedback } from "../hooks/use-attendance-sync";

export interface SyncStatusBannerProps {
  hasRecoveredDraft: boolean;
  onClearDraft: () => void;
  needsManualReview?: boolean;
  feedbackBanner: AttendanceFeedback | null;
  onDismissFeedback: () => void;
}

export function SyncStatusBanner({
  hasRecoveredDraft,
  onClearDraft,
  needsManualReview = false,
  feedbackBanner,
  onDismissFeedback,
}: SyncStatusBannerProps) {
  return (
    <>
      {hasRecoveredDraft && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-warning/30 bg-warning-soft px-4 py-2.5 text-xs text-foreground"
        >
          <div className="flex items-center gap-2">
            <Icon icon={ICON_MAP.cloudOff} size="xs" className="text-warning" />
            <span>
              Draft presensi lokal dipulihkan dari perangkat ini (Disimpan
              lokal · Belum tersinkronisasi).
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearDraft}
          >
            Hapus draft lokal
          </Button>
        </div>
      )}

      {needsManualReview && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-control border border-warning/40 bg-warning-soft p-4 text-xs text-foreground"
        >
          <Icon
            icon={ICON_MAP.alertTriangle}
            size="sm"
            className="text-warning shrink-0 mt-0.5"
          />
          <div className="space-y-1">
            <p className="font-semibold">
              Perlu tinjauan koordinator (Konflik sinkronisasi offline)
            </p>
            <p className="text-secondary-foreground">
              Sesi ini menerima kiriman sinkronisasi offline ketika data server
              sudah tercatat sebelumnya. Sesuai kebijakan tata kelola, data
              server dipertahankan dan sesi ditandai untuk ditinjau.
            </p>
          </div>
        </div>
      )}

      {feedbackBanner && (
        <FeedbackBanner
          tone={feedbackBanner.tone}
          message={feedbackBanner.message}
          onDismiss={onDismissFeedback}
        />
      )}
    </>
  );
}

