"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Plus, UserCheck, Users } from "lucide-react";
import {
  EmptyState,
  GenericFilterSelect,
  StatusBadge,
} from "@/components/compositions";
import {
  DataTable,
  FeedbackBanner,
  FloatingFeedbackToast,
  FormBottomSheet,
  MobileCardList,
  PageHeader,
  SearchToolbar,
  type DataTableColumn,
} from "@/components/patterns";
import {
  Avatar,
  Badge,
  Button,
  Icon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import type { AcademicYearDTO, ClassSummaryDTO } from "@/features/academic";
import { useUrlQueryParams } from "@/hooks/use-url-query-params";
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

type EducationLevelFilterGroup = "TK" | "SD_ALL" | "SMP_ALL";

function inferClassEducationLevelGroup(
  cls: Pick<ClassSummaryDTO, "category" | "name">
): EducationLevelFilterGroup | null {
  const source = `${cls.category} ${cls.name}`.toUpperCase();
  if (/\bTK\b/.test(source)) return "TK";
  if (/\bSMP\b/.test(source)) return "SMP_ALL";
  if (/\bSD\b/.test(source)) return "SD_ALL";
  return null;
}

export function StudentsWorkspaceClient({
  listResult,
  classes,
  academicYears,
  initialFilters,
  canCreateStudent,
  canVerifyStudent,
}: StudentsWorkspaceClientProps) {
  const { updateQuery: updateUrlParams, pathname, router } = useUrlQueryParams();

  const [searchInput, setSearchInput] = React.useState(initialFilters.search);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [quickPlaceStudent, setQuickPlaceStudent] =
    React.useState<StudentListItemDTO | null>(null);
  const [selectedClassId, setSelectedClassId] = React.useState(
    classes.find((c) => !c.isFull)?.id ?? classes[0]?.id ?? ""
  );
  const [placePending, setPlacePending] = React.useState(false);
  const [placeError, setPlaceError] = React.useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = React.useState<string | null>(null);
  const quickPlaceClassId = React.useId();
  const filterIdPrefix = React.useId();

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
      const placedStudentName = quickPlaceStudent.fullName;
      setQuickPlaceStudent(null);
      setFeedbackToast(
        `${placedStudentName} berhasil ditempatkan ke kelas.`
      );
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

  const selectedClassObj = React.useMemo(
    () => classes.find((c) => c.id === initialFilters.classId) ?? null,
    [classes, initialFilters.classId]
  );

  const selectedClassLevelGroup = React.useMemo(
    () =>
      selectedClassObj
        ? inferClassEducationLevelGroup(selectedClassObj)
        : null,
    [selectedClassObj]
  );

  const availableLevelOptions = React.useMemo(() => {
    if (!selectedClassLevelGroup) return LEVEL_FILTER_OPTIONS;
    return LEVEL_FILTER_OPTIONS.filter(
      (opt) => opt.value === "ALL" || opt.value === selectedClassLevelGroup
    );
  }, [selectedClassLevelGroup]);

  const filteredClasses = React.useMemo(() => {
    return classes.filter((cls) => {
      if (
        initialFilters.academicYearId !== "ALL" &&
        cls.academicYearId !== initialFilters.academicYearId
      ) {
        return false;
      }
      if (initialFilters.educationLevel !== "ALL") {
        const clsLevel = inferClassEducationLevelGroup(cls);
        if (clsLevel && clsLevel !== initialFilters.educationLevel) {
          return false;
        }
      }
      return true;
    });
  }, [classes, initialFilters.academicYearId, initialFilters.educationLevel]);

  const classOptions = React.useMemo(
    () => [
      { value: "ALL", label: "Semua kelas" },
      { value: "UNASSIGNED", label: "Belum ditempatkan" },
      ...filteredClasses.map((cls) => ({
        value: cls.id,
        label: `${cls.name} (${cls.enrolledCount}/${cls.capacity})`,
      })),
    ],
    [filteredClasses]
  );

  const yearOptions = React.useMemo(
    () => [
      { value: "ALL", label: "Semua tahun ajaran" },
      ...academicYears.map((ay) => ({
        value: ay.id,
        label: `TA ${ay.name}${ay.active ? " (Aktif)" : ""}`,
      })),
    ],
    [academicYears]
  );

  const handleClassFilterChange = React.useCallback(
    (nextClassId: string) => {
      if (nextClassId === "ALL" || nextClassId === "UNASSIGNED") {
        updateUrlParams({ classId: nextClassId, page: "1" });
        return;
      }
      const targetClass = classes.find((c) => c.id === nextClassId);
      const inferredLevel = targetClass
        ? inferClassEducationLevelGroup(targetClass)
        : null;
      updateUrlParams({
        classId: nextClassId,
        ...(inferredLevel ? { level: inferredLevel } : {}),
        ...(targetClass?.academicYearId
          ? { year: targetClass.academicYearId }
          : {}),
        page: "1",
      });
    },
    [classes, updateUrlParams]
  );

  const handleLevelFilterChange = React.useCallback(
    (nextLevel: string) => {
      const updates: Record<string, string | null> = {
        level: nextLevel,
        page: "1",
      };
      if (
        nextLevel !== "ALL" &&
        selectedClassLevelGroup &&
        selectedClassLevelGroup !== nextLevel
      ) {
        updates.classId = "ALL";
      }
      updateUrlParams(updates);
    },
    [selectedClassLevelGroup, updateUrlParams]
  );

  const handleYearFilterChange = React.useCallback(
    (nextYear: string) => {
      const updates: Record<string, string | null> = {
        year: nextYear,
        page: "1",
      };
      if (
        nextYear !== "ALL" &&
        selectedClassObj &&
        selectedClassObj.academicYearId !== nextYear
      ) {
        updates.classId = "ALL";
      }
      updateUrlParams(updates);
    },
    [selectedClassObj, updateUrlParams]
  );

  const filterConfigs = [
    {
      key: "status",
      label: "Status pendaftaran",
      value: initialFilters.status,
      options: STATUS_FILTER_OPTIONS,
      onChange: (value: string) => updateUrlParams({ status: value, page: "1" }),
    },
    {
      key: "classId",
      label: "Kelas",
      value: initialFilters.classId,
      options: classOptions,
      onChange: handleClassFilterChange,
    },
    {
      key: "level",
      label: "Jenjang pendidikan",
      value: initialFilters.educationLevel,
      options: availableLevelOptions,
      onChange: handleLevelFilterChange,
    },
    {
      key: "year",
      label: "Tahun ajaran",
      value: initialFilters.academicYearId,
      options: yearOptions,
      onChange: handleYearFilterChange,
    },
  ];

  const columns: DataTableColumn<StudentListItemDTO>[] = [
    {
      id: "participant",
      header: "Peserta didik",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} size="sm" className="shrink-0" />
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/workspace/students/${row.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-foreground hover:text-primary focus-ring rounded-xs truncate"
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
          <Link
            href={`/workspace/students/${row.id}`}
            aria-label={`Buka profil peserta didik ${row.fullName}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-subtle hover:text-foreground transition-colors focus-ring"
          >
            <Icon icon={ChevronRight} size="sm" />
          </Link>
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
        desktopFilters={
          <>
            {filterConfigs.map((filter) => (
              <GenericFilterSelect
                key={filter.key}
                label={filter.label}
                value={filter.value}
                options={filter.options}
                onChange={filter.onChange}
              />
            ))}
          </>
        }
        mobileFilterContent={
          <div className="space-y-4">
            {filterConfigs.map((filter) => {
              const selectId = `${filterIdPrefix}-${filter.key}`;
              return (
                <div key={filter.key} className="space-y-1.5">
                  <label
                    htmlFor={selectId}
                    className="type-label block text-foreground"
                  >
                    {filter.label}
                  </label>
                  <GenericFilterSelect
                    id={selectId}
                    label={filter.label}
                    value={filter.value}
                    options={filter.options}
                    onChange={filter.onChange}
                    className="w-full min-h-11 text-sm"
                  />
                </div>
              );
            })}
          </div>
        }
        onResetAll={handleResetFilters}
        resultSummary={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span>
              Menampilkan{" "}
              <strong className="text-foreground">
                {listResult.totalCount}
              </strong>{" "}
              peserta didik
            </span>
            {listResult.pendingVerificationCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  updateUrlParams({
                    status:
                      initialFilters.status === "PENDING_VERIFICATION"
                        ? "ALL"
                        : "PENDING_VERIFICATION",
                    page: "1",
                  })
                }
                className={
                  initialFilters.status === "PENDING_VERIFICATION"
                    ? "inline-flex items-center rounded-pill border border-warning bg-warning-soft px-2.5 py-1 font-semibold text-warning-foreground cursor-pointer focus-ring"
                    : "inline-flex items-center rounded-pill border border-warning/40 bg-warning-soft/60 px-2.5 py-1 font-medium text-warning-foreground hover:bg-warning-soft cursor-pointer focus-ring"
                }
              >
                {listResult.pendingVerificationCount} menunggu verifikasi
              </button>
            )}
            {listResult.awaitingPlacementCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  updateUrlParams({
                    status:
                      initialFilters.status === "VERIFIED" ? "ALL" : "VERIFIED",
                    page: "1",
                  })
                }
                className={
                  initialFilters.status === "VERIFIED"
                    ? "inline-flex items-center rounded-pill border border-primary bg-primary-soft px-2.5 py-1 font-semibold text-primary cursor-pointer focus-ring"
                    : "inline-flex items-center rounded-pill border border-primary/30 bg-primary-soft/60 px-2.5 py-1 font-medium text-primary hover:bg-primary-soft cursor-pointer focus-ring"
                }
              >
                {listResult.awaitingPlacementCount} siap ditempatkan ke kelas
              </button>
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
        renderMobileRow={(row) => {
          const showQuickPlacement =
            canVerifyStudent &&
            (row.registrationStatus === "VERIFIED" ||
              row.registrationStatus === "CLASS_PLACEMENT" ||
              row.registrationStatus === "WAITLIST") &&
            !row.assignedClassId;
          const showLevelSuffix =
            row.assignedClassName &&
            row.assignedClassName !== row.educationLevelLabel;

          return (
            <MobileCardList
              avatar={<Avatar name={row.fullName} size="sm" />}
              title={row.fullName}
              badge={
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <StatusBadge
                    domain="registration"
                    status={row.registrationStatus}
                  />
                  <Link
                    href={`/workspace/students/${row.id}`}
                    aria-label={`Buka profil peserta didik ${row.fullName}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted-foreground hover:text-foreground focus-ring"
                  >
                    <Icon icon={ChevronRight} size="sm" />
                  </Link>
                </div>
              }
              primaryMeta={
                <>
                  <span className="font-medium text-foreground">
                    {row.assignedClassName ?? "Belum ditempatkan"}
                  </span>
                  {(!row.assignedClassName || showLevelSuffix) && (
                    <> · {row.educationLevelLabel}</>
                  )}
                </>
              }
              secondaryMeta={
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-mono">{row.registrationNumber}</span>
                  <span>· Panggilan: {row.nickname}</span>
                  {row.isRaalResident && (
                    <Badge variant="info" size="sm">
                      RAAL
                    </Badge>
                  )}
                </div>
              }
              action={
                showQuickPlacement ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuickPlaceStudent(row);
                      setPlaceError(null);
                    }}
                    className="min-h-11 sm:min-h-8 text-xs"
                  >
                    Tempatkan ke kelas
                  </Button>
                ) : undefined
              }
            />
          );
        }}
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
              className="min-h-11 sm:min-h-8"
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
              className="min-h-11 sm:min-h-8"
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
            <FeedbackBanner
              tone="danger"
              message={placeError}
              onDismiss={() => setPlaceError(null)}
            />
          )}

          <div className="space-y-1.5">
            <label
              htmlFor={quickPlaceClassId}
              className="block text-sm font-medium text-foreground"
            >
              Pilih kelas tujuan
            </label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger id={quickPlaceClassId} autoFocus>
                <SelectValue placeholder="Pilih kelas tujuan" />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} · {cls.enrolledCount}/{cls.capacity} (
                    {cls.isFull ? "Penuh" : `Sisa ${cls.remainingSeats}`})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormBottomSheet>

      {feedbackToast && (
        <FloatingFeedbackToast
          tone="success"
          message={feedbackToast}
          onDismiss={() => setFeedbackToast(null)}
        />
      )}
    </div>
  );
}
