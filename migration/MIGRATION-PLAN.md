# MIGRATION-PLAN — Rencana Strategis Migrasi PMKI Platform

**Tanggal:** 2026-11-20  
**Status:** USULAN / IN REVIEW (Menunggu Persetujuan User di Fase 0)  
**Target Platform:** Next.js App Router (`apps/web/`) + Drizzle ORM + Supabase (Auth, PG17, Private Storage) + Vercel (`sin1` Singapore) + PWA

---

## 1. Strategi Paralel & Perlindungan Prototipe
- **Lokasi Aplikasi Existing:** Prototipe Vite/React/Express tetap berada di **root repository** (`src/`, `server/`, `migrations/`, `public/`, `package.json`) dan **TIDAK dipindahkan, diubah, atau dihapus** selama proses migrasi berlangsung paralel. Prototipe ini berfungsi sebagai referensi parity 1:1 untuk UI-1…UI-12.
- **Lokasi Aplikasi Production Target:** Dibangun secara paralel di dalam direktori **`apps/web/`** (struktur monorepo/workspace terisolasi sesuai `U-01`).
- **Database Lama (`127.0.0.1:5433`):** Container PostgreSQL 16 (`pmki_terpadu_postgres`) diperlakukan sebagai **read-only referensi** selama migrasi.

---

## 2. Strategi Database & Data (Fresh PG17 + Re-Seed)
- **Database Target:** Fresh **PostgreSQL 17** via **Supabase CLI** lokal (`supabase start`) untuk pengembangan dengan paritas struktural penuh terhadap **Supabase Cloud Singapore** di production.
- **Migrasi Engine Tunggal:** **Drizzle ORM + Drizzle Kit** (`generate` + `migrate`) sebagai satu-satunya jalur data & engine migrasi, termasuk objek platform (RLS deny-by-default, trigger append-only untuk `audit_logs` & `report_workflow_logs`, bucket `media`, grants, dan `SELECT public.pmki_harden_tables();` di akhir setiap migration yang membuat tabel).
- **Tanpa Data Migration:** Karena hasil audit memastikan **tidak ada data produksi** (seluruh data existing adalah mock/seed simulasi), fase migrasi menggunakan **fresh schema + re-seed** (seed HANYA dijalankan di environment dev/staging, dilarang di production).
- **Koneksi Pooler:** Runtime menggunakan transaction pooler port `6543` (`prepare: false`); migrasi CI menggunakan `DIRECT_URL` session pooler port `5432`.

---

## 3. Nasib Komponen Legacy (Tidak Di-Port ke Production)
- **Express Snapshot Server (`server/index.ts`):** **TIDAK di-port** dan tidak ada di production `apps/web/`. Digantikan oleh Next.js Server Actions & Route Handlers minimal (`/api/sync`, `/api/uploads/*`, webhook).
- **`StorageManager` (`src/services/storage.ts`) & `PUT /api/state`:** **TIDAK di-port / dihapus** dari arsitektur target. Source of truth mutlak adalah PostgreSQL via Drizzle.
- **Reset Seed Button (`AdministrationView`):** Hanya tersedia jika mode dev/sandbox diaktifkan eksplisit (`NEXT_PUBLIC_APP_ENV` / environment flag), dilarang muncul sebagai fitur administrasi DB production.

---

## 4. Branch Strategy & Cutover
- **Branch Strategy:**
  - `main` = stabil (menyimpan prototipe root + dokumen + artefak `migration/`).
  - `feat/migration-phase-<N>-<nama>` = branch kerja per fase migrasi dengan conventional commits (`feat:`, `chore:`, `fix:`, `docs:`, `test:`).
- **Cutover Strategy:**
  - Setelah seluruh fase migrasi di `apps/web/` lulus quality gate (typecheck, lint, build, test suite, parity checklist UI-1…UI-12, Design Review Gates 1–5):
    1. Deploy `apps/web/` ke Vercel (`sin1`) terhubung ke Supabase Cloud Singapore.
    2. Arsipkan prototipe Vite root ke tag/direktori arsip (`archive/prototype-vite` atau branch arsip) dan lakukan switch root/deployment ke `apps/web/`.

---

## 5. Urutan Fase Migrasi (Roadmap Bertahap)

| Fase | Nama Fase | Ruang Lingkup Utama | Verifikasi / Exit Gate |
| :-: | :--- | :--- | :--- |
| **0** | **Formalisasi Artefak** | Susun `migration/` (Inventory, Gap, Domain Map, Parity, Terminology, Plan, Decision Log, State) | Approval user atas `MIGRATION-PLAN.md` & `U-01…U-12` |
| **1** | **Scaffolding & Platform Setup** | Setup `apps/web/` (Next.js App Router, Tailwind v4, tokens), Drizzle config, Supabase CLI lokal, env contract, `pmki_harden_tables()` | `supabase start` sehat, lint & build `apps/web/` lulus |
| **2** | **Database Schema & Core Infrastructure** | Skema Drizzle 12 domain (UUID v7, common columns, triggers append-only, RLS), domain event bus, `src/lib/{status,messages}.ts`, shared contracts | Migration sukses, seed dev berjalan, schema tests lulus |
| **3** | **Identity, Administration & Audit (RBAC)** | Supabase Auth (`getUser()`), `identity` + `administration` (`resolveAccess`, dynamic role/grant/revoke), `audit` domain, middleware edge-safe, Policy Engine | RBAC unit + integration tests lulus |
| **4** | **Design System Primitives & App Shell** | Porting 13 UI primitives + layout shell (`AppShell`, `Sidebar`, `WorkspaceHeader`) + 15 patterns (`UI-1`, `UI-2`), `COMPONENT-REGISTRY.md`, `ThemeContext`, `SessionContext` | Parity UI-1 & UI-2, Design Review Gates 1–5 |
| **5** | **Public Experience & Pendaftaran Online** | `features/public` (`UI-12`) + `RegistrationForm` (`UI-6` RHF + Zod + Server Action `students.RegistrationService`), terminology sweep publik | Parity UI-6 & UI-12, validation + service tests lulus |
| **6** | **Core Operations: Organization, Academic, Students** | `organization`, `academic`, `students` (`UI-3` Overview, `UI-4` Students DataTable + URL state, `UI-5` Detail + progressive disclosure) | Parity UI-3/4/5, Students integration tests lulus |
| **7** | **Education Workflows & PWA Offline (Tier A)** | `attendance` & `development` (`UI-7`), `ConnectivityContext`, IndexedDB abstraction, Service Worker, `/api/sync` idempotency (`operationId`), conflict handling | Parity UI-7, Attendance integration + offline sync tests lulus |
| **8** | **Governance, Consent, Media & Publishing** | `consent`, `media` (Supabase Storage private bucket + signed URL), `governance` (4-stage workflow + strict SoD), `publishing` (`UI-8`), `Administration` & `AuditLog` UI (`UI-9`) | Parity UI-8 & UI-9, Governance + SoD integration tests lulus |
| **9** | **System-Wide QA, Testing & Cutover Readiness** | Full regression & E2E/integration verification, Terminology & Privacy sweep final (`UI-10`, `UI-11`), Vercel `sin1` + Supabase Cloud dry-run, cutover checklist | 100% Parity Checklist `LULUS`, `tsc`, `lint`, `build`, semua test lulus |

