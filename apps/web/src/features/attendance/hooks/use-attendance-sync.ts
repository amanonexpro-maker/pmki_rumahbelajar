"use client";

import * as React from "react";
import { useConnectivity } from "@/hooks/use-connectivity";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { SUCCESS_MESSAGES } from "@/lib/messages";
import type { SyncStatus } from "@/lib/status";

export interface AttendanceFeedback {
  tone: "success" | "warning" | "danger";
  message: string;
}

export interface UseAttendanceSyncOptions {
  hasExistingSession: boolean;
  onSyncSuccess: () => void;
}

/**
 * Manages offline connectivity state, IndexedDB sync queue, sync badge status,
 * and manual/automatic queue flushing for the Attendance workspace.
 *
 * @param options - Initial session sync state and callback after successful sync.
 * @returns Sync status, queue count, feedback banner state, and sync actions.
 */
export function useAttendanceSync({
  hasExistingSession,
  onSyncSuccess,
}: UseAttendanceSyncOptions) {
  const { status: connectivityStatus, markSynced } = useConnectivity();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncBadgeState, setSyncBadgeState] = React.useState<SyncStatus | null>(
    hasExistingSession ? "SYNCED" : null
  );
  const [feedbackBanner, setFeedbackBanner] =
    React.useState<AttendanceFeedback | null>(null);

  const { pendingCount, enqueue, flushQueue } = useOfflineQueue(() => {
    setSyncBadgeState("SYNCED");
    setFeedbackBanner({
      tone: "success",
      message: SUCCESS_MESSAGES.attendanceSaved,
    });
    onSyncSuccess();
  });

  const triggerSync = React.useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await flushQueue();
    } finally {
      setIsSyncing(false);
    }
  }, [flushQueue, isSyncing]);

  return {
    connectivityStatus,
    pendingCount,
    isSyncing,
    syncBadgeState,
    setSyncBadgeState,
    feedbackBanner,
    setFeedbackBanner,
    enqueue,
    markSynced,
    triggerSync,
  };
}

