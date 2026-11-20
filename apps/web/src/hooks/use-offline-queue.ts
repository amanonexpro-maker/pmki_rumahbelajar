"use client";

import * as React from "react";
import {
  enqueueSyncOperation,
  listSyncQueueItems,
  updateSyncQueueItemStatus,
  type OfflineEntityType,
  type OfflineOperationType,
  type OfflineQueueItem,
} from "@/lib/offline";
import { useConnectivity } from "./use-connectivity";

export interface SyncApiResponse {
  success: boolean;
  data?: {
    operationId: string;
    syncedAt: string;
    conflictNeedsManualReview?: boolean;
    message?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Hook for client-driven background sync queue over IndexedDB (06 §12–15, 09 §27–29).
 * Automatically flushes pending operations to `/api/sync` on reconnect without page refresh.
 */
export function useOfflineQueue(onSyncCompleted?: () => void) {
  const { setSyncing, markSynced } = useConnectivity();
  const [items, setItems] = React.useState<OfflineQueueItem[]>([]);
  const isFlushingRef = React.useRef(false);

  const refreshQueue = React.useCallback(async () => {
    const all = await listSyncQueueItems();
    setItems(all);
    return all;
  }, []);

  const flushQueue = React.useCallback(async () => {
    if (isFlushingRef.current) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    const currentItems = await listSyncQueueItems();
    const pendingItems = currentItems.filter(
      (i) => i.syncStatus === "PENDING" || i.syncStatus === "FAILED"
    );

    if (pendingItems.length === 0) return;

    isFlushingRef.current = true;
    setSyncing(true);

    try {
      let anySucceeded = false;
      let latestSyncedAt: string | undefined;

      for (const item of pendingItems) {
        await updateSyncQueueItemStatus(item.operationId, {
          syncStatus: "PROCESSING",
          lastError: null,
        });

        try {
          const response = await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operationId: item.operationId,
              operation: item.operation,
              entityType: item.entityType,
              entityId: item.entityId,
              payload: item.payload,
              createdAt: item.createdAt,
            }),
          });

          const body = (await response.json()) as SyncApiResponse;

          if (response.ok && body.success && body.data) {
            anySucceeded = true;
            latestSyncedAt = body.data.syncedAt;
            await updateSyncQueueItemStatus(item.operationId, {
              syncStatus: "SUCCESS",
              syncedAt: body.data.syncedAt,
              conflictNeedsManualReview: Boolean(
                body.data.conflictNeedsManualReview
              ),
              lastError: null,
            });
          } else {
            await updateSyncQueueItemStatus(item.operationId, {
              syncStatus: "FAILED",
              lastError:
                body.error?.message ??
                "Gagal menyinkronkan perubahan ke server.",
            });
          }
        } catch {
          await updateSyncQueueItemStatus(item.operationId, {
            syncStatus: "PENDING",
            lastError:
              "Koneksi terputus saat sinkronisasi. Akan dicoba kembali saat online.",
          });
        }
      }

      await refreshQueue();
      if (anySucceeded) {
        markSynced(latestSyncedAt);
        onSyncCompleted?.();
      }
    } finally {
      isFlushingRef.current = false;
      setSyncing(false);
    }
  }, [markSynced, onSyncCompleted, refreshQueue, setSyncing]);

  const enqueue = React.useCallback(
    async <TPayload extends Record<string, unknown>>(params: {
      operation: OfflineOperationType;
      entityType: OfflineEntityType;
      entityId: string;
      payload: TPayload;
    }) => {
      const queued = await enqueueSyncOperation(params);
      await refreshQueue();
      return queued;
    },
    [refreshQueue]
  );

  React.useEffect(() => {
    let active = true;
    void listSyncQueueItems().then((loaded) => {
      if (active) setItems(loaded);
    });

    function handleOnline() {
      void flushQueue();
    }

    window.addEventListener("online", handleOnline);
    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
    };
  }, [flushQueue]);

  const pendingCount = items.filter(
    (i) => i.syncStatus === "PENDING" || i.syncStatus === "PROCESSING"
  ).length;
  const failedCount = items.filter((i) => i.syncStatus === "FAILED").length;
  const conflictCount = items.filter((i) => i.conflictNeedsManualReview).length;

  return {
    items,
    pendingCount,
    failedCount,
    conflictCount,
    enqueue,
    flushQueue,
    refreshQueue,
  };
}

