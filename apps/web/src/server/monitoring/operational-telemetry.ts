/**
 * Operational Telemetry & Performance Budget Monitor (`09 §39–40`, `06 §27`).
 *
 * Performance Budgets (`09 §40`):
 * - Standard Server Action / Query: < 500ms
 * - Heavy Workflow / Aggregation: < 2000ms
 *
 * Tracks latency, errors, permission denials, validation failures, and offline sync metrics
 * in-memory and via structured JSON telemetry logs without exposing PII or secrets.
 */

export const PERFORMANCE_BUDGET_MS = {
  NORMAL_ACTION_MAX_MS: 500,
  HEAVY_ACTION_MAX_MS: 2000,
  PUBLIC_INITIAL_LOAD_MAX_MS: 3000,
  PUBLIC_REPEATED_LOAD_MAX_MS: 1000,
} as const;

export type TelemetryEventCategory =
  | "ACTION_LATENCY"
  | "PERMISSION_DENIED"
  | "VALIDATION_FAILURE"
  | "POLICY_DENIED"
  | "SYNC_PROCESSED"
  | "SYNC_FAILURE"
  | "UNEXPECTED_ERROR";

export interface TelemetryCountersSnapshot {
  totalActionsMeasured: number;
  budgetExceededCount: number;
  permissionDenialsCount: number;
  policyDenialsCount: number;
  validationFailuresCount: number;
  syncProcessedCount: number;
  syncFailuresCount: number;
  unexpectedErrorsCount: number;
  lastUpdatedAt: string;
}

const counters: TelemetryCountersSnapshot = {
  totalActionsMeasured: 0,
  budgetExceededCount: 0,
  permissionDenialsCount: 0,
  policyDenialsCount: 0,
  validationFailuresCount: 0,
  syncProcessedCount: 0,
  syncFailuresCount: 0,
  unexpectedErrorsCount: 0,
  lastUpdatedAt: new Date().toISOString(),
};

export function recordOperationalTelemetry(event: {
  category: TelemetryEventCategory;
  operationName: string;
  durationMs?: number;
  isHeavyOperation?: boolean;
  errorCode?: string;
}): { withinBudget: boolean; thresholdMs: number } {
  counters.lastUpdatedAt = new Date().toISOString();

  const thresholdMs = event.isHeavyOperation
    ? PERFORMANCE_BUDGET_MS.HEAVY_ACTION_MAX_MS
    : PERFORMANCE_BUDGET_MS.NORMAL_ACTION_MAX_MS;

  const durationMs = event.durationMs ?? 0;
  const withinBudget = durationMs <= thresholdMs;

  switch (event.category) {
    case "ACTION_LATENCY":
      counters.totalActionsMeasured += 1;
      if (!withinBudget) {
        counters.budgetExceededCount += 1;
      }
      break;
    case "PERMISSION_DENIED":
      counters.permissionDenialsCount += 1;
      break;
    case "POLICY_DENIED":
      counters.policyDenialsCount += 1;
      break;
    case "VALIDATION_FAILURE":
      counters.validationFailuresCount += 1;
      break;
    case "SYNC_PROCESSED":
      counters.syncProcessedCount += 1;
      break;
    case "SYNC_FAILURE":
      counters.syncFailuresCount += 1;
      break;
    case "UNEXPECTED_ERROR":
      counters.unexpectedErrorsCount += 1;
      break;
  }

  return { withinBudget, thresholdMs };
}

export async function measureServerOperation<T>(
  operationName: string,
  fn: () => Promise<T>,
  options?: { isHeavyOperation?: boolean }
): Promise<{ result: T; durationMs: number; withinBudget: boolean }> {
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    const { withinBudget } = recordOperationalTelemetry({
      category: "ACTION_LATENCY",
      operationName,
      durationMs,
      isHeavyOperation: options?.isHeavyOperation,
    });
    return { result, durationMs, withinBudget };
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    recordOperationalTelemetry({
      category: "UNEXPECTED_ERROR",
      operationName,
      durationMs,
      isHeavyOperation: options?.isHeavyOperation,
    });
    throw error;
  }
}

export function getOperationalTelemetrySnapshot(): TelemetryCountersSnapshot {
  return { ...counters };
}

export function resetOperationalTelemetryForTests(): void {
  counters.totalActionsMeasured = 0;
  counters.budgetExceededCount = 0;
  counters.permissionDenialsCount = 0;
  counters.policyDenialsCount = 0;
  counters.validationFailuresCount = 0;
  counters.syncProcessedCount = 0;
  counters.syncFailuresCount = 0;
  counters.unexpectedErrorsCount = 0;
  counters.lastUpdatedAt = new Date().toISOString();
}

