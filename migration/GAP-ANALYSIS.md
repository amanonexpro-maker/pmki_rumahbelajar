# GAP-ANALYSIS — Prototipe Existing vs Target Production Architecture

**Tanggal:** 2026-11-20  
**Fase:** FASE 0 — Formalisasi Artefak  
**Referensi Otoritas:** `docs/02`, `04`, `05`, `06`, `07`, `08`, `09`, `10`, `11`, serta `AGENTS.md` (ADR-13 / Supabase Platform Rules)

---

## 1. Ringkasan 8 Temuan Kritis Baseline (§3.2)

1. **Snapshot State Anti-Pattern (`StorageManager` + `PUT /api/state`):** Prototipe menyimpan seluruh state di `localStorage` lalu mengirim full JSON snapshot ke Express `PUT /api/state`. Target mewajibkan PostgreSQL sebagai satu-satunya source of truth dengan Server Actions & mutasi granular per-entitas.
2. **Auth Simulasi Tanpa Sesi Nyata (`pmki_current_user`):** Prototipe mengganti user via dropdown `localStorage` tanpa autentikasi. Target mewajibkan Supabase Auth (`supabase.auth.getUser()`, `enable_signup=false`, tanpa `users.password_hash`).
3. **RBAC Statis & Client-Trusting:** Role-permission di-hardcode di `src/permissions/can.ts` dan dicek di React UI saja (`can(currentUser, ...)`). Target mewajibkan Dynamic RBAC dari DB (Role → Grant Overrides → Revoke Overrides, Revoke menang) yang dievaluasi per-request di Server Action/Service + Policy Layer (SoD, klasifikasi).
4. **Arsitektur Page/Type-Driven, Bukan Domain-Driven:** Prototipe mengelompokkan kode berdasarkan tipe teknis (`src/components/dashboard/*`, `src/services/storage.ts` God Service). Target mewajibkan Modular Monolith 12 domain (`features/<domain>/{actions,services,repositories,permissions,validators,queries,hooks,types,components,index.ts}`).
5. **Nihil Offline / PWA Strategy:** Prototipe hanya punya `localStorage` tanpa Service Worker, tanpa IndexedDB draft/queue, tanpa `operationId` idempotency, dan tanpa resolusi konflik.
6. **Nihil Automated Testing & Test Runner:** Prototipe belum memiliki test suite (unit service, policy, validation, maupun integration test domain kritis).
7. **Ketidaksesuaian Terminologi & Kapitalisasi (`10-CONTENT-MICROCOPY-GUIDE.md`):** Masih ditemukan istilah `Siswa`, `Rombel`/`Rombongan Belajar`, `Guru`, `Audit Trail`, `Overview/Programs/Content/Reports/Administration` (navigasi Inggris), serta Title Case pada tombol/label/status yang seharusnya Sentence case.
8. **Platform & Database Belum Production-Ready:** Prototipe memakai Express + `pg` + raw SQL di Docker lokal (port 5433) tanpa Drizzle ORM, tanpa RLS deny-by-default, tanpa trigger append-only DB untuk audit/workflow logs, dan tanpa Supabase Storage signed URL.

---

## 2. Gap Analysis Per Dokumen Otoritas

### A. `docs/02-NEXTJS-PRODUCTION-BLUEPRINT.md` (App Router & Hosting)
| Aspek | Kondisi Existing | Target Production | Aksi Gap |
| :--- | :--- | :--- | :--- |
| Framework | Vite 8 + React 19 SPA (`src/App.tsx`) | Next.js 15+ App Router (`apps/web/`) | Build paralel di `apps/web/` |
| Routing | State-based (`appMode`, `dashboardView`, `publicTab`) | File-based App Router (`(public)`, `(workspace)`, `(auth)`) dengan URL nyata | Migrasi ke route groups + URL params |
| Rendering | 100% Client-Side Rendering | Server Components default; Client Component hanya interaktivitas/offline | Refactor fetch data ke Server Components |
| Hosting & Region | Lokal Vite + Express | Vercel (function region `sin1` Singapore) | Konfigurasi `vercel.json` / project settings |
| Middleware | Tidak ada | Edge-safe middleware: refresh cookie Supabase Auth + gate kasar (tanpa Drizzle) | Buat `middleware.ts` |

### B. `docs/04-DRIZZLE-DATABASE-ARCHITECTURE.md` + ADR-13 (`AGENTS.md`)
| Aspek | Kondisi Existing | Target Production | Aksi Gap |
| :--- | :--- | :--- | :--- |
| ORM & Migration Engine | Raw SQL (`migrations/001_*.sql`, `002_*.sql`) + `pg` Pool | **Drizzle ORM** + `drizzle-kit` sebagai SATU-SATUNYA engine migrasi (termasuk RLS, trigger, grants) | Tulis skema Drizzle per domain + forward-only migrations |
| Database Target | PG16 Docker port `5433` (`pmki_terpadu`) | Fresh PG17 via **Supabase CLI** lokal (`supabase start`) → Supabase Cloud Singapore | Setup Supabase CLI, DB lama 5433 jadi read-only referensi |
| Primary Key | String ID manual (`stud-1`, `user-evi`) | UUID v7 untuk entitas domain; `users.id = auth.users.id` (UUID v4) | Migrasi skema ID ke UUID |
| Kolom Umum & Soft Delete | Sebagian tabel tanpa `created_by`, `updated_by`, `archived_at` | Wajib `id, created_at, updated_at, created_by, updated_by` + `archived_at/by` | Standarisasi kolom umum di Drizzle |
| Audit & Workflow Logs | Bisa di-overwrite via `PUT /api/state` | `audit_logs` & `report_workflow_logs` **append-only** (enforce DB trigger tolak UPDATE/DELETE semua role) | Buat DB trigger di migration |
| Keamanan Tabel & RLS | Tidak ada RLS; semua akses via `pmki_admin` | RLS **deny-by-default** di semua tabel operasional + `SELECT public.pmki_harden_tables();` di akhir migration | Buat fungsi hardening & migration RLS |
| Koneksi Runtime vs Migrasi | Single `pg.Pool` | Runtime: transaction pooler `6543` (`prepare: false`); Migrasi: `DIRECT_URL` session pooler `5432` | Konfigurasi `DATABASE_URL` & `DIRECT_URL` |

### C. `docs/05-AUTHORIZATION-RBAC-BLUEPRINT.md` + ADR-13
| Aspek | Kondisi Existing | Target Production | Aksi Gap |
| :--- | :--- | :--- | :--- |
| Identity Source | `initialUsers` statis + `localStorage` | **Supabase Auth** (`supabase.auth.getUser()`), `enable_signup=false`, provisioning via Admin API | Implementasi `identity` + `administration` |
| Kontrak Session | Objek `User` flat (1 role per user) | `{ id, roles: string[], permissions: string[], memberships: [{ organizationId, serviceUnitId, programId? }] }` | Buat session adapter di `src/server/` |
| Resolusi Permission | Statis `ROLE_PERMISSIONS` di `src/permissions/can.ts` | Dinamis dari DB per-request: Role → Grant Overrides → Revoke Overrides (Revoke selalu menang) | Bangun tabel `roles`, `permissions`, `role_permissions`, `user_roles`, `user_permission_overrides` |
| Enforcement Layer | Hanya di UI React | Server-side: Authentication → Permission → Scope → Policy (`can()` + `PolicyEngine`) | Wajib di setiap Server Action & Route Handler |
| Separation of Duties | Sebagian dicek di UI (`ReportsApprovalView`) | Policy Engine server-side di atas admin/role (pembuat laporan ≠ penyetuju; penyusun konten ≠ peninjau privasi) | Implementasi Policy Engine |
| Role Coverage Demo | Hanya 5 user demo (`PLATFORM_ADMIN`, `UNIT_COORDINATOR`, `PROGRAM_COORDINATOR`, `TEACHER`, `APPROVER`) | 11 role resmi (`05 §6`) + SoD lengkap (`EDITOR`, `REVIEWER`, `AUDITOR`, dll.) | Tambah user demo di seed dev |

### D. `docs/06-PWA-OFFLINE-STRATEGY.md`
| Aspek | Kondisi Existing | Target Production | Aksi Gap |
| :--- | :--- | :--- | :--- |
| Service Worker & Manifest | Belum ada | PWA Manifest, icons, Service Worker (cache shell & Tier B assets) | Tambah konfigurasi PWA |
| Tier A (Offline Write) | Tidak ada (butuh koneksi ke `/api/state` atau hanya `localStorage`) | **Attendance**, **Development Notes**, **Student Lookup** via IndexedDB abstraction service | Bangun IndexedDB store & queue service |
| Sync & Idempotency | Tidak ada | Client/SW-driven sync ke `POST /api/sync` dengan `operationId` unik (duplikat ditolak server) | Buat `/api/sync` + tabel idempotency/sync log |
| Conflict & Audit Offline | Tidak ada | Attendance = server wins + manual review; Development Notes = versioned; simpan `originalTimestamp` + `syncTimestamp` | Implementasi version & conflict handler |
| Label Sync Jujur | Tidak ada | "Disimpan lokal", "Belum tersinkronisasi", "Menunggu sinkronisasi", "Tersinkronisasi", "Sinkron terakhir: [waktu]" | Komponen status sinkronisasi |

### E. `docs/07-COMPONENT-ARCHITECTURE.md`
| Aspek | Kondisi Existing | Target Production | Aksi Gap |
| :--- | :--- | :--- | :--- |
| Layering | Sudah 4 lapis (`ui` → `layout` → `patterns` → `dashboard`/`public`) | 4 lapis (`ui` → `compositions` → `patterns` → `features/<domain>/components`), terdaftar di `COMPONENT-REGISTRY.md` | Pertahankan UI primitives; sesuaikan boundary Client/Server Component |
| Business Logic di UI | Banyak logic bisnis, filter, dan panggilan `storage.*` langsung di komponen React | Komponen UI murni presentasi/interaksi; mutasi via Server Actions, read via Server Components | Ekstrak logic ke Services & Queries |

### F. `docs/08-STATE-MANAGEMENT.md`
| Aspek | Kondisi Existing | Target Production | Aksi Gap |
| :--- | :--- | :--- | :--- |
| Source of Truth | `StorageManager` in-memory + `localStorage` | PostgreSQL via Server Components & `revalidatePath()` | Hapus `StorageManager` di `apps/web/` |
| Search/Filter/Tab State | React `useState` lokal di `StudentsView`, `AuditLogView`, dll. | URL Query Params (`?search=&status=&page=&tab=`) | Migrasi ke `useSearchParams` / Server `searchParams` |
| Form Management | `useState` manual per field | **React Hook Form + Zod** + Server Actions | Refactor form ke RHF + Zod |
| Global Context | Tidak ada (prop drilling) | Hanya `ThemeContext`, `SessionContext`, `ConnectivityContext` (dilarang context data/permission duplikatif) | Buat 3 context minimal |

### G. `docs/09-API-ARCHITECTURE.md` + ADR-13
| Aspek | Kondisi Existing | Target Production | Aksi Gap |
| :--- | :--- | :--- | :--- |
| Mutasi Data | `PUT /api/state` (snapshot penuh) | Next.js **Server Actions** tipis per domain dengan Zod parse + authz + audit | Buat Server Actions per domain |
| Route Handlers | Express endpoints `/api/state` | Route Handlers hanya untuk: upload (`/api/uploads/*`), offline sync (`/api/sync`), webhook/health | Buat Route Handlers minimal |
| Response Contract | Tidak seragam (`204`/`500` atau return langsung) | `{ success: true, data } \| { success: false, error: { code, message } }` dengan error code `09 §24` | Buat shared result helper |
| Media Upload & Signed URL | URL statis `/images/gallery/*` | Supabase Storage private bucket (`media`): `createUploadUrl` → client PUT → `confirmUpload`; signed URL server-only (TTL > cache) | Implementasi upload processor & signed URL |

### H. `docs/10-CONTENT-MICROCOPY-GUIDE.md`
| Aspek | Kondisi Existing | Target Production | Aksi Gap |
| :--- | :--- | :--- | :--- |
| Terminologi Kanonik | Masih memakai `Siswa`, `Rombel`/`Rombongan Belajar`, `Guru` di internal UI, `Audit Trail`, label nav Inggris (`Overview`, `Programs`, `Content`, `Reports`, `Administration`) | `Peserta Didik`, `Kelas`, `Pengajar` (publik: `Pengajar Relawan`), `Kehadiran`/`Presensi`, `Perkembangan Peserta`, `Jejak Audit`, `Administrasi` | Lakukan terminology sweep (lihat `TERMINOLOGY-CHECKLIST.md`) |
| Kapitalisasi | Banyak tombol, header tabel, dan status memakai Title Case | **Sentence case** standar UI; Title Case HANYA untuk navigasi & page title | Perbaiki kapitalisasi seluruh UI |
| Central Status & Messages | Tersebar per view (`STATUS_CONFIG` duplikat di `StudentsView` & `StudentDetailView`) | Terpusat di `src/lib/status.ts` dan `src/lib/messages.ts` | Sentralisasi mapping status & pesan error |

### I. `docs/11-DOMAIN-DRIVEN-FEATURE-ARCHITECTURE.md`
| Aspek | Kondisi Existing | Target Production | Aksi Gap |
| :--- | :--- | :--- | :--- |
| Struktur Modul | `components/dashboard/*` memanggil `storage.ts` langsung | 12 domain di `features/<domain>/` + `features/public/`, masing-masing punya `index.ts` sebagai Public API | Bangun struktur 12 domain & `DOMAIN-MAP.md` |
| Domain Events | Tidak ada (audit log dipanggil manual di dalam `storage.ts`) | Domain events eksplisit (`StudentRegistered`, `StudentVerified`, `StudentPlaced`, `AttendanceRecorded`, `DevelopmentNoteCreated`, `ConsentUpdated`, `ReportApproved`, `PublicationPublished`) | Implementasi event bus / dispatcher in-process |
| Testing | Tidak ada test sama sekali | Wajib: service, policy, validation tests per feature + integration tests (Students, Attendance, Governance, RBAC) | Setup test runner (`U-06`) & tulis test per fase |

