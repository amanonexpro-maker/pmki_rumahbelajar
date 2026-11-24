# TASK.md — Papan Estafet Pengembangan Fitur

> **Peran & Batasan:**
> - **Antigravity IDE (Gemini Pro - Architect & Reviewer):** Mengisi Bagian 1, 2, 3, dan 5. Dilarang mengubah file kode aplikasi.
> - **VS Code (Claude via Cline/Classai - Eksekutor):** Membaca Bagian 1–3, mengeksekusi kode, mencentang checklist Bagian 3, dan mengisi Bagian 4 (Log Perubahan).

---

## 1. Tujuan & Spesifikasi Fitur (Diisi oleh Gemini Pro)

- **Nama Fitur:** FASE 19 — STEP 2 PRIORITAS 4 (P4): `DatePicker` Mobile-Friendly + Normalisasi Label Status + Penutupan Backlog Audit P3
- **Tujuan:**
  Menghadirkan primitif **`DatePicker` mobile-friendly** untuk menggantikan `<Input type="date">` mentah di 4 titik pemakaian (Kehadiran, Dokumentasi, Pendaftaran publik, Ubah profil peserta didik), menormalkan **label kode status** menjadi label kanonik `src/lib/status` (satu sumber), mengekstrak **`SummaryStripSkeleton`** agar kelas strip hanya hidup di satu tempat, dan menutup **seluruh temuan non-blocking audit P3** — **tanpa** menyentuh data, auth, DTO, validasi, maupun logika bisnis.
- **Sifat Pekerjaan:** **PRESENTATIONAL-ONLY.** Nol perubahan DB/seed/permission/sesi/DTO server/dependency. Nol perubahan signature server action & validator (hanya *wiring* presentational di client component). Nilai yang dikirim ke action/URL/validator tetap string `YYYY-MM-DD` — identik dengan perilaku `<input type="date">` hari ini.
- **Ruang Lingkup STEP 2 (posisi P4):**
  | Prioritas | Isi | Status step ini |
  |---|---|---|
  | P1 | `workspace-bottom-nav` + padding `page-container` + koordinasi header | **SELESAI — `APPROVED`** (arsip §6.2) |
  | P2 | `ui/sheet.tsx` varian `side="bottom"` + primitif `form-bottom-sheet` + migrasi dialog form students | **SELESAI — `APPROVED`** (arsip §6.3, commit `35109eb`) |
  | P3 | `mobile-card-list` + `summary-strip` + orientasi/ringkasan header | **SELESAI — `APPROVED`** (arsip §6.4, commit `270189`) |
  | **P4** | `date-picker` + normalisasi label status + backlog audit P3 (R-MIN-1/2, R-MAJ-1/2/3, R-DOK, R-TEST-2) | **DIISI — siap dieksekusi** |
  | P5 | Konsolidasi RBAC (R1–R5) | **DILARANG disentuh** (C5) |

- **Aturan Arsitektural & Koordinasi Teknis (WAJIB):**

  **A. Kontrak `DatePicker` (primitif input tanggal mobile-first)**
  1. Lokasi `src/components/patterns/date-picker.tsx`; **wajib** `"use client"` (memegang ref/id turunan; halaman pemakainya sudah client component). Dilarang menambah dependency (`react-day-picker`, `date-fns`, dsb.).
  2. Props **wajib** (persis): `id: string`, `value: string` (`YYYY-MM-DD` atau `""`), `onChange: (value: string) => void`, `name?: string`, `label?: string`, `hint?: string`, `error?: string`, `required?: boolean`, `disabled?: boolean`, `min?: string`, `max?: string`, `className?: string`, `containerClassName?: string`, `placeholder?: string`.
  3. **Dua presentasi, satu nilai (ambang `md`/768px):**
     - `< 768px`: field tampilan **`readOnly`** berlabel Indonesia via `formatToIndonesianStandard` (`@/utils/date-formatter`) + tombol kalender `Button size="icon" variant="secondary"` (`min-h-11`, `aria-label="Pilih tanggal"`, `aria-controls` → id input native). Native `Input type="date"` dipakai sebagai **lapisan sentuh fungsional** (`absolute inset-0 h-full w-full opacity-0` di dalam wadah `relative`) — tap di mana pun membuka *date picker* native OS (tanpa `useMediaQuery`/`matchMedia`, tanpa `suppressHydrationWarning` baru).
     - `≥ 768px` (`hidden md:block`): native `Input type="date"` **terlihat normal** = perilaku hari ini; field tampilan Indonesia `md:hidden`.
  4. **Id unik per instance (preseden P2 R1/R2):** `const generatedId = React.useId()`; id terhitung = `id` bila diberikan, jika tidak `generatedId`. Id turunan `-display` (field teks) & `-native` (input tanggal); `htmlFor`, `aria-describedby` (hint/error), `aria-invalid`, dan `aria-controls` **wajib** merujuk id terhitung itu. Dilarang id literal global berulang.
  5. **Satu sumber kebenaran nilai:** hanya satu `onChange` dari native input; tidak ada state duplikat tanggal. Field tampilan **hanya dirender saat `value` terisi**; saat kosong hanya `placeholder` teks non-interaktif di atas lapisan transparan (hindari *flash* & hidrasi).
  6. Aksesibilitas: `label` memakai `type-label` (pola `Input` existing); ikon via `Icon` + `ICON_MAP` `aria-hidden="true"`; target sentuh `≥ 44px` (`min-h-11` dasar `Input` + `min-h-11 sm:min-h-10` pada `Button`).

  **B. Kontrak `SummaryStripSkeleton` (penutup R-MAJ-2)**
  - Lokasi `src/components/patterns/summary-strip.tsx` (satu berkas, **satu sumber kelas strip**). Ekspor baru: `summaryStripGridClass` (string kelas grid/scroll strip) + `export function SummaryStripSkeleton({ count = 4, ariaLabel = "Memuat ringkasan operasional", className })`.
  - Root `SummaryStrip` **wajib** memakai `summaryStripGridClass` (literal string kelas grid tidak boleh tersisa di JSX).
  - Skeleton: root `section` **`aria-hidden="true"`** (dekoratif; tidak menambah landmark) + `div` ber-`summaryStripGridClass` + `count` × `<Skeleton className="min-w-[78%] sm:min-w-0 h-20 sm:h-16 rounded-card sm:rounded-none" />`. Server-safe (tanpa `"use client"`).

  **C. Kontrak `auditEntityMeta` (penutup R-MIN-1, di `src/lib/status`)**
  - Ekspor di `src/lib/status/index.ts`: `export type AuditEntityType = "student" | "attendance_session" | "development_note" | "consent" | "media_asset" | "publication" | "report" | "user" | "role" | "user_permission" | "user_membership"`, `export const AUDIT_ENTITY_META: Record<AuditEntityType, { label: string }>` (label kanonik **identik** dengan `ENTITY_TYPE_OPTIONS` existing), dan `export function getAuditEntityLabel(code: string): string` → `AUDIT_ENTITY_META[code as AuditEntityType]?.label ?? code`.
  - Lookup murni: tanpa I/O, tanpa dependency baru, tanpa menyentuh login/RBAC. `src/lib/status` **bukan** artefak C5/C7 — menyentuhnya sah untuk P4.

  **D. Normalisasi label status (satu sumber `src/lib/status`)**
  1. `ATTENDANCE_OPTIONS` di `attendance-workspace-client.tsx` **wajib** mengambil label dari `ATTENDANCE_STATUS_META[code].label`; hanya `code` + kelas visual yang dipertahankan. Label hardcoded "Hadir/Sakit/Izin/Alpa" **dilarang**. Konsekuensi **wajib dicatat di Bagian 4**: `ABSENT` berubah "Alpa" → **"Tidak hadir"** (kanonik; sejalan `attendance.test.ts`).
  2. Label entitas audit **dilarang** diturunkan dari kode mentah (`entityType.replace(/_/g, " ")`); wajib `getAuditEntityLabel` (§1.C).
  3. Dilarang membuat konstanta label status domain baru di level komponen; gunakan konstanta `lib/status` existing. Nol perubahan konstanta existing (kecuali **penambahan** `AUDIT_ENTITY_META`).

  **E. Isolasi & Anti-Drift (C1–C8 mengikat P4)**
  - **C1.** Dilarang mengubah `DEFAULT_WORKSPACE_NAV`, `PRIORITY_HREFS`, dan kunci `ICON_MAP` existing. Kunci baru **hanya** aditif & **hanya** bila dipakai; `ICON_MAP.calendar` sudah ada dan **dipakai ulang** oleh `DatePicker` → target **0 kunci baru**.
  - **C2.** `date-picker.tsx` & `summary-strip.tsx` **dilarang** mengimpor `lucide-react`; ikon lewat `Icon` (`@/components/ui`) + `ICON_MAP` (`@/config/icons`). Di file pemakai lama, import `lucide-react` **boleh dihapus hanya** bila setiap ikonnya punya kunci `ICON_MAP` setara (matriks §1.F); tidak boleh menambah kebutuhan ikon baru.
  - **C3.** Nol kelas palet hardcoded (`bg-*-500`, `text-gray-700`, dst.), nol heksadesimal; hanya token semantik (`bg-surface`, `text-foreground`, `text-secondary-foreground`, `text-muted-foreground`, `text-primary`, `border-border`, `border-border-subtle`, `*-soft`). **Dilarang** `rounded-full` → `rounded-pill`. Nol `bg-*` ganda pada satu string kelas.
  - **C4.** Nol sentuhan `src/styles/*.css`. Nol keyframe/animasi baru (`animate-pulse` milik `Skeleton` tetap).
  - **C5. Isolasi mutlak P5 RBAC:** dilarang menyentuh `db/seed/*`, `permission-resolver.ts`, `server/auth/*`, `migration/RBAC-MATRIX.md`, `rbac.integration.test.ts`, `features/students/permissions/student-policy.ts`, `app-shell.tsx`, `sidebar.tsx`. Proyeksi izin (`canVerifyStudent`, `canUpdate`, `canCreate`, `vm.can*`) **dibaca apa adanya**.
  - **C6.** Tanpa `any`, tanpa `eslint-disable`, tanpa mengubah `tsconfig`/`next.config`/`package.json`/`vitest.config`.
  - **C7.** Dilarang mengubah logika domain: `features/*/actions/*`, `features/*/services/*`, `features/*/validators/*`, `features/*/types*.ts` (kecuali `features/audit/types/audit-types.ts` **hanya** boleh kehilangan `ENTITY_TYPE_OPTIONS` yang pindah ke `lib/status`), query loader (`src/app/**/page.tsx`), serta seluruh `*.test.ts` non-guardrail.
  - **C8.** Dilarang menyentuh artefak P1/P2/P3: `workspace-bottom-nav.tsx`, `page-container.tsx`, `app-shell.tsx`, `mobile-navigation.tsx`, `workspace-header.tsx`, `sidebar.tsx`, `layout-shell.test.ts`, `ui/sheet.tsx`, `patterns/form-bottom-sheet.tsx`, `patterns/entity-header.tsx`, `patterns/page-header.tsx`, `patterns/data-table.tsx`, `patterns/stat-summary.tsx`, `patterns/mobile-card-list.tsx`, `patterns/patterns-mobile.test.ts`, `patterns/stat-summary`, `themes.css`, `student-detail-client.tsx`. Di file pemakai P4, hanya area yang tercantum di kolom "Batas perubahan" §2 yang boleh berubah.

  **F. Matriks ganti-atas-ganti ikon di file pemakai (C2 — nol kunci baru)**
  | File | Import `lucide-react` existing | Keputusan P4 |
  |---|---|---|
  | `attendance-workspace-client.tsx` | *tidak ada* (sudah `Icon` + `ICON_MAP`) | hanya `DatePicker` + label `ATTENDANCE_STATUS_META` |
  | `media-workspace-client.tsx` | dicatat di Task 1 dari kondisi aktual | ganti **hanya** bila kunci `ICON_MAP` setara ada; jika tidak, import dipertahankan (jangan tambah kunci demi migrasi) |
  | `public-registration-wizard.tsx` | `CheckCircle2`, `CloudOff`, `RotateCcw`, `ShieldCheck` | `checkCircle` ✔, `cloudOff` ✔, `shieldCheck` ✔ → **partial migration**; `RotateCcw` **tidak ada** kuncinya → import `RotateCcw` dipertahankan & dicatat di Bagian 4 |
  | `student-detail-client.tsx` | milik P2 | **hanya** blok input tanggal lahir (`:528‑541`) → `DatePicker`; ikon/state/dialog lain **identik** |
  | `contextual-dashboard-view.tsx` | *tidak ada* | hanya komentar urutan mobile (§1.G.1) |
  | `audit/consent-workspace-client.tsx` | `Eye/History/Lock`, `Lock/ShieldAlert/ShieldCheck` | tidak ada kewajiban migrasi ikon di P4 (tidak dinilai) |

  **G. Penutupan backlog audit P3 (R-MIN-1/2, R-MAJ-1/2/3, R-DOK, R-TEST-2)**
  1. **R-MAJ-1** — `contextual-dashboard-view.tsx:186‑190`: komentar urutan mobile **wajib** menyatakan `Orientation → Ringkasan operasional → [Perlu perhatian & Jadwal belajar] → Aktivitas terbaru`; komentar tablet/desktop dipertahankan. Orde visual (`order-2`/`order-3`) **tidak** diubah.
  2. **R-MAJ-2** — kelas strip di `app/(workspace)/workspace/loading.tsx:10‑16` **wajib** diganti `<SummaryStripSkeleton />` (kelas hanya hidup di `summary-strip.tsx`). `DashboardBodySkeleton` tetap diekspor.
  3. **R-MAJ-3** — item ber-`href` pada `SummaryStrip`: ikon `arrowUpRight` **wajib** tampak tanpa hover (`opacity-70`, bukan `opacity-0`) + `group-hover:opacity-100` + `text-primary` sebagai petunjuk afinitas tautan di layar sentuh. Hover latar boleh dipertahankan.
  4. **R-MIN-1** — kartu Audit: baris 1 = **identitas entitas** (`getAuditEntityLabel(row.entityType)` + ID pendek `font-mono`); **tanggal** di `badge`; **pelaku** naik ke `primaryMeta`; `Badge` aksi (`row.actionLabel`) menjadi **baris tersendiri di dalam `primaryMeta`** (tepat satu `Badge`, nol nested badge); `description` tetap metadata sekunder.
  5. **R-MIN-2** — kartu Consent: **maksimal satu `Button`** dalam wadah `action`. `Cabut persetujuan` menjadi `<button type="button">` teks (`min-h-10`, `text-danger`, `underline-offset-4 hover:underline`, `focus-ring`) di wadah `flex flex-wrap items-center justify-end gap-3`. Kondisi `canUpdate` & `photoVideoConsent === "GRANTED"` **identik**.
  6. **R-DOK** — narasi kunci aditif P3 (3 kunci: `arrowRight` dashboard, `calendar` dashboard + `DatePicker`, `arrowUpRight` primitif) dicatat presisi di Bagian 4; **tanpa** perubahan kode.
  7. **R-TEST-2** — assert `min-w-[78%]` **wajib** mencakup **kedua** varian wrapper (ber-`href` & statis) via `matchAll`; ditambah assert anti-duplikasi kelas strip di `loading.tsx` & dashboard.

- **Spesifikasi Visual (mengikat):**
  ```
  < 768px — DatePicker (contoh Kehadiran: "Tanggal sesi belajar")
  ┌──────────────────────────────────────────────────┐
  │ Tanggal sesi belajar                             │  ← label type-label
  │ ┌──────────────────────────────────────────────┐ │
  │ │ 24 November 2026                      [cal]  │ │  ← readOnly display + Button size="icon"
  │ └──────────────────────────────────────────────┘ │  ← native date input opacity-0 menutup field
  └──────────────────────────────────────────────────┘

  ≥ 768px — DatePicker
  ┌──────────────────────────────────────────────────┐
  │ [ 24/11/2026 ]                                   │  ← Input type="date" terlihat (perilaku hari ini)
  └──────────────────────────────────────────────────┘

  Kirim ke action/URL/validator: "2026-11-24" (identik dengan input native)

  Kartu Audit (R-MIN-1 — baris 1 = identitas, bukan aksi)
  ┌──────────────────────────────────────────────────┐
  │ Peserta didik · a1b2c3d4e5f6        [24 Nov 2026] │  ← title + badge (tanggal)
  │ [Status pendaftaran diperbarui]                   │  ← Badge aksi (primaryMeta)
  │ Oleh: Bu Ratna                                    │  ← pelaku (primaryMeta)
  │ Riwayat Audit →                                   │  ← tepat satu aksi primer min-h-10
  └──────────────────────────────────────────────────┘

  Kartu Consent (R-MIN-2 — tepat satu Button)
  │ [Perbarui persetujuan]   Cabut persetujuan        │  ← Button + tautan teks (min-h-10)
  ```
  - Nol perubahan copy bisnis: label/status memakai konstanta `CONSENT_STATUS_META`, `AUDIT_ACTION_LABELS`, `AUDIT_ENTITY_META`, `ATTENDANCE_STATUS_META`.
  - Nol `z-*` baru (lapisan transparan berada di dalam alur normal, bukan overlay).
  - `≥ 768px` = presentasi existing tanpa perubahan visual selain tanggal native yang memang sudah ada.

- **Kriteria Selesai (STEP 2 — P4):**
  - [ ] `src/components/patterns/date-picker.tsx` ada, ber-`"use client"`, props persis §1.A.2, memuat `min-h-11` + `aria-controls` + id turunan `-display`/`-native` + `formatToIndonesianStandard` + `Icon`/`ICON_MAP.calendar`; **tidak** memuat `lucide-react`, `useMediaQuery`, `matchMedia`, `window.innerWidth`, `rounded-full`, `shadow-md`/`shadow-lg`, kelas palet, atau `#hex`.
  - [ ] `type="date"` mentah: **0 kemunculan di luar `date-picker.tsx`** (4 titik pemakai dimigrasi; bukti `git grep` di Bagian 4).
  - [ ] `summary-strip.tsx` mengekspor `summaryStripGridClass` + `SummaryStripSkeleton`; root `SummaryStrip` memakai `summaryStripGridClass`; indikator `arrowUpRight` `opacity-70` + `text-primary` + `group-hover:opacity-100`.
  - [ ] `app/(workspace)/workspace/loading.tsx` **0 hit** `min-w-[78%]`/`snap-`/`divide-x`/`sm:grid-cols-2`; memakai `<SummaryStripSkeleton />`; `DashboardBodySkeleton` tetap diekspor.
  - [ ] `audit-workspace-client.tsx`: baris 1 = `getAuditEntityLabel(row.entityType)` + ID pendek; tanggal di `badge`; `Badge` aksi & pelaku di `primaryMeta`; aksi tunggal `Riwayat Audit`; **0** definisi `ENTITY_TYPE_OPTIONS` lokal; filter tetap memakai konstanta `lib/status`.
  - [ ] `consent-workspace-client.tsx`: wadah `action` memuat **tepat 1** `<Button` (assert guardrail) + `<button>` teks `min-h-10`; kondisi `canUpdate` identik.
  - [ ] `contextual-dashboard-view.tsx`: komentar urutan mobile = `Orientation → Ringkasan operasional → [Perlu perhatian & Jadwal belajar] → Aktivitas terbaru`; `order-*` visual tidak berubah.
  - [ ] `ATTENDANCE_OPTIONS` tanpa label hardcoded; perubahan "Alpa" → "Tidak hadir" dicatat di Bagian 4.
  - [ ] `src/lib/status/index.ts` mengekspor `AuditEntityType` + `AUDIT_ENTITY_META` + `getAuditEntityLabel`; `features/audit/types/audit-types.ts` hanya kehilangan `ENTITY_TYPE_OPTIONS`.
  - [ ] Nol perubahan kondisi izin (`can*`/`vm.can*`) — hanya relokasi/penyederhanaan markup (C5).
  - [ ] `patterns-mobile.test.ts` **tidak berubah** (10 assert hijau); `student-detail-client.tsx` blok di luar input tanggal lahir, `data-table.tsx`, `mobile-card-list.tsx`, `layout-shell.test.ts`, `ui/sheet.tsx`, `themes.css` **0 baris** di `git diff` (C8).
  - [ ] Nol perubahan action/service/validator/test non-guardrail (C7); `git status --porcelain` hanya menyentuh §2 (+ `TASK.md`).
  - [ ] `npm run typecheck` 0 error; eslint bersih untuk seluruh file §2; `patterns-mobile.test.ts` (10), `layout-shell.test.ts` (11), `ui-primitives.test.ts` (2), `status.test.ts` (2), `patterns-p4.test.ts` (≥14) hijau; kegagalan baseline pra-eksisting dikecualikan & dilampirkan identik.
  - [ ] Entri `PHASE-19-STEP2-P4` ditambahkan di `migration/MIGRATION-STATE.md` (repo root).

## 2. File Target (Diisi oleh Gemini Pro)

- **Zona yang BOLEH dibuat/diubah (allow-list — 14 file):**

| # | File | Aksi | Batas perubahan |
|---|---|---|---|
| 1 | `src/components/patterns/date-picker.tsx` | **BUAT** | Primitif input tanggal mobile-first, kontrak §1.A; `"use client"` |
| 2 | `src/components/patterns/summary-strip.tsx` (P3) | UBAH | Ekspor `summaryStripGridClass` + `SummaryStripSkeleton` (§1.B) & R-MAJ-3 (`opacity-70 text-primary group-hover:opacity-100`); kelas grid tidak berubah |
| 3 | `src/components/patterns/index.ts` | UBAH | Hanya 1 baris ekspor alfabetis baru (`./date-picker`); total 16 → 17 |
| 4 | `src/lib/status/index.ts` | UBAH | **Hanya penambahan** `AuditEntityType` + `AUDIT_ENTITY_META` + `getAuditEntityLabel` (§1.C); konstanta existing identik |
| 5 | `src/features/audit/types/audit-types.ts` | UBAH | **Hanya** hapus `ENTITY_TYPE_OPTIONS` (pindah ke `lib/status`); label/DTO/fungsi lain identik |
| 6 | `src/features/audit/components/audit-workspace-client.tsx` | UBAH | Kartu `MobileCardList` (§1.G.4) + filter memakai `AUDIT_ENTITY_META`; nol perubahan action/izin |
| 7 | `src/features/consent/components/consent-workspace-client.tsx` | UBAH | Kartu `MobileCardList` (§1.G.5): tepat satu `Button` + tautan teks cabut |
| 8 | `src/features/attendance/components/attendance-workspace-client.tsx` | UBAH | `ATTENDANCE_OPTIONS` derivasi label (§1.D.1) + input tanggal → `<DatePicker>` (`:407‑419`) |
| 9 | `src/features/media/components/media-workspace-client.tsx` | UBAH | Input `#media-date` → `<DatePicker>` (`:835‑848`) + migrasi ikon hanya bila kunci setara ada (§1.F) |
| 10 | `src/features/students/components/public-registration-wizard.tsx` | UBAH | Input `#reg-birthDate` → `<DatePicker>` via `Controller` RHF (`:438‑452`) + partial migrasi ikon (§1.F) |
| 11 | `src/features/students/components/student-detail-client.tsx` | UBAH | **Hanya** blok input tanggal lahir (`:528‑541`) → `<DatePicker>`; dialog/sheet P2 & state lain identik |
| 12 | `src/features/organization/components/contextual-dashboard-view.tsx` | UBAH | **Hanya** komentar urutan mobile (`:184‑190`, R-MAJ-1) |
| 13 | `src/app/(workspace)/workspace/loading.tsx` | UBAH | Skeleton strip → `<SummaryStripSkeleton />` (R-MAJ-2); `DashboardBodySkeleton` tetap diekspor |
| 14 | `src/components/patterns/patterns-p4.test.ts` | **BUAT** | Berkas guardrail P4 (≥14 assert, §3 Task 11) |

> **Batas jumlah file:** tepat **14 file** (jumlah baris tabel = jumlah header allow-list). `migration/MIGRATION-STATE.md` (repo root) dan `apps/web/TASK.md` adalah artefak dokumentasi wajib di luar hitungan allow-list (preseden P1–P3).

- **DENY-LIST (mutlak — pelanggaran = `NEEDS REVISION`):**
  - **P1/P2/P3:** `workspace-bottom-nav.tsx`, `page-container.tsx`, `app-shell.tsx`, `mobile-navigation.tsx`, `workspace-header.tsx`, `sidebar.tsx`, `layout-shell.test.ts`, `ui/sheet.tsx`, `patterns/form-bottom-sheet.tsx`, `patterns/entity-header.tsx`, `patterns/page-header.tsx`, `patterns/data-table.tsx`, `patterns/stat-summary.tsx`, `patterns/mobile-card-list.tsx`, `patterns/patterns-mobile.test.ts`, `themes.css`.
  - **Primitif `src/components/ui/*`** (termasuk `input.tsx`, `icon.tsx`, `skeleton.tsx`, `button.tsx`, `popover.tsx`) — **read-only**.
  - `src/config/icons.ts` — read-only kecuali kunci **aditif** yang benar-benar dipakai (C1/C2); target P4 = **0 kunci baru**.
  - `src/styles/*.css` (C4), `src/utils/date-formatter.ts` (read-only).
  - **P5/RBAC:** `db/seed/*`, `permission-resolver.ts`, `server/auth/*`, `migration/RBAC-MATRIX.md`, `rbac.integration.test.ts`, `features/students/permissions/*`, `app-shell.tsx`, `sidebar.tsx`.
  - Domain & tooling: `features/*/actions/*`, `features/*/services/*`, `features/*/validators/*`, `features/*/types*.ts` (selain No. 5), query loader `src/app/**/page.tsx`, `*.test.ts` non-guardrail (termasuk `attendance.test.ts`, `audit.test.ts`, `consent.test.ts`, `status.test.ts`), `package.json`, `tsconfig.json`, `next.config.*`, `vitest.config.*`, `middleware.ts`.
  - Halaman governance/publishing/reports/development/academic/administration dan `governance-workspace-client.tsx` — di luar lingkup P4.

- **Cek anti-duplikasi sebelum menulis kode (wajib dicatat di Bagian 4):**
  1. `git grep -n 'type="date"' -- 'src/**'` → hanya boleh hit di `src/components/patterns/date-picker.tsx` (target: 1 hit).
  2. `git grep -n 'min-w-\[78%\]\|snap-x\|divide-x\|sm:grid-cols-2' -- 'src/app/(workspace)/workspace/loading.tsx'` → **0 hit**.
  3. `git grep -n 'Alpa' -- 'src/features/attendance'` → **0 hit**.
  4. `grep -n "rounded-full\|bg-\(slate\|gray\|zinc\|blue\|green\|red\|amber\|yellow\)-" src/components/patterns/{date-picker,summary-strip}.tsx` → **0 hit**.
  5. `grep -n "lucide-react" src/components/patterns/{date-picker,summary-strip}.tsx` → **0 hit** (C2).

## 3. Daftar Tugas / Micro-Tasks (Diisi oleh Gemini Pro, Dicentang oleh Claude)

- [x] **Task 1 (Cek Pra-syarat — READ-ONLY):** Konfirmasi `git status --porcelain` bersih (HEAD `270189`). Baca & catat kondisi aktual: `patterns/summary-strip.tsx`, `patterns/index.ts`, `ui/input.tsx` (kelas dasar), `ui/button.tsx` (`size="icon"`), `ui/skeleton.tsx`, `config/icons.ts` (`calendar`, `cloudOff`, `checkCircle`, `shieldCheck`), `utils/date-formatter.ts`, `lib/status/index.ts`, 4 titik `type="date"`, `audit-workspace-client.tsx` (`:18‑33`, `:260‑300`), `consent-workspace-client.tsx` (`:336‑368`), `attendance-workspace-client.tsx` (`:28‑66`, `:405‑420`), `workspace/loading.tsx`, serta pemakai lain `DashboardBodySkeleton`. Catat import `lucide-react` aktual di `media-workspace-client.tsx` & `public-registration-wizard.tsx` beserta padanan `ICON_MAP`. **Tanpa edit.**
- [x] **Task 2 (Primitif `DatePicker`):** Buat `src/components/patterns/date-picker.tsx` (`"use client"`) — `export interface DatePickerProps` persis §1.A.2 + `export function DatePicker(...)`. Implementasi: `useId()` fallback id, wrapper `space-y-2` + label `type-label`; blok mobile (`relative` + `Input readOnly` display `md:hidden` + `Button type="button" size="icon" variant="secondary"` `min-h-11` + `Input type="date"` `opacity-0 absolute inset-0` id `-native`); blok desktop (`hidden md:block` `Input type="date"`); `hint`/`error` dengan pola id `-hint`/`-error`, `aria-invalid`, `aria-describedby`. Nilai yang dipancarkan = **string `YYYY-MM-DD` apa adanya**. Nol `lucide-react` (pakai `ICON_MAP.calendar` via `Icon`).
- [x] **Task 3 (`summaryStripGridClass` + `SummaryStripSkeleton`):** Sunting `patterns/summary-strip.tsx` — ekstrak string grid existing ke `export const summaryStripGridClass = "..."` (nilai **identik**, nol perubahan kelas), pakai di root `SummaryStrip`; tambah `SummaryStripSkeleton` (§1.B); terapkan R-MAJ-3 pada ikon `arrowUpRight` (`opacity-70 text-primary group-hover:opacity-100`). `patterns-mobile.test.ts` **tidak boleh** berubah (assert 1–10 tetap hijau).
- [x] **Task 4 (Ekspor pattern):** Tambah 1 baris `export * from "./date-picker";` di `patterns/index.ts` pada urutan alfabetis (setelah `./data-table`, sebelum `./decision-history`); total ekspor 16 → 17.
- [x] **Task 5 (Kanonik status entitas audit):** Tambah `AuditEntityType`, `AUDIT_ENTITY_META`, `getAuditEntityLabel` di `src/lib/status/index.ts` dengan label **sama persis** `ENTITY_TYPE_OPTIONS`; lalu hapus `ENTITY_TYPE_OPTIONS` dari `features/audit/types/audit-types.ts`.
- [x] **Task 6 (Kartu Audit — R-MIN-1):** Ubah `renderMobileRow` Audit ke struktur §1.G.4 (identitas entitas + ID pendek di `title`, tanggal di `badge`, `Badge` aksi & pelaku di `primaryMeta`, `description` di `secondaryMeta`, satu aksi `Riwayat Audit` `min-h-10`); referensi filter `ENTITY_TYPE_OPTIONS` → `Object.entries(AUDIT_ENTITY_META)`. Nol perubahan kolom tabel desktop, dialog detail, izin.
- [x] **Task 7 (Kartu Consent — R-MIN-2):** Ubah wadah `action` → tepat satu `Button` (`Perbarui persetujuan`) + `<button type="button">` teks `Cabut persetujuan` (`min-h-10 text-xs text-danger underline-offset-4 hover:underline focus-ring`); kondisi `canUpdate` & `photoVideoConsent === "GRANTED"` identik; bagian `MobileCardList` lain identik.
- [x] **Task 8 (Dashboard komentar — R-MAJ-1):** Selaraskan komentar urutan mobile di `contextual-dashboard-view.tsx` sesuai §1.G.1; nol perubahan JSX/urutan visual.
- [x] **Task 9 (Adopsi `DatePicker` — 4 titik + normalisasi label):** Ganti `<Input type="date">` → `<DatePicker>` di Attendance (`value={initialDate}`, `onChange={(v) => updateUrl({ date: v })}`), Media (`uploadDate`/`setUploadDate`), Pendaftaran publik (via `Controller` RHF agar zod & `fieldState.error` tetap), dan Ubah profil (`editBirthDate`/`setEditBirthDate`) — **hanya** blok input tersebut. Tambah derivasi label `ATTENDANCE_OPTIONS` dari `ATTENDANCE_STATUS_META`. Terapkan migrasi ikon **partial** sesuai matriks §1.F bila berlaku.
- [x] **Task 10 (Skeleton rute — R-MAJ-2):** Ganti blok strip di `src/app/(workspace)/workspace/loading.tsx:10‑16` dengan `<SummaryStripSkeleton />`; `DashboardBodySkeleton` tetap diekspor; nol kelas strip tersisa.
- [x] **Task 11 (Guardrail P4 — `patterns-p4.test.ts`):** Buat berkas baru mengikuti gaya `patterns-mobile.test.ts` (`readFileSync` + ekstraksi string kelas nyata, **bukan** regex coarse/boolean literal) dengan **minimal 14 assert**:
  1. `date-picker.tsx` memuat `"use client"` **dan** string kelas nyata berisi `opacity-0` + `absolute` + `inset-0` pada input native.
  2. `date-picker.tsx` memuat `min-h-11` **dan** atribut `aria-controls`; memakai `ICON_MAP.calendar` & `formatToIndonesianStandard`.
  3. `date-picker.tsx` **tidak** memuat `lucide-react`, `useMediaQuery`, `matchMedia`, `window.innerWidth`, `rounded-full`, `shadow-md`, `shadow-lg`, regex palet, atau `#hex`.
  4. `date-picker.tsx` memiliki dua id turunan berbeda (`-display` **dan** `-native`) + `useId(`.
  5. `summary-strip.tsx` mengekspor `summaryStripGridClass`; string kelas yang diekstrak dari konstanta itu memuat `snap-mandatory`, `sm:grid-cols-2`, `sm:divide-x`.
  6. `summary-strip.tsx` mengekspor `SummaryStripSkeleton`, ber-`aria-hidden="true"` (dekoratif), dan memakai `summaryStripGridClass`.
  7. `summary-strip.tsx`: ikon tautan `arrowUpRight` **tidak lagi** `opacity-0` — string kelas nyata wajib memuat `opacity-70` **dan** `text-primary`.
  8. **R-TEST-2:** `summary-strip.tsx` memuat **≥ 2** literal `min-w-[78%]` (`content.matchAll(/min-w-\[78%\]/g).length >= 2`) **dan** tiap varian (`Link` ber-`href` & `div` statis) diperiksa via ekstraksi string kelas masing-masing.
  9. `app/(workspace)/workspace/loading.tsx` memakai `<SummaryStripSkeleton` dan **0 hit** `min-w-[78%]`, `snap-`, `divide-x`, `sm:grid-cols-2`.
  10. `contextual-dashboard-view.tsx`: komentar urutan mobile memuat `Ringkasan operasional` sebelum `Perlu perhatian`, dan tetap **0 hit** `min-w-[78%]`/`snap-x`/`lucide-react`.
  11. `audit-workspace-client.tsx` memakai `getAuditEntityLabel` & `AUDIT_ENTITY_META`, **tidak** mendefinisikan `ENTITY_TYPE_OPTIONS`, dan **tidak** memuat `entityType.replace(`.
  12. `consent-workspace-client.tsx`: blok teks dari `action={` s.d. penutupnya memuat **tepat 1** `<Button` (`matchAll(/<Button\b/g).length === 1`) + satu `<button` teks `min-h-10`.
  13. `attendance-workspace-client.tsx` memakai `ATTENDANCE_STATUS_META` di `ATTENDANCE_OPTIONS` **dan** **0 hit** `"Alpa"`; memakai `<DatePicker` **dan** tidak lagi memuat `type="date"`.
  14. `media-workspace-client.tsx`, `public-registration-wizard.tsx`, `student-detail-client.tsx` → **0 hit** `type="date"`; `student-detail-client.tsx` tetap memuat `FormBottomSheet` (artefak P2 utuh).
  > Opsional (bila tetap hijau): `patterns/index.ts` mengekspor `./date-picker` (total 17) dan `lib/status/index.ts` mengekspor `AUDIT_ENTITY_META`.
- [x] **Task 12 (Verifikasi akhir):** `npm run typecheck` → 0 error; `npx eslint` pada **seluruh 13 file kode** §2 → 0 error/warning; `npx vitest run src/components/patterns src/components/layout src/components/ui src/lib/status src/features/attendance src/features/audit src/features/consent` → semua hijau (kegagalan baseline pra-eksisting dilampirkan identik). Tempel hasil mentah di Bagian 4.
- [x] **Task 13 (Dokumentasi):** Tambah entri `PHASE-19-STEP2-P4` di `migration/MIGRATION-STATE.md` (status, file disentuh, jumlah assert guardrail, temuan backlog yang ditutup, catatan "Alpa" → "Tidak hadir"). Isi Bagian 4 `TASK.md` lengkap (file, perubahan, hasil 5 pemindaian §2, hasil test, bukti `git status --porcelain`, R-DOK).

## 4. Log Perubahan (Diisi oleh Eksekutor setelah Coding)

### Status Progress: Siklus #2 SELESAI (Siap Audit Akhir Qwen Max)

#### 1. Ringkasan Perbaikan Siklus #2:
1. **MAJOR-1 (`date-picker.tsx` — Eliminasi Duplikasi ID DOM):**
   - Mengganti ID turunan bersama menjadi ID unik spesifik per wadah presentasi:
     - `${baseId}-mobile-display` untuk display input mobile `< 768px`.
     - `${baseId}-mobile-native` untuk transparent touch layer `<input type="date">` mobile `< 768px`.
     - `${baseId}-desktop-native` untuk standard native `<Input type="date">` desktop `≥ 768px`.
   - Mengarahkan `htmlFor` label mobile ke `mobileDisplayId` dan label desktop ke `desktopNativeId`.
   - Menghasilkan 0 duplikasi atribut `id=` di DOM saat kedua wadah dirender (diverifikasi oleh guardrail assert #4).
2. **MINOR-1 (`date-picker.tsx` — Pembersihan Atribut Aksesibilitas Tombol Dekoratif):**
   - Menghapus atribut `aria-label="Pilih tanggal"` dan `aria-controls` dari tombol kalender dekoratif yang non-fokusabel (`pointer-events-none` & `tabIndex={-1}`).
   - Menambahkan `aria-hidden="true"` pada container dan button dekoratif agar tidak menjadi noise pada screen reader.
3. **MINOR-5 (`date-picker.tsx` — Perutean Eksplisit `aria-describedby`):**
   - Mengikat `describedById = error ? errorId : hint ? hintId : undefined` secara konsisten ke seluruh kontrol input anak (`mobileDisplayId`, `mobileNativeId`, dan `desktopNativeId`).
   - Menyertakan atribut `aria-invalid={error ? "true" : undefined}` dan memastikan elemen `<p id={hintId}>` dan `<p id={errorId}>` terhubung secara valid.
4. **MINOR-4 (`summary-strip.tsx` — Resolusi Konflik Atribut Aksesibilitas):**
   - Menghapus atribut `aria-label` dari root `<section>` pada `SummaryStripSkeleton` karena telah memiliki `aria-hidden="true"` dekoratif.
5. **MINOR-2 (`patterns-p4.test.ts` — Penguatan Assertion Guardrail):**
   - Assert #4 diperkuat untuk menguji keunikan ID (`mobileDisplayId`, `mobileNativeId`, `desktopNativeId`), memastikan `htmlFor` menunjuk tepat ke wadahnya, dan mengunci tepat 1 kemunculan atribut `id=` per elemen.
   - Assert #8 (R-TEST-2) diperkuat dengan `matchAll` yang mengunci tepat 2 wrapper `snap-start` (`length === 2`) dan memverifikasi keduanya memuat `min-w-[78%]`.
   - Menambahkan Assert #16 untuk memverifikasi perutean `aria-describedby` dan `aria-invalid`. Total assertion meningkat dari 15 → 16 (100% lulus).
6. **MINOR-6 (`audit-types.ts` — Penegasan Status No-Op):**
   - Ditegaskan bahwa `src/features/audit/types/audit-types.ts` berstatus **0 baris (no-op)** karena `ENTITY_TYPE_OPTIONS` sejak awal didefinisikan secara lokal di `src/features/audit/components/audit-workspace-client.tsx:34-47` (telah dihapus dan digantikan oleh `AUDIT_ENTITY_META` dari `src/lib/status` pada Task 6). Total file worktree tetap tepat 14 file allow-list.

#### 2. Ringkasan Perubahan per File (Tepat 14 File Target §2):
1. `src/components/patterns/date-picker.tsx` : **Baru** — Primitif input tanggal mobile-friendly (`"use client"`). Dua presentasi satu nilai pada ambang `md` bebas duplikasi ID DOM (MAJOR-1, MINOR-1, MINOR-5):
   - `< 768px` (mobile): display field `readOnly` dengan format tanggal Indonesia (`formatToIndonesianStandard`) + ikon kalender dekoratif (`aria-hidden="true"`, pointer-events-none) + native `Input type="date"` sebagai overlay sentuh transparan (`absolute inset-0 h-full w-full opacity-0 cursor-pointer`).
   - `≥ 768px` (desktop): native `Input type="date"` terlihat normal (`hidden md:block`).
   - ID turunan unik: `${baseId}-mobile-display`, `${baseId}-mobile-native`, `${baseId}-desktop-native`, `${baseId}-hint`, `${baseId}-error`.
   - Aksesibilitas: label `type-label`, `describedById` untuk hint/error, `aria-invalid`.
   - Anti-drift: 0 `lucide-react` (pakai `ICON_MAP.calendar`), 0 dependency baru, 0 `useMediaQuery`, 0 kelas palet/hex.
2. `src/components/patterns/summary-strip.tsx` : Menutup R-MAJ-2, R-MAJ-3, & MINOR-4. Mengekstrak string kelas grid menjadi `export const summaryStripGridClass = "flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-y-6 sm:gap-x-6 sm:divide-x sm:divide-border sm:pb-0";`, menggunakan konstanta ini pada root `SummaryStrip`, menambahkan komponen `SummaryStripSkeleton` (`aria-hidden="true"` dekoratif tanpa konflik `aria-label`), dan memperbarui ikon tautan `arrowUpRight` menjadi `opacity-70 text-primary group-hover:opacity-100` agar tampak di layar sentuh.
3. `src/components/patterns/index.ts` : Menambahkan 1 baris ekspor alfabetis baru `export * from "./date-picker";` (total ekspor 16 → 17).
4. `src/lib/status/index.ts` : Menutup R-MIN-1. Menambahkan tipe kanonik `AuditEntityType`, konstanta `AUDIT_ENTITY_META`, dan fungsi lookup `getAuditEntityLabel(code: string): string` dengan label identik `ENTITY_TYPE_OPTIONS`.
5. `src/features/audit/types/audit-types.ts` : No-op (0 baris, diverifikasi bahwa `ENTITY_TYPE_OPTIONS` semula lokal di `audit-workspace-client.tsx`).
6. `src/features/audit/components/audit-workspace-client.tsx` : Menutup R-MIN-1. Mengimpor `AUDIT_ENTITY_META` dan `getAuditEntityLabel` dari `@/lib/status`. Menghapus definisi lokal `ENTITY_TYPE_OPTIONS` dan mengganti opsi dropdown filter entitas dengan `Object.entries(AUDIT_ENTITY_META)`. Merombak `renderMobileRow`: baris 1 (`title`) menampilkan `getAuditEntityLabel(row.entityType)` dan ID pendek 8 karakter `font-mono`; `badge` menampilkan tanggal terformat bahasa Indonesia; `primaryMeta` menampilkan `Badge` aksi dan nama pelaku; `secondaryMeta` menampilkan deskripsi audit; wadah `action` memuat tepat 1 tombol `Riwayat Audit →` (`min-h-10`).
7. `src/features/consent/components/consent-workspace-client.tsx` : Menutup R-MIN-2. Memperbaiki wadah `action` pada `renderMobileRow` agar hanya memiliki tepat 1 `<Button` (`Perbarui persetujuan`) dan mengubah aksi sekunder pencabutan izin menjadi tombol tautan teks `<button type="button">` (`min-h-10 text-xs text-danger underline-offset-4 hover:underline focus-ring`) dengan kondisi `photoVideoConsent === "GRANTED"` yang identik.
8. `src/features/organization/components/contextual-dashboard-view.tsx` : Menutup R-MAJ-1. Memperbarui komentar urutan mobile menjadi `Orientation -> Ringkasan operasional -> [Perlu perhatian & Jadwal belajar] -> Aktivitas terbaru` tanpa mengubah JSX/urutan visual (`order-*`).
9. `src/features/attendance/components/attendance-workspace-client.tsx` : Mengadopsi `<DatePicker>` untuk input tanggal sesi belajar (`:412-418`) menggantikan `<Input type="date">`. Menormalkan `ATTENDANCE_OPTIONS` dengan menderivasi label dari `ATTENDANCE_STATUS_META` sehingga label `ABSENT` berubah dari "Alpa" menjadi "Tidak hadir". Menghilangkan seluruh kemunculan teks "Alpa" di komponen dan mengganti kelas `rounded-full` menjadi `rounded-pill`.
10. `src/features/media/components/media-workspace-client.tsx` : Mengadopsi `<DatePicker>` untuk input tanggal kegiatan (`:836-842`) menggantikan `<Input type="date">`.
11. `src/features/students/components/public-registration-wizard.tsx` : Mengadopsi `<DatePicker>` via `Controller` React Hook Form untuk input tanggal lahir (`reg-birthDate`). Melakukan migrasi ikon parsial sesuai §1.F: mengganti `CheckCircle2` -> `ICON_MAP.checkCircle`, `CloudOff` -> `ICON_MAP.cloudOff`, `ShieldCheck` -> `ICON_MAP.shieldCheck`, dan mempertahankan impor `RotateCcw` dari `lucide-react`.
12. `src/features/students/components/student-detail-client.tsx` : Mengadopsi `<DatePicker>` untuk input tanggal lahir pada modal ubah profil (`editBirthDate`, `:529-534`) menggantikan `<Input type="date">`. Dialog dan sheet P2 tetap steril dan utuh.
13. `src/app/(workspace)/workspace/loading.tsx` : Menutup R-MAJ-2. Mengganti kode duplikasi grid strip skeleton dengan komponen kanonik `<SummaryStripSkeleton />`. Mempertahankan ekspor `DashboardBodySkeleton`.
14. `src/components/patterns/patterns-p4.test.ts` : **Baru** — Berkas guardrail P4 dengan **16 assertion** (14 wajib + 1 bonus ekspor + 1 a11y describedby) berbasis `readFileSync` dan ekstraksi string kelas nyata (tanpa regex boolean/vakum).

#### 3. Hasil 5 Pemindaian Anti-Duplikasi & Guardrail §2:
1. `git grep --untracked -n 'type="date"' src/` : **0 kemunculan di luar `date-picker.tsx`** (hanya 2 baris di `src/components/patterns/date-picker.tsx` untuk varian mobile dan desktop).
2. `git grep -E "min-w-\[78%\]|snap-x|divide-x|sm:grid-cols-2" 'src/app/(workspace)/workspace/loading.tsx'` : **0 hit** (seluruh kelas strip didelegasikan ke `SummaryStripSkeleton`).
3. `git grep -i "Alpa" src/features/attendance/components/attendance-workspace-client.tsx` : **0 hit** (seluruh kemunculan istilah "Alpa" di komponen presensi telah dihilangkan dan diselaraskan ke "Tidak hadir").
4. `git grep -E "rounded-full|bg-(slate|gray|zinc|blue|green|red|amber|yellow)-" src/components/patterns/{date-picker,summary-strip}.tsx` : **0 hit** (bebas dari palet hardcoded dan `rounded-full`).
5. `git grep "lucide-react" src/components/patterns/{date-picker,summary-strip}.tsx` : **0 hit** (C2 anti-drift dipatuhi penuh).

#### 4. Catatan R-DOK (Dokumentasi Ikon P3 & P4):
- Pada P3, 3 kunci ikon aditif kanonik ditambahkan ke `ICON_MAP` (`src/config/icons.ts`):
  1. `arrowRight: ArrowRight` (dipakai untuk navigasi kartu/tautan dashboard)
  2. `calendar: Calendar` (dipakai untuk strip jadwal dashboard dan kini digunakan ulang oleh `DatePicker`)
  3. `arrowUpRight: ArrowUpRight` (dipakai untuk indikator tautan affordance pada `SummaryStrip`)
- Pada P4, **0 kunci baru** ditambahkan ke `ICON_MAP`. Seluruh kebutuhan ikon memanfaatkan kunci yang sudah ada (`calendar`, `arrowUpRight`, `checkCircle`, `cloudOff`, `shieldCheck`). Ikon `RotateCcw` pada `public-registration-wizard.tsx` dipertahankan langsung dari `lucide-react` sebagai migrasi parsial sesuai matriks §1.F untuk mencegah penambahan kunci yatim.

#### 5. Hasil Pengujian & Verifikasi Siklus #2:
- `npm run typecheck`: **0 error** (exit code 0).
- `npx eslint`: **0 error, 0 warning** pada seluruh 14 file kode target allow-list §2.
- `npx vitest run src/components/patterns src/components/layout src/components/ui src/lib/status src/features/attendance src/features/audit src/features/consent`:
  - `src/components/patterns/patterns-p4.test.ts`: **16/16 passed** (100%).
  - `src/components/patterns/patterns-mobile.test.ts`: **10/10 passed** (100%).
  - `src/components/layout/layout-shell.test.ts`: **11/11 passed** (100%).
  - `src/components/ui/ui-primitives.test.ts`: **2/2 passed** (100%).
  - `src/lib/status/status.test.ts`: **2/2 passed** (100%).
  - `src/features/audit/audit.test.ts`: **3/3 passed** (100%).
  - `src/features/consent/consent.test.ts`: **4/4 passed** (100%).
  - `src/features/attendance/attendance.test.ts`: **4/4 passed** (100%).
  - `src/features/attendance/attendance-sync.integration.test.ts`: **4/4 passed** (100%).
  - `src/components/patterns/patterns-and-pwa.test.ts`: 2/3 passed (1 kegagalan manifest PWA `background_color` adalah baseline pra-eksisting dari P1–P3).
  - **Total:** 58 passed, 1 pre-existing baseline failed across 10 test suites.

#### 6. Bukti Isolasi Git (`git status --porcelain`):
```
 M apps/web/TASK.md
 M apps/web/src/app/(workspace)/workspace/loading.tsx
 M apps/web/src/components/patterns/index.ts
 M apps/web/src/components/patterns/summary-strip.tsx
?? apps/web/src/components/patterns/date-picker.tsx
?? apps/web/src/components/patterns/patterns-p4.test.ts
 M apps/web/src/features/attendance/components/attendance-workspace-client.tsx
 M apps/web/src/features/audit/components/audit-workspace-client.tsx
 M apps/web/src/features/consent/components/consent-workspace-client.tsx
 M apps/web/src/features/media/components/media-workspace-client.tsx
 M apps/web/src/features/organization/components/contextual-dashboard-view.tsx
 M apps/web/src/features/students/components/public-registration-wizard.tsx
 M apps/web/src/features/students/components/student-detail-client.tsx
 M apps/web/src/lib/status/index.ts
 M migration/MIGRATION-STATE.md
```
Tepat 13 file kode aplikasi/test dalam `apps/web/src/` (sesuai allow-list §2) + 2 file dokumentasi wajib (`TASK.md` & `MIGRATION-STATE.md`). Nol modifikasi pada file C5 (RBAC/seed/auth), C7 (domain logic/action/service), maupun C8 (artefak P1/P2/P3 yang terkunci).

---

## 5. Catatan Review & Audit (Diisi oleh Claude setelah Eksekutor melapor)

**STATUS: APPROVED**

> Audit siklus **#2** — `FASE 19 STEP 2 — P4`. Worktree diperiksa langsung (HEAD `270189`, worktree kotor = hasil siklus #2). Seluruh perintah verifikasi (`typecheck`, `eslint`, `vitest`) dijalankan ulang **secara mandiri** oleh auditor; tidak ada file kode aplikasi yang diubah oleh auditor.

**Ringkasan putusan:** Seluruh temuan siklus #1 **tuntas** dan diverifikasi ulang pada kode nyata — **MAJOR-1** (duplikasi id DOM) benar-benar hilang (tiap id turunan kini dirender **tepat 1×** dengan `htmlFor` unik per presentasi), dan **MINOR-1/2/4/5/6** ditutup sesuai arahan §D siklus #1. Tidak ada regresi P1–P3, deny-list **0 baris**, allow-list tetap **tepat 14 file** + 2 dokumentasi. `npm run typecheck` **0 error**, `eslint` **0 error/0 warning** pada seluruh 13 file kode §2, dan suite target **52/52 hijau di 8 berkas** (`patterns-p4.test.ts` naik ke **16 assert**). Satu-satunya kegagalan suite agregat adalah baseline pra-eksisting (manifest PWA `background_color`) dan **satu flake environment DB** (`statement timeout` pada `attendance-sync.integration.test.ts` yang **lulus 4/4 saat dijalankan terisolasi**) — keduanya bukan regresi P4.

---

### A. Verifikasi Isolasi & Allow-List 14 File (§2) — **LULUS**

`git status --porcelain` dijalankan ulang oleh auditor (identik dengan klaim Bagian 4, tanpa entri tambahan — total **15 baris**):

```
 M apps/web/TASK.md
 M apps/web/src/app/(workspace)/workspace/loading.tsx
 M apps/web/src/components/patterns/index.ts
 M apps/web/src/components/patterns/summary-strip.tsx
 M apps/web/src/features/attendance/components/attendance-workspace-client.tsx
 M apps/web/src/features/audit/components/audit-workspace-client.tsx
 M apps/web/src/features/consent/components/consent-workspace-client.tsx
 M apps/web/src/features/media/components/media-workspace-client.tsx
 M apps/web/src/features/organization/components/contextual-dashboard-view.tsx
 M apps/web/src/features/students/components/public-registration-wizard.tsx
 M apps/web/src/features/students/components/student-detail-client.tsx
 M apps/web/src/lib/status/index.ts
 M migration/MIGRATION-STATE.md
?? apps/web/src/components/patterns/date-picker.tsx
?? apps/web/src/components/patterns/patterns-p4.test.ts
```

- Tepat **12 file kode UBAH + 2 file BARU = 14 file** allow-list §2, plus 2 artefak dokumentasi (`TASK.md`, `migration/MIGRATION-STATE.md`). **0 file di luar allow-list.**
- **Deny-list 100% steril** (diverifikasi via `git diff --numstat -- 'apps/web/src/**'` + `git diff --stat` per path, bukan asumsi): `src/config/icons.ts` → **0 kunci baru `ICON_MAP`** (C1, `calendar` dipakai ulang) ✔; `src/components/ui/*` 0 baris (`input.tsx`/`button.tsx`/`icon.tsx`/`skeleton.tsx` read-only) ✔; `src/styles/*.css` 0 baris (C4) ✔; `src/utils/date-formatter.ts` 0 baris ✔; `src/components/layout/*` termasuk `app-shell.tsx`, `sidebar.tsx`, `workspace-header.tsx`, `mobile-navigation.tsx`, `page-container.tsx`, `workspace-bottom-nav.tsx`, `layout-shell.test.ts` → **0 baris** (C8) ✔; artefak P2/P3 (`ui/sheet.tsx`, `form-bottom-sheet.tsx`, `entity-header.tsx`, `page-header.tsx`, `data-table.tsx`, `stat-summary.tsx`, `mobile-card-list.tsx`, `patterns-mobile.test.ts`) → **0 baris** (C8) ✔.
- **C5 (RBAC/P5) steril:** 0 sentuhan `db/seed/*`, `permission-resolver.ts`, `server/auth/*`, `migration/RBAC-MATRIX.md`, `rbac.integration.test.ts`, `features/students/permissions/*` ✔.
- **C7 steril:** `features/*/actions|services|validators/*` dan `*.test.ts` non-guardrail 0 baris; query loader `src/app/**/page.tsx` 0 baris ✔. `features/audit/types/audit-types.ts` **0 baris (no-op)** — `git diff` kosong, membuktikan `ENTITY_TYPE_OPTIONS` memang semula lokal di `audit-workspace-client.tsx` (MINOR-6 terkonfirmasi).
- **C6:** 0 `eslint-disable`, 0 `any`; `package.json`/`tsconfig.json`/`next.config.*`/`vitest.config.*` 0 baris ✔.
- **Batas perubahan per file dipatuhi:** `student-detail-client.tsx` hanya 1 baris import + blok `<DatePicker>` (7+/14−), `FormBottomSheet` utuh (`:991`, `:1008`, `:1026`) ✔; `contextual-dashboard-view.tsx` hanya **1 baris komentar** (1+/1−) ✔; `patterns/index.ts` hanya **1 baris ekspor** (`./date-picker` alfabetis setelah `./data-table`) ✔; `loading.tsx` hanya import + `<SummaryStripSkeleton />` (3+/7−) ✔; `lib/status/index.ts` **aditif murni** 32+/0− ✔.

---

### B. Audit Kontrak §1.A–§1.G (verifikasi ulang siklus #2)

| Butir | Hasil | Bukti |
|---|---|---|
| §1.A.1 lokasi + `"use client"` + 0 dependency baru | **LULUS** | `date-picker.tsx:1`; import hanya `@/components/ui`, `@/config/icons`, `@/lib/cn`, `@/utils/date-formatter` |
| §1.A.2 props | **LULUS** | 14 props persis §1.A.2; `id?: string` opsional tetap sah karena `useId()` menjadi fallback (`:48‑49`) |
| §1.A.3 dua presentasi satu nilai, ambang `md` | **LULUS** | `:89` `relative md:hidden` + `:144` `hidden md:block`; overlay native `absolute inset-0 h-full w-full opacity-0` (`:139`); 0 `useMediaQuery`/`matchMedia`/`window.innerWidth` |
| **§1.A.4 keunikan id turunan** | **LULUS (MAJOR-1 TUNTAS)** | `:50‑52` `mobileDisplayId`/`mobileNativeId`/`desktopNativeId`; `htmlFor={mobileDisplayId}` (`:64`) + `htmlFor={desktopNativeId}` (`:75`); `id={mobileDisplayId}` (`:92`), `id={mobileNativeId}` (`:127`), `id={desktopNativeId}` (`:146`) — **tiap atribut id tepat 1×**, nol duplikasi DOM, tiap `htmlFor` menunjuk target unik yang dirender |
| §1.A.4 `aria-describedby` / `aria-invalid` | **LULUS (MINOR-5 TUNTAS)** | `:56` `describedById = error ? errorId : hint ? hintId : undefined` diteruskan ke **ketiga** kontrol (`:99`, `:137`, `:156`); `aria-invalid` (`:98`, `:136`, `:155`); `<p id={hintId}>` (`:162`) & `<p id={errorId}>` (`:168`) nyata |
| §1.A.4 `aria-controls` | **LULUS dgn pengecualian terdokumentasi** | Target `nativeId` kini unik, namun pemiliknya tombol dekoratif `pointer-events-none`+`tabIndex={-1}`; MINOR-1 siklus #1 memerintahkan penghapusannya → dipatuhi. `git grep aria-controls -- src/` → 0 hit di `date-picker.tsx`. Tidak ada kontrol fokusabel yang kehilangan `aria-controls`; **tidak memblokir**, dicatat di §F |
| §1.A.5 satu `onChange`, display hanya saat `value` terisi | **LULUS** | 1 `onChange` per kontrol; 0 state duplikat; `displayValue = value ? formatToIndonesianStandard(value) : ""` (`:57`) |
| §1.A.6 a11y & target sentuh | **LULUS (MINOR-1 TUNTAS)** | label `type-label` (`:65`, `:76`); wrapper + `Button` + `Icon` `aria-hidden="true"` (`:103`, `:112`, `:118`); **0** `aria-label="Pilih tanggal"`; `min-h-11` pada `Input` (`:100`, `:157`) & `Button` (`:113`) |
| §1.B `summaryStripGridClass` + `SummaryStripSkeleton` | **LULUS (MINOR-4 TUNTAS)** | `summary-strip.tsx:23‑24` string **identik** kelas lama; root `:50` & skeleton `:138` memakai konstanta; skeleton `:131‑136` **`aria-hidden="true"` tanpa `aria-label`**; server-safe |
| §1.C `AUDIT_ENTITY_META` + `getAuditEntityLabel` | **LULUS** | `lib/status/index.ts:129‑160`; 11 label **identik** opsi lama (dibandingkan baris per baris terhadap diff), `?? code` fallback, 0 I/O, konstanta existing 0 baris berubah |
| §1.D.1 `ATTENDANCE_OPTIONS` dari `ATTENDANCE_STATUS_META` | **LULUS** | 4 entri memakai `ATTENDANCE_STATUS_META.{PRESENT,SICK,PERMITTED,ABSENT}.label`; `ABSENT` = `"Tidak hadir"` (`lib/status/index.ts:71`); `git grep -i "Alpa" -- src/features/attendance` → **0 hit** |
| §1.D.2 / §1.D.3 | **LULUS** | `entityType.replace(` 0 hit; 0 konstanta label domain baru di level komponen |
| §1.E C1–C8 | **LULUS** | lihat §A |
| §1.F migrasi ikon parsial | **LULUS** | `public-registration-wizard.tsx`: `CheckCircle2`/`CloudOff`/`ShieldCheck` → `ICON_MAP.checkCircle`/`cloudOff`/`shieldCheck`; `RotateCcw` dipertahankan & dicatat ✔; `media-workspace-client.tsx` import `lucide-react` dipertahankan ✔ |
| §1.G.1 R-MAJ-1 | **LULUS** | `contextual-dashboard-view.tsx:186` komentar = `Orientation -> Ringkasan operasional -> [Perlu perhatian & Jadwal belajar] -> Aktivitas terbaru`; `order-*` 0 perubahan (diff 1+/1−) |
| §1.G.2 R-MAJ-2 | **LULUS** | `loading.tsx`: import + `<SummaryStripSkeleton />`; **0 hit** `min-w-[78%]`/`snap-`/`divide-x`/`sm:grid-cols-2`; `DashboardBodySkeleton` tetap diekspor |
| §1.G.3 R-MAJ-3 | **LULUS** | `summary-strip.tsx:70` = `opacity-70 text-primary group-hover:opacity-100 transition-opacity` |
| §1.G.4 R-MIN-1 | **LULUS** | `audit-workspace-client.tsx`: baris 1 = `getAuditEntityLabel(row.entityType)` + ID 8 char `font-mono`; tanggal di `badge`; tepat **1** `Badge` aksi + `Oleh: {actorName}` di `primaryMeta`; satu aksi `Riwayat Audit` `min-h-10`; 0 `ENTITY_TYPE_OPTIONS` lokal (filter `<option value="ALL">` + `Object.entries(AUDIT_ENTITY_META)`) |
| §1.G.5 R-MIN-2 | **LULUS** | `consent-workspace-client.tsx`: tepat **1** `<Button>` + `<button>` teks (`min-h-10 text-xs text-danger underline-offset-4 hover:underline focus-ring`); kondisi `canUpdate` & `=== "GRANTED"` identik |
| §1.G.6 R-DOK | **LULUS** | Bagian 4 §4 mencatat 3 kunci aditif P3 presisi; **0 kunci baru P4** |
| §1.G.7 R-TEST-2 | **LULUS (MINOR-2 TUNTAS)** | assert #8 memakai `matchAll(/min-w-\[78%\]/g).length >= 2` **dan** mengunci `/className="([^"]*snap-start[^"]*)"/g` → **`length === 2`** dengan verifikasi `min-w-[78%]` pada **kedua** varian (`Link` ber-`href` & `div` statis) |

**Penutupan backlog P3:** R-MIN-1 ✔ · R-MIN-2 ✔ · R-MAJ-1 ✔ · R-MAJ-2 ✔ · R-MAJ-3 ✔ · R-DOK ✔ · R-TEST-2 ✔. **Nol backlog P3 tersisa.**


### C. Audit Guardrail `patterns-p4.test.ts` & Verifikasi Eksekusi (independen)

**Jumlah assert:** **16 `it()`** (14 wajib §3 Task 11 + #15 ekspor + #16 a11y `aria-describedby`) — tanpa `it.each`/loop tersembunyi; tiap `it` memakai `readFileSync` + ekstraksi string kelas nyata (`match`/`matchAll`), bukan regex boolean vakum ✔ (preseden P2 #3 / P3 #6). Assert #4 diperkuat menjadi pengunci **keunikan** (`id={x}` tepat 1× per id) dan assert #8 menjadi pengunci **2 wrapper** — keduanya kini benar-benar menangkap cacat siklus #1.

| Perintah (dijalankan ulang auditor) | Hasil |
|---|---|
| `npx tsc --noEmit -p tsconfig.json` (= `npm run typecheck`) | **exit 0**, 0 error |
| `npx eslint` pada 13 file kode §2 (+ `patterns-p4.test.ts`) | **exit 0**, 0 error + 0 warning (tanpa output) |
| `npx vitest run` pada 8 berkas suite target | **8/8 berkas, 52/52 test hijau** |
| `npx vitest run src/components/patterns src/components/layout src/components/ui src/lib/status src/features/attendance src/features/audit src/features/consent` | `Test Files 2 failed \| 8 passed (10)` · `Tests 1 failed \| 54 passed \| 4 skipped (59)` — lihat catatan baseline |
| `npx vitest run src/features/attendance/attendance-sync.integration.test.ts` (terisolasi) | **1/1 berkas, 4/4 test hijau** (8.97s) |

**Rincian suite target hijau:** `patterns-p4` **16**, `layout-shell` **11**, `patterns-mobile` **10**, `attendance` **4**, `consent` **4**, `audit` **3**, `status` **2**, `ui-primitives` **2** = **52**.

**Dua kegagalan pada suite agregat — keduanya BUKAN regresi P4:**
1. `patterns-and-pwa.test.ts:62` — `expect(manifest.background_color).toBe("#F7F8F4")` menerima `"#1F6650"`. **Pra-eksisting/environmental**: manifest & `public/` **0 baris** di worktree (tidak mungkin disebabkan P4); kegagalan sama tercatat identik di arsip P1/P2/P3.
2. `attendance-sync.integration.test.ts` — `PostgresError` **`code: '57014'` (statement timeout)** saat berjalan paralel bersama 9 berkas lain; **lulus 4/4 (8.97s) saat dijalankan terisolasi**. Murni flake beban environment DB, bukan kegagalan logika; berkas uji ini **0 baris** di worktree (C7).

**Regresi P1–P3:** **0.** `patterns-mobile.test.ts` (10) & `layout-shell.test.ts` (11) hijau **tanpa perubahan berkas**; seluruh artefak P1/P2/P3 **0 baris** di `git diff`.


### D. Verifikasi Penutupan Temuan Siklus #1 — semua TUNTAS

| # | Prioritas | Temuan siklus #1 | Status | Bukti verifikasi auditor |
|---|---|---|---|---|
| MAJOR-1 | MAJOR | id DOM duplikat (`-display`/`-native` dipakai 2 elemen), `htmlFor` ambigu | **TUNTAS** | 3 id turunan unik per presentasi (`-mobile-display`, `-mobile-native`, `-desktop-native`); tiap `id=` tepat 1×; `htmlFor` mobile→display (`:64`), desktop→desktop-native (`:75`); guardrail #4 mengunci keunikan |
| MINOR-1 | MINOR | tombol kalender dekoratif membawa `aria-label`/`aria-controls` meski non-fokusabel | **TUNTAS** | wrapper `aria-hidden="true"` (`:103`), `Button` `aria-hidden="true"` + `tabIndex={-1}` (`:111‑112`); 0 `aria-label="Pilih tanggal"` (guardrail #2) |
| MINOR-2 | TEST | assert #8 hanya mengambil `className` pertama, varian statis tak terkunci | **TUNTAS** | `matchAll` + `length === 2` untuk wrapper `snap-start`, keduanya diperiksa `min-w-[78%]` |
| MINOR-4 | MINOR | `aria-label` + `aria-hidden="true"` pada root skeleton yang sama | **TUNTAS** | `summary-strip.tsx:131‑136` hanya `aria-hidden="true"`; guardrail #6 mengunci ketiadaan `aria-label` |
| MINOR-5 | MINOR | id `-hint`/`-error` dihitung tapi tak pernah dirujuk | **TUNTAS** | `describedById` (`:56`) diteruskan ke 3 kontrol (`:99`, `:137`, `:156`) + `aria-invalid`; guardrail #16 mengunci perutean |
| MINOR-6 | DOK | ketidakjelasan status `audit-types.ts` | **TUNTAS** | Bagian 4 butir 5 menegaskan no-op; `git diff -- audit-types.ts` → **kosong** |
| MINOR-3 | opsional | prop aditif `bordered` pada skeleton | **DITERIMA (non-blokir)** | default kompatibel (`bordered = true`), tidak mengubah API wajib §1.B — cukup dicatat |

**Kriteria lulus siklus #2 (§E siklus #1) — semuanya terpenuhi:** (1) tiap id turunan **tepat 1×** dan tiap `htmlFor` menunjuk id yang dirender ✔; (2) `typecheck` 0 error · `eslint` 0 error/0 warning · `patterns-p4.test.ts` **16** assert hijau · suite target **52/52** ✔; (3) `git status` tepat 14 file allow-list + 2 dokumentasi, deny-list **0 baris** ✔.

### E. Catatan arsitektural final (preseden mengikat untuk P5/backlog)

1. **`DatePicker` adalah primitif tanggal kanonik** — `type="date"` mentah **0 hit** di luar `date-picker.tsx` (bukti `git grep --untracked -n 'type="date"' -- src/`). Pemakaian baru wajib lewat primitif ini.
2. **Pola dua-presentasi-satu-`onChange` kini baku:** ketika dua wadah dirender bersamaan (CSS-hide, bukan render kondisional), id turunan **wajib berbeda per wadah** dan `htmlFor` wajib menunjuk wadah yang tepat. Cacat siklus #1 adalah contoh kanonik pelanggaran ini.
3. **Elemen dekoratif `pointer-events-none`/`tabIndex={-1}` tidak boleh membawa affordance a11y aktif** (`aria-label`, `aria-controls`) — gunakan `aria-hidden="true"`. Preseden ini **mengalahkan** pembacaan literal §1.A.4 soal `aria-controls` (lihat §B baris `aria-controls`).
4. **Guardrail harus mengunci ketiadaan, bukan hanya keberadaan** — assert #4/#8 siklus #2 membuktikan `toContain` saja tidak cukup.
5. **Flake DB pada suite agregat wajib diverifikasi terisolasi** sebelum dinyatakan gagal — `57014 statement timeout` di bawah paralelisme bukan regresi kode.
6. **`AUDIT_ENTITY_META` di `lib/status` adalah satu-satunya sumber label entitas audit** — `entityType.replace(` dilarang (0 hit).


### F. Yang tetap terbuka setelah P4 (backlog jangka panjang, bukan blokir)

- **R6 (warisan P2):** nested `Dialog.Root` di `FormBottomSheet` — butuh TASK tersendiri.
- **`RotateCcw` tanpa kunci `ICON_MAP`:** migrasi `public-registration-wizard.tsx` tetap **partial** (sesuai §1.F; kunci yatim dilarang).
- **`aria-controls` pada `DatePicker`:** tidak ada kontrol fokusabel yang membawa `aria-controls` setelah MINOR-1. Bila kelak tombol kalender dijadikan kontrol fokusabel sungguhan (bukan dekoratif), `aria-controls={mobileNativeId}` wajib dikembalikan bersamaan dengan `aria-label` — kandidat perbaikan a11y P5+.
- **`rgba()`/`oklch()` inline di `features/**`** belum dipindai guardrail mana pun — kandidat audit P5+.

---
<!-- Auditor: Cline (VS Code), siklus #2. Metode: pembacaan diff per-file + `git status`/`git grep`/`git diff --numstat` ulang + typecheck/eslint/vitest independen (termasuk isolasi berkas integrasi DB). Tidak ada file kode aplikasi yang diubah oleh auditor. -->
---

## 6. Arsip

> Jejak keputusan lintas fase. Detail lengkap: riwayat git `apps/web/TASK.md`.

### 6.4 FASE 19 STEP 2 — P3 `MobileCardList` + `SummaryStrip` + Orientasi/Ringkasan Header (`APPROVED`)

> Ringkasan status akhir P3. Detail lengkap: §5 (Bagian 5, audit siklus **#1**) pada commit `270189` + riwayat git `apps/web/TASK.md`.

**Siklus:** Audit #1 **`APPROVED`** (nol temuan `BLOCKER`/`MAYOR` pemblokir; 7 temuan non-blocking diturunkan ke P4). Baris dasar: worktree bersih di `270189`, `patterns-mobile.test.ts` + `layout-shell.test.ts` + `ui-primitives.test.ts` = **23/23 hijau**.

**Deliverable (ringkas):**

| File | Perubahan |
|---|---|
| `src/components/patterns/mobile-card-list.tsx` | **Baru** — primitif kartu mobile (`title`/`description`/`badge`/`primaryMeta`/`secondaryMeta`/`action`), tanpa nested list |
| `src/components/patterns/summary-strip.tsx` | **Baru** — strip ringkasan horizontal `min-w-[78%]` (snap) → grid `sm:grid-cols-2 lg:grid-cols-4` |
| `src/components/patterns/index.ts` | Ekspor 2 primitif baru |
| `src/features/{audit,consent,attendance,...}/components/*-workspace-client.tsx` | Migrasi `renderMobileRow` → `MobileCardList`; ringkasan → `SummaryStrip` |
| `src/features/organization/components/contextual-dashboard-view.tsx` | Ringkasan operasional + orde mobile `order-*` |
| `src/config/icons.ts` | +3 kunci aditif `ICON_MAP` (`arrowRight`, `calendar`, `arrowUpRight`) |
| `src/components/patterns/patterns-mobile.test.ts` | **Baru** — 10 guardrail `readFileSync` + ekstraksi string kelas nyata |
| `apps/web/TASK.md`, `migration/MIGRATION-STATE.md` | Dokumentasi + entri `PHASE-19-STEP2-P3` |

**Verifikasi yang dilaporkan & diverifikasi auditor:** `typecheck` 0 error · `eslint` 0 error/warning · `patterns-mobile.test.ts` 10/10 + `layout-shell.test.ts` 11/11 + `ui-primitives.test.ts` 2/2 = **23/23 hijau**. Kegagalan suite penuh (manifest PWA `background_color`, Mailpit, public slug, `db/client`) terbukti **pra-eksisting/environmental** — daftar identik dengan P1/P2.

**Isolasi:** seluruh file *modified* berada di Bagian 2 P3 (+ `TASK.md`, `MIGRATION-STATE.md`, dan `icons.ts` kunci aditif). Nol file C5 (RBAC/seed/auth), nol file C7 (action/service/validator/test domain), artefak P1/P2 (`sheet.tsx`, `form-bottom-sheet.tsx`, `layout-shell.test.ts`, `themes.css`, `data-table.tsx`) **bersih total**.

**Preseden mengikat untuk P4 (8 butir):**

1. **`MobileCardList` adalah markup final, bukan draft** — hierarki 4 baris (`title` → `description` → `primaryMeta` → `secondaryMeta`) + satu wadah `action`. P4 **dilarang** mengubah primitif ini; perbaikan hierarki dilakukan di **data yang dioper** pemanggil (kasus R-MIN-1).
2. **Maksimal satu aksi primer per kartu** — turunan langsung §1.C P3. Aksi destruktif sekunder wajib turun menjadi tautan `<button>` teks `min-h-10` (kasus R-MIN-2), bukan `Button` kedua.
3. **`SummaryStrip` = pemilik tunggal kelas strip** — setiap konsumen (termasuk skeleton rute) wajib mengambil kelas dari primitif. Duplikasi di `loading.tsx` adalah **utang yang harus ditutup P4** (R-MAJ-2), bukan preseden.
4. **Affordance tautan wajib tampak di layar sentuh** — ikon `opacity-0 group-hover:opacity-100` hanya sah di perangkat berpointer; P4 wajib menaikkan ke `opacity-70` + `text-primary` (R-MAJ-3).
5. **Komentar orde visual = dokumentasi kontrak** — komentar yang tidak sinkron dengan `order-*` adalah temuan `MAYOR` (R-MAJ-1). Setiap perubahan orde wajib memperbarui komentar di commit yang sama.
6. **Ekstraksi string kelas nyata adalah baku** — regex coarse dilarang (preseden P2 #3 diperkuat P3). Guardrail P4 **wajib** memakai `matchAll` dan memeriksa **setiap** varian wrapper, bukan satu contoh (R-TEST-2).
7. **Label domain wajib dari `src/lib/status`** — label hardcoded di `features/*/components` adalah sumber drift (ditemukan pada `ATTENDANCE_OPTIONS`). Normalisasi label = scope P4.
8. **Utang non-blocking P3 terbuka semua di P4** — R-MIN-1, R-MIN-2, R-MAJ-1, R-MAJ-2, R-MAJ-3, R-DOK, R-TEST-2 dipindahkan **utuh** ke §1.G TASK P4. Tidak ada yang boleh diselesaikan sebagai "koreksi retroaktif" pada file P3 di luar allow-list P4; `summary-strip.tsx` & `loading.tsx` **masuk** allow-list P4 dengan batas perubahan eksplisit.

**Catatan non-blocking yang tetap terbuka setelah P4 (backlog jangka panjang):**

- **R6 (warisan P2):** nested `Dialog.Root` di `FormBottomSheet` — utang a11y, tidak boleh disentuh sampai ada TASK tersendiri.
- **Cakupan assert P2:** `id="*-dialog-form"` hanya menyentuh satu file.
- **`RotateCcw` tanpa kunci `ICON_MAP`:** migrasi ikon `public-registration-wizard.tsx` bersifat **partial** di P4 (lihat §1.F). Menambah kunci demi migrasi parsial **dilarang** (C1: kunci baru hanya bila benar-benar dipakai).
- **`rgba()`/`oklch()` inline** di `features/**` belum dipindai guardrail mana pun — kandidat audit P5+ (bukan P4).

### 6.1 FASE 19 STEP 1 — Audit Mobile-First & RBAC (SELESAI, `APPROVED`, REPORT-ONLY)

> Ringkasan dipertahankan untuk jejak keputusan. Detail lengkap: riwayat git `apps/web/TASK.md`.

**Fitur:** Audit Mobile-First Usability & Simplifikasi RBAC (**REPORT-ONLY**, tanpa perubahan kode aplikasi).
**Output:** 12 temuan friksi mobile (M1–M12) + 5 temuan RBAC (R1–R5, lihat §1.B.1), matriks konsolidasi peran 11→6, permission grouping 5 grup, aturan adaptasi UI, wireframe W1–W4, tabel 7 komponen baru, prioritas P1–P5.

**Catatan Review (keputusan yang mengikat STEP 2):**
1. **Validasi friksi mobile:** `DataTable` + `renderMobileRow` sudah mobile-ready → tidak perlu merombak tabel desktop; fokus pada navigasi 1-tap + modal form.
2. **Koreksi breakpoint tablet:** `WorkspaceBottomNav` memakai `md:hidden` (`< 768px`); hamburger header **tetap** `lg:hidden` (`< 1024px`) agar tablet 768–1023px tidak blind spot. → dikodifikasikan di §1 butir A.
3. **Isolasi mutlak P5:** konsolidasi RBAC dipisah total dari P1–P4 (P1–P4 presentational & zero-risk terhadap DB/SoD/Auth). → dikodifikasikan di §1 butir C5.
4. **Kesiapan STEP 2:** blueprint W1–W4 disetujui; P1 (BottomNav & Layout Padding) menjadi langkah awal.

### 6.2 FASE 19 STEP 2 — P1 `WorkspaceBottomNav` + Kompensasi `PageContainer` (`APPROVED`)

**Deliverable (8 file):**

| File | Perubahan |
|---|---|
| `src/config/icons.ts` | +4 kunci aditif `ICON_MAP`: `dashboard`, `kehadiran`, `tataKelola`, `lainnya` |
| `src/components/layout/workspace-bottom-nav.tsx` | **Baru** — 4 slot prioritas + slot 5 "Lainnya" (`md:hidden`, `z-40`, safe-area, `aria-current`) |
| `src/components/layout/page-container.tsx` | Prop `bottomInset?: "none" \| "nav"` + `pb-[calc(5rem+max(env(safe-area-inset-bottom,0px),16px))] md:pb-0` |
| `src/components/layout/app-shell.tsx` | Render `WorkspaceBottomNav` sekali (+7 baris) |
| `src/components/layout/index.ts` | Ekspor komponen baru |
| `src/components/layout/layout-shell.test.ts` | **Baru** — 6 guardrail `readFileSync` |
| `apps/web/TASK.md`, `migration/MIGRATION-STATE.md` | Dokumentasi + entri `PHASE-19-STEP2-P1` |

**Verifikasi yang dilaporkan:** `typecheck` 0 error · `eslint` 0 warning · `layout-shell.test.ts` + `ui-primitives.test.ts` 8/8 hijau · `npm run build` sukses (31 static pages). Kegagalan suite penuh (manifest PWA `background_color`, `rbac.integration`, `public-experience.integration`, `db/client`) terbukti **pra-eksisting/environmental**.

**Isolasi:** tepat 8 file Bagian 2 (+ `.clinerules` pra-eksisting). `sheet.tsx`, `dialog.tsx`, `themes.css`, `(public)/layout.tsx`, `(workspace)/layout.tsx` **bersih total**; nol file C5.

**Preseden mengikat untuk P2+ (8 butir):**
1. **Tanpa duplikasi Sheet** — slot "Lainnya" me-reuse `MobileNavigation` (sumber tunggal drawer, `side="left"` terjamin). P2 melanjutkan prinsip "satu sumber, banyak pemakai" lewat `FormBottomSheet`.
2. **Hamburger + BottomNav koeksis di `< 768px` adalah kesengajaan** (header `lg:hidden` ⊃ mobile) — bukan bug; jangan "diperbaiki" tanpa TASK.md tersendiri.
3. **`md:pb-0`** berarti wadah dengan elemen `fixed` sendiri di ≥768px memakai `bottomInset="none"` (jalur kontrak sudah tersedia).
4. **Guardrail `toContain` bersifat coarse** — mengunci keberadaan kelas, bukan posisi/nilai; tetap dipakai P2 karena cocok untuk payload `readFileSync`.
5. **`PRIORITY_HREFS` presentational statis** — aman dari konsolidasi RBAC; bila `getPageCapability` lahir di P5, visibilitas slot harus diturunkan dari capability.
6. **`sheet.tsx` steril setelah P1** → P2 boleh memperluas union `SheetSide`, tetapi cabang `left`/`right` wajib identik (di-guardrail `side="left"` + default `"right"`).
7. **`themes.css` belum pernah disentuh** sampai P2 → sentuhan pertama harus aditif murni (1 keyframe + 1 kelas).
8. **Semua dialog form students masih `DialogContent`** — belum ada migrasi parsial, sehingga P2 memigrasikan 5 dialog sekaligus agar tidak ada state campuran.


### 6.3 FASE 19 STEP 2 — P2 Sheet `side="bottom"` + `FormBottomSheet` + Migrasi 5 Dialog Students (`APPROVED`)

> Ringkasan status akhir P2. Detail lengkap: §5 (Bagian 5) pada commit `35109eb` + riwayat git `apps/web/TASK.md`.

**Basis:** `db7e582` (`feat`) + `35109eb` (`fix(mobile): resolve R1—R8`). **Siklus:** Audit #1 `NEEDS REVISION` (R1—R8) —> Audit #2 **`APPROVED`**.

**Deliverable (9 file Bagian 2):**

| File | Perubahan |
|---|---|
| `src/styles/themes.css` | +`@keyframes sheetSlideBottom` + `.animate-sheet-bottom` (240ms `cubic-bezier(0.32,0.72,0,1)`), aditif, tanpa `@media` baru |
| `src/components/ui/sheet.tsx` | `SheetSide = "left" \| "right" \| "bottom"`; default tetap `"right"`; cabang `bottom` tanpa `inset-y-0`/`h-full`; grabber dekoratif; `insetBottom` + `safeArea` via `SheetContext` |
| `src/components/patterns/form-bottom-sheet.tsx` | **Baru** — Dialog (`hidden md:block`) + Sheet (`md:hidden`) satu sumber; `children`/`footer` sebagai *factory* `(formId, isMobile)`; `useId()` per wadah |
| `src/components/patterns/index.ts` | Ekspor `form-bottom-sheet` |
| `src/features/students/components/student-detail-client.tsx` | 3 dialog (Verifikasi, Tempatkan, Ubah profil) —> `FormBottomSheet`; `renderXForm`/`renderXFooter`; `autoFocus`; `fullWidth={isMobile}` |
| `src/features/students/components/students-workspace-client.tsx` | 2 dialog (Tambah `bodyClassName="p-0"` + `dialogClassName="max-w-2xl"`, Tempatkan cepat) |
| `src/components/layout/layout-shell.test.ts` | 11 guardrail (6 P1 + 5 P2), termasuk ekstraksi string kelas cabang bottom |
| `apps/web/TASK.md`, `migration/MIGRATION-STATE.md` | Dokumentasi + entri `PHASE-19-STEP2-P2` |

**Matriks R1—R8 (status akhir):**

| # | Prioritas | Tuntutan | Status akhir |
|---|---|---|---|
| R1 | BLOCKER | Eliminasi `id`/`form` literal; id form per wadah via `useId()` di `FormBottomSheet` | **TUNTAS** |
| R2 | BLOCKER | Satu sumber markup form (*factory*), tanpa `<form>` inline ganda | **TUNTAS** |
| R3 | MAYOR | `autoFocus` field pertama di 5 form | **TUNTAS** |
| R4 | MAYOR | `overscroll-contain` (Body) + `shrink-0` (Header/Footer/grabber) | **TUNTAS** |
| R5 | MAYOR | CTA `fullWidth` hanya di varian Sheet (`isMobile`) | **TUNTAS** |
| R6 | MINOR | Nested `Dialog.Root` dicatat sebagai utang a11y | **DICATAT** (tidak menahan approval) |
| R7 | DOKUMENTASI | Koreksi Bagian 4 + status `MIGRATION-STATE` | **TUNTAS** |
| R8 | TEST | Perkuat guardrail `layout-shell.test.ts` (regex bottom tidak lagi vakum) | **TUNTAS** |

**Verifikasi yang dilaporkan & diverifikasi auditor:** `typecheck` 0 error — `eslint` 0 error/warning — `layout-shell.test.ts` 11/11 + `ui-primitives.test.ts` 2/2 + `students.test.ts` 5/5 = **18/18 hijau** — `patterns-and-pwa.test.ts` 1 gagal (`manifest.background_color` **pra-eksisting**, dikecualikan).

**Isolasi:** 7 file *modified* saat audit, seluruhnya Bagian 2; nol file C5 (RBAC/seed/auth) & C7 (action/service/validator/tipe/test students); encoding diverifikasi tanpa BOM dan 0 U+FFFD.

**Preseden mengikat untuk P3 (10 butir):**

1. **Satu sumber, banyak pemakai** — pola `FormBottomSheet` (satu markup, dua wadah) menjadi baku. P3 **wajib** mengutamakan *reuse* `DataTable.renderMobileRow` dan `SummaryStrip` existing (dipakai 5 halaman), bukan komponen tandingan.
2. **Responsif berbasis kelas murni** — pasangan `hidden md:block` / `md:hidden` satu-satunya pola yang diizinkan; `useMediaQuery`/`matchMedia`/`window.innerWidth` tetap dilarang (0 hit sejak P2).
3. **Guardrail `readFileSync` wajib ekstraksi string nyata** — regex coarse (`[\\s\\S]*?:`) terbukti vakum di P2. Assert P3 harus mengekstrak **string kelas kandidat** (`content.match(/"[^"\n]*inset-x-0[^"\n]*"/)`), bukan mencocokkan literal boolean.
4. **`bg-*` ganda dilarang** — dua kelas background pada elemen yang sama = drift (kasus `SheetFooter` P2). P3: tepat satu kutipan `bg-*` per string kelas kandidat.
5. **`rounded-full` terlarang** — gunakan `rounded-pill`. Pemindai existing (`patterns-and-pwa.test.ts`, `ui-primitives.test.ts`) hanya memeriksa palet warna, **tidak** menangkap ini —> guardrail P3 wajib menambahkannya manual.
6. **`features/*/components` bukan zona bebas drift** — file client di `src/features/**` **tidak** dipindai test mana pun. Bukti: `contextual-dashboard-view.tsx` memakai ikon `lucide-react` langsung (`:7`), `min-w-[78%]` (`:235`) dan `divide-x` (`:201`). P3 memindahkan logika visual ke pattern (= otomatis diaudit `patterns-and-pwa.test.ts`) + guardrail khusus.
7. **`z-index` berjenjang tetap** — bottom nav `z-40`, header `z-30`, sheet/dialog `z-50`. P3 **dilarang** menambah lapisan `z-*` baru; `z-10` (sticky toolbar) tetap seperti adanya.
8. **`env(safe-area-inset-bottom)` hanya untuk elemen `fixed`/footer sticky** — strip scroll horizontal di dalam alur halaman **tidak** menambahkan safe-area (menghindari padding ganda di atas bottom nav).
9. **Ikon lewat `Icon` + `ICON_MAP`** — file pattern baru dilarang impor `lucide-react`; kunci `ICON_MAP` aditif, `strokeWidth` tidak dinormalisasi. Import langsung di file lama hanya boleh **diganti** kunci setara (ganti-atas-ganti), tidak boleh menambah kebutuhan ikon baru.
10. **Utang P2 non-blocking tetap terbuka** — (a) nested `Dialog.Root` (R6); (b) cakupan assert `id="*-dialog-form"` yang hanya menyentuh satu file. Keduanya boleh dibereskan di P3 **hanya** jika filenya masuk Bagian 2 P3; jika tidak, tetap backlog (jangan menyentuh artefak P2).

**Catatan non-blocking yang diturunkan ke P3:** R6 (nested `Dialog.Root`) dan §5.4 butir 2 (cakupan assert guardrail P2) — keduanya **tidak** memblokir dan **tidak** boleh memicu penyuntingan `form-bottom-sheet.tsx`, `student-detail-client.tsx`, `students-workspace-client.tsx`, `sheet.tsx`, `themes.css`, atau `layout-shell.test.ts` di P3 (di luar Bagian 2 P3).
