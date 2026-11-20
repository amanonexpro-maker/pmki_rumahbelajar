import { openDB, type IDBPDatabase } from "idb";
import { uuidv7 } from "uuidv7";

/**
 * Canonical Offline Storage & Sync Queue Engine (06-PWA-OFFLINE-STRATEGY.md & 09 §27–29).
 * Uses IndexedDB (via `idb`) for operational drafts, sync queue, and Tier B cached views.
 * Includes an in-memory fallback when `indexedDB` is unavailable (SSR / Node Vitest tests).
 */
const DB_NAME = "pmki-operational-offline-db";
const DB_VERSION = 1;
const DRAFTS_STORE = "operational_drafts";
const QUEUE_STORE = "sync_queue";
const CACHE_STORE = "tier_b_cache";

export type OfflineQueueSyncStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED";

export type OfflineOperationType =
  | "ATTENDANCE_RECORD"
  | "DEVELOPMENT_NOTE_UPSERT";

export type OfflineEntityType = "attendance_session" | "development_note";

export type TierCModule =
  | "Tata Kelola & Persetujuan Laporan"
  | "Publikasi"
  | "Administrasi & Hak Akses"
  | "Jejak Audit";

export interface OfflineDraftRecord<T = unknown> {
  draftKey: string;
  entityType: OfflineEntityType;
  data: T;
  updatedAt: string;
}

/**
 * Sync Queue Item Contract (06 §12 + 09 §28).
 */
export interface OfflineQueueItem<TPayload = Record<string, unknown>> {
  operationId: string;
  operation: OfflineOperationType;
  entityType: OfflineEntityType;
  entityId: string;
  payload: TPayload;
  /** Original offline intent timestamp (06 §25) */
  createdAt: string;
  syncStatus: OfflineQueueSyncStatus;
  syncedAt?: string | null;
  lastError?: string | null;
  conflictNeedsManualReview?: boolean;
}

export interface TierBCacheRecord<T = unknown> {
  cacheKey: string;
  data: T;
  cachedAt: string;
}

// In-memory store fallback for Node/Vitest environments without browser IndexedDB
const memoryDrafts = new Map<string, OfflineDraftRecord>();
const memoryQueue = new Map<string, OfflineQueueItem>();
const memoryCache = new Map<string, TierBCacheRecord>();

async function getDb(): Promise<IDBPDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: "draftKey" });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "operationId" });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: "cacheKey" });
      }
    },
  });
}

/**
 * Offline Privacy Sanitizer (06 §23–24).
 * Strips passwords, auth secrets, server tokens, guardian contact details,
 * consent evidence, and bulk confidential notes before local persistence.
 */
const FORBIDDEN_OFFLINE_KEYS = new Set([
  "password",
  "passwordHash",
  "password_hash",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "serviceRoleKey",
  "secret",
  "guardian",
  "guardianPhone",
  "guardianAddress",
  "consentEvidence",
]);

export function sanitizeForOfflineStorage<T>(input: T): T {
  if (input === null || input === undefined || typeof input !== "object") {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeForOfflineStorage(item)) as unknown as T;
  }

  const clone: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (FORBIDDEN_OFFLINE_KEYS.has(key)) {
      continue;
    }
    clone[key] = sanitizeForOfflineStorage(value);
  }
  return clone as T;
}

/**
 * Tier C Online-Only Guard (06 §6 Tier C).
 * Governance, Publishing, Administration, and live Audit MUST NOT queue offline.
 */
export function checkTierCOnlineAvailability(
  moduleName: TierCModule,
  isOnline = typeof window === "undefined" ||
  typeof window.navigator?.onLine !== "boolean"
    ? true
    : window.navigator.onLine
): { allowed: true } | { allowed: false; message: string } {
  if (!isOnline) {
    return {
      allowed: false,
      message: `Modul ${moduleName} memerlukan koneksi internet aktif agar setiap keputusan langsung tervalidasi dan tercatat dalam jejak audit server.`,
    };
  }
  return { allowed: true };
}

/**
 * Operational Draft Persistence (Layer 3 — 06 §8).
 */
export async function saveOperationalDraft<T>(
  draftKey: string,
  entityType: OfflineEntityType,
  data: T
): Promise<OfflineDraftRecord<T>> {
  const sanitized = sanitizeForOfflineStorage(data);
  const record: OfflineDraftRecord<T> = {
    draftKey,
    entityType,
    data: sanitized,
    updatedAt: new Date().toISOString(),
  };

  const db = await getDb();
  if (db) {
    await db.put(DRAFTS_STORE, record);
  } else {
    memoryDrafts.set(draftKey, record);
  }
  return record;
}

export async function loadOperationalDraft<T>(
  draftKey: string
): Promise<OfflineDraftRecord<T> | null> {
  const db = await getDb();
  if (db) {
    const rec = await db.get(DRAFTS_STORE, draftKey);
    return (rec as OfflineDraftRecord<T>) ?? null;
  }
  return (memoryDrafts.get(draftKey) as OfflineDraftRecord<T>) ?? null;
}

export async function removeOperationalDraft(draftKey: string): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.delete(DRAFTS_STORE, draftKey);
  } else {
    memoryDrafts.delete(draftKey);
  }
}

/**
 * Sync Queue Management (Layer 4 — 06 §12 + 09 §28).
 */
export async function enqueueSyncOperation<
  TPayload extends Record<string, unknown>,
>(params: {
  operationId?: string;
  operation: OfflineOperationType;
  entityType: OfflineEntityType;
  entityId: string;
  payload: TPayload;
  createdAt?: string;
}): Promise<OfflineQueueItem<TPayload>> {
  const item: OfflineQueueItem<TPayload> = {
    operationId: params.operationId ?? uuidv7(),
    operation: params.operation,
    entityType: params.entityType,
    entityId: params.entityId,
    payload: sanitizeForOfflineStorage(params.payload),
    createdAt: params.createdAt ?? new Date().toISOString(),
    syncStatus: "PENDING",
    syncedAt: null,
    lastError: null,
    conflictNeedsManualReview: false,
  };

  const db = await getDb();
  if (db) {
    await db.put(QUEUE_STORE, item);
  } else {
    memoryQueue.set(item.operationId, item);
  }
  return item;
}

export async function listSyncQueueItems(): Promise<OfflineQueueItem[]> {
  const db = await getDb();
  const list = db
    ? ((await db.getAll(QUEUE_STORE)) as OfflineQueueItem[])
    : Array.from(memoryQueue.values());

  return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function updateSyncQueueItemStatus(
  operationId: string,
  updates: Partial<
    Pick<
      OfflineQueueItem,
      | "syncStatus"
      | "syncedAt"
      | "lastError"
      | "conflictNeedsManualReview"
    >
  >
): Promise<OfflineQueueItem | null> {
  const db = await getDb();
  const existing = db
    ? ((await db.get(QUEUE_STORE, operationId)) as OfflineQueueItem | undefined)
    : memoryQueue.get(operationId);

  if (!existing) return null;

  const updated: OfflineQueueItem = {
    ...existing,
    ...updates,
  };

  if (db) {
    await db.put(QUEUE_STORE, updated);
  } else {
    memoryQueue.set(operationId, updated);
  }
  return updated;
}

export async function clearOfflineTestState(): Promise<void> {
  memoryDrafts.clear();
  memoryQueue.clear();
  memoryCache.clear();
}

/**
 * Tier B Read Cache (06 §6 Tier B — Cached Student Lookup / Detail / Schedules).
 */
export async function saveTierBCache<T>(
  cacheKey: string,
  data: T
): Promise<TierBCacheRecord<T>> {
  const record: TierBCacheRecord<T> = {
    cacheKey,
    data: sanitizeForOfflineStorage(data),
    cachedAt: new Date().toISOString(),
  };

  const db = await getDb();
  if (db) {
    await db.put(CACHE_STORE, record);
  } else {
    memoryCache.set(cacheKey, record);
  }
  return record;
}

export async function loadTierBCache<T>(
  cacheKey: string
): Promise<TierBCacheRecord<T> | null> {
  const db = await getDb();
  if (db) {
    const rec = await db.get(CACHE_STORE, cacheKey);
    return (rec as TierBCacheRecord<T>) ?? null;
  }
  return (memoryCache.get(cacheKey) as TierBCacheRecord<T>) ?? null;
}

