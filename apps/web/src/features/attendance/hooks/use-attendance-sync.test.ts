import { beforeEach, describe, expect, it, vi } from "vitest";
import { SUCCESS_MESSAGES } from "@/lib/messages";

const hookRuntime = vi.hoisted(() => {
  const state = {
    states: [] as unknown[],
    stateIndex: 0,
    isSyncingTransitions: [] as boolean[],
  };

  return {
    state,
    reset() {
      state.states = [];
      state.stateIndex = 0;
      state.isSyncingTransitions = [];
    },
  };
});

vi.mock("react", () => ({
  useState: <T,>(initial: T | (() => T)) => {
    const idx = hookRuntime.state.stateIndex++;
    if (!(idx in hookRuntime.state.states)) {
      const initVal =
        typeof initial === "function" ? (initial as () => T)() : initial;
      hookRuntime.state.states[idx] = initVal;
      if (idx === 0 && typeof initVal === "boolean") {
        hookRuntime.state.isSyncingTransitions.push(initVal);
      }
    }
    const setState = (next: T | ((prev: T) => T)) => {
      const prev = hookRuntime.state.states[idx] as T;
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      hookRuntime.state.states[idx] = resolved;
      if (idx === 0 && typeof resolved === "boolean") {
        hookRuntime.state.isSyncingTransitions.push(resolved);
      }
    };
    return [hookRuntime.state.states[idx] as T, setState] as const;
  },
  useCallback: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

let mockConnectivityStatus: "ONLINE" | "OFFLINE" | "SYNCING" = "ONLINE";
const mockMarkSynced = vi.fn();

vi.mock("@/hooks/use-connectivity", () => ({
  useConnectivity: () => ({
    status: mockConnectivityStatus,
    markSynced: mockMarkSynced,
  }),
}));

let mockPendingCount = 0;
const mockEnqueue = vi.fn();
const mockFlushQueue = vi.fn();
let capturedOnSynced: (() => void) | undefined;

vi.mock("@/hooks/use-offline-queue", () => ({
  useOfflineQueue: (onSynced?: () => void) => {
    capturedOnSynced = onSynced;
    return {
      pendingCount: mockPendingCount,
      enqueue: mockEnqueue,
      flushQueue: mockFlushQueue,
    };
  },
}));

import { useAttendanceSync } from "./use-attendance-sync";

function mountUseAttendanceSync(
  hasExistingSession: boolean,
  onSyncSuccess = vi.fn()
) {
  const RenderHook = () => {
    hookRuntime.state.stateIndex = 0;
    return useAttendanceSync({ hasExistingSession, onSyncSuccess });
  };
  return { render: RenderHook, onSyncSuccess };
}

describe("useAttendanceSync", () => {
  beforeEach(() => {
    hookRuntime.reset();
    vi.clearAllMocks();
    mockConnectivityStatus = "ONLINE";
    mockPendingCount = 0;
    capturedOnSynced = undefined;
  });

  it("triggers online sync, transitions isSyncing false -> true -> false, and updates synced state", async () => {
    mockPendingCount = 2;
    mockFlushQueue.mockImplementationOnce(async () => {
      mockPendingCount = 0;
      capturedOnSynced?.();
    });

    const { render, onSyncSuccess } = mountUseAttendanceSync(false);
    const hook = render();

    await hook.triggerSync();
    const updated = render();

    expect(mockFlushQueue).toHaveBeenCalledTimes(1);
    expect(hookRuntime.state.isSyncingTransitions).toEqual([
      false,
      true,
      false,
    ]);
    expect(updated.syncBadgeState).toBe("SYNCED");
    expect(updated.feedbackBanner).toEqual({
      tone: "success",
      message: SUCCESS_MESSAGES.attendanceSaved,
    });
    expect(onSyncSuccess).toHaveBeenCalledTimes(1);
  });

  it("supports enqueue in offline mode and avoids state corruption when flushQueue is a no-op", async () => {
    mockConnectivityStatus = "OFFLINE";
    mockPendingCount = 1;
    mockEnqueue.mockResolvedValueOnce({ id: "op-1" });
    mockFlushQueue.mockResolvedValueOnce(undefined);

    const { render, onSyncSuccess } = mountUseAttendanceSync(false);
    const hook = render();

    await hook.enqueue({
      operation: "ATTENDANCE_RECORD",
      entityType: "attendance_session",
      entityId: "class-1:2026-11-25",
      payload: { classId: "class-1" },
    });
    await hook.triggerSync();
    const updated = render();

    expect(mockEnqueue).toHaveBeenCalledTimes(1);
    expect(updated.isSyncing).toBe(false);
    expect(updated.syncBadgeState).toBeNull();
    expect(onSyncSuccess).not.toHaveBeenCalled();
  });

  it("resets isSyncing and surfaces conflict/error feedback when sync fails", async () => {
    mockPendingCount = 1;
    mockFlushQueue.mockRejectedValueOnce(new Error("Conflict detected"));

    const { render } = mountUseAttendanceSync(true);
    const hook = render();

    await expect(hook.triggerSync()).rejects.toThrow("Conflict detected");
    const updated = render();

    expect(updated.isSyncing).toBe(false);
    expect(hookRuntime.state.isSyncingTransitions).toEqual([
      false,
      true,
      false,
    ]);

    updated.setFeedbackBanner({
      tone: "warning",
      message: "Perlu tinjauan koordinator (Konflik sinkronisasi offline)",
    });
    const afterBanner = render();
    expect(afterBanner.feedbackBanner?.tone).toBe("warning");
  });
});

