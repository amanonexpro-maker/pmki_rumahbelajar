import { beforeEach, describe, expect, it, vi } from "vitest";
import { OFFLINE_MESSAGES, SUCCESS_MESSAGES } from "@/lib/messages";
import type { AttendanceSessionDetailDTO } from "../types/attendance-types";
import type { AttendanceDraftData } from "./use-attendance-session";

const hookRuntime = vi.hoisted(() => {
  const state = {
    states: [] as unknown[],
    stateIndex: 0,
    effectRan: false,
  };

  return {
    state,
    reset() {
      state.states = [];
      state.stateIndex = 0;
      state.effectRan = false;
    },
  };
});

vi.mock("react", () => ({
  useState: <T,>(initial: T | (() => T)) => {
    const idx = hookRuntime.state.stateIndex++;
    if (!(idx in hookRuntime.state.states)) {
      hookRuntime.state.states[idx] =
        typeof initial === "function" ? (initial as () => T)() : initial;
    }
    const setState = (next: T | ((prev: T) => T)) => {
      const prev = hookRuntime.state.states[idx] as T;
      hookRuntime.state.states[idx] =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
    };
    return [hookRuntime.state.states[idx] as T, setState] as const;
  },
  useMemo: <T,>(factory: () => T) => factory(),
  useEffect: (effect: () => void | (() => void)) => {
    if (!hookRuntime.state.effectRan) {
      hookRuntime.state.effectRan = true;
      effect();
    }
  },
  useCallback: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

let mockDraftState: AttendanceDraftData = { notes: "", entries: {} };
let mockHasRecoveredDraft = false;
const mockSaveDraftNow = vi.fn(async () => undefined);
const mockClearDraft = vi.fn(async () => undefined);

vi.mock("@/hooks/use-draft-recovery", () => ({
  useDraftRecovery: (
    _key: string,
    _type: string,
    initialValue: AttendanceDraftData
  ) => {
    if (!mockHasRecoveredDraft && Object.keys(mockDraftState.entries).length === 0) {
      mockDraftState = initialValue;
    }
    const setDraft = (
      next:
        | AttendanceDraftData
        | ((prev: AttendanceDraftData) => AttendanceDraftData)
    ) => {
      mockDraftState =
        typeof next === "function" ? next(mockDraftState) : next;
    };
    return {
      draft: mockDraftState,
      setDraft,
      hasRecoveredDraft: mockHasRecoveredDraft,
      saveDraftNow: mockSaveDraftNow,
      clearDraft: mockClearDraft,
    };
  },
}));

const mockRecordAttendanceSessionAction = vi.fn();
vi.mock("../actions/attendance-actions", () => ({
  recordAttendanceSessionAction: (...args: unknown[]) =>
    mockRecordAttendanceSessionAction(...args),
}));

import { useAttendanceSession } from "./use-attendance-session";

const sampleSessionView: AttendanceSessionDetailDTO = {
  sessionId: "session-1",
  organizationId: "org-1",
  serviceUnitId: "unit-1",
  classId: "class-1",
  className: "Kelas Pagi",
  teacherId: "teacher-1",
  teacherName: "Ibu Sari",
  sessionDate: "2026-11-25",
  notes: "",
  needsManualReview: false,
  summary: {
    total: 2,
    recorded: 2,
    presentCount: 0,
    permittedCount: 0,
    sickCount: 1,
    absentCount: 1,
  },
  roster: [
    {
      studentId: "student-1",
      studentFullName: "Budi Santoso",
      studentNickname: "Budi",
      educationLevelLabel: "SD",
      registrationNumber: "REG-001",
      status: "ABSENT",
      note: "",
      recordedOfflineAt: null,
      syncedAt: null,
    },
    {
      studentId: "student-2",
      studentFullName: "Siti Aminah",
      studentNickname: "",
      educationLevelLabel: "SD",
      registrationNumber: "REG-002",
      status: "SICK",
      note: "",
      recordedOfflineAt: null,
      syncedAt: null,
    },
  ],
};

function createSubmitEvent() {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

describe("useAttendanceSession", () => {
  const mockEnqueue = vi.fn(async () => undefined);
  const mockMarkSynced = vi.fn();
  const mockSetSyncBadgeState = vi.fn();
  const mockSetFeedbackBanner = vi.fn();
  const mockOnSaved = vi.fn();

  function renderSessionHook(
    connectivityStatus: "ONLINE" | "OFFLINE" = "ONLINE"
  ) {
    const RenderHook = () => {
      hookRuntime.state.stateIndex = 0;
      return useAttendanceSession({
        sessionView: sampleSessionView,
        initialClassId: "class-1",
        initialDate: "2026-11-25",
        canRecord: true,
        connectivityStatus,
        enqueue: mockEnqueue,
        markSynced: mockMarkSynced,
        setSyncBadgeState: mockSetSyncBadgeState,
        setFeedbackBanner: mockSetFeedbackBanner,
        onSaved: mockOnSaved,
      });
    };
    return RenderHook();
  }

  beforeEach(() => {
    hookRuntime.reset();
    vi.clearAllMocks();
    mockDraftState = { notes: "", entries: {} };
    mockHasRecoveredDraft = false;
  });

  it("initializes session from recovered IndexedDB draft when present", () => {
    mockHasRecoveredDraft = true;
    mockDraftState = {
      notes: "Catatan lokal",
      entries: {
        "student-1": { status: "PRESENT", note: "Tepat waktu" },
        "student-2": { status: "PERMITTED", note: "Izin keluarga" },
      },
    };

    const hook = renderSessionHook();

    expect(hook.hasRecoveredDraft).toBe(true);
    expect(hook.draft.notes).toBe("Catatan lokal");
    expect(hook.rosterItems[0]?.status).toBe("PRESENT");
    expect(hook.rosterItems[1]?.status).toBe("PERMITTED");
    expect(hook.counts.presentCount).toBe(1);
    expect(hook.counts.permittedCount).toBe(1);
  });

  it("toggles student status optimistically and persists draft locally", () => {
    const hook = renderSessionHook();
    hook.handleStudentStatusChange("student-1", "PRESENT");
    const updated = renderSessionHook();

    expect(updated.rosterItems[0]?.status).toBe("PRESENT");
    expect(mockSetSyncBadgeState).toHaveBeenCalledWith("LOCAL_SAVED");
    expect(mockSaveDraftNow).toHaveBeenCalledTimes(1);
  });

  it("marks all students present on handleMarkAllPresent", () => {
    const hook = renderSessionHook();
    hook.handleMarkAllPresent();
    const updated = renderSessionHook();

    expect(updated.rosterItems.every((r) => r.status === "PRESENT")).toBe(true);
    expect(updated.counts.presentCount).toBe(2);
    expect(mockSaveDraftNow).toHaveBeenCalledTimes(1);
  });

  it("saves session online via server action and clears local draft", async () => {
    mockRecordAttendanceSessionAction.mockResolvedValueOnce({
      success: true,
      data: { sessionId: "session-1" },
    });

    const hook = renderSessionHook("ONLINE");
    await hook.handleSaveSession(createSubmitEvent());

    expect(mockRecordAttendanceSessionAction).toHaveBeenCalledTimes(1);
    expect(mockClearDraft).toHaveBeenCalledTimes(1);
    expect(mockMarkSynced).toHaveBeenCalledTimes(1);
    expect(mockSetSyncBadgeState).toHaveBeenCalledWith("SYNCED");
    expect(mockSetFeedbackBanner).toHaveBeenCalledWith({
      tone: "success",
      message: SUCCESS_MESSAGES.attendanceSaved,
    });
    expect(mockOnSaved).toHaveBeenCalledTimes(1);
  });

  it("queues session for later sync when offline or when network fails mid-request", async () => {
    mockRecordAttendanceSessionAction.mockRejectedValueOnce(
      new Error("Network timeout")
    );

    const hook = renderSessionHook("ONLINE");
    await hook.handleSaveSession(createSubmitEvent());

    expect(mockSaveDraftNow).toHaveBeenCalledTimes(1);
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "ATTENDANCE_RECORD",
        entityType: "attendance_session",
        entityId: "class-1:2026-11-25",
      })
    );
    expect(mockSetSyncBadgeState).toHaveBeenCalledWith("PENDING_SYNC");
    expect(mockSetFeedbackBanner).toHaveBeenCalledWith({
      tone: "warning",
      message: `${OFFLINE_MESSAGES.savedLocally} ${OFFLINE_MESSAGES.syncPending}`,
    });
  });
});
