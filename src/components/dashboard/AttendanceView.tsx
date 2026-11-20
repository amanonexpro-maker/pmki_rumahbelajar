/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Eye,
  Lock,
  MapPin,
  Plus,
  RotateCcw,
  Save,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { can } from '../../permissions/can.ts';
import { storage } from '../../services/storage.ts';
import {
  AttendanceSession,
  AttendanceStatus,
  Student,
  StudentDevelopmentNote,
} from '../../types/index.ts';
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
  DataTable,
  DetailTabs,
  EmptyState,
  PageHeader,
  SessionProgress,
  StatSummary,
  type DataTableColumn,
  type DetailTabItem,
} from '../patterns/index.ts';

export interface AttendanceViewProps {
  initialClassId?: string;
  onOpenDevelopment?: (classId?: string, studentId?: string) => void;
  onOpenStudent?: (studentId: string) => void;
}

const ATTENDANCE_STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  badgeVariant: BadgeVariant;
}[] = [
  {
    value: 'PRESENT',
    label: 'Hadir',
    badgeVariant: 'success',
  },
  {
    value: 'PERMITTED',
    label: 'Izin',
    badgeVariant: 'info',
  },
  {
    value: 'SICK',
    label: 'Sakit',
    badgeVariant: 'warning',
  },
  {
    value: 'ABSENT',
    label: 'Tidak hadir',
    badgeVariant: 'danger',
  },
];

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

const DEV_CATEGORY_LABELS: Record<StudentDevelopmentNote['category'], string> =
  {
    KARAKTER: 'Karakter & Budi Pekerti',
    MEMBACA: 'Literasi Membaca',
    AKADEMIK: 'Akademik & Penalaran',
    KEDISIPLINAN: 'Kedisiplinan',
    SOSIAL: 'Empati & Sosial',
  };

/**
 * UI-7 Education Workflows — Attendance, Session Context & Schedule Workspace
 * (Sections 34 & 35 of docs/UI-UX-DESIGN-SYSTEM.md)
 * Cycle: Prepare (Schedule/Class) -> Teach & Record (Session Context & Roster) -> Reflect (Post-session Development Note)
 */
export const AttendanceView: React.FC<AttendanceViewProps> = ({
  initialClassId,
  onOpenDevelopment,
  onOpenStudent,
}) => {
  const currentUser = storage.getCurrentUser();
  const canReadAttendance = can(currentUser, 'attendance.read');
  const canRecordAttendance = can(currentUser, 'attendance.record');
  const canWriteDevelopment = can(currentUser, 'development.write');

  const classes = storage.getClasses();
  const teachers = storage.getTeachers();
  const subjects = storage.getSubjects();
  const schedules = storage.getSchedules();
  const activeStudents = useMemo(
    () => storage.getStudents().filter((s) => s.status === 'ACTIVE'),
    []
  );

  // Teacher-first default class resolution (UI-7 Section 4)
  const matchedTeacher = useMemo(
    () =>
      teachers.find(
        (t) =>
          t.email.toLowerCase() === currentUser.email.toLowerCase() ||
          currentUser.name
            .toLowerCase()
            .includes(t.fullName.split(' ')[1]?.toLowerCase() || '__none__')
      ),
    [teachers, currentUser]
  );

  const defaultClassId = useMemo(() => {
    if (initialClassId && classes.some((c) => c.id === initialClassId)) {
      return initialClassId;
    }
    if (matchedTeacher) {
      const teacherClass = classes.find(
        (c) => c.mainTeacherId === matchedTeacher.id
      );
      if (teacherClass) return teacherClass.id;
    }
    return classes[1]?.id || classes[0]?.id || '';
  }, [initialClassId, matchedTeacher, classes]);

  const [pastSessions, setPastSessions] = useState<AttendanceSession[]>(
    storage.getAttendanceSessions()
  );
  const [activeTab, setActiveTab] = useState<string>('record');

  // Session Context State
  const [selectedClassId, setSelectedClassId] =
    useState<string>(defaultClassId);
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterFilter, setRosterFilter] = useState<
    'ALL' | 'UNRECORDED' | 'EXCEPTIONS'
  >('ALL');

  // Unrecorded / Staged Attendance Map (Section 8: No silent default present)
  const [rosterStatus, setRosterStatus] = useState<
    Record<string, AttendanceStatus | undefined>
  >({});
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string>('');
  const [savedSession, setSavedSession] = useState<AttendanceSession | null>(
    null
  );

  // Unsaved state protection when switching class (Section 28)
  const [pendingClassId, setPendingClassId] = useState<string | null>(null);

  // Post-Session Quick Development Note Modal (Section 15)
  const [postDevModalOpen, setPostDevModalOpen] = useState(false);
  const [devStudentId, setDevStudentId] = useState<string>('');
  const [devCategory, setDevCategory] =
    useState<StudentDevelopmentNote['category']>('MEMBACA');
  const [devProgress, setDevProgress] = useState('');
  const [devObservation, setDevObservation] = useState('');
  const [devFollowUp, setDevFollowUp] = useState('');
  const [devSavedMessage, setDevSavedMessage] = useState('');

  // Sync if parent passes a new initialClassId
  useEffect(() => {
    if (initialClassId && classes.some((c) => c.id === initialClassId)) {
      setSelectedClassId(initialClassId);
      setActiveTab('record');
    }
  }, [initialClassId, classes]);

  // History & Schedule Filter State
  const [historyClassFilter, setHistoryClassFilter] = useState<string>('ALL');
  const [scheduleClassFilter, setScheduleClassFilter] = useState<string>('ALL');
  const [inspectedSession, setInspectedSession] =
    useState<AttendanceSession | null>(null);

  const classObj = classes.find((c) => c.id === selectedClassId);
  const classTeacher = classObj
    ? teachers.find((t) => t.id === classObj.mainTeacherId)
    : undefined;
  const classSchedules = useMemo(
    () => schedules.filter((sch) => sch.classId === selectedClassId),
    [schedules, selectedClassId]
  );
  const classSubjectNames = useMemo(() => {
    const names = classSchedules
      .map((sch) => subjects.find((s) => s.id === sch.subjectId)?.name)
      .filter(Boolean);
    return names.length > 0
      ? Array.from(new Set(names)).join(' · ')
      : 'Literasi Membaca, Matematika, Bahasa Inggris & Karakter';
  }, [classSchedules, subjects]);

  // Students belonging to the selected class (Section 35: Data Integrity)
  const enrolledStudents = useMemo(() => {
    return activeStudents.filter((s) => s.assignedClassId === selectedClassId);
  }, [activeStudents, selectedClassId]);

  // Check if a session is already recorded for this class & date
  const existingSessionForDate = useMemo(
    () =>
      pastSessions.find(
        (sess) =>
          sess.classId === selectedClassId && sess.date === sessionDate
      ),
    [pastSessions, selectedClassId, sessionDate]
  );

  // Live Roster Summary Counts (Section 11 & 12)
  const summaryCounts = useMemo(() => {
    let recorded = 0;
    let present = 0;
    let sick = 0;
    let permitted = 0;
    let absent = 0;

    enrolledStudents.forEach((s) => {
      const st = rosterStatus[s.id];
      if (!st) return;
      recorded += 1;
      if (st === 'PRESENT') present += 1;
      else if (st === 'SICK') sick += 1;
      else if (st === 'PERMITTED') permitted += 1;
      else if (st === 'ABSENT') absent += 1;
    });

    const total = enrolledStudents.length;
    const unrecorded = Math.max(0, total - recorded);

    return {
      total,
      recorded,
      unrecorded,
      present,
      sick,
      permitted,
      absent,
      exceptions: sick + permitted + absent,
    };
  }, [enrolledStudents, rosterStatus]);

  const hasUnsavedStagedMarks =
    summaryCounts.recorded > 0 && !savedSession;

  const applyClassSwitch = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setRosterStatus({});
    setStudentNotes({});
    setValidationError('');
    setSavedSession(null);
    setDevSavedMessage('');
    setRosterSearch('');
    setRosterFilter('ALL');
    setPendingClassId(null);
  };

  const handleRequestClassChange = (newClassId: string) => {
    if (newClassId === selectedClassId) return;
    if (hasUnsavedStagedMarks) {
      setPendingClassId(newClassId);
      return;
    }
    applyClassSwitch(newClassId);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (!canRecordAttendance) return;
    setRosterStatus((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    if (validationError) setValidationError('');
    if (savedSession) setSavedSession(null);
  };

  const handleStudentNoteChange = (studentId: string, note: string) => {
    if (!canRecordAttendance) return;
    setStudentNotes((prev) => ({
      ...prev,
      [studentId]: note,
    }));
  };

  // Explicit Bulk Convenience Actions (Section 8)
  const handleMarkRemainingPresent = () => {
    if (!canRecordAttendance) return;
    setRosterStatus((prev) => {
      const next = { ...prev };
      enrolledStudents.forEach((s) => {
        if (!next[s.id]) {
          next[s.id] = 'PRESENT';
        }
      });
      return next;
    });
    setValidationError('');
    if (rosterFilter === 'UNRECORDED') {
      setRosterFilter('ALL');
    }
  };

  const handleMarkAllPresentExplicit = () => {
    if (!canRecordAttendance) return;
    const next: Record<string, AttendanceStatus> = {};
    enrolledStudents.forEach((s) => {
      next[s.id] = 'PRESENT';
    });
    setRosterStatus(next);
    setValidationError('');
    if (rosterFilter === 'UNRECORDED') {
      setRosterFilter('ALL');
    }
  };

  const handleClearMarks = () => {
    if (!canRecordAttendance) return;
    setRosterStatus({});
    setStudentNotes({});
    setValidationError('');
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRecordAttendance || !classObj || enrolledStudents.length === 0) {
      return;
    }

    // Section 12: Help the teacher notice unresolved attendance before saving
    if (summaryCounts.unrecorded > 0) {
      setValidationError(
        `Masih ada ${summaryCounts.unrecorded} peserta yang belum dicatat kehadirannya. Silakan tandai status masing-masing atau gunakan tombol "Tandai sisa hadir (${summaryCounts.unrecorded})".`
      );
      setRosterFilter('UNRECORDED');
      return;
    }

    const records = enrolledStudents.map((s) => {
      const status = rosterStatus[s.id] || 'PRESENT';
      const note = studentNotes[s.id]?.trim();
      return {
        studentId: s.id,
        studentName: s.fullName,
        status,
        note: status !== 'PRESENT' && note ? note : undefined,
      };
    });

    const createdSession = storage.recordAttendanceSession({
      classId: classObj.id,
      className: classObj.name,
      date: sessionDate,
      records,
      notes: sessionNotes.trim() || undefined,
    });

    setPastSessions([...storage.getAttendanceSessions()]);
    setSessionNotes('');
    setValidationError('');
    setSavedSession(createdSession);
  };

  const handleSavePostSessionDevNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWriteDevelopment || !devStudentId || !devObservation.trim()) return;
    const targetStudent = enrolledStudents.find((s) => s.id === devStudentId);
    if (!targetStudent) return;

    storage.addDevelopmentNote({
      studentId: targetStudent.id,
      studentName: targetStudent.fullName,
      date: sessionDate,
      category: devCategory,
      observation: devObservation.trim(),
      progressNotes: devProgress.trim(),
      followUp: devFollowUp.trim(),
    });

    setPostDevModalOpen(false);
    setDevObservation('');
    setDevProgress('');
    setDevFollowUp('');
    setDevSavedMessage(
      `Catatan perkembangan untuk ${targetStudent.fullName} berhasil disimpan.`
    );
  };

  // Filtered Roster for Display
  const visibleRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    return enrolledStudents.filter((s) => {
      const st = rosterStatus[s.id];
      const matchesFilter =
        rosterFilter === 'ALL'
          ? true
          : rosterFilter === 'UNRECORDED'
          ? !st
          : Boolean(st && st !== 'PRESENT');
      const matchesQuery =
        q.length === 0 ||
        s.fullName.toLowerCase().includes(q) ||
        s.nickname.toLowerCase().includes(q) ||
        s.registrationNumber.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [enrolledStudents, rosterStatus, rosterFilter, rosterSearch]);

  // Filtered Past Sessions
  const filteredPastSessions = useMemo(() => {
    if (historyClassFilter === 'ALL') return pastSessions;
    return pastSessions.filter((sess) => sess.classId === historyClassFilter);
  }, [pastSessions, historyClassFilter]);

  // Filtered Schedules (Section 13 & 14)
  const enrichedSchedules = useMemo(() => {
    return schedules
      .filter(
        (sch) =>
          scheduleClassFilter === 'ALL' || sch.classId === scheduleClassFilter
      )
      .map((sch) => {
        const cls = classes.find((c) => c.id === sch.classId);
        const subj = subjects.find((s) => s.id === sch.subjectId);
        const teacher = teachers.find((t) => t.id === sch.teacherId);
        const rosterCount = activeStudents.filter(
          (s) => s.assignedClassId === sch.classId
        ).length;
        const isCurrentUsersClass =
          matchedTeacher && sch.teacherId === matchedTeacher.id;
        return {
          ...sch,
          className: cls?.name || sch.classId,
          classCategory: cls?.category || 'SD',
          enrolledCount: rosterCount || cls?.enrolledCount || 0,
          capacity: cls?.capacity || 20,
          subjectName: subj?.name || sch.subjectId,
          subjectFocus: subj?.targetFocus || '',
          teacherName: teacher?.fullName || 'Tim Pengajar',
          isCurrentUsersClass,
        };
      });
  }, [
    schedules,
    scheduleClassFilter,
    classes,
    subjects,
    teachers,
    activeStudents,
    matchedTeacher,
  ]);

  const tabs: DetailTabItem[] = [
    { id: 'record', label: 'Catat Presensi Sesi' },
    {
      id: 'schedule',
      label: 'Jadwal Belajar Sabtu',
      count: schedules.length,
    },
    {
      id: 'history',
      label: 'Riwayat Presensi',
      count: pastSessions.length,
    },
  ];

  if (!canReadAttendance) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Presensi & Jadwal Belajar"
          description="Pencatatan kehadiran peserta didik dan jadwal sesi belajar Sabtu."
        />
        <EmptyState
          icon={Lock}
          title="Akses presensi dibatasi untuk peran ini"
          description="Peran Anda saat ini tidak memiliki izin untuk membuka daftar presensi operasional."
        />
      </div>
    );
  }

  const scheduleColumns: DataTableColumn<(typeof enrichedSchedules)[number]>[] =
    [
      {
        id: 'time',
        header: 'Waktu Sesi',
        cell: (row) => (
          <div>
            <span className="text-sm font-semibold text-foreground block">
              {row.dayOfWeek}
            </span>
            <span className="type-caption font-mono text-secondary-foreground">
              {row.timeStart} – {row.timeEnd} WIB
            </span>
          </div>
        ),
      },
      {
        id: 'subject',
        header: 'Program / Materi',
        cell: (row) => (
          <div className="max-w-xs">
            <span className="text-sm font-semibold text-foreground block">
              {row.subjectName}
            </span>
            <span className="type-caption text-secondary-foreground line-clamp-1">
              {row.subjectFocus}
            </span>
          </div>
        ),
      },
      {
        id: 'class',
        header: 'Rombongan Belajar',
        cell: (row) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {row.className}
              </span>
              {row.isCurrentUsersClass && (
                <Badge variant="primary" size="sm">
                  Kelas Anda
                </Badge>
              )}
            </div>
            <span className="type-caption text-secondary-foreground">
              {row.enrolledCount} peserta aktif
            </span>
          </div>
        ),
      },
      {
        id: 'teacher-location',
        header: 'Pengajar & Ruang',
        cell: (row) => (
          <div>
            <span className="text-sm text-foreground block">
              {row.teacherName}
            </span>
            <span className="type-caption text-secondary-foreground flex items-center gap-1 mt-0.5">
              <Icon icon={MapPin} size="xs" />
              <span>{row.location}</span>
            </span>
          </div>
        ),
      },
      {
        id: 'action',
        header: 'Tindakan',
        align: 'right',
        cell: (row) => (
          <Button
            variant="soft"
            size="sm"
            onClick={() => {
              handleRequestClassChange(row.classId);
              setActiveTab('record');
            }}
          >
            Catat presensi →
          </Button>
        ),
      },
    ];

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Presensi & Jadwal Belajar"
        description="Konfirmasi sesi belajar Sabtu, catat kehadiran peserta secara akurat, dan lanjutkan ke catatan perkembangan bila diperlukan."
      />

      {/* 2. WORKSPACE TABS */}
      <DetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Navigasi siklus pembelajaran Sabtu"
      />

      {/* ========================================================
          TAB 1: RECORD ATTENDANCE WORKFLOW (Sections 5–15)
          Flow: Confirm session -> Review roster -> Mark attendance -> Review exceptions -> Save -> After-session reflection
         ======================================================== */}
      {activeTab === 'record' && (
        <div
          id="tabpanel-record"
          role="tabpanel"
          aria-labelledby="tab-record"
          className="space-y-6 pt-1"
        >
          {!canRecordAttendance && (
            <div className="p-4 rounded-control bg-surface-subtle border border-border flex items-center gap-3 type-caption text-secondary-foreground">
              <Icon icon={Lock} size="sm" className="text-muted-foreground" />
              <span>
                Anda sedang dalam mode baca saja (
                <strong>{currentUser.role}</strong>). Hanya Guru Pendamping,
                Koordinator, atau Admin yang dapat menyimpan presensi sesi.
              </span>
            </div>
          )}

          {/* AFTER-SESSION EXPERIENCE (Section 15): Calm completion state + legitimate next action to Development Note */}
          {savedSession && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-card bg-surface border border-success-border p-5 sm:p-6 space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-pill bg-success-soft text-success flex items-center justify-center shrink-0 mt-0.5">
                    <Icon icon={CheckCircle2} size="md" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="success" size="sm">
                        Sesi Presensi Tersimpan
                      </Badge>
                      <span className="type-caption text-secondary-foreground">
                        {savedSession.className} · {savedSession.date}
                      </span>
                    </div>
                    <h3 className="type-title text-foreground">
                      Semua kehadiran sesi telah tercatat (
                      {savedSession.summary.present}/
                      {savedSession.summary.total} hadir)
                    </h3>
                    <p className="type-caption text-secondary-foreground">
                      Hadir: {savedSession.summary.present} · Izin:{' '}
                      {savedSession.summary.permitted} · Sakit:{' '}
                      {savedSession.summary.sick} · Tidak hadir:{' '}
                      {savedSession.summary.absent}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {canWriteDevelopment && enrolledStudents.length > 0 && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      leftIcon={<Icon icon={TrendingUp} size="xs" />}
                      onClick={() => {
                        setDevStudentId(enrolledStudents[0]?.id || '');
                        setPostDevModalOpen(true);
                      }}
                    >
                      Tambah catatan perkembangan
                    </Button>
                  )}
                  {onOpenDevelopment && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onOpenDevelopment(selectedClassId)}
                    >
                      Buka ruang perkembangan
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('history')}
                  >
                    Lihat riwayat
                  </Button>
                </div>
              </div>

              {devSavedMessage && (
                <div className="pt-3 border-t border-border-subtle text-xs font-medium text-primary flex items-center gap-2">
                  <Icon icon={CheckCircle2} size="xs" />
                  <span>{devSavedMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: SESSION CONTEXT HEADER (Section 5) */}
          <section className="rounded-card bg-surface border border-border p-5 sm:p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-border-subtle pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="type-eyebrow text-primary">
                    Konteks Sesi Belajar
                  </span>
                  {matchedTeacher &&
                    classObj?.mainTeacherId === matchedTeacher.id && (
                      <Badge variant="primary" size="sm">
                        Kelas Anda
                      </Badge>
                    )}
                </div>
                <h2 className="type-h3 text-foreground">
                  {classObj?.name || 'Pilih Rombongan Belajar'}
                </h2>
                <p className="type-caption text-secondary-foreground">
                  Program: <strong className="text-foreground">{classSubjectNames}</strong>
                </p>
              </div>

              {/* Session Metadata Pills */}
              <dl className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-6 gap-y-2 text-xs bg-surface-subtle/70 px-4 py-2.5 rounded-control border border-border-subtle">
                <div>
                  <dt className="text-muted-foreground">Waktu</dt>
                  <dd className="font-semibold text-foreground">
                    Sabtu, 15.00 – 17.15 WIB
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ruang Belajar</dt>
                  <dd className="font-semibold text-foreground">
                    {classObj?.roomName || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Guru / Wali Kelas</dt>
                  <dd className="font-semibold text-foreground">
                    {classTeacher?.fullName || 'Tim Pengajar'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Session Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <Select
                label="Rombongan belajar"
                value={selectedClassId}
                onChange={(e) => handleRequestClassChange(e.target.value)}
                options={classes.map((cls) => ({
                  value: cls.id,
                  label: `${cls.name} — ${cls.roomName}`,
                }))}
              />

              <Input
                label="Tanggal sesi belajar"
                type="date"
                value={sessionDate}
                onChange={(e) => {
                  setSessionDate(e.target.value);
                  setSavedSession(null);
                  setValidationError('');
                }}
              />

              <Input
                label="Cari peserta di kelas ini"
                type="search"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Ketik nama atau panggilan..."
              />
            </div>

            {/* Duplicate Session Notice (Section 35: Data Integrity) */}
            {existingSessionForDate && !savedSession && (
              <div className="p-3.5 rounded-control bg-info-soft border border-info-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-info-foreground">
                <div className="flex items-center gap-2">
                  <Icon icon={AlertCircle} size="sm" className="shrink-0" />
                  <span>
                    Presensi untuk <strong>{classObj?.name}</strong> pada
                    tanggal <strong>{sessionDate}</strong> sudah pernah dicatat
                    oleh {existingSessionForDate.recordedByName} (
                    {existingSessionForDate.summary.present}/
                    {existingSessionForDate.summary.total} hadir).
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setInspectedSession(existingSessionForDate)}
                >
                  Lihat rekaman tersebut
                </Button>
              </div>
            )}
          </section>

          {/* STEP 2–5: ROSTER, PROGRESS, EXCEPTION REVIEW & SAVE */}
          {enrolledStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada peserta aktif di kelas ini"
              description="Tempatkan peserta yang telah terverifikasi ke dalam rombongan belajar ini melalui menu Siswa & Pendaftaran."
            />
          ) : (
            <form onSubmit={handleSaveAttendance} className="space-y-6">
              <div className="rounded-card bg-surface border border-border overflow-hidden">
                {/* Lightweight Session Progress (Section 11) */}
                <SessionProgress
                  totalCount={summaryCounts.total}
                  recordedCount={summaryCounts.recorded}
                  presentCount={summaryCounts.present}
                  sickCount={summaryCounts.sick}
                  permittedCount={summaryCounts.permitted}
                  absentCount={summaryCounts.absent}
                />

                {/* Roster Action Bar & Explicit Bulk Convenience (Section 8) */}
                <div className="px-4 sm:px-6 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3">
                  {/* Filter pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      variant={rosterFilter === 'ALL' ? 'soft' : 'ghost'}
                      size="sm"
                      onClick={() => setRosterFilter('ALL')}
                    >
                      Semua ({summaryCounts.total})
                    </Button>
                    <Button
                      type="button"
                      variant={rosterFilter === 'UNRECORDED' ? 'soft' : 'ghost'}
                      size="sm"
                      onClick={() => setRosterFilter('UNRECORDED')}
                    >
                      Belum dicatat ({summaryCounts.unrecorded})
                    </Button>
                    <Button
                      type="button"
                      variant={rosterFilter === 'EXCEPTIONS' ? 'soft' : 'ghost'}
                      size="sm"
                      onClick={() => setRosterFilter('EXCEPTIONS')}
                    >
                      Izin / Sakit / Tidak hadir ({summaryCounts.exceptions})
                    </Button>
                  </div>

                  {/* Explicit Bulk Convenience Buttons */}
                  {canRecordAttendance && (
                    <div className="flex flex-wrap items-center gap-2">
                      {summaryCounts.unrecorded > 0 &&
                        summaryCounts.recorded > 0 && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            leftIcon={<Icon icon={UserCheck} size="xs" />}
                            onClick={handleMarkRemainingPresent}
                          >
                            Tandai sisa hadir ({summaryCounts.unrecorded})
                          </Button>
                        )}
                      {summaryCounts.unrecorded > 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          leftIcon={<Icon icon={UserCheck} size="xs" />}
                          onClick={handleMarkAllPresentExplicit}
                        >
                          Tandai semua hadir ({summaryCounts.total})
                        </Button>
                      )}
                      {summaryCounts.recorded > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          leftIcon={<Icon icon={RotateCcw} size="xs" />}
                          onClick={handleClearMarks}
                        >
                          Atur ulang
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {validationError && (
                  <div
                    role="alert"
                    className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-control bg-warning-soft border border-warning-border text-warning-foreground text-xs font-medium flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={AlertCircle}
                        size="sm"
                        className="shrink-0"
                      />
                      <span>{validationError}</span>
                    </div>
                    {summaryCounts.unrecorded > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleMarkRemainingPresent}
                      >
                        Tandai sisa hadir ({summaryCounts.unrecorded})
                      </Button>
                    )}
                  </div>
                )}

                {/* Roster Rows (Privacy-Safe, Mobile One-Hand Accessible — Sections 9, 10 & 25) */}
                {visibleRoster.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      icon={Users}
                      title={
                        rosterFilter === 'UNRECORDED'
                          ? 'Semua peserta telah dicatat kehadirannya'
                          : rosterFilter === 'EXCEPTIONS'
                          ? 'Tidak ada peserta yang izin, sakit, atau tidak hadir'
                          : 'Tidak ada peserta yang cocok dengan pencarian'
                      }
                      description={
                        rosterFilter === 'UNRECORDED'
                          ? 'Anda dapat langsung meninjau catatan sesi dan menyimpan presensi.'
                          : 'Ubah filter tampilan di atas untuk melihat seluruh daftar peserta kelas.'
                      }
                      action={
                        rosterFilter !== 'ALL' ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setRosterFilter('ALL')}
                          >
                            Tampilkan semua peserta
                          </Button>
                        ) : undefined
                      }
                    />
                  </div>
                ) : (
                  <ul role="list" className="divide-y divide-border">
                    {visibleRoster.map((student, index) => {
                      const currentStatus = rosterStatus[student.id];
                      const isException =
                        Boolean(currentStatus) && currentStatus !== 'PRESENT';

                      return (
                        <li
                          key={student.id}
                          className={`p-4 sm:px-6 transition-colors ${
                            !currentStatus
                              ? 'bg-surface'
                              : isException
                              ? 'bg-warning-soft/15'
                              : 'bg-primary-soft/15'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                            {/* Minimum Necessary Participant Identity (Section 25) */}
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">
                                {index + 1}.
                              </span>
                              <Avatar name={student.fullName} size="sm" />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  {onOpenStudent ? (
                                    <button
                                      type="button"
                                      onClick={() => onOpenStudent(student.id)}
                                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left truncate cursor-pointer focus-ring rounded-xs"
                                    >
                                      {student.fullName}
                                    </button>
                                  ) : (
                                    <span className="text-sm font-semibold text-foreground truncate">
                                      {student.fullName}
                                    </span>
                                  )}
                                  {!currentStatus && (
                                    <Badge variant="neutral" size="sm">
                                      Belum dicatat
                                    </Badge>
                                  )}
                                </div>
                                <p className="type-caption text-secondary-foreground">
                                  Panggilan {student.nickname} ·{' '}
                                  {GRADE_LABELS[student.gradeLevel]}
                                </p>
                              </div>
                            </div>

                            {/* Rapid One-Hand Status Controls (Sections 7, 9 & 10) */}
                            <div
                              role="radiogroup"
                              aria-label={`Status kehadiran ${student.fullName}`}
                              className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full lg:w-auto"
                            >
                              {ATTENDANCE_STATUS_OPTIONS.map((opt) => {
                                const active = currentStatus === opt.value;
                                let activeClass =
                                  'bg-surface text-secondary-foreground border-border hover:border-border-strong hover:text-foreground';

                                if (active) {
                                  if (opt.value === 'PRESENT') {
                                    activeClass =
                                      'bg-primary text-primary-foreground border-primary font-semibold';
                                  } else if (opt.value === 'PERMITTED') {
                                    activeClass =
                                      'bg-info-soft text-info-foreground border-info-border font-semibold ring-1 ring-info';
                                  } else if (opt.value === 'SICK') {
                                    activeClass =
                                      'bg-warning-soft text-warning-foreground border-warning-border font-semibold ring-1 ring-warning';
                                  } else {
                                    activeClass =
                                      'bg-danger-soft text-danger-foreground border-danger-border font-semibold ring-1 ring-danger';
                                  }
                                }

                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    disabled={!canRecordAttendance}
                                    onClick={() =>
                                      handleStatusChange(student.id, opt.value)
                                    }
                                    className={`min-h-10 px-3 py-2 rounded-control border text-xs transition-colors cursor-pointer focus-ring disabled:opacity-60 disabled:cursor-not-allowed ${activeClass}`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Progressive Exception Note Input (Only when PERMITTED, SICK, or ABSENT) */}
                          {isException && (
                            <div className="mt-3 lg:pl-8 max-w-md">
                              <Input
                                label={`Keterangan ${
                                  currentStatus === 'SICK'
                                    ? 'sakit'
                                    : currentStatus === 'PERMITTED'
                                    ? 'izin'
                                    : 'ketidakhadiran'
                                } ${student.nickname} (Opsional)`}
                                value={studentNotes[student.id] || ''}
                                onChange={(e) =>
                                  handleStudentNoteChange(
                                    student.id,
                                    e.target.value
                                  )
                                }
                                placeholder="Contoh: Informasi wali karena demam atau kegiatan sekolah..."
                                disabled={!canRecordAttendance}
                              />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* STEP 4 & 5: EXCEPTION REVIEW & SAVE FOOTER (Section 12 & 27) */}
                <div className="p-5 sm:p-6 bg-surface-subtle/50 border-t border-border space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {summaryCounts.unrecorded > 0 ? (
                      <span className="font-medium text-warning-foreground">
                        Perhatian: <strong>{summaryCounts.unrecorded} peserta</strong>{' '}
                        belum dicatat kehadirannya.
                      </span>
                    ) : (
                      <span className="font-medium text-success">
                        Semua kehadiran ({summaryCounts.total} peserta) telah
                        dicatat
                        {summaryCounts.exceptions > 0
                          ? ` · ${summaryCounts.exceptions} peserta tercatat izin/sakit/tidak hadir.`
                          : ' · Seluruh peserta hadir.'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                    <div className="lg:col-span-8">
                      <Input
                        label="Catatan materi atau jalannya sesi belajar (Opsional)"
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="Contoh: Pendampingan membaca nyaring dan latihan berhitung dasar..."
                        disabled={!canRecordAttendance}
                      />
                    </div>

                    <div className="lg:col-span-4 flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        fullWidth
                        disabled={
                          !canRecordAttendance || enrolledStudents.length === 0
                        }
                        leftIcon={<Icon icon={Save} size="sm" />}
                      >
                        {summaryCounts.unrecorded > 0
                          ? `Simpan presensi (${summaryCounts.recorded}/${summaryCounts.total} dicatat)`
                          : 'Simpan presensi sesi'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: SATURDAY SCHEDULE (Sections 13 & 14)
          Answers: What, When, Which class, Who teaches, Where + Direct path to Attendance
         ======================================================== */}
      {activeTab === 'schedule' && (
        <div
          id="tabpanel-schedule"
          role="tabpanel"
          aria-labelledby="tab-schedule"
          className="space-y-6 pt-1"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="type-title text-foreground">
                Jadwal & Penugasan Kelas Sabtu
              </h2>
              <p className="type-caption text-secondary-foreground">
                Pilih sesi terjadwal untuk langsung membuka daftar presensi
                rombongan belajar terkait.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <Select
                aria-label="Filter jadwal berdasarkan kelas"
                value={scheduleClassFilter}
                onChange={(e) => setScheduleClassFilter(e.target.value)}
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

          <DataTable
            columns={scheduleColumns}
            data={enrichedSchedules}
            getRowKey={(row) => row.id}
            caption="Jadwal belajar hari Sabtu Rumah Belajar Griya Asih"
            renderMobileRow={(row) => (
              <div className="space-y-2.5 py-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="primary" size="sm">
                      {row.dayOfWeek} · {row.timeStart} – {row.timeEnd} WIB
                    </Badge>
                    {row.isCurrentUsersClass && (
                      <Badge variant="learning" size="sm">
                        Kelas Anda
                      </Badge>
                    )}
                  </div>
                  <span className="type-caption text-secondary-foreground">
                    {row.enrolledCount} peserta
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {row.subjectName} — {row.className}
                  </h3>
                  <p className="type-caption text-secondary-foreground mt-0.5">
                    Pengajar: {row.teacherName} · {row.location}
                  </p>
                </div>

                <div className="pt-1">
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      handleRequestClassChange(row.classId);
                      setActiveTab('record');
                    }}
                  >
                    Catat presensi →
                  </Button>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* ========================================================
          TAB 3: ATTENDANCE HISTORY
         ======================================================== */}
      {activeTab === 'history' && (
        <div
          id="tabpanel-history"
          role="tabpanel"
          aria-labelledby="tab-history"
          className="space-y-6 pt-1"
        >
          <StatSummary
            items={[
              {
                id: 'total-sessions',
                label: 'Sesi Tercatat',
                value: `${pastSessions.length} sesi`,
                meta: 'Semester berjalan',
              },
              {
                id: 'avg-attendance',
                label: 'Rata-rata Kehadiran',
                value:
                  pastSessions.length > 0
                    ? `${
                        Math.round(
                          (pastSessions.reduce(
                            (acc, s) =>
                              acc +
                              (s.summary.total > 0
                                ? (s.summary.present / s.summary.total) * 100
                                : 0),
                            0
                          ) /
                            pastSessions.length) *
                            10
                        ) / 10
                      }%`
                    : '0%',
                meta: 'Seluruh rombongan belajar',
              },
              {
                id: 'classes-covered',
                label: 'Rombongan Belajar Aktif',
                value: `${classes.length} kelas`,
                meta: 'Sabtu 15.00 – 17.15 WIB',
              },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="type-title text-foreground">
              Riwayat Sesi Belajar Tercatat
            </h2>
            <div className="w-full sm:w-64">
              <Select
                aria-label="Filter riwayat berdasarkan kelas"
                value={historyClassFilter}
                onChange={(e) => setHistoryClassFilter(e.target.value)}
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

          {filteredPastSessions.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="Belum ada riwayat presensi untuk kelas ini"
              description="Rekaman presensi yang disimpan pada tab Catat Presensi Sesi akan tampil di sini."
            />
          ) : (
            <div className="rounded-card bg-surface border border-border divide-y divide-border">
              {filteredPastSessions.map((sess) => {
                const pct =
                  sess.summary.total > 0
                    ? Math.round(
                        (sess.summary.present / sess.summary.total) * 100
                      )
                    : 0;
                return (
                  <div
                    key={sess.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-subtle/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-foreground">
                          {sess.className}
                        </span>
                        <Badge variant="neutral" size="sm">
                          {sess.date}
                        </Badge>
                        <Badge
                          variant={pct >= 85 ? 'success' : 'warning'}
                          size="sm"
                          dot
                        >
                          {pct}% Hadir ({sess.summary.present}/
                          {sess.summary.total})
                        </Badge>
                      </div>

                      {sess.notes && (
                        <p className="text-sm text-foreground">{sess.notes}</p>
                      )}

                      <p className="type-caption text-secondary-foreground">
                        Dicatat oleh <strong>{sess.recordedByName}</strong> ·{' '}
                        Izin: {sess.summary.permitted} · Sakit:{' '}
                        {sess.summary.sick} · Tidak hadir: {sess.summary.absent}
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Icon icon={Eye} size="xs" />}
                      onClick={() => setInspectedSession(sess)}
                    >
                      Rincian sesi
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 1. UNSAVED ATTENDANCE CONFIRMATION DIALOG (Section 28) */}
      <Dialog
        open={Boolean(pendingClassId)}
        onClose={() => setPendingClassId(null)}
        size="sm"
        title="Beralih kelas sebelum menyimpan presensi?"
        description={`Anda telah menandai kehadiran ${summaryCounts.recorded} peserta di ${classObj?.name} yang belum disimpan. Jika berpindah kelas sekarang, tanda kehadiran yang belum disimpan akan dikosongkan.`}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPendingClassId(null)}
            >
              Tetap di kelas ini
            </Button>
            {pendingClassId && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => applyClassSwitch(pendingClassId)}
              >
                Pindah kelas & kosongkan
              </Button>
            )}
          </>
        }
      >
        <p className="type-caption text-secondary-foreground">
          Simpan presensi terlebih dahulu bila Anda tidak ingin mengulang
          pencatatan untuk kelas ini.
        </p>
      </Dialog>

      {/* 2. AFTER-SESSION DEVELOPMENT NOTE DIALOG (Section 15) */}
      <Dialog
        open={postDevModalOpen}
        onClose={() => setPostDevModalOpen(false)}
        size="md"
        title={`Tambah Catatan Perkembangan — ${classObj?.name}`}
        description="Catat hasil pengamatan belajar atau karakter peserta dari sesi Sabtu ini. Rekaman ini bersifat rahasia (Confidential)."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPostDevModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="post-session-dev-note-form"
            >
              Simpan catatan perkembangan
            </Button>
          </>
        }
      >
        <form
          id="post-session-dev-note-form"
          onSubmit={handleSavePostSessionDevNote}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Peserta didik"
              required
              value={devStudentId}
              onChange={(e) => setDevStudentId(e.target.value)}
              options={enrolledStudents.map((s) => ({
                value: s.id,
                label: `${s.fullName} (${s.nickname})`,
              }))}
            />
            <Select
              label="Aspek pengamatan"
              required
              value={devCategory}
              onChange={(e) =>
                setDevCategory(
                  e.target.value as StudentDevelopmentNote['category']
                )
              }
              options={Object.entries(DEV_CATEGORY_LABELS).map(
                ([val, label]) => ({
                  value: val,
                  label,
                })
              )}
            />
          </div>

          <Input
            label="Ringkasan kemajuan (Opsional)"
            value={devProgress}
            onChange={(e) => setDevProgress(e.target.value)}
            placeholder="Contoh: Mulai lancar membaca kalimat pendek tanpa mengeja"
          />

          <Textarea
            label="Hasil observasi selama sesi berlangsung"
            required
            rows={3}
            value={devObservation}
            onChange={(e) => setDevObservation(e.target.value)}
            placeholder="Tuliskan pengamatan konkret terhadap perkembangan belajar atau perilaku peserta..."
          />

          <Textarea
            label="Rencana tindak lanjut pada sesi berikutnya (Opsional)"
            rows={2}
            value={devFollowUp}
            onChange={(e) => setDevFollowUp(e.target.value)}
            placeholder="Contoh: Dampingan latihan membaca 15 menit awal sesi Sabtu depan..."
          />
        </form>
      </Dialog>

      {/* 3. HISTORICAL SESSION INSPECTION DIALOG */}
      <Dialog
        open={Boolean(inspectedSession)}
        onClose={() => setInspectedSession(null)}
        size="md"
        title={
          inspectedSession
            ? `Rincian Presensi — ${inspectedSession.className}`
            : 'Rincian Presensi'
        }
        description={
          inspectedSession
            ? `Sesi tanggal ${inspectedSession.date} · Dicatat oleh ${inspectedSession.recordedByName}`
            : undefined
        }
        footer={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setInspectedSession(null)}
          >
            Tutup
          </Button>
        }
      >
        {inspectedSession && (
          <div className="space-y-4">
            {inspectedSession.notes && (
              <div className="p-3.5 rounded-control bg-surface-subtle border border-border text-sm text-foreground">
                <span className="type-caption font-semibold text-secondary-foreground block mb-0.5">
                  Catatan Sesi Belajar:
                </span>
                {inspectedSession.notes}
              </div>
            )}

            <ul
              role="list"
              className="divide-y divide-border border border-border rounded-control max-h-80 overflow-y-auto"
            >
              {inspectedSession.records.map((rec) => {
                const statusOpt = ATTENDANCE_STATUS_OPTIONS.find(
                  (o) => o.value === rec.status
                );
                return (
                  <li
                    key={rec.id}
                    className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <span className="font-medium text-foreground block">
                        {rec.studentName}
                      </span>
                      {rec.note && (
                        <span className="type-caption text-secondary-foreground">
                          Ket: {rec.note}
                        </span>
                      )}
                    </div>
                    <Badge
                      variant={statusOpt?.badgeVariant || 'neutral'}
                      size="sm"
                      dot
                    >
                      {statusOpt?.label || rec.status}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Dialog>
    </div>
  );
};
