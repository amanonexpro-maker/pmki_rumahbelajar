# DOMAIN-MAP — 12 Domain PMKI Platform

**Status:** **`FINAL`** (Difinalkan di penutupan FASE 1 — skeleton 12 domain + `public` telah dibuat di `apps/web/src/features/`)  
**Referensi Otoritas:** `docs/11-DOMAIN-DRIVEN-FEATURE-ARCHITECTURE.md` (§8–§21) & `AGENTS.md`

---

## 1. Peta 12 Domain + Public Experience

> Setiap domain berada di `apps/web/src/features/<domain>/` dengan struktur standar:
> `{actions, services, repositories, permissions, validators, queries, hooks, types, components, index.ts}`.
> Akses lintas domain **HANYA** diizinkan melalui `index.ts` (Service / Tipe / Read Model) atau Domain Event.

| # | Domain | Ownership Tabel (Drizzle PG17) | Public API (`index.ts`) | Sumber Existing → Aksi Migrasi |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `identity` | `users` (`id = auth.users.id` UUID v4), referensi `auth.users` Supabase | `getCurrentAuthUser`, `getSessionUser`, `IdentityUser` | `src/types/index.ts` (`User`), `storage.getCurrentUser` → **REBUILD** (Supabase Auth `getUser()`, hapus `password_hash`) |
| 2 | `organization` | `organizations`, `service_units`, `service_unit_contacts`, `service_unit_sub_districts`, `memberships` | `OrganizationService`, `ServiceUnitQuery`, `MembershipReadModel` | `OrganizationView.tsx` (bagian organisasi/unit), `seed-data.ts` (`initialOrganizations`, `initialServiceUnits`) → **SPLIT & REBUILD** |
| 3 | `students` | `students`, `guardians`, `student_guardians` | `StudentService`, `RegistrationService`, `PlacementService`, `StudentReadModel` | `StudentsView.tsx`, `StudentDetailView.tsx`, `RegistrationForm.tsx`, `storage.ts` (student methods) → **SPLIT & REBUILD** (Server Actions + RHF/Zod + Offline Lookup) |
| 4 | `academic` | `academic_years`, `subjects`, `teachers`, `teacher_subjects`, `classes`, `schedules` | `AcademicService`, `ClassQuery`, `ScheduleQuery`, `TeacherReadModel` | `OrganizationView.tsx` (kelas, mapel, guru, jadwal), `seed-data.ts` → **SPLIT & REBUILD** |
| 5 | `attendance` | `attendance_sessions` (`UNIQUE(class_id, session_date)`), `attendance_records` | `AttendanceService`, `AttendanceSessionService`, `AttendanceReadModel` | `AttendanceView.tsx`, `SessionProgress.tsx`, `storage.ts` (attendance methods) → **REBUILD** (Server + IndexedDB Tier A Offline + `/api/sync`) |
| 6 | `development` | `student_development_notes` (`confidential` default `TRUE`) | `DevelopmentNoteService`, `DevelopmentQuery` | `StudentDevelopmentView.tsx`, `StudentDetailView.tsx` (tab perkembangan), `storage.ts` → **REBUILD** (Server + Policy confidential + Tier A Offline versioned) |
| 7 | `consent` | `consents` (memisahkan `DATA_PROCESSING` vs `MEDIA_PUBLICATION`) | `ConsentService`, `ConsentPolicy`, `ConsentReadModel` | `ConsentMediaView.tsx` (tab consent), `RegistrationForm.tsx` (step 4), `storage.ts` → **SPLIT & REBUILD** |
| 8 | `media` | `media_assets` (bucket private `media` di Supabase Storage) | `MediaService`, `MediaUploadService`, `MediaSignedUrlService` | `ConsentMediaView.tsx` (tab media), `GallerySection.tsx` (query publik), `storage.ts` → **REBUILD** (Upload URL + `confirmUpload` + Signed URL server) |
| 9 | `governance` | `service_reports`, `report_workflow_logs` (append-only DB trigger) | `ReportService`, `ApprovalWorkflowService`, `GovernancePolicy` | `ReportsApprovalView.tsx`, `WorkflowProgress.tsx`, `DecisionHistory.tsx`, `storage.ts` → **REBUILD** (Strict SoD Policy + DB trigger) |
| 10 | `publishing` | `publication_posts` | `PublishingService`, `PublicContentQuery` | `PublishingView.tsx`, `NewsSection.tsx` (query publik), `storage.ts` → **REBUILD** (Editorial workflow + privacy check) |
| 11 | `audit` | `audit_logs` (append-only DB trigger) | `AuditService`, `AuditQuery` (subscribe ke 8 Domain Events) | `AuditLogView.tsx`, `ChangeSummary.tsx`, `storage.ts` (`addAuditLog`) → **REBUILD** (Event-driven + DB trigger immutable) |
| 12 | `administration` | `roles`, `permissions`, `role_permissions`, `user_roles`, `user_permission_overrides` | `resolveAccess(userId)`, `AdministrationService`, `RbacInspectorQuery` | `AdministrationView.tsx`, `src/permissions/can.ts` → **REBUILD** (Dynamic RBAC DB per-request; hapus reset seed dari prod) |
| + | `public` | *(Tidak memiliki tabel sendiri — membaca Read Model dari `organization`, `academic`, `media`, `publishing` & memanggil `students.RegistrationService`)* | Public pages & sections (`Hero`, `About`, `Programs`, `Schedule`, `Gallery`, `News`, `Contact`, `Registration`) | `src/components/public/*`, `Navbar.tsx`, `Footer.tsx` → **PORT & ADAPT** (komponen UI dipertahankan parity-nya, data via Server Components) |

### Komponen/Layanan Existing yang Dihapus / Tidak Di-Port
| Sumber Existing | Aksi | Alasan |
| :--- | :--- | :--- |
| `server/index.ts` (Express snapshot server) | **HAPUS** (di target `apps/web/`) | Digantikan oleh Next.js Server Actions, Route Handlers minimal, dan Drizzle ORM |
| `src/services/storage.ts` (`StorageManager` + `localStorage` snapshot) | **HAPUS** (di target `apps/web/`) | Melanggar Server-First Architecture (`08`); digantikan PostgreSQL + IndexedDB khusus Tier A offline |
| `pmki_app_state` (tabel legacy snapshot) | **HAPUS** | Tidak diperlukan di skema fresh PG17 |
| `src/components/dashboard/DashboardLayout.tsx` (role switcher hardcoded) | **SPLIT / REBUILD** | Navigasi dipindah ke App Router `(workspace)/layout.tsx`; simulasi role hanya di dev/staging jika diizinkan |

---

## 2. Dependency Graph yang Diizinkan (`11 §20`)

```text
          ┌──────────────┐
          │   public     │
          └──────┬───────┘
                 │ (read models & RegistrationService)
                 ▼
┌───────────┐  ┌──────────────┐  ┌──────────────┐
│governance │─▶│  publishing  │─▶│    media     │
└───────────┘  └──────────────┘  └──────┬───────┘
                                        │
┌───────────┐  ┌──────────────┐         ▼
│attendance │─▶│   students   │◀──┌───────────┐
└───────────┘  └──────┬───────┘   │  consent  │
                      │           └───────────┘
┌───────────┐         ▼
│development│─▶┌──────────────┐
└───────────┘  │   academic   │
               └──────┬───────┘
                      ▼
               ┌──────────────┐
               │ organization │
               └──────────────┘

Infrastruktur Lintas-Domain (src/server/):
- Auth Session Adapter ──▶ administration.resolveAccess() + identity
- AuditService (via 8 Domain Events: StudentRegistered, StudentVerified, StudentPlaced,
  AttendanceRecorded, DevelopmentNoteCreated, ConsentUpdated, ReportApproved, PublicationPublished)
```

### Aturan Ketergantungan Terlarang (`11 §21`)
- **DILARANG:** `students` → `attendance` repository
- **DILARANG:** `attendance` → `publishing` repository
- **DILARANG:** `development` → `consent` repository
- **DILARANG:** Lintas domain mengakses `repositories/` atau `queries/` domain lain secara langsung (wajib lewat `index.ts` / Service atau Domain Event).

---

## 3. Public API Ringkas per Domain

- `identity`: `getAuthUser()`, `requireAuthUser()`
- `administration`: `resolveAccess(userId)`, `assignRole()`, `grantUserPermission()`, `revokeUserPermission()`, `listRbacMatrix()`
- `organization`: `getActiveServiceUnit()`, `getOrganizationHierarchy()`, `getUserMemberships(userId)`
- `academic`: `listActiveClasses()`, `getClassDetail(classId)`, `listSchedules()`, `listTeachers()`
- `students`: `submitPublicRegistration()`, `verifyStudent()`, `placeStudentToClass()`, `listStudents()`, `getStudentDetail()`
- `attendance`: `getOrCreateSession(classId, date)`, `recordSessionAttendance()`, `listSessionHistory()`
- `development`: `createDevelopmentNote()`, `listStudentNotes()` (terfilter Policy `confidential`)
- `consent`: `recordConsent()`, `revokeConsent()`, `hasMediaPublicationConsent(studentId)`
- `media`: `createUploadUrl()`, `confirmUpload()`, `reviewMediaEligibility()`, `getSignedMediaUrl()`, `listPublicGallery()`
- `governance`: `createReport()`, `submitReportForReview()`, `reviewReport()`, `approveReport()`, `listReports()`
- `publishing`: `createPost()`, `submitForPrivacyReview()`, `approvePost()`, `publishPost()`, `listPublishedPosts()`
- `audit`: `recordAuditEvent(event)`, `listAuditLogs()`

