import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  organizations,
  programs,
  serviceUnits,
  userMemberships,
} from "@/db/schema";

export interface MembershipRecord {
  organizationId: string;
  serviceUnitId: string;
  programId?: string;
}

export interface ServiceUnitScope {
  organizationId: string;
  serviceUnitId: string;
  code: string;
  name: string;
}

export interface UserMembershipDetailDTO {
  id: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  serviceUnitId: string;
  serviceUnitName: string;
  programId: string | null;
  programName: string | null;
  active: boolean;
}

export interface ScopeCatalogDTO {
  organizations: Array<{ id: string; code: string; name: string }>;
  serviceUnits: Array<{
    id: string;
    organizationId: string;
    code: string;
    name: string;
  }>;
  programs: Array<{
    id: string;
    serviceUnitId: string;
    code: string;
    name: string;
  }>;
}

export async function findActiveMembershipsByUserId(
  userId: string
): Promise<MembershipRecord[]> {
  const rows = await db
    .select({
      organizationId: userMemberships.organizationId,
      serviceUnitId: userMemberships.serviceUnitId,
      programId: userMemberships.programId,
    })
    .from(userMemberships)
    .where(
      and(
        eq(userMemberships.userId, userId),
        eq(userMemberships.active, true),
        isNull(userMemberships.archivedAt)
      )
    );

  return rows.map((row) => ({
    organizationId: row.organizationId,
    serviceUnitId: row.serviceUnitId,
    ...(row.programId ? { programId: row.programId } : {}),
  }));
}

export async function findPilotServiceUnit(
  code = "RB_GRIYA_ASIH_LAWANG"
): Promise<ServiceUnitScope | null> {
  const [unit] = await db
    .select({
      organizationId: serviceUnits.organizationId,
      serviceUnitId: serviceUnits.id,
      code: serviceUnits.code,
      name: serviceUnits.name,
    })
    .from(serviceUnits)
    .where(and(eq(serviceUnits.code, code), isNull(serviceUnits.archivedAt)))
    .limit(1);

  return unit ?? null;
}

export async function findScopeCatalog(): Promise<ScopeCatalogDTO> {
  const [orgRows, unitRows, progRows] = await Promise.all([
    db
      .select({
        id: organizations.id,
        code: organizations.code,
        name: organizations.name,
      })
      .from(organizations)
      .where(isNull(organizations.archivedAt)),
    db
      .select({
        id: serviceUnits.id,
        organizationId: serviceUnits.organizationId,
        code: serviceUnits.code,
        name: serviceUnits.name,
      })
      .from(serviceUnits)
      .where(isNull(serviceUnits.archivedAt)),
    db
      .select({
        id: programs.id,
        serviceUnitId: programs.serviceUnitId,
        code: programs.code,
        name: programs.name,
      })
      .from(programs)
      .where(isNull(programs.archivedAt)),
  ]);

  return {
    organizations: orgRows,
    serviceUnits: unitRows,
    programs: progRows,
  };
}

export async function findAllUserMembershipsDetailed(): Promise<
  UserMembershipDetailDTO[]
> {
  const [memberships, catalog] = await Promise.all([
    db
      .select()
      .from(userMemberships)
      .where(isNull(userMemberships.archivedAt)),
    findScopeCatalog(),
  ]);

  const orgMap = new Map(catalog.organizations.map((o) => [o.id, o.name]));
  const unitMap = new Map(catalog.serviceUnits.map((u) => [u.id, u.name]));
  const progMap = new Map(catalog.programs.map((p) => [p.id, p.name]));

  return memberships.map((m) => ({
    id: m.id,
    userId: m.userId,
    organizationId: m.organizationId,
    organizationName: orgMap.get(m.organizationId) ?? "Organisasi",
    serviceUnitId: m.serviceUnitId,
    serviceUnitName: unitMap.get(m.serviceUnitId) ?? "Unit Layanan",
    programId: m.programId,
    programName: m.programId ? (progMap.get(m.programId) ?? null) : null,
    active: m.active,
  }));
}

export async function upsertUserScopeMembershipRow(params: {
  userId: string;
  organizationId: string;
  serviceUnitId: string;
  programId?: string | null;
  active?: boolean;
  actorId: string;
}) {
  const [upserted] = await db
    .insert(userMemberships)
    .values({
      userId: params.userId,
      organizationId: params.organizationId,
      serviceUnitId: params.serviceUnitId,
      programId: params.programId ?? null,
      active: params.active ?? true,
      createdBy: params.actorId,
      updatedBy: params.actorId,
    })
    .onConflictDoUpdate({
      target: [
        userMemberships.userId,
        userMemberships.organizationId,
        userMemberships.serviceUnitId,
      ],
      set: {
        programId: params.programId ?? null,
        active: params.active ?? true,
        archivedAt: null,
        archivedBy: null,
        updatedAt: new Date(),
        updatedBy: params.actorId,
      },
    })
    .returning();
  return upserted;
}
