import { NextResponse } from "next/server";
import { getHumanErrorMessage } from "@/lib/messages";
import { getCurrentSession } from "@/server/auth/session";
import { fail } from "@/server/contracts/result";
import { processOfflineSyncOperation } from "@/server/sync/sync-processor";

/**
 * Offline Sync Route Handler `/api/sync` (09 §27–29, 06 §12–14).
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        fail("UNAUTHORIZED", getHumanErrorMessage("UNAUTHORIZED")),
        { status: 401 }
      );
    }

    const body = (await request.json()) as unknown;
    const result = await processOfflineSyncOperation(session, body);

    const status = result.success
      ? 200
      : result.error.code === "UNAUTHORIZED"
        ? 401
        : result.error.code === "PERMISSION_DENIED" ||
            result.error.code === "SCOPE_DENIED" ||
            result.error.code === "POLICY_DENIED"
          ? 403
          : result.error.code === "RESOURCE_CONFLICT"
            ? 409
            : 400;

    return NextResponse.json(result, { status });
  } catch {
    return NextResponse.json(
      fail("INTERNAL_ERROR", getHumanErrorMessage("INTERNAL_ERROR")),
      { status: 500 }
    );
  }
}

