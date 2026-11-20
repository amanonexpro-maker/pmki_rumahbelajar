# MIGRATION-STATE — Status Terkini Migrasi PMKI Platform

**Terakhir Diperbarui:** 2026-11-20  
**Fase Aktif:** **10 — Parity Audit, Hardening, Platform Verify & Cutover (`UI-3`, `UI-10`, `UI-11`, Final QA)**  
**Status Proyek:** **`PRODUCTION READY (SIGN-OFF FINAL PRODUCT OWNER DITERIMA — 2026-11-20)`**  
**Blocker:** Tidak ada  
**Keputusan Pending User:** Tidak ada (Sign-Off Final telah diberikan)  
**Tag Arsip Prototipe:** `prototype-final-v1` (Prototipe referensi parity tetap terjaga utuh sesuai `D-16`)

---

## 1. Ringkasan Progress Fase

| Fase | Nama Fase | Status | Catatan Verifikasi |
| :-: | :--- | :-: | :--- |
| 0 | Formalisasi Artefak (`migration/`) | `DONE` | 8 artefak lengkap, `D-01…D-30` & `U-01…U-12` berstatus `FINAL` |
| 1 | Fondasi Next.js, Design System, Shell & PWA Baseline | `DONE` | 19 UI primitives, 7 layout shell, 4 compositions, 12 patterns, PWA shell, Supabase lokal PG17 aktif |
| 2 | Database (Fresh Drizzle PG17 + Hardening + Dev Seed) | `DONE` | 32 tabel domain, `pmki_harden_tables()`, trigger append-only, bucket `media` private, seed idempotent 11 user |
| 3 | Identity (Supabase Auth) & Dynamic RBAC | `DONE` | `getCurrentSession()` (`getUser()`), `resolveAccessCached()`, `can()`/`authorize()`/`canAccessConfidential()`, `/auth/login`, `(workspace)` guard, `RBAC-MATRIX.md`, 39/39 test PASS |
| 4 | Academic, Students & Registration (`UI-4`, `UI-5`, `UI-6`) | `DONE` | `AcademicService`, `StudentService`, `GuardianService` (`CONFIDENTIAL` stripping), `RegistrationService`, `PlacementService`, URL state `/workspace/students`, `/pendaftaran`, 49/49 test PASS |
| 5 | Attendance, Development + Offline Engine (`UI-7`) | `DONE` | `lib/offline` (IndexedDB), `useOfflineQueue` + `useDraftRecovery`, `/api/sync` idempoten, `AttendanceService` (`Server Wins + Manual Review`), `DevelopmentService` (`confidential=true` server-filtered, versioned), `OFFLINE-MATRIX.md`, 65/65 test PASS |
| 6 | Consent, Media (Signed) & Publishing (`UI-8`) | `DONE` | `ConsentService`, `MediaService` (3-step upload ke bucket privat `media`, signed read URL `TTL 3600s > cache 300s`, SoD `uploader ≠ reviewer`), `PublishingService` (`DRAFT → PRIVACY_REVIEW → APPROVED → PUBLISHED → ARCHIVED`, SoD `author ≠ publisher`), 80/80 test PASS |
| 7 | Governance (Reports & Approval Workflow) (`UI-8`) | `DONE` | `GovernanceService` (`DRAFT → PROGRAM_REVIEW → UNIT_VALIDATION → ORGANIZATION_APPROVAL → APPROVED / REJECTED`), SoD `createdBy ≠ validator/approver` dengan pesan kanonik `10 §23`, append-only `report_workflow_logs` + `DecisionHistory`, 87/87 test PASS |
| 8 | Audit + Administration (Dynamic RBAC) (`UI-9`) | `DONE` | `/workspace/audit` (`Jejak Audit` & `Riwayat Audit` baca-saja append-only), `/workspace/administration` 5 tab (`Pengguna` + Provisioning via Supabase Admin API, `Peran` + peran kustom tanpa coding, `Hak Akses`, `Override akses` Grant/Revoke instan, `Penetapan lingkup`, + dev-only `Lingkungan Uji Coba`), 96/96 test PASS |
| 9 | Public Experience (`UI-12`) | `DONE` | `features/public` (`PublicHero` 96px, `PublicMissionSection` 80px, `PublicProgramsSection` 64px, `PublicCommunityStorySection` 96px, `PublicRegistrationCtaSection` 80px, `PublicNavbar`, `PublicFooter`), rute `/`, `/program`, `/gallery`, `/news`, `/pendaftaran`, `/registration`; `Newsreader` khusus publik; 105/105 test PASS |
| 10 | Parity Audit, Contextual Dashboard (`UI-3`), Hardening, Platform Verify & Cutover (`UI-10`, `UI-11`) | `DONE` | Contextual Dashboard `/workspace` (`UI-3`), `PARITY-CHECKLIST.md` **12/12 `TERVERIFIKASI`**, Domain & Terminology & Security & ADR-13 Audit otomatis (`parity-hardening-audit.test.ts`), `operational-telemetry.ts`, `prod-bootstrap-admin.ts`, `CUTOVER-RUNBOOK.md`, **30/30 file test = 110/110 test PASS** |
| 11 | Mobile Polish & UX Recomposition (Sub-sesi A: Global Layout, Typography & Density) | `DONE` | Tipografi PageHeader/EntityHeader tajam (kontras ≥ 1.5x di mobile), kartu list maksimal 3-4 baris esensial (nama, status, kelas, aksi), eliminasi shadow pada kartu statis, breathing room form (space-y-5/6, padding 44px touch target), Design Gates 1-5 lolos visual 375px |
| 11b | Mobile Polish & UX Recomposition (Sub-sesi B: Dashboard Orientation & Public Rhythm) | `DONE` | Dashboard strip snap scroll horizontal (78% peek visual cue), aksen visual tenang zona "Perlu Perhatian" (`bg-warning-soft/30 border-l-4 border-warning` + thumb CTA), simplifikasi jadwal belajar & pembatasan feed aktivitas (maks 3), ritme editorial proporsional publik (Hero 64px mobile / Section 48px mobile + `text-balance`), galeri CLS = 0 (`aspect-4/3` stabil), banner konektivitas non-invasif auto-dismiss |
| 11c | Mobile Polish & UX Recomposition (Sub-sesi C: Interactive States, Feedback & Motion Integrity) | `DONE` | Standarisasi tactile press feedback (`active:scale-[0.985]`/`[0.96]`, `--motion-fast` 120ms) pada button, checkbox, switch, tabs; loading skeleton kontekstual merefleksikan layout akhir (students, attendance, dashboard snap); motion tokens Radix 150ms/200ms cubic-bezier; universal reduced-motion WCAG AA; feedback banner & toast tap-to-dismiss safe-area bottom |
| 12 | Integrasi Aset Branding Vektor Final | `DONE` | `pmki_app_icon.svg` terintegrasi di PWA manifest (`maskable any`) & root layout favicon/apple icon; `pmki_logo.svg` terpasang di Navbar, Footer, Sidebar, Mobile Nav, dan Login Card dengan alt text deskriptif; `pmki_og_image.svg` aktif di OpenGraph & Twitter Cards (`summary_large_image`, `metadataBase`); validasi JSON manifest lolos |

---

## 2. Artefak Kunci yang Tersedia
- [INVENTORY.md](file:///d:/projects/pmki_rumahbelajar/migration/INVENTORY.md)
- [GAP-ANALYSIS.md](file:///d:/projects/pmki_rumahbelajar/migration/GAP-ANALYSIS.md)
- [DOMAIN-MAP.md](file:///d:/projects/pmki_rumahbelajar/migration/DOMAIN-MAP.md)
- [PARITY-CHECKLIST.md](file:///d:/projects/pmki_rumahbelajar/migration/PARITY-CHECKLIST.md)
- [TERMINOLOGY-CHECKLIST.md](file:///d:/projects/pmki_rumahbelajar/migration/TERMINOLOGY-CHECKLIST.md)
- [MIGRATION-PLAN.md](file:///d:/projects/pmki_rumahbelajar/migration/MIGRATION-PLAN.md)
- [DECISION-LOG.md](file:///d:/projects/pmki_rumahbelajar/migration/DECISION-LOG.md)
- [COMPONENT-REGISTRY.md](file:///d:/projects/pmki_rumahbelajar/migration/COMPONENT-REGISTRY.md)
- [PLATFORM-VERIFY.md](file:///d:/projects/pmki_rumahbelajar/migration/PLATFORM-VERIFY.md)
- [RBAC-MATRIX.md](file:///d:/projects/pmki_rumahbelajar/migration/RBAC-MATRIX.md)
- [OFFLINE-MATRIX.md](file:///d:/projects/pmki_rumahbelajar/migration/OFFLINE-MATRIX.md)
- [CUTOVER-RUNBOOK.md](file:///d:/projects/pmki_rumahbelajar/migration/CUTOVER-RUNBOOK.md)
