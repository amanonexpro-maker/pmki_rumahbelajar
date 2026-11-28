import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateMyAvatarUrl } from "@/features/identity";
import { getCurrentSession } from "@/server/auth/session";

const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Silakan masuk terlebih dahulu.",
          },
        },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Konfigurasi penyimpanan Supabase belum tersedia.",
          },
        },
        { status: 500 }
      );
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "Pilih file foto terlebih dahulu.",
          },
        },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES.get(file.type);
    if (!ext) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "Format foto harus JPG, PNG, atau WebP.",
          },
        },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "Ukuran foto maksimal 2 MB.",
          },
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const objectPath = `${session.id}/avatar-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data: bucketData, error: bucketGetError } =
      await supabaseAdmin.storage.getBucket("avatars");
    if (bucketGetError || !bucketData) {
      const { error: createBucketError } =
        await supabaseAdmin.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: MAX_BYTES,
          allowedMimeTypes: Array.from(ALLOWED_TYPES.keys()),
        });
      if (createBucketError) {
        console.error(
          "[POST /api/profile/avatar] createBucket failed:",
          createBucketError
        );
      }
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error(
        "[POST /api/profile/avatar] Storage upload failed:",
        uploadError
      );
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: `Gagal mengunggah foto profil: ${uploadError.message}`,
          },
        },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(objectPath);

    const updateRes = await updateMyAvatarUrl(
      session.id,
      publicUrlData.publicUrl
    );
    if (!updateRes.success) {
      return NextResponse.json({ error: updateRes.error }, { status: 400 });
    }

    revalidatePath("/workspace", "layout");
    revalidatePath("/workspace/profile");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      data: { avatarUrl: updateRes.data.avatarUrl },
    });
  } catch (err) {
    console.error("[POST /api/profile/avatar] Unhandled error:", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            err instanceof Error
              ? `Terjadi kesalahan saat mengunggah foto: ${err.message}`
              : "Terjadi kesalahan saat mengunggah foto profil.",
        },
      },
      { status: 500 }
    );
  }
}
