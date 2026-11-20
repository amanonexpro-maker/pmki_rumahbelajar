/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Plus,
  SearchX,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { can } from '../../permissions/can.ts';
import { storage } from '../../services/storage.ts';
import { Student, StudentDevelopmentNote } from '../../types/index.ts';
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  Icon,
  Input,
  Select,
  Textarea,
  type BadgeVariant,
} from '../ui/index.ts';
import {
  DetailTabs,
  EmptyState,
  FormSection,
  PageHeader,
  SearchToolbar,
  type DetailTabItem,
  type FilterConfig,
} from '../patterns/index.ts';

export interface StudentDevelopmentViewProps {
  initialClassId?: string;
  initialStudentId?: string;
  onOpenStudent?: (studentId: string) => void;
}

const CATEGORY_CONFIG: Record<
  StudentDevelopmentNote['category'],
  { label: string; variant: BadgeVariant }
> = {
  KARAKTER: { label: 'Karakter & Budi Pekerti', variant: 'learning' },
  MEMBACA: { label: 'Literasi Membaca', variant: 'primary' },
  AKADEMIK: { label: 'Akademik & Penalaran', variant: 'info' },
  KEDISIPLINAN: { label: 'Kedisiplinan Belajar', variant: 'neutral' },
  SOSIAL: { label: 'Empati & Sosial', variant: 'success' },
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

/**
 * UI-7 Education Workflows — Student Development & Follow-Up Workspace
 * (Sections 16, 17, 18 & 19 of UI-7 & Section 39 of docs/UI-UX-DESIGN-SYSTEM.md)
 * Focuses on qualitative observation, reflection, confidentiality (progressive disclosure),
 * and respectful follow-up for students requiring attention.
 */
export const StudentDevelopmentView: React.FC<StudentDevelopmentViewProps> = ({
  initialClassId,
  initialStudentId,
  onOpenStudent,
}) => {
  const currentUser = storage.getCurrentUser();
  const canReadDevelopment = can(currentUser, 'development.read');
  const canWriteDevelopment = can(currentUser, 'development.write');

  const [notes, setNotes] = useState<StudentDevelopmentNote[]>(
    storage.getDevelopmentNotes()
  );
  const students = useMemo(() => storage.getStudents(), []);
  const classes = useMemo(() => storage.getClasses(), []);
  const attendanceSessions = useMemo(
    () => storage.getAttendanceSessions(),
    []
  );

  const [activeTab, setActiveTab] = useState<string>('observations');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [savedNotice, setSavedNotice] = useState<string>('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>(
    initialClassId || 'ALL'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [followUpFilter, setFollowUpFilter] = useState<string>('ALL');

  // Create Development Note Dialog State
  const [modalOpen, setModalOpen] = useState(false);
  const activeStudents = useMemo(
    () => students.filter((s) => s.status === 'ACTIVE'),
    [students]
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || activeStudents[0]?.id || students[0]?.id || ''
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] =
    useState<StudentDevelopmentNote['category']>('MEMBACA');
  const [observation, setObservation] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [observationError, setObservationError] = useState('');

  useEffect(() => {
    if (initialClassId) {
      setClassFilter(initialClassId);
    }
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [initialClassId, initialStudentId]);

  const refreshNotes = () => {
    setNotes([...storage.getDevelopmentNotes()]);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenAddModalForStudent = (
    studentId?: string,
    defaultCat: StudentDevelopmentNote['category'] = 'MEMBACA'
  ) => {
    if (!canWriteDevelopment) return;
    if (studentId) {
      setSelectedStudentId(studentId);
    }
    setCategory(defaultCat);
    setObservationError('');
    setModalOpen(true);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWriteDevelopment) return;

    if (!observation.trim()) {
      setObservationError(
        'Tuliskan hasil pengamatan konkret selama sesi belajar berlangsung.'
      );
      return;
    }

    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    const created = storage.addDevelopmentNote({
      studentId: student.id,
      studentName: student.fullName,
      date,
      category,
      observation: observation.trim(),
      progressNotes: progressNotes.trim(),
      followUp: followUp.trim(),
    });

    refreshNotes();
    setRevealedIds((prev) => ({ ...prev, [created.id]: true }));
    setModalOpen(false);
    setObservation('');
    setProgressNotes('');
    setFollowUp('');
    setObservationError('');
    setSavedNotice(
      `Catatan perkembangan ${student.fullName} berhasil disimpan.`
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setClassFilter('ALL');
    setCategoryFilter('ALL');
    setFollowUpFilter('ALL');
  };

  // Enrich notes with student & class context
  const enrichedNotes = useMemo(() => {
    return notes.map((note) => {
      const student = students.find((s) => s.id === note.studentId);
      const cls = student?.assignedClassId
        ? classes.find((c) => c.id === student.assignedClassId)
        : undefined;
      return {
        ...note,
        student,
        className: cls?.name || 'Belum ditempatkan',
        classId: cls?.id || '',
        hasFollowUp: Boolean(note.followUp && note.followUp.trim().length > 0),
      };
    });
  }, [notes, students, classes]);

  // Filter Observations (Privacy-safe: searches student name, teacher name, category—not raw confidential body when unrevealed)
  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedNotes.filter((item) => {
      const matchesSearch =
        q.length === 0 ||
        item.studentName.toLowerCase().includes(q) ||
        item.teacherName.toLowerCase().includes(q) ||
        item.className.toLowerCase().includes(q);

      const matchesClass =
        classFilter === 'ALL' || item.classId === classFilter;

      const matchesCategory =
        categoryFilter === 'ALL' || item.category === categoryFilter;

      const matchesFollowUp =
        followUpFilter === 'ALL'
          ? true
          : followUpFilter === 'WITH_FOLLOW_UP'
          ? item.hasFollowUp
          : !item.hasFollowUp;

      return (
        matchesSearch && matchesClass && matchesCategory && matchesFollowUp
      );
    });
  }, [
    enrichedNotes,
    searchQuery,
    classFilter,
    categoryFilter,
    followUpFilter,
  ]);

  // Follow-Up Signals (Section 19: Respectful, non-stigmatizing attention list)
  const followUpItems = useMemo(() => {
    const items: {
      student: Student;
      className: string;
      reasons: {
        type: 'DEVELOPMENT_FOLLOW_UP' | 'ATTENDANCE_ATTENTION';
        label: string;
        detail: string;
        date: string;
      }[];
    }[] = [];

    activeStudents.forEach((student) => {
      if (classFilter !== 'ALL' && student.assignedClassId !== classFilter) {
        return;
      }

      const reasons: {
        type: 'DEVELOPMENT_FOLLOW_UP' | 'ATTENDANCE_ATTENTION';
        label: string;
        detail: string;
        date: string;
      }[] = [];

      // 1. Check latest development note with a follow-up plan
      const studentDevWithFollowUp = notes.find(
        (n) =>
          n.studentId === student.id &&
          n.followUp &&
          n.followUp.trim().length > 0
      );
      if (studentDevWithFollowUp) {
        reasons.push({
          type: 'DEVELOPMENT_FOLLOW_UP',
          label: 'Perlu tindak lanjut pendampingan',
          detail: `${
            CATEGORY_CONFIG[studentDevWithFollowUp.category]?.label ||
            studentDevWithFollowUp.category
          } · Dicatat oleh ${studentDevWithFollowUp.teacherName}`,
          date: studentDevWithFollowUp.date,
        });
      }

      // 2. Check recent attendance exceptions (ABSENT, SICK, PERMITTED)
      const studentAbsences = attendanceSessions
        .map((sess) => {
          const rec = sess.records.find((r) => r.studentId === student.id);
          if (!rec || rec.status === 'PRESENT') return null;
          return {
            date: sess.date,
            status: rec.status,
            note: rec.note,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      if (studentAbsences.length > 0) {
        const latest = studentAbsences[0];
        const statusLabel =
          latest.status === 'SICK'
            ? 'Sakit'
            : latest.status === 'PERMITTED'
            ? 'Izin'
            : 'Tidak hadir';
        reasons.push({
          type: 'ATTENDANCE_ATTENTION',
          label: 'Kehadiran perlu diperhatikan',
          detail: `Tercatat ${statusLabel} pada sesi ${latest.date}${
            latest.note ? ` (${latest.note})` : ''
          }`,
          date: latest.date,
        });
      }

      if (reasons.length > 0) {
        const cls = classes.find((c) => c.id === student.assignedClassId);
        items.push({
          student,
          className: cls?.name || GRADE_LABELS[student.gradeLevel],
          reasons,
        });
      }
    });

    return items;
  }, [activeStudents, classFilter, notes, attendanceSessions, classes]);

  const filterConfigs: FilterConfig[] = [
    {
      id: 'class-filter',
      label: 'Kelas',
      value: classFilter,
      onChange: setClassFilter,
      allValue: 'ALL',
      options: [
        { value: 'ALL', label: 'Semua Kelas' },
        ...classes.map((cls) => ({
          value: cls.id,
          label: cls.name,
        })),
      ],
    },
    {
      id: 'category-filter',
      label: 'Aspek',
      value: categoryFilter,
      onChange: setCategoryFilter,
      allValue: 'ALL',
      options: [
        { value: 'ALL', label: 'Semua Aspek' },
        { value: 'MEMBACA', label: 'Literasi Membaca' },
        { value: 'KARAKTER', label: 'Karakter & Budi Pekerti' },
        { value: 'AKADEMIK', label: 'Akademik & Penalaran' },
        { value: 'KEDISIPLINAN', label: 'Kedisiplinan Belajar' },
        { value: 'SOSIAL', label: 'Empati & Sosial' },
      ],
    },
    {
      id: 'followup-filter',
      label: 'Tindak Lanjut',
      value: followUpFilter,
      onChange: setFollowUpFilter,
      allValue: 'ALL',
      options: [
        { value: 'ALL', label: 'Semua Catatan' },
        { value: 'WITH_FOLLOW_UP', label: 'Ada rencana tindak lanjut' },
      ],
    },
  ];

  const tabs: DetailTabItem[] = [
    {
      id: 'observations',
      label: 'Catatan Observasi',
      count: canReadDevelopment ? notes.length : undefined,
    },
    {
      id: 'follow-up',
      label: 'Perlu Tindak Lanjut',
      count: canReadDevelopment ? followUpItems.length : undefined,
    },
  ];

  if (!canReadDevelopment) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Perkembangan & Pendampingan Peserta"
          description="Observasi perkembangan belajar, literasi membaca, dan karakter peserta didik."
        />
        <EmptyState
          icon={Lock}
          title="Catatan perkembangan bersifat rahasia (Confidential)"
          description={`Peran Anda saat ini (${currentUser.role}) tidak memiliki izin 'development.read' untuk membuka catatan observasi perkembangan anak.`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Perkembangan & Pendampingan Peserta"
        description="Refleksi perkembangan literasi membaca, akademik, dan karakter anak dari sesi belajar Sabtu."
        primaryAction={
          canWriteDevelopment ? (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Icon icon={Plus} size="sm" />}
              onClick={() => handleOpenAddModalForStudent()}
            >
              Tambah catatan perkembangan
            </Button>
          ) : undefined
        }
      />

      {/* Safeguarding Notice (Section 18) */}
      <div className="p-4 rounded-control bg-surface-subtle border border-border flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icon
            icon={ShieldCheck}
            size="md"
            className="text-primary shrink-0 mt-0.5"
          />
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                Perlindungan Privasi Anak (Confidential)
              </span>
              <Badge variant="confidential" size="sm">
                Internal Pendamping
              </Badge>
            </div>
            <p className="type-caption text-secondary-foreground leading-relaxed">
              Isi lengkap observasi disembunyikan secara default dan hanya
              dibuka saat diperlukan oleh guru pendamping atau koordinator.
            </p>
          </div>
        </div>
      </div>

      {savedNotice && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 rounded-control bg-success-soft border border-success-border text-success-foreground text-xs font-medium flex items-center gap-2"
        >
          <Icon icon={CheckCircle2} size="sm" className="text-success" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* 2. WORKSPACE TABS */}
      <DetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Bagian perkembangan dan tindak lanjut peserta"
      />

      {/* ========================================================
          TAB 1: OBSERVATION NOTES (Sections 16, 17 & 18)
          Answers: What has been observed? When? In what context? Does anything need follow-up?
         ======================================================== */}
      {activeTab === 'observations' && (
        <div
          id="tabpanel-observations"
          role="tabpanel"
          aria-labelledby="tab-observations"
          className="space-y-6 pt-1"
        >
          <SearchToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Cari nama peserta, kelas, atau guru pendamping..."
            searchAriaLabel="Cari catatan perkembangan peserta"
            filters={filterConfigs}
            totalCount={notes.length}
            filteredCount={filteredNotes.length}
            entityLabel="catatan observasi"
            resultContext={
              filteredNotes.filter((n) => n.hasFollowUp).length > 0
                ? `${
                    filteredNotes.filter((n) => n.hasFollowUp).length
                  } memiliki rencana tindak lanjut`
                : undefined
            }
            onResetAll={handleResetFilters}
          />

          {filteredNotes.length === 0 ? (
            notes.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="Belum ada catatan perkembangan"
                description="Guru pendamping dapat mencatat perkembangan literasi membaca, akademik, maupun karakter peserta setelah sesi belajar selesai."
                action={
                  canWriteDevelopment ? (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Icon icon={Plus} size="xs" />}
                      onClick={() => handleOpenAddModalForStudent()}
                    >
                      Tambah catatan perkembangan
                    </Button>
                  ) : undefined
                }
              />
            ) : searchQuery.trim().length > 0 ? (
              <EmptyState
                icon={SearchX}
                title="Tidak ada catatan yang cocok dengan pencarian"
                description={`Pencarian untuk "${searchQuery}" tidak menemukan peserta atau guru pendamping yang sesuai.`}
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
            ) : (
              <EmptyState
                icon={SlidersHorizontal}
                title="Tidak ada catatan dengan filter yang dipilih"
                description="Atur ulang filter kelas, aspek perkembangan, atau status tindak lanjut untuk melihat rekaman lainnya."
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
            )
          ) : (
            <ul role="list" className="space-y-4">
              {filteredNotes.map((item) => {
                const isRevealed = Boolean(revealedIds[item.id]);
                const catCfg = CATEGORY_CONFIG[item.category] || {
                  label: item.category,
                  variant: 'neutral' as BadgeVariant,
                };

                return (
                  <li
                    key={item.id}
                    className="rounded-card bg-surface border border-border p-5 sm:p-6 space-y-4"
                  >
                    {/* Context Header: Student, Class, Category, Date, Teacher */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Avatar
                          name={item.studentName}
                          size="sm"
                          className="mt-0.5"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {onOpenStudent && item.student ? (
                              <button
                                type="button"
                                onClick={() => onOpenStudent(item.student!.id)}
                                className="text-base font-semibold text-foreground hover:text-primary transition-colors text-left cursor-pointer focus-ring rounded-xs"
                              >
                                {item.studentName}
                              </button>
                            ) : (
                              <h3 className="text-base font-semibold text-foreground">
                                {item.studentName}
                              </h3>
                            )}
                            <Badge variant={catCfg.variant} size="sm">
                              {catCfg.label}
                            </Badge>
                            {item.hasFollowUp && (
                              <Badge variant="warning" size="sm" dot>
                                Perlu tindak lanjut
                              </Badge>
                            )}
                          </div>

                          <p className="type-caption text-secondary-foreground">
                            {item.className} · Sesi {item.date} · Dicatat oleh{' '}
                            <strong className="text-foreground">
                              {item.teacherName}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          leftIcon={
                            <Icon
                              icon={isRevealed ? EyeOff : Eye}
                              size="xs"
                            />
                          }
                          onClick={() => toggleReveal(item.id)}
                        >
                          {isRevealed
                            ? 'Sembunyikan rincian'
                            : 'Buka rincian observasi'}
                        </Button>
                      </div>
                    </div>

                    {/* Brief Progress Summary (Visible Context) */}
                    {item.progressNotes && (
                      <div className="pl-0 sm:pl-11">
                        <p className="text-sm font-medium text-foreground">
                          Kemajuan: {item.progressNotes}
                        </p>
                      </div>
                    )}

                    {/* Progressive Disclosure: Full Observation & Follow-Up Plan */}
                    {isRevealed ? (
                      <div className="pl-0 sm:pl-11 pt-3 border-t border-border-subtle grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-3.5 rounded-control bg-surface-subtle/60 border border-border-subtle space-y-1">
                          <span className="type-caption font-semibold text-secondary-foreground block">
                            Hasil Observasi Selama Sesi
                          </span>
                          <p className="text-foreground leading-relaxed">
                            {item.observation}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-control bg-surface-subtle/60 border border-border-subtle space-y-1">
                          <span className="type-caption font-semibold text-secondary-foreground block">
                            Rencana Tindak Lanjut Pendampingan
                          </span>
                          <p className="text-foreground leading-relaxed">
                            {item.followUp ||
                              'Lanjutkan pendampingan reguler pada sesi Sabtu berikutnya.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="pl-0 sm:pl-11 flex items-center justify-between gap-2 pt-2 border-t border-border-subtle type-caption text-muted-foreground">
                        <span>
                          Uraian observasi lengkap dan rencana tindak lanjut
                          disembunyikan secara default.
                        </span>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => toggleReveal(item.id)}
                        >
                          Buka catatan
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: FOLLOW-UP EXPERIENCE (Section 19)
          Respectful, non-stigmatizing list of students requiring attention
          based on development follow-up plans or recent attendance exceptions.
         ======================================================== */}
      {activeTab === 'follow-up' && (
        <div
          id="tabpanel-follow-up"
          role="tabpanel"
          aria-labelledby="tab-follow-up"
          className="space-y-6 pt-1"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="type-title text-foreground">
                Peserta yang Memerlukan Tindak Lanjut Pendampingan
              </h2>
              <p className="type-caption text-secondary-foreground">
                Berdasarkan rencana tindak lanjut catatan perkembangan terbaru
                dan riwayat kehadiran sesi Sabtu.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <Select
                aria-label="Filter tindak lanjut berdasarkan kelas"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Semua Rombongan Belajar' },
                  ...classes.map((cls) => ({
                    value: cls.id,
                    label: cls.name,
                  })),
                ]}
              />
            </div>
          </div>

          {followUpItems.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="Tidak ada tindak lanjut khusus saat ini"
              description="Seluruh peserta pada kelas yang dipilih hadir secara teratur dan belum memiliki rencana tindak lanjut khusus yang tertunda."
            />
          ) : (
            <ul role="list" className="divide-y divide-border rounded-card bg-surface border border-border overflow-hidden">
              {followUpItems.map(({ student, className, reasons }) => (
                <li
                  key={student.id}
                  className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-surface-subtle/40 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <Avatar
                      name={student.fullName}
                      size="md"
                      className="mt-0.5"
                    />
                    <div className="space-y-2 min-w-0">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-foreground">
                            {student.fullName}
                          </span>
                          <span className="type-caption text-secondary-foreground">
                            ({student.nickname} · {className})
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {reasons.map((r, i) => (
                          <div
                            key={i}
                            className="flex flex-wrap items-center gap-2 text-xs"
                          >
                            <Badge
                              variant={
                                r.type === 'DEVELOPMENT_FOLLOW_UP'
                                  ? 'learning'
                                  : 'warning'
                              }
                              size="sm"
                              dot
                            >
                              {r.label}
                            </Badge>
                            <span className="text-secondary-foreground">
                              {r.detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 pl-13 lg:pl-0">
                    {canWriteDevelopment && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={<Icon icon={Plus} size="xs" />}
                        onClick={() => handleOpenAddModalForStudent(student.id)}
                      >
                        Catat perkembangan
                      </Button>
                    )}
                    {onOpenStudent && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenStudent(student.id)}
                      >
                        Buka profil peserta
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ADD DEVELOPMENT NOTE DIALOG (Section 17) */}
      <Dialog
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setObservationError('');
        }}
        size="md"
        title="Tambah Catatan Perkembangan Peserta"
        description="Catat hasil observasi kualitatif, kemajuan, dan rencana tindak lanjut pendampingan. Data ini bersifat rahasia (Confidential)."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setModalOpen(false);
                setObservationError('');
              }}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="add-development-note-form"
            >
              Simpan catatan perkembangan
            </Button>
          </>
        }
      >
        <form
          id="add-development-note-form"
          onSubmit={handleAddNote}
          noValidate
          className="space-y-5"
        >
          <FormSection
            title="Konteks Pengamatan"
            description="Pilih peserta didik dan aspek pembelajaran atau karakter yang diamati pada sesi Sabtu."
          >
            <Select
              label="Peserta didik"
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              options={students.map((s) => ({
                value: s.id,
                label: `${s.fullName} (${s.nickname} — ${
                  GRADE_LABELS[s.gradeLevel]
                })`,
              }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Aspek perkembangan"
                required
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as StudentDevelopmentNote['category']
                  )
                }
                options={Object.entries(CATEGORY_CONFIG).map(
                  ([val, { label }]) => ({
                    value: val,
                    label,
                  })
                )}
              />

              <Input
                label="Tanggal sesi observasi"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </FormSection>

          <FormSection
            divider
            title="Observasi, Kemajuan & Tindak Lanjut"
            description="Gunakan bahasa yang deskriptif, membangun, dan berfokus pada kebutuhan pendampingan anak."
          >
            <Textarea
              label="Hasil observasi selama sesi berlangsung"
              required
              rows={3}
              value={observation}
              onChange={(e) => {
                setObservation(e.target.value);
                if (observationError) setObservationError('');
              }}
              error={observationError}
              placeholder="Contoh: Anak antusias mengikuti sesi membaca cerita pendek dan berani bertanya saat menemukan kosakata baru..."
            />

            <Input
              label="Ringkasan kemajuan (Opsional)"
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              placeholder="Contoh: Sudah lancar membaca 2 paragraf tanpa mengeja"
            />

            <Textarea
              label="Rencana tindak lanjut pendampingan (Opsional)"
              rows={2}
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Contoh: Diberikan buku bacaan bergambar tingkat lanjut pada sesi Sabtu pekan depan..."
            />
          </FormSection>
        </form>
      </Dialog>
    </div>
  );
};
