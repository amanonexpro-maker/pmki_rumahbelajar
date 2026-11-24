# TASK.md — Papan Estafet Pengembangan Fitur

> **Peran & Batasan:**
> - **Antigravity IDE (Gemini Pro - Architect & Reviewer):** Mengisi Bagian 1, 2, 3, dan 5. Dilarang mengubah file kode aplikasi.
> - **VS Code (Claude via Cline/Classai - Eksekutor):** Membaca Bagian 1–3, mengeksekusi kode, mencentang checklist Bagian 3, dan mengisi Bagian 4 (Log Perubahan).

---

## 1. Tujuan & Spesifikasi Fitur (Diisi oleh Gemini Pro)

- **Nama Fitur:** FASE 19 — STEP 2 PRIORITAS 2 (P2): `sheet side="bottom"` (Sheet Form Mobile) + Migrasi Dialog Form Students
- **Tujuan:**
  Menghadirkan **form mobile-first** di viewport `< 768px` lewat varian `SheetContent side="bottom"` (grabber, CTA full-width sticky, scroll area aman terhadap *virtual keyboard*), sementara `≥ 768px` **tetap** memakai `DialogContent` centered yang ada — **tanpa** menyentuh data, auth, DTO, maupun logika bisnis.
- **Sifat Pekerjaan:** **PRESENTATIONAL-ONLY.** Nol perubahan DB/seed/permission/sesi/DTO server/dependency. Nol perubahan signature server action & validator (hanya *wiring* presentational di client component).
- **Ruang Lingkup STEP 2:**
  | Prioritas | Isi | Status step ini |
  |---|---|---|
  | P1 | `workspace-bottom-nav` + padding `page-container` + koordinasi header | **SELESAI — `APPROVED`** (arsip §6.2) |
  | **P2** | `ui/sheet.tsx` varian `side="bottom"` + primitif `form-bottom-sheet` + migrasi dialog form students | **DIKERJAKAN** |
  | P3 | `mobile-card-list` + `summary-strip` + orientasi header | Tidak dikerjakan |
  | P4 | `date-picker` + normalisasi label status | Tidak dikerjakan |
  | P5 | Konsolidasi RBAC (R1–R5) | **DILARANG disentuh** (C5) |

- **Aturan Arsitektural & Koordinasi Teknis (WAJIB):**

  **A. Responsif — bottom sheet di mobile, dialog standar di `md:` ke atas**
  1. Guard visual **wajib** class-based (`hidden md:block` untuk wrapper `Dialog`, `md:hidden` untuk `Sheet` root) — **DILARANG** memakai hook JS `useMediaQuery`/`matchMedia`/`window.innerWidth` sebagai penentu render (hindari hydration mismatch + flash). Tidak ada util media query di repo; jangan membuatnya di step ini.
  2. Kedua varian berbagi **satu** state `open` + **satu** set state form; hanya pembungkusnya berbeda. Markup `<form>`, field, dan footer **identik** di kedua varian (satu sumber JSX).
  3. `side="bottom"` hanya boleh dipakai di komponen baru/migrasi P2. `side="left"` **wajib** tetap dipakai `MobileNavigation` (dan slot "Lainnya" `WorkspaceBottomNav` yang me-reuse-nya) — dikunci guardrail `layout-shell.test.ts` (Task 9). Default `side` di `sheet.tsx` **tetap `"right"`**.
  4. Ambang responsif mengikuti baku sistem: `< 768px` sheet, `≥ 768px` dialog (sama dengan `md:` pada aturan A P1).

  **B. Kontrak Visual `SheetContent side="bottom"` (kontrak matematis)**
  - Cabang bottom: `fixed inset-x-0 bottom-0 z-50 flex flex-col w-full max-w-md max-h-[90dvh] rounded-t-card border-t border-border bg-surface text-foreground shadow-overlay outline-none animate-sheet-bottom`.
  - `inset-y-0` **HARUS** dihilangkan khusus `side="bottom"`; kelas `inset-y-0` **dilarang** bocor ke varian bottom (akan meregang penuh layar).
  - Grabber (affordance non-interaktif): `aria-hidden="true"`, `mx-auto mt-2 mb-1 h-1.5 w-10 rounded-pill bg-border-strong shrink-0`, dirender **hanya** untuk `side === "bottom"`.
  - Tinggi maksimum **`90dvh`** (bukan `90vh`) → menyusut bersama *virtual keyboard* di iOS 16+/Chrome 108+. `dvh` cukup sebagai arbitrary value Tailwind v4; tanpa config tambahan.
  - `rounded-t-card` + `border-t` (varian bottom); `border-r`/`border-l` tetap eksklusif varian left/right — cabang lama **tidak boleh berubah**.

  **C. Virtual Keyboard & Scroll Area**
  1. Struktur wajib: `SheetContent` (`flex flex-col`) → `SheetHeader`/judul (`shrink-0`) → `SheetBody` (`flex-1 overflow-y-auto overscroll-contain`, **satu-satunya** area scroll) → `SheetFooter` sticky (`shrink-0`).
  2. `SheetFooter` varian bottom **wajib** `bg-surface border-t border-border pb-[max(env(safe-area-inset-bottom,0px),16px)]` (bukan `bg-surface-subtle`) agar CTA tidak tertutup field; CTA primer memakai `Button` `fullWidth` (prop existing).
  3. `env(safe-area-inset-bottom)` wajib; **dilarang** menambah `interactive-widget=resizes-content` di `<meta name="viewport">` (`src/app/layout.tsx` di luar scope). Perilaku keyboard diserahkan ke `dvh` + scroll area + footer sticky.
  4. Field pertama **wajib** `autoFocus` (prop React) di kedua varian agar keyboard muncul tepat di field yang dituju; tidak perlu `scrollIntoView` manual.
  5. Radix mensyaratkan konten berada di dalam `DialogPrimitive.Content` → grabber/header/body/footer masuk **di dalam** `Content`, dan `DialogTitle`/`SheetTitle` + deskripsi **wajib** ada (a11y) di kedua varian.
  6. **Anti bentrok `id`:** kedua varian ter-mount bersamaan (satu tersembunyi via class) → `id` field **wajib** unik per varian. Gunakan `React.useId()` di komponen pemakai; **dilarang** memakai `id`/`htmlFor` literal yang sama di dua varian.

  **D. Isolasi & Anti-Drift**
  - **C1.** Dilarang mengubah `DEFAULT_WORKSPACE_NAV` **dan** `PRIORITY_HREFS` — dikunci `ui-primitives.test.ts` + `layout-shell.test.ts`.
  - **C2.** Dilarang impor `lucide-react` langsung di file **baru** P2 (`form-bottom-sheet.tsx`); ikon (bila perlu) lewat `Icon` dari `@/components/ui`. `ICON_MAP` (`strokeWidth={2}`) adalah registry navigasi P1 → **dilarang diubah/dinormalisasi** di P2.
  - **C3.** Dilarang kelas palet hardcoded; hanya token semantik (`bg-surface`, `text-foreground`, `border-border`, `bg-border-strong`, `rounded-pill`). Pemindai `ui-primitives.test.ts` mencakup `ui/*.tsx` → `sheet.tsx` otomatis diaudit.
  - **C4.** Pengecualian CSS **terbatas**: satu blok `@keyframes sheetSlideBottom` + `.animate-sheet-bottom` di `themes.css` (di samping `sheetSlideLeft`/`sheetSlideRight`), **hanya** itu. Token warna/tipografi/layout global dilarang disentuh. Blok `prefers-reduced-motion` existing (`:439-448`) sudah menangani animasi baru — jangan diubah.
  - **C5. Isolasi P5:** dilarang menyentuh `db/seed/*`, `permission-resolver.ts`, `server/auth/*`, `migration/RBAC-MATRIX.md`, `rbac.integration.test.ts`, `features/students/permissions/student-policy.ts`.
  - **C6.** Tanpa `any`, tanpa `eslint-disable`, tanpa mengubah `tsconfig`/`next.config`/`package.json`.
  - **C7. Larangan sentuh logika students:** dilarang mengubah `features/students/actions/student-actions.ts`, `services/registration-service.ts`, `validators/student-validator.ts`, `types/student-types.ts`. Migrasi hanya mengganti **pembungkus presentational** di komponen client.

- **Spesifikasi Visual (turunan W4 yang disetujui):**
  ```
  ┌──────────────────────────────┐  ← < 768px (md:hidden), max-h-[90dvh]
  │           ── (grabber)       │  ← mx-auto mt-2 h-1.5 w-10 rounded-pill bg-border-strong
  │ Verifikasi pendaftaran       │  ← header (shrink-0) + close kanan atas
  │ Tentukan status verifikasi…  │
  ├──────────────────────────────┤
  │ Keputusan verifikasi   *     │  ← SheetBody flex-1 overflow-y-auto overscroll-contain
  │ [__________________________] │     field pertama autoFocus
  │ Catatan / alasan             │
  │ [__________________________] │
  ├──────────────────────────────┤
  │ [  Batal  ] [  Simpan CTA  ] │  ← footer sticky bg-surface + safe-area pb
  └──────────────────────────────┘
  ```
  - Grabber **dekoratif** (bukan drag handle fungsional) — gesture drag **tidak** diimplementasikan (tidak ada dependency gesture).
  - Label & copy form **tidak diubah** (normalisasi label = P4).
  - `≥ 768px` = `DialogContent` existing, **tanpa** perubahan visual.

- **Kriteria Selesai (STEP 2 — P2):**
  - [ ] `SheetSide` menjadi `"left" | "right" | "bottom"`; **default tetap** `"right"`; cabang `left`/`right` karakter-per-karakter **tidak berubah** → guardrail P1 hijau.
  - [ ] Cabang `side="bottom"` tidak memuat `inset-y-0`; memuat `bottom-0`, `inset-x-0`, `90dvh`, `rounded-t-card`, `animate-sheet-bottom`.
  - [ ] Grabber hanya dirender untuk `side === "bottom"`; `SheetTitle`/`DialogTitle` + deskripsi tetap ada di kedua varian.
  - [ ] `src/components/patterns/form-bottom-sheet.tsx` ada, `"use client"`, sesuai kontrak §1.E.2, diekspor dari `components/patterns/index.ts`.
  - [ ] 3 dialog form di `student-detail-client.tsx` (Verifikasi `:650-745`, Tempatkan `:748-830`, Ubah profil `:833-996`) memakai pasangan Dialog (`hidden md:block`) + Sheet (`md:hidden`) dengan **markup form identik** (satu sumber JSX).
  - [ ] 2 dialog di `students-workspace-client.tsx` (Tambah `:509-527`, Tempatkan cepat `:529-560`) dimigrasi dengan pola sama; `PublicRegistrationWizard` **tidak** disentuh; `SheetBody p-0` agar tidak scroll ganda.
  - [ ] Nol perubahan pada action/DTO/validator/permission students (C7) → `students.test.ts` & `students.integration.test.ts` lulus tanpa diubah.
  - [ ] `themes.css` hanya ditambah `@keyframes sheetSlideBottom` + `.animate-sheet-bottom`.
  - [ ] `layout-shell.test.ts` diperluas (Task 9) dan **tetap memuat 6 assert P1**; guardrail `side="left"` pada `mobile-navigation.tsx` + `side = "right"` default di `sheet.tsx` wajib ada.
  - [ ] `npm run typecheck` 0 error; eslint bersih untuk `src/components/ui`, `src/components/patterns`, `src/features/students/components`, `src/components/layout`; `layout-shell.test.ts`, `ui-primitives.test.ts`, `patterns-and-pwa.test.ts`, `students.test.ts` hijau (kegagalan manifest PWA pra-eksisting dikecualikan & dicatat).
  - [ ] Nol file C5/C7 tersentuh; `git status --porcelain` hanya menyentuh file Bagian 2.
  - [ ] Entri `PHASE-19-STEP2-P2` ditambahkan di `migration/MIGRATION-STATE.md`.

### 1.A Temuan Audit — Kondisi Aktual Basis P2 (verifikasi langsung)

Sumber: pembacaan file aktual. Hanya temuan yang relevan dengan P2.

| # | Temuan | Bukti aktual | Konsekuensi untuk P2 |
|---|---|---|---|
| P2-1 | `SheetSide` hanya `"left" \| "right"` | `components/ui/sheet.tsx:28` | **Wajib** perluas union → `"bottom"`; default `side = "right"` dipertahankan |
| P2-2 | Kelas `SheetContent` **selalu** `fixed inset-y-0` | `sheet.tsx:44` | Bottom **wajib** menghilangkan `inset-y-0`, jika tidak sheet menutup seluruh layar |
| P2-3 | Tak ada animasi slide-up | `themes.css:384-427` hanya `sheetSlideLeft`/`sheetSlideRight`; `:439-448` `prefers-reduced-motion` | Tambah `@keyframes sheetSlideBottom` + `.animate-sheet-bottom` (satu-satunya sentuhan CSS, C4) |
| P2-4 | `SheetBody` = `flex-1 overflow-y-auto p-6`; `SheetFooter` = `bg-surface-subtle border-t` | `sheet.tsx:103-125` | Memadai sebagai scroll area + footer; **belum** ada safe-area → footer bottom perlu `pb-[max(env(safe-area-inset-bottom,0px),16px)]` |
| P2-5 | `DialogContent` selalu centered `max-h-[90vh] p-4 sm:p-6` | `dialog.tsx:49-56` | Dialog standar **dipertahankan apa adanya**; `dialog.tsx` tidak diubah |
| P2-6 | 3 dialog form students menaruh `<form>` **di dalam** `DialogContent` + `DialogBody`/`DialogFooter` | `student-detail-client.tsx:650-745`, `748-830`, `833-996` | Ekstraksi `<form>` jadi satu variabel JSX, dibungkus dua kali → hindari duplikasi markup |
| P2-7 | Dialog "Tambah peserta didik" memakai `max-w-2xl max-h-[90vh] overflow-y-auto` + `PublicRegistrationWizard embedded` | `students-workspace-client.tsx:509-527` | Wizard punya scroll internal → di sheet pakai `SheetBody p-0`, hindari scroll ganda |
| P2-8 | `Icon` adalah **named export** (`size="md"` = `h-5 w-5`, default `strokeWidth` 1.75); `ICON_MAP` memakai `strokeWidth={2}` | `ui/icon.tsx:5-35`, `workspace-bottom-nav.tsx:96-100` | C2 P2: ikon via `Icon`; **jangan** menormalisasi `strokeWidth` (memicu diff visual P1) |
| P2-9 | `sheet.tsx:5` & `dialog.tsx:5` sudah impor `X` dari `lucide-react` | idem | **Pra-eksisting** — dibiarkan; larangan C2 hanya untuk file **baru** P2 |
| P2-10 | 8 dialog non-students (administration ×2, development, governance, media, publishing, publik ×2) | grep `<Dialog open` | **Tidak** dimigrasi di P2; backlog §1.C |
| P2-11 | Tidak ada util media query / `visualViewport` / `interactive-widget` | grep → 0 hit | P2 **tidak** menambah hook/util; guard kelas murni |
| P2-12 | P1 sudah memasang `bottomInset` `md:pb-0` di `PageContainer` | `page-container.tsx:35-37` | Bottom sheet `fixed` tidak terpengaruh inset halaman; **jangan** ubah `PageContainer` |

**Pola positif yang WAJIB dipertahankan (bukan pola baru):**
- `mobile-navigation.tsx:41` — `SheetContent side="left"` eksplisit → justifikasi guardrail setelah union diperluas.
- `dialog.tsx:74-111` — pasangan `Header`/`Body`/`Footer`; varian bottom **meniru struktur** agar markup form bisa dibagi.
- `data-table.tsx` (`md:hidden` + `hidden md:block`) & `students-workspace-client.tsx:382-442` → pola responsif berbasis kelas (dasar aturan A1).

### 1.A.1 Tabel Friksi STEP 1 — Status setelah P2 (acuan)

| # | Lokasi | Friksi | Status setelah P2 |
|---|---|---|---|
| M4 | `components/ui/dialog.tsx:49-56` | `DialogContent` selalu centered `max-h-[90vh]`, tanpa varian bottom-sheet | **SELESAI** — `side="bottom"` + `form-bottom-sheet` di mobile; dialog tetap di `md:` |
| M5 | `student-detail-client.tsx:852-956` | "Ubah profil" 6 field sekaligus, scroll panjang | **Sebagian** — sheet bottom memberi scroll + CTA sticky; progressive disclosure 3 langkah → backlog §1.C |
| M6 | `student-detail-client.tsx:678-706, 900-954` | Select 5 opsi panjang berparentesis | **Tidak** — normalisasi label = P4 (P2 dilarang mengubah copy) |
| M2 | `sidebar.tsx` | 13 item scroll dalam drawer | **Tidak berubah** — sudah ditangani P1 |
| M10 | `workspace-header.tsx:34` | Header `h-16` + orientasi hilang | **Tidak** — P3 |

**Preseden dipakai ulang:** `mobile-navigation.tsx:41` (`side="left"`), `dialog.tsx:74-111` (Header/Body/Footer), `data-table.tsx` (`md:hidden` + `hidden md:block`).

**Tabel friksi STEP 1 — baris yang menjadi target P2:**

| # | Lokasi | Friksi | Dampak Mobile |
|---|---|---|---|
| M4 | `components/ui/dialog.tsx:49-56` | `DialogContent` selalu **centered modal** `max-h-[90vh] p-4`; tanpa varian bottom-sheet | Form panjang di 375px jadi modal sempit; keyboard menutupi field bawah |
| M5 | `features/students/components/student-detail-client.tsx:852-956` | "Ubah profil" merender **6 field sekaligus** (`grid-cols-1 sm:grid-cols-2`) di DialogBody ber-scroll | Tanpa tahapan, tanpa indikator progres, scroll panjang |
| M6 | `student-detail-client.tsx:678-706, 900-954` | Select berisi **5 opsi panjang berparentesis** ("Terverifikasi (Siap ditempatkan ke kelas)") | Native `<select>` terpotong di 375px — **ditunda ke P4** (P2 dilarang ubah copy) |

> Baris M1/M2/M9 (navigasi & padding) sudah diselesaikan P1 → arsip §6.2. M3/M7/M8/M10/M11/M12 → P3/P4/P5.

### 1.B Catatan Arsitektural (turunan audit — mengikat P2)

**A1. Responsif berbasis kelas, bukan hook.**
Repo tidak memiliki `useMediaQuery`/`matchMedia` util (P2-11). Semua percabangan mobile/desktop **wajib** memakai kelas Tailwind (`md:hidden` / `hidden md:block`) agar SSR-safe dan dapat diverifikasi test statis. **Dilarang** menambah hook media query di P2.

**A2. Satu sumber markup form, dua wadah.**
Markup `<form>` diekstrak menjadi satu variabel JSX (`const formBody = (...)`) lalu dipakai oleh `<DialogContent className="hidden md:block">` dan `<SheetContent side="bottom" className="md:hidden">`. Duplikasi markup = drift; P2 **wajib** satu sumber.

**A3. Pemisahan tanggung jawab (tidak ada logika baru).**
P2 murni presentational: nilai form, state, `useActionState`, `onSubmit`, DTO, dan pesan error **tidak berubah**. Yang berubah hanya wadah. Bila butuh nilai/state baru → itu tanda P2 sudah keluar scope.

**A4. Virtual keyboard & `dvh`.**
Bottom sheet memakai `max-h-[90dvh]` (bukan `90vh`) agar tinggi mengikuti viewport dinamis. **Tidak** memakai `interactive-widget=resizes-content` (tidak ada di repo). Mitigasi keyboard = area scroll `SheetBody` + CTA di footer terpisah dari scroll.

**A5. Satu instance DOM per breakpoint via CSS, bukan JS.**
Kedua wadah (Dialog & Sheet) berada di DOM, tetapi visibilitas diatur CSS. Karena itu **id field bisa duplikat** bila memakai id statis → wajib `React.useId()` untuk prefix id, atau `htmlFor` tanpa id (label membungkus input). Ini aturan keras P2.

**A6. Z-index.**
`SheetContent` existing sudah `z-50`; `WorkspaceBottomNav` P1 `z-40`; `WorkspaceHeader` `z-30`. Bottom sheet menutupi bottom nav (`z-50 > z-40`) — **jangan** menaikkan z bottom nav.

**A7. Animasi & `prefers-reduced-motion`.**
Keyframe baru wajib berada di antara blok keyframe sheet existing (`themes.css:384-427`) dan **tidak** menambah media query baru; blok `prefers-reduced-motion` `:439-448` sudah menetralkan `animation-duration` global — pastikan kelas baru tercakup selektor yang sama (`.animate-sheet-*`).

### 1.B.1 RBAC — hanya konteks P5 (bukan scope P2)

Ringkasan audit RBAC (R1–R5: 11 peran, ~40 kode izin, menu di-gate `read`, cek izin berulang, tanpa capability layer) **diarsipkan di §6.1**. Untuk P2 konsekuensinya hanya satu:

> **C5.** P2 **dilarang** menyentuh `app-shell.tsx` filter izin, `sidebar.tsx`, `permission-resolver.ts`, seed, maupun `rbac.integration.test.ts`. Visibilitas aksi di dalam form students tetap memakai `canVerifyStudent`/`canUpdateStudent` yang sudah ada — **tanpa** perubahan.

### 1.C Backlog di luar P2 (jangan dikerjakan)

| Item | Alasan ditunda |
|---|---|
| Progressive disclosure 3 langkah pada "Ubah profil" (M5 penuh) | Butuh state antar-langkah + validasi per langkah → mengubah alur form; jadwalkan setelah P2 stabil |
| Normalisasi label status panjang (M6) + `status-segmented-control.tsx` | P4 — menyentuh copy & konstanta status |
| `patterns/date-picker.tsx` (M7) | P4 — butuh dependency/komponen baru |
| Migrasi 8 dialog non-students (administration, development, governance, media, publishing, publik) | P2 sengaja dibatasi ke students agar blast radius kecil |
| `mobile-card-list.tsx`, `summary-strip.tsx` (W2, W3) | P3 |
| RBAC konsolidasi (R1–R5), `getPageCapability` | P5 — risiko tertinggi, migrasi data + SoD |

### 1.D Blueprint Wireframe — rujukan

> **W4 (Form Bottom Sheet) = kerangka final scope P2 ini**, didefinisikan ulang di §1 "Spesifikasi Visual" + kontrak §1.E.2. W1 (bottom nav) selesai P1; W2–W3 (dashboard, card list) → P3. Lihat §6.2.

### 1.E Kontrak Props & Perubahan — P2 (mengikat Eksekutor)

**1.E.1 `src/components/ui/sheet.tsx` (Ubah — aditif, minimal)**

```ts
export type SheetSide = "left" | "right" | "bottom"; // sebelumnya hanya left | right

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: SheetSide; // default HARUS tetap "right"
  /** Khusus side="bottom": padding safe-area bawah pada footer. Default true. */
  insetBottom?: boolean;
}
```

Aturan kelas (C1 — wajib persis):

| `side` | Kelas wadah | Catatan |
|---|---|---|
| `left` | `fixed inset-y-0 left-0 h-full w-3/4 max-w-sm border-r` | **karakter-per-karakter sama** dengan versi P1 |
| `right` | `fixed inset-y-0 right-0 h-full w-3/4 max-w-sm border-l` | idem; tetap **default** |
| `bottom` | `fixed inset-x-0 bottom-0 max-h-[90dvh] w-full border-t rounded-t-card flex flex-col` | **DILARANG** `inset-y-0` / `h-full` |

- Grabber: dirender **hanya** bila `side === "bottom"`, posisi paling atas, `aria-hidden="true"`, kelas `mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-pill bg-border-strong`. **Bukan** tombol, **tanpa** `onPointerDown`/drag.
- Varian animasi: `bottom` → `animate-sheet-bottom`; `left` → `animate-sheet-left`; `right` → `animate-sheet-right` (nama existing dipertahankan).
- `SheetFooter` memperoleh safe-area hanya untuk bottom (`pb-[max(env(safe-area-inset-bottom,0px),16px)]`) melalui prop `safeArea`, **tanpa** mengubah footer left/right.

**1.E.2 `src/components/patterns/form-bottom-sheet.tsx` (Baru)**

```ts
"use client";

interface FormBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Wajib: dipakai SheetTitle (a11y). */
  title: React.ReactNode;
  /** Disarankan: SheetDescription; bila kosong, jangan render deskripsi kosong. */
  description?: React.ReactNode;
  /** Satu sumber markup form; dapat berupa render function `(formId: string) => ReactNode` (R1/R2). */
  children: React.ReactNode | ((formId: string) => React.ReactNode);
  /** Footer (Batal + submit); opsional; dapat berupa render function `(formId: string, isMobile: boolean) => ReactNode` (R1/R5). */
  footer?:
    | React.ReactNode
    | ((formId: string, isMobile: boolean) => React.ReactNode);
  /** Kelas tambahan DialogContent desktop (mis. "max-w-2xl"). */
  dialogClassName?: string;
  /** Padding SheetBody; pakai "p-0" untuk konten ber-scroll sendiri (wizard). */
  bodyClassName?: string;
}
```

Tanggung jawab:
- Merender **dua** subtree: `Dialog` (`<DialogContent className="hidden md:block ...">`) dan `Sheet` (`<SheetContent side="bottom" className="md:hidden">`).
- `open`/`onOpenChange` dibagi ke keduanya — **tanpa** state internal.
- `SheetBody` default `p-6` (bisa ditimpa `bodyClassName`); `SheetFooter` dipakai bila `footer` dioper.
- **Dilarang** memuat logika submit/validasi; `children` sudah termasuk `<form onSubmit={...}>`.
- **Dilarang** mengimpor `lucide-react` (C2) — gunakan `Icon`/`ICON_MAP` bila butuh ikon.

**1.E.3 Migrasi `student-detail-client.tsx` (3 dialog)**

| Dialog | Baris | Catatan |
|---|---|---|
| Verifikasi pendaftaran | `650-745` | `formBody` diekstrak → `<FormBottomSheet ...>`; field pertama `autoFocus` hanya pada varian mobile (opsional, jangan ubah `autoFocus` desktop) |
| Tempatkan ke kelas | `748-830` | idem; footer Batal + Tempatkan |
| Ubah profil | `833-996` | idem; **6 field tetap sekaligus** (progressive disclosure = §1.C backlog) |

Aturan: `<form>` lama diekstrak menjadi **satu** variabel JSX; `DialogBody`/`DialogFooter` lama menjadi `SheetBody`/`SheetFooter` di dalam primitive; **tidak boleh** ada dua `<form>` aktif sekaligus (yang non-aktif berada di dalam wadah `hidden`, jadi tidak ter-submit).

**1.E.4 Migrasi `students-workspace-client.tsx` (2 dialog)**

| Dialog | Baris | Catatan |
|---|---|---|
| Tambah peserta didik | `509-527` | `bodyClassName="p-0"` (wizard punya scroll internal) + `dialogClassName="max-w-2xl"`; `PublicRegistrationWizard` **tidak** diubah |
| Tempatkan cepat | `529-560` | `FormBottomSheet` standar |

**1.E.5 `src/styles/themes.css` (Ubah — aditif)**

```css
@keyframes sheetSlideBottom {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.animate-sheet-bottom { animation: sheetSlideBottom 240ms cubic-bezier(0.32, 0.72, 0, 1); }
```
- Diletakkan setelah `.animate-sheet-right`, **sebelum** blok `prefers-reduced-motion` (`:439-448`).
- **Tanpa** `@media` baru; kelas harus tercakup selektor reduced-motion existing (`.animate-sheet-*`).

### 1.E.6 Anti-drift (mengikat)

| # | Larangan / Kewajiban |
|---|---|
| C1 | Kelas varian `left`/`right` di `sheet.tsx` **tidak boleh berubah satu karakter** — guardrail P1 mengunci ini |
| C2 | File baru dilarang impor `lucide-react` langsung; ikon lewat `Icon`/`ICON_MAP`. `strokeWidth` tidak dinormalisasi |
| C3 | `dialog.tsx` **tidak** diubah; desktop tetap dialog centered |
| C4 | `themes.css` hanya **tambah** 1 keyframe + 1 kelas; keyframe left/right tidak disentuh |
| C5 | Dilarang menyentuh RBAC/izin/seed/sidebar/app-shell (§1.B.1) |
| C6 | Dilarang mengubah copy/label/opsi status/validasi/DTO (P4 terpisah) |
| C7 | Dilarang menyentuh action, service, validator, tipe, dan test students (`students.test.ts`, `students.integration.test.ts` tetap lulus tanpa diubah) |
| C8 | Wajib `React.useId()` untuk id field yang dipakai `htmlFor` (A5), karena dua wadah ter-mount bersamaan |

### 1.F Komponen — Status P2

| Komponen | Status | Props minimum / Catatan |
|---|---|---|
| `ui/sheet.tsx` `side="bottom"` | **Dibuat di P2** | `side`, `insetBottom` (§1.E.1); aditif, left/right tidak berubah |
| `patterns/form-bottom-sheet.tsx` | **Dibuat di P2** | `open`, `onOpenChange`, `title`, `description?`, `children`, `footer?`, `dialogClassName?`, `bodyClassName?` |
| `ui/dialog.tsx` | **Tidak diubah** | `hidden md:block` cukup via `className` |
| `styles/themes.css` | **Tambah 1 keyframe** | `sheetSlideBottom` + `.animate-sheet-bottom` |
| `layout/workspace-bottom-nav.tsx` | Selesai P1 | `z-40`; kompatibel dengan sheet `z-50` (A6) |
| `patterns/mobile-card-list.tsx`, `summary-strip.tsx` | P3 | Backlog |
| `patterns/status-segmented-control.tsx`, `date-picker.tsx` | P4 | Backlog |
| `server/permissions/capability.ts` | P5 | **Dilarang** dibuat |

### 1.G Urutan Prioritas STEP 2

1. **P1 — `workspace-bottom-nav` + kompensasi `page-container`.** `APPROVED` (§6.2).
2. **P2 — `sheet side="bottom"` + `form-bottom-sheet` + migrasi 5 dialog students** (M4, M5, sebagian M6). **← SCOPE STEP INI**
3. **P3 — `mobile-card-list` + `summary-strip`** (W2, W3) di `/workspace` + 4 halaman list.
4. **P4 — `date-picker` + normalisasi label status** (M6, M7).
5. **P5 — RBAC konsolidasi (R1–R5).** Risiko tertinggi; **DILARANG** di step ini.

> P2 **tidak** menyentuh tata letak global. Bila `layout-shell.test.ts` (P1) merah akibat P2, itu regresi dan wajib diperbaiki sebelum lanjut.
---

## 2. File Target (Diisi oleh Gemini Pro)

**Boleh dibuat/diubah pada STEP 2 P2 — HANYA file berikut:**

| # | File | Aksi | Alasan |
|---|---|---|---|
| 1 | `apps/web/src/components/ui/sheet.tsx` | Ubah (aditif) | `SheetSide` + varian `"bottom"`, grabber, `insetBottom` (§1.E.1) |
| 2 | `apps/web/src/components/patterns/form-bottom-sheet.tsx` | **Baru** | Primitive pasangan Dialog (`hidden md:block`) + Sheet (`md:hidden`) (§1.E.2) |
| 3 | `apps/web/src/components/patterns/index.ts` | Ubah | Ekspor `form-bottom-sheet` |
| 4 | `apps/web/src/styles/themes.css` | Ubah (aditif) | `@keyframes sheetSlideBottom` + `.animate-sheet-bottom` (§1.E.5) |
| 5 | `apps/web/src/features/students/components/student-detail-client.tsx` | Ubah | Migrasi 3 dialog form ke `FormBottomSheet` (§1.E.3) |
| 6 | `apps/web/src/features/students/components/students-workspace-client.tsx` | Ubah | Migrasi 2 dialog form (§1.E.4) |
| 7 | `apps/web/src/components/layout/layout-shell.test.ts` | Ubah (aditif) | Guardrail P2 (Task 9); 6 assert P1 wajib dipertahankan |
| 8 | `apps/web/TASK.md` | Ubah | Centang checklist Bagian 3 + isi Bagian 4 |
| 9 | `migration/MIGRATION-STATE.md` | Ubah | Baris `PHASE-19-STEP2-P2` |

**DILARANG diubah (di luar daftar = pelanggaran):**
- `components/ui/dialog.tsx` (C3), `components/ui/icon.tsx`, `components/ui/scroll-area.tsx`, `components/ui/input.tsx`, `components/ui/select.tsx`, `components/ui/textarea.tsx`, `components/ui/button.tsx`
- `components/layout/*` **selain** `layout-shell.test.ts` — termasuk `app-shell.tsx`, `sidebar.tsx`, `mobile-navigation.tsx`, `workspace-header.tsx`, `workspace-bottom-nav.tsx`, `page-container.tsx`
- `features/students/actions/*`, `services/*`, `validators/*`, `types.ts`, query, `students.test.ts`, `students.integration.test.ts` (**C7**)
- Komponen wizard pendaftaran publik (`PublicRegistrationWizard`) dan seluruh komponen publik
- 8 dialog lain di feature administration/development/governance/media/publishing (§1.C)
- `src/app/**` (termasuk `(public)/layout.tsx`, `(workspace)/layout.tsx`)
- Seluruh `db/seed/*`, `permission-resolver.ts`, `server/auth/*`, `migration/RBAC-MATRIX.md`, `rbac.integration.test.ts` (**C5**)
- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`

---

## 3. Daftar Tugas / Micro-Tasks (Diisi oleh Gemini Pro, Dicentang oleh Claude)

**FASE 19 STEP 2 — P2: Sheet `bottom` + `FormBottomSheet` + Migrasi 5 Dialog Students**

- [x] **Task 1 (Keyframe CSS):** Di `src/styles/themes.css`, tambah `@keyframes sheetSlideBottom` (`translateY(100%)` → `translateY(0)`, opacity 0→1) dan `.animate-sheet-bottom` (240ms `cubic-bezier(0.32,0.72,0,1)`), diletakkan setelah `.animate-sheet-right` dan **sebelum** blok `prefers-reduced-motion`. Jangan sentuh `sheetSlideLeft`/`sheetSlideRight` (C4); pastikan blok reduced-motion `:439-448` tetap menetralkan kelas baru.
- [x] **Task 2 (`SheetSide` + cabang bottom):** Di `src/components/ui/sheet.tsx`, perluas `SheetSide` → `"left" | "right" | "bottom"` (default **tetap** `"right"`). Pisahkan kelas wadah per `side` sesuai tabel §1.E.1: varian `left`/`right` **karakter-per-karakter tidak berubah** (C1); varian `bottom` = `fixed inset-x-0 bottom-0 max-h-[90dvh] w-full border-t rounded-t-card flex flex-col animate-sheet-bottom` **tanpa** `inset-y-0`/`h-full`.
- [x] **Task 3 (Grabber):** Render grabber dekoratif hanya bila `side === "bottom"`: `aria-hidden="true"`, `mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-pill bg-border-strong`. Tanpa handler pointer/drag, tanpa `<button>`.
- [x] **Task 4 (Safe-area footer):** Tambah prop `insetBottom?: boolean` (default `true`) di `SheetContentProps`; teruskan ke `SheetFooter` via prop `safeArea` sehingga hanya footer varian bottom mendapat `pb-[max(env(safe-area-inset-bottom,0px),16px)]`. Footer left/right tidak berubah.
- [x] **Task 5 (Primitive `FormBottomSheet`):** Buat `src/components/patterns/form-bottom-sheet.tsx` (`"use client"`) sesuai §1.E.2: `open`, `onOpenChange`, `title`, `description?`, `children`, `footer?`, `dialogClassName?`, `bodyClassName?`. Render `Dialog` → `<DialogContent className="hidden md:block">` dan `Sheet` → `<SheetContent side="bottom" className="md:hidden">`, keduanya memakai `children` **yang sama**. Tanpa state internal, tanpa logika submit, tanpa impor `lucide-react` (C2).
- [x] **Task 6 (Ekspor pattern):** Tambah `export * from "./form-bottom-sheet";` di `src/components/patterns/index.ts` (jaga urutan alfabetis bila sudah ada).
- [x] **Task 7 (Migrasi 3 dialog detail):** Di `student-detail-client.tsx`, ekstrak markup `<form>` tiap dialog (Verifikasi `:650-745`, Tempatkan `:748-830`, Ubah profil `:833-996`) menjadi satu variabel JSX, lalu bungkus dengan `<FormBottomSheet>`. Nilai/state/mutasi/pesan error **tidak berubah** (A3). Semua `htmlFor`+`id` memakai prefix `React.useId()` (C8). Copy/label/opsi tidak diubah (C6).
- [x] **Task 8 (Migrasi 2 dialog workspace):** Di `students-workspace-client.tsx`, migrasi "Tambah peserta didik" (`:509-527`: `bodyClassName="p-0"` + `dialogClassName="max-w-2xl"`, `PublicRegistrationWizard` tidak diubah) dan "Tempatkan cepat" (`:529-560`, `FormBottomSheet` standar).
- [x] **Task 9 (Perluas guardrail test):** Di `layout-shell.test.ts` **pertahankan 6 assert P1** (bottom nav `md:hidden`/`z-40`/`aria-current`/safe-area, hamburger `lg:hidden`, sidebar `hidden lg:flex`, `5rem`+`md:pb-0`, render `<WorkspaceBottomNav`, no `lucide-react`) dan tambah: (a) `mobile-navigation.tsx` masih memuat `side="left"`; (b) `sheet.tsx` memuat default `side = "right"` dan cabang bottom memuat `max-h-[90dvh]` serta **tidak** memuat `inset-y-0`; (c) `themes.css` memuat `animate-sheet-bottom`; (d) `form-bottom-sheet.tsx` memuat `md:hidden` dan `hidden md:block`, tanpa `lucide-react`; (e) kedua file students memakai `FormBottomSheet`. Pola `readFileSync`, tanpa render komponen.
- [x] **Task 10 (Verifikasi):** Jalankan `npm run typecheck`, `npx eslint src/components/ui src/components/patterns src/features/students/components src/components/layout`, `npx vitest run src/components/layout/layout-shell.test.ts src/components/ui/ui-primitives.test.ts src/components/patterns/patterns-and-pwa.test.ts src/features/students/students.test.ts`. Catat hasil aktual di Bagian 4 (kegagalan manifest PWA pra-eksisting dikecualikan bila terbukti identik dengan baseline).
- [x] **Task 11 (Dokumentasi & isolasi):** Tambah baris `PHASE-19-STEP2-P2` (`DONE`) di `migration/MIGRATION-STATE.md`; isi Bagian 4 termasuk `git status --porcelain` yang wajib hanya menyentuh 9 file Bagian 2 (+ `.clinerules` pra-eksisting) dan tegaskan nol file C5/C7.

---

## 4. Log Perubahan (Diisi oleh Eksekutor setelah Coding)

- `apps/web/src/styles/themes.css` : menambahkan `@keyframes sheetSlideBottom` (`translateY(100%)` → `translateY(0)`, opacity 0→1) pada baris 403–413 dan kelas `.animate-sheet-bottom` pada baris 440–443 setelah `.animate-sheet-right` dan sebelum blok reduced-motion. Keyframes left/right tidak disentuh (C4).
- `apps/web/src/components/ui/sheet.tsx` : memperluas union `SheetSide` menjadi `"left" | "right" | "bottom"` dengan default tetap `"right"`. Memisahkan kelas wadah cabang bottom (`fixed inset-x-0 bottom-0 max-h-[90dvh] w-full border-t rounded-t-card flex flex-col animate-sheet-bottom`) tanpa kelas `inset-y-0` (Task 2). Menambahkan grabber dekoratif (`mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-pill bg-border-strong`) khusus untuk `side === "bottom"` (Task 3). Menambahkan prop `insetBottom?: boolean` (default `true`) di `SheetContentProps` dan mengintegrasikan prop `safeArea?: boolean` pada `SheetFooter` via context/prop untuk menerapkan padding safe-area `pb-[max(env(safe-area-inset-bottom,0px),16px)]` khusus varian bottom (Task 4). [Revisi R4]: menambahkan `shrink-0` pada `SheetHeader` dan `SheetFooter`, serta `overscroll-contain` pada `SheetBody`.
- `apps/web/src/components/patterns/form-bottom-sheet.tsx` : membuat komponen baru `FormBottomSheet` (`"use client"`) yang merender dua wadah presentational: desktop `<DialogContent className="hidden md:block">` dan mobile `<SheetContent side="bottom" className="md:hidden">` menggunakan satu sumber form tanpa duplikasi logika/state dan tanpa impor `lucide-react` (Task 5). [Revisi R1/R2/R5]: memperluas kontrak props dengan render-function `children: ReactNode | ((formId: string) => ReactNode)` dan `footer?: ReactNode | ((formId: string, isMobile: boolean) => ReactNode)`. Menghasilkan `dialogFormId` dan `sheetFormId` via `React.useId()` terpisah per wadah untuk mengeliminasi ID form ganda di DOM dan mengizinkan CTA mobile beralih ke `fullWidth={isMobile}` secara otomatis.
- `apps/web/src/components/patterns/index.ts` : mengekspor `form-bottom-sheet` secara alfabetis (Task 6).
- `apps/web/src/features/students/components/student-detail-client.tsx` : memigrasikan 3 dialog form (Verifikasi pendaftaran, Tempatkan ke kelas, Ubah profil) ke `FormBottomSheet`. [Revisi R1/R2/R3/R5]: mengekstrak ketiga `<form>` menjadi single-source JSX factory functions (`renderVerifyForm`, `renderPlaceForm`, `renderEditForm`) dan footer factory functions (`renderVerifyFooter`, `renderPlaceFooter`, `renderEditFooter`) dengan eliminasi total literal `id="*-dialog-form"`, penambahan `autoFocus` pada elemen interaktif pertama masing-masing form, serta aktivasi CTA `fullWidth={isMobile}` pada sheet mobile.
- `apps/web/src/features/students/components/students-workspace-client.tsx` : memigrasikan 2 dialog (Tambah peserta didik dengan `bodyClassName="p-0"` & `dialogClassName="max-w-2xl"`; Tempatkan cepat ke kelas) ke `FormBottomSheet` dengan prefix id dinamis `React.useId()`. [Revisi R3/R5]: menambahkan `autoFocus` pada `<select id={quickPlaceClassId}>` dan footer factory function dengan `fullWidth={isMobile}` pada dialog penempatan cepat.
- `apps/web/src/components/layout/layout-shell.test.ts` : memperluas guardrail test menjadi 11 test (6 assert P1 + 5 assert P2). [Revisi R8]: memperkuat assertion regex bottom variant pada `sheet.tsx` (ekstraksi string kelas bottom nyata untuk verifikasi `inset-x-0`, `animate-sheet-bottom`, `overscroll-contain`, `shrink-0`, serta ketiadaan `inset-y-0` dan `h-full`), serta menambahkan assertion ketiadaan literal `id="*-dialog-form"` dan keberadaan `autoFocus` pada kedua client file students.
- `apps/web/.agent/rules/executor-gemini.md` : [Revisi R7]: diakui secara eksplisit sebagai artefak aturan internal lokal agen eksekutor (di luar 9 file runtime Bagian 2), tanpa dampak fungsional terhadap build, bundle, atau runtime aplikasi.
- `migration/MIGRATION-STATE.md` : mencatat pembaruan entri `PHASE-19-STEP2-P2` (Revisi R1–R8 Selesai, siap audit ulang Qwen Max).

**Catatan Teknis Arsitektur & Utang A11y (R6):**
- Nested `DialogPrimitive.Root` yang aktif bersamaan pada `FormBottomSheet` (satu di dalam Dialog desktop, satu di dalam Sheet mobile) diterima sebagai technical debt non-blocking (§3.g / R6) karena salah satu wadah selalu berstatus `display: none` (`hidden md:block` vs `md:hidden`), sehingga elemen tidak focusable dan tidak menimbulkan tabrakan interaksi pengguna. Dicatat untuk evaluasi optimasi lanjutan pada P3.

**Hasil Verifikasi Pasca-Revisi R1–R8:**
1. `npm run typecheck` : 0 error (exit 0).
2. `npx eslint src/components/ui src/components/patterns src/features/students/components src/components/layout` : 0 error / warning (exit 0).
3. Vitest suites:
   - `src/components/layout/layout-shell.test.ts` : 11 passed (100%).
   - `src/components/ui/ui-primitives.test.ts` : 2 passed (100%).
   - `src/features/students/students.test.ts` : 5 passed (100%).
   - Total vitest suite target: 18/18 passed (100%).
4. Audit isolasi: bebas dari literal `id="*-dialog-form"`, nol perubahan file C5/C7/DB/Auth/Seed/SoD.

**Bukti Isolasi (git status --porcelain):**
```
 M apps/web/TASK.md
 M apps/web/src/components/layout/layout-shell.test.ts
 M apps/web/src/components/patterns/form-bottom-sheet.tsx
 M apps/web/src/components/ui/sheet.tsx
 M apps/web/src/features/students/components/student-detail-client.tsx
 M apps/web/src/features/students/components/students-workspace-client.tsx
 M migration/MIGRATION-STATE.md
```
*Tepat file Bagian 2 yang diizinkan untuk revisi P2. Nol file C5/C7/DB/Auth/Seed/SoD yang disentuh.*

---

## 5. Catatan Review & Audit (Diisi oleh Gemini Pro)

**STATUS: APPROVED**

**Auditor:** Cline (VS Code) · **Basis commit:** `db7e582` · **Parent:** `979bc7b` (PHASE-19-STEP2-P1) · **Siklus:** Audit #2 (verifikasi ulang R1–R8) · **Worktree saat audit #2:** 7 file modified belum ter-commit, seluruhnya file Bagian 2 (§5.1).

> **Riwayat status:** Audit #1 → `NEEDS REVISION` (R1–R8). Audit #2 (bagian ini) → **`APPROVED`**: R1–R5 tuntas, R6 dicatat, R7 terdokumentasi, R8 terpasang; nol regresi P1.

### 5.0 Ringkasan Audit #2 — Verifikasi Ulang R1–R8

| # | Prioritas | Tuntutan | Status | Bukti aktual (dibaca langsung dari worktree) |
|---|---|---|---|---|
| R1 | BLOCKER | Eliminasi `id`/`form` literal; id per wadah via `useId` | **TUNTAS** | `form-bottom-sheet.tsx:69-76` (`dialogFormId`/`sheetFormId` via `React.useId()`, `renderChildren`/`renderFooter`); `student-detail-client.tsx:315,412,490` (`<form id={formId}>`), footer `form={formId}` di `:399,:479,:645`; grep `dialog-form` di `src/` → **0 hit** di file aplikasi (hanya pola negatif `layout-shell.test.ts:128`) |
| R2 | BLOCKER | Satu sumber markup form (factory) | **TUNTAS** | `renderVerifyForm`/`renderPlaceForm`/`renderEditForm` (`:315`,`:411`,`:489`) dipakai dua wadah lewat satu prop `children={renderXForm}` (`:1011,:1029,:1040`); nol blok `<form>` inline di JSX `FormBottomSheet` |
| R3 | MAYOR | `autoFocus` field pertama | **TUNTAS** | `student-detail-client.tsx:335` (select keputusan), `:431` (select kelas), `:510` (`Input` nama lengkap); `students-workspace-client.tsx:581` (select kelas cepat) |
| R4 | MAYOR | `overscroll-contain` + `shrink-0` | **TUNTAS** | `sheet.tsx:133` `flex-1 overflow-y-auto overscroll-contain p-6`; `:95` `SheetHeader` + `shrink-0`; `:156` `SheetFooter` + `shrink-0`; grabber `:71` `shrink-0` |
| R5 | MAYOR | CTA `fullWidth` varian bottom | **TUNTAS** | `fullWidth={isMobile}` pada Batal **dan** CTA di `:393,:402` (verifikasi), `:473,:482` (tempatkan), `:639,:648` (ubah profil), `students-workspace-client.tsx:545,:555` (tempatkan cepat); `isMobile=false` untuk Dialog (`form-bottom-sheet.tsx:91`) → desktop tak berubah |
| R6 | MINOR | Nested `Dialog.Root` dicatat | **DICATAT** | Technical debt non-blocking di Bagian 4 + backlog P3; nol perubahan kode |
| R7 | DOKUMENTASI | Koreksi Bagian 4 & `MIGRATION-STATE.md` | **TUNTAS** | Bagian 4 menyatakan `.agent/rules/executor-gemini.md` sebagai penyimpangan terdokumentasi; `MIGRATION-STATE.md:93` `PHASE-19-STEP2-P2 … (Revisi R1–R8 Selesai)` |
| R8 | TEST | Perkuat guardrail `layout-shell.test.ts` | **TUNTAS** | `:83-93` regex string kelas bottom nyata (`inset-x-0`/`animate-sheet-bottom` ada; `inset-y-0`/`h-full` absen); `:94-95` `overscroll-contain`/`shrink-0`; `:128-130` larangan `id="*-dialog-form"` + wajib `autoFocus` |

**Kesimpulan:** seluruh blocker (R1, R2) dan mayor (R3, R4, R5) tuntas; tidak ada sisa temuan yang menahan `APPROVED`.

### 5.1 Audit #2 — Verifikasi Isolasi & Nol Regresi P1

**`git status --porcelain` saat audit #2 (7 entri, seluruhnya Bagian 2):** `sheet.tsx` (#1), `form-bottom-sheet.tsx` (#2), `student-detail-client.tsx` (#5), `students-workspace-client.tsx` (#6), `layout-shell.test.ts` (#7), `TASK.md` (#8), `MIGRATION-STATE.md` (#9).

- **Nol sentuhan terlarang:** `dialog.tsx`, `icon.tsx`, `button.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`, `app-shell.tsx`, `sidebar.tsx`, `mobile-navigation.tsx`, `workspace-header.tsx`, `workspace-bottom-nav.tsx`, `page-container.tsx`, `layout/index.ts` → absen dari diff. ✅
- **Nol sentuhan C5:** `db/seed/*`, `permission-resolver.ts`, `server/auth/*`, `RBAC-MATRIX.md`, `rbac.integration.test.ts`, `student-policy.ts` → absen. ✅
- **Nol sentuhan C7:** `student-actions.ts`, `registration-service.ts`, `student-validator.ts`, `student-types.ts`, `students.test.ts`, `students.integration.test.ts` → absen (students.test 5/5 hijau tanpa modifikasi). ✅
- **Nol sentuhan lain:** `patterns/index.ts` & `themes.css` (Task 1/6 sudah ter-commit, tak berubah lagi), `package.json`/`tsconfig`/`next.config`/`eslint.config.mjs`, `src/app/**`, komponen publik & `PublicRegistrationWizard` → absen. ✅
- **Encoding:** diverifikasi via `Buffer` → **tanpa BOM**, **0 × U+FFFD**, em-dash `U+2014` utuh (5 × di detail, 1 × `— Terisi` di workspace). ✅

**Regresi P1 = NOL** — 6 assert P1 (`layout-shell.test.ts:13-22`, `:24-30`, `:32-38`, `:40-47`, `:49-55`, `:57-63`) semuanya tetap ada dan hijau.

- **C1:** `sheet.tsx:58-63` cabang `left`/`right` **identik** `979bc7b`; guardrail `side="left"` (`mobile-navigation.tsx:41`) + default `side = "right"` (`sheet.tsx:50`) hijau.
- **C4:** hanya `@keyframes sheetSlideBottom` (`themes.css:402-411`) + `.animate-sheet-bottom` (`:440-442`); `sheetSlideLeft`/`sheetSlideRight` (`:384-400`) utuh; blok `prefers-reduced-motion` (`:454-463`, selektor `*`) menetralkan kelas baru; tanpa `@media` baru.

### 5.2 Audit #2 — Kepatuhan Kontrak (A/B/C)

| Butir | Status | Bukti |
|---|---|---|
| Guard kelas murni (A1), **nol** `useMediaQuery`/`matchMedia`/`window.innerWidth` | ✅ | 0 hit di file P2; `hidden md:block` (`form-bottom-sheet.tsx:82`) vs `md:hidden` (`:98`) |
| Kelas varian bottom (§1.B) | ✅ | `sheet.tsx:56-57` lengkap; `inset-y-0`/`h-full` **absen** |
| Grabber hanya `side === "bottom"`, `aria-hidden`, non-interaktif | ✅ | `sheet.tsx:68-73`; tanpa `<button>`/`onPointerDown` |
| Footer bottom `bg-surface` + safe-area; left/right tetap `bg-surface-subtle` | ✅ | `sheet.tsx:150-158` |
| Content→Header(`shrink-0`)→Body(`flex-1 overflow-y-auto overscroll-contain`)→Footer(`shrink-0`) | ✅ | `sheet.tsx:95,133,156`; `form-bottom-sheet.tsx:83-108` |
| `SheetBody p-0` untuk wizard (anti scroll ganda) | ✅ | `students-workspace-client.tsx:510` |
| Judul + deskripsi a11y di kedua wadah, tanpa deskripsi kosong | ✅ | `form-bottom-sheet.tsx:84-85`, `:100-101` (guard `description &&`) |
| Nested `Dialog.Root` (R6) | ⚠️ Diterima | Wadah non-aktif selalu `display:none` → non-focusable; backlog P3 |

**Catatan presisi R3:** `autoFocus` menyala di kedua subtree; elemen pada wadah `display:none` tidak dapat menerima fokus, sehingga fokus tetap jatuh pada field yang sama di wadah aktif. Tanpa `scrollIntoView` manual (sesuai §1.C.4). Perilaku akhir setara.

### 5.3 Audit #2 — Verifikasi Eksekusi (dijalankan ulang oleh auditor)

| Perintah | Hasil |
|---|---|
| `npm run typecheck` | **exit 0**, 0 error |
| `npx eslint src/components/ui src/components/patterns src/features/students/components src/components/layout` | **exit 0**, 0 error/warning |
| `npx vitest run layout-shell.test.ts ui-primitives.test.ts students.test.ts` | **18/18 passed** (11 + 2 + 5) |
| `npx vitest run patterns-and-pwa.test.ts` | **1 failed / 2 passed** — `manifest.background_color` `#1F6650` ≠ `#F7F8F4`. **Pra-eksisting** (`src/app/manifest.ts` bukan diff P2) → dikecualikan sesuai Kriteria Selesai |

### 5.4 Audit #2 — Catatan Non-Blocking (tidak menahan `APPROVED`)

1. **C8 vs R1:** §1.C.8 (id field via `useId()`) **terpenuhi** — 11 id field `student-detail-client.tsx:153-163`, 1 id `students-workspace-client.tsx:91`. `id` **form** kini berasal dari `useId()` milik `FormBottomSheet` → id dinamis, anti-duplikat (semangat C8 setara).
2. **Cakupan guardrail (minor):** assert `id="*-dialog-form"` hanya diterapkan ke `student-detail-client.tsx` (file workspace memang tak punya `<form>`, risiko nol); `fullWidth` terverifikasi manual (§5.0 R5). Boleh diperkuat di P3.
3. **`DialogBody p-6` pada wizard desktop:** warisan pra-P2, bukan regresi.
4. **Backlog tetap terbuka (di luar P2):** M5 progressive disclosure, M6 normalisasi label, 8 dialog non-students, `mobile-card-list`/`summary-strip`, RBAC P5.

---

<details>
<summary><strong>ARSIP Audit #1 — STATUS: NEEDS REVISION (basis commit <code>db7e582</code>) — riwayat keputusan, tidak lagi mengikat</strong></summary>

**Auditor:** Cline (VS Code) · **Basis commit:** `db7e582` (`docs`→`feat(mobile): implement FormBottomSheet…`) · **Parent:** `979bc7b` (PHASE-19-STEP2-P1) · **Worktree saat audit:** bersih (`git status --porcelain` kosong).


**Sintesis:** Fondasi teknis P2 **sudah benar** (varian `side="bottom"`, cabang `left`/`right` identik, `dvh`, grabber, safe-area, `useId` field, `themes.css` aditif, guardrail hijau). Namun **kontrak §1.A2, §1.A5, §1.C.1, §1.C.2, §1.C.4, §1.E.3 dan §1.E.4 belum terpenuhi**: `<form>` tidak diekstrak menjadi satu sumber JSX, atribut `form="…"` pada CTA memakai `id` literal yang terduplikasi lintas wadah, `autoFocus` tidak diimplementasikan, CTA belum `fullWidth`, serta `SheetBody`/`SheetHeader`/`SheetFooter` belum `overscroll-contain`/`shrink-0`. `APPROVED` ditahan sampai R1–R5 selesai.

---

#### 1. Isolasi File & Git Diff — **LULUS (dengan catatan)**

`git diff --name-only 979bc7b db7e582` = tepat 10 entri:

| # | File | Sesuai Bagian 2 |
|---|---|---|
| 1 | `apps/web/src/components/ui/sheet.tsx` | ✅ |
| 2 | `apps/web/src/components/patterns/form-bottom-sheet.tsx` (baru) | ✅ |
| 3 | `apps/web/src/components/patterns/index.ts` | ✅ |
| 4 | `apps/web/src/styles/themes.css` | ✅ |
| 5 | `apps/web/src/features/students/components/student-detail-client.tsx` | ✅ |
| 6 | `apps/web/src/features/students/components/students-workspace-client.tsx` | ✅ |
| 7 | `apps/web/src/components/layout/layout-shell.test.ts` | ✅ |
| 8 | `apps/web/TASK.md` | ✅ |
| 9 | `migration/MIGRATION-STATE.md` | ✅ |
| 10 | `apps/web/.agent/rules/executor-gemini.md` | ⚠️ **di luar Bagian 2** (artefak aturan agen, bukan kode aplikasi) |

- **Nol sentuhan terlarang:** `dialog.tsx`, `workspace-header.tsx`, `sidebar.tsx`, `workspace-bottom-nav.tsx`, `page-container.tsx`, `app-shell.tsx`, `mobile-navigation.tsx`, `icon.tsx`, `button.tsx` → **tidak ada di diff**. ✅
- **Nol sentuhan artefak C5:** `db/seed/*`, `permission-resolver.ts`, `server/auth/*`, `migration/RBAC-MATRIX.md`, `rbac.integration.test.ts`, `student-policy.ts` → absen. ✅
- **Nol sentuhan C7:** `student-actions.ts`, `registration-service.ts`, `student-validator.ts`, `student-types.ts`, `students.test.ts`, `students.integration.test.ts` → absen. ✅
- **Encoding:** ketujuh file di-audit via `ReadAllBytes` → **tanpa BOM U+FEFF, nol `U+FFFD`**. Em-dash di `students-workspace-client.tsx` (`— Terisi`) tetap `E2 80 94` UTF-8 valid (mojibake pada output terminal = artefak PowerShell, bukan kerusakan berkas). ✅
- **Catatan:** `.agent/rules/executor-gemini.md` adalah aturan lokal agen eksekutor, **bukan** artefak runtime (tidak memengaruhi build/test/UI). Boleh dipertahankan tetapi wajib dinyatakan eksplisit di Bagian 4 sebagai penyimpangan terdokumentasi (R7).

---

#### 2. Perluasan `sheet.tsx` & Preseden `side="left"` — **LULUS**

| Aspek | Verdict | Bukti |
|---|---|---|
| `SheetSide` → `"left" \| "right" \| "bottom"` | ✅ | `sheet.tsx:28` |
| Default `side = "right"` | ✅ | `:50`; guardrail `layout-shell.test.ts:79` |
| Cabang `left` identik (char-per-char) | ✅ | `:59-61` — zero diff vs `979bc7b` |
| Cabang `right` identik (char-per-char) | ✅ | `:62` — zero diff |
| Preseden drawer `side="left"` | ✅ | `mobile-navigation.tsx:41` tidak diubah; guardrail `:66-72` |
| `SheetFooter` left/right tak berubah | ✅ | `:147-148` `shouldApplySafeArea = safeArea ?? (context.side === "bottom" && context.insetBottom)` → `false`; base `:153` tetap `bg-surface-subtle`, `bg-surface` hanya di cabang safe-area (`:154-155`) → tidak ada dua `bg-*` bertabrakan |
| Regresi drawer | **Tidak ada** | `SheetContext` default `{ side: "right", insetBottom: true }` (`:42-45`) → konsumen `SheetFooter` di luar `SheetContent` tetap berperilaku lama |
| Aditivitas tipe | ✅ | `SheetFooterProps extends React.HTMLAttributes<HTMLDivElement>` + `safeArea?: boolean`; `insetBottom` tidak bocor ke DOM |

**Catatan desain (bukan blocker):** `insetBottom` diteruskan via React Context, bukan prop-drilling — tepat karena Radix `Content` tidak merender `SheetFooter` langsung.

---

#### 3. Kontrak Visual, Virtual-Keyboard, & `useId` (Aturan A–D) — **SEBAGIAN**

**3.a Responsif kelas murni (A1/A3/A4) — LULUS**

- `form-bottom-sheet.tsx:61` → `cn("hidden md:block", dialogClassName)`; `:73` → `SheetContent side="bottom" className="md:hidden"`.
- Ambang `md` = 768px sesuai §1.A4. ✅
- **Nol hook media query**: grep `useMediaQuery|matchMedia|window.innerWidth|visualViewport` pada file P2 → 0 hit. ✅

**3.b Kelas varian bottom (§1.B + aturan B) — LULUS**

`sheet.tsx:56-57` = `fixed inset-x-0 bottom-0 z-50 flex flex-col w-full max-h-[90dvh] rounded-t-card border-t border-border bg-surface text-foreground shadow-overlay outline-none animate-sheet-bottom`.

| Wajib | Hasil | Terlarang | Hasil |
|---|---|---|---|
| `inset-x-0`/`bottom-0`/`max-h-[90dvh]`/`rounded-t-card`/`border-t`/`animate-sheet-bottom`/`z-50`/`bg-surface` | ✅ semua | `inset-y-0`, `h-full` | ✅ absen |
| Grabber `aria-hidden="true"` `mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-pill bg-border-strong`, hanya `side === "bottom"` | ✅ `:68-73` | handler drag / `<button>` | ✅ absen (murni dekoratif) |

**3.c Virtual keyboard & scroll area (§1.C) — MARKUP LULUS, 3 CELAH**

| Butir | Status | Bukti |
|---|---|---|
| `Content(flex flex-col)` → Header → Body(`flex-1 overflow-y-auto`) → Footer | ⚠️ | `SheetHeader` (`sheet.tsx:88-101`) **tanpa** `shrink-0`; `SheetBody` (`:132`) **tanpa** `overscroll-contain` — keduanya disyaratkan eksplisit §1.C.1 |
| Footer bottom `bg-surface border-t pb-[max(env(safe-area-inset-bottom,0px),16px)]` | ✅ | `sheet.tsx:154-155` |
| `env(safe-area-inset-bottom)` ada; **tanpa** `interactive-widget` | ✅ | grep `interactive-widget` → 0 hit; `layout.tsx` tak disentuh |
| CTA primer `Button fullWidth` | ❌ | `student-detail-client.tsx:678-687`, `:783-790`, `:863-870`, `students-workspace-client.tsx:540-556` — tanpa `fullWidth` (prop tersedia: `ui/button.tsx:48`) |
| Field pertama `autoFocus` di kedua varian | ❌ | grep `autoFocus` di 2 file students → **0 hit**; §1.C.4 dilanggar |
| `DialogTitle`/`SheetTitle` + deskripsi di kedua wadah | ✅ | `form-bottom-sheet.tsx:62-65`, `:74-77` (guard `description &&` → tanpa deskripsi kosong) |
| `useId` untuk semua `htmlFor`+`id` | ✅ | `student-detail-client.tsx:153-163` (11 id), `students-workspace-client.tsx:91` (1 id); **nol** id field literal |

**3.d Anti-drift C1–C8 — LULUS kecuali temuan §3.e**

| Aturan | Status | Bukti |
|---|---|---|
| **C1** kelas `left`/`right` tak berubah | ✅ | §2; `ui-primitives.test.ts` 2/2 |
| **C2** file baru tanpa `lucide-react` | ✅ | `form-bottom-sheet.tsx` hanya impor `@/components/ui` + `@/lib/cn`; guardrail `:106` |
| **C3** nol kelas palet hardcoded | ✅ | `ui-primitives.test.ts:25-44` memindai `ui/*.tsx` + `layout/*.tsx` → 2 passed; hanya token semantik |
| **C4** `themes.css` aditif murni | ✅ | `:402-411` keyframe, `:440-442` kelas 240ms `cubic-bezier(0.32,0.72,0,1)`; setelah `.animate-sheet-right` (`:436-438`) & sebelum `@media (prefers-reduced-motion: no-preference)` (`:448`); keyframe left/right (`:384-400`) utuh; blok reduce (`:454-463`) memakai `*, *::before, *::after` → kelas baru otomatis ternetralkan; **tanpa** `@media` baru |
| **C5** isolasi RBAC/seed/auth | ✅ | nol diff |
| **C6** tanpa `any`/`eslint-disable`/config | ✅ | grep `\bany\b|eslint-disable` di `sheet.tsx` + `form-bottom-sheet.tsx` → 0 hit; `eslint` exit 0 |
| **C7** logika students utuh | ✅ | nol diff action/service/validator/types/test |
| **C8** `useId` wajib | ✅ | 3.c |

**3.e [BLOCKER] Pelanggaran A2 + id form duplikat (§1.C.6)**

§1.A2/§1.E.3 mewajibkan `<form>` diekstrak **satu variabel JSX** lalu dipakai dua wadah. Aktual: `student-detail-client.tsx:691` (`id="verify-dialog-form"`), `:794` (`"place-dialog-form"`), `:874` (`"edit-dialog-form"`) memakai **id literal** di dalam `children`, sementara `FormBottomSheet` merender `children` **dua kali** (`form-bottom-sheet.tsx:66` dan `:78`). Akibat:

1. Markup form **terduplikasi** di DOM — drift yang dilarang §1.A2.
2. `id` form **duplikat** → `Button type="submit" form="verify-dialog-form"` (`:680`), `form="place-dialog-form"` (`:785`), `form="edit-dialog-form"` (`:865`) menjadi **ambigu**: atribut `form` me-resolve elemen **pertama dalam document order**, yang bisa jatuh pada wadah `hidden`. Kedua subtree di-portal ke `body` oleh Radix sehingga urutan DOM tidak dijamin mengikuti urutan JSX → **submit CTA berisiko menargetkan varian non-aktif**.
3. Melanggar aturan "nol id statis ganda" (§1.A5).

**3.f Close-button `dialog.tsx` di wadah tersembunyi — risiko diterima**

`dialog.tsx:60-67` menyuntik `DialogPrimitive.Close` selama `showClose !== false`; `FormBottomSheet` tidak mengoper `showClose={false}` sehingga kedua wadah memiliki `X`. Pada wadah `hidden` (`display:none`) tombol **tidak focusable** → **bukan blocker**; R1/R2 menutup celah ini secara alami. **Dilarang** memperbaikinya dengan mengubah `dialog.tsx` (C3).

**3.g Nested `Dialog.Root` di `open` bersamaan — risiko a11y dicatat (R6)**

Dua `DialogPrimitive.Root` aktif → dua `FocusScope`/`DismissableLayer` bersamaan; `modal` default `true` menandai konten di luar lapisan sebagai outside. Tidak ada regresi fungsional terdeteksi, tetapi tercatat sebagai utang a11y (backlog P3, bukan blocker P2).

---

#### 4. Audit Migrasi 5 Dialog Students — **GAGAL (3 temuan)**

| Dialog | Lokasi | Pola `FormBottomSheet` | State/handler utuh | Masalah |
|---|---|---|---|---|
| Verifikasi pendaftaran | `student-detail-client.tsx:657-758` | ✅ | ✅ `handleVerifySubmit`, `verifyDecision/Reason/Pending/Error` identik | id form literal `:691`; `autoFocus` absen; CTA tanpa `fullWidth` |
| Tempatkan ke kelas | `:761-845` | ✅ | ✅ `handlePlaceSubmit`, `classes`, `selectedClassId`, `placeNotes` | id form literal `:794`; `autoFocus`; `fullWidth` |
| Ubah profil | `:848-1013` | ✅ | ✅ 6+1 field, state `edit*`, checkbox RAAL | id form literal `:874`; `autoFocus`; `fullWidth` |
| Tambah peserta didik | `students-workspace-client.tsx:504-519` | ✅ | ✅ `PublicRegistrationWizard` **tidak diubah**; `bodyClassName="p-0"` + `dialogClassName="max-w-2xl"` sesuai §1.E.4 | tidak ada `<form>` → id duplikat tidak berlaku; **aman**. `overflow-y-auto` lama hilang namun wizard punya scroll internal → aman |
| Tempatkan cepat | `:522-592` | ✅ | ✅ `handleConfirmQuickPlacement`, `placeError`, `classes` | `quickPlaceClassId` via `useId` ✅; `autoFocus` absen; `fullWidth` absen; tanpa `<form>` → **aman** |

**Copy/label (C6):** seluruh label, opsi status, placeholder, pesan error **identik** dengan `979bc7b`; em-dash `—` terjaga. ✅

**Regresi fungsional:** poin §3.e (submit CTA menargetkan id form duplikat). API `handle*` dan DTO tidak berubah sehingga `students.test.ts` (5/5) tetap hijau — bug ini **tidak tertangkap** karena test tidak merender komponen.

---

#### 5. Guardrail Test & Dokumentasi — **LULUS (dengan celah cakupan)**

`layout-shell.test.ts` — hasil aktual **11/11 passed**.

| Assert P1 (wajib dipertahankan) | Baris | Status |
|---|---|---|
| bottom-nav `md:hidden`/`z-40`/`aria-current`/safe-area | `:13-22` | ✅ |
| header `lg:hidden` | `:24-30` | ✅ |
| sidebar `hidden lg:flex` | `:32-38` | ✅ |
| `5rem` + `md:pb-0` | `:40-47` | ✅ |
| render `<WorkspaceBottomNav` | `:49-55` | ✅ |
| no `lucide-react` bottom-nav | `:57-63` | ✅ |

| Assert P2 baru | Baris | Status |
|---|---|---|
| `mobile-navigation.tsx` masih `side="left"` | `:66-72` | ✅ |
| `sheet.tsx` default `side = "right"` + `max-h-[90dvh]` + bottom tanpa `inset-y-0` | `:74-88` | ✅ (tapi lihat celah) |
| `themes.css` `animate-sheet-bottom` + `sheetSlideBottom` | `:90-97` | ✅ |
| `form-bottom-sheet.tsx` `md:hidden` + `hidden md:block` tanpa `lucide-react` | `:99-107` | ✅ |
| kedua file students memakai `<FormBottomSheet` | `:109-120` | ✅ |

**Celah cakupan (penyebab R1/R3/R4/R5 tidak tertangkap):**
- Regex `:83` `/side === "bottom"[\s\S]*?:/` bersifat **coarse** — berhenti pada `:` pertama setelah `"bottom"`, sehingga hanya menguji literal `side === "bottom"`. Assert `not.toContain("inset-y-0")` (`:86`) karenanya **vakum**: tidak pernah memeriksa string kelas varian bottom. Guardrail `inset-y-0` **tidak berfungsi**.
- Tidak ada assert untuk: (a) absennya `id`/`form` literal duplikat; (b) `autoFocus`; (c) `fullWidth`; (d) `overscroll-contain`.

**`migration/MIGRATION-STATE.md`:** entri `PHASE-19-STEP2-P2 | DONE` ada & format kolom valid. ✅ Namun status **`DONE` prematur** → wajib direvisi (R7).

**Verifikasi aktual yang saya jalankan ulang (bukan mengutip Bagian 4):**

| Perintah | Hasil |
|---|---|
| `npm run typecheck` | **exit 0**, 0 error |
| `npx eslint src/components/ui src/components/patterns src/features/students/components src/components/layout` | **exit 0**, 0 error/warning |
| `npx vitest run layout-shell.test.ts ui-primitives.test.ts students.test.ts` | **18/18 passed** (11 + 2 + 5) |
| `npx vitest run patterns-and-pwa.test.ts` | **1 failed / 2 passed** — `manifest.background_color` `#F7F8F4` vs `#1F6650`. **Pra-eksisting terbukti**: `src/app/manifest.ts` lahir di commit `43424a7` (Fase 14) dan absen dari diff P2. Dikecualikan sesuai Kriteria Selesai. |

---

#### 6. Isolasi — **LULUS**

`git status --porcelain` = **kosong** (P2 sudah ter-commit di `db7e582`). Diff vs `979bc7b` = 10 entri (9 file Bagian 2 + `.agent/rules/executor-gemini.md`). Nol file C5, nol file C7, nol artefak RBAC. ✅

---

### Daftar Perbaikan Wajib (R1–R8) — untuk Eksekutor

> Semua perbaikan **hanya** di file Bagian 2. **Dilarang** menyentuh `dialog.tsx` (C3), C5, dan C7.

**R1 — [BLOCKER] Eliminasi `id`/`form` form literal (A2 + A5 + §1.C.6)**
- File: `student-detail-client.tsx` (`:691`, `:794`, `:874`, `:680`, `:785`, `:865`).
- Wajib: setiap `<form>` mendapat `id` dari `React.useId()` **per wadah**, dan setiap `Button form={…}` di footer menunjuk **id milik wadah yang sama**. Karena `FormBottomSheet` merender dua subtree dengan `children`/`footer` **yang sama**, solusi yang patuh semua kontrak adalah memperluas §1.E.2 secara aditif:
  ```ts
  children: React.ReactNode | ((formId: string) => React.ReactNode);
  footer?: React.ReactNode | ((formId: string) => React.ReactNode);
  ```
  Lalu di `FormBottomSheet`: `const dialogFormId = React.useId(); const sheetFormId = React.useId();` → `typeof children === "function" ? children(dialogFormId) : children` (dan analog untuk footer). Di pemanggil: `<form id={formId}>` + `<Button type="submit" form={formId}>`.
- **Wajib** mencatat revisi kontrak `§1.E.2` di Bagian 1 sebelum eksekusi (perubahan signature bersifat aditif & backward-compatible).
- Alternatif yang **tidak** diizinkan: memindahkan `footer` ke dalam `SheetBody` (melanggar §1.C.1 — footer wajib sticky di luar scroll).
- Hasil akhir: **nol** string `id="*-dialog-form"` dan **nol** `form="*-dialog-form"` literal di repo.

**R2 — [BLOCKER] Satu sumber markup form (A2)**
- File: `student-detail-client.tsx` (`:657-758`, `:761-845`, `:848-1013`).
- Ekstrak markup `<form>` menjadi **satu variabel JSX** (bukan blok inline di dalam `children`) dan dokumentasikan di `form-bottom-sheet.tsx` bahwa `children` **wajib** berupa *factory* bila memuat `id` (lihat R1), sehingga tidak ada dua `<form>` dengan `id` identik di DOM.

**R3 — [MAYOR] `autoFocus` field pertama (§1.C.4)**
- `student-detail-client.tsx:708` (`<select id={verifyDecisionId}>`), `:811` (`placeClassId`), `:892` (`<Input id={editFullNameId}>`); `students-workspace-client.tsx:577` (`quickPlaceClassId`).
- Aman untuk dua wadah: elemen di wadah `display:none` **tidak** mencuri fokus. Tanpa `scrollIntoView` manual.

**R4 — [MAYOR] Scroll area & shrink (§1.C.1)**
- `sheet.tsx:132` → `cn("flex-1 overflow-y-auto overscroll-contain p-6", className)`.
- `sheet.tsx:94-97` (`SheetHeader`) → tambah `shrink-0`; `sheet.tsx:153` (`SheetFooter`) → tambah `shrink-0`.
- Catatan: `shrink-0` pada footer left/right tidak mengubah visual (parent hanya `flex flex-col` dengan satu anak flex-grow).

**R5 — [MAYOR] CTA `fullWidth` varian bottom (§1.C.2)**
- Terapkan lewat render-function footer (R1): CTA varian Sheet `fullWidth`, CTA varian Dialog tanpa `fullWidth` (desktop tetap rapi). Prop `fullWidth` sudah ada di `ui/button.tsx:48` — **jangan** ubah `button.tsx`.

**R6 — [MINOR/OPSIONAL, tidak memblokir] Nested `Dialog.Root`**
- Catat sebagai risiko a11y ter-*accept* (§3.g) atau buka backlog P3.

**R7 — [DOKUMENTASI] Koreksi Bagian 4 & `MIGRATION-STATE.md`**
- Bagian 4 wajib menyatakan `.agent/rules/executor-gemini.md` sebagai file di luar Bagian 2 (penyimpangan terdokumentasi).
- `PHASE-19-STEP2-P2` → ubah `DONE` menjadi `NEEDS REVISION` sampai R1–R5 selesai; baru kemudian `DONE`.

**R8 — [TEST] Perkuat guardrail (setelah R1–R5)**
- `layout-shell.test.ts:83-87`: ganti regex coarse dengan pembacaan blok bottom yang nyata, mis. ekstrak potongan string kelas bottom (`content.split('"')` → cari elemen yang memuat `inset-x-0` lalu assert `not.toContain("inset-y-0")` **dan** `not.toContain("h-full")`), plus `toContain("animate-sheet-bottom")` pada elemen yang sama.
- Tambah assert: (a) `expect(detail).not.toMatch(/\bid="[a-z]+-dialog-form"/)`; (b) `expect(detail).toContain("autoFocus")`; (c) `expect(sheet).toContain("overscroll-contain")`; (d) `expect(sheet).toContain("shrink-0")`.

---

### Keputusan (Audit #1 — diarsipkan)

**STATUS saat itu: NEEDS REVISION** — telah dituntaskan pada Audit #2 (§5.0); lihat `STATUS: APPROVED` di kepala Bagian 5.

- **R1 & R2 = blocker fungsional** (submit CTA menargetkan `<form>` dengan `id` duplikat → berisiko lolos ke varian non-aktif) sekaligus pelanggaran eksplisit §1.A2/§1.A5/§1.C.6.
- **R3–R5 = kepatuhan kontrak tertulis** §1.C.1/§1.C.2/§1.C.4 (missing `overscroll-contain`/`shrink-0`, missing `autoFocus`, missing `fullWidth`).
- **R7–R8 = dokumentasi & penguatan guardrail** (regex `:83` terbukti vakum).
- Fondasi `sheet.tsx` (C1), `themes.css` (C4), `useId` field, guardrail P1, dan isolasi file **sudah benar** — tidak perlu dikerjakan ulang.
- Perbaikan **tetap di 8 file Bagian 2**; `dialog.tsx`/C5/C7 tetap steril. Setelah R1–R5 + R8 diterapkan, ajukan audit ulang → target `APPROVED`.

</details>

---

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

