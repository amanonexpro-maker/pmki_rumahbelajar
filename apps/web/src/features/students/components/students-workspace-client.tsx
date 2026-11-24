"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Plus, UserCheck, Users } from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/compositions";
import {
  DataTable,
  FormBottomSheet,
  MobileCardList,
  PageHeader,
  SearchToolbar,
  type DataTableColumn,
} from "@/components/patterns";
import {
  Badge,
  Button,
  Icon,
} from "@/components/ui";
import type { AcademicYearDTO, ClassSummaryDTO } from "@/features/academic";
import { REGISTRATION_STATUS_META, type RegistrationStatus } from "@/lib/status";
import { placeStudentInClassAction } from "../actions/student-actions";
import type {
  StudentListItemDTO,
  StudentListResultDTO,
} from "../types/student-types";
import { PublicRegistrationWizard } from "./public-registration-wizard";

export interface StudentsWorkspaceClientProps {
  listResult: StudentListResultDTO;
  classes: ClassSummaryDTO[];
  academicYears: AcademicYearDTO[];
  initialFilters: {
    search: string;
    status: string;
    academicYearId: string;
    classId: string;
    educationLevel: string;
    page: number;
  };
  canCreateStudent: boolean;
  canVerifyStudent: boolean;
}

const STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Semua status" },
  { value: "SUBMITTED", label: REGISTRATION_STATUS_META.SUBMITTED.label },
  {
    value: "PENDING_VERIFICATION",
    label: REGISTRATION_STATUS_META.PENDING_VERIFICATION.label,
  },
  { value: "VERIFIED", label: REGISTRATION_STATUS_META.VERIFIED.label },
  {
    value: "CLASS_PLACEMENT",
    label: REGISTRATION_STATUS_META.CLASS_PLACEMENT.label,
  },
  { value: "ACTIVE", label: REGISTRATION_STATUS_META.ACTIVE.label },
  { value: "WAITLIST", label: REGISTRATION_STATUS_META.WAITLIST.label },
  { value: "REJECTED", label: REGISTRATION_STATUS_META.REJECTED.label },
  { value: "CANCELLED", label: REGISTRATION_STATUS_META.CANCELLED.label },
];

const LEVEL_FILTER_OPTIONS = [
  { value: "ALL", label: "Semua jenjang" },
  { value: "TK", label: "TK (A & B)" },
  { value: "SD_ALL", label: "Semua SD (Kelas 1–6)" },
  { value: "SMP_ALL", label: "Semua SMP (Kelas 7–8)" },
];

export function StudentsWorkspaceClient({
  listResult,
  classes,
  academicYears,
  initialFilters,
  canCreateStudent,
  canVerifyStudent,
}: StudentsWorkspaceClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = React.useState(initialFilters.search);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [quickPlaceStudent, setQuickPlaceStudent] =
    React.useState<StudentListItemDTO | null>(null);
  const [selectedClassId, setSelectedClassId] = React.useState(
    classes.find((c) => !c.isFull)?.id ?? classes[0]?.id ?? ""
  );
  const [placePending, setPlacePending] = React.useState(false);
  const [placeError, setPlaceError] = React.useState<string | null>(null);
  const quickPlaceClassId = React.useId();

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [key, val] of Object.entries(updates)) {
        if (!val || val === "ALL" || (key === "page" && val === "1")) {
          next.delete(key);
        } else {
          next.set(key, val);
        }
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  // Sync debounced search input to URL `?search=`
  React.useEffect(() => {
    if (searchInput === initialFilters.search) return;
    const timer = window.setTimeout(() => {
      updateUrlParams({ search: searchInput.trim() || null, page: "1" });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, initialFilters.search, updateUrlParams]);

  function handleResetFilters() {
    setSearchInput("");
    router.push(pathname);
  }

  async function handleConfirmQuickPlacement() {
    if (!quickPlaceStudent || !selectedClassId) return;
    setPlacePending(true);
    setPlaceError(null);
    try {
      const res = await placeStudentInClassAction({
        studentId: quickPlaceStudent.id,
        classId: selectedClassId,
      });
      if (!res.success) {
        setPlaceError(res.error.message);
        return;
      }
      setQuickPlaceStudent(null);
      router.refresh();
    } finally {
      setPlacePending(false);
    }
  }

  const activeFilterCount = [
    initialFilters.status !== "ALL",
    initialFilters.academicYearId !== "ALL",
    initialFilters.classId !== "ALL",
    initialFilters.educationLevel !== "ALL",
  ].filter(Boolean).length;

  const filterSelectControls = (
    <>
      <select
        aria-label="Filter status pendaftaran"
        value={initialFilters.status}
        onChange={(e) =>
          updateUrlParams({ status: e.target.value, page: "1" })
        }
        className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
      >
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter kelas"
        value={initialFilters.classId}
        onChange={(e) =>
          updateUrlParams({ classId: e.target.value, page: "1" })
        }
        className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
      >
        <option value="ALL">Semua kelas</option>
        <option value="UNASSIGNED">Belum ditempatkan</option>
        {classes.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.name} ({cls.enrolledCount}/{cls.capacity})
          </option>
        ))}
      </select>

      <select
        aria-label="Filter jenjang pendidikan"
        value={initialFilters.educationLevel}
        onChange={(e) =>
          updateUrlParams({ level: e.target.value, page: "1" })
        }
        className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
      >
        {LEVEL_FILTER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter tahun ajaran"
        value={initialFilters.academicYearId}
        onChange={(e) =>
          updateUrlParams({ year: e.target.value, page: "1" })
        }
        className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
      >
        <option value="ALL">Semua tahun ajaran</option>
        {academicYears.map((ay) => (
          <option key={ay.id} value={ay.id}>
            TA {ay.name}
            {ay.active ? " (Aktif)" : ""}
          </option>
        ))}
      </select>
    </>
  );

  const columns: DataTableColumn<StudentListItemDTO>[] = [
    {
      id: "participant",
      header: "Peserta didik",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Link
              href={`/workspace/students/${row.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-foreground hover:text-primary focus-ring rounded-xs"
            >
              {row.fullName}
            </Link>
            {row.isRaalResident && (
              <Badge variant="info" size="sm">
                RAAL
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {row.registrationNumber} · Panggilan: {row.nickname}
          </p>
        </div>
      ),
    },
    {
      id: "education",
      header: "Jenjang & wilayah",
      cell: (row) => (
        <div className="space-y-0.5 text-xs">
          <p className="font-medium text-foreground">
            {row.educationLevelLabel}
          </p>
          <p className="text-muted-foreground">
            {row.district ? `Kel. ${row.district}` : "Lawang"}
          </p>
        </div>
      ),
    },
    {
      id: "class",
      header: "Kelas",
      cell: (row) =>
        row.assignedClassName ? (
          <span className="text-xs font-medium text-foreground">
            {row.assignedClassName}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Belum ditempatkan
          </span>
        ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          domain="registration"
          status={row.registrationStatus as RegistrationStatus}
        />
      ),
    },
    {
      id: "actions",
      header: "Tindakan",
      align: "right",
      cell: (row) => (
        <div
          className="flex items-center justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {canVerifyStudent &&
            (row.registrationStatus === "VERIFIED" ||
              row.registrationStatus === "CLASS_PLACEMENT" ||
              row.registrationStatus === "WAITLIST") &&
            !row.assignedClassId && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuickPlaceStudent(row);
                  setPlaceError(null);
                }}
              >
                Tempatkan ke kelas
              </Button>
            )}
          <Button asChild variant="ghost" size="sm">
            <Link
              href={`/workspace/students/${row.id}`}
              aria-label={`Buka profil peserta didik ${row.fullName}`}
            >
              <span>Buka profil</span>
              <Icon icon={ChevronRight} size="xs" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Page Header (Title Case for Page Title, Sentence case for CTA button) */}
      <PageHeader
        title="Peserta Didik"
        description="Kelola pendaftaran, verifikasi kelayakan, dan penempatan kelas peserta didik Rumah Belajar."
        primaryAction={
          canCreateStudent ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => setAddDialogOpen(true)}
              leftIcon={<Icon icon={Plus} size="sm" />}
            >
              Tambah peserta didik
            </Button>
          ) : undefined
        }
      />

      {/* 2. Search -> 3. Filters -> 4. Result Summary */}
      <SearchToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Cari peserta didik..."
        filterCount={activeFilterCount}
        desktopFilters={filterSelectControls}
        mobileFilterContent={
          <div className="flex flex-col gap-3">{filterSelectControls}</div>
        }
        onResetAll={handleResetFilters}
        resultSummary={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>
              Menampilkan{" "}
              <strong className="text-foreground">
                {listResult.totalCount}
              </strong>{" "}
              peserta didik
            </span>
            {listResult.pendingVerificationCount > 0 && (
              <span className="text-warning-foreground font-medium">
                · {listResult.pendingVerificationCount} menunggu verifikasi
              </span>
            )}
            {listResult.awaitingPlacementCount > 0 && (
              <span className="text-primary font-medium">
                · {listResult.awaitingPlacementCount} siap ditempatkan ke kelas
              </span>
            )}
          </div>
        }
      />

      {/* 5. Data View (Desktop Table / Mobile Recomposition Cards at 375px) */}
      <DataTable
        columns={columns}
        data={listResult.items}
        getRowKey={(row) => row.id}
        caption="Daftar peserta didik Rumah Belajar"
        onRowClick={(row) => router.push(`/workspace/students/${row.id}`)}
        renderMobileRow={(row) => (
          <MobileCardList
            title={row.fullName}
            badge={
              <StatusBadge
                domain="registration"
                status={row.registrationStatus}
              />
            }
            primaryMeta={
              <>
                <span className="font-medium text-foreground">
                  {row.assignedClassName ?? "Belum ditempatkan"}
                </span>{" "}
                · {row.educationLevelLabel}
              </>
            }
            action={
              canVerifyStudent &&
              (row.registrationStatus === "VERIFIED" ||
                row.registrationStatus === "WAITLIST") &&
              !row.assignedClassId ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuickPlaceStudent(row);
                    setPlaceError(null);
                  }}
                  className="min-h-10 text-xs"
                >
                  Tempatkan ke kelas
                </Button>
              ) : (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="min-h-10 text-xs text-secondary-foreground hover:text-foreground"
                >
                  <Link
                    href={`/workspace/students/${row.id}`}
                    aria-label={`Buka profil peserta didik ${row.fullName}`}
                  >
                    Buka profil →
                  </Link>
                </Button>
              )
            }
          />
        )}
        emptyState={
          <EmptyState
            icon={Users}
            title="Belum ada peserta didik."
            description={
              searchInput || activeFilterCount > 0
                ? "Tidak ada peserta didik yang cocok dengan pencarian atau filter yang dipilih."
                : "Daftar peserta didik masih kosong untuk cakupan unit layanan ini."
            }
            action={
              searchInput || activeFilterCount > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResetFilters}
                >
                  Atur ulang filter
                </Button>
              ) : canCreateStudent ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setAddDialogOpen(true)}
                >
                  Tambah peserta didik
                </Button>
              ) : undefined
            }
          />
        }
      />

      {/* Pagination Controls synced to URL ?page= */}
      {listResult.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2 text-xs text-secondary-foreground">
          <span>
            Halaman {listResult.page} dari {listResult.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={listResult.page <= 1}
              onClick={() =>
                updateUrlParams({ page: String(listResult.page - 1) })
              }
            >
              Sebelumnya
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={listResult.page >= listResult.totalPages}
              onClick={() =>
                updateUrlParams({ page: String(listResult.page + 1) })
              }
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      {/* Dialog: Tambah peserta didik */}
      <FormBottomSheet
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        title="Tambah peserta didik"
        description="Catat pendaftaran peserta didik baru beserta persetujuan wali."
        dialogClassName="max-w-2xl"
        bodyClassName="p-0"
      >
        <PublicRegistrationWizard
          embedded
          onSuccess={() => {
            setAddDialogOpen(false);
            router.refresh();
          }}
        />
      </FormBottomSheet>

      {/* Dialog: Tempatkan ke kelas */}
      <FormBottomSheet
        open={Boolean(quickPlaceStudent)}
        onOpenChange={(open) => {
          if (!open) setQuickPlaceStudent(null);
        }}
        title="Tempatkan ke kelas"
        description={
          <>
            Pilih kelas untuk{" "}
            <strong className="text-foreground">
              {quickPlaceStudent?.fullName}
            </strong>{" "}
            ({quickPlaceStudent?.educationLevelLabel}). Penempatan akan
            mengaktifkan status belajar peserta didik.
          </>
        }
        footer={(_formId, isMobile) => (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setQuickPlaceStudent(null)}
              disabled={placePending}
              fullWidth={isMobile}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmQuickPlacement}
              disabled={placePending || !selectedClassId}
              leftIcon={<Icon icon={UserCheck} size="sm" />}
              fullWidth={isMobile}
            >
              {placePending ? "Menyimpan..." : "Tempatkan ke kelas"}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          {placeError && (
            <div
              role="alert"
              className="rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger"
            >
              {placeError}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor={quickPlaceClassId}
              className="block text-sm font-medium text-foreground"
            >
              Pilih kelas tujuan
            </label>
            <select
              id={quickPlaceClassId}
              autoFocus
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="flex h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-ring"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} — Terisi {cls.enrolledCount}/{cls.capacity} kursi
                  {cls.isFull ? " (Penuh)" : ` (Sisa ${cls.remainingSeats})`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormBottomSheet>
    </div>
  );
}
