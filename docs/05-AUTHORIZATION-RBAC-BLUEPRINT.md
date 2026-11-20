# 05-AUTHORIZATION-RBAC-BLUEPRINT.md

# PMKI Authorization & Dynamic RBAC Blueprint

## Platform Pelayanan Terpadu PMKI
### Rumah Belajar Griya Asih Lawang

Version: 2.0  
Status: Production Security Architecture  
Priority: Critical  
Architecture Type: Permission-First Dynamic RBAC

Dependencies:

- 03-DESIGN-IDENTITY-SYSTEM.md
- UI-UX-DESIGN-SYSTEM.md v2.1
- PRODUCTION-ARCHITECTURE-BLUEPRINT.md
- 02-NEXTJS-PRODUCTION-BLUEPRINT.md
- 04-DRIZZLE-DATABASE-ARCHITECTURE.md

---

# 1. Purpose

Dokumen ini mendefinisikan:

- Authorization Architecture
- Dynamic Role Based Access Control
- Permission Registry
- Scope Model
- Policy Engine
- Administration Experience
- Drizzle Schema
- Auth.js Mapping
- Service Layer Enforcement
- Audit Requirements

Tujuan utama:

```text
Flexible

Scalable

Auditable

Privacy First

Multi Organization Ready
```

tanpa perlu mengubah kode setiap kali ada kebutuhan akses baru.

---

# 2. Authorization Philosophy

PMKI menggunakan prinsip:

## Default Deny

Jika permission tidak diberikan:

```text
DENY
```

---

## Least Privilege

Pengguna hanya memperoleh akses minimum yang diperlukan.

---

## Need To Know

Memiliki akses modul:

```text
≠

Memiliki akses seluruh data
```

---

## Role Is Not Security

Security berasal dari:

```text
Permission
+
Scope
+
Policy
```

bukan dari nama role.

---

## Policy Always Wins

Policy selalu berada di atas:

```text
Role

Permission

Administrator
```

---

# 3. Authorization Architecture

```text
Authentication
        ↓
Role Assignment
        ↓
Permission Resolution
        ↓
Scope Resolution
        ↓
Policy Evaluation
        ↓
Access Decision
```

---

# 4. Security Layers

## Layer 1

Authentication

```text
User Login?
```

---

## Layer 2

Role

```text
Teacher

Coordinator

Editor

Approver
```

---

## Layer 3

Permission

```text
student.read

report.approve
```

---

## Layer 4

Scope

```text
Organization

Service Unit

Program
```

---

## Layer 5

Policy

```text
Separation Of Duties

Privacy Restrictions

Data Classification
```

---

# 5. Dynamic RBAC Model

PMKI menggunakan:

```text
User
    ↓
Many Roles
    ↓
Role Permissions
    ↓
Optional Permission Overrides
    ↓
Scope Assignments
```

---

# 6. Official System Roles

## PLATFORM_ADMIN

Platform-wide administration.

---

## ORG_ADMIN

Organization administration.

---

## UNIT_COORDINATOR

Operational coordinator.

---

## PROGRAM_COORDINATOR

Program-specific coordinator.

---

## TEACHER

Education workflow operator.

---

## VOLUNTEER

Limited operational helper.

---

## EDITOR

Content creation.

---

## REVIEWER

Workflow reviewer.

---

## APPROVER

Final approval authority.

---

## AUDITOR

Read-only governance access.

---

## STAKEHOLDER

External/internal read-only consumer.

---

# 7. Permission Naming Convention

Format:

```text
resource.action
```

Examples:

```text
student.read

student.create

attendance.record

report.approve

publication.publish
```

---

# 8. Permission Registry

# Students

```text
student.read
student.create
student.update
student.verify
student.archive
student.import
student.export
```

---

# Guardians

```text
guardian.read
guardian.create
guardian.update
```

---

# Academic Years

```text
academic-year.read
academic-year.manage
```

---

# Classes

```text
class.read
class.create
class.update
class.archive
```

---

# Teachers

```text
teacher.read
teacher.create
teacher.update
```

---

# Schedules

```text
schedule.read
schedule.create
schedule.update
```

---

# Attendance

```text
attendance.read
attendance.record
attendance.update
attendance.export
```

---

# Development

```text
development.read
development.create
development.update
development.review
```

---

# Consent

```text
consent.read
consent.create
consent.update
consent.review
```

---

# Media

```text
media.read
media.create
media.update
media.review
media.publish
```

---

# Reports

```text
report.read
report.create
report.update
report.review
report.approve
```

---

# Publications

```text
publication.read
publication.create
publication.update
publication.review
publication.publish
publication.archive
```

---

# Audit

```text
audit.read
```

Tidak ada:

```text
audit.update
audit.delete
```

---

# Administration

```text
user.read
user.create
user.update

user.activate
user.deactivate

role.read
role.manage

permission.read
permission.manage
```

---

# Organization

```text
organization.read
organization.manage

service-unit.read
service-unit.manage
```

---

# 9. Default Role Matrix

Role hanya template awal.

Administrator dapat menyesuaikan.

---

## PLATFORM_ADMIN

```text
All Permissions
```

kecuali policy restrictions.

---

## ORG_ADMIN

```text
All permissions
within assigned organization
```

---

## UNIT_COORDINATOR

```text
student.*

guardian.read

attendance.*

development.*

consent.*

media.read
media.review

report.read
report.create
report.review

publication.read
publication.create
publication.review

user.read
```

---

## PROGRAM_COORDINATOR

```text
student.read

attendance.*

development.*

report.read
report.create

publication.read

class.read

schedule.read
```

---

## TEACHER

```text
student.read

attendance.read
attendance.record

development.read
development.create

class.read

schedule.read
```

---

## VOLUNTEER

```text
student.read

attendance.read

class.read

schedule.read
```

---

## EDITOR

```text
publication.*

media.read
media.create
media.update
```

---

## REVIEWER

```text
report.review

publication.review

media.review

consent.review
```

---

## APPROVER

```text
report.approve

publication.publish
```

---

## AUDITOR

```text
audit.read

report.read

publication.read

consent.read

student.read
```

Read-only.

---

## STAKEHOLDER

```text
published information only
```

---

# 10. Dynamic Permission Overrides

Role dapat diubah tanpa deploy.

Contoh:

Teacher biasa:

```text
attendance.record
```

Tambahan khusus:

```text
guardian.read
```

untuk kasus tertentu.

---

# 11. Permission Resolution Order

```text
Role Permissions
      ↓
Additional Permissions
      ↓
Revoked Permissions
      ↓
Final Permission Set
```

---

Contoh:

Teacher mendapatkan:

```text
development.create
```

tetapi dicabut secara khusus:

```text
-revoke-
development.create
```

Maka hasil akhirnya:

```text
DENY
```

---

# 12. Scope Architecture

Role tidak cukup.

Permission tidak cukup.

Harus ada scope.

---

# Organization Scope

```text
PMKI
↓
Mupel
↓
Jemaat
```

---

# Service Unit Scope

Contoh:

```text
Rumah Belajar Griya Asih

Program A

Program B
```

---

# Program Scope

Masa depan:

```text
Teacher
→ Program A

Teacher
→ Program B
```

---

# 13. Data Classification

## PUBLIC

Public website.

---

## STAKEHOLDER

Stakeholder reports.

---

## INTERNAL

Operasional.

---

## CONFIDENTIAL

Sensitif.

---

Contoh:

```text
Guardian Data

Development Notes

Consent Evidence

Private Addresses
```

---

# 14. Confidential Access Rules

Default:

```text
DENY
```

harus dibuka secara eksplisit.

---

# 15. Separation of Duties

Role dan permission tidak boleh melanggar SoD.

---

## Reports

Tidak boleh:

```text
Membuat laporan

dan

Menyetujui laporan yang sama
```

---

## Publications

Tidak boleh:

```text
Menulis

dan

Mempublikasikan sendiri
```

---

## Media Review

Ideal:

```text
Uploader

≠

Reviewer
```

---

# 16. Dynamic Administration UX

# Administration Workspace

## Tab 1 — Users

Tujuan:

```text
Manage User
```

---

Layout:

```text
Users

[ Search User ]

------------------------------------------------

Nama

Role

Scope

Status

Last Login

Actions
```

---

Actions:

```text
View

Edit

Deactivate

Assign Role
```

---

# Tab 2 — Roles

Tujuan:

```text
Manage Roles
```

---

```text
Roles

Platform Admin

Teacher

Coordinator

Editor

...
```

---

Detail:

```text
Role Information

Permissions

Assigned Users
```

---

## Create Custom Role

Administrator dapat membuat:

```text
Youth Coordinator

Education Reviewer

Regional Supervisor
```

tanpa coding.

---

# Tab 3 — Permissions

Tujuan:

```text
Permission Registry
```

---

Grouped:

```text
Students

Attendance

Development

Consent

Media

Reports

Publishing

Audit

Administration
```

---

Detail:

```text
Permission

Description

Affected Module
```

---

# Tab 4 — Access Overrides

Tujuan:

```text
Grant Additional Permission

Revoke Permission
```

---

Example:

```text
Teacher

+ guardian.read

- development.create
```

---

# Tab 5 — Scope Assignment

Tujuan:

```text
Organization Access

Service Unit Access

Program Access
```

---

Example:

```text
Teacher A

Organization:
PMKI Jatim

Service Unit:
Rumah Belajar Griya Asih
```

---

# 17. Permission Assignment UX

```text
User
        ↓
Roles
        ↓
Additional Permissions
        ↓
Restrictions
        ↓
Organization Scope
        ↓
Service Unit Scope
```

---

Tanpa perlu edit database manual.

---

# 18. Audit Requirements

Wajib dicatat:

```text
Role Assignment

Role Removal

Permission Grant

Permission Revocation

Scope Change

Account Activation

Account Deactivation
```

---

# 19. Drizzle Schema

## roles

```ts
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  system: boolean("system").default(false),

  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## permissions

```ts
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey(),

  code: varchar("code", { length: 150 })
    .notNull()
    .unique(),

  category: varchar("category", { length: 100 })
    .notNull(),

  name: varchar("name", { length: 255 })
    .notNull(),

  description: text("description"),

  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## role_permissions

```ts
export const rolePermissions =
pgTable("role_permissions", {

  roleId: uuid("role_id")
    .notNull(),

  permissionId: uuid("permission_id")
    .notNull(),

}, table => ({
  pk: primaryKey({
    columns: [
      table.roleId,
      table.permissionId
    ]
  })
}));
```

---

## user_roles

```ts
export const userRoles =
pgTable("user_roles", {

  userId: uuid("user_id")
    .notNull(),

  roleId: uuid("role_id")
    .notNull(),

});
```

---

## user_permissions

Permission override.

```ts
export const userPermissions =
pgTable("user_permissions", {

  id: uuid("id").primaryKey(),

  userId: uuid("user_id")
    .notNull(),

  permissionId: uuid("permission_id")
    .notNull(),

  granted: boolean("granted")
    .notNull(),

  reason: text("reason"),

  grantedBy: uuid("granted_by"),

  createdAt: timestamp("created_at")
    .defaultNow()
});
```

---

## user_memberships

Scope assignment.

```ts
export const userMemberships =
pgTable("user_memberships", {

  id: uuid("id").primaryKey(),

  userId: uuid("user_id")
    .notNull(),

  organizationId: uuid("organization_id"),

  serviceUnitId: uuid("service_unit_id"),

  programId: uuid("program_id"),

});
```

---

# 20. Auth.js Mapping

Session:

```ts
type SessionUser = {

  id: string

  roles: string[]

  permissions: string[]

  memberships: {
    organizationId: string
    serviceUnitId: string
    programId?: string
  }[]
}
```

---

# 21. Authorization Engine

API:

```ts
can(
  user,
  "attendance.record"
)
```

---

Policy Example:

```ts
can(
  user,
  "report.approve",
  {
    requireSeparationOfDuties: true,
    resourceOwnerId: report.createdBy,
  }
)
```

---

# 22. Security Anti Patterns

Forbidden:

```text
Role === Admin
```

checks.

---

Forbidden:

```text
Authorization in React only
```

---

Forbidden:

```text
Trusting hidden buttons
```

---

Forbidden:

```text
Skipping scope validation
```

---

# 23. Definition of Done

RBAC dianggap selesai jika:

✅ Dynamic Roles

✅ Dynamic Permissions

✅ Permission Overrides

✅ Organization Scope

✅ Service Unit Scope

✅ Program Scope

✅ Policy Layer

✅ Separation of Duties

✅ Audit Trail

✅ Auth.js Integration

✅ Drizzle Schema

✅ Admin UI

✅ Future Multi-Organization Support

---

# 24. Final Statement

> PMKI menggunakan Dynamic Permission-First RBAC Architecture. Role hanyalah template awal. Hak akses akhir ditentukan oleh kombinasi Role Assignment, Permission Override, Organization Scope, Service Unit Scope, Program Scope, dan Policy Layer. Administrator dapat mengelola akses secara fleksibel tanpa perubahan kode, sementara aturan keamanan seperti Separation of Duties, Privacy Classification, dan Auditability tetap tidak dapat dilanggar oleh konfigurasi apa pun.

> Roles describe responsibility.

> Permissions grant capability.

> Scope defines boundaries.

> Policies enforce trust.