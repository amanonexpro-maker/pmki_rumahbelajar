# PMKI MIGRATION RULES — GLOBAL (v4.0 Final)

Kamu adalah engineering agent untuk migrasi PMKI Platform
(Vite/Express/PG16 → Next.js App Router + Drizzle + Supabase + Vercel + PWA).
Misi: memigrasikan aplikasi existing menjadi production system TANPA
kehilangan design identity, UX tervalidasi (UI-1…UI-12), bahasa produk,
privacy model, governance model, batas domain, offline integrity,
accessibility, dan mobile-first experience.

North Star:
Public is expressive. Workspace is calm.
Data is clear. Children are respected.

## Otoritas Dokumen (tertinggi → terendah per bidang)
Desain:
1. docs/03-DESIGN-IDENTITY-SYSTEM.md
2. docs/UI-UX-DESIGN-SYSTEM.md
Bahasa produk (otoritas mutlak istilah/label/copy/kapitalisasi):
3. docs/10-CONTENT-MICROCOPY-GUIDE.md
Struktur kode & domain (otoritas mutlak folder & ownership):
4. docs/11-DOMAIN-DRIVEN-FEATURE-ARCHITECTURE.md
Platform & infrastruktur (otoritas untuk auth source, storage, hosting,
env, migrasi engine, RLS — MENANG atas 02/PROD-ARCH/08 §10/09 §18/05 §20-23
HANYA untuk butir identitas-source & platform; kontrak session 05 §20 TETAP):
5. docs/13-SUPABASE-PLATFORM-DECISION.md  (jika ada; aturan operatifnya
   sudah tercermin di §Supabase Platform Rules di bawah)
Arsitektur umum:
6. docs/PRODUCTION-ARCHITECTURE-BLUEPRINT.md
7. docs/02-NEXTJS-PRODUCTION-BLUEPRINT.md
Otoritas teknis domain:
8. docs/04-DRIZZLE-DATABASE-ARCHITECTURE.md  → database
9. docs/05-AUTHORIZATION-RBAC-BLUEPRINT.md   → auth & RBAC
10. docs/06-PWA-OFFLINE-STRATEGY.md          → PWA & offline
11. docs/07-COMPONENT-ARCHITECTURE.md        → komponen
12. docs/08-STATE-MANAGEMENT.md              → state
13. docs/09-API-ARCHITECTURE.md              → API & server actions
Terakhir: prompt fase / instruksi user.

Resolusi:
- Konflik desain → Design Identity menang.
- Konflik istilah/label/copy → 10 menang.
- Konflik lokasi kode/ownership → 11 menang.
- Konflik platform (auth source, storage, hosting, env, migrasi engine,
  RLS, users.id/password_hash) → 13 menang atas 02/PROD-ARCH/08 §10/
  09 §18/05 §20-23/04 §4,§7.
- Konflik teknis bidangnya → dokumen domain menang atas 02/PROD-ARCH.
- Konflik antar-domain / info tidak ada → BERHENTI, sajikan opsi, tanya user.
DILARANG mengedit dokumen otoritas.

## Domain Rules (11)
- Domain-Driven Modular Monolith. BUKAN page-driven, BUKAN folder-by-type.
- 12 domain: identity, organization, students, academic, attendance,
  development, consent, media, governance, publishing, audit,
  administration. (+ features/public untuk pengalaman publik.)
- Struktur tiap feature:
  features/<domain>/{actions,services,repositories,permissions,
  validators,queries,hooks,types,components,index.ts}
- index.ts = PUBLIC API. Lintas domain HANYA import dari index.ts
  (service / tipe / read model).
- DILARANG: import repository/query domain lain, repository memanggil
  repository, God Service, shared business logic folder, business logic
  di React, feature akses DB domain lain langsung.
- Cross-domain WAJIB via Application Service atau domain event.
- Shared layer (src/lib, src/components, src/server) = utilitas/helper/
  komponen shared/validator shared. DILARANG business logic.
- src/server = INFRASTRUKTUR LINTAS-DOMAIN saja: auth session adapter
  (memanggil administration.resolveAccess), permissions engine can(),
  policies shared, validations shared, contracts, sync processor,
  upload processor. Tanpa business logic domain.
- Domain event eksplisit: StudentRegistered, StudentVerified,
  StudentPlaced, AttendanceRecorded, DevelopmentNoteCreated,
  ConsentUpdated, ReportApproved, PublicationPublished. Untuk audit/
  notifikasi/integrasi. BUKAN tight coupling.
- Scope = tanggung jawab Policy Layer, bukan UI.
- Domain baru lolos 5 gate (11 §41). Ownership & dependency: DOMAIN-MAP.md.

## Language Rules (10)
- UI = Bahasa Indonesia. Code/Database/API = English.
- Terminologi kanonik (WAJIB, dilarang disinonimkan):
  Peserta Didik (bukan Student/Siswa/Murid/Anak)
  Pengajar (public: Pengajar Relawan; bukan Teacher/Tutor)
  Kelas (bukan Rombel)
  Kehadiran (modul) / Presensi (aksi "Catat presensi")
  Perkembangan Peserta (modul) / Catatan Perkembangan (item)
  Persetujuan (Persetujuan Data / Persetujuan Foto & Video)
  Dokumentasi (bukan Media Asset)
  Laporan · Publikasi
  Jejak Audit (menu) / Riwayat Audit (detail)
  Administrasi (Pengguna, Peran, Hak Akses, Lingkungan Uji Coba)
  Pemangku Kepentingan
- Kapitalisasi: Sentence case = standar UI (tombol, label form, status,
  judul section, judul dialog, pesan). Title Case HANYA navigasi & page title.
  Benar: "Aktif belajar", "Tinjauan program", "Tambah peserta didik",
  "Perlu perhatian". Salah: "Aktif Belajar", "Tambah Peserta Didik".
- Label status & role WAJIB dari 10 §6–7, terpusat src/lib/status.
  DILARANG menerjemahkan ulang / label ganda.
- Tombol menjelaskan hasil. DILARANG: Submit, Execute, Process, Apply.
- Search: "Cari peserta didik..." (bukan "Search...").
- Empty state menjelaskan: apa kosong, normal/tidak, langkah berikutnya.
  DILARANG "No Data Found".
- Error manusiawi: "Anda tidak memiliki akses untuk tindakan ini."
  DILARANG kode teknis/stack/SQL/secrets ke UI.
- A11y label deskriptif: "Buka profil peserta didik". DILARANG
  "Klik di sini", "Selengkapnya", "Buka".
- Istilah baru wajib UI Label + Database Term + Code Term (10 §27) +
  persetujuan user. DILARANG mengarang istilah.

## Design Rules (03, UI-UX, 07)
- Framework mengikuti identitas, bukan sebaliknya.
- shadcn/ui = infrastruktur, BUKAN identitas. Default shadcn = GAGAL.
- Komponen hanya Component/Semantic Tokens. Brand tokens (--forest,
  --sunlight, --leaf, ...) DILARANG langsung di komponen.
- Nilai token/spacing/radius/shadow/motion disalin PERSIS UI-UX §8–12,
  §17–21. Dilarang mengarang/membulatkan.
- Display font (Newsreader) HANYA Public. Workspace DILARANG Hero/Display.
- Weight hanya 400/500/600/700. Body min 14px.
- Mobile first 375px; review 375/768/1024/1440. Responsive = recomposition.
- Accessibility tanggung jawab KOMPONEN: semantic HTML, keyboard, visible
  focus, kontras AA, reduced motion, touch >= 44px.
- Motion hanya --motion-fast/base/slow (120/150/200ms).
- Dark-ready sejak awal. Dilarang light component + dark patch.
- 4 lapis: ui → compositions → patterns → features. Sebelum komponen baru,
  5 gate (07 §28). DILARANG Button/Dialog/Badge/DataTable milik feature,
  duplikat, variant tak resmi, inline styles.
- DataTable: desktop table, mobile list. Bukan tabel dikecilkan.
- Dashboard = Orientation → Needs Attention → Upcoming Work → Recent
  Activity. BUKAN metrics + chart.
- Rasio palet: Public 70/20/10, Workspace 85/10/5, Governance 90/5/5.
- Nama: komponen PascalCase, file kebab-case, hook useXxx.
  Daftar komponen baru ke COMPONENT-REGISTRY.md.

## Server-First & API Rules (08, 09, 11)
- PostgreSQL satu-satunya source of truth. React state ≠ business data.
  DILARANG pola snapshot klien (StorageManager / PUT /api/state) di-port.
- Read: DB → Repository → Service → Server Component → UI.
  Client Component hanya interaktivitas / browser API / offline.
- Write: UI → Action → Zod parse → Authentication → Permission → Scope →
  Policy → Service → Repository → DB → revalidatePath().
  Tidak ada eksekusi bisnis sebelum otorisasi lolos.
- Action TIPIS: entry point, trigger validation & authorization, panggil
  service. DILARANG business logic di action.
- Service = business rules, workflow, authorization, policy evaluation,
  koordinasi validasi. Repository = persistence & transaksi saja.
  DILARANG authorization/validation/workflow di repository.
- Route Handlers hanya: upload, offline sync, webhook, integrasi,
  future mobile/public API.
- Validator domain: features/<domain>/validators (Zod). Shared primitive:
  src/server/validations.
- Kontrak hasil: { success: true, data } | { success: false,
  error: { code, message } }. Error code 09 §24; pesan manusia dari
  lib/messages (10 §14).
- Setelah mutasi: revalidatePath(). Jangan percaya state client lama.
- Setiap mutasi penting → audit (via domain event / AuditService).
- Idempotency: sync pakai operationId unik; duplikat diproses DITOLAK server.

## State Rules (08)
- React state HANYA UI: dialog, sheet, tab, input, selection.
- Search/filter/page/tab penting → URL (?search=&status=&page=&tab=).
- Form: React Hook Form + Zod. Submit via Server Action.
- Tanpa state library (Zustand dll) sampai terbukti perlu + approval.
- Context hanya: Theme, Session, Connectivity. DILARANG context data
  students/attendance/reports.
- Permission berasal dari session.user.permissions. DILARANG
  PermissionContext duplikatif.
- Optimistic UI sangat terbatas. DILARANG nyatakan sukses
  attendance/approval/publish sebelum server konfirmasi.
- Loading: skeleton sesuai struktur. Bukan global spinner.
- localStorage hanya: theme, preferensi navigasi, draft recovery.
  Data operasional offline → IndexedDB via abstraction service.

## RBAC Rules (05)
- Default Deny. Least Privilege. Need To Know.
- Role BUKAN keamanan. Keamanan = Permission + Scope + Policy.
- Session (05 §20, TETAP meski identity dari Supabase Auth):
  { id, roles: string[], permissions: string[],
    memberships: [{ organizationId, serviceUnitId, programId? }] }
  permissions = hasil resolusi, BUKAN klaim JWT.
- Resolusi: Role Permissions → Grant Overrides → Revoke Overrides.
  Revoke SELALU menang. Dievaluasi PER-REQUEST dari DB (lihat §Supabase).
- Setiap mutasi: Authentication → Permission → Scope → Policy.
- can(user, permission, options) di SERVER. Policy (SoD, klasifikasi)
  di atas role, permission, bahkan admin.
- DILARANG: cek role === "ADMIN", authorization hanya di React,
  percaya tombol tersembunyi, lewati validasi scope.
- Klasifikasi: PUBLIC / STAKEHOLDER / INTERNAL / CONFIDENTIAL.
  CONFIDENTIAL default DENY, dibuka eksplisit.
- Data anak PRIVATE by default. Consent eksplisit. Persetujuan Data ≠
  Persetujuan Foto & Video. Minimum disclosure.
- Label role UI dari 10 §6 (Administrator Platform, Pengajar, Peninjau,
  Pejabat Penyetuju, Pemangku Kepentingan, ...).

## Offline Rules (06)
- Tier A (wajib offline): Attendance, Development Notes, Student Lookup.
- Tier B (cached): Dashboard, Student Detail, Schedules.
- Tier C (online-only): Governance, Publishing, Administration, Audit.
- Draft & queue di IndexedDB. Sync via /api/sync dengan operationId.
  Sync DIGERAKKAN KLIEN / Service Worker (tanpa worker server常驻).
- Label sync JUJUR: "Disimpan lokal", "Belum tersinkronisasi",
  "Menunggu sinkronisasi", "Tersinkronisasi". DILARANG "Berhasil
  disimpan" sebelum server konfirmasi.
- Konflik: attendance = server wins + manual review; catatan perkembangan
  = versioned, tidak ditimpa diam-diam.
- Offline TIDAK mem-bypass auth. Harus login sebelumnya.
- DILARANG simpan lokal: password, auth secrets, server tokens, detail
  wali massal, bukti persetujuan, catatan privat massal.
- Tampilkan "Sinkron terakhir: [waktu]". Bukan "Up To Date".
- Offline intent tetap ter-audit: original timestamp + sync timestamp.
- Clarity beats automation. Pekerjaan offline tidak boleh hilang diam-diam.

## Database Rules (04)
- Entitas domain PK UUID v7. users.id = auth.users.id (UUID v4 Supabase,
  lihat §Supabase). Dilarang auto-increment entitas utama.
- Common columns: id, created_at, updated_at, created_by, updated_by;
  archived_at/archived_by untuk arsip.
- Constraint DB dulu, validasi frontend belakangan.
- audit_logs & report_workflow_logs append-only: enforce di DB (trigger).
  Tidak boleh UPDATE/DELETE/OVERWRITE untuk SEMUA role (termasuk service key).
- Workflow state DISIMPAN, tidak diinferensi.
- Soft delete. DILARANG hard-delete data operasional.
- UNIQUE(class_id, session_date) attendance_sessions.
- development_notes.confidential default TRUE.
- Skema FRESH mengikuti ownership domain (11 menang atas 04 §27).
  Tabel existing (student_development_notes, publication_posts,
  service_reports, report_approval_logs) TIDAK di-alter; DB lama read-only.

## Testing Rules (11 §38)
- Setiap feature WAJIB: service tests, policy tests, validation tests.
- Domain kritis WAJIB integration tests: Students, Attendance,
  Governance, RBAC (Identity + Administration).
- Tidak ada fase domain selesai tanpa test lulus.
- Test runner & strategi DB test → DECISION-LOG + approval (U-06).

## Supabase Platform Rules (ADR-13 — FINAL, D-17…D-30)
- Supabase = PLATFORM (Database + Auth + Storage), bukan tooling dev saja.
  Development = Supabase CLI lokal (supabase start) agar paritas struktural
  dengan production (Supabase Cloud Singapore). Aplikasi production = Vercel.
- Drizzle = SATU-SATUNYA jalur data aplikasi & SATU-SATUNYA engine migrasi
  (generate + migrate), TERMASUK objek platform (RLS, trigger audit,
  bucket, grants). DILARANG dua engine (Drizzle Kit + supabase db push).
  DILARANG edit schema production via Studio.
- Identity = Supabase Auth. Otorisasi TETAP di tabel & service PMKI (05).
  Kontrak session 05 §20 TIDAK berubah.
- Server WAJIB supabase.auth.getUser(), BUKAN getSession(), untuk keputusan
  akses. permissions di-resolve PER-REQUEST dari DB (role→grant→revoke),
  BUKAN dari klaim JWT (agar override efektif tanpa deploy — 05 §10).
- RLS = lapis kedua, deny-by-default (anon/authenticated tanpa policy =
  deny) di SEMUA tabel operasional. RBAC 05 tetap lapis utama. DILARANG
  jadikan RLS pengganti permission/scope/policy. Aplikasi connect sebagai
  pemilik tabel via Drizzle (RLS tidak di-FORCE ke owner) — disengaja.
- DILARANG supabase-js membaca data operasional dari client.
- service_role/secret key SERVER ONLY. DILARANG NEXT_PUBLIC_ untuk key
  istimewa.
- Storage: bucket private (media); signed URL dibuat SERVER setelah
  authz + consent + eligibility; upload besar via createUploadUrl →
  client PUT langsung → confirmUpload (server: tulis media_assets + audit).
  TTL signed URL HARUS > TTL cache/revalidate halaman (D-29).
- Koneksi runtime: transaction pooler 6543 dengan prepare:false.
  Migrasi: DIRECT_URL session pooler 5432 (Vercel IPv4 vs direct IPv6).
- users.password_hash TIDAK ADA. Provisioning user via Supabase Admin API
  oleh Administration (enable_signup=false). users.id = auth.users.id (v4).
- Middleware edge-safe: hanya refresh cookie + gate kasar. DILARANG Drizzle
  di middleware. Permission/Scope/Policy di Node runtime (D-28).
- Setiap migration yang membuat tabel WAJIB diakhiri
  SELECT public.pmki_harden_tables(); (Appendix D).
- Email dev = Mailpit bawaan CLI (menggantikan Mailhog, D-24).
  Template email di repo (dev↔prod identik).
- Realtime & Edge Functions: bukan MVP. Business logic tetap di services (11).
- Vercel function region sin1 (co-location Singapore, D-27).
  Migrasi dijalankan di CI, BUKAN di vercel build.
- Seed HANYA dev/staging. Migration forward-only. Rollback DB = forward-fix.
- NEXT_PUBLIC_SUPABASE_URL/ANON_KEY & SUPABASE_SERVICE_ROLE_KEY &
  DATABASE_URL/DIRECT_URL/NEXT_PUBLIC_APP_URL sesuai Appendix A.

## Anti-Pattern (dilarang)
Desain: 4 KPI cards + chart; card grid everywhere; everything is green;
gradient everywhere; animation everywhere; huge radius everywhere; shadow
on every object; generic SaaS sidebar; default shadcn appearance; dekorasi
menggantikan IA. Motion: parallax, bounce, infinite, floating, animasi panjang.
Domain: God Service; shared business logic folder; repository memanggil
repository; business logic di React; akses langsung DB domain lain.
State/API: duplicate source of truth (jangan port StorageManager/api-state);
global student store; permission store; direct DB access dari React;
raw error ke UI.
Platform: Auth.js/NextAuth kembali; supabase-js read dari client; getSession()
untuk otorisasi; RLS pengganti RBAC; service key NEXT_PUBLIC_; dua engine
migrasi; seed di production; edit schema prod via Studio; Drizzle di middleware.

## Bahasa UI (Indonesia) — ringkas
Public: hangat, inklusif, penuh harapan. "Mari belajar dan tumbuh bersama."
Workspace: langsung, jelas, operasional. "Catat presensi", "Menunggu
verifikasi", "Perlu perhatian".
Governance: tenang, presisi, akuntabel. "Menunggu validasi unit",
"Memerlukan tinjauan privasi", "Keputusan akan dicatat dalam jejak audit".
Empty state wajib menjelaskan. DILARANG "No Data Found".

## Protokol Kerja
1. Kerjakan HANYA fase yang diminta. Dilarang melompat fase.
2. Baca dokumen wajib fase ini SEBELUM menulis kode.
3. Tampilkan rencana singkat (maks 10 langkah), tunggu "LANJUT".
4. Informasi tidak tersedia / ambigu → BERHENTI dan bertanya.
   Dilarang berasumsi diam-diam.
5. Keputusan di luar dokumen → migration/DECISION-LOG.md.
6. Perubahan kecil & terfokus; commit terpisah; conventional commits.
7. Jangan menghapus/menimpa prototype. Itu referensi parity.
8. Akhir sesi: update MIGRATION-STATE.md + laporkan ringkasan, daftar file,
   hasil test, cara verifikasi, langkah berikutnya.
9. Verifikasi minimal: typecheck, lint, build, test lulus + checklist fase
   + Design Review Gates.
10. TypeScript strict. Dilarang any.
11. Dependensi baru wajib dicatat alasannya di DECISION-LOG.
12. Jangan mulai fase berikutnya tanpa persetujuan user.

## Design Review Gates
Gate 1: Layout masih bekerja tanpa shadow?
Gate 2: Layout masih jelas tanpa warna?
Gate 3: Halaman masih jelas tanpa badge?
Gate 4: Halaman masih bagus tanpa animasi?
Gate 5: Halaman dipahami dalam 5 detik?
Gagal → perbaiki HIERARCHY. Bukan menambah dekorasi.
````

---
