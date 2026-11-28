import { randomUUID } from "node:crypto";
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
const AVATARS_BUCKET = "avatars";
const PUBLIC_BUCKET_MARKER = `/storage/v1/object/public/${AVATARS_BUCKET}/`;

function createStorageAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Safely extracts the object key inside the `avatars` bucket only if it belongs
 * to `expectedUserId` (`<userId>/...`), preventing cross-user deletion.
 */
function extractOwnedAvatarObjectPath(
  publicUrl: string | null | undefined,
  expectedUserId: string
): string | null {
  if (!publicUrl) return null;
  const markerIdx = publicUrl.indexOf(PUBLIC_BUCKET_MARKER);
  if (markerIdx === -1) return null;
  const rawKey = decodeURIComponent(
    publicUrl.slice(markerIdx + PUBLIC_BUCKET_MARKER.length).split("?")[0] ?? ""
  );
  if (!rawKey.startsWith(`${expectedUserId}/`) || rawKey.includes("..")) {
    return null;
  }
  return rawKey;
}

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

    const supabaseAdmin = createStorageAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Layanan penyimpanan belum siap. Silakan hubungi administrator.",
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

    // Unguessable random key per upload; bucket `avatars` is provisioned via Drizzle migration (0003).
    const objectPath = `${session.id}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: false,
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
            message:
              "Gagal mengunggah foto profil. Silakan periksa koneksi Anda dan coba kembali.",
          },
        },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(objectPath);

    const updateRes = await updateMyAvatarUrl(
      session.id,
      publicUrlData.publicUrl
    );
    if (!updateRes.success) {
      await supabaseAdmin.storage
        .from(AVATARS_BUCKET)
        .remove([objectPath])
        .catch(() => null);
      return NextResponse.json({ error: updateRes.error }, { status: 400 });
    }

    // Best-effort cleanup of previous avatar object so orphan files never accumulate.
    const previousKey = extractOwnedAvatarObjectPath(
      updateRes.data.previousAvatarUrl,
      session.id
    );
    if (previousKey && previousKey !== objectPath) {
      const { error: removeOldErr } = await supabaseAdmin.storage
        .from(AVATARS_BUCKET)
        .remove([previousKey]);
      if (removeOldErr) {
        console.warn(
          "[POST /api/profile/avatar] Old avatar cleanup skipped:",
          removeOldErr
        );
      }
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
            "Terjadi kendala saat memproses foto profil. Silakan coba beberapa saat lagi.",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
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

    const updateRes = await updateMyAvatarUrl(session.id, null);
    if (!updateRes.success) {
      return NextResponse.json({ error: updateRes.error }, { status: 400 });
    }

    const previousKey = extractOwnedAvatarObjectPath(
      updateRes.data.previousAvatarUrl,
      session.id
    );
    if (previousKey) {
      const supabaseAdmin = createStorageAdminClient();
      if (supabaseAdmin) {
        const { error: removeErr } = await supabaseAdmin.storage
          .from(AVATARS_BUCKET)
          .remove([previousKey]);
        if (removeErr) {
          console.warn(
            "[DELETE /api/profile/avatar] Avatar storage cleanup skipped:",
            removeErr
          );
        }
      }
    }

    revalidatePath("/workspace", "layout");
    revalidatePath("/workspace/profile");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      data: { avatarUrl: null },
    });
  } catch (err) {
    console.error("[DELETE /api/profile/avatar] Unhandled error:", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "Terjadi kendala saat menghapus foto profil. Silakan coba beberapa saat lagi.",
        },
      },
      { status: 500 }
    );
  }
}
