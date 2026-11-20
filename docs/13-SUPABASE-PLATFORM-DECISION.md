13-SUPABASE-PLATFORM-DECISION.md

PMKI Platform Decision Record (ADR)
Supabase as Platform · Vercel as Runtime
Version: 1.0
Status: APPROVED by Product Owner
Date: 20 November 2026
Authority: Platform & Infrastructure (mengalahkan 02 dan PRODUCTION-ARCHITECTURE
           HANYA untuk butir yang disebut di §4)

---

# 1. Context

Aplikasi existing adalah prototype Vite + Express + PostgreSQL 16 dengan
StorageManager (localStorage + snapshot /api/state). Migrasi menargetkan
Next.js App Router + Drizzle + PWA sesuai docs 02–11.

Product Owner memutuskan memakai Supabase sebagai **database dan backend
platform**, dengan hosting aplikasi di Vercel dan Supabase Cloud region
Singapore. Keputusan ini diambil sebelum Fase 1 agar development menjadi
replika struktural production, bukan environment yang harus dimigrasi ulang
di akhir.

# 2. Decision

1. Supabase digunakan untuk: **PostgreSQL, Auth (identitas), Storage (media)**.
2. Development memakai **Supabase CLI lokal** (`supabase start`) sehingga
   stack identik dengan Cloud.
3. Aplikasi di-deploy ke **Vercel**, region fungsi **sin1**.
4. Supabase Cloud project region **ap-southeast-1 (Singapore)**.
5. **Drizzle ORM tetap satu-satunya jalur data aplikasi** dan satu-satunya
   engine migrasi.
6. **Otorisasi tetap milik aplikasi** sesuai 05 (Permission + Scope + Policy).
   Supabase Auth hanya menyediakan identitas.
7. Kontrak session **05 §20 tidak berubah**.
8. RLS = lapis kedua, deny-by-default. Bukan pengganti RBAC.

# 3. Rationale

- Paritas dev↔prod menghilangkan "moment migrasi auth/storage" di akhir.
- Auth bawaan memberi email confirmation, reset password, dan (future)
  magic link/OAuth tanpa membangun sendiri.
- Storage private + signed URL menegakkan aturan consent & media review
  di lapisan penyimpanan, bukan hanya UI.
- Vercel + Managed Postgres meminimalkan beban operasional untuk tim kecil.

# 4. Superseded Clauses (EKSPLISIT)

| Dokumen | Klausa lama | Digantikan oleh |
|---|---|---|
| 02 §5 | Authentication: Auth.js | Supabase Auth (identitas) |
| 02 §11 | "Auth.js satu-satunya sumber otoritas identitas"; SessionUser single-role | Supabase Auth + session 05 §20 (multi-role) |
| 02 §14 | Supabase = tooling dev; `AUTH_SECRET`, `AUTH_URL` | Supabase = platform; env di §6 ADR ini |
| 02 §5, §14 | Supabase self-hosted development | Supabase Cloud (prod) + CLI (dev) |
| 05 §23 | DoD "Auth.js Integration" | DoD "Session contract 05 §20 + Supabase Auth adapter" |
| 08 §10, §39 | Session berasal dari Auth.js | Session berasal dari Supabase Auth + resolveAccess() |
| 09 §18 | User berasal dari Auth.js | User berasal dari Supabase `getUser()` |
| PROD-ARCH | Auth.js; `NEXTAUTH_*`; `next-pwa` wajib; Next.js 17+ | Supabase Auth; env §6; PWA lib dievaluasi (D-08); versi stabil terbaru |
| 04 §7 | `users.password_hash`, `users.role` | Dihapus. Identitas di auth.users; role di user_roles (05) |
| 04 §4 | Semua PK UUID v7 | Entitas domain UUID v7; `users.id` = auth UID (v4) |

TIDAK BERUBAH (non-negotiable, ADR ini tidak menyentuh):
03 Design Identity · UI-UX Design System · 10 Content/Microcopy ·
11 Domain boundaries · 05 Permission/Scope/Policy/SoD ·
06 Offline tiers & sync honesty · 07 Component layers ·
08 Server-First & no duplicate source of truth · 09 Action-first & error contract.

# 5. Architecture Invariants

- Read:  DB → Repository → Service → Server Component → UI
- Write: UI → Server Action → Zod → Auth → Permission → Scope → Policy
         → Service → Repository → DB → revalidatePath
- Identitas: `supabase.auth.getUser()` di server. **`getSession()` dilarang**
  untuk keputusan akses.
- Permission di-resolve **per-request dari DB** (role → grant → revoke),
  bukan dari klaim JWT. Alasan: 05 §10 menjanjikan override efektif tanpa
  deploy; klaim JWT basi sampai refresh.
- Aplikasi connect sebagai pemilik tabel via Drizzle → RLS tidak diterapkan
  ke owner (tanpa FORCE). Ini disengaja: server menegakkan 05, RLS menahan
  jalur Data API publik.
- `service_role`/secret key mem-bypass RLS tetapi **tidak** mem-bypass trigger
  → audit append-only tetap berlaku.

# 6. Environment Contract

| Variabel | Dev (CLI) | Vercel Production | Eksposur |
|---|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | http://127.0.0.1:54321 | https://<ref>.supabase.co | public |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | key lokal | publishable/anon key | public |
| SUPABASE_SERVICE_ROLE_KEY | key lokal | secret/service key | **server only** |
| DATABASE_URL | postgres://postgres:postgres@127.0.0.1:54322/postgres | pooler **6543** (transaction) | server |
| DIRECT_URL | sama | pooler **5432** (session) | server, migrasi |
| NEXT_PUBLIC_APP_URL | http://127.0.0.1:3000 | https://<domain> | public |

Aturan: key istimewa tidak pernah berprefix `NEXT_PUBLIC_`.
`DATABASE_URL` runtime wajib `prepare: false` (transaction pooler tidak
mendukung prepared statements). Migrasi memakai `DIRECT_URL` karena direct
host Supabase default IPv6-only sedangkan Vercel IPv4.

# 7. Consequences

Positif: deploy = ganti env + jalankan migrasi yang sudah terbukti di lokal;
auth/storage tidak perlu dibangun; paritas tinggi.

Negatif / diterima: ketergantungan vendor; data anak berada di Singapura
(perlu kepatuhan UU PDP + PITR); batas body serverless Vercel memaksa pola
signed upload URL; tidak ada worker server常驻 sehingga sync digerakkan klien.

# 8. Guardrails untuk AI Agent

DILARANG:
- mengembalikan Auth.js / NextAuth atau menambah `AUTH_SECRET`
- memasang supabase-js untuk membaca data operasional dari client
- menaruh business logic di Edge Functions / stored procedure
  (kecuali trigger integritas)
- menjadikan RLS pengganti permission/scope/policy
- memakai `getSession()` untuk otorisasi
- menjalankan seed di production
- mengubah schema production lewat Studio
- memakai dua engine migrasi (Drizzle Kit + supabase db push)

# 9. Open Items

D-08 library PWA/service worker · D-07 test runner ·
kebijakan SoD media (wajib/ideal) · retention & PITR ·
keputusan residency jangka panjang (self-host tetap terbuka tanpa ubah kode).