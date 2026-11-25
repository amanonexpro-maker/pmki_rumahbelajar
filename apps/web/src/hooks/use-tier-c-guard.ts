"use client";

import * as React from "react";
import { useConnectivity } from "@/hooks/use-connectivity";
import { checkTierCOnlineAvailability } from "@/lib/offline";

export type TierCBlockedHandler = (message: string) => void;
export type TierCModuleName = Parameters<typeof checkTierCOnlineAvailability>[0];

/**
 * Standardizes Tier C online-only availability checks across workspace clients.
 * Automatically reads connectivity state and routes offline blocks to a consistent handler.
 */
export function useTierCGuard(
  featureName: TierCModuleName,
  onDefaultBlocked?: TierCBlockedHandler
) {
  const { status: connectivityStatus } = useConnectivity();
  const isOnline = connectivityStatus !== "OFFLINE";

  const checkOnline = React.useCallback(
    (onBlocked?: TierCBlockedHandler): boolean => {
      const check = checkTierCOnlineAvailability(featureName, isOnline);
      if (!check.allowed) {
        (onBlocked ?? onDefaultBlocked)?.(check.message);
        return false;
      }
      return true;
    },
    [featureName, isOnline, onDefaultBlocked]
  );

  const withTierCGuard = React.useCallback(
    async <T,>(
      action: () => Promise<T> | T,
      onBlocked?: TierCBlockedHandler
    ): Promise<T | undefined> => {
      if (!checkOnline(onBlocked)) {
        return undefined;
      }
      return await action();
    },
    [checkOnline]
  );

  return { isOnline, checkOnline, withTierCGuard };
}
