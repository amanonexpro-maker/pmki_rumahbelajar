"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/contracts/result";
import {
  recordAttendanceSession,
  recordQuickAttendanceBatch,
} from "../services/attendance-service";
import type {
  RecordAttendanceSessionResultDTO,
  RecordQuickAttendanceResultDTO,
} from "../types/attendance-types";

/**
 * Thin Server Action for Attendance Domain (09 §6–8).
 */
export async function recordAttendanceSessionAction(
  payload: unknown
): Promise<ActionResult<RecordAttendanceSessionResultDTO>> {
  const session = await getCurrentSession();
  const result = await recordAttendanceSession(session, payload);
  if (result.success) {
    revalidatePath("/workspace/attendance");
  }
  return result;
}

export async function recordQuickAttendanceAction(
  payload: unknown
): Promise<ActionResult<RecordQuickAttendanceResultDTO>> {
  const session = await getCurrentSession();
  const result = await recordQuickAttendanceBatch(session, payload);
  if (result.success) {
    revalidatePath("/workspace/attendance");
  }
  return result;
}

