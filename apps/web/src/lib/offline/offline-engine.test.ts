import { beforeEach, describe, expect, it } from "vitest";
import { SYNC_STATUS_META } from "@/lib/status";
import {
  checkTierCOnlineAvailability,
  clearOfflineTestState,
  enqueueSyncOperation,
  listSyncQueueItems,
  loadOperationalDraft,
  loadTierBCache,
  removeOperationalDraft,
  sanitizeForOfflineStorage,
  saveOperationalDraft,
  saveTierBCache,
  updateSyncQueueItemStatus,
} from "./index";

describe("Offline Engine (06-PWA-OFFLINE-STRATEGY.md & 08 §37)", () => {
  beforeEach(async () => {
    await clearOfflineTestState();
  });

  it("verifies canonical honest sync status labels (06 §10–11, 10 §7)", () => {
    expect(SYNC_STATUS_META.LOCAL_SAVED.label).toBe("Disimpan lokal");
    expect(SYNC_STATUS_META.UNSYNCED.label).toBe("Belum tersinkronisasi");
    expect(SYNC_STATUS_META.PENDING_SYNC.label).toBe("Menunggu sinkronisasi");
    expect(SYNC_STATUS_META.SYNCED.label).toBe("Tersinkronisasi");
  });

  it("persists and recovers operational drafts across reload and strips forbidden secrets/PII (06 §23–24)", async () => {
    const rawDraft = {
      classId: "class-1",
      sessionDate: "2026-11-21",
      password: "secret-password",
      accessToken: "jwt-token",
      guardianPhone: "081234567890",
      entries: [{ studentId: "st-1", status: "PRESENT" }],
    };

    await saveOperationalDraft(
      "attendance:class-1:2026-11-21",
      "attendance_session",
      rawDraft
    );

    const recovered = await loadOperationalDraft<Record<string, unknown>>(
      "attendance:class-1:2026-11-21"
    );
    expect(recovered).not.toBeNull();
    expect(recovered?.data.classId).toBe("class-1");
    expect(recovered?.data.password).toBeUndefined();
    expect(recovered?.data.accessToken).toBeUndefined();
    expect(recovered?.data.guardianPhone).toBeUndefined();

    await removeOperationalDraft("attendance:class-1:2026-11-21");
    expect(
      await loadOperationalDraft("attendance:class-1:2026-11-21")
    ).toBeNull();
  });

  it("manages sync queue lifecycle PENDING -> PROCESSING -> SUCCESS / FAILED (06 §12)", async () => {
    const queued = await enqueueSyncOperation({
      operation: "ATTENDANCE_RECORD",
      entityType: "attendance_session",
      entityId: "class-1:2026-11-21",
      payload: {
        classId: "class-1",
        sessionDate: "2026-11-21",
      },
    });

    expect(queued.syncStatus).toBe("PENDING");
    expect(queued.operationId).toBeTruthy();

    await updateSyncQueueItemStatus(queued.operationId, {
      syncStatus: "PROCESSING",
    });
    let all = await listSyncQueueItems();
    expect(all[0]?.syncStatus).toBe("PROCESSING");

    await updateSyncQueueItemStatus(queued.operationId, {
      syncStatus: "SUCCESS",
      syncedAt: "2026-11-20T09:00:00.000Z",
    });
    all = await listSyncQueueItems();
    expect(all[0]?.syncStatus).toBe("SUCCESS");
    expect(all[0]?.syncedAt).toBe("2026-11-20T09:00:00.000Z");
  });

  it("caches Tier B views while stripping confidential guardian & token fields", async () => {
    const sanitized = sanitizeForOfflineStorage({
      studentName: "Samuel",
      guardian: { phone: "08123" },
      serviceRoleKey: "secret",
    });
    expect(sanitized).toEqual({ studentName: "Samuel" });

    await saveTierBCache("student-detail:1", {
      id: "1",
      fullName: "Samuel",
      guardianPhone: "08123",
    });
    const cached = await loadTierBCache<Record<string, unknown>>(
      "student-detail:1"
    );
    expect(cached?.data.fullName).toBe("Samuel");
    expect(cached?.data.guardianPhone).toBeUndefined();
  });

  it("blocks Tier C modules when offline with a calm Indonesian message (06 §6 Tier C)", () => {
    const govOffline = checkTierCOnlineAvailability(
      "Tata Kelola & Persetujuan Laporan",
      false
    );
    expect(govOffline.allowed).toBe(false);
    if (!govOffline.allowed) {
      expect(govOffline.message).toContain("koneksi internet aktif");
    }

    const adminOffline = checkTierCOnlineAvailability(
      "Administrasi & Hak Akses",
      false
    );
    expect(adminOffline.allowed).toBe(false);

    const govOnline = checkTierCOnlineAvailability(
      "Tata Kelola & Persetujuan Laporan",
      true
    );
    expect(govOnline.allowed).toBe(true);
  });
});

