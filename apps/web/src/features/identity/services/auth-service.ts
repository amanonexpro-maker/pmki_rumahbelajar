import { createClient } from "@supabase/supabase-js";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getOrganizationScopeCatalog } from "@/features/organization";
import { getRoleLabel, type SystemRole } from "@/lib/status";
import type { SessionUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/auth/supabase-server";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import {
  DEFAULT_GENERIC_PASSWORD,
  type ChangePasswordInput,
  type LoginInput,
  type ResetPasswordInput,
  type UpdateMyProfileInput,
} from "../validators/auth-validator";

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

export async function getIdentityUserStatusById(userId: string): Promise<{
  id: string;
  name: string;
  active: boolean;
  mustChangePassword: boolean;
  avatarUrl: string | null;
} | null> {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
      avatarUrl: users.avatarUrl,
    })
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
      mustChangePassword: true,
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
export async function resetIdentityUserPasswordToDefault(params: {
  userId: string;
  actorId: string | null;
}): Promise<ActionResult<{ reset: true }>> {
  const supabaseAdmin = createSupabaseAuthAdminClient();
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    params.userId,
    { password: DEFAULT_GENERIC_PASSWORD }
  );

  if (authError) {
    return fail(
      "INTERNAL_ERROR",
      "Gagal menyetel ulang kata sandi pengguna pada layanan autentikasi."
    );
  }

  const [updated] = await db
    .update(users)
    .set({
      mustChangePassword: true,
      updatedAt: new Date(),
      updatedBy: params.actorId,
    })
    .where(eq(users.id, params.userId))
    .returning({ id: users.id });

  if (!updated) {
    return fail("RESOURCE_NOT_FOUND", "Data pengguna tidak ditemukan.");
  }

  return ok({ reset: true });
}

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
    redirectTo: `${appUrl}/auth/reset-password`,
  });

  if (error) {
    return fail(
      "INTERNAL_ERROR",
      "Gagal mengirim tautan pemulihan kata sandi. Silakan coba kembali."
    );
  }

  return ok({ requested: true });
}

export async function changeAuthenticatedUserPassword(
  input: ChangePasswordInput
): Promise<ActionResult<{ updated: true }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return fail(
      "UNAUTHORIZED",
      "Sesi tidak valid atau telah berakhir. Silakan masuk kembali."
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: input.newPassword,
  });

  if (error) {
    return fail(
      "INTERNAL_ERROR",
      "Gagal memperbarui kata sandi. Pastikan kata sandi memenuhi syarat keamanan."
    );
  }

  await db
    .update(users)
    .set({
      mustChangePassword: false,
      updatedAt: new Date(),
      updatedBy: user.id,
    })
    .where(eq(users.id, user.id));

  return ok({ updated: true });
}

export interface MyProfilePermissionGroupDTO {
  moduleKey: string;
  moduleLabel: string;
  permissions: string[];
}

export interface MyProfileViewDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  publicBio: string | null;
  showOnPublic: boolean;
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: Array<{ code: string; label: string }>;
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    serviceUnitId: string;
    serviceUnitName: string;
  }>;
  permissionGroups: MyProfilePermissionGroupDTO[];
  totalPermissions: number;
}

const MODULE_LABELS: Record<string, string> = {
  student: "Peserta Didik",
  guardian: "Data Wali",
  attendance: "Kehadiran",
  development: "Perkembangan Peserta",
  academic: "Kelas & Pengajar",
  class: "Kelas & Pengajar",
  unit: "Kelas & Pengajar",
  consent: "Persetujuan",
  media: "Dokumentasi",
  publication: "Publikasi",
  report: "Laporan & Tata Kelola",
  audit: "Jejak Audit",
  user: "Administrasi Pengguna",
  role: "Administrasi Peran",
  permission: "Administrasi Hak Akses",
};

export async function getMyProfileView(
  session: SessionUser
): Promise<ActionResult<MyProfileViewDTO>> {
  const [userRows, scopeCatalog] = await Promise.all([
    db
      .select()
      .from(users)
      .where(and(eq(users.id, session.id), isNull(users.archivedAt)))
      .limit(1),
    getOrganizationScopeCatalog(),
  ]);

  const row = userRows[0];
  if (!row) {
    return fail("RESOURCE_NOT_FOUND", "Profil pengguna tidak ditemukan.");
  }

  const orgNameMap = new Map(
    scopeCatalog.organizations.map((o) => [o.id, o.name])
  );
  const unitNameMap = new Map(
    scopeCatalog.serviceUnits.map((u) => [u.id, u.name])
  );

  const grouped = new Map<string, string[]>();
  for (const perm of session.permissions) {
    const prefix = perm.split(".")[0] ?? "lainnya";
    const label = MODULE_LABELS[prefix] ?? "Lainnya";
    const list = grouped.get(label) ?? [];
    list.push(perm);
    grouped.set(label, list);
  }

  return ok({
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl ?? null,
    publicBio: row.publicBio ?? null,
    showOnPublic: row.showOnPublic,
    active: row.active,
    mustChangePassword: row.mustChangePassword,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    roles: session.roles.map((code) => ({
      code,
      label: getRoleLabel(code as SystemRole) ?? code,
    })),
    memberships: session.memberships.map((m) => ({
      organizationId: m.organizationId,
      organizationName: orgNameMap.get(m.organizationId) ?? "Organisasi PMKI",
      serviceUnitId: m.serviceUnitId,
      serviceUnitName: unitNameMap.get(m.serviceUnitId) ?? "Unit Layanan",
    })),
    permissionGroups: Array.from(grouped.entries()).map(
      ([moduleLabel, permissions]) => ({
        moduleKey: moduleLabel.toLowerCase().replace(/\s+/g, "-"),
        moduleLabel,
        permissions,
      })
    ),
    totalPermissions: session.permissions.length,
  });
}

export async function updateMyProfile(
  session: SessionUser,
  input: UpdateMyProfileInput
): Promise<ActionResult<{ updated: true }>> {
  const [updated] = await db
    .update(users)
    .set({
      name: input.name.trim(),
      publicBio: input.publicBio?.trim() || null,
      showOnPublic: input.showOnPublic,
      updatedAt: new Date(),
      updatedBy: session.id,
    })
    .where(and(eq(users.id, session.id), isNull(users.archivedAt)))
    .returning({ id: users.id });

  if (!updated) {
    return fail("RESOURCE_NOT_FOUND", "Profil pengguna tidak ditemukan.");
  }

  return ok({ updated: true });
}

export async function updateMyAvatarUrl(
  userId: string,
  avatarUrl: string
): Promise<ActionResult<{ avatarUrl: string }>> {
  const [updated] = await db
    .update(users)
    .set({
      avatarUrl,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(and(eq(users.id, userId), isNull(users.archivedAt)))
    .returning({ avatarUrl: users.avatarUrl });

  if (!updated) {
    return fail("RESOURCE_NOT_FOUND", "Profil pengguna tidak ditemukan.");
  }

  return ok({ avatarUrl: updated.avatarUrl ?? avatarUrl });
}

export interface PublicOptInIdentityProfileDTO {
  id: string;
  name: string;
  avatarUrl: string | null;
  publicBio: string | null;
}

export async function listPublicOptInIdentityProfiles(): Promise<
  PublicOptInIdentityProfileDTO[]
> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      publicBio: users.publicBio,
    })
    .from(users)
    .where(
      and(
        eq(users.active, true),
        eq(users.showOnPublic, true),
        isNull(users.archivedAt)
      )
    );

  return rows;
}
