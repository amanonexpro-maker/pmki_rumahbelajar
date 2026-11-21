import { createClient } from "@supabase/supabase-js";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createSupabaseServerClient } from "@/server/auth/supabase-server";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import type { LoginInput, ResetPasswordInput } from "../validators/auth-validator";

export interface IdentityUserSummaryDTO {
  id: string;
  name: string;
  email: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

function createSupabaseAuthAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the server."
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getUserNamesByIds(
  userIds: string[]
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const map = new Map<string, string>();
  if (uniqueIds.length === 0) return map;

  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, uniqueIds));

  for (const r of rows) {
    map.set(r.id, r.name);
  }
  return map;
}

export async function getIdentityUserStatusById(
  userId: string
): Promise<{ id: string; name: string; active: boolean } | null> {
  const [row] = await db
    .select({ id: users.id, name: users.name, active: users.active })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.archivedAt)))
    .limit(1);
  return row ?? null;
}

export async function listAllIdentityUsers(): Promise<
  IdentityUserSummaryDTO[]
> {
  const rows = await db
    .select()
    .from(users)
    .where(isNull(users.archivedAt))
    .orderBy(desc(users.active), users.name);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    active: r.active,
    lastLoginAt: r.lastLoginAt ? r.lastLoginAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Server-Side User Provisioning via Supabase Auth Admin API (ADR-13 D-26).
 * `enable_signup = false`: users can ONLY be provisioned here by Administration.
 * `public.users.id` = `auth.users.id` (UUID v4), without `password_hash` or `role`.
 */
export async function provisionIdentityUserViaAdminApi(params: {
  name: string;
  email: string;
  initialPassword: string;
  actorId: string;
}): Promise<ActionResult<IdentityUserSummaryDTO>> {
  const normalizedEmail = params.email.trim().toLowerCase();

  const [existingProfile] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingProfile) {
    return fail(
      "RESOURCE_CONFLICT",
      "Alamat email tersebut sudah terdaftar pada pengguna lain."
    );
  }

  const supabaseAdmin = createSupabaseAuthAdminClient();
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: params.initialPassword,
      email_confirm: true,
      user_metadata: { name: params.name.trim() },
    });

  if (authError || !authData.user) {
    return fail(
      "INTERNAL_ERROR",
      "Gagal membuat akun pengguna pada layanan autentikasi Supabase."
    );
  }

  const [created] = await db
    .insert(users)
    .values({
      id: authData.user.id,
      name: params.name.trim(),
      email: normalizedEmail,
      active: true,
      createdBy: params.actorId,
      updatedBy: params.actorId,
    })
    .returning();

  return ok({
    id: created.id,
    name: created.name,
    email: created.email,
    active: created.active,
    lastLoginAt: null,
    createdAt: created.createdAt.toISOString(),
  });
}

/**
 * Soft Activate / Deactivate User Profile (No hard delete — 04, 05 §16).
 */
export async function updateIdentityUserActiveState(params: {
  userId: string;
  active: boolean;
  actorId: string;
}): Promise<ActionResult<IdentityUserSummaryDTO>> {
  const [updated] = await db
    .update(users)
    .set({
      active: params.active,
      updatedAt: new Date(),
      updatedBy: params.actorId,
    })
    .where(eq(users.id, params.userId))
    .returning();

  if (!updated) {
    return fail("RESOURCE_NOT_FOUND", "Data pengguna tidak ditemukan.");
  }

  return ok({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    active: updated.active,
    lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : null,
    createdAt: updated.createdAt.toISOString(),
  });
}

export async function signInWithEmailPassword(
  input: LoginInput
): Promise<ActionResult<{ userId: string }>> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user) {
    return fail(
      "UNAUTHORIZED",
      "Email atau kata sandi tidak sesuai. Silakan periksa kembali."
    );
  }

  return ok({ userId: data.user.id });
}

export async function signOutCurrentUser(): Promise<
  ActionResult<{ signedOut: true }>
> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return fail(
      "INTERNAL_ERROR",
      "Gagal mengakhiri sesi. Silakan coba kembali."
    );
  }

  return ok({ signedOut: true });
}

export async function requestPasswordReset(
  input: ResetPasswordInput
): Promise<ActionResult<{ requested: true }>> {
  const supabase = await createSupabaseServerClient();
  const appUrl =
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://pmkirumahbelajar-web.vercel.app");

  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${appUrl}/auth/login`,
  });

  if (error) {
    return fail(
      "INTERNAL_ERROR",
      "Gagal mengirim tautan pemulihan kata sandi. Silakan coba kembali."
    );
  }

  return ok({ requested: true });
}
