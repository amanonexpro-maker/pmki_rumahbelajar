"use client";

import * as React from "react";
import type { ConnectivityState } from "@/hooks/use-connectivity";
import { useDraftRecovery } from "@/hooks/use-draft-recovery";
import type { OfflineEntityType, OfflineOperationType } from "@/lib/offline";
import { OFFLINE_MESSAGES, SUCCESS_MESSAGES } from "@/lib/messages";
import type { AttendanceStatus, SyncStatus } from "@/lib/status";
import { recordAttendanceSessionAction } from "../actions/attendance-actions";
import type {
  AttendanceRecordItemDTO,
  AttendanceSessionDetailDTO,
} from "../types/attendance-types";
import type { AttendanceFeedback } from "./use-attendance-sync";

export interface AttendanceDraftData {
  notes: string;
  entries: Record<
    string,
    {
      status: AttendanceStatus;
      note: string;
    }
  >;
}

export interface UseAttendanceSessionOptions {
  sessionView: AttendanceSessionDetailDTO | null;
  initialClassId: string;
  initialDate: string;
  canRecord: boolean;
  connectivityStatus: ConnectivityState;
  enqueue: (item: {
    operation: OfflineOperationType;
    entityType: OfflineEntityType;
    entityId: string;
    payload: Record<string, unknown>;
  }) => Promise<unknown>;
  markSynced: () => void;
  setSyncBadgeState: React.Dispatch<React.SetStateAction<SyncStatus | null>>;
  setFeedbackBanner: React.Dispatch<
    React.SetStateAction<AttendanceFeedback | null>
  >;
  onSaved: () => void;
}

/**
 * Manages the active attendance session draft, student status/note toggles,
 * batch "mark all present", search filtering, counts, and offline-first submission.
 *
 * @param options - Current session view, permissions, connectivity, and sync callbacks.
 * @returns Draft state, derived roster/counts, and session mutation handlers.
 */
export function useAttendanceSession({
  sessionView,
  initialClassId,
  initialDate,
  canRecord,
  connectivityStatus,
  enqueue,
  markSynced,
  setSyncBadgeState,
  setFeedbackBanner,
  onSaved,
}: UseAttendanceSessionOptions) {
  const [submitting, setSubmitting] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const initialDraftValue = React.useMemo<AttendanceDraftData>(() => {
    const entries: AttendanceDraftData["entries"] = {};
    for (const item of sessionView?.roster ?? []) {
      entries[item.studentId] = {
        status: item.status,
        note: item.note ?? "",
      };
    }
    return {
      notes: sessionView?.notes ?? "",
      entries,
    };
  }, [sessionView]);

  const draftKey = `attendance:${initialClassId}:${initialDate}`;
  const {
    draft,
    setDraft,
    hasRecoveredDraft,
    saveDraftNow,
    clearDraft,
  } = useDraftRecovery<AttendanceDraftData>(
    draftKey,
    "attendance_session",
    initialDraftValue
  );

  // Keep draft aligned when switching class/date if no recovered draft exists
  React.useEffect(() => {
    if (!hasRecoveredDraft) {
      setDraft(initialDraftValue);
    }
  }, [hasRecoveredDraft, initialDraftValue, setDraft]);

  const handleStudentStatusChange = React.useCallback(
    (studentId: string, nextStatus: AttendanceStatus) => {
      if (!canRecord) return;
      setFeedbackBanner(null);
      setSyncBadgeState("LOCAL_SAVED");
      setDraft((prev) => {
        const next: AttendanceDraftData = {
          ...prev,
          entries: {
            ...prev.entries,
            [studentId]: {
              status: nextStatus,
              note: prev.entries[studentId]?.note ?? "",
            },
          },
        };
        void saveDraftNow(next);
        return next;
      });
    },
    [canRecord, saveDraftNow, setDraft, setFeedbackBanner, setSyncBadgeState]
  );

  const handleStudentNoteChange = React.useCallback(
    (studentId: string, nextNote: string) => {
      if (!canRecord) return;
      setSyncBadgeState("LOCAL_SAVED");
      setDraft((prev) => {
        const next: AttendanceDraftData = {
          ...prev,
          entries: {
            ...prev.entries,
            [studentId]: {
              status: prev.entries[studentId]?.status ?? "PRESENT",
              note: nextNote,
            },
          },
        };
        void saveDraftNow(next);
        return next;
      });
    },
    [canRecord, saveDraftNow, setDraft, setSyncBadgeState]
  );

  const handleSessionNotesChange = React.useCallback(
    (nextVal: string) => {
      setSyncBadgeState("LOCAL_SAVED");
      setDraft((prev) => {
        const next = { ...prev, notes: nextVal };
        void saveDraftNow(next);
        return next;
      });
    },
    [saveDraftNow, setDraft, setSyncBadgeState]
  );

  const handleMarkAllPresent = React.useCallback(() => {
    if (!canRecord || !sessionView) return;
    setFeedbackBanner(null);
    setSyncBadgeState("LOCAL_SAVED");
    setDraft((prev) => {
      const nextEntries = { ...prev.entries };
      for (const item of sessionView.roster) {
        nextEntries[item.studentId] = {
          status: "PRESENT",
          note: nextEntries[item.studentId]?.note ?? "",
        };
      }
      const next = { ...prev, entries: nextEntries };
      void saveDraftNow(next);
      return next;
    });
  }, [
    canRecord,
    saveDraftNow,
    sessionView,
    setDraft,
    setFeedbackBanner,
    setSyncBadgeState,
  ]);

  const handleSaveSession = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canRecord || !sessionView || submitting) return;

      const entriesPayload = sessionView.roster.map((item) => ({
        studentId: item.studentId,
        status: draft.entries[item.studentId]?.status ?? item.status,
        note: draft.entries[item.studentId]?.note?.trim() || null,
      }));

      const payload = {
        classId: sessionView.classId,
        sessionDate: sessionView.sessionDate,
        notes: draft.notes.trim() || null,
        entries: entriesPayload,
      };

      const isOffline =
        connectivityStatus === "OFFLINE" ||
        (typeof navigator !== "undefined" && navigator.onLine === false);

      if (isOffline) {
        await saveDraftNow(draft);
        await enqueue({
          operation: "ATTENDANCE_RECORD",
          entityType: "attendance_session",
          entityId: `${sessionView.classId}:${sessionView.sessionDate}`,
          payload,
        });
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
        const result = await recordAttendanceSessionAction(payload);
        if (!result.success) {
          setFeedbackBanner({
            tone: "danger",
            message: result.error.message,
          });
          return;
        }

        await clearDraft();
        markSynced();
        setSyncBadgeState("SYNCED");
        setFeedbackBanner({
          tone: "success",
          message: SUCCESS_MESSAGES.attendanceSaved,
        });
        onSaved();
      } catch {
        await saveDraftNow(draft);
        await enqueue({
          operation: "ATTENDANCE_RECORD",
          entityType: "attendance_session",
          entityId: `${sessionView.classId}:${sessionView.sessionDate}`,
          payload,
        });
        setSyncBadgeState("PENDING_SYNC");
        setFeedbackBanner({
          tone: "warning",
          message: `${OFFLINE_MESSAGES.savedLocally} ${OFFLINE_MESSAGES.syncPending}`,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      canRecord,
      clearDraft,
      connectivityStatus,
      draft,
      enqueue,
      markSynced,
      onSaved,
      saveDraftNow,
      sessionView,
      setFeedbackBanner,
      setSyncBadgeState,
      submitting,
    ]
  );

  // Full roster with current draft status applied
  const rosterItems: AttendanceRecordItemDTO[] = React.useMemo(() => {
    if (!sessionView) return [];
    return sessionView.roster.map((item) => ({
      ...item,
      status: draft.entries[item.studentId]?.status ?? item.status,
      note: draft.entries[item.studentId]?.note ?? item.note,
    }));
  }, [draft.entries, sessionView]);

  // Realtime counts calculated across ALL class students (not filtered subset)
  const counts = React.useMemo(() => {
    const total = rosterItems.length;
    const presentCount = rosterItems.filter(
      (r) => r.status === "PRESENT"
    ).length;
    const permittedCount = rosterItems.filter(
      (r) => r.status === "PERMITTED"
    ).length;
    const sickCount = rosterItems.filter((r) => r.status === "SICK").length;
    const absentCount = rosterItems.filter((r) => r.status === "ABSENT").length;
    return {
      total,
      recorded: total,
      presentCount,
      permittedCount,
      sickCount,
      absentCount,
    };
  }, [rosterItems]);

  // Instant client-side memoized filter for search query
  const filteredRosterItems = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rosterItems;
    return rosterItems.filter(
      (item) =>
        item.studentFullName.toLowerCase().includes(q) ||
        (item.studentNickname &&
          item.studentNickname.toLowerCase().includes(q)) ||
        (item.registrationNumber &&
          item.registrationNumber.toLowerCase().includes(q))
    );
  }, [rosterItems, searchQuery]);

  return {
    draft,
    hasRecoveredDraft,
    clearDraft,
    submitting,
    searchQuery,
    setSearchQuery,
    rosterItems,
    filteredRosterItems,
    counts,
    handleStudentStatusChange,
    handleStudentNoteChange,
    handleSessionNotesChange,
    handleMarkAllPresent,
    handleSaveSession,
  };
}
