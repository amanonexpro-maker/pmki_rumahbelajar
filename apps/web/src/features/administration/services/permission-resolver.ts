/**
 * Pure permission set resolution (05 §11):
 * Role Permissions -> GRANT overrides -> REVOKE overrides (REVOKE ALWAYS WINS).
 */
export function computeEffectivePermissions(
  rolePermissions: string[],
  grantedOverrides: string[],
  revokedOverrides: string[]
): string[] {
  const effective = new Set<string>(rolePermissions);
  for (const granted of grantedOverrides) {
    effective.add(granted);
  }
  for (const revoked of revokedOverrides) {
    effective.delete(revoked);
  }
  return Array.from(effective).sort();
}

