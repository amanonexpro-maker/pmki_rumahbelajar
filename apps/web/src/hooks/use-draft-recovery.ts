"use client";

import * as React from "react";
import {
  loadOperationalDraft,
  removeOperationalDraft,
  saveOperationalDraft,
  type OfflineEntityType,
} from "@/lib/offline";

export interface UseDraftRecoveryResult<T> {
  draft: T;
  setDraft: React.Dispatch<React.SetStateAction<T>>;
  hasRecoveredDraft: boolean;
  lastSavedAt: string | null;
  saveDraftNow: (nextData?: T) => Promise<void>;
  clearDraft: () => Promise<void>;
}

/**
 * Hook for resilient operational draft recovery via IndexedDB (06 §8, §10–11).
 * Survives page refresh, accidental tab close, and connectivity drops.
 */
export function useDraftRecovery<T>(
  draftKey: string,
  entityType: OfflineEntityType,
  initialValue: T
): UseDraftRecoveryResult<T> {
  const [draft, setDraft] = React.useState<T>(initialValue);
  const [hasRecoveredDraft, setHasRecoveredDraft] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void loadOperationalDraft<T>(draftKey).then((saved) => {
      if (!active) return;
      if (saved) {
        setDraft(saved.data);
        setHasRecoveredDraft(true);
        setLastSavedAt(saved.updatedAt);
      } else {
        setHasRecoveredDraft(false);
        setLastSavedAt(null);
      }
    });
    return () => {
      active = false;
    };
  }, [draftKey]);

  const saveDraftNow = React.useCallback(
    async (nextData?: T) => {
      const target = nextData ?? draft;
      const saved = await saveOperationalDraft(draftKey, entityType, target);
      setLastSavedAt(saved.updatedAt);
    },
    [draft, draftKey, entityType]
  );

  const clearDraft = React.useCallback(async () => {
    await removeOperationalDraft(draftKey);
    setHasRecoveredDraft(false);
    setLastSavedAt(null);
  }, [draftKey]);

  return {
    draft,
    setDraft,
    hasRecoveredDraft,
    lastSavedAt,
    saveDraftNow,
    clearDraft,
  };
}

