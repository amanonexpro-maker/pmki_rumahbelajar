# CUTOVER-RUNBOOK — Panduan Eksekusi Deployment & Production Cutover PMKI Platform

**Status:** **`PRODUCTION READY — SIGN-OFF FINAL PRODUCT OWNER DITERIMA (2026-11-20)`**  
**Referensi Otoritas:** `AGENTS.md` (ADR-13 `D-17…D-30`, Appendix A–E), `migration/MIGRATION-PLAN.md`, `migration/PLATFORM-VERIFY.md`  
**Target Arsitektur:** Next.js `16.4.6` App Router (`apps/web/`) + Drizzle ORM + Supabase Cloud (`ap-southeast-1` Singapore) + Vercel (`sin1` Singapore) + PWA

---

## 1. Prasyarat Sebelum Cutover (Pre-Flight Checklist)

1. **Quality Gates Lulus 100% di `apps/web/`:**
   - `npm run typecheck` → **0 error** (`strict: true`, tanpa `any`)
   - `npm run lint` → **0 error, 0 warning**
   - `npm test` → **30/30 test files PASS (110/110 tests lulus)**
   - `npm run build` → **PASS** (seluruh 24 rute App Router terbangun bersih)
   - `PARITY-CHECKLIST.md` → **12/12 (`UI-1 … UI-12`) `TERVERIFIKASI`**
2. **Baseline Data:**
   - Sesuai `GAP-ANALYSIS.md` & `MIGRATION-PLAN.md §2`, database PG16 lama (`5433`) hanya berisi data simulasi/seed prototipe (**tidak ada data produksi nyata**).
   - Cutover menggunakan strategi **Fresh Schema PG17 + Production Admin Bootstrap** (tanpa port data mock).

---

## 2. Konfigurasi Supabase Cloud Production (`ap-southeast-1` Singapore)

1. Buat project baru di **Supabase Cloud** pada region **`ap-southeast-1` (Singapore)**.
2. Aktifkan **Point-in-Time Recovery (PITR) / Automated Daily Backups** pada pengaturan Database.
3. Pada **Authentication → Providers → Email**:
   - Matikan **Allow new users to sign up** (`enable_signup = false`, `D-26`).
   - Set **Minimum password length** = `8`.
   - Salin isi template HTML dari `apps/web/supabase/templates/confirmation.html` dan `recovery.html` ke bagian **Email Templates** Supabase Cloud agar identik dengan Mailpit dev (`D-24`).
4. Catat kredensial koneksi dari Supabase Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` (`https://<project-ref>.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Anon/publishable key)
   - `SUPABASE_SERVICE_ROLE_KEY` (**SERVER ONLY** — dilarang keras diberi prefix `NEXT_PUBLIC_`)
   - `DATABASE_URL` (Transaction Pooler port **`6543`**, `?pgbouncer=true`, digunakan runtime aplikasi dengan `prepare: false`, `D-25`)
   - `DIRECT_URL` (Session Pooler port **`5432`**, digunakan eksklusif oleh Drizzle Kit migrasi CI, `D-25`)

---

## 3. Eksekusi Migrasi Skema & Bootstrap Admin Pertama (Via CI / Terminal Admin)

> **PENTING (`D-18`, `D-27`, `D-30`):** Migrasi database dijalankan di pipeline CI/CD sebelum deployment Vercel (BUKAN di dalam `vercel build`). Dilarang menjalankan `supabase db push`, dilarang mengedit skema via Supabase Studio, dan dilarang menjalankan `dev-seed.ts` di production.

```bash
cd apps/web

# 1. Jalankan migrasi Drizzle terhadap DIRECT_URL (port 5432)
#    Menerapkan 0000_pmki_initial_schema.sql & 0001_pmki_platform_hardening.sql
#    (termasuk public.pmki_harden_tables(), RLS deny-all, trigger append-only, & bucket private "media")
npm run db:migrate

# 2. Jalankan bootstrap khusus production (HANYA roles, permissions, organisasi,
#    unit Rumah Belajar Griya Asih Lawang, dan 1 akun PLATFORM_ADMIN via Admin API)
BOOTSTRAP_ADMIN_EMAIL="admin@pmki.org" \
BOOTSTRAP_ADMIN_PASSWORD="<PasswordKuatMinimal12Karakter>" \
BOOTSTRAP_ADMIN_NAME="Administrator Platform PMKI" \
npm run db:bootstrap-prod
```

---

## 4. Konfigurasi & Deployment Vercel Production (`sin1` Singapore)

1. Hubungkan repository ke **Vercel** dengan:
   - **Root Directory:** `apps/web`
   - **Function Region:** `sin1` (terkunci otomatis melalui `apps/web/vercel.json`: `"regions": ["sin1"]`, `D-27`)
   - **Build Command:** `npm run build`
2. Set **Environment Variables** (Production) di Vercel sesuai Appendix A:
   - `NEXT_PUBLIC_APP_URL` = `https://rumahbelajar.pmki.org` (atau domain produksi resmi)
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://<project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<service-role-key>` *(Encrypted / Server-Only)*
   - `DATABASE_URL` = `postgresql://postgres.<project-ref>:<pwd>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
   - `DIRECT_URL` = `postgresql://postgres.<project-ref>:<pwd>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
   - `SUPABASE_STORAGE_BUCKET` = `media`
   - `MEDIA_SIGNED_URL_TTL` = `3600`
3. Deploy ke Vercel Production.

---

## 5. Smoke Test End-to-End di Production URL

Setelah deployment selesai, jalankan daftar pemeriksaan berikut sebelum mengalihkan DNS utama:

- [ ] **Situs Publik (`/`, `/program`, `/gallery`, `/news`, `/pendaftaran`):**
  - Halaman utama termuat `< 3 detik` dengan tipografi `Newsreader`, jadwal Sabtu `15.00–17.15 WIB`, tanpa error hidrasi atau konsol.
  - Formulir `/pendaftaran` 5 langkah berfungsi dan menghasilkan nomor registrasi `RBGA-YYYY-XXXX`.
- [ ] **Autentikasi & Dynamic RBAC (`/auth/login` → `/workspace`):**
  - Login dengan akun `BOOTSTRAP_ADMIN_EMAIL` berhasil membuka **Contextual Dashboard (`UI-3`)**.
  - Di `/workspace/administration`, buat 1 akun `UNIT_COORDINATOR` (Ms. Evi) dan 1 akun `TEACHER` melalui tombol **Tambah pengguna** (Supabase Admin API).
  - Verifikasi tab `Lingkungan Uji Coba` **tidak muncul** di build production (`NODE_ENV === "production"`, `U-12`).
- [ ] **Storage Privat & Signed URL (`/workspace/media`):**
  - Unggah 1 foto dokumentasi (3-step signed upload ke bucket privat `media`).
  - Pastikan foto belum muncul di `/gallery` sebelum ditinjau oleh pengguna berbeda (SoD `uploader !== reviewer`).
- [ ] **PWA & Offline (`/manifest.webmanifest`, `sw.js`):**
  - Service Worker terdaftar aktif; halaman `/offline` dan antrean presensi IndexedDB berfungsi saat koneksi dimatikan di DevTools.

---

## 6. Pengarsipan Prototipe & Prosedur Rollback

1. **Arsip Prototipe Root (`D-16`):**
   - Setelah Product Owner memberikan *sign-off* tertulis atas hasil smoke test:
     ```bash
     git tag -a prototype-final-v1 -m "Archive validated Vite/Express prototype UI-1..UI-12 before Next.js production cutover"
     git push origin prototype-final-v1
     ```
   - Prototipe tetap tersimpan aman pada tag `prototype-final-v1`.
2. **Prosedur Rollback (Forward-Only DB — `AGENTS.md`):**
   - **Aplikasi (Vercel):** Gunakan *Instant Rollback* di dashboard Vercel ke deployment stabil sebelumnya.
   - **Database (Drizzle):** Seluruh migrasi bersifat *forward-only*. Jika diperlukan perbaikan skema pasca-deploy, buat migrasi *forward-fix* baru (`npm run db:generate` → `npm run db:migrate`) atau pulihkan state melalui **Supabase PITR**.

