# TASK.md — Papan Estafet Pengembangan Fitur

> **Peran & Batasan:**
> - **Antigravity IDE (Gemini Pro - Architect & Reviewer):** Mengisi Bagian 1, 2, 3, dan 5. Dilarang mengubah file kode aplikasi.
> - **VS Code (Claude via Cline/Classai - Eksekutor):** Membaca Bagian 1–3, mengeksekusi kode, mencentang checklist Bagian 3, dan mengisi Bagian 4 (Log Perubahan).

---

## 1. Tujuan & Spesifikasi Fitur (Diisi oleh Gemini Pro)

- **Nama Fitur:** FASE 19 — STEP 2 PRIORITAS 3 (P3): `MobileCardList` + `SummaryStrip` + Orientasi & Ringkasan Header
- **Tujuan:**
  Menghadirkan **daftar entitas mobile-first** di viewport `< 768px` lewat primitif `MobileCardList` (kartu 3–4 baris esensial, maksimal **satu** aksi primer, target sentuh `≥ 44px`) dan **strip ringkasan** lewat primitif `SummaryStrip` (scroll-snap horizontal + *peek* kartu berikutnya di mobile, grid terbagi di `≥ 640px`), lalu **mengadopsinya** di `/workspace` (dashboard) dan 4 halaman list kanonik — **tanpa** menyentuh data, auth, DTO, maupun logika bisnis.
- **Sifat Pekerjaan:** **PRESENTATIONAL-ONLY.** Nol perubahan DB/seed/permission/sesi/DTO server/dependency. Nol perubahan signature server action & validator (hanya *wiring* presentational di client component).
- **Ruang Lingkup STEP 2:**
  | Prioritas | Isi | Status step ini |
  |---|---|---|
  | P1 | `workspace-bottom-nav` + padding `page-container` + koordinasi header | **SELESAI — `APPROVED`** (arsip §6.2) |
  | P2 | `ui/sheet.tsx` varian `side="bottom"` + primitif `form-bottom-sheet` + migrasi dialog form students | **SELESAI — `APPROVED`** (arsip §6.3, commit `35109eb`) |
  | **P3** | `mobile-card-list` + `summary-strip` + orientasi/ringkasan header (W2, W3, M3, M10) | **DIRANCANG — belum dieksekusi** |
  | P4 | `date-picker` + normalisasi label status | Tidak dikerjakan |
  | P5 | Konsolidasi RBAC (R1–R5) | **DILARANG disentuh** (C5) |

- **Aturan Arsitektural & Koordinasi Teknis (WAJIB):**

  **A. Responsif — satu markup, dua presentasi, ambang `md` (768px)**
  1. Guard **wajib** class-based. Breakpoint P3: **`< 768px` = kartu/mobile**, **`≥ 768px` = tabel/desktop**. Pasangan tampil/sembunyi memakai `md:`; `sm:` (640px) hanya untuk kepadatan grid di dalam satu komponen (mis. `SummaryStrip` 1 → 2 → 4 kolom).
  2. **Dilarang** memakai `useMediaQuery`/`matchMedia`/`window.innerWidth`/`visualViewport` sebagai penentu render (hydration mismatch + flash). Tidak ada util media query di repo; **jangan** membuatnya di P3.
  3. `DataTable` tetap satu-satunya jalur daftar utama halaman list: desktop `hidden md:block overflow-x-auto` + mobile `md:hidden` (`data-table.tsx:80-99`). P3 **wajib** memakai `renderMobileRow` yang sudah ada, **bukan** dua pemanggilan komponen terpisah per breakpoint. **Dilarang** membuat `DataTable` tandingan atau menyalin markup tabel.
  4. `SummaryStrip` berdiri sendiri (bukan turunan `StatSummary`) tetapi **wajib** memakai kontrak visual strip dashboard yang sudah ada: `flex overflow-x-auto snap-x snap-mandatory` + `min-w-[78%]` + `sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:divide-x` + `-mx-4 px-4 sm:mx-0 sm:px-0`.

  **B. Kontrak Visual `SummaryStrip` (kontrak matematis)**
  - Root: `section[aria-label]` → `div` scroll-snap (`flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-y-6 sm:gap-x-6 sm:divide-x sm:divide-border sm:pb-0`).
  - Item: mobile `p-4 rounded-card border border-border-subtle bg-surface`; desktop `sm:border-0 sm:bg-transparent sm:p-0` (+ `sm:pl-6` untuk item dengan `index > 0` agar angka tidak menempel garis `divide-x`).
  - Tipografi item: nilai **`type-h1 text-foreground tabular-nums tracking-tight`**, label `text-sm font-semibold text-foreground`, konteks `type-caption text-secondary-foreground`. **Dilarang** ukuran font literal (`text-2xl`, `text-[18px]`) — wajib util `type-*`.
  - Item ber-`href` dirender `Link` (satu-satunya elemen interaktif); item statis `div` tanpa `role="button"`. Ikon indikator `aria-hidden="true"`.
  - Section opsional `bordered` → `border-y border-border`. **Dilarang** `shadow-*` pada item (kartu statis tanpa elevasi — preseden sub-sesi 11).
  - Wrapper item: `snap-start shrink-0 min-w-[78%] sm:min-w-0`. **Dilarang** `snap-center` (memotong tepi kiri di 375px).

  **C. Kontrak Visual `MobileCardList` (kartu baris untuk `DataTable.renderMobileRow`)**
  1. **Komposisi semantik:** `DataTable` sudah memiliki `ul[role="list"]` dan setiap baris berada di dalam `li`. Karena itu `MobileCardList` **tidak boleh** membuat `ul`/`li` baru ketika dipasang sebagai `renderMobileRow`; primitif ini merender satu kartu/baris (root `div`), sedangkan list semantik dan pemisah antarkartu tetap milik `DataTable`. Ini menghindari nested list, border ganda, dan perubahan pada P2 `DataTable`.
  2. Struktur isi 3–4 baris: **baris 1** identitas utama + status/badge; **baris 2** metadata utama (kelas/jenjang/wilayah); **baris 3** metadata sekunder (opsional); **baris 4** maksimal satu aksi primer (`min-h-10`), aksi sekunder berupa tautan teks di baris sama atau dihilangkan.
  3. Root kartu: `div` tanpa peran list, `space-y-2`/layout internal, tidak menambah border/padding luar karena `DataTable` menyediakan `li` `p-4` + `rounded-card border border-border bg-surface overflow-hidden` + `divide-y divide-border-subtle`. **Dilarang** `<table>`/`<th>`/`<td>` atau `overflow-x-auto`.
  4. Presentational-only; props `item` + `renderItem` (atau kontrak baris ekuivalen), tanpa state, server action, fetch, atau pengelolaan izin. Tombol/tautan aksi interior menghentikan propagasi (`e.stopPropagation()`) bila `DataTable` memakai `onRowClick`.

  **D. Orientasi & Ringkasan Header**
  1. `PageHeader` (`patterns/page-header.tsx`) **tidak diubah** — `flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-3` sudah menumpuk vertikal di `< 640px`; aksi primer `Button` sudah `min-h-11`.
  2. Dashboard memakai `DashboardOrientationHeader` → `PageHeader`. P3 hanya boleh menyunting markup internal header/strip di file target §2; **dilarang** memindahkan komponen lintas folder.
  3. `EntityHeader` **tidak** diubah (dipakai `student-detail-client.tsx` = artefak P2).

  **E. Isolasi & Anti-Drift (C1–C8 — mengikat seluruh P3)**
  - **C1.** Dilarang mengubah `DEFAULT_WORKSPACE_NAV`, `PRIORITY_HREFS`, dan kunci `ICON_MAP` yang sudah ada. Kunci `ICON_MAP` baru **hanya** aditif dan **hanya** bila benar-benar dipakai.
  - **C2.** File baru P3 (`mobile-card-list.tsx`, `summary-strip.tsx`) **dilarang** mengimpor `lucide-react`; ikon lewat `Icon` (`@/components/ui`) + `ICON_MAP` (`@/config/icons`). Di file lama yang dimigrasi, import `lucide-react` **hanya** boleh dihapus bila setiap ikonnya punya kunci `ICON_MAP` setara (`chevronRight`, `arrowRight`, `arrowUpRight`, `checkCircle`, `calendarCheck`, `peserta`, `history`, `lock`, `shieldCheck`, `plus` sudah ada); bila tidak ada, tambahkan kunci **aditif**. `strokeWidth={2}` milik `ICON_MAP` **tidak** dinormalisasi.
  - **C3.** Nol kelas palet hardcoded (`bg-*-500`, `text-gray-700`, dst.) dan nol heksadesimal warna di TSX; hanya token semantik (`bg-surface`, `text-foreground`, `text-secondary-foreground`, `text-muted-foreground`, `border-border`, `border-border-subtle`, `bg-surface-subtle`, `bg-primary-soft`, `text-primary`). **Dilarang** `rounded-full` → wajib `rounded-pill`. **Dilarang** `shadow-md`/`shadow-lg` pada kartu statis.
  - **C4.** Nol sentuhan `src/styles/*.css` (`tokens.css`, `typography.css`, `themes.css`). Nol keyframe/animasi baru; transisi hanya util existing (`transition-colors`).
  - **C5. Isolasi mutlak P5 RBAC:** dilarang menyentuh `db/seed/*`, `permission-resolver.ts`, `server/auth/*`, `migration/RBAC-MATRIX.md`, `rbac.integration.test.ts`, `features/students/permissions/student-policy.ts`, `app-shell.tsx`, `sidebar.tsx`. Proyeksi izin (`canVerifyStudent`, `canUpdate`, `canCreate`, `canViewAuditLog`, `vm.can*`) **dibaca apa adanya** — P3 **dilarang** menambah/menghapus/menurunkan kondisi izin; hanya boleh memindahkan letak render.
  - **C6.** Tanpa `any`, tanpa `eslint-disable`, tanpa mengubah `tsconfig`/`next.config`/`package.json`/`vitest.config`.
  - **C7.** Dilarang mengubah logika domain: `features/*/actions/*`, `features/*/services/*`, `features/*/types*.ts`, `features/*/validators/*`, query loader, serta seluruh `*.test.ts` non-guardrail (`students.test.ts`, `consent.test.ts`, `audit.test.ts`, `dashboard.integration.test.ts`, dll).
  - **C8.** Dilarang menyentuh artefak P1/P2: `workspace-bottom-nav.tsx`, `page-container.tsx`, `app-shell.tsx`, `mobile-navigation.tsx`, `workspace-header.tsx`, `layout-shell.test.ts`, `ui/sheet.tsx`, `patterns/form-bottom-sheet.tsx`, `patterns/entity-header.tsx`, `patterns/page-header.tsx`, `patterns/data-table.tsx`, `patterns/stat-summary.tsx`, `themes.css`, `student-detail-client.tsx`. Di `students-workspace-client.tsx` P2, satu-satunya area P3 yang diizinkan adalah ekspresi `renderMobileRow` daftar; dialog/sheet dan semua bagian lain tetap terlarang. Di `patterns/index.ts` hanya dua baris ekspor alfabetis baru.
- **Spesifikasi Visual (W2 + W3):**
  ```
  ┌──────────────────────────────────┐  ← < 768px (375px) — SummaryStrip
  │ [ 12      78%      ][ 8 ·peek22%]│  ← snap-x snap-mandatory, min-w-[78%]
  └──────────────────────────────────┘
  ┌──────────────────────────────────┐  ← MobileCardList — satu item
  │ Nama Peserta Didik      [Status] │  ← baris 1: identitas + badge
  │ Kelas A · SMP                    │  ← baris 2: metadata utama
  │ No. daftar · Panggilan           │  ← baris 3: metadata sekunder (opsional)
  │                      [ Aksi -> ] │  ← baris 4: MAKSIMAL satu aksi primer
  └──────────────────────────────────┘
  ┌──────────────────────────────────┐  ← ≥ 768px (md:) — tabel existing
  │ Peserta didik │ Jenjang │ Status │  ← DataTable `hidden md:block`
  └──────────────────────────────────┘
  ```
  - *Peek* kartu berikutnya ≈ 22% (`min-w-[78%]`) = petunjuk gulir tanpa teks instruksi tambahan.
  - Nol perubahan copy: seluruh label/status memakai konstanta existing (`STATUS_META`, `AUDIT_ACTION_LABELS`, `CONSENT_STATUS_META`). Normalisasi label status = **P4**.
  - `≥ 768px` = `DataTable` existing, tanpa perubahan visual.

- **Kriteria Selesai (STEP 2 — P3):**
  - [ ] `src/components/patterns/summary-strip.tsx` ada, **tanpa** `"use client"`, props `{ items: SummaryStripItem[]; ariaLabel?: string; bordered?: boolean; className?: string }`, item `{ id, value, label, context?, href?, badge? }`; memuat `snap-x`, `min-w-[78%]`, `sm:grid-cols-2`, `type-h1`; **tidak** memuat `rounded-full`, `shadow-md`, `lucide-react`, angka palet.
  - [ ] `src/components/patterns/mobile-card-list.tsx` ada sebagai kartu-baris presentational (tanpa hook/state/fetch; props item + renderer; root `div`, tanpa nested `ul`/`li`). List semantik dan border/padding luar tetap disediakan `DataTable`.
  - [ ] Kedua komponen diekspor dari `components/patterns/index.ts` secara alfabetis (jumlah ekspor bertambah dari 14 menjadi 16).
  - [ ] `/workspace`: `contextual-dashboard-view.tsx` memakai `SummaryStrip`; nol import langsung `lucide-react` setelah penggantian ikon memakai `Icon` + `ICON_MAP`; nol literal `min-w-[78%]`/`snap-*`/`divide-x` tersisa di file itu.
  - [ ] Empat halaman list (Peserta Didik, Persetujuan, Jejak Audit, Kehadiran) memakai kartu-baris `MobileCardList` di dalam `renderMobileRow`; `SummaryStrip` di halaman list hanya bila agregat sudah tersedia di VM. `DataTable` tetap tidak diubah.
  - [ ] Aksi kartu maksimal satu aksi primer (`min-h-10`); aksi interior menghentikan propagasi bila diperlukan.
  - [ ] Nol perubahan kondisi izin (`can*`/`vm.can*`) — hanya relokasi render (C5).
  - [ ] `layout-shell.test.ts` **tidak berubah** (11 assert hijau) + guardrail P3 `patterns-mobile.test.ts` minimal 10 assert (§3 Task 10).
  - [ ] Nol perubahan action/service/types/validator dan test non-guardrail; nol sentuhan artefak P1/P2/P5 (C5/C8); `git status --porcelain` hanya menyentuh §2.
  - [ ] `npm run typecheck` 0 error; eslint bersih untuk `src/components/patterns` + file dashboard dan 4 client list; `layout-shell.test.ts`, `ui-primitives.test.ts`, `patterns-and-pwa.test.ts`, `patterns-mobile.test.ts` hijau (kegagalan manifest PWA pra-eksisting dikecualikan & dicatat).
  - [ ] Entri `PHASE-19-STEP2-P3` ditambahkan di `migration/MIGRATION-STATE.md`.
## 2. File Target (Diisi oleh Gemini Pro)

- **Zona yang BOLEH dibuat/diubah (allow-list — 10 file):**

| # | File | Aksi | Batas perubahan |
|---|---|---|---|
| 1 | `src/components/patterns/summary-strip.tsx` | **BUAT** | Primitif presentational, server-safe, kontrak §1.B |
| 2 | `src/components/patterns/mobile-card-list.tsx` | **BUAT** | Primitif presentational kartu-baris untuk `renderMobileRow`, kontrak §1.C |
| 3 | `src/components/patterns/index.ts` | UBAH | Hanya 2 baris ekspor baru, urutan alfabetis |
| 4 | `src/components/patterns/patterns-mobile.test.ts` | **BUAT** | Berkas guardrail P3 (10 assert, §3 Task 10) |
| 5 | `src/features/organization/components/contextual-dashboard-view.tsx` | UBAH | Ganti strip manual & ikon `lucide-react` → `SummaryStrip` + `Icon`; layout/tata letak boleh disesuaikan |
| 6 | `src/features/students/components/students-workspace-client.tsx` *(render daftar)* | UBAH | **Hanya** isi `renderMobileRow` → `MobileCardList`; nol perubahan dialog/sheet P2 |
| 7 | `src/features/consent/components/consent-workspace-client.tsx` | UBAH | `SummaryStrip` bila tersedia agregat di VM + `renderMobileRow` → `MobileCardList` |
| 8 | `src/features/audit/components/audit-workspace-client.tsx` | UBAH | `SummaryStrip` bila tersedia agregat di VM + `renderMobileRow` → `MobileCardList` |
| 9 | `src/features/attendance/components/attendance-workspace-client.tsx` | UBAH | `renderMobileRow` → `MobileCardList`; `SummaryStrip` hanya bila agregat sudah tersedia di VM |
| 10 | `migration/MIGRATION-STATE.md` (repo root) | UBAH | Tambah entri `PHASE-19-STEP2-P3` |

> **Batas jumlah file:** 10 file di allow-list. Scope konsumsi `SummaryStrip` pada halaman dibatasi pada dashboard `/workspace` dan empat halaman list kanonik (Students, Consent, Audit, Attendance); tidak menambah halaman Dokumentasi/Governance tanpa perubahan TASK terpisah.

- **DENY-LIST (mutlak — pelanggaran = `NEEDS REVISION`):**
  - P1/P2: `workspace-bottom-nav.tsx`, `page-container.tsx`, `mobile-navigation.tsx`, `workspace-header.tsx`, `layout-shell.test.ts`, `ui/sheet.tsx`, `patterns/form-bottom-sheet.tsx`, `patterns/entity-header.tsx`, `patterns/page-header.tsx`, `patterns/data-table.tsx`, `patterns/stat-summary.tsx`, `student-detail-client.tsx`.
  - Primitif `src/components/ui/*` (termasuk `icon.tsx`) — **read-only**.
  - `src/config/icons.ts` — read-only kecuali penambahan kunci **aditif** yang benar-benar dipakai (C1/C2); penambahan wajib dicatat di Bagian 4.
  - `src/styles/*.css` (C4).
  - **P5/RBAC:** `db/seed/*`, `permission-resolver.ts`, `server/auth/*`, `RBAC-MATRIX.md`, `rbac.integration.test.ts`, `features/students/permissions/*`, `app-shell.tsx`, `sidebar.tsx`.
  - Domain & tooling: `features/*/actions/*`, `features/*/services/*`, `features/*/validators/*`, `features/*/types*.ts`, query loader, `*.test.ts` non-guardrail, `package.json`, `tsconfig.json`, `next.config.*`, `vitest.config.*`, `middleware.ts`.

- **Cek anti-duplikasi sebelum menulis kode (wajib dicatat di Bagian 4):**
  1. Pemindaian strip: `min-w-[78%]`, `snap-x`, `divide-x` di file dashboard target harus **0 hit** setelah kelas dipusatkan di pattern. Jangan melarang `SummaryStrip` sendiri pada file adopsi.
  2. `grep -n "lucide-react"` di file dashboard target → **0 hit** setelah migrasi ikon ke `Icon` + `ICON_MAP` (C2); file list lain boleh tetap memakai ikon jika tidak termasuk lingkup penggantian.
  3. `grep -n "rounded-full\|bg-\(slate\|gray\|zinc\|blue\|green\|red\|amber\|yellow\)-" src/components/patterns/{summary-strip,mobile-card-list}.tsx` → **0 hit**.

## 3. Daftar Tugas / Micro-Tasks (Diisi oleh Gemini Pro, Dicentang oleh Claude)

- [x] **Task 1 (Cek Pra-syarat):** Konfirmasi `git status --porcelain` bersih; baca `patterns/data-table.tsx` (`renderMobileRow`), `patterns/stat-summary.tsx`, `patterns/index.ts`, `config/icons.ts` (`ICON_MAP`), serta file dashboard/students/consent/audit/attendance yang tercantum di allow-list. Catat ikon `lucide-react` yang dipakai dashboard dan kunci padanannya. **Tanpa edit.**
- [x] **Task 2 (Primitif `SummaryStrip`):** Buat `src/components/patterns/summary-strip.tsx` — `export type SummaryStripItem`, `export interface SummaryStripProps`, `export function SummaryStrip(...)`. Implementasi kontrak §1.B (scroll-snap mobile, grid `sm`/`lg`, `type-h1`, `tabular-nums`, `divide-x` desktop, `Link` bila `href`). Tanpa `"use client"`.
- [x] **Task 3 (Primitif `MobileCardList`):** Buat `src/components/patterns/mobile-card-list.tsx` — presentational generik kartu-baris (props `item` + `renderItem`, root `div`); tanpa `ul`/`li`, list luarnya disediakan `DataTable`; tanpa hook/state/fetch/izin.
- [x] **Task 4 (Ekspor):** Tambah 2 baris ekspor di `src/components/patterns/index.ts` secara alfabetis (total ekspor bertambah dari 14 menjadi 16).
- [x] **Task 5 (Dashboard `/workspace`):** Refaktor `contextual-dashboard-view.tsx` — strip operasional → `<SummaryStrip items={...} ariaLabel="Ringkasan operasional" />`; ganti ikon langsung `lucide-react` yang dipakai dashboard dengan `Icon` + kunci `ICON_MAP` padanannya; hapus kelas strip yang kini dimiliki pattern. Tidak mengubah data/VM/izin.
- [x] **Task 6 (Migrasi Students & Attendance):** Isi `renderMobileRow` pada `students-workspace-client.tsx` dan `attendance-workspace-client.tsx` dengan `<MobileCardList>` (kartu 3–4 baris, satu aksi primer). Kondisi izin yang ada dipakai apa adanya. Nol perubahan `DataTable`/dialog/sheet.
- [x] **Task 7 (Migrasi Consent & Audit):** Isi `renderMobileRow` pada `consent-workspace-client.tsx` dan `audit-workspace-client.tsx` dengan `<MobileCardList>`. Tambahkan `<SummaryStrip>` hanya bila agregat relevan sudah tersedia di VM; tanpa agregasi baru di client.
- [x] **Task 8 (Ikon, bila perlu):** Jika kunci ikon dashboard yang sesuai belum ada di `ICON_MAP`, tambahkan kunci **aditif** di `src/config/icons.ts` (tanpa menyentuh kunci existing atau menormalisasi `strokeWidth`); catat kunci itu di Bagian 4. Nol kunci yatim.
- [x] **Task 9 (Guardrail — self-check manual):** Jalankan 3 pemindaian anti-duplikasi §2 dan catat hasilnya di Bagian 4.
- [x] **Task 10 (Berkas Guardrail P3):** Buat `src/components/patterns/patterns-mobile.test.ts` mengikuti gaya `patterns-and-pwa.test.ts` (`readFileSync` + assert string) dengan **minimal 10 assert**:
  1. `summary-strip.tsx` memuat `snap-x` + `snap-mandatory` + `min-w-[78%]`.
  2. `summary-strip.tsx` memuat `sm:grid-cols-2` + `lg:grid-cols-4` + `sm:divide-x`.
  3. `summary-strip.tsx` memakai `type-h1` dan **tidak** memakai `text-2xl`/`text-[`.
  4. `summary-strip.tsx` tanpa `"use client"`.
  5. `mobile-card-list.tsx` memuat root kartu `div` dan **tidak** memuat `<ul`, `<li`, `<table`, `<th`, `<td`, atau `overflow-x-auto`.
  6. Kedua file pattern **tidak** mengimpor `lucide-react`.
  7. Kedua file pattern **tidak** memuat `rounded-full`, `shadow-md`, `shadow-lg`, kelas palet hardcoded, atau heksadesimal warna.
  8. `patterns/index.ts` mengekspor `./summary-strip` dan `./mobile-card-list`.
  9. `contextual-dashboard-view.tsx` **tidak** memuat import `lucide-react`, `min-w-[78%]`, atau `snap-x`.
  10. `DataTable` tetap mengandung `renderMobileRow` serta string kelas `ul`/`li` miliknya (assert berbasis source; test/komponen P2 tidak diubah).
  > Assert wajib mengekstrak/memeriksa string kelas nyata (`content.match(/"[^"\n]*<kelas>[^"\n]*"/)`), bukan regex coarse atau boolean literal — preseden §6.3 butir 3.
- [x] **Task 11 (Verifikasi akhir):** `npm run typecheck` → 0 error; `npx eslint src/components/patterns src/features/organization/components/contextual-dashboard-view.tsx src/features/students/components/students-workspace-client.tsx src/features/consent/components/consent-workspace-client.tsx src/features/audit/components/audit-workspace-client.tsx src/features/attendance/components/attendance-workspace-client.tsx` → 0 error/warning; `npx vitest run src/components/patterns src/components/layout src/components/ui` → semua hijau (kecuali kegagalan manifest PWA pra-eksisting—lampirkan bukti identik dengan baseline). Tempel hasil di Bagian 4.
- [x] **Task 12 (Dokumentasi):** Tambah entri `PHASE-19-STEP2-P3` di `migration/MIGRATION-STATE.md` (status, file disentuh, assert guardrail, catatan utang). Isi Bagian 4 `TASK.md` lengkap (file, perubahan, hasil grep, test).
## 4. Log Perubahan (Diisi oleh Eksekutor setelah Coding)

### Status Eksekusi Task 1–12 (P3)
- `apps/web/src/components/patterns/summary-strip.tsx` : membuat primitif presentational `SummaryStrip` (server-safe, tanpa `"use client"`) yang mengimplementasikan scroll-snap horizontal pada mobile (`snap-x snap-mandatory min-w-[78%]`) dan grid 2-4 kolom pada breakpoint `sm`/`lg` dengan `sm:divide-x sm:divide-border`, tipografi `type-h1 tabular-nums`, serta integrasi `Link` bila item memiliki `href` (Task 2). Nol import `lucide-react`, nol `rounded-full`, nol kelas palet hardcoded.
- `apps/web/src/components/patterns/mobile-card-list.tsx` : membuat primitif presentational `MobileCardList` kartu-baris untuk `DataTable.renderMobileRow` (< 768px). Merender root `div` tanpa elemen `ul`/`li`/`role="list"`, `table`, maupun `overflow-x-auto` (karena list semantik dan border disediakan `DataTable`). Mendukung struktur 4 baris (identitas+badge, metadata utama, metadata sekunder, aksi primer dengan stop propagation) serta `renderItem` dan `children` (Task 3).
- `apps/web/src/components/patterns/index.ts` : menambahkan 2 baris ekspor secara alfabetis (`mobile-card-list` dan `summary-strip`), meningkatkan total ekspor dari 14 menjadi 16 (Task 4).
- `apps/web/src/config/icons.ts` : menambahkan 3 kunci aditif `arrowRight: ArrowRight`, `arrowUpRight: ArrowUpRight`, dan `calendar: Calendar` ke dalam `ICON_MAP` untuk mendukung eliminasi total impor langsung `lucide-react` di dashboard tanpa menormalisasi `strokeWidth` atau mengubah kunci yang sudah ada (Task 8).
- `apps/web/src/features/organization/components/contextual-dashboard-view.tsx` : merefaktor strip ringkasan operasional menggunakan `<SummaryStrip items={vm.summaryMetrics} ariaLabel="Ringkasan operasional" bordered className="order-3 sm:order-2" />`. Mengganti seluruh ikon langsung `lucide-react` dengan `Icon` + `ICON_MAP`. Menghapus impor `lucide-react`, serta mengeliminasi seluruh kelas inline `min-w-[78%]`, `snap-x`, dan `divide-x` dari file dashboard (Task 5).
- `apps/web/src/features/students/components/students-workspace-client.tsx` : mengintegrasikan `<MobileCardList>` pada `renderMobileRow` (identitas nama + status pendaftaran, kelas/jenjang, dan tombol aksi tempatkan/buka profil). Sesuai aturan ketat C8, seluruh dialog/sheet form P2, mutasi, dan state tidak disentuh sama sekali (Task 6).
- `apps/web/src/features/attendance/components/attendance-workspace-client.tsx` : mengintegrasikan `<MobileCardList>` pada daftar presensi siswa dengan judul nama, metadata jenjang/nomor pendaftaran, segmented control kehadiran, dan kolom input catatan (Task 6).
- `apps/web/src/features/consent/components/consent-workspace-client.tsx` : mengganti `StatSummary` dengan `<SummaryStrip items={[...]} ariaLabel="Ringkasan persetujuan" bordered />` menggunakan agregat yang sudah tersedia di VM; merefaktor `renderMobileRow` pada `DataTable` menggunakan `<MobileCardList>` (Task 7).
- `apps/web/src/features/audit/components/audit-workspace-client.tsx` : mengganti `StatSummary` dengan `<SummaryStrip items={[...]} ariaLabel="Ringkasan jejak audit" bordered />` menggunakan agregat yang sudah tersedia di VM; merefaktor `renderMobileRow` pada `DataTable` menggunakan `<MobileCardList>` untuk kartu aktivitas audit (Task 7).
- `apps/web/src/components/patterns/patterns-mobile.test.ts` : membuat berkas guardrail test P3 dengan 10 assert lengkap berbasis ekstraksi string nyata (`snap-x/snap-mandatory/min-w-[78%]`, grid 2-4 & `divide-x`, `type-h1`, ketiadaan `"use client"`, root `div` kartu tanpa `ul/li/table/overflow-x-auto`, larangan `lucide-react` di pattern, larangan `rounded-full/shadow-md/palette`, ekspor alfabetis, kebersihan dashboard, dan invariansi `DataTable`) (Task 10).
- `migration/MIGRATION-STATE.md` : memperbarui status entri baris `PHASE-19-STEP2-P3` menjadi `DONE` (Task 12).

**Hasil Cek & Verifikasi (Task 1–12):**
1. Pemindaian anti-duplikasi §2 (Task 9):
   - `git grep -n "lucide-react" src/features/organization/components/contextual-dashboard-view.tsx` -> **0 hit**.
   - `git grep -n "min-w-\[78%\]\|snap-x" src/features/organization/components/contextual-dashboard-view.tsx` -> **0 hit**.
   - `git grep -n -E "rounded-full|bg-(slate|gray|zinc|blue|green|red|amber|yellow)-" src/components/patterns/{summary-strip,mobile-card-list}.tsx` -> **0 hit**.
2. Kunci aditif `ICON_MAP` yang ditambahkan: `arrowRight`, `arrowUpRight`, `calendar`.
3. `npm run typecheck` : 0 error (exit 0).
4. `npx eslint` pada seluruh berkas yang dimodifikasi : 0 error / 0 warning (exit 0).
5. Vitest suites (28/28 passed, 100% hijau):
   - `src/components/patterns/patterns-mobile.test.ts` : 10 passed (100%).
   - `src/components/layout/layout-shell.test.ts` : 11 passed (100%).
   - `src/components/ui/ui-primitives.test.ts` : 2 passed (100%).
   - `src/features/students/students.test.ts` : 5 passed (100%).
   - Catatan: 1 kegagalan manifest PWA pada `patterns-and-pwa.test.ts` (`#1F6650` vs `#F7F8F4`) terbukti identik dengan baseline pra-eksisting sejak Fase 14 / Fase 18 Step 4 / Fase 19 P1-P2.

**Bukti Isolasi Git (`git status --porcelain`):**
```
 M apps/web/TASK.md
 M apps/web/src/components/patterns/index.ts
 M apps/web/src/config/icons.ts
 M apps/web/src/features/attendance/components/attendance-workspace-client.tsx
 M apps/web/src/features/audit/components/audit-workspace-client.tsx
 M apps/web/src/features/consent/components/consent-workspace-client.tsx
 M apps/web/src/features/organization/components/contextual-dashboard-view.tsx
 M apps/web/src/features/students/components/students-workspace-client.tsx
 M migration/MIGRATION-STATE.md
?? apps/web/src/components/patterns/mobile-card-list.tsx
?? apps/web/src/components/patterns/patterns-mobile.test.ts
?? apps/web/src/components/patterns/summary-strip.tsx
```
*Tepat 10 file di allow-list Bagian 2 (+ TASK.md dan penambahan kunci aditif di config/icons.ts). Nol file C5/C7/DB/Auth/Seed/SoD atau file P1/P2 terlarang yang disentuh.*
*Tepat file Bagian 2 yang diizinkan untuk P3. Nol file C5/C7/DB/Auth/Seed/SoD atau file P1/P2 terlarang yang disentuh.*

---

## 5. Catatan Review & Audit (Diisi oleh Claude setelah Eksekutor melapor)

**STATUS: APPROVED**

> Audit siklus **#1** terhadap worktree P3 (belum di-commit) — diperiksa langsung dari `git status`/`git diff` + eksekusi ulang verifikasi oleh auditor. Nol temuan `BLOCKER`/`MAYOR` yang memblokir. Temuan non-blocking (`MINOR` ×2, `MAYOR-P4` ×3, `DOKUMENTASI` ×1, `TEST` ×1) dicatat di §5.7 dan **tidak** menahan approval.

### 5.1 Ringkasan Eksekusi Auditor (verifikasi mandiri, bukan salinan Bagian 4)

| Perintah | Hasil (auditor) |
|---|---|
| `npm run typecheck` | **exit 0** — 0 error |
| `npx eslint src/components/patterns` + 5 file dashboard/list | **exit 0** — 0 error / 0 warning |
| `npx vitest run src/components/patterns/patterns-mobile.test.ts src/components/layout src/components/ui` | **23/23 lulus**, 3 file hijau (P3 **10/10** + P1/P2 `layout-shell.test.ts` **11/11** + `ui-primitives.test.ts` **2/2**) |
| `npx vitest run` (suite penuh, 33 file) | **153 lulus / 5 gagal** — seluruh 5 kegagalan **pra-eksisting/environmental** (§5.6). Nol kegagalan baru. |
| Encoding 11 file tersentuh | **BOM = false**, **U+FFFD = 0** pada semua file |

### 5.2 Isolasi & Allow-List (Butir 1 permintaan audit) — **LULUS**

- `git status --porcelain` **tepat 12 baris**: 9 `M` + 3 `??`. Dibanding allow-list 10 file Bagian 2:
  - Tersentuh: No. 1 `summary-strip.tsx`, No. 2 `mobile-card-list.tsx`, No. 3 `patterns/index.ts`, No. 4 `patterns-mobile.test.ts`, No. 5 `contextual-dashboard-view.tsx`, No. 6 `students-workspace-client.tsx`, No. 7 `consent-workspace-client.tsx`, No. 8 `audit-workspace-client.tsx`, No. 9 `attendance-workspace-client.tsx`, No. 10 `migration/MIGRATION-STATE.md` → **10/10 allow-list terpakai**.
  - Dua file di luar allow-list: `apps/web/TASK.md` (wajib, papan estafet) dan `apps/web/src/config/icons.ts` (**kunci aditif murni**, §5.3).
- **Steril 100% (0 baris di `git diff`):** `patterns/data-table.tsx`, `patterns/stat-summary.tsx`, `patterns/page-header.tsx`, `patterns/entity-header.tsx`, `patterns/form-bottom-sheet.tsx`, `ui/sheet.tsx`, `layout/workspace-bottom-nav.tsx`, `layout/page-container.tsx`, `layout/app-shell.tsx`, `layout/mobile-navigation.tsx`, `layout/workspace-header.tsx`, `layout/sidebar.tsx`, `layout/layout-shell.test.ts`, `students/student-detail-client.tsx`, `styles/tokens.css`, `styles/typography.css`, `styles/themes.css`, `governance-workspace-client.tsx`.
- **Steril artefak P5/RBAC (C5):** `db/seed/*`, `permission-resolver.ts`, `server/auth/*`, `RBAC-MATRIX.md`, `rbac.integration.test.ts`, `features/students/permissions/*` → 0 sentuhan.
- **C7 (domain/tooling):** `features/*/actions|services|validators|types*`, query loader, `package.json`, `tsconfig.json`, `next.config.*`, `vitest.config.*`, `middleware.ts`, serta test non-guardrail → 0 sentuhan.
- **C8 di `students-workspace-client.tsx` terverifikasi:** diff hanya menyentuh blok `renderMobileRow` (`:384–435`); 2 `FormBottomSheet` / dialog P2, state, mutasi, dan `useId` **identik**. Satu-satunya perubahan kosmetik di luar ekspresi adalah *reformat* atribut `className` tombol "Buka profil" (nilai string **tidak berubah**).
- **C1 (registry beku):** `DEFAULT_WORKSPACE_NAV`, `PRIORITY_HREFS`, dan seluruh kunci `ICON_MAP` existing **tidak berubah** — diff `config/icons.ts` hanya `+3` kunci di akhir objek.

### 5.3 Kunci `ICON_MAP` Aditif — **LULUS dengan 1 catatan (R-DOK)**

Diff `config/icons.ts` = `+ArrowRight, +ArrowUpRight, +Calendar` (import) dan `+arrowRight, +arrowUpRight, +calendar` (registry). Nol kunci existing disentuh, `strokeWidth` tidak dinormalisasi, gaya `Record<string, LucideIcon>` dipertahankan.

- **LULUS:** `arrowRight` dipakai dashboard (5 titik) **dan** `summary-strip.tsx`; `calendar` dipakai dashboard; `arrowUpRight` dipakai `summary-strip.tsx`. Nol kunci yatim secara repo-wide.
- **R-DOK (MINOR):** `arrowUpRight` **tidak** dipakai `contextual-dashboard-view.tsx` (indikator panah pada strip kini hidup di dalam primitif). Kalimat Bagian 4 `TASK.md:154` ("3 kunci aditif … untuk mendukung eliminasi total impor langsung `lucide-react` di dashboard") menyiratkan ketiganya dipakai dashboard — kurang presisi. Cakupan repo-wide tetap valid; cukup koreksi narasi.

Kunci terpakai dashboard: `arrowRight`, `calendar`, `checkCircle` (`checkCircle` sudah ada, padanan `CheckCircle2` — ganti-atas-ganti **sah**).

### 5.4 Audit Kontrak §1.C `MobileCardList` & §1.B `SummaryStrip` (Butir 2) — **LULUS**

**`mobile-card-list.tsx` (90 baris):**
1. Root **`div` presentational** — 3 jalur return semuanya `<div className={cn("space-y-2", className)}>`; nol `ul`/`li`/`role="list"`/`table`/`th`/`td`/`overflow-x-auto` (pemindaian auditor: **0 hit**). List semantik & `divide-y` tetap milik `DataTable` (`data-table.tsx:80` `ul[role="list"] md:hidden divide-y`; `:87` `li` `p-4`). **Tidak** ada nested list / border ganda.
2. Struktur 4 baris sesuai kontrak: baris 1 identitas + `badge`; baris 2 `primaryMeta`; baris 3 `secondaryMeta`; baris 4 `action` (wadah `flex justify-end`) + `e.stopPropagation()` untuk `onRowClick` `DataTable`.
3. **Presentational-only:** nol `useState`/`useEffect`/`useMemo`, nol `fetch`, nol import action/auth/permission, nol `"use client"`, nol `lucide-react`. Props `item` + `renderItem` (+ `children`) sesuai §1.C.4.
4. Nol `rounded-full`/`shadow-md`/`shadow-lg`/kelas palet/heksadesimal (0 hit).

**`summary-strip.tsx` (107 baris) — kontrak §1.B dipenuhi kata-per-kata:**
- Root `section[aria-label]` → `div` scroll-snap dengan **string kelas identik** §1.B: `flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-y-6 sm:gap-x-6 sm:divide-x sm:divide-border sm:pb-0`.
- Item: `p-4 rounded-card border border-border-subtle bg-surface sm:border-0 sm:bg-transparent sm:p-0` + `sm:pl-6` untuk `idx > 0`; tipografi `type-h1 text-foreground tabular-nums tracking-tight` / `text-sm font-semibold` / `type-caption text-secondary-foreground`; nilai pakai util `type-*` (0 `text-2xl`, 0 `text-[Npx]`).
- Wrapper `snap-start shrink-0 min-w-[78%] sm:min-w-0` (nol `snap-center`); item ber-`href` → `Link` (satu-satunya elemen interaktif), `div` statis tanpa `role="button"`; ikon `aria-hidden="true"`; **nol `shadow-*`**; **tanpa `"use client"`** dan tanpa hook.
- **Tidak menduplikasi kelas strip di dashboard:** `contextual-dashboard-view.tsx` **0 hit** untuk `lucide-react`, `min-w-[78%]`, `snap-x`, `divide-x`; seluruh markup strip dihapus → tersisa `<SummaryStrip items={vm.summaryMetrics} ariaLabel="Ringkasan operasional" bordered className="order-3 sm:order-2" />`. Nol literal kelas strip tersisa.
- **Ikon wajib via `ICON_MAP`:** kedua primitif memakai `<Icon icon={ICON_MAP.*}>`; `lucide-react` 0 hit di `src/components/patterns/{summary-strip,mobile-card-list}.tsx`.
- **Nol kelas palet hardcoded** di kedua primitif (0 hit regex palet + 0 `#hex` + 0 `rounded-full`).

### 5.5 Audit Guardrail Test & Adopsi Halaman — **LULUS**

**`patterns-mobile.test.ts` — 10/10 `it()` lulus, assert genuine (bukan coarse):**

| # | Assert | Penilaian |
|---|---|---|
| 1 | Ekstraksi string kelas nyata `content.match(/"(...snap-x...)"/)` **dan** `min-w-[78%]` terpisah, lalu `toContain("snap-mandatory"/"overflow-x-auto"/"snap-start"/"sm:min-w-0")` | **Sesuai preseden §6.3 butir 3**; lihat R-TEST-2 |
| 2 | `sm:grid-cols-2` + `lg:grid-cols-4` + `sm:divide-x` + `sm:divide-border` | OK |
| 3 | `type-h1` + `tabular-nums`; tolak `text-2xl` + regex `text-\[\d+px\]` | OK |
| 4 | Tolak `"use client"` **dan** `'use client'` | OK |
| 5 | Root `div` regex + tolak `ul`/`li`/`table`/`th`/`td`/`role="list"`/`overflow-x-auto` | OK |
| 6 | Tolak import `lucide-react` di kedua primitif (§1.C.2) | OK |
| 7 | Tolak `rounded-full`/`shadow-md`/`shadow-lg`/`#hex`/palet di kedua primitif | OK (menutup celah pemindai lama) |
| 8 | `patterns/index.ts` mengekspor `./summary-strip` + `./mobile-card-list` (alfabetis: baris 8 & 15; total **14 → 16**) | OK |
| 9 | Dashboard bebas `lucide-react`/`min-w-[78%]`/`snap-x` | OK |
| 10 | `DataTable` tetap memuat `renderMobileRow` + ekstraksi `ul[role="list"]` (`md:hidden`, `divide-y`) + `li` (`p-4`) | OK |

**Adopsi 4 halaman list (kartu 3–4 baris, satu aksi primer `min-h-10`):**

| Halaman | `renderMobileRow` | `SummaryStrip` | Izin (C5) | Verdict |
|---|---|---|---|---|
| Students | `MobileCardList` (nama + `StatusBadge`, kelas·jenjang, aksi `Tempatkan`/`Buka profil`) | tidak (tak ada agregat ringkas di VM) | `canVerifyStudent` identik, hanya relokasi | LULUS |
| Consent | `MobileCardList` (nama + badge, `No:`, `Data:` via `CONSENT_STATUS_META`, aksi `Perbarui`/`Cabut`) | ✔ agregat VM existing (`totalCount`/`photoGrantedCount`/`revokedCount`) | `canUpdate` identik | LULUS (R-MIN-2) |
| Audit | `MobileCardList` (badge aksi + tanggal, deskripsi, pelaku, `Riwayat Audit`) | ✔ agregat VM existing (`totalCount` + 2 label statis) | read-only, tanpa `can*` baru | R-MIN-1 (hierarki) |
| Attendance | `MobileCardList` **di dalam** `ul[role="list"]` + `li p-4` miliknya sendiri (`:583–664`), segmented control + catatan | tidak (agregat client-side) | `canRecord` identik | LULUS (0 nested `ul`/`li`) |

- **Nol perubahan kondisi izin:** `canVerifyStudent`, `canUpdate`, `canRecord`, `vm.canViewAuditLog` dibaca apa adanya; nol penambahan/penghapusan kondisi.
- **Nol perubahan copy bisnis, data, action, service, validator, DTO, dan `DataTable`.**
- **Target sentuh:** seluruh aksi kartu memakai `min-h-10`; nol `shadow-*` baru; nol `z-*` baru.

### 5.6 Bukti Baseline Kegagalan Pra-eksisting (dikecualikan & dicatat)

Suite penuh: `5 failed | 28 passed (33 files)` — identik dengan baseline terdokumentasi (§6.2/§6.3: PWA manifest + `rbac.integration` + `public-experience.integration` + `db/client`):
1. `patterns-and-pwa.test.ts` — `manifest.background_color` (`#1F6650` vs `#F7F8F4`). **Bukti:** `public/manifest.webmanifest` & `patterns-and-pwa.test.ts` **0 baris di `git diff`** → murni pra-eksisting.
2. `administration/rbac.integration.test.ts` — Mailpit `ECONNREFUSED 127.0.0.1` (environmental; artefak P5 steril).
3. `public/public-experience.integration.test.ts` — slug seed vs assertion (pra-eksisting).
4. `db/client.test.ts` + `db/schema.integration.test.ts` — `TypeError: fetch failed` (DB/pooler environmental; `db/*` steril).

Nol kegagalan pada file yang disentuh P3. `layout-shell.test.ts` **tidak berubah** dan 11/11 hijau.

### 5.7 Matriks Temuan (semua non-blocking — tidak menahan approval)

| # | Prioritas | Lokasi | Temuan | Tuntutan |
|---|---|---|---|---|
| R-MIN-1 | MINOR | `audit-workspace-client.tsx:266–299` | `title` diisi `<Badge>{row.actionLabel}</Badge>` sehingga *identitas* entitas tidak tampil; `title` dirender `type-body font-semibold` hanya bila `string` — sebagai `ReactNode` ia jatuh ke cabang tanpa kelas tipografi, sementara `actorName` turun ke `secondaryMeta` (teks sekunder terlemah). Hierarki 4 baris §1.C.2 jadi terbalik. | Baris 1 = identitas/kode entitas + tanggal; pindahkan `Badge` aksi ke `badge`; naikkan pelaku ke `primaryMeta`. |
| R-MIN-2 | MINOR | `consent-workspace-client.tsx:338–363` | Wadah `action` berisi **dua** `Button` (`Perbarui` + `Cabut`) dalam satu `div` → bertentangan dengan "maksimal satu aksi primer" §1.C.2; pada 375px berisiko > 2 baris. | Turunkan `Cabut persetujuan` menjadi tautan teks (`min-h-10` tetap) atau pindahkan ke sheet editor. |
| R-MAJ-1 | MAYOR (P4) | `contextual-dashboard-view.tsx:190` | Komentar masih `Mobile (<640px): Orientation -> [Perlu perhatian & Jadwal belajar] -> Ringkasan operasional`, padahal P3 menetapkan urutan mobile = ringkasan **sebelum** perlu-perhatian. Orde via `order-3 sm:order-2` berfungsi; hanya komentar menyesatkan. | Selaraskan komentar dengan §1.D pada P4. Bukan diskualifikasi P3. |
| R-MAJ-2 | MAYOR (P4) | `app/(workspace)/workspace/loading.tsx:11–15` | Skeleton strip **menduplikasi** kelas strip (`min-w-[78%]`, `sm:grid-cols-2 lg:grid-cols-4`, `divide-x`) — 0 hit guardrail karena di luar cakupan. Bukan drift baru (pra-eksisting), tetapi kelas kini dimiliki `SummaryStrip`. | Ekstrak ke `SummaryStripSkeleton` / ekspor kelas strip dari pattern pada P4. |
| R-MAJ-3 | MAYOR (P4) | `summary-strip.tsx:62–69` | Perilaku visual baru: item ber-`href` kini `hover:bg-surface-subtle/70` pada `<Link>` (`rounded-control`) + ikon `arrowUpRight` `opacity-0 group-hover:opacity-100`. Di dashboard pra-P3 ikon **selalu** tampak & tanpa hover background. Ikon tidak hilang permanen (hover + focus `group` bekerja; kunci tetap terpakai), tetapi petunjuk "dapat diklik" pada perangkat sentuh melemah. | Putuskan di P4: tampilkan ikon `sm:` dan/atau `text-primary` agar bukan satu-satunya petunjuk. Bukan pelanggaran kontrak §1.B; menyimpang dari paritas visual dashboard. |
| R-DOK | DOKUMENTASI | `TASK.md:154` | Narasi klaim "3 kunci aditif … untuk eliminasi `lucide-react` di dashboard"; faktanya hanya `arrowRight` + `calendar` dipakai dashboard, `arrowUpRight` dipakai primitif. | Koreksi narasi (cakupan repo-wide sudah benar). |
| R-TEST-2 | TEST | `patterns-mobile.test.ts:26–32` | Assert `min-w-[78%]` hanya mengenai string item ber-`href`; varian item statis (`summary-strip.tsx:98`) tidak di-assert. | Tambah `content.matchAll(/min-w-\[78%\]/g).length >= 2` atau assert kedua string wrapper pada P4. |

### 5.8 Evaluasi Arsitektural & Putusan

- **Satu sumber, banyak pemakai terwujud:** kelas strip tidak lagi hidup di `features/**`; seluruh konsumen memakai satu string dari primitif (kata-per-kata sama dengan kontrak §1.B).
- **C8 & P1/P2 utuh:** migrasi `renderMobileRow` tidak menyentuh `DataTable`, dialog/sheet, maupun artefak layout; Attendance membuktikan primitif kompatibel di dalam `ul`/`li` milik pemanggil (0 nested list).
- **Anti-drift tumbuh, bukan tumpang tindih:** 10 guardrail baru menambah assert kualitatif (ekstraksi string nyata; termasuk `rounded-full`/palet/shadow yang tidak tertangkap pemindai lama) tanpa menambah keyframe, `z-*`, util media query, atau kelas CSS baru.
- **Zero-risk terhadap data/auth/RBAC/BL:** nol sentuhan seed, session, permission, DTO, action, service, validator.
- **Tidak ada regresi:** P1/P2 (`layout-shell.test.ts` 11/11) dan `ui-primitives.test.ts` (2/2) tetap hijau; `typecheck`/`eslint` exit 0.

**Putusan: `STATUS: APPROVED`.** Pintu ke **P4** (`date-picker` + normalisasi label status + backlog R-MAJ-1/R-MAJ-2/R-MAJ-3/R-MIN-1/R-MIN-2/R-DOK/R-TEST-2) terbuka. R-MIN-1/R-MIN-2 wajib dieksekusi **bersamaan** dengan backlog P4 dalam TASK terpisah — bukan koreksi retroaktif pada P3.

## 6. Arsip

> Jejak keputusan lintas fase. Detail lengkap: riwayat git `apps/web/TASK.md`.

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
