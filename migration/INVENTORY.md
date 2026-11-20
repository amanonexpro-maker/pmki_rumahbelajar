# INVENTORY — Audit Kondisi Eksisting Aplikasi PMKI

**Tanggal:** 2026-11-20  
**Fase:** FASE 0 — Formalisasi Artefak  
**Lokasi Aplikasi Eksisting:** Root repository (`d:\projects\pmki_rumahbelajar`)

---

## 1. Tech Stack & Dependensi Utama
- **Frontend:** React 19.0.1 (`react`, `react-dom`), Vite 8.3.0 (`@vitejs/plugin-react`), TypeScript 7.0.2, Tailwind CSS v4.3.3 (`@tailwindcss/vite`), `lucide-react` 0.546.0, `motion` 12.23.24, `clsx`, `tailwind-merge`, `zod` 4.6.7.
- **Backend Eksisting:** Express 4.21.2 (`server/index.ts`), `tsx` 4.21.0, `pg` 8.23.1, `dotenv` 17.2.3.
- **Database & Container:** PostgreSQL 16 Alpine via `docker-compose.yml` (`pmki_terpadu_postgres` di port host `5433`, db `pmki_terpadu`, user `pmki_admin`).
- **Package Manager / Lockfile:** `bun.lock` / npm scripts di `package.json`.

---

## 2. Cara Menjalankan Aplikasi Eksisting
1. **Database:** `docker compose up -d` (PostgreSQL aktif di `127.0.0.1:5433`).
2. **Backend API:** `npm run api:dev` (`tsx watch server/index.ts` → `http://127.0.0.1:3001`).
3. **Frontend Web:** `npm run dev` (`vite --port=3000 --host=127.0.0.1` → `http://127.0.0.1:3000/`, proxy `/api` ke port `3001`).
4. **Typecheck & Build:** `npm run lint` (`tsc --noEmit`), `npm run build` (`vite build` → `dist/`).

---

## 3. Arsitektur Penyimpanan Data (Dual-Layer Existing)
- **Client-Side:** `StorageManager` singleton (`src/services/storage.ts`) menyimpan state di memori & `localStorage` (`pmki_students`, `pmki_consents`, `pmki_attendance`, `pmki_notes`, `pmki_publications`, `pmki_reports`, `pmki_audits`, `pmki_current_user`).
- **Server-Side:** Setiap mutasi memanggil `storage.persist()` yang mengirim **full JSON snapshot** ke `PUT /api/state` (Express `server/index.ts`). Saat boot, `GET /api/state` membaca snapshot dari PostgreSQL.
- **25 Tabel PostgreSQL (`migrations/001_relational_schema.sql`, `002_development_note_teacher_refs.sql`):**
  1. `academic_years`, 2. `application_settings`, 3. `attendance_records`, 4. `attendance_sessions`, 5. `audit_logs`, 6. `class_schedules`, 7. `classes`, 8. `consents`, 9. `guardians`, 10. `media_assets`, 11. `organizations`, 12. `pmki_app_state`, 13. `publication_posts`, 14. `report_approval_logs`, 15. `schema_migrations`, 16. `service_reports`, 17. `service_unit_contacts`, 18. `service_unit_sub_districts`, 19. `service_units`, 20. `student_development_notes`, 21. `students`, 22. `subjects`, 23. `teacher_subjects`, 24. `teachers`, 25. `users`.

---

## 4. Data Produksi & Seed Counts (`src/db/seed-data.ts`)
- **Status Data Produksi:** **TIDAK ADA DATA PRODUKSI.** Seluruh data adalah **mock/seed simulasi** untuk pilot Rumah Belajar Griya Asih Lawang.
- **Jumlah Record Seed (`src/db/seed-data.ts`):**
  - `initialOrganizations`: 2 | `initialServiceUnits`: 1 | `initialUsers`: 5
  - `initialAcademicYears`: 2 | `initialSubjects`: 4 | `initialTeachers`: 13
  - `initialClasses`: 10 | `initialSchedules`: 6 | `initialStudents`: 8
  - `initialConsents`: 6 | `initialMediaAssets`: 10 | `initialAttendanceSessions`: 2
  - `initialDevelopmentNotes`: 3 | `initialPublications`: 4 | `initialReports`: 2
  - `initialAuditLogs`: 3

---

## 5. Peta Layar & Komponen per Layer (`07-COMPONENT-ARCHITECTURE.md`)

### A. Peta Referensi UI-1 … UI-12
- **UI-1 Foundation:** `src/styles/tokens.css`, `themes.css`, `typography.css`, `src/index.css`, `src/utils/cn.ts`, `src/components/ui/*`
- **UI-2 Shell:** `src/components/layout/{AppShell,Sidebar,WorkspaceHeader,PageContainer,ThemePicker}.tsx`
- **UI-3 Dashboard:** `src/components/dashboard/OverviewView.tsx`, `src/components/patterns/dashboard/*`
- **UI-4 Data Workspace:** `src/components/dashboard/StudentsView.tsx`, `src/components/patterns/{DataTable,SearchToolbar}.tsx`
- **UI-5 Detail:** `src/components/dashboard/{StudentDetailView,OrganizationView}.tsx`, `src/components/patterns/{EntityHeader,DetailTabs}.tsx`
- **UI-6 Forms:** `src/components/public/RegistrationForm.tsx`, `src/components/patterns/{FormSection,FormActions,StepIndicator,ReviewSection}.tsx`
- **UI-7 Education:** `src/components/dashboard/{AttendanceView,StudentDevelopmentView}.tsx`, `src/components/patterns/SessionProgress.tsx`
- **UI-8 Governance:** `src/components/dashboard/{ReportsApprovalView,ConsentMediaView,PublishingView}.tsx`, `src/components/patterns/{WorkflowProgress,DecisionHistory}.tsx`
- **UI-9 Admin & Audit:** `src/components/dashboard/{AdministrationView,AuditLogView}.tsx`, `src/components/patterns/ChangeSummary.tsx`
- **UI-10 QA & UI-11 Polish:** Cross-cutting aksesibilitas, responsif 375/768/1024/1440px, `themes.css` keyframes (`animate-dialog`, `animate-sheet-*`, `animate-dropdown`), `Button.tsx` tactile press, `StatSummary.tsx` grid borders.
- **UI-12 Public Website:** `src/components/layout/{Navbar,Footer}.tsx`, `src/components/public/{Hero,AboutSection,ProgramSection,ScheduleSection,GallerySection,NewsSection,ContactSection}.tsx`

### B. Inventaris Komponen per Layer (`07`)
- **Layer 1 (`ui/` — 13 primitives + barrel):** `Avatar.tsx`, `Badge.tsx`, `Button.tsx`, `Checkbox.tsx`, `Dialog.tsx`, `Icon.tsx`, `Input.tsx`, `Radio.tsx`, `Select.tsx`, `Sheet.tsx`, `Skeleton.tsx`, `Textarea.tsx`, `Tooltip.tsx`, `index.ts`.
- **Layer 2 (`layout/` — 7 komponen):** `AppShell.tsx`, `Footer.tsx`, `Navbar.tsx`, `PageContainer.tsx`, `Sidebar.tsx`, `ThemePicker.tsx`, `WorkspaceHeader.tsx`, `index.ts`.
- **Layer 3 (`patterns/` — 15 patterns + 5 dashboard sub-patterns):** `ChangeSummary.tsx`, `DataTable.tsx`, `DecisionHistory.tsx`, `DetailTabs.tsx`, `EmptyState.tsx`, `EntityHeader.tsx`, `FormActions.tsx`, `FormSection.tsx`, `PageHeader.tsx`, `ReviewSection.tsx`, `SearchToolbar.tsx`, `SessionProgress.tsx`, `StatSummary.tsx`, `StepIndicator.tsx`, `WorkflowProgress.tsx`, `dashboard/{ActivityList,AttentionList,SummaryMetric,UpcomingList,dashboardData}.ts`.
- **Layer 4 (`dashboard/` & `public/`):** 12 file di `dashboard/`, 8 file di `public/`.
- **Non-UI:** `src/theme/ThemeProvider.tsx`, `src/permissions/can.ts`, `src/services/storage.ts`, `src/types/index.ts`, `src/App.tsx`, `src/main.tsx`.

---

## 6. Pola State Existing → Pelanggaran `08-STATE-MANAGEMENT.md`
1. **Business Data in Client State / `localStorage`:** `StorageManager` menampung seluruh entitas di memori & `localStorage` + `PUT /api/state` (melanggar *PostgreSQL single source of truth*).
2. **Search/Filter/Tab State di React `useState`:** Filter di `StudentsView`, `AttendanceView`, `AuditLogView`, `ReportsApprovalView` belum disinkronkan ke URL query params (`?search=&status=&page=&tab=`).
3. **Form Manual `useState`:** `RegistrationForm.tsx` dan modal-modal form memakai `useState` per field + validator manual, belum menggunakan React Hook Form + Zod.
4. **Hardcoded `storage.getCurrentUser()` di Komponen:** Komponen membaca user langsung dari `storage` tanpa Server Session adapter.

---

## 7. Auth & RBAC Existing → Pemetaan ke 11 Role Resmi (`05 §6`)
- **Auth Existing:** Simulasi penuh tanpa login/password (`WorkspaceHeader` role switcher mengubah `pmki_current_user` di `localStorage`).
- **RBAC Existing (`src/permissions/can.ts`):** Sudah mendefinisikan **11 tipe `Role`** (`PLATFORM_ADMIN`, `ORG_ADMIN`, `UNIT_COORDINATOR`, `PROGRAM_COORDINATOR`, `TEACHER`, `VOLUNTEER`, `EDITOR`, `REVIEWER`, `APPROVER`, `AUDITOR`, `STAKEHOLDER`) dan 30 permission strings statis di `ROLE_PERMISSIONS`, namun belum dinamis dari DB (tanpa grant/revoke overrides dan tanpa enforcement server-side per request).
- **Coverage User Demo Existing (`seed-data.ts`):** Baru 5 user demo (`PLATFORM_ADMIN`, `UNIT_COORDINATOR`, `PROGRAM_COORDINATOR`, `TEACHER`, `APPROVER`). Belum memiliki user demo untuk: `ORG_ADMIN`, `VOLUNTEER`, `EDITOR`, `REVIEWER`, `AUDITOR`, `STAKEHOLDER`.

---

## 8. Offline, Aset Desain & Lainnya
- **Offline Existing:** **Belum ada.** Tidak ada Service Worker, manifest PWA, IndexedDB queue, `operationId`, maupun sync endpoint.
- **Aset Desain:**
  - Foto autentik pilot di `public/images/gallery/` (10 aset terreferensi di `seed-data.ts`).
  - Tokens CSS v4 di `src/styles/tokens.css`, `themes.css`, `typography.css` (Plus Jakarta Sans, JetBrains Mono; target publik juga memakai Newsreader untuk display).
  - Theme switcher light/dark di `src/theme/ThemeProvider.tsx`.

