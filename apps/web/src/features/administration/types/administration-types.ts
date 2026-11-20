import type {
  ScopeCatalogDTO,
  UserMembershipDetailDTO,
} from "@/features/organization";

export interface AdminUserRoleTagDTO {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
}

export interface AdminUserOverrideDTO {
  permissionCode: string;
  permissionName: string;
  mode: "GRANT" | "REVOKE";
  reason: string | null;
}

export interface AdminUserRecordDTO {
  id: string;
  name: string;
  email: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: AdminUserRoleTagDTO[];
  overrides: AdminUserOverrideDTO[];
  memberships: UserMembershipDetailDTO[];
}

export interface AdminRoleRecordDTO {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCodes: string[];
  assignedUserCount: number;
}

export interface AdminPermissionRecordDTO {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
}

export interface AdministrationWorkspaceViewDTO {
  users: AdminUserRecordDTO[];
  roles: AdminRoleRecordDTO[];
  permissions: AdminPermissionRecordDTO[];
  scopeCatalog: ScopeCatalogDTO;
  isSandboxAllowed: boolean;
}

