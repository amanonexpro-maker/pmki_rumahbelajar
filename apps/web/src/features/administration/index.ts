/**
 * Administration Domain Public API (11 §19).
 */
export const DOMAIN_NAME = "administration" as const;

export {
  applyUserPermissionOverride,
  computeEffectivePermissions,
  createCustomRole,
  deleteCustomRole,
  deleteUserPermissionOverride,
  getAdministrationWorkspaceView,
  provisionNewPlatformUser,
  removeUserPermissionOverride,
  resetUserToDefaultPassword,
  resolveAccess,
  resolveAccessCached,
  setPlatformUserActiveState,
  updateCustomRole,
  updateUserRoleAssignments,
  updateUserScopeAssignment,
  upsertUserPermissionOverride,
  type ResolvedAccess,
} from "./services/access-service";

export {
  applyUserPermissionOverrideAction,
  createCustomRoleAction,
  deleteCustomRoleAction,
  provisionNewPlatformUserAction,
  removeUserPermissionOverrideAction,
  resetUserToDefaultPasswordAction,
  setPlatformUserActiveStateAction,
  updateCustomRoleAction,
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
  deleteCustomRoleSchema,
  isPermissionCodePolicySafe,
  provisionUserSchema,
  setPermissionOverrideSchema,
  setUserActiveStatusSchema,
  updateCustomRoleSchema,
  updateUserRolesSchema,
  type AssignUserScopeInput,
  type CreateCustomRoleInput,
  type DeleteCustomRoleInput,
  type ProvisionUserInput,
  type SetPermissionOverrideInput,
  type SetUserActiveStatusInput,
  type UpdateCustomRoleInput,
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

