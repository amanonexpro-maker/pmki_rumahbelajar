"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type QueryParamUpdates = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface UseUrlQueryParamsOptions {
  /** Values treated as default and removed from the URL (default: `["ALL"]`). */
  emptyValues?: string[];
}

/**
 * Merges query parameter updates with current URL search params and triggers
 * client-side navigation via Next.js router with `scroll: false`.
 */
export function useUrlQueryParams(options?: UseUrlQueryParamsOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const emptyValues = options?.emptyValues;

  const updateQuery = React.useCallback(
    (updates: QueryParamUpdates) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      const ignoredValues = emptyValues ?? ["ALL"];

      for (const [key, rawValue] of Object.entries(updates)) {
        if (rawValue === null || rawValue === undefined) {
          next.delete(key);
          continue;
        }

        const value = String(rawValue);
        if (
          !value ||
          ignoredValues.includes(value) ||
          (key === "page" && value === "1")
        ) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }

      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [emptyValues, pathname, router, searchParams]
  );

  return { updateQuery, searchParams, pathname, router };
}

