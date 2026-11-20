/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Role, Permission, User, DataClassification } from '../types/index.ts';

// Centralized Role-Permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  PLATFORM_ADMIN: [
    'org.read',
    'org.write',
    'unit.read',
    'unit.write',
    'program.read',
    'program.write',
    'student.read',
    'student.write',
    'student.verify',
    'guardian.read',
    'guardian.write',
    'attendance.read',
    'attendance.record',
    'development.read',
    'development.write',
    'consent.read',
    'consent.write',
    'media.read',
    'media.write',
    'media.review',
    'publication.read',
    'publication.write',
    'publication.publish',
    'report.read',
    'report.write',
    'report.review',
    'report.approve',
    'user.read',
    'user.write',
    'audit.read',
  ],

  ORG_ADMIN: [
    'org.read',
    'unit.read',
    'unit.write',
    'program.read',
    'program.write',
    'student.read',
    'student.write',
    'student.verify',
    'guardian.read',
    'guardian.write',
    'attendance.read',
    'attendance.record',
    'development.read',
    'consent.read',
    'consent.write',
    'media.read',
    'media.write',
    'media.review',
    'publication.read',
    'publication.write',
    'publication.publish',
    'report.read',
    'report.write',
    'report.review',
    'report.approve',
    'user.read',
    'audit.read',
  ],

  UNIT_COORDINATOR: [
    'org.read',
    'unit.read',
    'program.read',
    'student.read',
    'student.write',
    'student.verify',
    'guardian.read',
    'guardian.write',
    'attendance.read',
    'attendance.record',
    'development.read',
    'development.write',
    'consent.read',
    'consent.write',
    'media.read',
    'media.write',
    'media.review',
    'publication.read',
    'publication.write',
    'report.read',
    'report.write',
    'report.review',
    'user.read',
  ],

  PROGRAM_COORDINATOR: [
    'unit.read',
    'program.read',
    'program.write',
    'student.read',
    'student.verify',
    'attendance.read',
    'attendance.record',
    'development.read',
    'consent.read',
    'media.read',
    'publication.read',
    'publication.write',
    'report.read',
    'report.write',
  ],

  TEACHER: [
    'unit.read',
    'program.read',
    'student.read',
    'attendance.read',
    'attendance.record',
    'development.read',
    'development.write',
    'consent.read',
    'media.read',
    'publication.read',
    'report.read',
  ],

  VOLUNTEER: [
    'unit.read',
    'program.read',
    'attendance.read',
    'attendance.record',
    'media.read',
  ],

  EDITOR: [
    'media.read',
    'media.write',
    'publication.read',
    'publication.write',
  ],

  REVIEWER: [
    'media.read',
    'media.review',
    'publication.read',
    'report.read',
    'report.review',
  ],

  APPROVER: [
    'media.review',
    'publication.read',
    'publication.publish',
    'report.read',
    'report.review',
    'report.approve',
  ],

  AUDITOR: [
    'org.read',
    'unit.read',
    'student.read',
    'attendance.read',
    'report.read',
    'audit.read',
  ],

  STAKEHOLDER: [
    'org.read',
    'unit.read',
    'program.read',
    'report.read',
  ],
};

export interface PermissionContext {
  targetOrganizationId?: string;
  targetServiceUnitId?: string;
  resourceOwnerId?: string;
  classification?: DataClassification;
  requireSeparationOfDuties?: boolean;
}

/**
 * Evaluates whether a user can perform an action based on Role, Permission,
 * Organization Scope, and Separation of Duties.
 */
export function can(
  user: User | null | undefined,
  permission: Permission,
  context?: PermissionContext
): boolean {
  if (!user || !user.active) return false;

  // Platform admin has universal grant
  if (user.role === 'PLATFORM_ADMIN') return true;

  // Check role permission table
  const userPerms = ROLE_PERMISSIONS[user.role] || [];
  if (!userPerms.includes(permission)) return false;

  // Organization Scoping Check
  if (context?.targetOrganizationId && user.role !== 'ORG_ADMIN') {
    if (user.organizationId !== context.targetOrganizationId) {
      return false;
    }
  }

  // Service Unit Scoping Check (if scoped to unit)
  if (context?.targetServiceUnitId && user.serviceUnitId) {
    if (user.serviceUnitId !== context.targetServiceUnitId) {
      return false;
    }
  }

  // Data Classification Enforcement:
  // CONFIDENTIAL is DENY-BY-DEFAULT for roles without explicit privilege
  if (context?.classification === 'CONFIDENTIAL') {
    const confidentialAllowedRoles: Role[] = [
      'PLATFORM_ADMIN',
      'ORG_ADMIN',
      'UNIT_COORDINATOR',
      'TEACHER',
    ];
    if (!confidentialAllowedRoles.includes(user.role)) {
      return false;
    }
  }

  // Separation of Duties Invariant:
  // The creator of a resource CANNOT be its final approver!
  if (
    context?.requireSeparationOfDuties &&
    context.resourceOwnerId &&
    user.id === context.resourceOwnerId
  ) {
    return false;
  }

  return true;
}
