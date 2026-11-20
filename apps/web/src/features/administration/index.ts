/**
 * Administration Domain Public API (11 §19).
 */
export const DOMAIN_NAME = "administration" as const;

export {
  applyUserPermissionOverride,
  computeEffectivePermissions,
  createCustomRole,
  deleteUserPermissionOverride,
  getAdministrationWorkspaceView,
  provisionNewPlatformUser,
  resolveAccess,
  resolveAccessCached,
  setPlatformUserActiveState,
  updateUserRoleAssignments,
  updateUserScopeAssignment,
  upsertUserPermissionOverride,
  type ResolvedAccess,
} from "./services/access-service";

export {
  applyUserPermissionOverrideAction,
  createCustomRoleAction,
  provisionNewPlatformUserAction,
  setPlatformUserActiveStateAction,
  updateUserRoleAssignmentsAction,
  updateUserScopeAssignmentAction,
} from "./actions/administration-actions";

export {
  authorizeManagePermissions,
  authorizeManageRoles,
  authorizeManageUsers,
  authorizeReadAdministration,
  canAccessSandboxEnvironment,
  canReadAdministration,
} from "./permissions/administration-policy";

export {
  assignUserScopeSchema,
  createCustomRoleSchema,
  isPermissionCodePolicySafe,
  provisionUserSchema,
  setPermissionOverrideSchema,
  setUserActiveStatusSchema,
  updateUserRolesSchema,
  type AssignUserScopeInput,
  type CreateCustomRoleInput,
  type ProvisionUserInput,
  type SetPermissionOverrideInput,
  type SetUserActiveStatusInput,
  type UpdateUserRolesInput,
} from "./validators/administration-validator";

export type {
  AdministrationWorkspaceViewDTO,
  AdminPermissionRecordDTO,
  AdminRoleRecordDTO,
  AdminUserOverrideDTO,
  AdminUserRecordDTO,
  AdminUserRoleTagDTO,
} from "./types/administration-types";

export { AdministrationWorkspaceClient } from "./components/administration-workspace-client";

