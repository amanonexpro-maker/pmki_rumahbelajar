# 09-API-ARCHITECTURE.md

# PMKI API Architecture

## Platform Pelayanan Terpadu PMKI
### Rumah Belajar Griya Asih Lawang

Version: 1.0  
Status: Production API Architecture  
Priority: Critical  
Architecture Type: Server-First API Architecture

Dependencies:

- 03-DESIGN-IDENTITY-SYSTEM.md
- UI-UX-DESIGN-SYSTEM.md v2.1
- 02-NEXTJS-PRODUCTION-BLUEPRINT.md
- 04-DRIZZLE-DATABASE-ARCHITECTURE.md
- 05-AUTHORIZATION-RBAC-BLUEPRINT.md
- 06-PWA-OFFLINE-STRATEGY.md
- 07-COMPONENT-ARCHITECTURE.md
- 08-STATE-MANAGEMENT.md

---

# 1. Purpose

Dokumen ini mendefinisikan standar API dan komunikasi data untuk PMKI.

Tujuan:

```text
Consistency

Security

Predictability

Type Safety

Offline Support

Future Integration Readiness
```

Dokumen ini mendefinisikan:

- API Philosophy
- Server Action Strategy
- Route Handler Strategy
- Service Layer Contract
- Error Handling
- Validation Flow
- Authorization Flow
- Offline Sync API
- Future Integration Strategy

---

# 2. API Philosophy

PMKI bukan:

```text
REST First
```

PMKI menggunakan:

```text
Server Action First
```

---

Prioritas:

```text
Server Actions
        ↓
Route Handlers
        ↓
External APIs
```

---

# 3. API Decision Framework

Pertanyaan pertama:

```text
Apakah fitur hanya digunakan oleh
aplikasi PMKI sendiri?
```

Jika YA:

```text
Server Action
```

---

Jika TIDAK:

```text
Route Handler
```

---

# 4. Architecture Flow

## Read

```text
Database
     ↓
Repository
     ↓
Service
     ↓
Server Component
     ↓
UI
```

---

## Write

```text
UI
     ↓
Server Action
     ↓
Authorization
     ↓
Validation
     ↓
Service
     ↓
Repository
     ↓
Database
```

---

# 5. API Layers

PMKI menggunakan:

```text
Presentation Layer

↓

Server Actions

↓

Domain Services

↓

Repositories

↓

Drizzle

↓

PostgreSQL
```

---

# 6. Server Actions First

Default mutation strategy:

```text
Server Actions
```

---

Contoh:

```ts
createStudent()

verifyRegistration()

assignClass()

recordAttendance()

createDevelopmentNote()

grantConsent()

approveReport()

publishArticle()
```

---

# 7. Route Handlers

Digunakan hanya ketika:

```text
File Upload

Offline Sync

Webhook

Third Party Integration

Future Mobile App

Public APIs
```

---

Lokasi:

```text
src/app/api/*
```

---

# 8. Service Architecture

Setiap domain memiliki service.

```text
StudentService

AttendanceService

DevelopmentService

ConsentService

ReportService

PublishingService

AuditService
```

---

Service bertanggung jawab pada:

```text
Business Logic

Workflow Rules

RBAC Validation

Policy Evaluation
```

---

# 9. Repository Architecture

Repository hanya:

```text
Read

Write

Delete (soft)

Query
```

---

Repository tidak boleh:

```text
Authorization

Validation

Workflow Logic
```

---

# 10. API Folder Structure

```text
src/

server/

├── actions/
├── services/
├── repositories/
├── policies/
├── auth/
└── validations/
```

---

# 11. Domain API Boundaries

## Student Domain

Allowed:

```text
Registration

Verification

Placement

Profile
```

---

Forbidden:

```text
Attendance Logic
inside Student Domain
```

---

# 12. Attendance Domain

Allowed:

```text
Attendance Session

Attendance Record

Attendance Review
```

---

Forbidden:

```text
Publishing Logic
inside Attendance Domain
```

---

# 13. Development Domain

Allowed:

```text
Observation

Progress

Follow Up
```

---

# 14. Governance Domain

Allowed:

```text
Reports

Approval

Publication

Privacy Review
```

---

# 15. Validation Architecture

Semua input wajib melalui:

```text
Zod
```

---

Flow:

```text
Input
 ↓
Zod
 ↓
Action
 ↓
Service
 ↓
Repository
```

---

# 16. Validation Location

Lokasi:

```text
src/server/validations
```

---

Examples:

```text
student.schema.ts

attendance.schema.ts

report.schema.ts
```

---

# 17. Authorization Flow

Semua mutation wajib melewati:

```text
Authentication
       ↓
Permission
       ↓
Scope
       ↓
Policy
       ↓
Action
```

---

Tidak boleh ada bypass.

---

# 18. Authentication Contract

User berasal dari:

```text
Auth.js
```

---

Action menerima:

```ts
session.user.id

session.user.roles

session.user.permissions

session.user.memberships
```

---

# 19. Permission Evaluation

Wajib menggunakan:

```ts
can()
```

---

Contoh:

```ts
can(
 user,
 "attendance.record"
)
```

---

# 20. Policy Evaluation

Contoh:

```ts
can(
 user,
 "report.approve",
 {
   requireSeparationOfDuties: true,
   resourceOwnerId: report.createdBy
 }
)
```

---

# 21. API Response Philosophy

Server Actions:

```text
return typed result
```

---

Route Handlers:

```text
return typed json
```

---

# 22. Standard Success Response

```ts
{
 success: true,
 data
}
```

---

# 23. Standard Error Response

```ts
{
 success: false,

 error: {
   code,
   message
 }
}
```

---

# 24. Error Codes

## Authorization

```text
UNAUTHORIZED

PERMISSION_DENIED

SCOPE_DENIED

POLICY_DENIED
```

---

## Validation

```text
VALIDATION_FAILED
```

---

## Not Found

```text
RESOURCE_NOT_FOUND
```

---

## Conflict

```text
RESOURCE_CONFLICT
```

---

## System

```text
INTERNAL_ERROR
```

---

# 25. Human Error Messages

Good:

```text
Anda tidak memiliki akses
untuk menyetujui laporan ini.
```

---

Bad:

```text
403 PERMISSION_DENIED
```

---

# 26. API Security Rules

Forbidden:

```text
Exposing IDs unnecessarily
```

---

Forbidden:

```text
Returning internal stack traces
```

---

Forbidden:

```text
Returning SQL errors
```

---

Forbidden:

```text
Returning secrets
```

---

# 27. Offline Sync Architecture

Digunakan untuk:

```text
Attendance

Development Notes

Draft Workflows
```

---

Endpoint:

```text
/api/sync
```

---

Flow:

```text
Offline Queue
        ↓
Sync Endpoint
        ↓
Validation
        ↓
Authorization
        ↓
Execution
```

---

# 28. Sync Operation Contract

Request:

```ts
{
 operationId,

 operation,

 payload,

 createdAt
}
```

---

Response:

```ts
{
 success,

 syncedAt
}
```

---

# 29. Idempotency Strategy

Offline requests harus aman.

---

Gunakan:

```text
operationId
```

unik.

---

Server wajib menolak:

```text
Duplicate Operation
```

yang telah diproses.

---

# 30. Upload Architecture

Route Handler:

```text
/api/upload
```

---

Flow:

```text
File
 ↓
Validation
 ↓
Storage
 ↓
Audit
```

---

# 31. Webhook Architecture

Future:

```text
WhatsApp

Email

External Services
```

---

Lokasi:

```text
/api/webhooks/*
```

---

# 32. Public APIs

Future only.

Tidak digunakan oleh MVP.

---

Namespace:

```text
/api/public/*
```

---

Harus selalu:

```text
Read Only
```

---

# 33. Internal APIs

Namespace:

```text
/api/internal/*
```

---

Tidak dapat digunakan tanpa:

```text
Session
```

---

# 34. Caching Rules

Static Data:

```text
Cache Allowed
```

---

Operational Data:

```text
Short Revalidate
```

---

Governance:

```text
Fresh First
```

---

# 35. Revalidation Strategy

Server Actions:

```text
Mutation
 ↓
revalidatePath()
 ↓
Fresh UI
```

---

Never:

```text
Trust stale client state
```

---

# 36. Audit Integration

Mutation wajib menghasilkan audit.

Contoh:

```text
verifyRegistration

↓

Audit
```

---

```text
approveReport

↓

Audit
```

---

```text
publishArticle

↓

Audit
```

---

# 37. API Versioning

Saat ini:

```text
v1
```

---

Future:

```text
/api/v2/*
```

---

Bukan:

```text
Breaking Changes
```

langsung pada endpoint lama.

---

# 38. Future Integrations

Architecture harus siap untuk:

```text
Mobile App

WhatsApp Integration

Email Service

Analytics

BI Dashboard

Data Warehouse
```

---

Tanpa redesign API.

---

# 39. Monitoring Requirements

Track:

```text
Latency

Errors

Permission Denials

Validation Failures

Sync Failures
```

---

# 40. Performance Requirements

Target:

```text
Normal Actions

<500ms
```

---

Heavy actions:

```text
<2s
```

---

# 41. API Anti Patterns

Forbidden:

## Direct DB Access from React

```text
NO
```

---

## Business Logic in Server Actions

```text
NO
```

---

## Authorization in UI Only

```text
NO
```

---

## Validation in UI Only

```text
NO
```

---

## Database Access in Components

```text
NO
```

---

## Returning Raw Errors

```text
NO
```

---

# 42. Example Architecture

## Attendance

```text
AttendancePage
      ↓

recordAttendanceAction

      ↓

AttendanceService

      ↓

AttendanceRepository

      ↓

Drizzle

      ↓

PostgreSQL
```

---

## Governance

```text
ApproveReportButton

        ↓

approveReportAction

        ↓

Authorization

        ↓

GovernanceService

        ↓

Repository

        ↓

Database
```

---

# 43. API Testing Strategy

Semua endpoint harus diuji:

## Success Case

✅

---

## Validation Failure

✅

---

## Permission Failure

✅

---

## Scope Failure

✅

---

## Policy Failure

✅

---

## Idempotency

✅

---

# 44. Definition of Done

API Architecture dianggap selesai jika:

✅ Server Action Strategy

✅ Route Handler Strategy

✅ Validation Strategy

✅ Authorization Flow

✅ Service Architecture

✅ Repository Architecture

✅ Offline Sync Contract

✅ Error Contract

✅ Upload Strategy

✅ Audit Integration

✅ Future Integrations

✅ Testing Strategy

---

# 45. Final Statement

> PMKI menggunakan Server-First API Architecture dengan pendekatan Server Actions sebagai mekanisme utama mutasi data dan Route Handlers untuk kebutuhan integrasi, upload, serta sinkronisasi offline. Seluruh request wajib melalui Validation, Authorization, Scope Resolution, dan Policy Evaluation sebelum mencapai Service Layer. Database tetap menjadi sumber kebenaran tunggal dan seluruh mutasi penting menghasilkan audit trail yang dapat ditelusuri.

> Server Actions First.

> Services Own Business Logic.

> Database Is The Truth.

