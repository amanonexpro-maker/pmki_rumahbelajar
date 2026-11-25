export type UserPersona = "GURU" | "PENGURUS" | "SUPERADMIN";

export const PERSONA_ROLE_MAP: Record<UserPersona, readonly string[]> = {
  SUPERADMIN: ["PLATFORM_ADMIN", "AUDITOR"],
  PENGURUS: [
    "ORG_ADMIN",
    "UNIT_COORDINATOR",
    "PROGRAM_COORDINATOR",
    "EDITOR",
    "REVIEWER",
    "APPROVER",
  ],
  GURU: ["TEACHER", "VOLUNTEER", "STAKEHOLDER"],
} as const;

export const PERSONA_LABELS: Record<UserPersona, string> = {
  GURU: "Guru",
  PENGURUS: "Pengurus",
  SUPERADMIN: "Superadmin",
};

/**
 * Resolves a simplified UI persona from granular RBAC role codes.
 * Priority: SUPERADMIN > PENGURUS > GURU (default).
 */
export function getUserPersona(userRoles: readonly string[]): UserPersona {
  if (
    userRoles.some((role) => PERSONA_ROLE_MAP.SUPERADMIN.includes(role))
  ) {
    return "SUPERADMIN";
  }

  if (userRoles.some((role) => PERSONA_ROLE_MAP.PENGURUS.includes(role))) {
    return "PENGURUS";
  }

  return "GURU";
}

