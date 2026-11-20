import {
  findActiveMembershipsByUserId,
  findAllUserMembershipsDetailed,
  findPilotServiceUnit,
  findScopeCatalog,
  upsertUserScopeMembershipRow,
  type MembershipRecord,
  type ScopeCatalogDTO,
  type ServiceUnitScope,
  type UserMembershipDetailDTO,
} from "../repositories/membership-repository";

export type {
  MembershipRecord,
  ScopeCatalogDTO,
  ServiceUnitScope,
  UserMembershipDetailDTO,
};

/**
 * Organization Domain Service — retrieves and manages active scope memberships.
 * Cross-domain consumers (`administration`) MUST call this service.
 */
export async function getUserMemberships(
  userId: string
): Promise<MembershipRecord[]> {
  return findActiveMembershipsByUserId(userId);
}

export async function getDefaultPilotServiceUnit(): Promise<ServiceUnitScope | null> {
  return findPilotServiceUnit("RB_GRIYA_ASIH_LAWANG");
}

export async function getOrganizationScopeCatalog(): Promise<ScopeCatalogDTO> {
  return findScopeCatalog();
}

export async function listAllUserScopeMemberships(): Promise<
  UserMembershipDetailDTO[]
> {
  return findAllUserMembershipsDetailed();
}

export async function assignOrUpdateUserScopeMembership(params: {
  userId: string;
  organizationId: string;
  serviceUnitId: string;
  programId?: string | null;
  active?: boolean;
  actorId: string;
}) {
  return upsertUserScopeMembershipRow(params);
}
