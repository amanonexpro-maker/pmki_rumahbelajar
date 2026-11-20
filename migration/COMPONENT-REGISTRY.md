# COMPONENT-REGISTRY — Daftar Komponen Resmi PMKI (`apps/web/`)

**Referensi Otoritas:** `docs/07-COMPONENT-ARCHITECTURE.md` & `docs/03-DESIGN-IDENTITY-SYSTEM.md`  
**Aturan Wajib:** Sebelum membuat komponen baru, periksa registry ini dan loloskan 5 gate (`07 §28`). DILARANG membuat duplikat `Button`, `Dialog`, `Badge`, atau `DataTable` milik feature.

---

## Layer 1 — UI Primitives (`apps/web/src/components/ui/`)

Seluruh primitives di-re-theme penuh menggunakan **Semantic & Component Tokens** (`--primary`, `--surface`, `--surface-subtle`, `--border`, `--ring`, `--radius-control`, `--radius-card`, `--shadow-overlay`), mendukung **dark mode**, **visible focus (`focus-ring`)**, **keyboard navigation**, dan **touch target >= 44px** pada mobile.

| Komponen | File | Basis / Aksesibilitas | Status |
| :--- | :--- | :--- | :---: |
| `Avatar` | `src/components/ui/avatar.tsx` | Initials fallback + `consentGranted` guard untuk privasi foto anak | `AKTIF` |
| `Badge` | `src/components/ui/badge.tsx` | 9 semantic variants (`neutral`, `primary`, `success`, `warning`, `danger`, `info`, `learning`, `activity`, `confidential`), `dot` & `icon` | `AKTIF` |
| `Button` | `src/components/ui/button.tsx` | `cva` + `@radix-ui/react-slot`; 6 variants (`primary`, `secondary`, `soft`, `ghost`, `destructive`, `link`), `loading` (`aria-busy`), tactile press | `AKTIF` |
| `Checkbox` | `src/components/ui/checkbox.tsx` | `@radix-ui/react-checkbox`; optional `label` & `description`, `min-h-11` | `AKTIF` |
| `Command` | `src/components/ui/command.tsx` | `cmdk`; keyboard-accessible search & selection list | `AKTIF` |
| `Dialog` | `src/components/ui/dialog.tsx` | `@radix-ui/react-dialog`; focus trap, Escape dismiss, `animate-dialog`, close label `"Tutup dialog"` | `AKTIF` |
| `DropdownMenu` | `src/components/ui/dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu`; arrow-key menu navigation, `animate-dropdown` | `AKTIF` |
| `Icon` | `src/components/ui/icon.tsx` | Lucide wrapper terstandar (`xs/sm/md/lg/xl`, `strokeWidth=1.75`, `aria-hidden` otomatis) | `AKTIF` |
| `Input` | `src/components/ui/input.tsx` | Label, hint, inline error (`role="alert"`, `aria-describedby`), `min-h-11 sm:min-h-10` | `AKTIF` |
| `Popover` | `src/components/ui/popover.tsx` | `@radix-ui/react-popover`; floating surface dengan `shadow-overlay` | `AKTIF` |
| `RadioGroup` | `src/components/ui/radio-group.tsx` | `@radix-ui/react-radio-group`; card-style touch-comfortable option (`min-h-11`) | `AKTIF` |
| `ScrollArea` | `src/components/ui/scroll-area.tsx` | `@radix-ui/react-scroll-area`; custom subtle scrollbar | `AKTIF` |
| `Select` | `src/components/ui/select.tsx` | `@radix-ui/react-select`; keyboard navigable, token-aware trigger & dropdown | `AKTIF` |
| `Sheet` | `src/components/ui/sheet.tsx` | `@radix-ui/react-dialog`; slide-over drawer (`left`/`right`), `animate-sheet-*`, close label `"Tutup panel"` | `AKTIF` |
| `Skeleton` | `src/components/ui/skeleton.tsx` | Structured loading placeholder (`text`, `circle`, `card`, `rect`) | `AKTIF` |
| `Switch` | `src/components/ui/switch.tsx` | `@radix-ui/react-switch`; accessible toggle | `AKTIF` |
| `Tabs` | `src/components/ui/tabs.tsx` | `@radix-ui/react-tabs`; quiet structural underline, `.no-scrollbar` overflow | `AKTIF` |
| `Textarea` | `src/components/ui/textarea.tsx` | Label, hint, inline error (`role="alert"`, `aria-describedby`) | `AKTIF` |
| `Tooltip` | `src/components/ui/tooltip.tsx` | `@radix-ui/react-tooltip`; accessible keyboard & hover hint | `AKTIF` |

---

## Layer 2 — Layout Shell (`apps/web/src/components/layout/`)

Mengikuti parity **UI-2** prototipe dengan navigasi App Router (`next/link`, `usePathname`) dan label kanonik `10 §5A` (Title Case).

| Komponen | File | Peran | Status |
| :--- | :--- | :--- | :---: |
| `AppShell` | `src/components/layout/app-shell.tsx` | Kerangka utama workspace (`Sidebar` + `WorkspaceHeader` + `MobileNavigation` + `PageContainer`) + `DEFAULT_WORKSPACE_NAV` | `AKTIF` |
| `Sidebar` / `SidebarNavigation` | `src/components/layout/sidebar.tsx` | Navigasi persistent desktop (`lg:w-64`), non-color active indicator, filter permission | `AKTIF` |
| `WorkspaceHeader` | `src/components/layout/workspace-header.tsx` | Header sticky `h-16`, trigger mobile drawer (`h-11 w-11`), konteks unit layanan, `ThemePicker`, profil user | `AKTIF` |
| `MobileNavigation` | `src/components/layout/mobile-navigation.tsx` | Drawer navigasi mobile/tablet (`Sheet` side `left`), touch-comfortable items (`min-h-11`) | `AKTIF` |
| `PageContainer` | `src/components/layout/page-container.tsx` | Width variants (`narrow`, `default`, `wide`, `public`, `full`) | `AKTIF` |
| `ThemeProvider` | `src/components/layout/theme-provider.tsx` | Context tema (`light`/`dark`/`system`), persistensi `localStorage` khusus theme (`pmki_theme`) | `AKTIF` |
| `ThemePicker` | `src/components/layout/theme-picker.tsx` | Pemilih tema aksesibel (`Terang`, `Gelap`, `Sistem`) | `AKTIF` |
| `PwaRegister` | `src/components/layout/pwa-register.tsx` | Registrasi Service Worker aman Turbopack + banner `"Perbarui sekarang / Nanti"` (`06 §21`) | `AKTIF` |
| `ConnectivityProvider` / `ConnectivityIndicator` | `src/hooks/use-connectivity.tsx` | Context konektivitas (`ONLINE`/`OFFLINE`/`RECONNECTING`/`SYNCING`) + indikator halus (`06 §16`) | `AKTIF` |

---

## Layer 3 — Compositions (`apps/web/src/components/compositions/`)

| Komponen | File | Peran | Status |
| :--- | :--- | :--- | :---: |
| `SearchInput` | `src/components/compositions/search-input.tsx` | Input pencarian dengan ikon & tombol bersihkan aksesibel | `AKTIF` |
| `StatusBadge` | `src/components/compositions/status-badge.tsx` | Badge status bertipe ketat terhubung eksklusif ke `src/lib/status` (tanpa string bebas) | `AKTIF` |
| `EmptyState` | `src/components/compositions/empty-state.tsx` | Empty state tenang & menjelaskan langkah berikutnya (`10 §16`) | `AKTIF` |
| `UserAvatar` | `src/components/compositions/user-avatar.tsx` | Avatar + nama + subjudul dengan guard `consentGranted` | `AKTIF` |

---

## Layer 4 — Patterns (`apps/web/src/components/patterns/`)

| Komponen | File | Peran | Status |
| :--- | :--- | :--- | :---: |
| `PageHeader` | `src/components/patterns/page-header.tsx` | Header halaman standar (eyebrow, judul, deskripsi, aksi utama/sekunder) | `AKTIF` |
| `EntityHeader` | `src/components/patterns/entity-header.tsx` | Header detail entitas (`Avatar`/ikon, metadata, tombol kembali & aksi) | `AKTIF` |
| `SearchToolbar` | `src/components/patterns/search-toolbar.tsx` | Toolbar pencarian + filter desktop inline / mobile `Sheet` + reset | `AKTIF` |
| `DataTable` | `src/components/patterns/data-table.tsx` | Desktop table (`>=768px`) + **wajib** mobile vertical list (`renderMobileRow`, `<768px`) | `AKTIF` |
| `DetailTabs` | `src/components/patterns/detail-tabs.tsx` | Tablist ARIA dengan navigasi panah kiri/kanan & indikator underline | `AKTIF` |
| `WorkflowProgress` | `src/components/patterns/workflow-progress.tsx` | Progres 4 tahap tata kelola (`grid-cols-1` di 375px → `lg:grid-cols-4`) + mode `compact` | `AKTIF` |
| `DecisionHistory` | `src/components/patterns/decision-history.tsx` | Riwayat keputusan tata kelola dengan aktor, peran, waktu, & catatan | `AKTIF` |
| `StatSummary` | `src/components/patterns/stat-summary.tsx` | Ringkasan metrik operasional tanpa nested card dengan border grid rapi | `AKTIF` |
| `FormSection` | `src/components/patterns/form-section.tsx` | Pengelompokan fieldset formulir berhirarki | `AKTIF` |
| `StepIndicator` | `src/components/patterns/step-indicator.tsx` | Indikator langkah formulir multi-step (scroll-safe di 375px) | `AKTIF` |
| `ReviewSection` | `src/components/patterns/review-section.tsx` | Ringkasan verifikasi sebelum kirim + tombol ubah per bagian | `AKTIF` |
| `SessionProgress` | `src/components/patterns/session-progress.tsx` | Progres presensi sesi (`Hadir`, `Izin`, `Sakit`, `Tidak hadir`) | `AKTIF` |

---

## Layer 5 — Feature Components (`apps/web/src/features/<domain>/components/`)

| Domain | Komponen | File | Peran | Status |
| :--- | :--- | :--- | :--- | :---: |
| `identity` | `LoginForm` | `src/features/identity/components/login-form.tsx` | Form masuk & pemulihan kata sandi Bahasa Indonesia (`10 §12–14`) | `AKTIF` |
| `identity` | `LogoutButton` | `src/features/identity/components/logout-button.tsx` | Tombol keluar sesi ruang kerja | `AKTIF` |
| `organization` | `ContextualDashboardView` | `src/features/organization/components/contextual-dashboard-view.tsx` | Contextual Dashboard (`UI-3`, `UI-UX §24`: Orientation → Ringkasan Operasional Strip → `Perlu perhatian` → `Jadwal belajar` → `Aktivitas terbaru`, tanpa 4 KPI cards + chart) | `AKTIF` |
| `students` | `PublicRegistrationWizard` | `src/features/students/components/public-registration-wizard.tsx` | Wizard pendaftaran 5 langkah (`UI-6`, RHF + Zod + IndexedDB draft recovery & offline queue) | `AKTIF` |
| `students` | `StudentsWorkspaceClient` | `src/features/students/components/students-workspace-client.tsx` | Daftar operasional Peserta Didik (`UI-4`, URL state `?search=&status=&year=&classId=&level=&page=`, recomposition mobile 375px) | `AKTIF` |
| `students` | `StudentDetailClient` | `src/features/students/components/student-detail-client.tsx` | Profil detail Peserta Didik (`UI-5`, `WorkflowProgress`, verifikasi, penempatan kelas, progressive disclosure data wali `CONFIDENTIAL`) | `AKTIF` |
| `attendance` | `AttendanceWorkspaceClient` | `src/features/attendance/components/attendance-workspace-client.tsx` | Modul Kehadiran (`UI-7`, `SessionProgress`, 4 tombol satu-tangan `Hadir`/`Izin`/`Sakit`/`Tidak hadir`, draft IndexedDB & antrean sync Tier A) | `AKTIF` |
| `development` | `DevelopmentWorkspaceClient` | `src/features/development/components/development-workspace-client.tsx` | Modul Perkembangan Peserta (`UI-7`, catatan berversi `v1..vN`, `confidential=true` default, draft IndexedDB & antrean sync Tier A) | `AKTIF` |
| `consent` | `ConsentWorkspaceClient` | `src/features/consent/components/consent-workspace-client.tsx` | Modul Persetujuan (`UI-8`, pemisahan Persetujuan Data vs Persetujuan Foto & Video, `Cabut persetujuan`, Tier C online-only) | `AKTIF` |
| `media` | `MediaWorkspaceClient` | `src/features/media/components/media-workspace-client.tsx` | Modul Dokumentasi (`UI-8`, upload 3 langkah ke bucket privat `media` via signed upload URL, `Tinjau dokumentasi` dengan SoD pengunggah ≠ peninjau) | `AKTIF` |
| `publishing` | `PublishingWorkspaceClient` | `src/features/publishing/components/publishing-workspace-client.tsx` | Modul Publikasi (`UI-8`, `WorkflowProgress` 4 tahap, `Terbitkan konten` dengan SoD penulis ≠ penerbit, Tier C online-only) | `AKTIF` |
| `governance` | `GovernanceWorkspaceClient` | `src/features/governance/components/governance-workspace-client.tsx` | Modul Laporan (`UI-8`, `WorkflowProgress` + `DecisionHistory` append-only, SoD penyusun ≠ penyetuju, Tier C online-only) | `AKTIF` |
| `audit` | `AuditWorkspaceClient` | `src/features/audit/components/audit-workspace-client.tsx` | Modul Jejak Audit (`UI-9`, baca-saja append-only, filter pelaku/aksi/entitas, detail `Riwayat Audit`, JetBrains Mono ID) | `AKTIF` |
| `administration` | `AdministrationWorkspaceClient` | `src/features/administration/components/administration-workspace-client.tsx` | Modul Administrasi 5 Tab (`UI-9`: Pengguna + Provisioning Admin API, Peran Kustom tanpa coding, Hak Akses, Override Akses, Penetapan Lingkup, + dev-only Lingkungan Uji Coba) | `AKTIF` |
| `public` | `PublicNavbar` | `src/features/public/components/public-navbar.tsx` | Navigasi publik (`UI-12`, Title Case `10 §5A`, mobile drawer touch target `>= 44px`, `ThemePicker`, tautan sekunder `Portal Pengurus`) | `AKTIF` |
| `public` | `PublicHero` | `src/features/public/components/public-hero.tsx` | Stop-scrolling Moment 1 (`UI-12`, ritme `96px`, tipografi `Newsreader`, rasio `70/20/10`, `next/image` priority, CTA `Daftar peserta didik baru`) | `AKTIF` |
| `public` | `PublicMissionSection` | `src/features/public/components/public-mission-section.tsx` | Stop-scrolling Moment 2 (`UI-12`, ritme `80px`, tipografi `Newsreader`, visi Happy Learning & komitmen inklusif) | `AKTIF` |
| `public` | `PublicProgramsSection` | `src/features/public/components/public-programs-section.tsx` | Program Pembelajaran & Jadwal Sabtu 15.00–17.15 WIB di RAAL Griya Asih Lawang (`UI-12`, ritme `64px`) | `AKTIF` |
| `public` | `PublicCommunityStorySection` | `src/features/public/components/public-community-story-section.tsx` | Stop-scrolling Moment 3 (`UI-12`, ritme `96px`: Kisah Kalirejo–Lawang, 13 `Pengajar Relawan`, Galeri `Dokumentasi` ber-consent + signed URL, `Publikasi` tayang) | `AKTIF` |
| `public` | `PublicRegistrationCtaSection` | `src/features/public/components/public-registration-cta-section.tsx` | Stop-scrolling Moment 4 (`UI-12`, ritme `80px`: CTA pendaftaran + `PublicRegistrationWizard` + Kontak WhatsApp pengurus) | `AKTIF` |
| `public` | `PublicFooter` | `src/features/public/components/public-footer.tsx` | Footer institusional publik (`UI-12`, identitas PMKI Mupel Jatim, jadwal Sabtu, kontak WA, jaminan privasi peserta didik) | `AKTIF` |






