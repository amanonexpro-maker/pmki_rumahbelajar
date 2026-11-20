# PLATFORM-VERIFY — Verifikasi Platform Wiring Fase 1a (ADR-13)

**Tanggal:** 2026-11-20  
**Target App:** `apps/web/` (Next.js `16.4.6`, React `19.3.0`, TypeScript `strict: true`, Tailwind CSS `4.3.3`)  
**Supabase CLI:** `2.106.0` (PostgreSQL `17.x`)

---

## 1. Status Layanan Lokal (`supabase start`)
*Catatan Port:* Karena port default `54321–54327` sedang digunakan proyek lokal lain (`amanharini`) di mesin host, stack `pmki-web` dikonfigurasi dengan offset bersih `+1100` di `apps/web/supabase/config.toml` agar berjalan paralel tanpa mengganggu proyek lain:

| Layanan | Endpoint Lokal | Status |
| :--- | :--- | :---: |
| **Supabase API / Auth / Storage** | `http://127.0.0.1:55421` | `AKTIF` |
| **PostgreSQL 17 Database** | `postgresql://postgres:postgres@127.0.0.1:55422/postgres` | `AKTIF` |
| **Supabase Studio** | `http://127.0.0.1:55423` | `AKTIF` |
| **Mailpit (Email Dev)** | `http://127.0.0.1:55424` | `AKTIF` |
| **Realtime & Edge Functions** | Disabled (`enabled = false`, bukan MVP per ADR-13) | `NONAKTIF (SESUAI ADR-13)` |

---

## 2. Checklist Kepatuhan ADR-13
- [x] `supabase/config.toml`: `project_id = "pmki-web"`, `major_version = 17`, `enable_signup = false`, `minimum_password_length = 8`, `[db.seed] enabled = false` (Drizzle engine tunggal).
- [x] `supabase/templates/`: `confirmation.html` & `recovery.html` tersimpan sebagai kode di repo.
- [x] `.env.example` & `.env.local`: sesuai kontrak Appendix A (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` server-only, `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_STORAGE_BUCKET=media`, `MEDIA_SIGNED_URL_TTL=3600`).
- [x] `src/db/client.ts`: menggunakan `postgres-js` dengan `prepare: false` + Drizzle.
- [x] `drizzle.config.ts`: menggunakan `DIRECT_URL`.
- [x] `src/server/auth/session.ts`: memanggil `supabase.auth.getUser()` (bukan `getSession()`) dan `administration.resolveAccess()` (stub default-deny di Fase 1) dengan kontrak `05 §20`.
- [x] `src/middleware.ts`: edge-safe (hanya refresh cookie + coarse route gate `/workspace`; terverifikasi via test tidak mengimpor Drizzle/`postgres`).
- [x] `vercel.json`: dikonfigurasi `regions: ["sin1"]` (Singapore).
- [x] Prototipe Vite root & DB lama PG16 (`5433`) tetap utuh dan tidak dimodifikasi.

---

## 3. Verifikasi Database & Hardening Fase 2 (`drizzle-kit migrate` + Integration Test)
- [x] **Fresh Schema 32 Tabel:** `0000_pmki_initial_schema.sql` dan `0001_pmki_platform_hardening.sql` berhasil diterapkan via `DIRECT_URL` (`npm run db:migrate`) dari database kosong.
- [x] **Hardening `public.pmki_harden_tables()`:** RLS aktif (`rowsecurity = true`) di seluruh 32 tabel `public` dan **0 grant** untuk role `anon` maupun `authenticated`.
- [x] **Append-Only Immutability Triggers:** `trg_audit_logs_immutable` dan `trg_report_workflow_logs_immutable` menolak `UPDATE` dan `DELETE` bahkan oleh owner (`postgres`).
- [x] **Private Storage Bucket:** Bucket `media` tersedia di `storage.buckets` dengan `public = false`.
- [x] **Constraints & Privacy Defaults:** `UNIQUE(class_id, session_date)` pada `attendance_sessions` menolak duplikat, FK `class_enrollments.student_id → students.id` ditegakkan, `development_notes.confidential` default `true`, dan `public.users` tanpa `password_hash` maupun kolom `role` tunggal.
- [x] **Idempotent Dev Seed:** `npm run db:seed` dijalankan 2x berturut-turut tanpa error — membentuk 11 system roles, 64 permissions (`05 §8`), default matrix (`05 §9`), 11 demo users di `auth.users` + `public.users`, contoh override `GRANT` & `REVOKE`, serta data pilot Griya Asih.

---

## 4. Verifikasi Identity (Supabase Auth) & Dynamic RBAC Fase 3
- [x] **Self-Signup Blocked (`enable_signup = false`):** `supabase.auth.signUp()` publik ditolak oleh Supabase Auth (`rbac.integration.test.ts`).
- [x] **Autentikasi & `getUser()` Server-Side (D-19):** Login akun seed (`guru.matematika@pmki.org`) terverifikasi via `supabase.auth.getUser()` (bukan `getSession()`), cocok dengan `public.users.id`.
- [x] **Per-Request Dynamic RBAC (`Role → GRANT → REVOKE`, D-20):**
  - Default `TEACHER`: boleh `attendance.record`, ditolak `guardian.read` (`PERMISSION_DENIED`).
  - Dynamic `GRANT guardian.read`: langsung aktif pada permintaan berikutnya tanpa re-login/redeploy.
  - Dynamic `REVOKE development.create`: langsung ditolak (`REVOKE` selalu menang atas default role).
- [x] **Scope & Policy Engine (`05 §12–15`):**
  - Akses lintas `serviceUnitId` → `SCOPE_DENIED`.
  - Separation of Duties (`requireSeparationOfDuties`): `APPROVER` maupun `PLATFORM_ADMIN` menyetujui laporannya sendiri → `POLICY_DENIED`.
  - Klasifikasi `CONFIDENTIAL`: default DENY kecuali izin eksplisit + scope cocok (`canAccessConfidential`).
- [x] **Mailpit Email Recovery (D-24):** `resetPasswordForEmail()` berhasil masuk ke Mailpit lokal (`http://127.0.0.1:55424/api/v1/messages`).
- [x] **Quality Gates:** `npm run typecheck`, `npm run lint`, `npm run test` (**10 files / 39 tests PASS**), dan `npm run build` (`next build` Next.js 16.4.6) seluruhnya hijau.

---

## 5. Verifikasi Private Storage Signed URL, Consent & Publishing Fase 6 (ADR-13 D-23, D-29)
- [x] **3-Step Vercel-Safe Signed Upload (`createMediaUploadUrl → PUT → confirmMediaUpload`):** Terverifikasi secara live terhadap Supabase Storage bucket privat `media` (`http://127.0.0.1:55421/storage/v1/object/upload/sign/media/...`) di `consent-media-publishing.integration.test.ts`.
- [x] **Idempotensi `confirmMediaUpload`:** Konfirmasi ulang pada `filePath` yang sama di unit layanan yang sama ditolak dengan `RESOURCE_CONFLICT`.
- [x] **Signed Read URL TTL > Page Cache Revalidate (D-29):** `getMediaSignedUrlTtlSeconds()` = `3600` detik > `PAGE_CACHE_REVALIDATE_SECONDS` (`300` detik).
- [x] **Isolasi Publik untuk Media Belum Direview:** `listPublicGalleryMedia()` secara fisik memfilter `privacy_reviewed = true AND eligible_for_public = true` di level SQL, dan `getSignedMediaReadUrl(..., { forPublicChannel: true })` menolak pembuatan signed URL (`POLICY_DENIED`) bila media belum direview atau tidak layak publik.
- [x] **Separation of Duties (SoD) Media & Publishing (`05 §15`, `U-10`):** Pengunggah tidak dapat meninjau dokumentasinya sendiri (`POLICY_DENIED`), dan penulis tidak dapat menerbitkan kontennya sendiri (`POLICY_DENIED`), bahkan untuk `PLATFORM_ADMIN`.
- [x] **Enforcement Pencabutan Persetujuan (`REVOKED`):** Pencabutan `photoVideoConsent` melalui `ConsentService` langsung memblokir persetujuan media, mematikan pembuatan signed URL publik, dan memblokir penerbitan publikasi terkait (`POLICY_DENIED`).

---

## 6. Verifikasi Provisioning Supabase Admin API, Dynamic Custom Roles & Audit Immutability Fase 8 (ADR-13 D-26)
- [x] **Provisioning User via Supabase Admin API (`D-26`):** `provisionNewPlatformUser()` memanggil `supabaseAdmin.auth.admin.createUser()` di server (`enable_signup = false`), menyinkronkan profil ke `public.users` (`id = auth.users.id` UUID v4, tanpa `password_hash` dan tanpa kolom `role`), menetapkan `user_roles` & `user_memberships`, dan mencatat `UserProvisioned` ke `audit_logs` (`administration-audit.integration.test.ts`).
- [x] **Dynamic Custom Role Tanpa Coding/Deploy (`05 §16`):** Pembuatan peran kustom (mis. `KOORDINATOR_REMAJA` / `"Koordinator Remaja"`) di tabel `roles` & `role_permissions` langsung ter-resolve oleh `resolveAccess(userId)` pada request berikutnya dan memblokir kode izin yang melanggar kebijakan imutabilitas audit (`audit.delete`, `policy.bypass`).
- [x] **Override Grant/Revoke & Lingkup Instan (`D-20`):** Pemberian `GRANT`, pencabutan `REVOKE` (selalu menang atas default peran kustom/sistem), perubahan `user_memberships`, dan penonaktifan akun (`active = false`) langsung efektif pada `resolveAccess()` berikutnya tanpa re-login.
- [x] **Imutabilitas `audit_logs` & Isolasi `Lingkungan Uji Coba` (`10 §26`, `U-08`, `U-12`):** Repository `audit` terbukti tanpa metode `.update`/`.delete`, trigger PostgreSQL `trg_audit_logs_immutable` menolak `UPDATE` dan `DELETE`, dan tab `Lingkungan Uji Coba` terisolasi hanya untuk `PLATFORM_ADMIN` saat `NODE_ENV !== "production"`.

---

## 7. Verifikasi Akhir Fase 10 — Parity Audit, Hardening & Production Cutover Readiness
- [x] **Contextual Dashboard (`UI-3`) Live via Domain Public APIs:** `buildContextualDashboardViewModel()` (`src/features/organization/services/dashboard-overview-service.ts`) merakit orientasi peran (`TEACHER`, `UNIT_COORDINATOR`, `APPROVER`, `REVIEWER`, `EDITOR`, `AUDITOR`, `PLATFORM_ADMIN`), strip ringkasan operasional tanpa KPI card/chart, antrean `Perlu perhatian` berfilter RBAC + SoD, `Jadwal belajar` Sabtu `15.00–17.15 WIB`, serta `Aktivitas terbaru` yang aman privasi (`dashboard.integration.test.ts`).
- [x] **Domain Architecture Audit (`11 §40, §42`):** Terverifikasi otomatis melalui `parity-hardening-audit.test.ts` bahwa seluruh 13 folder feature (`identity`..`public`) memiliki `index.ts` Public API, **0** impor repository/query lintas domain, dan **0** repository memanggil repository.
- [x] **Terminology Sweep Final (`10 §24, §29`):** Terverifikasi otomatis bahwa seluruh file UI di `apps/web/src/` bebas dari istilah terlarang (`No Data Found`, `Join now`, `Enroll immediately`, `Media Consent Verified`, `Daftar Siswa Baru`, `Siswa Terdaftar`, `Tenaga Guru Relawan`, `Rombel Aktif`, `Kelas Rombel`).
- [x] **Production Bootstrap Admin Only (`D-26`, `D-30`, Task #13):** `src/db/seed/prod-bootstrap-admin.ts` (`npm run db:bootstrap-prod`) hanya menginisialisasi 11 system roles, 64 permissions, struktur organisasi Sinodal/Mupel Jatim/Unit Griya Asih, dan 1 akun `PLATFORM_ADMIN` awal via Supabase Admin API tanpa data sampel/demo.
- [x] **Operational Telemetry & Performance Budgets (`09 §39–40`, `06 §27`):** `src/server/monitoring/operational-telemetry.ts` memantau budget latensi (`< 500ms` normal, `< 2000ms` heavy), `PERMISSION_DENIED`, `POLICY_DENIED`, `VALIDATION_FAILURE`, dan `SYNC_PROCESSED`/`SYNC_FAILURE`.
- [x] **Error & Loading Boundaries (`10 §14`, `08`):** `src/app/error.tsx`, `src/app/(workspace)/workspace/error.tsx`, dan `src/app/(workspace)/workspace/loading.tsx` menyajikan skeleton struktural dan pesan pemulihan manusiawi tanpa membocorkan stack trace/SQL ke UI.




