"use client";

import * as React from "react";
import { openDB, type IDBPDatabase } from "idb";
import { uuidv7 } from "uuidv7";
import { submitPublicRegistrationAction } from "../actions/student-actions";
import type { PublicRegistrationInput } from "../validators/student-validator";

const DB_NAME = "pmki-registration-offline-db";
const DB_VERSION = 1;
const DRAFT_STORE = "registration_drafts";
const QUEUE_STORE = "registration_queue";
const CURRENT_DRAFT_KEY = "current_public_registration";

export interface QueuedRegistrationItem {
  operationId: string;
  payload: PublicRegistrationInput;
  createdAt: string;
  status: "PENDING_SYNC" | "SYNCED";
  serverRegistrationNumber?: string;
}

async function getOfflineDb(): Promise<IDBPDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE);
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "operationId" });
      }
    },
  });
}

export async function loadRegistrationDraft(): Promise<Partial<PublicRegistrationInput> | null> {
  try {
    const db = await getOfflineDb();
    if (!db) return null;
    const draft = await db.get(DRAFT_STORE, CURRENT_DRAFT_KEY);
    return (draft as Partial<PublicRegistrationInput>) ?? null;
  } catch {
    return null;
  }
}

export async function saveRegistrationDraft(
  draft: Partial<PublicRegistrationInput>
): Promise<void> {
  try {
    const db = await getOfflineDb();
    if (!db) return;
    await db.put(DRAFT_STORE, draft, CURRENT_DRAFT_KEY);
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export async function clearRegistrationDraft(): Promise<void> {
  try {
    const db = await getOfflineDb();
    if (!db) return;
    await db.delete(DRAFT_STORE, CURRENT_DRAFT_KEY);
  } catch {
    // Ignore
  }
}

export async function enqueueOfflineRegistration(
  payload: PublicRegistrationInput
): Promise<QueuedRegistrationItem> {
  const item: QueuedRegistrationItem = {
    operationId: uuidv7(),
    payload,
    createdAt: new Date().toISOString(),
    status: "PENDING_SYNC",
  };

  const db = await getOfflineDb();
  if (db) {
    await db.put(QUEUE_STORE, item);
    await db.delete(DRAFT_STORE, CURRENT_DRAFT_KEY);
  }
  return item;
}

export async function flushOfflineRegistrationQueue(): Promise<
  Array<{ operationId: string; registrationNumber: string; fullName: string }>
> {
  const db = await getOfflineDb();
  if (!db) return [];

  const allItems = (await db.getAll(QUEUE_STORE)) as QueuedRegistrationItem[];
  const pending = allItems.filter((item) => item.status === "PENDING_SYNC");
  const syncedResults: Array<{
    operationId: string;
    registrationNumber: string;
    fullName: string;
  }> = [];

  for (const item of pending) {
    try {
      const res = await submitPublicRegistrationAction(item.payload);
      if (res.success) {
        await db.delete(QUEUE_STORE, item.operationId);
        syncedResults.push({
          operationId: item.operationId,
          registrationNumber: res.data.registrationNumber,
          fullName: res.data.fullName,
        });
      }
    } catch {
      // Remain in queue for next online retry
    }
  }

  return syncedResults;
}

export function useOfflineRegistrationSync(
  onSynced?: (results: Array<{
    operationId: string;
    registrationNumber: string;
    fullName: string;
  }>) => void
) {
  const [pendingCount, setPendingCount] = React.useState(0);

  const refreshPendingCount = React.useCallback(async () => {
    const db = await getOfflineDb();
    if (!db) return;
    const all = (await db.getAll(QUEUE_STORE)) as QueuedRegistrationItem[];
    setPendingCount(all.filter((i) => i.status === "PENDING_SYNC").length);
  }, []);

  React.useEffect(() => {
    let active = true;
    void getOfflineDb().then(async (db) => {
      if (!db || !active) return;
      const all = (await db.getAll(QUEUE_STORE)) as QueuedRegistrationItem[];
      if (active) {
        setPendingCount(all.filter((i) => i.status === "PENDING_SYNC").length);
      }
    });

    async function handleOnline() {
      const results = await flushOfflineRegistrationQueue();
      await refreshPendingCount();
      if (results.length > 0 && onSynced) {
        onSynced(results);
      }
    }

    window.addEventListener("online", handleOnline);
    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
    };
  }, [onSynced, refreshPendingCount]);

  return { pendingCount, refreshPendingCount };
}
