import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { syncOperations } from "@/db/schema";
import { recordAttendanceSession } from "@/features/attendance";
import { upsertDevelopmentNote } from "@/features/development";
import { getHumanErrorMessage } from "@/lib/messages";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";

/**
 * Sync Operation Request Schema (09 §28).
 * Tier C domains (Governance, Publishing, Administration, Audit) are explicitly
 * excluded from the enum so any attempt to sync Tier C operations is rejected.
 */
export const syncOperationRequestSchema = z.object({
  operationId: z
    .string()
    .trim()
    .min(8, "ID operasi sinkronisasi tidak valid."),
  operation: z.enum(["ATTENDANCE_RECORD", "DEVELOPMENT_NOTE_UPSERT"], {
    message:
      "Operasi ini tidak mendukung sinkronisasi offline (hanya Kehadiran dan Catatan Perkembangan Tier A).",
  }),
  entityType: z.enum(["attendance_session", "development_note"]),
  entityId: z.string().trim().min(1),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime("Waktu pembuatan operasi offline tidak valid."),
});

export type SyncOperationRequest = z.infer<typeof syncOperationRequestSchema>;

export interface SyncProcessResult {
  operationId: string;
  syncedAt: string;
  entityId: string;
  conflictNeedsManualReview: boolean;
}

/**
 * Cross-Domain Offline Sync Processor (09 §27–29, 06 §12–14, §25).
 * Flow:
 * 1. Authentication check
 * 2. Zod request validation (rejects Tier C operations)
 * 3. Idempotency check against `sync_operations` ledger (duplicate -> RESOURCE_CONFLICT)
 * 4. Dispatch to Domain Service (which enforces Permission -> Scope -> Policy + Conflict rules)
 * 5. Record processed status in `sync_operations` ledger
 */
export async function processOfflineSyncOperation(
  user: SessionUser | null | undefined,
  rawRequest: unknown
): Promise<ActionResult<SyncProcessResult>> {
  if (!user || !user.id) {
    return fail("UNAUTHORIZED", getHumanErrorMessage("UNAUTHORIZED"));
  }

  const parsed = syncOperationRequestSchema.safeParse(rawRequest);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED")
    );
  }

  const req = parsed.data;

  // Idempotency Check (09 §29, Product Owner Rule #5)
  const [existingOp] = await db
    .select()
    .from(syncOperations)
    .where(eq(syncOperations.operationId, req.operationId))
    .limit(1);

  if (
    existingOp &&
    (existingOp.status === "PROCESSED" || existingOp.status === "CONFLICT")
  ) {
    return fail(
      "RESOURCE_CONFLICT",
      "Operasi sinkronisasi ini sudah pernah diproses sebelumnya."
    );
  }

  const syncedAt = new Date();
  const clientCreatedAt = new Date(req.createdAt);

  if (req.operation === "ATTENDANCE_RECORD") {
    const res = await recordAttendanceSession(user, {
      ...req.payload,
      recordedOfflineAt: req.createdAt,
      isOfflineSync: true,
    });

    if (!res.success) {
      return res;
    }

    await db
      .insert(syncOperations)
      .values({
        operationId: req.operationId,
        userId: user.id,
        operationType: req.operation,
        entityType: "attendance_session",
        entityId: res.data.sessionId,
        status: res.data.conflictNeedsManualReview ? "CONFLICT" : "PROCESSED",
        clientCreatedAt,
        processedAt: syncedAt,
      })
      .onConflictDoUpdate({
        target: syncOperations.operationId,
        set: {
          status: res.data.conflictNeedsManualReview ? "CONFLICT" : "PROCESSED",
          entityId: res.data.sessionId,
          processedAt: syncedAt,
          errorMessage: null,
        },
      });

    return ok({
      operationId: req.operationId,
      syncedAt: syncedAt.toISOString(),
      entityId: res.data.sessionId,
      conflictNeedsManualReview: res.data.conflictNeedsManualReview,
    });
  }

  // DEVELOPMENT_NOTE_UPSERT
  const devRes = await upsertDevelopmentNote(user, {
    ...req.payload,
    recordedOfflineAt: req.createdAt,
    isOfflineSync: true,
  });

  if (!devRes.success) {
    return devRes;
  }

  await db
    .insert(syncOperations)
    .values({
      operationId: req.operationId,
      userId: user.id,
      operationType: req.operation,
      entityType: "development_note",
      entityId: devRes.data.noteId,
      status: "PROCESSED",
      clientCreatedAt,
      processedAt: syncedAt,
    })
    .onConflictDoUpdate({
      target: syncOperations.operationId,
      set: {
        status: "PROCESSED",
        entityId: devRes.data.noteId,
        processedAt: syncedAt,
        errorMessage: null,
      },
    });

  return ok({
    operationId: req.operationId,
    syncedAt: syncedAt.toISOString(),
    entityId: devRes.data.noteId,
    conflictNeedsManualReview: false,
  });
}

