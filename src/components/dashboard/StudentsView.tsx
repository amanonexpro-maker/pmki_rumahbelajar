/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Lock,
  Plus,
  SearchX,
  SlidersHorizontal,
  UserPlus,
  Users,
} from 'lucide-react';
import { can } from '../../permissions/can.ts';
import { storage } from '../../services/storage.ts';
import { RegistrationStatus, Student } from '../../types/index.ts';
import { StudentDetailView } from './StudentDetailView.tsx';
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Dialog,
  Icon,
  Input,
  RadioGroup,
  Select,
  Textarea,
  type BadgeVariant,
} from '../ui/index.ts';
import {
  DataTable,
  EmptyState,
  FormSection,
  PageHeader,
  SearchToolbar,
  type DataTableColumn,
  type FilterConfig,
} from '../patterns/index.ts';

/*
 * Human-readable Indonesian Status Mapping (Section 12)
 */
const STATUS_CONFIG: Record<
  RegistrationStatus,
  { label: string; variant: BadgeVariant }
> = {
  SUBMITTED: { label: 'Pendaftaran masuk', variant: 'warning' },
  PENDING_VERIFICATION: { label: 'Menunggu verifikasi', variant: 'warning' },
  VERIFIED: { label: 'Terverifikasi', variant: 'info' },
  CLASS_PLACEMENT: { label: 'Penempatan kelas', variant: 'info' },
  ACTIVE: { label: 'Aktif', variant: 'success' },
  WAITLIST: { label: 'Daftar tunggu', variant: 'neutral' },
  REJECTED: { label: 'Ditolak', variant: 'danger' },
  CANCELLED: { label: 'Dibatalkan', variant: 'neutral' },
};

const GRADE_LABELS: Record<Student['gradeLevel'], string> = {
  TK: 'TK (A & B)',
  SD_1: 'SD Kelas 1',
  SD_2: 'SD Kelas 2',
  SD_3: 'SD Kelas 3',
  SD_4: 'SD Kelas 4',
  SD_5: 'SD Kelas 5',
  SD_6: 'SD Kelas 6',
  SMP_7: 'SMP Kelas 7',
  SMP_8: 'SMP Kelas 8',
};

const RELATIONSHIP_LABELS: Record<Student['guardian']['relationship'], string> = {
  AYAH: 'Ayah',
  IBU: 'Ibu',
  WALI: 'Wali',
  PENGASUH_RAAL: 'Pengasuh RAAL',
  LAINNYA: 'Lainnya',
};

export interface StudentsViewProps {
  initialStudentId?: string;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  initialStudentId,
}) => {
  const currentUser = storage.getCurrentUser();
  const canCreateStudent = can(currentUser, 'student.write');
  const canVerifyStudent = can(currentUser, 'student.verify');
  const canReadGuardian = can(currentUser, 'guardian.read');

  const [students, setStudents] = useState<Student[]>(storage.getStudents());
  const [classes] = useState(storage.getClasses());
  const [teachers] = useState(storage.getTeachers());
  const [academicYears] = useState(storage.getAcademicYears());

  // Search & Filter State
  const activeAcademicYearId =
    academicYears.find((ay) => ay.isActive)?.id || academicYears[0]?.id || 'ALL';
  const [searchQuery, setSearchQuery] = useState('');
  const [academicYearFilter, setAcademicYearFilter] =
    useState<string>(activeAcademicYearId);
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Detail & Action Dialog State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(() => {
    if (!initialStudentId) return null;
    return storage.getStudentById(initialStudentId) || null;
  });

  useEffect(() => {
    if (initialStudentId) {
      const target = storage.getStudentById(initialStudentId);
      if (target) setSelectedStudent(target);
    }
  }, [initialStudentId]);
  const [quickAssignStudent, setQuickAssignStudent] = useState<Student | null>(
    null
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || ''
  );

  // Add Participant Dialog State
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newGender, setNewGender] = useState<'L' | 'P'>('L');
  const [newDob, setNewDob] = useState('');
  const [newPob, setNewPob] = useState('Malang');
  const [newKelurahan, setNewKelurahan] = useState<
    'Kalirejo' | 'Lawang' | 'Lainnya'
  >('Kalirejo');
  const [newAddress, setNewAddress] = useState('');
  const [newGradeLevel, setNewGradeLevel] =
    useState<Student['gradeLevel']>('SD_1');
  const [newIsRaal, setNewIsRaal] = useState(false);
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianRel, setNewGuardianRel] =
    useState<Student['guardian']['relationship']>('IBU');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [newGuardianOccupation, setNewGuardianOccupation] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newMediaConsent, setNewMediaConsent] = useState<
    'GRANTED' | 'DENIED' | ''
  >('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const refreshStudents = () => {
    setStudents([...storage.getStudents()]);
  };

  const handleUpdateStatus = (
    studentId: string,
    newStatus: RegistrationStatus,
    classId?: string
  ) => {
    if (!canVerifyStudent) return;
    storage.updateStudentStatus(studentId, newStatus, classId);
    refreshStudents();
    if (selectedStudent && selectedStudent.id === studentId) {
      const updated = storage.getStudentById(studentId);
      if (updated) setSelectedStudent({ ...updated });
    }
    setQuickAssignStudent(null);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateStudent) return;

    const nextErrors: Record<string, string> = {};
    if (!newFullName.trim()) {
      nextErrors.fullName = 'Masukkan nama lengkap peserta.';
    }
    if (!newNickname.trim()) {
      nextErrors.nickname = 'Masukkan nama panggilan peserta.';
    }
    if (!newDob) {
      nextErrors.dob = 'Pilih tanggal lahir peserta.';
    }
    if (!newGuardianName.trim()) {
      nextErrors.guardianName = 'Masukkan nama orang tua atau wali.';
    }
    const cleanPhone = newGuardianPhone.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      nextErrors.guardianPhone =
        'Masukkan nomor WhatsApp atau telepon wali yang dapat dihubungi.';
    }
    if (!newMediaConsent) {
      nextErrors.mediaConsent =
        'Pilih status izin dokumentasi foto/video sesuai persetujuan wali.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const created = storage.submitPublicRegistration({
      fullName: newFullName.trim(),
      nickname: newNickname.trim(),
      gender: newGender,
      dateOfBirth: newDob,
      placeOfBirth: newPob.trim() || 'Malang',
      address: newAddress.trim() || `Kelurahan ${newKelurahan}`,
      kelurahan: newKelurahan,
      gradeLevel: newGradeLevel,
      isRaalResident: newIsRaal,
      guardian: {
        fullName: newGuardianName.trim(),
        relationship: newGuardianRel,
        phone: newGuardianPhone.trim(),
        occupation: newGuardianOccupation.trim() || '-',
        address: newAddress.trim() || `Kelurahan ${newKelurahan}`,
      },
      notes: newNotes.trim() || undefined,
      personalDataConsent: true,
      photoVideoPublicConsent: newMediaConsent === 'GRANTED',
    });

    refreshStudents();
    setAddStudentModalOpen(false);
    setNewFullName('');
    setNewNickname('');
    setNewDob('');
    setNewAddress('');
    setNewGuardianName('');
    setNewGuardianPhone('');
    setNewGuardianOccupation('');
    setNewNotes('');
    setNewMediaConsent('');
    setFieldErrors({});
    setSelectedStudent(created);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setAcademicYearFilter(activeAcademicYearId);
    setClassFilter('ALL');
    setGradeFilter('ALL');
    setStatusFilter('ALL');
  };

  /*
   * Search & Filter Logic (Sections 6 & 7)
   * Searches only non-confidential student identity fields (fullName, nickname, registrationNumber).
   */
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const selectedAy = academicYears.find((ay) => ay.id === academicYearFilter);

    return students.filter((s) => {
      const matchesSearch =
        query.length === 0 ||
        s.fullName.toLowerCase().includes(query) ||
        s.nickname.toLowerCase().includes(query) ||
        s.registrationNumber.toLowerCase().includes(query);

      const matchesAcademicYear =
        academicYearFilter === 'ALL' ||
        !selectedAy ||
        s.createdAt >= selectedAy.startDate ||
        selectedAy.isActive;

      const matchesClass =
        classFilter === 'ALL'
          ? true
          : classFilter === 'UNASSIGNED'
          ? !s.assignedClassId
          : s.assignedClassId === classFilter;

      const matchesGrade =
        gradeFilter === 'ALL'
          ? true
          : gradeFilter === 'SD_ALL'
          ? s.gradeLevel.startsWith('SD_')
          : gradeFilter === 'SMP_ALL'
          ? s.gradeLevel.startsWith('SMP_')
          : s.gradeLevel === gradeFilter;

      const matchesStatus =
        statusFilter === 'ALL' || s.status === statusFilter;

      return (
        matchesSearch &&
        matchesAcademicYear &&
        matchesClass &&
        matchesGrade &&
        matchesStatus
      );
    });
  }, [
    students,
    searchQuery,
    academicYearFilter,
    academicYears,
    classFilter,
    gradeFilter,
    statusFilter,
  ]);

  // Contextual counts for restrained result summary (Section 8)
  const pendingVerificationCount = useMemo(
    () =>
      filteredStudents.filter(
        (s) =>
          s.status === 'SUBMITTED' || s.status === 'PENDING_VERIFICATION'
      ).length,
    [filteredStudents]
  );

  const awaitingPlacementCount = useMemo(
    () =>
      filteredStudents.filter(
        (s) => s.status === 'VERIFIED' && !s.assignedClassId
      ).length,
    [filteredStudents]
  );

  const filterConfigs: FilterConfig[] = [
    {
      id: 'academic-year',
      label: 'Tahun Ajaran',
      value: academicYearFilter,
      onChange: setAcademicYearFilter,
      allValue: activeAcademicYearId,
      options: [
        ...academicYears.map((ay) => ({
          value: ay.id,
          label: `TA ${ay.name}${ay.isActive ? ' (Aktif)' : ''}`,
        })),
        { value: 'ALL', label: 'Semua Tahun Ajaran' },
      ],
    },
    {
      id: 'class',
      label: 'Kelas',
      value: classFilter,
      onChange: setClassFilter,
      allValue: 'ALL',
      options: [
        { value: 'ALL', label: 'Semua Kelas' },
        { value: 'UNASSIGNED', label: 'Belum ditempatkan' },
        ...classes.map((cls) => ({
          value: cls.id,
          label: cls.name,
        })),
      ],
    },
    {
      id: 'grade',
      label: 'Jenjang',
      value: gradeFilter,
      onChange: setGradeFilter,
      allValue: 'ALL',
      options: [
        { value: 'ALL', label: 'Semua Jenjang' },
        { value: 'TK', label: 'TK (A & B)' },
        { value: 'SD_ALL', label: 'Semua SD (Kelas 1–6)' },
        { value: 'SMP_ALL', label: 'Semua SMP (Kelas 7–8)' },
        { value: 'SD_1', label: 'SD Kelas 1' },
        { value: 'SD_2', label: 'SD Kelas 2' },
        { value: 'SD_3', label: 'SD Kelas 3' },
        { value: 'SD_4', label: 'SD Kelas 4' },
        { value: 'SD_5', label: 'SD Kelas 5' },
        { value: 'SD_6', label: 'SD Kelas 6' },
        { value: 'SMP_7', label: 'SMP Kelas 7' },
        { value: 'SMP_8', label: 'SMP Kelas 8' },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      allValue: 'ALL',
      options: [
        { value: 'ALL', label: 'Semua Status' },
        { value: 'ACTIVE', label: 'Aktif' },
        { value: 'SUBMITTED', label: 'Pendaftaran masuk' },
        { value: 'PENDING_VERIFICATION', label: 'Menunggu verifikasi' },
        { value: 'VERIFIED', label: 'Terverifikasi' },
        { value: 'WAITLIST', label: 'Daftar tunggu' },
        { value: 'REJECTED', label: 'Ditolak' },
        { value: 'CANCELLED', label: 'Dibatalkan' },
      ],
    },
  ];

  const hasActiveFilters =
    academicYearFilter !== activeAcademicYearId ||
    classFilter !== 'ALL' ||
    gradeFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  /*
   * Desktop Table Columns (Section 9, 10, 11, 12, 20)
   * Exposes minimum necessary information for scanning and operational work.
   * Guardian phone, address, and private notes are strictly excluded from the list.
   */
  const columns: DataTableColumn<Student>[] = [
    {
      id: 'participant',
      header: 'Peserta',
      cell: (student) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={student.fullName} size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedStudent(student)}
                className="font-semibold text-foreground hover:text-primary transition-colors text-left truncate cursor-pointer focus-ring rounded-xs"
              >
                {student.fullName}
              </button>
              {student.isRaalResident && (
                <Badge variant="learning" size="sm">
                  Anak Asuh RAAL
                </Badge>
              )}
            </div>
            <p className="type-caption text-secondary-foreground font-mono">
              {student.registrationNumber}
              <span className="font-sans text-muted-foreground">
                {' '}
                · Panggilan {student.nickname}
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'class',
      header: 'Kelas Rombel',
      cell: (student) => {
        const assignedClass = classes.find(
          (c) => c.id === student.assignedClassId
        );
        if (!assignedClass) {
          return (
            <span className="type-caption text-muted-foreground italic">
              Belum ditempatkan
            </span>
          );
        }
        return (
          <div>
            <span className="text-sm font-medium text-foreground block">
              {assignedClass.name}
            </span>
            <span className="type-caption text-secondary-foreground">
              {assignedClass.roomName}
            </span>
          </div>
        );
      },
    },
    {
      id: 'grade-region',
      header: 'Jenjang & Wilayah',
      cell: (student) => (
        <div>
          <span className="text-sm font-medium text-foreground block">
            {GRADE_LABELS[student.gradeLevel] || student.gradeLevel}
          </span>
          <span className="type-caption text-secondary-foreground">
            Kelurahan {student.kelurahan}
          </span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status Pendaftaran',
      cell: (student) => {
        const cfg = STATUS_CONFIG[student.status] || {
          label: student.status,
          variant: 'neutral' as BadgeVariant,
        };
        return (
          <Badge variant={cfg.variant} size="md" dot>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Tindakan',
      align: 'right',
      cell: (student) => (
        <div className="flex items-center justify-end gap-2">
          {canVerifyStudent &&
            (student.status === 'SUBMITTED' ||
              student.status === 'PENDING_VERIFICATION') && (
              <Button
                variant="soft"
                size="sm"
                onClick={() => setSelectedStudent(student)}
              >
                Verifikasi
              </Button>
            )}
          {canVerifyStudent &&
            student.status === 'VERIFIED' &&
            !student.assignedClassId && (
              <Button
                variant="soft"
                size="sm"
                onClick={() => {
                  setQuickAssignStudent(student);
                  setSelectedClassId(classes[0]?.id || '');
                }}
              >
                Tempatkan kelas
              </Button>
            )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedStudent(student)}
          >
            Lihat detail
          </Button>
        </div>
      ),
    },
  ];

  /*
   * Three Distinct Empty States (Section 15)
   * A. Truly no student records
   * B. Search produced no match
   * C. Active filters produced no match
   */
  const renderEmptyState = () => {
    if (students.length === 0) {
      return (
        <EmptyState
          icon={Users}
          title="Belum ada peserta"
          description="Saat ini belum ada data peserta didik yang terdaftar di Rumah Belajar Griya Asih."
          action={
            canCreateStudent ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Icon icon={Plus} size="sm" />}
                onClick={() => setAddStudentModalOpen(true)}
              >
                Tambah peserta
              </Button>
            ) : undefined
          }
        />
      );
    }

    if (searchQuery.trim().length > 0 && !hasActiveFilters) {
      return (
        <EmptyState
          icon={SearchX}
          title="Tidak ada peserta yang cocok dengan pencarian ini."
          description={`Pencarian untuk "${searchQuery.trim()}" tidak menemukan nama panggilan, nama lengkap, atau nomor registrasi yang sesuai.`}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSearchQuery('')}
            >
              Bersihkan pencarian
            </Button>
          }
        />
      );
    }

    return (
      <EmptyState
        icon={SlidersHorizontal}
        title="Tidak ada peserta dengan filter yang dipilih."
        description="Coba ubah atau atur ulang kriteria filter kelas, jenjang, atau status pendaftaran untuk menampilkan peserta lainnya."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetFilters}
          >
            Atur ulang filter
          </Button>
        }
      />
    );
  };

  const resultContextSummary = useMemo(() => {
    const parts: string[] = [];
    if (pendingVerificationCount > 0) {
      parts.push(`${pendingVerificationCount} menunggu verifikasi`);
    }
    if (awaitingPlacementCount > 0) {
      parts.push(`${awaitingPlacementCount} belum ditempatkan ke kelas`);
    }
    return parts.length > 0 ? parts.join(' · ') : undefined;
  }, [pendingVerificationCount, awaitingPlacementCount]);

  if (selectedStudent) {
    return (
      <StudentDetailView
        student={selectedStudent}
        onBack={() => setSelectedStudent(null)}
        onStudentUpdated={(updated) => {
          refreshStudents();
          setSelectedStudent(updated);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER (Section 4) */}
      <PageHeader
        title="Peserta Didik"
        description="Kelola peserta yang mengikuti Rumah Belajar Griya Asih."
        primaryAction={
          canCreateStudent ? (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Icon icon={UserPlus} size="sm" />}
              onClick={() => setAddStudentModalOpen(true)}
            >
              Tambah peserta
            </Button>
          ) : undefined
        }
      />

      {/* 2. WORKSPACE TOOLBAR (Sections 5, 6, 7 & 8) */}
      <SearchToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari nama atau nomor registrasi peserta..."
        searchAriaLabel="Cari nama atau nomor registrasi peserta"
        filters={filterConfigs}
        totalCount={students.length}
        filteredCount={filteredStudents.length}
        entityLabel="peserta"
        resultContext={resultContextSummary}
        onResetAll={handleResetFilters}
      />

      {/* 3. DESKTOP TABLE & MOBILE COMPACT LIST (Sections 9, 10, 12, 13 & 14) */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        getRowKey={(s) => s.id}
        caption="Daftar peserta didik Rumah Belajar Griya Asih"
        emptyState={renderEmptyState()}
        renderMobileRow={(student) => {
          const cfg = STATUS_CONFIG[student.status] || {
            label: student.status,
            variant: 'neutral' as BadgeVariant,
          };
          const assignedClass = classes.find(
            (c) => c.id === student.assignedClassId
          );

          return (
            <button
              type="button"
              onClick={() => setSelectedStudent(student)}
              className="w-full text-left flex items-center justify-between gap-3 py-1 cursor-pointer focus-ring rounded-control"
            >
              <div className="flex items-start gap-3 min-w-0">
                <Avatar name={student.fullName} size="sm" className="mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {student.fullName}
                    </span>
                    {student.isRaalResident && (
                      <Badge variant="learning" size="sm">
                        RAAL
                      </Badge>
                    )}
                  </div>

                  <p className="type-caption text-secondary-foreground truncate">
                    {assignedClass
                      ? assignedClass.name
                      : GRADE_LABELS[student.gradeLevel]}{' '}
                    · Kel. {student.kelurahan}
                  </p>

                  <div className="flex items-center gap-2 pt-0.5">
                    <Badge variant={cfg.variant} size="sm" dot>
                      {cfg.label}
                    </Badge>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {student.registrationNumber}
                    </span>
                  </div>
                </div>
              </div>

              <Icon
                icon={ChevronRight}
                size="sm"
                className="text-muted-foreground shrink-0"
              />
            </button>
          );
        }}
      />

      {/* 4. QUICK CLASS PLACEMENT DIALOG (From List Row Action — UI-6 Section 24) */}
      <Dialog
        open={Boolean(quickAssignStudent)}
        onClose={() => setQuickAssignStudent(null)}
        size="md"
        title="Penempatan Rombongan Belajar"
        description={
          quickAssignStudent
            ? `Pilih kelas sesi Sabtu yang sesuai untuk ${quickAssignStudent.fullName} (Jenjang: ${
                GRADE_LABELS[quickAssignStudent.gradeLevel]
              }).`
            : undefined
        }
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickAssignStudent(null)}
            >
              Batal
            </Button>
            {quickAssignStudent && (
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  handleUpdateStatus(
                    quickAssignStudent.id,
                    'ACTIVE',
                    selectedClassId
                  )
                }
              >
                Tempatkan & aktifkan peserta
              </Button>
            )}
          </>
        }
      >
        {quickAssignStudent && (
          <fieldset className="space-y-2.5">
            <legend className="type-label text-foreground mb-1">
              Pilih Rombongan Belajar Sabtu (15.00 – 17.15 WIB)
            </legend>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {classes.map((cls) => {
                const isSelected = selectedClassId === cls.id;
                const teacher = teachers.find(
                  (t) => t.id === cls.mainTeacherId
                );
                const isRecommended =
                  (quickAssignStudent.gradeLevel === 'TK' &&
                    cls.category === 'TK') ||
                  (quickAssignStudent.gradeLevel.startsWith('SD_') &&
                    cls.category === 'SD') ||
                  (quickAssignStudent.gradeLevel.startsWith('SMP_') &&
                    cls.category === 'SMP');

                return (
                  <label
                    key={cls.id}
                    className={`flex items-start justify-between gap-3 p-3.5 rounded-control border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary-soft/50'
                        : 'border-border bg-surface hover:bg-surface-subtle/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="quick-class-placement"
                        value={cls.id}
                        checked={isSelected}
                        onChange={() => setSelectedClassId(cls.id)}
                        className="mt-1 accent-primary"
                      />
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {cls.name}
                          </span>
                          {isRecommended && (
                            <Badge variant="primary" size="sm">
                              Sesuai jenjang
                            </Badge>
                          )}
                        </div>
                        <p className="type-caption text-secondary-foreground">
                          {cls.roomName} · Wali Kelas:{' '}
                          {teacher?.fullName || 'Tim Guru'}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        cls.enrolledCount >= cls.capacity
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {cls.enrolledCount}/{cls.capacity} anak
                    </Badge>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      </Dialog>

      {/* 5. ADD PARTICIPANT DIALOG (Only when permitted by 'student.write' — UI-6 Section 22) */}
      <Dialog
        open={addStudentModalOpen}
        onClose={() => {
          setAddStudentModalOpen(false);
          setFieldErrors({});
        }}
        size="lg"
        title="Tambah Peserta Didik Baru"
        description="Catat pendaftaran peserta baru secara internal ke Rumah Belajar Griya Asih."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setAddStudentModalOpen(false);
                setFieldErrors({});
              }}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="internal-add-student-form"
            >
              Simpan pendaftaran
            </Button>
          </>
        }
      >
        <form
          id="internal-add-student-form"
          onSubmit={handleCreateStudent}
          noValidate
          className="space-y-6"
        >
          <FormSection
            title="Identitas Peserta"
            description="Data dasar peserta yang akan mengikuti kegiatan bimbingan belajar."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama lengkap peserta"
                required
                value={newFullName}
                onChange={(e) => {
                  setNewFullName(e.target.value);
                  clearFieldError('fullName');
                }}
                error={fieldErrors.fullName}
                placeholder="Contoh: Lukas Pratama"
              />
              <Input
                label="Nama panggilan"
                required
                value={newNickname}
                onChange={(e) => {
                  setNewNickname(e.target.value);
                  clearFieldError('nickname');
                }}
                error={fieldErrors.nickname}
                placeholder="Contoh: Lukas"
              />
              <Input
                label="Tanggal lahir"
                type="date"
                required
                value={newDob}
                onChange={(e) => {
                  setNewDob(e.target.value);
                  clearFieldError('dob');
                }}
                error={fieldErrors.dob}
              />
              <Select
                label="Jenis kelamin"
                required
                value={newGender}
                onChange={(e) => setNewGender(e.target.value as 'L' | 'P')}
                options={[
                  { value: 'L', label: 'Laki-laki' },
                  { value: 'P', label: 'Perempuan' },
                ]}
              />
              <Input
                label="Tempat lahir (Opsional)"
                value={newPob}
                onChange={(e) => setNewPob(e.target.value)}
                placeholder="Contoh: Malang"
              />
              <Select
                label="Wilayah domisili"
                required
                value={newKelurahan}
                onChange={(e) =>
                  setNewKelurahan(
                    e.target.value as 'Kalirejo' | 'Lawang' | 'Lainnya'
                  )
                }
                options={[
                  { value: 'Kalirejo', label: 'Kelurahan Kalirejo' },
                  { value: 'Lawang', label: 'Kelurahan Lawang' },
                  { value: 'Lainnya', label: 'Sekitar Lawang lainnya' },
                ]}
              />
            </div>

            <Input
              label="Alamat tempat tinggal (Opsional)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Contoh: Jl. Kalirejo Krajan RT 02"
            />

            <Checkbox
              checked={newIsRaal}
              onChange={(e) => setNewIsRaal(e.target.checked)}
              label="Peserta merupakan anak asuh yang tinggal di Asrama RAAL Griya Asih"
            />
          </FormSection>

          <FormSection
            divider
            title="Orang Tua / Wali"
            description="Informasi kontak keluarga untuk komunikasi kehadiran dan perkembangan anak."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama orang tua / wali"
                required
                value={newGuardianName}
                onChange={(e) => {
                  setNewGuardianName(e.target.value);
                  clearFieldError('guardianName');
                }}
                error={fieldErrors.guardianName}
                placeholder="Nama lengkap ayah, ibu, atau wali"
              />
              <Select
                label="Hubungan dengan peserta"
                required
                value={newGuardianRel}
                onChange={(e) =>
                  setNewGuardianRel(
                    e.target.value as Student['guardian']['relationship']
                  )
                }
                options={[
                  { value: 'AYAH', label: 'Ayah kandung' },
                  { value: 'IBU', label: 'Ibu kandung' },
                  { value: 'WALI', label: 'Wali keluarga' },
                  { value: 'PENGASUH_RAAL', label: 'Pengasuh Asrama RAAL' },
                  { value: 'LAINNYA', label: 'Kerabat lainnya' },
                ]}
              />
              <Input
                label="Nomor WhatsApp aktif"
                type="tel"
                required
                value={newGuardianPhone}
                onChange={(e) => {
                  setNewGuardianPhone(e.target.value);
                  clearFieldError('guardianPhone');
                }}
                error={fieldErrors.guardianPhone}
                placeholder="Contoh: 0812-xxxx-xxxx"
              />
              <Input
                label="Pekerjaan orang tua / wali (Opsional)"
                value={newGuardianOccupation}
                onChange={(e) => setNewGuardianOccupation(e.target.value)}
                placeholder="Contoh: Wiraswasta, Karyawan"
              />
            </div>
          </FormSection>

          <FormSection
            divider
            title="Pendidikan & Persetujuan Media"
            description="Jenjang sekolah peserta saat ini dan pilihan izin dokumentasi foto/video dari wali."
          >
            <Select
              label="Jenjang pendidikan saat ini"
              required
              value={newGradeLevel}
              onChange={(e) =>
                setNewGradeLevel(e.target.value as Student['gradeLevel'])
              }
              options={Object.entries(GRADE_LABELS).map(([val, label]) => ({
                value: val,
                label,
              }))}
            />

            <Textarea
              label="Catatan kebutuhan belajar awal (Opsional)"
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Catatan literasi membaca atau kebutuhan pendampingan khusus..."
            />

            <div className="p-4 rounded-control bg-surface-subtle/60 border border-border">
              <RadioGroup
                name="internal-add-media-consent"
                label="Izin penggunaan dokumentasi foto/video dari orang tua/wali"
                value={newMediaConsent}
                onChange={(val) => {
                  setNewMediaConsent(val as 'GRANTED' | 'DENIED');
                  clearFieldError('mediaConsent');
                }}
                error={fieldErrors.mediaConsent}
                options={[
                  {
                    value: 'GRANTED',
                    label: 'Diizinkan untuk publikasi kegiatan resmi yayasan',
                    description:
                      'Wali telah menyetujui dokumentasi kegiatan belajar ditampilkan secara santun pada portal publik.',
                  },
                  {
                    value: 'DENIED',
                    label:
                      'Dibatasi untuk dokumentasi internal (Tidak untuk publikasi umum)',
                    description:
                      'Wali tidak mengizinkan publikasi visual eksternal. Peserta tetap mengikuti seluruh kegiatan belajar.',
                  },
                ]}
              />
            </div>
          </FormSection>
        </form>
      </Dialog>
    </div>
  );
};
