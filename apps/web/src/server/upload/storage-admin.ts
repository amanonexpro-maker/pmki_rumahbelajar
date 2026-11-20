import { createClient } from "@supabase/supabase-js";

/**
 * Server-Only Supabase Storage Admin Helper (ADR-13 D-22, D-23, D-29).
 * Uses `SUPABASE_SERVICE_ROLE_KEY` exclusively on the server to issue signed upload
 * and read URLs for the private `"media"` bucket.
 *
 * CRITICAL RULE (D-29 & Product Owner Rule #3):
 * Signed read URL TTL MUST strictly exceed Next.js page cache/revalidate TTL.
 */
export const PAGE_CACHE_REVALIDATE_SECONDS = 300; // 5 minutes

export function getMediaBucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "media";
}

export function getMediaSignedUrlTtlSeconds(): number {
  const configured = Number.parseInt(
    process.env.MEDIA_SIGNED_URL_TTL ?? "3600",
    10
  );
  const safeConfigured =
    Number.isFinite(configured) && configured > 0 ? configured : 3600;
  // Guarantee TTL > PAGE_CACHE_REVALIDATE_SECONDS (minimum 2x revalidate window)
  return Math.max(safeConfigured, PAGE_CACHE_REVALIDATE_SECONDS * 2);
}

function createSupabaseStorageAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the server."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function createPrivateStorageSignedUploadUrl(
  filePath: string
): Promise<{ signedUrl: string; token: string; path: string } | null> {
  const supabase = createSupabaseStorageAdminClient();
  const bucket = getMediaBucketName();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    return null;
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  };
}

export async function createPrivateStorageSignedReadUrl(
  filePath: string,
  overrideTtlSeconds?: number
): Promise<{ signedUrl: string; ttlSeconds: number; expiresAt: string } | null> {
  const supabase = createSupabaseStorageAdminClient();
  const bucket = getMediaBucketName();
  const ttlSeconds = Math.max(
    overrideTtlSeconds ?? getMediaSignedUrlTtlSeconds(),
    PAGE_CACHE_REVALIDATE_SECONDS + 60
  );

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, ttlSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  return {
    signedUrl: data.signedUrl,
    ttlSeconds,
    expiresAt,
  };
}

export async function removePrivateStorageObject(
  filePath: string
): Promise<void> {
  try {
    const supabase = createSupabaseStorageAdminClient();
    const bucket = getMediaBucketName();
    await supabase.storage.from(bucket).remove([filePath]);
  } catch {
    // Ignore cleanup failure in tests
  }
}

