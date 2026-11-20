import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult, type ErrorCode } from "@/server/contracts/result";
import { getHumanErrorMessage } from "@/lib/messages";

export type DataClassification =
  | "PUBLIC"
  | "STAKEHOLDER"
  | "INTERNAL"
  | "CONFIDENTIAL";

export interface AuthorizationOptions {
  /** Scope checks (05 §12) */
  organizationId?: string;
  serviceUnitId?: string;
  programId?: string;
  /** Separation of Duties policy (05 §15): actor MUST NOT equal resourceOwnerId */
  requireSeparationOfDuties?: boolean;
  resourceOwnerId?: string | null;
  /** Data classification guard (05 §13–14) */
  classification?: DataClassification;
}

export interface AuthorizationDecision {
  allowed: boolean;
  code?: ErrorCode;
  message?: string;
}

/**
 * Evaluates scope membership against requested organization/unit/program (05 §12).
 * Empty scope options pass; otherwise user must hold a matching membership.
 */
export function hasScopeAccess(
  user: SessionUser,
  options?: Pick<
    AuthorizationOptions,
    "organizationId" | "serviceUnitId" | "programId"
  >
): boolean {
  if (
    !options?.organizationId &&
    !options?.serviceUnitId &&
    !options?.programId
  ) {
    return true;
  }

  return user.memberships.some((m) => {
    if (options.organizationId && m.organizationId !== options.organizationId) {
      return false;
    }
    if (options.serviceUnitId && m.serviceUnitId !== options.serviceUnitId) {
      return false;
    }
    if (options.programId && m.programId && m.programId !== options.programId) {
      return false;
    }
    return true;
  });
}

/**
 * Full Server-Side Authorization Chain (05 §3, 09 §17):
 * Authentication -> Permission -> Scope -> Policy (SoD & Classification).
 *
 * CRITICAL RULES:
 * - Default Deny.
 * - NEVER bypass based on role === "ADMIN" or "PLATFORM_ADMIN".
 * - Policy (Separation of Duties, Confidential Data) ALWAYS WINS over role/permission/admin.
 */
export function evaluateAuthorization(
  user: SessionUser | null | undefined,
  permission: string,
  options?: AuthorizationOptions
): AuthorizationDecision {
  // 1. Authentication
  if (!user || !user.id) {
    return {
      allowed: false,
      code: "UNAUTHORIZED",
      message: getHumanErrorMessage("UNAUTHORIZED"),
    };
  }

  // 2. Permission (resolved per-request from DB: Role -> Grant -> Revoke)
  if (!user.permissions.includes(permission)) {
    return {
      allowed: false,
      code: "PERMISSION_DENIED",
      message: getHumanErrorMessage("PERMISSION_DENIED"),
    };
  }

  // 3. Scope (Organization / Service Unit / Program)
  if (!hasScopeAccess(user, options)) {
    return {
      allowed: false,
      code: "SCOPE_DENIED",
      message: getHumanErrorMessage("SCOPE_DENIED"),
    };
  }

  // 4. Policy — Separation of Duties (05 §15) — wins even over PLATFORM_ADMIN
  if (
    options?.requireSeparationOfDuties &&
    options.resourceOwnerId &&
    options.resourceOwnerId === user.id
  ) {
    return {
      allowed: false,
      code: "POLICY_DENIED",
      message:
        "Tindakan ini tidak dapat dilakukan oleh pihak yang sama sesuai prinsip pemisahan tugas.",
    };
  }

  // 5. Policy — Confidential Classification (05 §13–14)
  // Default DENY unless explicit permission was verified above AND scope passed.
  if (options?.classification === "CONFIDENTIAL" && !permission) {
    return {
      allowed: false,
      code: "POLICY_DENIED",
      message: getHumanErrorMessage("POLICY_DENIED"),
    };
  }

  return { allowed: true };
}

/**
 * Boolean convenience check for server services & policies (05 §21).
 */
export function can(
  user: SessionUser | null | undefined,
  permission: string,
  options?: AuthorizationOptions
): boolean {
  return evaluateAuthorization(user, permission, options).allowed;
}

/**
 * Guard returning ActionResult<true> with canonical ErrorCode & Indonesian message.
 */
export function authorize(
  user: SessionUser | null | undefined,
  permission: string,
  options?: AuthorizationOptions
): ActionResult<true> {
  const decision = evaluateAuthorization(user, permission, options);
  if (!decision.allowed) {
    return fail(
      decision.code ?? "PERMISSION_DENIED",
      decision.message ?? getHumanErrorMessage("PERMISSION_DENIED")
    );
  }
  return ok(true);
}

/**
 * Explicit helper for CONFIDENTIAL data (guardian data, development notes, consent evidence, private address).
 * Default DENY unless user holds the exact explicit permission + valid scope.
 */
export function canAccessConfidential(
  user: SessionUser | null | undefined,
  explicitPermission:
    | "guardian.read"
    | "guardian.update"
    | "development.read"
    | "development.create"
    | "development.update"
    | "consent.read"
    | "consent.review",
  options?: Omit<AuthorizationOptions, "classification">
): boolean {
  return can(user, explicitPermission, {
    ...options,
    classification: "CONFIDENTIAL",
  });
}

