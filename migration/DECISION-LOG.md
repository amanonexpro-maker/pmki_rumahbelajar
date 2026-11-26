# DECISION-LOG — Catatan Keputusan Migrasi PMKI

**Aturan:** Keputusan berstatus `FINAL` bersifat mengikat. Keputusan berstatus `USULAN` **dilarang** dianggap final sebelum mendapat approval eksplisit dari Product Owner/User.

---

## 1. Keputusan FINAL (`D-01 … D-30`)

### A. Arsitektur, Desain & Domain (`D-01 … D-16`)
| ID | Keputusan | Status | Sumber Otoritas |
| :-: | :--- | :-: | :--- |
| **D-01** | Arsitektur target menggunakan **Domain-Driven Modular Monolith** dengan 12 domain + `features/public` (`index.ts` sebagai satu-satunya Public API lintas domain). | `FINAL` | `docs/11` & `AGENTS.md` |
| **D-02** | UI menggunakan **Bahasa Indonesia** sesuai kamus kanonik `10` (`Peserta Didik`, `Pengajar`, `Kelas`, `Kehadiran`/`Presensi`, `Tidak hadir`, dll.); Code/DB/API menggunakan **English**. | `FINAL` | `docs/10` & `AGENTS.md` |
| **D-03** | Kapitalisasi UI standar adalah **Sentence case**; **Title Case** hanya untuk label navigasi dan page title. | `FINAL` | `docs/10 §5A` |
| **D-04** | Identitas desain berpegang pada North Star *"Public is expressive. Workspace is calm. Data is clear. Children are respected."* dengan token semantik (tanpa brand token langsung di komponen). | `FINAL` | `docs/03` & `UI-UX` |
| **D-05** | PostgreSQL adalah satu-satunya source of truth; `StorageManager` dan `PUT /api/state` tidak di-port. | `FINAL` | `docs/08` & `AGENTS.md` |
| **D-06** | State search, filter, pagination, dan tab penting disimpan di **URL Query Params**; Context hanya untuk `Theme`, `Session`, `Connectivity`. | `FINAL` | `docs/08` |
| **D-07** | Form menggunakan **React Hook Form + Zod** dengan mutasi melalui Next.js **Server Actions** tipis yang mengembalikan `{ success: true, data } \| { success: false, error: { code, message } }`. | `FINAL` | `docs/08` & `09` |
| **D-08** | RBAC menggunakan prinsip **Default Deny**, **Least Privilege**, **Need To Know**, dengan resolusi dinamis DB: `Role Permissions → Grant Overrides → Revoke Overrides` (Revoke selalu menang) + `Policy` di atas role/admin. | `FINAL` | `docs/05` |
| **D-09** | Kontrak Session Server (`05 §20`): `{ id, roles: string[], permissions: string[], memberships: [{ organizationId, serviceUnitId, programId? }] }`. | `FINAL` | `docs/05 §20` & `AGENTS.md` |
| **D-10** | Data anak `PRIVATE by default`; `development_notes.confidential` default `TRUE`; `Persetujuan Data` terpisah mutlak dari `Persetujuan Foto & Video` (tanpa preselect). | `FINAL` | `docs/05`, `04`, `10` |
| **D-11** | Offline PWA hanya untuk **Tier A** (`Attendance`, `Development Notes`, `Student Lookup`) via IndexedDB + `/api/sync` dengan `operationId` idempoten; **Tier B** cached; **Tier C** online-only. | `FINAL` | `docs/06` |
| **D-12** | Label status sinkronisasi offline wajib jujur (`Disimpan lokal`, `Belum tersinkronisasi`, `Menunggu sinkronisasi`, `Tersinkronisasi`), tanpa klaim berhasil sebelum server konfirmasi. | `FINAL` | `docs/06` |
| **D-13** | Entitas domain memakai PK **UUID v7** (kecuali `users.id = auth.users.id` UUID v4 sesuai ADR-13); seluruh entitas wajib kolom audit & soft delete (`archived_at/by`). | `FINAL` | `docs/04` & `AGENTS.md` |
| **D-14** | `audit_logs` dan `report_workflow_logs` wajib **append-only** yang ditegakkan oleh trigger DB (tolak UPDATE/DELETE untuk semua role). | `FINAL` | `docs/04` & `AGENTS.md` |
| **D-15** | `attendance_sessions` wajib memiliki constraint `UNIQUE(class_id, session_date)`. | `FINAL` | `docs/04` & `AGENTS.md` |
| **D-16** | Prototipe Vite di root repository tidak dihapus/ditimpa selama migrasi karena menjadi referensi parity UI-1…UI-12. | `FINAL` | `AGENTS.md` |

### B. Keputusan Platform Supabase & Vercel — ADR-13 (`D-17 … D-30`)
| ID | Keputusan | Status | Sumber Otoritas |
| :-: | :--- | :-: | :--- |
| **D-17** | Supabase ditetapkan sebagai **Platform** (Database PG17 + Auth + Private Storage); dev lokal memakai **Supabase CLI** (`supabase start`) untuk paritas dengan Supabase Cloud Singapore. | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-18** | **Drizzle** adalah satu-satunya jalur data aplikasi dan satu-satunya engine migrasi (`generate` + `migrate`), termasuk untuk RLS, trigger audit, bucket, dan grants. | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-19** | Identity bersumber dari **Supabase Auth**; server wajib memanggil `supabase.auth.getUser()` (bukan `getSession()`) untuk setiap keputusan akses. | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-20** | `permissions` di-resolve **per-request dari DB** (bukan klaim JWT) agar grant/revoke override langsung efektif tanpa re-login atau deploy ulang. | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-21** | **RLS deny-by-default** (`anon`/`authenticated` tanpa policy = deny) diterapkan di seluruh tabel operasional sebagai lapis kedua; RBAC `05` tetap lapis utama via Drizzle owner connection. | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-22** | Dilarang `supabase-js` membaca data operasional langsung dari browser/client; `SUPABASE_SERVICE_ROLE_KEY` hanya boleh diakses di server. | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-23** | Bucket `media` bersifat **private**; upload besar via `createUploadUrl → client PUT → confirmUpload`; akses baca via **signed URL** server-side dengan TTL > TTL cache halaman. | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-24** | Email development menggunakan **Mailpit** bawaan Supabase CLI (menggantikan Mailhog); template email disimpan di repo. | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-25** | Koneksi runtime memakai transaction pooler port `6543` (`prepare: false`); migrasi memakai `DIRECT_URL` session pooler port `5432`. | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-26** | `users.password_hash` tidak ada; `users.id = auth.users.id` (UUID v4); provisioning user dilakukan server-side via Supabase Admin API oleh domain `administration` (`enable_signup=false`). | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-27** | Aplikasi production di-hosting di **Vercel** dengan function region **`sin1`** (Singapore); migrasi dijalankan di CI, bukan di `vercel build`. | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-28** | `middleware.ts` harus **edge-safe**: hanya refresh cookie Supabase Auth & gate kasar (dilarang mengimpor Drizzle di middleware). | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-29** | Setiap migration yang membuat tabel wajib diakhiri `SELECT public.pmki_harden_tables();`; seluruh migration bersifat forward-only (rollback = forward-fix). | `FINAL` | `AGENTS.md` (ADR-13) |
| **D-30** | Seed data hanya untuk environment **dev/staging**, dilarang dijalankan di production. | `FINAL` | `AGENTS.md` (ADR-13) |

---

## 2. Keputusan Disetujui dari Usulan Fase 0 (`U-01 … U-12` → `FINAL`)

> Disetujui oleh Product Owner pada 2026-11-20 (Penutupan Fase 0).

| ID | Topik Keputusan | Keputusan Final | Alasan & Konsekuensi | Status |
| :-: | :--- | :--- | :--- | :---: |
| **U-01** | **Struktur Monorepo / Direktori Target** | Tempatkan aplikasi Next.js target di `apps/web/` (terisolasi), sementara prototipe Vite tetap utuh di root repo hingga cutover. | Memungkinkan pengembangan paralel tanpa mengganggu/menimpa prototipe referensi parity. | `FINAL` |
| **U-02** | **Versi Next.js & React Target** | Gunakan **Next.js stabil terbaru (App Router)** dengan React 19 + TypeScript `strict: true` + Tailwind CSS v4. | Konsisten dengan React 19 dan mendukung Server Actions / Server Components terbaru. Versi eksak dicatat saat scaffolding Fase 1. | `FINAL` |
| **U-03** | **Generator UUID v7** | Implementasi generator UUID v7 di application layer untuk PK entitas domain (`students`, `classes`, dll.), sedangkan `users.id` mengikuti UID Supabase Auth (UUID v4) sesuai ADR-13. | Memenuhi `04` (UUID v7 sortable by time) tanpa bergantung pada ekstensi PG. | `FINAL` |
| **U-04** | **Library Offline IndexedDB & PWA** | Gunakan library `idb` untuk abstraksi IndexedDB dan Service Worker untuk Tier A (`Attendance`, `Development Notes`, `Student Lookup`), dengan label sync jujur (`06 §10–11`). | Mengurangi boilerplate IndexedDB raw yang rawan bug transaksi saat offline di lapangan. | `FINAL` |
| **U-05** | **Library Form & Validasi** | Pasang `react-hook-form` + `@hookform/resolvers` + `zod` di `apps/web/`; skema validasi terpusat di `features/<domain>/validators`, submission via Server Actions. | Wajib sesuai aturan `08` (React Hook Form + Zod). | `FINAL` |
| **U-06** | **Test Runner & Strategi DB Test** | Gunakan **Vitest** sebagai runner utama (unit/service/policy/validation + integration tests terhadap PostgreSQL lokal via Supabase CLI). Playwright/E2E browser ditunda ke pasca-cutover. | Memenuhi `AGENTS.md` Testing Rules (`11 §38`) secara cepat dan deterministik; kualitas UI dijaga lewat Design Review Gates. | `FINAL` |
| **U-07** | **Mapping User Demo & Penambahan Akun Uji Coba (SoD)** | Seed dev mencakup mapping: Platform Admin (`PLATFORM_ADMIN`), Ms. Evi (`UNIT_COORDINATOR`), Ms. Lilian (`EDITOR`), Pak Budi (`TEACHER`), ditambah `APPROVER` (SoD terhadap Ms. Lilian & Ms. Evi) dan `AUDITOR` (read-only penuh). | Memastikan skenario SoD Governance dan audit read-only dapat diuji end-to-end sejak awal. | `FINAL` |
| **U-08** | **Cakupan 11 Role Demo (`05 §6`)** | Seed development **wajib mencakup 11 user demo lengkap** (1 akun per role resmi `05 §6`: `PLATFORM_ADMIN`, `ORG_ADMIN`, `UNIT_COORDINATOR`, `PROGRAM_COORDINATOR`, `TEACHER`, `VOLUNTEER`, `EDITOR`, `REVIEWER`, `APPROVER`, `AUDITOR`, `STAKEHOLDER`). | Memastikan RBAC dinamis dan override permission dapat diverifikasi untuk seluruh 11 role di Fase 3 & 8. | `FINAL` |
| **U-09** | **Domain Event Dispatcher** | Implementasikan in-process typed event bus sederhana (`pub/sub` internal) untuk memicu audit logging dan side-effects ringan pada 8 domain events wajib; logika bisnis inti lintas domain tetap lewat service calls. | Menjaga decoupling antar domain tanpa message broker eksternal di tahap MVP. | `FINAL` |
| **U-10** | **Strategi Penyesuaian Terminologi (`10`)** | Ganti istilah non-kanonik secara bertahap seiring pembangunan fitur di `apps/web/` (nol istilah lama `Siswa`/`Rombel`/`Guru` di kode baru); semua label status/role diambil dari `src/lib/status.ts` (sentence case). | Menghindari pekerjaan ulang dan menjamin kepatuhan mutlak `10-CONTENT-MICROCOPY-GUIDE.md`. | `FINAL` |
| **U-11** | **Strategi Dark Mode Public vs Workspace** | Dark mode aktif sejak Fase 1 untuk semua komponen workspace; Public experience tetap light-first namun dark-ready tanpa mengorbankan identitas hangat. | Sejalan dengan `UI-UX §43` dan hasil UI-12. | `FINAL` |
| **U-12** | **Penghapusan Fitur "Reset Data Seed" di Production** | Fitur reset/simulation hanya tersedia di environment dev/sandbox dan tidak boleh ada di build production. | Memenuhi guardrail UI-9 dan ADR-13 (`D-30`). | `FINAL` |

---

## 3. Catatan Teknis & Dependensi Fase 1 (Tercatat Sesuai Protokol #11)

| ID | Catatan | Detail & Alasan |
| :-: | :--- | :--- |
| **F1-01** | **Versi Stack `apps/web/`** | `next@16.4.6` (App Router + Turbopack), `react@19.3.0`, `tailwindcss@4.3.3`, `typescript@^5` (`strict: true`), `vitest@5.1.1` (dengan `@types/node@^24` sesuai Node `v24.11.1`). |
| **F1-02** | **Dependensi Baru `apps/web/`** | `drizzle-orm`, `postgres` (`prepare: false`), `drizzle-kit` (D-18); `@supabase/supabase-js`, `@supabase/ssr` (D-17/19); `zod`, `clsx`, `tailwind-merge`, `lucide-react`, `uuidv7` (U-03); `vitest`, `dotenv`, `tsx` (U-06). |
| **F1-03** | **Resolusi Konflik Folder (`09 §10 / 08 §38 / 04 §27–28 vs 11 §6`)** | Otoritas `11` menang: validator per domain di `src/features/<domain>/validators`, `src/server/` hanya infrastruktur lintas domain (`auth`, `permissions`, `policies`, `validations`, `contracts`, `sync`, `upload`), skema Drizzle terpusat di `src/db/schema` sesuai kepemilikan 12 domain. |
| **F1-04** | **Port Lokal Supabase CLI (`pmki-web`)** | Menggunakan port `55421` (API), `55422` (PG17), `55423` (Studio), `55424` (Mailpit) untuk menghindari bentrok dengan proyek Supabase lokal lain (`amanharini`) yang aktif di port `54321–54327`. |
| **F1-05** | **Dependensi UI Primitives (Sub-sesi 1b)** | Memasang `class-variance-authority`, `cmdk`, dan 11 paket `@radix-ui/react-*` (`slot`, `dialog`, `dropdown-menu`, `popover`, `scroll-area`, `switch`, `tabs`, `tooltip`, `checkbox`, `radio-group`, `select`) sebagai infrastruktur aksesibilitas shadcn/ui yang di-re-theme penuh ke semantic tokens PMKI. |
| **F1-06** | **Strategi PWA Service Worker pada Next.js 16 Turbopack (Sub-sesi 1c)** | Menggunakan native Service Worker ringan (`public/sw.js`) + registrasi `"use client"` (`PwaRegister`) tanpa webpack plugin agar 100% kompatibel dengan Next.js 16 Turbopack build, mendukung offline shell (`/offline`) dan banner `"Perbarui sekarang / Nanti"` (`06 §21`). Library `idb` akan dipasang di Fase 7 saat implementasi Tier A IndexedDB queue. |
| **F2-01** | **Struktur Schema Folder Domain-Owned (`11` menang atas `04 §27`)** | Seluruh 32 tabel Drizzle dikelompokkan di `apps/web/src/db/schema/<domain>/` (`identity`, `administration`, `organization`, `academic`, `students`, `attendance`, `development`, `consent`, `media`, `governance`, `publishing`, `audit`, `platform`) menggunakan nama kanonik `04` (`development_notes`, `publications`, `reports`, `report_workflow_logs`). |
| **F2-02** | **Ownership `programs`, `class_enrollments`, `sync_operations`** | `programs` di bawah `organization` (mendukung `user_memberships.program_id`), `class_enrollments` di bawah `academic` (diakses `Students.PlacementService` via `AcademicService`), `sync_operations` di bawah `platform` sebagai ledger idempotency offline sync (`09 §29`). |
| **F2-03** | **Versioning `development_notes` (B-lite)** | Menggunakan kolom `version` pada `development_notes` ditambah tabel `development_note_revisions` (append revision) untuk mencegah silent overwrite saat rekonsiliasi offline (`06 §14`). |
| **F2-04** | **Penghapusan `users.password_hash` & `users.role`** | `public.users` hanya menyimpan `id` (UUID v4 = `auth.users.id`), `name`, `email`, `avatar_url`, `active`, `last_login_at`, audit & archive columns (ADR-13 / D-26 / `05`). |
| **F4-01** | **Instalasi `react-hook-form`, `@hookform/resolvers`, `idb` & Event Bus** | Memasang `react-hook-form` + `@hookform/resolvers` (`U-05`) dan `idb` (`U-04`) di `apps/web/` untuk wizard pendaftaran 5 langkah (`UI-6`), pemulihan draft IndexedDB, serta antrean offline jujur (`"Pendaftaran disimpan lokal. Akan dikirim saat online."`). Domain events (`StudentRegistered`, `StudentVerified`, `StudentPlaced`) disalurkan via `src/server/events/domain-events.ts` (`U-09`) ke `features/audit`. |
| **F22-01** | **Instalasi `exceljs` untuk Impor & Templat `.xlsx` Peserta Didik** | Memasang `exceljs` di `apps/web/` untuk menghasilkan templat Excel (`.xlsx`) resmi beserta panduan pengisian dan mem-parsing unggahan `.xlsx` secara server-side pada Route Handler `/api/students/import` (online-only, validasi Zod per baris, status awal `SUBMITTED`). Dipilih dibanding `xlsx` (SheetJS) karena mendukung styling/validasi sheet terstruktur tanpa isu kerentanan prototype pollution pada versi lawas. |

