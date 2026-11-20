12-NEXTJS-IMPLEMENTATION-MASTER-PROMPT.md

PMKI Next.js Implementation Master Prompt
Platform Pelayanan Terpadu PMKI
Pilot: Rumah Belajar Griya Asih Lawang
Version: 4.0 — Final Consolidated
Status: Migration Execution Protocol (Complete Authority Set + Platform Locked)
Mode: UX-Parity Migration (Existing Vite/Express App → Next.js + Supabase + Vercel)

Authority Set:
02-NEXTJS-PRODUCTION-BLUEPRINT.md
03-DESIGN-IDENTITY-SYSTEM.md
04-DRIZZLE-DATABASE-ARCHITECTURE.md
05-AUTHORIZATION-RBAC-BLUEPRINT.md
06-PWA-OFFLINE-STRATEGY.md
07-COMPONENT-ARCHITECTURE.md
08-STATE-MANAGEMENT.md
09-API-ARCHITECTURE.md
10-CONTENT-MICROCOPY-GUIDE.md
11-DOMAIN-DRIVEN-FEATURE-ARCHITECTURE.md
13-SUPABASE-PLATFORM-DECISION.md  (ADR — lihat Appendix G; aturan operatifnya
                                    sudah tercermin penuh di BLOK A §Supabase)
UI-UX-DESIGN-SYSTEM.md
PRODUCTION-ARCHITECTURE-BLUEPRINT.md

Konsolidasi (ringkas riwayat):
v1.0 basis 02/03/04/UI-UX/PROD-ARCH.
v2.0 + 05 RBAC dinamis, 06 offline, 07 komponen, 08 state, 09 API.
v3.0 + 10 bahasa, 11 domain-driven (struktur kode & ownership).
v4.0 + hasil audit aplikasi existing + keputusan platform FINAL
       (Supabase = DB+Auth+Storage, Vercel sin1, Cloud Singapore,
        Drizzle Kit satu engine migrasi, RLS lapis kedua, D-17…D-30).
       Semua patch v3.1/v3.2 sudah dilebur ke BLOK A, prompt fase,
       tabel konflik, DoD, dan lampiran. Tidak ada sisipan tersisa.

---

# 1. Purpose

Dokumen ini adalah PROMPT INDUK untuk mengeksekusi migrasi aplikasi
PMKI existing (Vite + React 19 + Express + PostgreSQL 16) menjadi
production system (Next.js App Router + Drizzle + Supabase + Vercel + PWA)
secara bertahap dan terkontrol, menggunakan AI coding agent.

Dokumen ini mengatur CARA EKSEKUSI.
Dokumen otoritas mengatur APA YANG DIBANGUN.

Rule:
Jika prompt ini bertentangan dengan dokumen otoritas, dokumen otoritas
SELALU menang. Dokumen ini tidak menciptakan aturan desain, bahasa,
domain, atau platform yang baru.

---

# 2. Cara Pakai (Execution Protocol)

1. Simpan seluruh dokumen otoritas di `docs/` pada repo.
   (Jika lokasi berbeda, sesuaikan path di BLOK A.)
2. Pasang BLOK A sebagai rules permanen agent:
   AGENTS.md / CLAUDE.md / .cursor/rules / system prompt.
3. Sesi pertama: BLOK B + PROMPT FASE 0 (formalisasi artefak — audit
   naratif sudah selesai, lihat §3 Baseline).
4. Review Fase 0 → setujui MIGRATION-PLAN.md + approve daftar USULAN §11.
5. Setiap fase berikutnya: sesi baru → PROMPT FASE [N] → eksekusi
   → BLOK C (review) → tutup temuan → commit → update state.
6. Sesi terputus / konteks penuh → BLOK D.
   Fase besar (1, 2, 4, 5, 8) boleh dipecah sub-sesi.
7. Lampiran A–G adalah referensi material (env, config, kode, SQL,
   runbook, ADR). Agent membacanya saat fase terkait butuh, bukan
   sebagai aturan tambahan di atas BLOK A.
8. Migrasi selesai hanya setelah FASE 10 di-sign-off user.

Rules:
- Satu fase = satu tujuan. DILARANG mencampur fase.
- DILARANG lanjut sebelum gate fase lulus.
- User pemegang keputusan. Agent pelaksana.

Alur sesi:

BACA DOKUMEN
      ↓
RENCANA (tunggu "LANJUT")
      ↓
EKSEKUSI (scope fase saja)
      ↓
VERIFIKASI + BLOK C
      ↓
COMMIT + UPDATE STATE
      ↓
USER APPROVAL → fase berikutnya

---

# 3. Model Migrasi & Baseline Existing

Aplikasi existing = VALIDATED UX REFERENCE (UI-1…UI-12), bukan kode buang.

Prinsip:
- UX, workflow, privacy behavior, RBAC behavior tervalidasi dipertahankan
  (UX PARITY).
- Prototype tidak dihapus sampai cutover disetujui.
- Perubahan UX memerlukan persetujuan user + DECISION-LOG.
- PENYIMPANGAN YANG DIWAJIBKAN DOKUMEN (bukan deviasi liar):
  terminologi & kapitalisasi mengikuti 10, meskipun prototype memakai
  istilah lama. Dicatat di TERMINOLOGY-CHECKLIST, bukan PARITY deviasi.

Strategi (dikonfirmasi Fase 0): scaffold Next.js paralel di subdirektori
(usulan `apps/web/`), prototype di root tetap utuh & runnable sampai cutover.

## 3.1 Baseline Aplikasi Existing (hasil audit — fakta terkunci)

Stack:
- Frontend: React 19 SPA + Vite 8.3 (port 3000, proxy /api → 3001),
  TypeScript strict (`tsc --noEmit`), Tailwind CSS v4 (token semantik
  mandiri `--surface/--primary/--border/--text-*`), Lucide React,
  13 primitives di `src/components/ui/`, util `cn` (clsx + tailwind-merge).
- Backend: Node + Express 4.21 (`server/index.ts`, `tsx watch`, 127.0.0.1:3001).
- DB: pg (node-postgres 8.23) pool → PostgreSQL 16 Alpine (Docker,
  container `pmki_terpadu_postgres`, host port 5433, db `pmki_terpadu`).
- Run dev: `docker compose up -d` → `npm run api:dev` → `npm run dev`.
  Quality: `npm run lint`, `npm run build`.

Penyimpanan data (DUAL-LAYER — inti yang harus dihapus):
- Klien: singleton `StorageManager` (`src/services/storage.ts`) —
  in-memory + localStorage keys `pmki_students`, `pmki_consents`,
  `pmki_attendance`, `pmki_notes`, `pmki_publications`, `pmki_reports`,
  `pmki_audits`, `pmki_current_user`.
- Server: setiap mutasi klien → `storage.persist()` → `PUT /api/state`
  (snapshot) → transaksi PostgreSQL. Boot: `GET /api/state`.
- DB: 25 tabel dari `migrations/001_relational_schema.sql` +
  `002_development_note_teacher_refs.sql`. Tabel utama: organizations,
  service_units, users, academic_years, classes, subjects, teachers,
  students, guardians, consents, attendance_sessions, attendance_records,
  student_development_notes, publication_posts, service_reports,
  report_approval_logs, audit_logs.

Status data produksi: TIDAK ADA. Semua mock/seed
(`src/db/seed-data.ts`): 5 user demo (Platform Admin, Koordinator Unit
Ms. Evi, Pengurus Humas Ms. Lilian, Pengajar Pak Budi, Auditor),
8 siswa simulasi (TK–SMP 8), 2 sesi presensi sampel, 2 draf laporan.
Foto galeri = aset statis `public/images/gallery/`.
→ Konsekuensi: TIDAK ADA fase data migration. Cutover = switch + arsip.
→ DB lama (5433) jadi read-only referensi seed saja.

Peta layar (UI-1…UI-12) — teridentifikasi penuh:
- UI-1 Design Foundation: `src/styles/{tokens,themes,typography}.css`,
  `src/components/ui/*` (13 primitives).
- UI-2 App Shell: `layout/AppShell.tsx`, `Sidebar.tsx`,
  `WorkspaceHeader.tsx` (desktop persistent, mobile drawer Sheet,
  switch role RBAC instan, header konteks unit).
- UI-3 Contextual Dashboard: `dashboard/OverviewView.tsx` +
  `patterns/dashboard/*` (Greeting → Operational Metrics → Needs
  Attention → Upcoming Work → Recent Activity; bukan card/chart generik).
- UI-4 Data Workspace: `dashboard/StudentsView.tsx`, `patterns/DataTable.tsx`
  (desktop table / mobile stacked `renderMobileRow`), `SearchToolbar.tsx`.
- UI-5 Detail: `dashboard/StudentDetailView.tsx`, `OrganizationView.tsx`
  (EntityHeader, DetailTabs, disclosure wali terbatas, histori kelas).
- UI-6 Forms: `public/RegistrationForm.tsx` (wizard 5 langkah
  Peserta→Wali→Pendidikan→Persetujuan→Review), `patterns/FormSection.tsx`.
- UI-7 Education: `dashboard/AttendanceView.tsx`,
  `StudentDevelopmentView.tsx` (presensi satu tangan Hadir/Izin/Sakit/Alpa;
  observasi karakter/literasi dengan proteksi privasi).
- UI-8 Governance: `ReportsApprovalView.tsx`, `ConsentMediaView.tsx`,
  `PublishingView.tsx` (WorkflowProgress 4 tahap, DecisionHistory,
  kurasi media, SoD).
- UI-9 Admin & Audit: `AdministrationView.tsx` (inspector RBAC read-only,
  toggle aktif, reset simulasi), `AuditLogView.tsx`, `ChangeSummary.tsx`.
- UI-10 System QA: konsistensi keyboard/focus/kontras/responsive.
- UI-11 Polish: motion purposeful, tactile `active:scale-[0.985]`.
- UI-12 Public: `layout/Navbar.tsx`, `Footer.tsx`, `public/*`
  (Hero/About/Program/Schedule/Gallery/News/Contact; kurikulum 4 program,
  jadwal Sabtu 15.00–17.15 WIB RAAL Lawang, galeri terverifikasi izin,
  kontak WA pengurus).

## 3.2 Delapan Temuan Kritis (wajib masuk GAP & fase terkait)

1. `StorageManager` + `PUT /api/state` snapshot = Duplicate Source of
   Truth (melanggar 08 §3, §36; 09 §41). → INTI migrasi: pola snapshot
   dihapus total, diganti Server-First. Bukan di-port.
2. `pmki_current_user` + business data di localStorage (melanggar 08 §35;
   06 §23; 05 §22). → Session ke Supabase Auth server-side; localStorage
   hanya theme/nav/draft-recovery.
3. Role switcher instan di WorkspaceHeader = RBAC client-side (05 §22).
   → Fitur demo. Produksi: keluar dari workspace; usulan area
   "Lingkungan Uji Coba" (istilah resmi 10 §26), dev-only, gated
   PLATFORM_ADMIN. (USULAN U-08)
4. SPA client-routing, filter/search tidak di URL (08 §12–14).
   → Rebuild dengan URL state; parity perilaku filter tetap, mekanisme berubah.
5. Schema drift + PG16 + tanpa tabel RBAC dinamis (04 §7–23; 05 §19).
   Nama existing: `student_development_notes`, `publication_posts`,
   `service_reports`, `report_approval_logs`. → Fresh Drizzle schema
   (BUKAN alter tabel lama); nama kanonik 04: `development_notes`,
   `publications`, `reports`, `report_workflow_logs`. DB lama read-only.
6. Audit "append-only" kemungkinan app-level saja (04 §23).
   → Enforce di DB via trigger (Appendix D). Verifikasi Fase 2 & 10.
7. Terminologi existing: "siswa", "rombel", status "Alpa" (10 §5, §7, §24).
   → WAJIB: "peserta didik", "kelas", ABSENT → "Tidak hadir".
   Dicatat TERMINOLOGY-CHECKLIST sebagai penyesuaian diwajibkan 10.
8. Administration = inspector RBAC read-only (vs 05 §16 target dynamic
   5-tab). → NEW-BUILD terbesar, bukan porting. Fase 8.

Yang TIDAK ada di existing tapi wajib target: PWA/offline engine (06),
testing (11 §38), dynamic RBAC admin (05 §16), struktur domain-driven (11),
terminology sweep (10), URL state (08), RLS lapis kedua + Supabase Auth/
Storage (ADR-13).

---

# 4. Peta Fase

| Fase | Nama                                     | 02 Wave | PROD-ARCH | Otoritas utama              |
|------|------------------------------------------|---------|-----------|-----------------------------|
| 0    | Formalisasi Artefak & Kunci Keputusan    | —       | —         | semua + baseline §3         |
| 1    | Foundation, Design System, Domain Skeleton, Platform Wiring | Wave 1 | Phase 1 | 03, UI-UX, 07, 10, 11, 06, 13 |
| 2    | Database (fresh Drizzle + hardening)     | Wave 1  | Phase 2   | 04, 05 §19, 11, 13          |
| 3    | Identity (Supabase Auth) & Dynamic RBAC  | Wave 1  | Phase 3   | 05, 09, 11, 13              |
| 4    | Academic, Students & Registration        | Wave 2  | Phase 4   | 04, 11, 07, 08, 09, 10      |
| 5    | Attendance, Development + Offline Engine | Wave 3  | Phase 5–6 | 04, 06, 08, 09, 11          |
| 6    | Consent, Media (signed), Publishing      | Wave 4  | Phase 7a  | 04, 05, 09, 11, 13          |
| 7    | Governance (Reports & Approval)          | Wave 5  | Phase 7b  | 04, 05, 07, 11              |
| 8    | Audit + Administration (dynamic RBAC)    | Wave 6  | Phase 8   | 04, 05 §16, 10, 11, 13      |
| 9    | Public Experience                        | Wave 7  | Phase 9   | 03, UI-UX, 10, 06           |
| 10   | Parity, Hardening, Platform Verify & Cutover | —   | Acceptance| semua + 13                  |

Rule: urutan tidak boleh dilompati. Dependency keras.

---

# 5. Artefak Kontrol Migrasi

Agent wajib membuat & memelihara `migration/`:

migration/
├── INVENTORY.md            → salin baseline §3.1 + detail kode (Fase 0)
├── GAP-ANALYSIS.md         → existing vs target per dokumen, muat 8 temuan §3.2 (Fase 0)
├── MIGRATION-PLAN.md       → strategi paralel apps/web, fresh PG17+re-seed,
│                             nasib Express/StorageManager, branch, cutover (Fase 0)
├── MIGRATION-STATE.md      → posisi terkini (setiap sesi)
├── DECISION-LOG.md         → D-01…D-30 FINAL + U-01…U-12 USULAN
├── DOMAIN-MAP.md           → 12 domain, ownership tabel, dependency graph,
│                             public API per feature, kolom sumber-existing→aksi (Fase 1+)
├── PARITY-CHECKLIST.md     → 12 baris UI-1…UI-12 (Fase 0)
├── TERMINOLOGY-CHECKLIST.md→ istilah & kapitalisasi per layar (10) (Fase 0)
├── COMPONENT-REGISTRY.md   → komponen per layer (07, anti-duplikasi) (Fase 1+)
├── RBAC-MATRIX.md          → role × permission × scope × policy + skenario uji (Fase 3)
├── OFFLINE-MATRIX.md       → feature readiness + hasil uji (06 §30) (Fase 5)
└── PLATFORM-VERIFY.md      → hasil verifikasi env/RLS/bucket/pooler/migrasi (Fase 1,2,3,10)

Format MIGRATION-STATE.md:

```text
# MIGRATION STATE
Updated: [tanggal]
Fase aktif: [N — nama]  Sub-bagian: [a/b/c jika ada]
Status: NOT STARTED | IN PROGRESS | IN REVIEW | DONE
Commit terakhir: [hash]
Selesai: [checklist singkat]
Test: [lulus/gagal per feature]
Berikutnya: [langkah konkret]
Blocker: [daftar / tidak ada]
Keputusan pending user: [daftar / tidak ada]
```

Format DECISION-LOG.md:

```text
## [D|U]-[nomor] — [judul]
Tanggal:
Fase:
Konteks:
Keputusan:
Alternatif yang ditolak:
Status: USULAN | DISETUJUI USER | FINAL
```

Rule:
Dokumen otoritas di docs/ TIDAK BOLEH diedit agent.
Artefak di migration/ milik agent untuk diperbarui.

---

# 6. BLOK A — Global Rules (pasang sekali sebagai AGENTS.md)

````text
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

# 7. BLOK B — Kickoff Sesi (template)

```text
Mulai sesi migrasi PMKI.
1. Baca rules global PMKI (BLOK A / AGENTS.md).
2. Baca migration/MIGRATION-STATE.md, DECISION-LOG.md, DOMAIN-MAP.md.
3. Fase hari ini: FASE [N] — [NAMA FASE]. Sub-bagian: [a/b/c jika ada].
4. Baca dokumen wajib fase ini (daftar ada di prompt fase).
5. Laporkan: posisi migrasi, kesiapan prasyarat, keputusan pending,
   dan rencana langkah (maks 10).
Jangan menulis kode sebelum saya membalas "LANJUT".
```

---

# 8. Prompt Per Fase

Semua prompt fase tunduk pada BLOK A.
Setiap fase diakhiri: verifikasi → BLOK C → commit → update MIGRATION-STATE
→ laporan ke user.

---

## FASE 0 — FORMALISASI ARTEFAK & KUNCI KEPUTUSAN

Prasyarat: dokumen otoritas di docs/ + baseline §3 sudah ada (audit naratif
s selesai). Sifat: READ-ONLY terhadap kode; tidak ada scaffolding.

```text
FASE 0 — FORMALISASI ARTEFAK (tanpa mengubah kode aplikasi)

Baseline §3.1–3.2 sudah teraudit. Tugas sekarang: formalisasi artefak
migration/ sesuai §5 dan kunci keputusan.

Tugas:
1. INVENTORY.md — salin baseline §3.1 (stack, run, storage dual-layer,
   25 tabel, seed counts, UI-1…UI-12 map, komponen per layer 07,
   pola state existing → pelanggaran 08, auth existing → 11 role 05 §6,
   offline existing = belum ada, aset desain, data produksi = TIDAK ADA).
   Tambah detail file/komponen yang belum tercakup di §3.
2. GAP-ANALYSIS.md — per dokumen (02,04,05,06,07,08,09,10,11,13).
   WAJIB memuat 8 temuan §3.2 + daftar yang tidak ada di existing tapi
   wajib target (PWA/offline, testing, dynamic RBAC admin, domain-driven,
   terminology sweep, URL state, RLS+Supabase Auth/Storage).
3. DOMAIN-MAP.md (draf) — 12 domain, ownership tabel, dependency graph
   (11 §20–21), public API per feature, kolom "sumber existing → aksi
   PORT/REBUILD/SPLIT/HAPUS/BARU" (lihat Appendix F).
4. PARITY-CHECKLIST.md — 12 baris (UI-1…UI-12): layout, workflow, states,
   role behavior, privacy behavior. Status awal: BELUM.
   Tandai penyesuaian wajib 10 (mis. Alpa → "Tidak hadir") sebagai
   WAJIB, bukan deviasi parity.
5. TERMINOLOGY-CHECKLIST.md — grep UI strings existing: siswa, murid,
   anak (istilah utama), rombel, alpa, student, teacher, consent, report,
   submit, "No Data Found", Title Case salah → daftar lokasi + perbaikan
   kanonik (10 §5, §5A, §24).
6. MIGRATION-PLAN.md — strategi paralel apps/web; fresh PG17 (Supabase CLI)
   + re-seed (TANPA data migration, karena tidak ada data produksi);
   nasib Express + StorageManager = TIDAK di-port / dihapus dari prod;
   DB lama 5433 read-only referensi; branch strategy; cutover = switch +
   arsip prototype; fase offline & testing eksplisit; platform Vercel+Cloud
   Singapore sesuai ADR-13.
7. DECISION-LOG.md — entri D-01…D-30 (FINAL, dari §11) + U-01…U-12 (USULAN,
   §11). Mapping role demo: Ms. Evi → UNIT_COORDINATOR, Ms. Lilian (Humas)
   → EDITOR (konsekuensi SoD: tambah user demo APPROVER), Pak Budi →
   TEACHER, Auditor → AUDITOR, Platform Admin → PLATFORM_ADMIN.
   Tandai role 05 §6 yang belum punya user demo.
8. MIGRATION-STATE.md — Fase 0, IN REVIEW, blocker: approval user atas U-01…U-12.
9. Daftar pertanyaan terbuka + daftar approval yang diminta.

Batasan: DILARANG mengubah kode. DILARANG scaffolding. DILARANG menaikkan
status USULAN menjadi FINAL tanpa approval user.

Selesai jika: user menyetujui MIGRATION-PLAN.md + approve U-01…U-12 (§11).
```

---

## FASE 1 — FOUNDATION, DESIGN SYSTEM, DOMAIN SKELETON & PLATFORM WIRING

Prasyarat: Fase 0 disetujui. Sub-sesi: (a) fondasi+token+platform wiring,
(b) shell+primitives, (c) compositions+patterns+lib.

```text
FASE 1 — FOUNDATION, DESIGN SYSTEM, DOMAIN SKELETON & PLATFORM WIRING

Baca: 03; UI-UX; 07 (seluruh); 10 §3–7, §9–20; 11 §5–7, §22, §30;
06 §4–9, §16, §20–21, §28; 08 §38; 09 §10, §22–24; 13 (Appendix A–D);
MIGRATION-PLAN + DOMAIN-MAP.

Tugas:
1. Scaffold Next.js App Router + TypeScript strict + Tailwind CSS v4 di
   apps/web/ (prototype root tetap utuh). Rilis stabil terbaru saat
   eksekusi; catat versi di DECISION-LOG.
2. Struktur kode DOMAIN-DRIVEN (11 §5–6), bukan folder-by-type:
   src/app/(public), (workspace), api, auth
   src/features/<domain>/{actions,services,repositories,permissions,
     validators,queries,hooks,types,components,index.ts}
     domain: identity, organization, students, academic, attendance,
     development, consent, media, governance, publishing, audit,
     administration, public
   src/components/{ui,compositions,patterns,layout}
   src/server/{auth,permissions,policies,validations,contracts,sync,upload}
     → HANYA infrastruktur lintas domain, tanpa business logic
   src/db/{schema,migrations,seed,client}
   src/lib/{status,messages,formatting,constants,offline}
   src/hooks/ src/styles/ src/types/
   Catat resolusi konflik folder (09 §10, 08 §38, 04 §27–28 vs 11 §6)
   di DECISION-LOG → approval U-01.
3. Finalkan DOMAIN-MAP.md: ownership tabel, dependency graph, public API
   (index.ts) tiap feature, kolom sumber-existing→aksi (Appendix F).
4. PLATFORM WIRING (ADR-13, Appendix A–C):
   - supabase init → supabase/config.toml (Appendix B) + templates email
     di supabase/templates/ (confirmation, recovery) sebagai kode.
   - Jalankan stack lokal via `supabase start` (postgres 54322, auth/api
     54321, studio 54323, mailpit 54324). Docker hanya dipakai CLI internal;
     aplikasi dev via `next dev` (atau `vercel dev`), BUKAN container app.
   - .env dari Appendix A (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY,
     SUPABASE_SERVICE_ROLE_KEY server-only, DATABASE_URL/DIRECT_URL,
     NEXT_PUBLIC_APP_URL, SUPABASE_STORAGE_BUCKET, MEDIA_SIGNED_URL_TTL).
   - src/db/client.ts: postgres-js prepare:false + drizzle (Appendix C).
   - drizzle.config.ts pakai DIRECT_URL (Appendix C).
   - src/server/auth/supabase-server.ts + session.ts getCurrentSession()
     memakai getUser(), memanggil administration.resolveAccess (stub dulu),
     bentuk 05 §20 (Appendix C).
   - src/middleware.ts edge-safe: refresh cookie + gate kasar; TANPA Drizzle
     (Appendix C, D-28).
   - vercel.json regions sin1 (Appendix A, D-27).
5. styles/tokens.css, themes.css, typography.css: salin PERSIS UI-UX §8–12,
   §19–21. Mapping Tailwind v4 @theme.
6. Font next/font: Newsreader, Plus Jakarta Sans, JetBrains Mono.
   Weight 400/500/600/700. Utility typography UI-UX §15.
7. shadcn/ui init → re-theme total via component tokens. Hasil TIDAK BOLEH
   terlihat seperti default shadcn.
8. Component System (07) + COMPONENT-REGISTRY.md:
   - ui/: Button (primary/secondary/ghost/link/destructive), Input, Textarea,
     Select, Checkbox, RadioGroup, Switch, Badge, Avatar, Dialog, Sheet,
     Tooltip, Skeleton, Tabs, DropdownMenu, Command, Popover, ScrollArea —
     token-aware, a11y, dark-ready.
   - compositions/: SearchInput, StatusBadge, EmptyState, UserAvatar.
   - patterns/: PageHeader, EntityHeader, SearchToolbar, DataTable (desktop
     table / mobile list), DetailTabs, WorkflowProgress, DecisionHistory,
     StatSummary, FormSection, StepIndicator, ReviewSection, SessionProgress.
   - layout/: AppShell, Sidebar, WorkspaceHeader, MobileNavigation,
     PageContainer — mengikuti parity UI-2 prototype.
   Prioritas: yang dipakai Fase 4 lebih dulu.
9. src/lib/status: SEMUA label status & role dari 10 §6–7, sentence case
   ("Aktif belajar", "Tinjauan program", "Persetujuan organisasi",
   "Tayang di publik", "Tidak hadir"). DILARANG label ganda/tersebar.
10. src/lib/messages: pesan error/success/validation/empty/konfirmasi dari
    10 §12–17 + pemetaan error code 09 §24 → pesan manusia.
    src/server/contracts: tipe result { success, data | error{code,message} }.
11. PWA baseline (06): manifest, icons, splash, shortcuts, installable;
    offline shell (navigasi/layout terbuka tanpa internet); caching §9;
    update "Update Now / Later" §21; useConnectivity + indikator
    ONLINE/OFFLINE/RECONNECTING/SYNCING. Evaluasi library (usulan
    @serwist/next sebagai penerus next-pwa) → DECISION-LOG + approval U-07.
12. Quality baseline: lint, typecheck, build, TEST RUNNER (11 §38) +
    strategi DB test via supabase lokal di CI. Pilihan tool → U-06.
13. Skeleton 12 feature + index.ts bertipe (belum ada business logic).

Batasan: belum ada schema domain, auth penuh, atau fitur.

Verifikasi:
- Build + test runner jalan; token identik dokumen (diff).
- Label status/role sesuai 10; tidak ada istilah teknis bocor ke UI.
- Shell & komponen rapi 375/768/1024/1440; dark mode; focus terlihat.
- DataTable mobile = list. Offline shell terbuka; installable.
- PLATFORM-VERIFY.md: supabase start bersih; getUser() stub jalan; middleware
  edge-safe (tidak import Drizzle); env sesuai Appendix A; prepare:false
  terhubung ke 54322; mailpit menerima email.
- DOMAIN-MAP + COMPONENT-REGISTRY terisi; tidak ada duplikasi; Gates lulus.
```

---

## FASE 2 — DATABASE (FRESH DRIZZLE + HARDENING)

Prasyarat: Fase 1 selesai.

```text
FASE 2 — DATABASE

Baca: 04 (seluruh); 05 §19; 11 §7–19 (ownership); 09 §29; 06 §12, §14;
13 + Appendix D; DOMAIN-MAP + MIGRATION-STATE.

Tugas:
1. Drizzle ORM + Drizzle Kit + PostgreSQL 17 (Supabase lokal 54322).
   Skema FRESH — JANGAN alter tabel DB lama (5433 read-only referensi).
2. Schema seluruh domain 04 §7–23 + RBAC 05 §19, folder mengikuti OWNERSHIP
   DOMAIN (11 menang atas 04 §27):
   identity/users.ts  (id = auth uid v4; TANPA password_hash; TANPA role)
   administration/{roles,permissions,role-permissions,user-roles,
     user-permissions}.ts
   organization/{organizations,service-units,programs,user-memberships}.ts
   academic/{academic-years,teachers,teacher-assignments,classes,
     class-enrollments,subjects,schedules}.ts
   students/{students,guardians,student-guardians}.ts
   attendance/{attendance-sessions,attendance-records}.ts
   development/{development-categories,development-notes}.ts
   consent/consents.ts · media/media-assets.ts
   governance/{reports,report-workflow-logs}.ts
   publishing/publications.ts · audit/audit-logs.ts
   platform/sync-operations.ts  (ledger idempotency, U-04)
   Nama kanonik 04 dipakai: development_notes, publications, reports,
   report_workflow_logs (BUKAN student_development_notes dsb).
   Deviasi folder dicatat DECISION-LOG.
3. Keputusan skema WAJIB approval (tandai USULAN sebelum implement):
   - programs → owner Organization (U-02; wajib memberships.programId).
   - class_enrollments → owner Academic; Students.PlacementService menulis
     via AcademicService, BUKAN repository Academic (U-03).
   - sync_operations → infrastruktur shared platform (U-04).
   - versioning development notes (06 §14): opsi A kolom version +
     optimistic concurrency; opsi B tabel development_note_revisions
     (append, latest=current). Rekomendasi B-lite. (U-05)
   - users.role & users.password_hash DIHAPUS (05 + ADR-13 menang). (U-09)
4. Aturan wajib:
   - PK UUID v7 entitas domain; users.id = auth uid (D-25).
     PG17 belum uuidv7() native → generate application layer; DECISION-LOG.
   - Common columns + archived_at/archived_by (§5, §25).
   - FK lengkap + unique + check + index sesuai §26.
   - UNIQUE(class_id, session_date) attendance_sessions.
   - development_notes.confidential default TRUE.
   - Enum tersimpan: registration (§12), attendance (§16), consent (§18),
     report (§20), publication (§22).
   - Konteks organisasi pada students, teachers, classes, attendance,
     development, reports, media (§24).
   - audit_logs & report_workflow_logs append-only via trigger (Appendix D).
5. Migration bertahap §30 Step 1–6 (+ RBAC Step 1, + hardening Appendix D).
   Bisa di-replay dari nol. SETIAP migration pembuat tabel diakhiri
   SELECT public.pmki_harden_tables(); (D-22, BLOK C audit).
6. Read models: features/<domain>/queries (11 §28). src/db hanya
   schema/migrations/seed/client. Tanpa business logic.
7. Seed development-only (§29), idempotent, replikasi Griya Asih:
   organizations, service_units, programs, academic_years, classes,
   subjects, development_categories, teachers, students, guardians,
   schedules, reports, publications + permission registry LENGKAP (05 §8)
   + 11 system roles + default matrix (05 §9) + memberships + contoh
   override (grant & revoke).
   Demo users: buat auth.users lokal (CLI) ATAU script Admin API, lalu
   public.users + roles + memberships. Mapping §3.2/DECISION-LOG
   (Ms. Lilian → EDITOR + tambah APPROVER).
   Seed DILARANG production.
8. Uji constraint: double session ditolak; FK ditegakkan; audit tidak bisa
   UPDATE/DELETE (trigger); soft delete bekerja; anon/authenticated TIDAK
   punya grant tabel operasional (Appendix D verifikasi).

Verifikasi:
- drizzle-kit generate + migrate bersih dari database kosong (lokal).
- Tabel & index sesuai dokumen (inspeksi via studio, READ-ONLY).
- Constraint lulus; type-safe; ownership tercatat DOMAIN-MAP;
  hardening function terpanggil di semua migration; seluruh USULAN tercatat.
- PLATFORM-VERIFY.md: bucket media private; RLS enabled + anon deny;
  trigger audit immutable; DIRECT_URL jalan untuk migrate.
```

---

## FASE 3 — IDENTITY (SUPABASE AUTH) & DYNAMIC RBAC

Prasyarat: Fase 2 selesai.

```text
FASE 3 — IDENTITY & DYNAMIC RBAC

Baca: 05 (seluruh); 11 §8, §19, §27, §38; 09 §17–20; 08 §10, §27;
10 §6 (label role), §12–14 (pesan); 13 + Appendix C; MIGRATION-STATE.

Tugas:
1. features/identity: Supabase Auth adapter (email+password), session
   server-side via getCurrentSession() (Appendix C). getUser(), BUKAN
   getSession(). enable_signup=false; provisioning via Admin API (Fase 8).
2. Bentuk session PERSIS 05 §20:
   { id, roles[], permissions[], memberships[{organizationId,
     serviceUnitId, programId?}] }
   permissions = hasil resolusi per-request dari DB, BUKAN klaim JWT (D-20).
3. features/administration: repositories + services roles, permissions,
   user_roles, user_permissions, user_memberships.
   resolveAccess(userId): role → grant → revoke (05 §11); revoke SELALU
   menang; memberships diambil via organization service (cross-domain via
   service, 11 §21). React cache() per-request.
4. Scope Resolution (05 §12): organization, service unit, program.
   Query data wajib ter-scope sesuai memberships.
5. src/server/permissions: engine can(user, permission, options?) shared.
   features/<domain>/permissions: policy spesifik (11 §27).
6. Policy Engine (05 §15, §21):
   can(user, "report.approve", { requireSeparationOfDuties: true,
     resourceOwnerId: report.createdBy }). SoD menang atas role/admin.
7. Klasifikasi data (05 §13–14): helper CONFIDENTIAL (data wali, catatan
   perkembangan, bukti persetujuan, alamat) default DENY, dibuka eksplisit.
8. Rantai otorisasi (05 §3, 09 §17): Authentication → Permission → Scope →
   Policy → Action, di SERVER. Proteksi layout workspace di server.
   DILARANG cek role === "ADMIN".
9. Middleware edge-safe sudah ada (Fase 1); pastikan tidak ada Drizzle.
10. UI: label role 10 §6 (Administrator Platform, Koordinator Unit,
    Pengajar, Relawan, Penyusun Konten, Peninjau, Pejabat Penyetuju,
    Auditor, Pemangku Kepentingan). Halaman login/auth: forms percakapan,
    copy & kapitalisasi 10. Email confirm/reset via template repo (Mailpit dev).
11. migration/RBAC-MATRIX.md dari 05 §9 + skenario uji:
    - TEACHER default: boleh attendance.record, tidak guardian.read
    - TEACHER + grant guardian.read → boleh
    - TEACHER + revoke development.create → ditolak
    - Akses lintas service unit → SCOPE_DENIED
    - Approver setujui laporan sendiri → POLICY_DENIED
    - PLATFORM_ADMIN tetap terikat policy
    - REVOKE langsung efektif tanpa redeploy (uji resolveAccess)
12. Tests (11 §38): service + policy + validation; RBAC integration test.

Verifikasi:
- Seluruh skenario RBAC-MATRIX lulus DI SERVER (bukan redirect UI).
- Session 05 §20 benar; override benar; scope ditegakkan; revoke instan.
- Tidak ada authorization hanya di client; tidak ada getSession() untuk
  otorisasi; test hijau.
- PLATFORM-VERIFY.md: login → getUser() OK; enable_signup=false;
  template email terkirim ke Mailpit.
```

---

## FASE 4 — ACADEMIC, STUDENTS & REGISTRATION

Prasyarat: Fase 3 selesai. Sub-sesi: (a) Academic, (b) Students,
(c) Registration & verification/placement UI.

```text
FASE 4 — ACADEMIC, STUDENTS & REGISTRATION

Baca: 04 §9–14; 11 §10–11, §20–21, §31, §38; 05 §8 (student.*, guardian.*,
class.*, schedule.*), §13; 07 §9, §16–19; 08 §12–15; 09 §6, §15, §22–25;
06 §18; 10 §5–17; UI-UX §25–29; PARITY-CHECKLIST + TERMINOLOGY-CHECKLIST +
kode prototype terkait.

Tugas:
A. Academic (owner: academic_years, classes, teachers, schedules, subjects,
   class_enrollments):
1. AcademicService + repository + validators + queries. Penyediaan kelas &
   enrollment untuk domain lain HANYA via service.
B. Students (owner: students, guardians, student_guardians):
2. StudentService, GuardianService, RegistrationService, PlacementService.
   Transisi lifecycle valid, kapasitas kelas, waitlist. Penempatan kelas
   memanggil AcademicService (DILARANG repository Academic).
3. Lifecycle TERSIMPAN di DB: SUBMITTED → PENDING_VERIFICATION → VERIFIED →
   CLASS_PLACEMENT → ACTIVE (+ WAITLIST/REJECTED/CANCELLED). Tidak diinferensi.
4. Data wali (kontak, alamat) = CONFIDENTIAL: default deny, butuh
   guardian.read + scope.
5. Domain events: StudentRegistered, StudentVerified, StudentPlaced →
   audit via AuditService/subscriber.
C. UI & actions:
6. Actions TIPIS + Zod di features/*/validators; hasil kontrak 09;
   revalidatePath setelah mutasi; audit per mutasi.
7. Workspace peserta didik (Server Components first): Page Header → Search →
   Filters → Result Summary → Data View → Action. Search/filter/page di URL.
   Detail: Entity Header → Overview → Tabs → Secondary Information.
   Status via lib/status (sentence case).
8. Pendaftaran publik (wizard 5 langkah sesuai prototype UI-6):
   React Hook Form + Zod; StepIndicator, FormSection, ReviewSection.
   Bahasa hangat (10 §21). Offline: boleh diisi, pengiriman QUEUED label
   jujur (06 §18). Draft recoverable.
9. Verification & placement: WorkflowProgress; keputusan tercatat + audit;
   aksi role-aware via can().
10. Terminologi & kapitalisasi 10: "Peserta Didik" (page title),
    "Tambah peserta didik" (tombol), "Verifikasi pendaftaran",
    "Tempatkan ke kelas", "Belum ada peserta didik." (empty).
    Ganti istilah existing (siswa/rombel) → kanonik; catat TERMINOLOGY-CHECKLIST.
11. Reuse patterns; update COMPONENT-REGISTRY.
    Tests: service + policy + validation; Students = integration test.
12. Parity + perbarui PARITY-CHECKLIST & TERMINOLOGY-CHECKLIST.

Verifikasi:
- Siklus pendaftaran → verifikasi → penempatan → aktif end-to-end.
- Transisi ilegal ditolak service; RBAC+scope per aksi; audit tercatat.
- Tidak ada import repository lintas domain.
- URL state sharable/refresh-safe; test hijau; 375px rapi; Gates lulus.
```

---

## FASE 5 — ATTENDANCE, DEVELOPMENT + OFFLINE ENGINE

Prasyarat: Fase 4 selesai. Sub-sesi: (a) online workflow, (b) offline engine,
(c) sync + conflict + testing.

```text
FASE 5 — ATTENDANCE, DEVELOPMENT + OFFLINE ENGINE

Baca: 04 §15–17; 06 (seluruh); 08 §24–25, §28–29, §31–33, §37–38;
09 §27–29; 11 §12–13, §20–21, §37–38; 05 §8 (attendance.*, development.*),
§13; 10 §5, §7, §13–14; PARITY-CHECKLIST + kode prototype terkait.

Tugas:
A. Online workflow:
1. Attendance (owner: attendance_sessions, attendance_records):
   UNIQUE(class_id, session_date); roster dari enrollment via
   AcademicService/StudentsService (DILARANG repository domain lain);
   status PRESENT/ABSENT/SICK/PERMITTED → label 10 §7 "Hadir",
   "Tidak hadir", "Sakit", "Izin" (BUKAN "Alpa"); review & tindak lanjut.
2. Development (owner: development_notes, development_categories):
   observation, progress, follow_up; confidential=true default;
   teacher-scoped; catatan confidential tidak terlihat role tanpa izin
   (server-side). Bila butuh cek persetujuan → ConsentService, BUKAN
   repository Consent. Versioning sesuai U-05 (revisions / optimistic).
3. Repositories + services + validators + actions tipis + audit.
   Domain events: AttendanceRecorded, DevelopmentNoteCreated.
   URL state filter/tab; skeleton; error human-readable.
B. Offline engine (06 + 08):
4. src/lib/offline: abstraction IndexedDB (bukan localStorage) untuk drafts,
   queue, cached list/detail (Tier B).
5. hooks: useConnectivity, useOfflineQueue, useDraftRecovery.
6. Sync queue (06 §12 + 09 §28): { operationId, entityType, entityId,
   payload, createdAt, syncStatus } status PENDING/PROCESSING/SUCCESS/FAILED.
7. Attendance offline: pilih sesi → catat → draft → queue. Development
   offline: tulis → draft → queue. Label "Disimpan lokal",
   "Belum tersinkronisasi". DILARANG "Berhasil disimpan" sebelum konfirmasi.
8. Draft recovery: selamat dari refresh / tutup aplikasi.
C. Sync & conflict:
9. /api/sync (09 §27): Zod → Authentication → Permission → Scope → Policy →
   dispatch ke domain service. Idempotency operationId + ledger
   sync_operations; duplikat diproses DITOLAK.
10. Background sync DIGERAKKAN KLIEN/Service Worker saat reconnect (06 §13,
    D-30), tanpa refresh halaman. Indikator "Sinkron terakhir: [waktu]" §15.
11. Konflik (06 §14): attendance = server wins + tandai manual review;
    catatan perkembangan = versioned, tidak menimpa diam-diam.
12. Offline audit intent (06 §25): original timestamp + sync timestamp.
13. Tier C SELALU online-only (governance, publishing, administration, audit)
    — tolak pesan tenang.
14. Privasi offline (06 §23–24): tanpa secrets/tokens; tanpa data wali,
    bukti persetujuan, catatan privat massal.
15. migration/OFFLINE-MATRIX.md (06 §30) + hasil uji per fitur.
16. Tests: service + policy + validation; Attendance = integration test.
    Uji state (08 §37): online, offline, reconnect, sync success, sync
    failure, role change, session expiry.

Verifikasi:
- Double session ditolak DB; sync idempoten (kirim 2x = 1 efek).
- Draft selamat; label jujur; Tier C terblokir offline.
- Catatan confidential terlindungi server-side; audit lengkap.
- Tidak ada akses repository lintas domain; test hijau; OFFLINE-MATRIX terisi;
  parity + Gates lulus.
```

---

## FASE 6 — CONSENT, MEDIA (SIGNED) & PUBLISHING

Prasyarat: Fase 5 selesai. Sub-sesi: (a) Consent, (b) Media, (c) Publishing.

```text
FASE 6 — CONSENT, MEDIA & PUBLISHING

Baca: 04 §18–19, §22; 05 §8 (consent.*, media.*, publication.*), §13–15;
09 §30; 11 §14–17, §20–21, §31; 06 §6, §22; 10 §5, §7, §15, §17;
13 + Appendix A (bucket/signed URL); PARITY-CHECKLIST + kode prototype.

Tugas:
1. Consent (owner: consents): Persetujuan Data TERPISAH dari Persetujuan Foto
   & Video; GRANTED/DENIED/REVOKED → "Disetujui"/"Tidak diizinkan"/
   "Izin dicabut"; effective_at & revoked_at; bukti persetujuan CONFIDENTIAL.
   ConsentService satu-satunya pintu domain lain.
2. Consent enforcement service/query: tanpa persetujuan sesuai, data wali &
   foto/video peserta didik tidak boleh digunakan/ditampilkan.
   Copy privasi 10 §17.
3. Media (owner: media_assets) — SUPABASE STORAGE (D-19):
   - Bucket private "media" (Appendix D).
   - Upload besar: createUploadUrl (server action: authz + validasi tipe/
     ukuran) → client PUT langsung ke Storage via signed upload URL →
     confirmUpload (server action: tulis media_assets + audit). Menghindari
     limit body serverless Vercel; alur 09 §30 tetap terpenuhi.
   - Baca: signed URL dibuat SERVER setelah permission + scope + consent +
     eligibility. TTL signed URL > TTL cache/revalidate halaman (D-29).
   - Review workflow: privacy_reviewed, eligible_for_public, reviewed_by.
     Policy uploader ≠ reviewer (U-10). Media TIDAK BISA public tanpa review.
     Kategori KEGIATAN/ACARA/FASILITAS/PENGURUS. UI "Dokumentasi".
     Offline: thumbnail dulu (§22).
4. Publishing (owner: publications): DRAFT → PRIVACY_REVIEW → APPROVED →
   PUBLISHED → ARCHIVED; slug unik; label 10 §7 "Draft konten",
   "Tinjauan privasi", "Disetujui editorial", "Tayang di publik",
   "Diarsipkan". SoD penulis ≠ penerbit. Tombol "Terbitkan konten".
   Akses media HANYA via MediaService.
5. Galeri & berita publik: hanya media eligible+reviewed & published.
6. Domain events: ConsentUpdated, PublicationPublished → audit.
7. Semua aksi ONLINE-ONLY (Tier C), pesan jelas.
8. UI: Current State → Available Action → Next State; reuse WorkflowProgress/
   DecisionHistory. Tests service+policy+validation. Parity + Gates +
   TERMINOLOGY-CHECKLIST.

Verifikasi:
- Persetujuan REVOKED memblokir penggunaan terkait.
- Media belum review mustahil public (uji query langsung + signed URL mati
  tanpa eligibility).
- SoD ditegakkan server; workflow tersimpan; audit lengkap; test hijau.
- PLATFORM-VERIFY.md: bucket private; signed URL TTL > cache; upload via
  createUploadUrl/confirmUpload jalan di dev.
```

---

## FASE 7 — GOVERNANCE (REPORTS & APPROVAL)

Prasyarat: Fase 6 selesai.

```text
FASE 7 — GOVERNANCE (REPORTS & APPROVAL)

Baca: 04 §20–21; 05 §8 (report.*), §15, §21; 11 §16, §20, §31, §38;
07 (WorkflowProgress, DecisionHistory); UI-UX §28; 03 §21; 10 §7, §18, §23;
06 §6; PARITY-CHECKLIST + kode prototype terkait.

Tugas:
1. Governance (owner: reports, report_workflow_logs): jenis ACTIVITY/
   ATTENDANCE/STUDENT_DEVELOPMENT/STAKEHOLDER; period; summary;
   classification (05 §13).
2. Workflow: DRAFT → PROGRAM_REVIEW → UNIT_VALIDATION →
   ORGANIZATION_APPROVAL → APPROVED/REJECTED. Label 10 §7 "Draft",
   "Tinjauan program", "Validasi unit", "Persetujuan organisasi",
   "Disetujui", "Ditolak". Setiap transisi = report_workflow_logs
   (immutable) + audit.
3. Policy: can(user, "report.approve", { requireSeparationOfDuties: true,
   resourceOwnerId: report.createdBy }). Copy 10 §23: "Persetujuan akhir
   tidak dapat diberikan oleh penyusun laporan."
4. Data laporan dari domain lain HANYA via service (Attendance/Development/
   Students). Dependency Governance → Publishing diizinkan (11 §20) via
   PublishingService.
5. UI: WorkflowProgress + DecisionHistory; bahasa tenang & presisi;
   aksi = permission + scope + state. ONLINE-ONLY. Copy 10 §18:
   "Keputusan akan dicatat dalam jejak audit."
6. Domain event ReportApproved → audit. Tests service+policy+validation;
   Governance = integration test. Parity + Gates.

Verifikasi:
- Transisi ilegal ditolak; self-approval → POLICY_DENIED di server.
- History tidak bisa diubah/dihapus; approver benar; test hijau.
```

---

## FASE 8 — AUDIT + ADMINISTRATION (DYNAMIC RBAC)

Prasyarat: Fase 7 selesai. Sub-sesi: (a) Audit, (b) Users & Roles,
(c) Overrides & Scope.

```text
FASE 8 — AUDIT + ADMINISTRATION

Baca: 05 §16–18, §8–12; 04 §23, §25–26; 11 §18–19, §31–32, §38; 02 §19;
06 §6; 10 §5, §6, §19; 13 (Admin API provisioning); PARITY-CHECKLIST +
kode prototype.

Tugas:
A. Audit (owner: audit_logs):
1. Subscriber domain events → penulisan audit terpusat. Pastikan mutasi
   penting tidak lolos tanpa audit.
2. UI "Jejak Audit" (menu) / "Riwayat Audit" (detail): read-only; filter
   pelaku/aksi/entitas/tanggal; human readable; JetBrains Mono identifier;
   pagination. Copy 10 §19: "Status pendaftaran diperbarui",
   "Persetujuan dicabut", "Publikasi ditayangkan", "Peran diperbarui",
   "Pengguna dinonaktifkan".
3. Buktikan tidak ada jalur UPDATE/DELETE audit di kode + DB (trigger).
B. Administration Workspace (05 §16) — 5 tab, istilah 10 §5:
4. Pengguna: cari; nama/peran/lingkup/status/login terakhir; lihat, ubah,
   nonaktifkan (soft), tetapkan peran. PROVISIONING user baru via
   Supabase Admin API (user.create) → public.users + roles + membership
   (D-26; enable_signup=false). TIDAK lewat UI publik.
5. Peran: system roles + custom; detail hak akses + pengguna terkait;
   BUAT PERAN KUSTOM tanpa coding (mis. "Koordinator Remaja",
   "Peninjau Pendidikan").
6. Hak Akses: registry read-only, dikelompokkan per kategori (05 §8);
   deskripsi + modul terdampak.
7. Override akses: beri/cabut hak akses per pengguna + alasan; cabut menang
   atas beri; efektif tanpa deploy (resolveAccess per-request).
8. Penetapan lingkup: organisasi / unit pelayanan / program
   (user_memberships).
9. Semua perubahan akses WAJIB audit (05 §18): penetapan/penghapusan peran,
   pemberian/pencabutan hak akses, perubahan lingkup, aktivasi/nonaktivasi.
10. Policy TETAP mengikat admin: SoD & klasifikasi tidak bisa dimatikan
    lewat konfigurasi.
11. Semua aksi admin ONLINE-ONLY. Arsip, bukan hapus. Dialog konfirmasi 10 §15.
    Area "Lingkungan Uji Coba" (10 §26) dev-only gated PLATFORM_ADMIN
    (menggantikan role switcher prototype, U-08).
12. Tests: service + policy + validation; RBAC = integration test.
    Parity + Gates.

Verifikasi:
- Peran kustom berfungsi end-to-end tanpa perubahan kode.
- Override beri/cabut benar; lingkup berubah efektif; revoke instan.
- Audit immutable terbukti; admin tidak bisa melewati policy; tidak ada
  hard delete; test hijau.
- PLATFORM-VERIFY.md: provisioning via Admin API jalan; users tanpa
  password_hash/role.
```

---

## FASE 9 — PUBLIC EXPERIENCE

Prasyarat: Fase 8 selesai.

```text
FASE 9 — PUBLIC EXPERIENCE

Baca: 03 §7, §13–19; UI-UX §6, §11, §14–18; 02 §21; 10 §4, §5, §21;
06 §9, §18, §28; 07 §14; PARITY-CHECKLIST + TERMINOLOGY-CHECKLIST +
kode prototype public.

Tugas:
1. features/public: Hero → Mission → Programs → Community Story →
   Registration CTA. Ritme spacing UI-UX §18 (96/80/64/96/80).
2. Display typography (Newsreader) HANYA public. Copy hangat dari 10 §21 +
   prototype: "Ayo belajar dan tumbuh bersama.", "Rumah belajar yang
   terbuka bagi semua.", "Setiap anak memiliki kesempatan untuk berkembang."
   Gunakan copy final prototype/user; jangan mengarang.
3. Terminologi publik: "Pengajar Relawan" (bukan Teacher/Tutor),
   "Peserta Didik", "Kelas", "Pendaftaran". DILARANG "Join now",
   "Enroll immediately", CTA Inggris.
4. Halaman program, galeri (Dokumentasi), berita (Publikasi), pendaftaran
   sesuai prototype UI-12. Galeri hanya media eligible+reviewed (signed URL
   server); berita hanya published. Jadwal Sabtu 15.00–17.15 WIB RAAL Lawang
   dari prototype.
5. Fotografi autentik komunitas; aset dari user/prototype. Rasio 70/20/10.
   Tanpa gradient, tanpa visual noise.
6. Performance (06 §28): initial < 3s, repeated < 1s koneksi umum;
   next/image; font loading; metadata SEO.
7. Halaman publik boleh di-cache offline (06 §9); pendaftaran offline →
   queued label jujur.
8. Parity + Gates + uji 5 detik + TERMINOLOGY-CHECKLIST.

Verifikasi:
- Dipahami < 5 detik; hierarchy bekerja tanpa shadow/warna/badge/animasi.
- 375px nyaman; budget performa terpenuhi; tidak ada pola SaaS generik;
  tidak ada istilah teknis/Inggris bocor ke UI publik.
```

---

## FASE 10 — PARITY, HARDENING, PLATFORM VERIFY & CUTOVER

Prasyarat: Fase 1–9 selesai.

```text
FASE 10 — PARITY AUDIT, HARDENING, PLATFORM VERIFY & CUTOVER

Baca: seluruh dokumen otoritas (termasuk 13) + seluruh migration/*.

Tugas:
1. PARITY-CHECKLIST penuh UI-1…UI-12 berdampingan prototype. Deviasi:
   perbaiki, atau approval user + DECISION-LOG. Pengecualian: penyesuaian
   terminologi (10) WAJIB, bukan deviasi liar.
2. Design Gates di SEMUA halaman + anti-pattern scan (BLOK C).
3. TERMINOLOGY SWEEP (10 §24, §29): seluruh UI istilah kanonik; kapitalisasi
   benar (Title Case hanya navigasi & page title); label status/role dari
   lib/status; tidak ada jargon teknis; tidak ada "siswa/rombel/alpa".
4. DOMAIN AUDIT (11 §40, §42): import lintas domain hanya via index.ts/
   service; tidak ada repository lintas domain; tidak ada repository→
   repository; tidak ada God Service; shared layer bebas business logic;
   ownership sesuai DOMAIN-MAP.
5. Security sweep: setiap action Auth → Permission → Scope → Policy;
   enforcement persetujuan; klasifikasi CONFIDENTIAL; minimum disclosure;
   audit coverage; audit & workflow log immutable (trigger); uji ulang
   RBAC-MATRIX termasuk override & SoD & revoke instan.
6. PLATFORM VERIFY (ADR-13, Appendix A–E, PLATFORM-VERIFY.md):
   - Drizzle satu engine migrasi; tidak ada supabase db push; tidak ada
     edit schema prod via Studio.
   - getUser() dipakai, bukan getSession(); resolveAccess per-request;
     revoke tanpa redeploy.
   - RLS enabled + anon/authenticated deny-all tabel operasional;
     hardening function terpanggil di semua migration pembuat tabel.
   - Bucket media private; signed URL TTL > cache; upload via
     createUploadUrl/confirmUpload; media belum review tak bisa diakses.
   - DATABASE_URL prepare:false pooler 6543; DIRECT_URL session 5432;
     service key server-only; tidak ada NEXT_PUBLIC_ key istimewa;
     tidak ada supabase-js read dari client.
   - Middleware edge-safe tanpa Drizzle; Vercel regions sin1.
   - users tanpa password_hash/role; provisioning Admin API; enable_signup=false.
   - Seed tidak ikut production; migrasi di CI bukan vercel build.
   - PITR/backup aktif di prod; Mailpit hanya dev.
7. API testing (09 §43) per action/endpoint: success, validation, permission,
   scope, policy, idempotency.
8. Test suite (11 §38): service/policy/validation semua feature; integration
   Students, Attendance, Governance, RBAC — semua hijau.
9. State testing (08 §37): online, offline, reconnect, sync success, sync
   failure, role change, session expiry.
10. PWA (06 §32): install Android/iOS/desktop; offline shell; OFFLINE-MATRIX
    lulus penuh; update flow halus; budget performa; sync client-driven.
11. Accessibility audit: keyboard, focus, kontras AA, reduced motion,
    touch 44px, dasar screen reader, label deskriptif (10 §20).
12. Performance (09 §40): action normal < 500ms, heavy < 2s. Monitoring
    dasar (09 §39, 06 §27): latency, errors, permission denials, validation
    failures, sync failures, queue size.
13. Data migration: TIDAK ADA (baseline §3.1). Cutover = switch + arsip
    prototype. Verifikasi seed prod = bootstrap admin via Admin API saja.
14. Production readiness: env Vercel (Appendix A prod), build, logging,
    error boundary, loading & empty states. Eksekusi runbook Appendix E.
15. Cutover HANYA setelah user sign-off. Prototype diarsipkan, tidak dihapus.
16. Laporan akhir terhadap seluruh Definition of Done: 02 §24, PROD-ARCH
    Acceptance, 04 §32, 05 §23, 06 §32, 07 §30, 08 §39, 09 §44, 10 §29,
    11 §42, 13 §9 (Acceptance ADR).

Selesai jika: seluruh checklist ✅ atau deviasi disetujui tertulis.
```

---

# 9. BLOK C — Review & Gates (setiap akhir fase)

```text
Jalankan REVIEW FASE [N]. Jangan menambah fitur baru.

DESIGN
1. Design Gates 1–5 per halaman berubah → PASS/FAIL + bukti.
2. Anti-pattern scan (10 pola terlarang) → temuan + lokasi file.
3. Token audit: brand token di components/features → 0; nilai token vs
   UI-UX → identik.
4. Typography: display di workspace → 0; body < 14px → 0; weight di luar
   400/500/600/700 → 0.

LANGUAGE (10)
5. Terminologi: grep istilah terlarang di UI (Student/Siswa/Murid/Anak/
   Teacher/Tutor/Rombel/Alpa/Attendance/Consent/Report/Publication/
   Audit Log/Stakeholder/Submit/Execute/Process/Apply/"No Data Found"/
   "Klik di sini") → harus 0.
6. Kapitalisasi: Title Case hanya navigasi & page title; sisanya sentence
   case. Label status/role dari 10 §6–7 via lib/status.
7. Pesan error/success/validation/empty/konfirmasi/a11y sesuai 10; tidak ada
   kode teknis bocor ke UI.

ARCHITECTURE (11, 08, 09, 07)
8. Domain audit: import lintas domain hanya via index.ts/service? repository
   lintas domain → 0. repository→repository → 0. God Service? shared layer
   business logic? → temuan.
9. State audit: duplikasi server state (jangan ada sisa pola StorageManager/
   api-state)? URL state search/filter/page? Context hanya theme/session/
   connectivity? optimistic success terlarang?
10. API audit: action tipis? kontrak result benar? Zod di validators?
    revalidatePath setelah mutasi? error code + pesan manusia? → tabel.
11. Component audit: komponen baru di registry? duplikat? feature membuat
    primitive sendiri? DataTable mobile = list? status terpusat lib/status?

SECURITY (05, 04)
12. Authorization: setiap action/route → Auth → Permission → Scope → Policy
    di server? cek role === "ADMIN" → 0. → tabel.
13. Privacy: CONFIDENTIAL bocor ke role/client/public? enforcement persetujuan
    aktif? klasifikasi ditegakkan?
14. Audit coverage: semua mutasi penting menulis audit (via event)? ada jalur
    update/delete audit atau workflow log? → 0.
15. RBAC (fase 3+): grant/revoke benar? revoke menang? SoD mengikat admin?
    revoke instan tanpa redeploy (resolveAccess per-request)?

PLATFORM (13 — fase 1+)
16. Supabase: getUser() bukan getSession() untuk otorisasi? tidak ada
    supabase-js read dari client? service key server-only (tidak NEXT_PUBLIC_)?
    RLS enabled + anon/authenticated deny-all tabel operasional? hardening
    function terpanggil di semua migration pembuat tabel? bucket media private?
    signed URL TTL > cache? upload via createUploadUrl/confirmUpload?
    DATABASE_URL prepare:false? DIRECT_URL untuk migrasi? middleware edge-safe
    tanpa Drizzle? users tanpa password_hash/role? enable_signup=false?
    seed tidak di prod? migrasi di CI bukan vercel build? satu engine migrasi?

OFFLINE (fase 5+)
17. Label sync jujur? Tier C online-only? idempotency teruji? draft recoverable?
    tanpa secrets/data sensitif massal lokal? sync client-driven?

QUALITY
18. Typecheck, lint, build. Constraint & index DB sesuai 04.
19. Tests (11 §38): service/policy/validation per feature; integration domain
    kritis → semua hijau.
20. Update PARITY-CHECKLIST, TERMINOLOGY-CHECKLIST, DOMAIN-MAP,
    COMPONENT-REGISTRY, OFFLINE-MATRIX, PLATFORM-VERIFY (sesuai fase),
    MIGRATION-STATE.

Output: laporan PASS/FAIL per item + perbaikan berprioritas.
FAIL → perbaiki HIERARCHY / BOUNDARY / BAHASA / PLATFORM, bukan dekorasi.
Jangan menyatakan fase selesai sebelum semua FAIL ditutup.
```

---

# 10. BLOK D — Handoff / Lanjut Sesi

```text
Lanjutkan migrasi PMKI.
1. Baca rules global + MIGRATION-STATE.md + DECISION-LOG.md + DOMAIN-MAP.md.
2. Fase aktif: FASE [N]. Sub-bagian: [a/b/c jika ada].
   Langkah terakhir tercatat: [x].
3. Jangan mengulang pekerjaan selesai. Jangan mengubah keputusan USULAN
   menjadi FINAL tanpa persetujuan user.
4. Laporkan posisi terkini + rencana lanjutan (maks 10 langkah).
Tunggu "LANJUT" sebelum menulis kode.
```

---

# 11. Protokol Konflik & Register Keputusan

Urutan penyelesaian:
1. Konflik desain → hierarki desain menang.
2. Konflik istilah/label/copy → 10 menang.
3. Konflik lokasi kode/ownership → 11 menang.
4. Konflik platform (auth source, storage, hosting, env, migrasi engine,
   RLS, users.id/password_hash) → 13 menang.
5. Konflik teknis bidangnya → dokumen domain menang atas 02/PROD-ARCH.
6. Konflik antar-domain / info tidak ada → BERHENTI, sajikan opsi +
   rekomendasi, tanya user.
7. Keputusan final → DECISION-LOG.

## 11.1 Konflik teridentifikasi & resolusinya

| Konflik | Resolusi |
|---|---|
| 09 §10 & 08 §38 server/{actions,services,repositories} vs 11 §6 features/<domain>/ | 11 MENANG untuk kode domain. src/server = infrastruktur lintas domain. (U-01) |
| 04 §28 db/queries vs 11 §28 features/<domain>/queries | 11 menang. src/db hanya schema/migrations/seed/client |
| 09 §16 server/validations vs 11 §26 features/<domain>/validators | Validator domain di feature; primitive shared di server/validations |
| 04 §27 folder schema (core/education) vs 11 ownership | Schema ikut owner domain (identity/administration/academic/...). Catat deviasi |
| 02 §9 & PROD-ARCH features/users, features/reports vs 11 §7 | 11 menang: users→identity+administration; reports→governance; +academic, media |
| 07 §17 contoh "Aktif Belajar" vs 10 §5A sentence case | 10 MENANG: "Aktif belajar", "Tinjauan program" |
| Session 02 §11 & PROD-ARCH single-role vs 05 §20 multi-role | 05 menang (didukung 08 §10, 09 §18) |
| users.role tunggal (04 §7) vs user_roles (05 §19) | 05 menang; users.role dihapus (U-09) |
| users.password_hash (04 §7) vs Supabase Auth (13) | 13 menang; password_hash dihapus; provisioning Admin API (D-26) |
| PK UUID v7 semua (04 §4) vs auth uid (13) | 13 menang untuk users.id (v4); entitas domain tetap v7 (D-25) |
| Auth.js (02 §11, 08 §10, 09 §18, 05 §20-23, PROD-ARCH) vs Supabase Auth (13) | 13 menang untuk SUMBER IDENTITAS; kontrak session 05 §20 TETAP; otorisasi tetap 05 (D-20) |
| NEXTAUTH_* (PROD-ARCH) / AUTH_SECRET,AUTH_URL (02 §14) vs Supabase env (13) | 13 menang; env Appendix A; AUTH_* tidak dipakai |
| Supabase = tooling dev (02 §5, §14) vs Supabase = platform (13) | 13 menang (D-17) |
| Docker Compose app+postgres+supabase+mailhog (02 §14, PROD-ARCH) vs Vercel+CLI (13) | 13 menang: Docker hanya internal Supabase CLI lokal; app prod di Vercel tanpa container; Mailpit ganti Mailhog (D-24) |
| "Next.js 17+" (PROD-ARCH) | Rilis stabil terbaru saat eksekusi; catat versi |
| next-pwa vs kompatibilitas | Evaluasi @serwist/next; alternatif hanya approval (U-07) |
| UUID v7 PostgreSQL 17 | Generate application layer; catat |
| Queue 08 §28 vs 06 §12 | Superset 06 + operationId (09 §28) |
| Connectivity 06 (RECONNECTING) vs 08 (SYNCING) | Gabung ONLINE/OFFLINE/RECONNECTING/SYNCING |
| lib/validation (PROD-ARCH) vs server/validations (09 §16) | 09 menang: src/server/validations |
| Urutan Validation vs Authorization (09 §4 vs §15) | Zod parse di entry; otorisasi lolos SEBELUM eksekusi bisnis |
| StorageManager + PUT /api/state (existing) vs 08 §3 single source | HAPUS total; jangan di-port (temuan §3.2 #1) |
| Role switcher client (existing UI-2) vs 05 §22 | Keluar dari workspace prod; usulan "Lingkungan Uji Coba" dev-only (U-08) |
| Nama tabel existing student_development_notes/publication_posts/service_reports/report_approval_logs vs 04 kanonik | Fresh schema nama kanonik 04; DB lama read-only (temuan #5) |
| Terminologi existing siswa/rombel/alpa vs 10 §5,§7,§24 | 10 WAJIB: peserta didik/kelas/"Tidak hadir" (temuan #7) |
| Administration read-only (existing UI-9) vs 05 §16 dynamic 5-tab | New-build Fase 8 (temuan #8) |
| Audit immutability app-level (existing) vs 04 §23 | Trigger DB (Appendix D) (temuan #6) |
| Tidak ada PWA/offline (existing) vs 06 | New-build Fase 5 (Tier A) |
| Tidak ada testing (existing) vs 11 §38 | New-build per fase (U-06) |
| RLS sebagai pengganti RBAC (risiko salah kaprah Supabase) vs 05 | 13: RLS lapis kedua deny-by-default; RBAC 05 lapis utama (D-22) |
| supabase-js read dari client (risiko) vs 08 §3, 09 §41 | DILARANG; Drizzle satu-satunya jalur (BLOK A §Supabase) |
| getSession() untuk otorisasi (risiko) vs 05 §20 | DILARANG; getUser() + resolveAccess per-request (D-20) |
| Dua engine migrasi (risiko drift) vs 04/13 | Drizzle Kit satu-satunya, incl. objek platform (D-21) |

## 11.2 Keputusan FINAL (terkunci oleh user — tidak perlu approve ulang)

D-17 Supabase = platform penuh; dev = CLI lokal paritas prod.
D-18 Model key & env (publishable/secret; pooler 6543 vs direct 5432).
D-19 Storage = bucket private + signed URL server.
D-20 Auth = Supabase Auth (identitas); otorisasi tetap 05; session 05 §20 utuh;
     resolveAccess per-request; getUser() bukan getSession().
D-21 Satu engine migrasi: Drizzle Kit (incl. RLS/trigger/bucket/grants).
D-22 RLS deny-by-default lapis kedua; hardening function tiap migration tabel.
D-23 Vercel regions sin1 + Supabase Cloud ap-southeast-1 (Singapore).
D-24 Mailpit (CLI) menggantikan Mailhog.
D-25 users.id = auth.users.id (v4); entitas domain UUID v7.
D-26 users.password_hash dihapus; provisioning via Admin API; enable_signup=false.
D-27 Vercel function region sin1 (co-location).
D-28 Middleware edge-safe: refresh + gate kasar; tanpa Drizzle; authz di Node.
D-29 TTL signed URL > TTL cache/revalidate halaman.
D-30 Sync offline client-driven (Service Worker); tanpa worker server常驻.

## 11.3 Keputusan USULAN (WAJIB approve user sebelum/tanpa fase terkait)

| ID | Topik | Rekomendasi | Fase |
|---|---|---|---|
| U-01 | Struktur folder: 11 menang (features/<domain>) atas 09/08/04 folder-by-type; src/server = infra lintas domain | Setuju (11 otoritas ownership) | 1 |
| U-02 | Owner programs → Organization | Setuju | 2 |
| U-03 | Owner class_enrollments → Academic; ditulis via AcademicService | Setuju | 2,4 |
| U-04 | Ledger sync_operations → infrastruktur shared platform (src/db/schema/platform + src/server/sync) | Setuju | 2,5 |
| U-05 | Versioning development notes: B-lite (tabel revisions, latest=current) vs A (kolom version optimistic) | Rekomendasi B-lite | 2,5 |
| U-06 | Test runner: Vitest unit + integration via supabase lokal di CI | Setuju | 1, semua |
| U-07 | Library PWA: @serwist/next (evaluasi Fase 1) vs next-pwa | Rekomendasi @serwist/next | 1 |
| U-08 | Role switcher prototype → area "Lingkungan Uji Coba" dev-only gated PLATFORM_ADMIN | Setuju | 8 |
| U-09 | Hapus users.role & users.password_hash (05 + 13 menang) | Setuju | 2,3 |
| U-10 | SoD media uploader ≠ reviewer: WAJIB untuk media yang jadi public | Rekomendasi WAJIB | 6 |
| U-11 | Seed demo auth.users: insert langsung lokal (CLI) vs script Admin API; prod hanya bootstrap Admin API | Lokal insert OK, prod Admin API | 2,8 |
| U-12 | Bootstrap admin pertama via script Admin API (tidak lewat UI publik) | Setuju | 8,10 |

Rule: Dokumen otoritas 02–11 + 13 + UI-UX + PROD-ARCH LENGKAP. Tidak ada
fallback arsitektur. Kekurangan hanya referensi parity/aset → tanyakan,
jangan mengarang. Baseline existing sudah teraudit (§3); tidak perlu re-audit.

---

# 12. Definition of Done — Global

Functional:
✅ Pendaftaran ✅ Verifikasi ✅ Penempatan ✅ Kehadiran
✅ Perkembangan Peserta ✅ Persetujuan ✅ Governance ✅ Publikasi
✅ Jejak Audit

Design (03, UI-UX, 07):
✅ UX Parity UI-1…UI-12 ✅ Design Identity preserved
✅ 4-layer component system ✅ Tidak generik / template-looking
✅ Design Gates lulus di semua halaman

Bahasa (10 §29):
✅ Terminologi konsisten ✅ Status konsisten ✅ Tombol konsisten
✅ Validasi & error konsisten ✅ Governance language konsisten
✅ Kapitalisasi konsisten ✅ Tidak ada istilah teknis bocor ke UI

Domain (11 §42):
✅ Boundaries jelas ✅ Ownership jelas ✅ Struktur folder jelas
✅ Dependency rules jelas ✅ Service & repository rules jelas
✅ Event rules jelas ✅ Offline integration jelas ✅ Testing ownership jelas
✅ Multi-organization ready

Security (05):
✅ Dynamic roles & permissions ✅ Overrides ✅ Scopes ✅ Policy/SoD
✅ Server-side authorization penuh ✅ Enforcement persetujuan
✅ Audit append-only (DB trigger) ✅ Privacy & klasifikasi terlindungi
✅ Revoke efektif tanpa deploy (resolveAccess per-request)

State & API (08, 09):
✅ Single source of truth (tanpa sisa StorageManager/api-state)
✅ Server-first ✅ URL state ✅ No state duplication
✅ Kontrak result & error ✅ Zod terpusat ✅ Audit per mutasi
✅ Idempotent sync

Offline (06):
✅ Installable ✅ Offline shell ✅ Offline kehadiran & catatan
✅ Sync queue + client-driven background sync ✅ Conflict handling
✅ Label sync jujur ✅ Secure offline storage ✅ Tier C online-only

Database (04):
✅ Seluruh domain ✅ FK & index ✅ Multi-org ready ✅ Soft delete
✅ Nama kanonik 04 (bukan drift existing) ✅ Constraint ditegakkan

Platform (13 / ADR-13):
✅ Supabase Auth adapter (getUser, bukan getSession)
✅ Session kontrak 05 §20 utuh
✅ Drizzle satu-satunya jalur data & satu engine migrasi (incl. objek platform)
✅ RLS deny-by-default lapis kedua; hardening tiap migration tabel
✅ Bucket media private + signed URL server (TTL > cache)
✅ Upload createUploadUrl/confirmUpload
✅ Pooler prepare:false; DIRECT_URL migrasi; service key server-only
✅ Middleware edge-safe tanpa Drizzle; Vercel sin1; Cloud Singapore
✅ users tanpa password_hash/role; provisioning Admin API; enable_signup=false
✅ Seed tidak di prod; migrasi di CI; PITR/backup prod aktif
✅ Verifikasi pasca-deploy Appendix E lulus

Testing (11 §38):
✅ Service/policy/validation tests semua feature
✅ Integration tests: Students, Attendance, Governance, RBAC

Technical:
✅ Next.js App Router ✅ Drizzle ✅ PostgreSQL 17 (Supabase) ✅ Vercel
✅ Mobile first 375px ✅ Type-safe ✅ Production deployable
✅ Performance budget (06 §28, 09 §40)

Data:
✅ Tidak ada data produksi → tidak ada data migration
✅ Prototype diarsipkan, tidak dihapus

---

# 13. Final Statement

Dokumen ini mengubah seluruh blueprint PMKI (02–11) + keputusan platform
(13) + hasil audit aplikasi existing menjadi protokol eksekusi bertahap yang
dapat dijalankan AI coding agent tanpa mengorbankan design identity, UX
tervalidasi, bahasa produk, privacy model, governance model, batas domain,
offline integrity, dan integritas data.

Satu fase. Satu tujuan. Satu gate.
Framework mengikuti identitas.
Domains own behavior. Services own rules. Repositories own persistence.
Components own presentation. The database owns the truth.
Identity from Supabase Auth. Authorization from PMKI RBAC.
One Concept = One Official Term.
Less Decoration. More Meaning.

Public is expressive. Workspace is calm.
Data is clear. Children are respected.

---

# APPENDIX A — Environment Contract & Vercel

Dev (Supabase CLI lokal):
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon/publishable dari supabase start>
SUPABASE_SERVICE_ROLE_KEY=<local service/secret dari supabase start>   # SERVER ONLY
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
NODE_ENV=development
SUPABASE_STORAGE_BUCKET=media
MEDIA_SIGNED_URL_TTL=3600
```

Production (Vercel → Environment Variables):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable/anon prod>
SUPABASE_SERVICE_ROLE_KEY=<secret/service prod>        # SERVER ONLY
DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.<ref>:<pw>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_APP_URL=https://<domain>
NODE_ENV=production
SUPABASE_STORAGE_BUCKET=media
MEDIA_SIGNED_URL_TTL=3600
```
Catatan: host pooler (`aws-0-` vs `aws-1-`) berbeda per project — ambil dari
Dashboard → Connect. Project baru memakai publishable/secret (drop-in untuk
anon/service_role); verifikasi versi @supabase/ssr. Key istimewa tidak pernah
NEXT_PUBLIC_. DATABASE_URL runtime wajib prepare:false (transaction pooler
tidak dukung prepared statements). DIRECT_URL session pooler 5432 karena
direct host default IPv6 sedangkan Vercel IPv4.

vercel.json:
```json
{ "regions": ["sin1"], "framework": "nextjs" }
```

---

# APPENDIX B — supabase/config.toml (bagian relevan)

```toml
project_id = "pmki"

[api]
enabled = true
port = 54321
schemas = ["public"]
extra_search_path = ["public", "extensions"]

[db]
port = 54322
shadow_port = 54320
major_version = 17            # samakan dengan project Cloud

[db.seed]
enabled = false               # seed dikelola script Drizzle (dev only)

[studio]
enabled = true
port = 54323

[inbucket]                    # Mailpit — pengganti Mailhog (D-24)
enabled = true
port = 54324

[storage]
enabled = true
file_size_limit = "20MiB"

[auth]
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["http://127.0.0.1:3000/auth/callback"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = false         # provisioning administrator (D-26)

[auth.email]
enable_signup = false
double_confirm_changes = true
enable_confirmations = false  # dev: mudah seed demo; prod = true

[auth.email.template.confirmation]
subject = "Konfirmasi akun PMKI"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.recovery]
subject = "Atur ulang kata sandi PMKI"
content_path = "./supabase/templates/recovery.html"
```
Production wajib: enable_signup=false, enable_confirmations=true, Site URL &
redirect URL domain prod, SMTP produksi, template dari repo.

---

# APPENDIX C — Code Skeleton (referensi Fase 1 & 3)

src/db/client.ts
```ts
import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,                 // transaction pooler (D-18)
  max: process.env.NODE_ENV === "production" ? 5 : 10,
  idle_timeout: 20,
  connect_timeout: 10,
});
export const db = drizzle(client, { schema });
export type Db = typeof db;
```

drizzle.config.ts
```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL! },
  strict: true,
  verbose: true,
});
```

src/server/auth/supabase-server.ts
```ts
import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          // Server Component tidak menulis cookie; refresh di middleware.
          try { list.forEach(({ name, value, options }) => store.set(name, value, options)); }
          catch {}
        },
      },
    },
  );
}
```

src/server/auth/session.ts
```ts
import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "./supabase-server";
import { resolveAccess } from "@/features/administration"; // public API (11 §6)
import type { SessionUser } from "@/types/session";

export const getCurrentSession = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser(); // BUKAN getSession() (D-20)
  if (error || !user) return null;
  const access = await resolveAccess(user.id);   // role→grant→revoke + memberships, per-request
  if (!access.active) return null;
  return {
    id: user.id,
    roles: access.roles,
    permissions: access.permissions,            // hasil resolusi, bukan klaim JWT
    memberships: access.memberships,
  };
});
```

src/middleware.ts (edge-safe, D-28)
```ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  // Gate KASAR saja. Permission/Scope/Policy dievaluasi di Node (05 §3).
  if (!user && req.nextUrl.pathname.startsWith("/workspace")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|images|sw.js|manifest.webmanifest).*)"],
};
```
Catatan: resolveAccess tinggal di features/administration/services;
src/server/auth hanya orkestrasi (11 §22). memberships diambil via
organization service (cross-domain via service, 11 §21).

---

# APPENDIX D — Custom Migration Hardening (0001_platform_hardening.sql)

Dijalankan identik di lokal & Cloud. SETIAP migration pembuat tabel baru
WAJIB diakhiri `SELECT public.pmki_harden_tables();`.

```sql
-- 1. Future tables tidak auto-terbuka ke Data API
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

-- 2. Fungsi hardening idempotent
CREATE OR REPLACE FUNCTION public.pmki_harden_tables() RETURNS void AS $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t.tablename);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT public.pmki_harden_tables();
-- Tanpa policy = DENY untuk anon/authenticated.
-- Aplikasi (owner via Drizzle) tetap jalan; server menegakkan 05. (D-22)

-- 3. Audit & workflow log append-only untuk SEMUA role (termasuk service key)
CREATE OR REPLACE FUNCTION public.pmki_forbid_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Tabel % bersifat append-only', TG_TABLE_NAME
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.pmki_forbid_mutation();

DROP TRIGGER IF EXISTS report_workflow_logs_immutable ON public.report_workflow_logs;
CREATE TRIGGER report_workflow_logs_immutable
  BEFORE UPDATE OR DELETE ON public.report_workflow_logs
  FOR EACH ROW EXECUTE FUNCTION public.pmki_forbid_mutation();

-- 4. Storage: bucket private, tanpa akses anon
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT (id) DO UPDATE SET public = false;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- Tanpa policy untuk anon/authenticated → hanya server (secret key) yang akses. (D-19)
```

---

# APPENDIX E — Deploy Runbook & Verifikasi Pasca-Deploy

Setup sekali:
1. Supabase project region Singapore, PG 17, aktifkan PITR/backup.
2. Vercel project, regions sin1, env Appendix A (Production + Preview).
3. Supabase Auth prod: Site URL & redirect URL domain prod,
   enable_signup=false, enable_confirmations=true, SMTP produksi,
   template dari repo.
4. Bootstrap admin pertama via script Admin API
   (scripts/bootstrap-admin.ts): user.create → public.users +
   PLATFORM_ADMIN + membership. Tidak lewat UI publik (U-12).

Setiap rilis:
```bash
# 1) CI membuktikan migrasi di lokal/ephemeral
supabase start && pnpm db:migrate && pnpm db:seed && pnpm test

# 2) Migrasi production (di CI, BUKAN vercel build — D-21)
DIRECT_URL="<pooler 5432 prod>" pnpm drizzle-kit migrate

# 3) Deploy app
vercel deploy --prod
```
Kenapa migrasi di CI: build Vercel bisa diulang/di-cache dan tidak punya
transaksi/lock aman untuk DDL. Migrasi forward-only; rollback DB = forward-fix;
insiden data = PITR. Seed tidak pernah ke prod.

Verifikasi pasca-deploy (wajib, isi PLATFORM-VERIFY.md):
```sql
-- anon/authenticated tidak boleh punya grant tabel operasional (harus 0)
SELECT count(*) FROM information_schema.role_table_grants
WHERE grantee IN ('anon','authenticated') AND table_schema='public';

-- audit benar-benar immutable (harus ERROR)
UPDATE public.audit_logs SET description='x'
WHERE id=(SELECT id FROM public.audit_logs LIMIT 1);

-- bucket private (harus false)
SELECT public FROM storage.buckets WHERE id='media';
```
Plus: login → getUser() berhasil; cabut satu permission → langsung ditolak
tanpa redeploy (resolveAccess per-request); media belum review tidak bisa
diakses walau URL diketahui; signed URL TTL > cache; middleware edge tanpa
Drizzle; tidak ada supabase-js read dari client; tidak ada password_hash/role
di public.users; Mailpit tidak ada di prod.

---

# APPENDIX F — Existing → Target Mapping (seed DOMAIN-MAP.md)

| Existing | Target (11 §7) | Aksi |
|---|---|---|
| storage.ts + Express server/ + /api/state | — | HAPUS (jangan di-port) |
| migrations/*.sql (25 tabel, PG16) | db/schema/* per owner domain | REBUILD via Drizzle fresh; DB lama read-only |
| seed-data.ts (5 user, 8 siswa) | db/seed | REBUILD: replikasi Griya Asih + 11 role + registry permission (05 §8–9) + auth.users lokal |
| components/ui/* (13 primitives) | components/ui | PORT + re-theme token; lengkapi (Switch, Tabs, DropdownMenu, Command, Popover, ScrollArea) |
| AppShell, Sidebar, WorkspaceHeader | components/layout | PORT (parity UI-2) |
| OverviewView + patterns/dashboard | queries per domain + (workspace)/dashboard | REBUILD server-first; mental model Orientation→Attention→Upcoming→Recent dipertahankan |
| StudentsView, StudentDetailView | features/students | PORT UI + rebuild data (Server Components, URL state) |
| OrganizationView | features/organization + features/academic | SPLIT: org/unit→organization; kelas/pengajar/jadwal→academic |
| RegistrationForm (wizard 5) | features/students + public | PORT + Server Action + offline queue (06 §18) |
| AttendanceView | features/attendance | PORT UI + rebuild + BARU offline Tier A |
| StudentDevelopmentView | features/development | PORT UI + rebuild + offline + confidential server + versioning (U-05) |
| ConsentMediaView | features/consent + features/media | SPLIT jadi dua domain |
| ReportsApprovalView | features/governance | PORT UI + rebuild workflow (immutable, SoD) |
| PublishingView | features/publishing | PORT + rebuild (status workflow, media eligibility server) |
| AdministrationView (read-only) | features/administration | REBUILD/EXPAND → 5 tab dynamic RBAC + Admin API provisioning |
| AuditLogView | features/audit | PORT UI + DB immutability + event subscriber |
| public/*, Navbar, Footer | features/public | PORT (Fase 9); galeri/berita hanya eligible+published |
| Auth localStorage (pmki_current_user) | features/identity | REBUILD: Supabase Auth + resolveAccess (D-20, D-26) |
| Role switcher (UI-2) | area "Lingkungan Uji Coba" | PINDAH dev-only (U-08) |
| Terminologi siswa/rombel/alpa | 10 kanonik | WAJIB ubah (temuan #7) |

Mapping role demo: Platform Admin→PLATFORM_ADMIN; Ms. Evi→UNIT_COORDINATOR;
Ms. Lilian (Humas)→EDITOR (+ tambah APPROVER untuk SoD); Pak Budi→TEACHER;
Auditor→AUDITOR. Tambah user demo untuk ORG_ADMIN, PROGRAM_COORDINATOR,
VOLUNTEER, REVIEWER, STAKEHOLDER agar RBAC-MATRIX teruji penuh.

---

# APPENDIX G — ADR-13 Ringkas (mirror governance; simpan juga sebagai docs/13)

Status: APPROVED by Product Owner (2026-11-20). Authority: platform &
infrastruktur; mengalahkan 02/PROD-ARCH/08 §10/09 §18/05 §20-23/04 §4,§7
HANYA untuk butir identitas-source, storage, hosting, env, migrasi engine,
RLS, users.id/password_hash. TIDAK menyentuh desain (03/UI-UX), bahasa (10),
domain (11), RBAC logic (05 permission/scope/policy/SoD), offline (06),
komponen (07), state (08 server-first/no dup source), API (09 action-first/
error contract).

Superseded eksplisit: 02 §5 (Auth.js→Supabase Auth identitas); 02 §11
(single-role session→05 §20 multi-role, shape tetap); 02 §14 (Supabase dev-only
→platform; AUTH_*→env Appendix A); 02 §5/§14 self-host→Cloud+CLI; 05 §23 DoD
"Auth.js Integration"→"Supabase Auth adapter + session 05 §20"; 08 §10 & 09 §18
(session dari Auth.js→dari Supabase getUser()+resolveAccess); PROD-ARCH
(NEXTAUTH_*, next-pwa wajib, Next 17+→env Appendix A, PWA lib U-07, versi
stabil); 04 §7 (password_hash & role dihapus); 04 §4 (users.id = auth uid v4).

Invarian: read DB→Repo→Service→Server Component→UI; write UI→Action→Zod→
Auth→Permission→Scope→Policy→Service→Repo→DB→revalidatePath; identity
getUser() (bukan getSession()); permission resolve per-request dari DB
(role→grant→revoke, revoke menang) agar override tanpa deploy; aplikasi
connect sebagai owner (RLS tidak di-FORCE ke owner) — server tegakkan 05,
RLS tahan jalur Data API; service_key bypass RLS tapi TIDAK bypass trigger
→ audit append-only tetap.

Guardrails agent (dilarang): kembalikan Auth.js/NextAuth atau tambah
AUTH_SECRET; supabase-js read operasional dari client; business logic di
Edge Function/stored procedure (kecuali trigger integritas); RLS pengganti
permission/scope/policy; getSession() untuk otorisasi; seed di production;
ubah schema prod via Studio; dua engine migrasi; Drizzle di middleware;
NEXT_PUBLIC_ untuk key istimewa; password_hash/role di public.users.

Open items: U-07 library PWA; U-06 test runner; U-10 SoD media; retention &
PITR prod; keputusan residency jangka panjang (self-host tetap terbuka tanpa
ubah kode karena dev sudah pakai stack Supabase yang sama).
````

---

## Status akhir

**Terkunci (tidak perlu Anda approve ulang):** D-17…D-30 — semua sudah tertanam di BLOK A §Supabase, prompt Fase 1/2/3/6/8/10, tabel konflik §11.1, DoD §12, dan Lampiran A–G.

**Tinggal Anda approve sekali (U-01…U-12, §11.3):** tiap baris sudah saya beri rekomendasi. Yang paling berdampak: **U-01** (struktur folder 11 menang — menentukan lokasi kode sejak baris pertama), **U-05** (versioning catatan perkembangan), **U-06** (test runner, karena 11 §38 kini wajib integration test), **U-07** (library PWA), **U-10** (SoD media wajib/ideal).

**Cara pakai:** simpan file ini apa adanya; pasang §6 (BLOK A) sebagai `AGENTS.md`; jalankan BLOK B + prompt Fase 0 (artefaknya tinggal diformalisasi dari §3, tidak perlu re-audit); approve U-01…U-12; lalu Fase 1.

Opsional tapi saya sarankan: salin §13/Appendix G menjadi `docs/13-SUPABASE-PLATFORM-DECISION.md` agar rantai otoritas di BLOK A punya file nyata untuk dirujuk — meski aturan operatifnya sudah penuh di BLOK A, jadi agent tetap benar walau file 13 belum ada.

Kalau Anda mau, langkah berikutnya saya bisa langsung produce **`migration/DOMAIN-MAP.md`** final (12 domain + ownership + dependency graph + public API + kolom existing→aksi dari Appendix F) supaya Fase 0 menutup dengan artefak itu sudah jadi.