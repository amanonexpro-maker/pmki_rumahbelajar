# Feature Architecture Guide (`apps/web/src/features`)

Panduan arsitektur internal untuk membangun dan memelihara modul fitur di `apps/web/src/features/*` berdasarkan standar hasil refactoring pada `features/media`, `features/governance`, `features/publishing`, `features/public`, dan `features/attendance`.

---

## 1. Overview

Setiap modul fitur mengikuti arsitektur **Domain-Driven Modular Monolith** dengan pemisahan tanggung jawab yang tegas di lapisan client:

1. **Orchestrator Parent (`*-workspace-client.tsx`)**: Hanya mengelola koordinasi state halaman, kontrol buka/tutup dialog, feedback banner, dan delegasi aksi ke hooks/child components.
2. **Custom Hooks (`hooks/`)**: Mengenkapsulasi stateful business logic (upload 3 langkah, antrean sinkronisasi offline, navigasi serial keyboard, optimistik UI, abort/unmount cleanup) agar mudah diuji secara terisolasi.
3. **Validators (`validators/`)**: Sumber tunggal skema Zod untuk batas API server dan form client (`react-hook-form` + `zodResolver`).
4. **Shared Compositions (`src/components/compositions/`)**: Komponen UI generik yang digunakan lintas fitur seperti `SharedWorkspaceFilters`, `GenericSearchInput`, `GenericFilterSelect`, `EmptyState`, dan `StatusBadge`.
5. **Pure Utilities (`utils/`)**: Fungsi murni tanpa efek samping untuk transformasi data (misalnya `buildReportStages`, `buildPublicationStages`, atau helper penyimpanan draf lokal).

**Manfaat Utama**:
- **Separation of Concerns**: Komponen UI tetap tipis dan mudah dibaca, sementara logika jaringan/offline terisolasi di hooks.
- **Testability**: Hook bisnis dapat diuji langsung dengan Vitest (`use-media-upload.test.ts`, `use-attendance-sync.test.ts`, `use-attendance-session.test.ts`) tanpa me-render pohon komponen penuh.
- **Consistency**: Filter pencarian, debounce 300ms, form validation, dan dialog mengikuti pola seragam di seluruh aplikasi.

---

## 2. Folder Structure Template

Referensi standar (*Gold Standard*): `apps/web/src/features/media/` (ditambah `utils/` seperti pada `features/governance` & `features/publishing`).

```text
apps/web/src/features/<domain>/
├── index.ts                          # Public API lintas domain (satu-satunya entry point eksternal)
├── actions/
│   └── <domain>-actions.ts           # Thin Next.js Server Actions (Zod + Authz + Service)
├── components/
│   ├── <domain>-workspace-client.tsx # Parent Orchestrator (< 300 baris)
│   ├── <domain>-filter-bar.tsx       # Wrapper SharedWorkspaceFilters + opsi domain
│   ├── <domain>-card.tsx             # Item list / kartu presentasional
│   ├── <domain>-card-parts.tsx       # Sub-komponen internal kartu (jika kartu > 150 baris)
│   ├── <domain>-create-dialog.tsx    # Dialog form (react-hook-form + zodResolver)
│   └── <domain>-review-dialog.tsx    # Dialog tinjauan/transisi (react-hook-form + zodResolver)
├── hooks/
│   ├── use-<domain>-<flow>.ts        # Custom hook logika bisnis / offline / network
│   └── use-<domain>-<flow>.test.ts   # Unit test Vitest untuk hook kritis
├── permissions/
│   └── <domain>-policy.ts            # Policy & scope checks domain
├── queries/
│   └── <domain>-queries.ts           # Read-model queries untuk Server Components
├── repositories/
│   └── <domain>-repository.ts        # Drizzle persistence & transaksi DB
├── services/
│   └── <domain>-service.ts           # Aturan bisnis & orkestrasi server
├── types/
│   └── <domain>-types.ts             # DTO & label domain
├── utils/
│   └── <domain>-utils.ts             # Pure functions (stage mapper, formatter, dll.)
└── validators/
    └── <domain>-validator.ts         # Zod schemas (server payload & client form schemas)
```

---

## 3. Step-by-Step Recipe (Membuat Fitur Workspace Baru)

### Langkah 1: Definisikan Types & Validators (Zod)
Buat DTO di `types/<domain>-types.ts` dan skema Zod di `validators/<domain>-validator.ts`. Turunkan skema form UI dari skema server (`.pick()` / `.omit()`) agar validasi client dan server selalu selaras.

```ts
// apps/web/src/features/example/validators/example-validator.ts
import { z } from "zod";

export const EXAMPLE_CATEGORY_VALUES = ["UMUM", "KHUSUS"] as const;

export const createExampleSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(160),
  category: z.enum(EXAMPLE_CATEGORY_VALUES),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const createExampleFormSchema = createExampleSchema.pick({
  title: true,
  category: true,
  notes: true,
});

export type CreateExampleFormValues = z.infer<typeof createExampleFormSchema>;
```

### Langkah 2: Buat Custom Hook untuk Logika Bisnis
Jika fitur memiliki alur jaringan multi-langkah, sinkronisasi offline, atau shortcut keyboard, pindahkan ke `hooks/use-<domain>-<flow>.ts`. Pastikan ada cleanup `AbortController` / `isMountedRef` bila melakukan operasi async.

```ts
// apps/web/src/features/example/hooks/use-example-submit.ts
"use client";

import * as React from "react";
import { useTierCGuard } from "@/hooks/use-tier-c-guard";

export function useExampleSubmit(onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const { withTierCGuard } = useTierCGuard("Publikasi", (msg) =>
    setSubmitError(msg)
  );

  const submit = React.useCallback(
    async (payload: { title: string }) => {
      if (isSubmitting) return false;
      const ok = await withTierCGuard(async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
          // Panggil Server Action di sini
          void payload;
          onSuccess();
          return true;
        } finally {
          setIsSubmitting(false);
        }
      });
      return Boolean(ok);
    },
    [isSubmitting, onSuccess, withTierCGuard]
  );

  return { submit, isSubmitting, submitError };
}
```

### Langkah 3: Buat Komponen UI (Filter, Card, Dialog)
1. **Filter Bar**: Gunakan `SharedWorkspaceFilters` dari `@/components/compositions` (sudah mencakup debounce 300ms dan `GenericFilterSelect`).
2. **Card**: Buat komponen kartu presentasional murni (`*-card.tsx`); pecah ke `*-card-parts.tsx` jika melebihi 150 baris.
3. **Dialog**: Gunakan `react-hook-form` + `zodResolver`.

```tsx
// apps/web/src/features/example/components/example-filter-bar.tsx
"use client";

import * as React from "react";
import {
  SharedWorkspaceFilters,
  type WorkspaceFilterConfig,
} from "@/components/compositions";
import type { QueryParamUpdates } from "@/hooks/use-url-query-params";

export interface ExampleFilterBarProps {
  initialSearch: string;
  initialCategory: string;
  onUpdateQuery: (updates: QueryParamUpdates) => void;
  onResetAll: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "Semua kategori" },
  { value: "UMUM", label: "Umum" },
  { value: "KHUSUS", label: "Khusus" },
] as const;

export function ExampleFilterBar({
  initialSearch,
  initialCategory,
  onUpdateQuery,
  onResetAll,
}: ExampleFilterBarProps) {
  const handleSearchChange = React.useCallback(
    (search: string | null) => onUpdateQuery({ search }),
    [onUpdateQuery]
  );

  const filters: WorkspaceFilterConfig[] = [
    {
      key: "category",
      label: "Filter kategori",
      value: initialCategory,
      options: CATEGORY_OPTIONS,
      onChange: (value) => onUpdateQuery({ category: value }),
    },
  ];

  return (
    <SharedWorkspaceFilters
      initialSearch={initialSearch}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Cari judul..."
      filters={filters}
      onResetAll={onResetAll}
    />
  );
}
```

### Langkah 4: Rakit di Parent Orchestrator
Parent orchestrator hanya menyambungkan `useUrlQueryParams`, dialog open/close state, feedback banner, dan merender child components.

```tsx
// apps/web/src/features/example/components/example-workspace-client.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/patterns";
import { useUrlQueryParams } from "@/hooks/use-url-query-params";
import { ExampleFilterBar } from "./example-filter-bar";

export function ExampleWorkspaceClient({
  initialSearch,
  initialCategory,
}: {
  initialSearch: string;
  initialCategory: string;
}) {
  const { updateQuery, pathname, router } = useUrlQueryParams();

  const handleResetFilters = React.useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  return (
    <div className="space-y-6">
      <PageHeader title="Contoh Modul" description="Deskripsi singkat modul." />
      <ExampleFilterBar
        initialSearch={initialSearch}
        initialCategory={initialCategory}
        onUpdateQuery={updateQuery}
        onResetAll={handleResetFilters}
      />
    </div>
  );
}
```

---

## 4. Best Practices Checklist

- [ ] **Forms**: Wajib gunakan `react-hook-form` + `zodResolver` (hindari `useState` manual per field). Gunakan `Controller` untuk input non-standar (`File`, `DatePicker`, atau `<select>` boolean).
- [ ] **Parent Orchestrator**: Jaga `*-workspace-client.tsx` tetap **< 300 baris** (hanya koordinasi state UI, feedback, dan delegasi ke hooks/children).
- [ ] **Callbacks Stabil**: Bungkus handler yang diteruskan ke list atau custom hooks dengan `React.useCallback` (mis. `handleRefresh`, `handleResetFilters`).
- [ ] **Shared Search & Filter UI**: Gunakan `SharedWorkspaceFilters` / `GenericSearchInput` / `GenericFilterSelect` dari `@/components/compositions` (jangan duplikasi `SearchToolbar` + `useEffect` debounce 300ms).
- [ ] **Pure Utils**: Pindahkan transformasi data (`build*Stages`, mapper riwayat keputusan, helper `localStorage`) ke `utils/<domain>-utils.ts`.
- [ ] **React 19 Effect Hygiene**: Hindari memanggil `setState` secara sinkron di dalam `useEffect`; gunakan lazy initializer `useState(() => ...)` atau mount inner form component saat dialog `open === true`.
- [ ] **Hook Unit Tests**: Tambahkan `*.test.ts` untuk setiap hook bisnis/offline kritis (`use-media-upload.test.ts`, `use-attendance-sync.test.ts`, `use-attendance-session.test.ts`).
- [ ] **Strict TypeScript**: Dilarang menggunakan `any`; validasi akhir wajib lolos `npm run typecheck`, `npm run lint`, dan `npm test`.

