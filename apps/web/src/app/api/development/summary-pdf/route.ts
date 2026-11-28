import { NextRequest, NextResponse } from "next/server";
import { generateStudentDevelopmentSummaryPdf } from "@/features/development";
import { getCurrentSession } from "@/server/auth/session";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  const studentId = request.nextUrl.searchParams.get("studentId")?.trim() ?? "";
  const checkOnly = request.nextUrl.searchParams.get("check") === "1";

  const result = await generateStudentDevelopmentSummaryPdf(session, studentId, {
    checkOnly,
  });
  if (!result.success) {
    const status =
      result.error.code === "UNAUTHORIZED"
        ? 401
        : result.error.code === "PERMISSION_DENIED" ||
            result.error.code === "SCOPE_DENIED" ||
            result.error.code === "POLICY_DENIED"
          ? 403
          : result.error.code === "RESOURCE_NOT_FOUND"
            ? 404
            : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  if (checkOnly) {
    return NextResponse.json(
      { ok: true, filename: result.data.filename },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  return new NextResponse(Buffer.from(result.data.bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.data.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

