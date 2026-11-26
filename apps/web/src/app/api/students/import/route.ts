import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  commitStudentImportXlsx,
  parseAndValidateStudentImportXlsx,
} from "@/features/students";
import { getHumanErrorMessage } from "@/lib/messages";
import { getCurrentSession } from "@/server/auth/session";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Format permintaan unggahan berkas tidak valid.",
        },
      },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const mode = formData.get("mode") === "commit" ? "commit" : "preview";

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Pilih berkas Excel (.xlsx) terlebih dahulu.",
        },
      },
      { status: 400 }
    );
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Hanya berkas berformat .xlsx yang didukung.",
        },
      },
      { status: 400 }
    );
  }

  if (file.size === 0 || file.size > MAX_IMPORT_BYTES) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Ukuran berkas Excel harus antara 1 byte hingga 5 MB.",
        },
      },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (mode === "preview") {
    const result = await parseAndValidateStudentImportXlsx(session, bytes);
    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  }

  const result = await commitStudentImportXlsx(session, bytes);
  if (result.success) {
    revalidatePath("/workspace/students");
    revalidatePath("/workspace");
  }
  return NextResponse.json(result, {
    status: result.success ? 200 : 400,
  });
}
