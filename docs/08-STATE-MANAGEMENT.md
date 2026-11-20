# 08-STATE-MANAGEMENT.md

# PMKI State Management Architecture

## Platform Pelayanan Terpadu PMKI
### Rumah Belajar Griya Asih Lawang

Version: 1.0  
Status: Production State Management Architecture  
Priority: Critical  
Architecture Type: Server-First State Architecture

Dependencies:

- 03-DESIGN-IDENTITY-SYSTEM.md
- UI-UX-DESIGN-SYSTEM.md v2.1
- 02-NEXTJS-PRODUCTION-BLUEPRINT.md
- 04-DRIZZLE-DATABASE-ARCHITECTURE.md
- 05-AUTHORIZATION-RBAC-BLUEPRINT.md
- 06-PWA-OFFLINE-STRATEGY.md
- 07-COMPONENT-ARCHITECTURE.md

---

# 1. Purpose

Dokumen ini mendefinisikan bagaimana state dikelola pada aplikasi PMKI Production.

Tujuan utama:

```text
Simple

Predictable

Scalable

Server First

Offline Aware

Type Safe
```

Tujuan dokumen ini adalah memastikan:

- tidak terjadi state duplication
- tidak terjadi source of truth ganda
- tidak ada business logic di React state
- offline workflow tetap aman
- performa aplikasi tetap baik

---

# 2. Philosophy

PMKI menggunakan:

```text
Server First Architecture
```

Bukan:

```text
Client State First
```

---

# 3. Source Of Truth

## Single Source of Truth

Seluruh data operasional berasal dari:

```text
PostgreSQL
```

melalui:

```text
Drizzle ORM
```

---

Tidak berasal dari:

```text
React State

Context

Zustand

localStorage
```

---

Rule:

```text
React State
≠
Business Data
```

---

# 4. State Hierarchy

```text
Database
     ↓

Domain Services
     ↓

Server Actions
     ↓

Server Components
     ↓

Client Components
     ↓

Temporary UI State
```

---

# 5. State Categories

PMKI membagi state menjadi:

```text
Server State

UI State

Workflow State

Offline State

Session State
```

---

# 6. Server State

Server State adalah:

```text
Students

Guardians

Attendance

Development

Consent

Reports

Publications

Audit
```

---

Lokasi:

```text
Database
```

---

Rule:

```text
Server State

must never be duplicated
as application state.
```

---

# 7. UI State

UI State hanya digunakan untuk:

```text
Dialog Open

Sheet Open

Current Tab

Filter Selection

Search Input

Sort Direction
```

---

Contoh:

```ts
const [open, setOpen] = useState(false)
```

✅ BENAR

---

# 8. Workflow State

Workflow State digunakan untuk:

```text
Multi-step Forms

Wizard Steps

Review Flow

Approval Steps
```

---

Contoh:

```ts
currentStep
```

---

Workflow state tidak boleh:

```text
menjadi source of truth
```

---

# 9. Offline State

Offline State digunakan untuk:

```text
Attendance Draft

Development Draft

Sync Queue
```

---

Lokasi:

```text
IndexedDB
```

---

Bukan:

```text
localStorage
```

---

# 10. Session State

Session State berasal dari:

```text
Auth.js
```

---

Contoh:

```ts
session.user.id

session.user.roles

session.user.permissions

session.user.memberships
```

---

Session tidak boleh disimpan ulang ke state lain tanpa alasan.

---

# 11. React State Rules

Allowed:

```text
Dialog State

Sheet State

Input State

Tab State

Selection State
```

---

Forbidden:

```text
Student List State

Attendance Source Of Truth

Development Source Of Truth
```

---

# 12. URL State

Data yang penting untuk navigation harus berada di URL.

---

Examples:

```text
?page=2

?status=active

?class=sd-4

?tab=attendance
```

---

Not:

```text
Invisible local state
```

---

# 13. Search State

Search state berada di URL.

---

Example:

```text
/students?search=aditya
```

---

Benefits:

```text
Sharable

Restorable

Bookmarkable
```

---

# 14. Filter State

Filter state juga berada di URL.

---

Example:

```text
/students
?status=active
&level=sd
```

---

# 15. Form State

Form state menggunakan:

```text
React Hook Form

+
Zod
```

---

Rule:

```text
Form State
=
Temporary
```

---

Submission tetap melalui:

```text
Server Action
```

---

# 16. Query Strategy

Framework:

```text
Server Components First
```

---

Prefer:

```text
Database

↓

Server Component

↓

UI
```

---

Avoid:

```text
Browser

↓

API

↓

Browser State

↓

UI
```

untuk data yang bisa dirender server-side.

---

# 17. Data Fetching Rules

Default:

```text
Server Component
```

---

Gunakan Client Component hanya jika:

```text
Interactive

Realtime

Browser API

Offline Feature
```

---

# 18. Client State Library Decision

PMKI tidak menggunakan Zustand secara default.

---

Reason:

Sebagian besar state adalah:

```text
Server State
```

---

Rule:

```text
No State Library
until proven necessary.
```

---

# 19. React Context Rules

Context hanya digunakan untuk:

```text
Theme

Session

Offline Status
```

---

Tidak digunakan untuk:

```text
Student Data

Attendance Data

Reports Data
```

---

# 20. Server Actions

Semua mutation dilakukan melalui:

```text
Server Actions
```

---

Examples:

```ts
createStudent()

verifyRegistration()

placeStudent()

recordAttendance()

createDevelopmentNote()

approveReport()

publishPost()
```

---

# 21. Optimistic UI

Digunakan secara sangat terbatas.

---

Allowed:

```text
Drawer Close

Dialog Close

Instant Feedback
```

---

Avoid:

```text
Attendance Success

Approval Success

Publish Success
```

sebelum server mengonfirmasi.

---

# 22. Cache Strategy

## Static

```text
Long Cache
```

Examples:

```text
Icons

Fonts

Assets
```

---

## Reference

```text
Short Cache
```

Examples:

```text
Schedules

Academic Years
```

---

## Operational

```text
Revalidate Aggressively
```

Examples:

```text
Attendance

Reports

Consent
```

---

# 23. Revalidation Strategy

Setelah mutation:

```text
Mutate

↓

Revalidate Path

↓

Fresh Server Data
```

---

Rule:

```text
Refetch Truth

Do not trust old state.
```

---

# 24. Attendance State

Attendance workflow:

```text
Session

↓

Roster

↓

Draft

↓

Save

↓

Server

↓

Refresh
```

---

Offline:

```text
Draft

↓

IndexedDB

↓

Sync Queue

↓

Server
```

---

# 25. Development Notes State

Flow:

```text
Create

↓

Draft

↓

Save

↓

Server
```

---

Offline:

```text
Draft

↓

Queue

↓

Sync
```

---

# 26. Governance State

Tidak ada offline mutation.

---

Examples:

```text
Approve Report

Publish Content

Privacy Review
```

---

Always:

```text
Online Only
```

---

# 27. RBAC State

Permission state berasal dari:

```text
Session
```

---

Tidak boleh:

```text
Permission Context
```

yang duplikatif.

---

Source:

```ts
session.user.permissions
```

---

# 28. Offline Queue

## Queue Structure

```ts
{
  id
  operation
  payload

  createdAt

  syncStatus
}
```

---

Status:

```text
PENDING

PROCESSING

SUCCESS

FAILED
```

---

# 29. Connectivity State

Global state:

```text
ONLINE

OFFLINE

SYNCING
```

---

Available through:

```ts
useConnectivity()
```

---

# 30. Notification State

Notification digunakan hanya untuk:

```text
Action Feedback
```

---

Not:

```text
Primary Communication
```

---

# 31. Draft State

Draft harus:

```text
Recoverable
```

---

Examples:

```text
Attendance Draft

Development Draft

Registration Draft
```

---

# 32. Error State

Errors harus:

```text
Specific

Recoverable

Human Readable
```

---

Not:

```text
Raw Exception
```

---

# 33. Loading State

Prefer:

```text
Skeleton
```

---

Avoid:

```text
Global Spinner
```

untuk halaman yang strukturnya sudah diketahui.

---

# 34. Realtime Strategy

Not MVP.

---

Future:

```text
Realtime Attendance

Notifications

Governance Alerts
```

---

Current:

```text
Server Refresh
```

---

# 35. Local Storage Rules

Allowed:

```text
Theme

Navigation Preference

Draft Recovery
```

---

Forbidden:

```text
Business Data

Permissions

RBAC Decisions
```

---

# 36. State Anti Patterns

Forbidden:

## Duplicate Source Of Truth

```text
Database

+

Local Master Copy
```

---

## Global Student Store

```text
Student Store
```

untuk seluruh aplikasi.

---

## Permission Store

```text
PermissionContext
```

yang berbeda dari session.

---

## Business Logic Inside useState

Forbidden.

---

## Massive React Context

Forbidden.

---

# 37. State Testing

Test:

```text
Online

Offline

Reconnect

Sync Success

Sync Failure

Role Change

Session Expiry
```

---

# 38. Folder Structure

```text
src/

hooks/

useConnectivity.ts

useOfflineQueue.ts

useDraftRecovery.ts

server/

actions/

services/

repositories/
```

---

# 39. Definition of Done

State Management dianggap selesai jika:

✅ Single Source Of Truth

✅ Server First

✅ URL State

✅ Offline Support

✅ Draft Recovery

✅ Queue System

✅ No State Duplication

✅ Auth.js Session Driven

✅ React State Limited To UI

✅ PWA Ready

---

# 40. Final Statement

> PMKI menggunakan Server-First State Architecture. PostgreSQL adalah satu-satunya sumber kebenaran untuk data operasional. React state hanya digunakan untuk state antarmuka. Workflow offline didukung melalui IndexedDB dan Sync Queue tanpa menciptakan sumber data kedua. Semua mutasi dilakukan melalui Server Actions dengan revalidasi terkontrol untuk menjaga integritas data, keamanan, dan konsistensi pengalaman pengguna.

> One Truth.

> One Source.

> One Flow.