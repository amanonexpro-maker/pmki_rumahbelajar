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
  /** Satu sumber markup form; dirender di dalam DUA wadah. */
  children: React.ReactNode;
  /** Footer (Batal + submit); opsional. */
  footer?: React.ReactNode;
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
- `apps/web/src/components/ui/sheet.tsx` : memperluas union `SheetSide` menjadi `"left" | "right" | "bottom"` dengan default tetap `"right"`. Memisahkan kelas wadah cabang bottom (`fixed inset-x-0 bottom-0 max-h-[90dvh] w-full border-t rounded-t-card flex flex-col animate-sheet-bottom`) tanpa kelas `inset-y-0` (Task 2). Menambahkan grabber dekoratif (`mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-pill bg-border-strong`) khusus untuk `side === "bottom"` (Task 3). Menambahkan prop `insetBottom?: boolean` (default `true`) di `SheetContentProps` dan mengintegrasikan prop `safeArea?: boolean` pada `SheetFooter` via context/prop untuk menerapkan padding safe-area `pb-[max(env(safe-area-inset-bottom,0px),16px)]` khusus varian bottom (Task 4).
- `apps/web/src/components/patterns/form-bottom-sheet.tsx` : membuat komponen baru `FormBottomSheet` (`"use client"`) yang merender dua wadah presentational: desktop `<DialogContent className="hidden md:block">` dan mobile `<SheetContent side="bottom" className="md:hidden">` menggunakan satu sumber `children` form tanpa duplikasi logika/state dan tanpa impor `lucide-react` (Task 5).
- `apps/web/src/components/patterns/index.ts` : mengekspor `form-bottom-sheet` secara alfabetis (Task 6).
- `apps/web/src/features/students/components/student-detail-client.tsx` : memigrasikan 3 dialog form (Verifikasi pendaftaran, Tempatkan ke kelas, Ubah profil) ke `FormBottomSheet`. Seluruh input form dihubungkan dengan id dinamis via `React.useId()` untuk mencegah bentrok DOM multi-wadah (C8/A5). Nilai state, handler, DTO, dan pesan error 100% utuh tanpa perubahan (A3/C6/C7) (Task 7).
- `apps/web/src/features/students/components/students-workspace-client.tsx` : memigrasikan 2 dialog (Tambah peserta didik dengan `bodyClassName="p-0"` & `dialogClassName="max-w-2xl"`; Tempatkan cepat ke kelas) ke `FormBottomSheet` dengan prefix id dinamis `React.useId()` (Task 8).
- `apps/web/src/components/layout/layout-shell.test.ts` : memperluas guardrail test menjadi 11 test (6 assert P1 + 5 assert baru P2: `side="left"` di `mobile-navigation.tsx`, default `side="right"` dan `max-h-[90dvh]` tanpa `inset-y-0` di `sheet.tsx`, `animate-sheet-bottom` di `themes.css`, `md:hidden` + `hidden md:block` tanpa `lucide-react` di `form-bottom-sheet.tsx`, dan kedua file students memakai `FormBottomSheet`) (Task 9).
- `migration/MIGRATION-STATE.md` : mencatat entri `PHASE-19-STEP2-P2` (`DONE`) (Task 11).

**Hasil Verifikasi (Task 1–11):**
1. `npm run typecheck` : 0 error (exit 0).
2. `npx eslint src/components/ui src/components/patterns src/features/students/components src/components/layout` : 0 error / warning (exit 0).
3. Vitest suites:
   - `src/components/layout/layout-shell.test.ts` : 11 passed (100%).
   - `src/components/ui/ui-primitives.test.ts` : 2 passed (100%).
   - `src/features/students/students.test.ts` : 5 passed (100%).
   - `src/components/patterns/patterns-and-pwa.test.ts` : 2 passed (audit token semantik & mobile recomposition tabel lulus; 1 kegagalan manifest `background_color` `#1F6650` vs `#F7F8F4` adalah pra-eksisting baseline).
4. `npm run build` : sukses (exit 0), 31 static pages generated, rute `/workspace*` dan `/api/sync` tetap `ƒ` (Dynamic), rute publik tetap `◐` (ISR 1h / PPR).

**Bukti Isolasi (git status --porcelain):**
```
 M apps/web/TASK.md
 M apps/web/src/components/layout/layout-shell.test.ts
 M apps/web/src/components/patterns/index.ts
 M apps/web/src/components/ui/sheet.tsx
 M apps/web/src/features/students/components/student-detail-client.tsx
 M apps/web/src/features/students/components/students-workspace-client.tsx
 M apps/web/src/styles/themes.css
 M migration/MIGRATION-STATE.md
?? apps/web/src/components/patterns/form-bottom-sheet.tsx
```
*Tepat 9 file Bagian 2 (+ .agent/rules lokal bila ada). Nol file C5/C7/DB/Auth/Seed/SoD yang disentuh.*

---

## 5. Catatan Review & Audit (Diisi oleh Gemini Pro)

**STATUS: PENDING**

Menunggu Log Perubahan (Bagian 4). Fokus audit saat review P2:

1. **C1** — diff `sheet.tsx` hanya aditif: kelas `left`/`right` identik, default `side = "right"`, cabang `bottom` bebas `inset-y-0`/`h-full`.
2. **A2/A5** — `form-bottom-sheet.tsx` benar-benar satu sumber `children`; tidak ada duplikasi markup form di file students; id field memakai `useId`/tanpa id statis ganda.
3. **A3/C6/C7** — nol perubahan nilai, DTO, validasi, copy/label, action/service/validator students; `students.test.ts` lulus tanpa diubah.
4. **C3/C4** — `dialog.tsx` tidak diubah; `themes.css` hanya +1 keyframe & +1 kelas; tidak ada `@media` baru.
5. **Guardrail** — 6 assert P1 masih ada di `layout-shell.test.ts` dan hijau; assert baru P2 sesuai Task 9.
6. **Isolasi** — `git status --porcelain` = 9 file Bagian 2 (+ `.clinerules`); nol file C5/C7.

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

