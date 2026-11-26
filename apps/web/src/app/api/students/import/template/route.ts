import { NextResponse } from "next/server";
import {
  canImportStudents,
  generateStudentImportTemplateWorkbook,
} from "@/features/students";
import { getHumanErrorMessage } from "@/lib/messages";
import { getCurrentSession } from "@/server/auth/session";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: getHumanErrorMessage("UNAUTHORIZED"),
        },
      },
      { status: 401 }
    );
  }

  if (!canImportStudents(session)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PERMISSION_DENIED",
          message: getHumanErrorMessage("PERMISSION_DENIED"),
        },
      },
      { status: 403 }
    );
  }

  const bytes = await generateStudentImportTemplateWorkbook();
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="templat-impor-peserta-didik-pmki.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
