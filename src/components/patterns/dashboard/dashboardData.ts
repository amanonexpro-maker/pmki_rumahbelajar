import { can } from '../../../permissions/can.ts';
import { storage } from '../../../services/storage.ts';
import {
  AuditLogEntry,
  Permission,
  Role,
  User,
} from '../../../types/index.ts';
import type { BadgeVariant } from '../../ui/index.ts';

export interface DashboardSummaryItem {
  id: string;
  label: string;
  value: string | number;
  context: string;
  destination?: string;
}

export interface DashboardAttentionItem {
  id: string;
  category: string;
  title: string;
  detail: string;
  count: number;
  variant: BadgeVariant;
  actionLabel: string;
  destination: string;
  priority: number;
}

export interface DashboardUpcomingItem {
  id: string;
  timeRange: string;
  subjectName: string;
  className: string;
  roomName: string;
  enrolledCount: number;
  teacherName: string;
  isCurrentUserTeacher: boolean;
  canManageAttendance: boolean;
}

export interface DashboardActivityItem {
  id: string;
  dateGroup: string;
  timeLabel: string;
  title: string;
  context: string;
  categoryVariant: BadgeVariant;
}

export interface DashboardPrimaryAction {
  label: string;
  destination: string;
}

export interface DashboardViewModel {
  currentUser: User;
  roleLabel: string;
  greeting: string;
  serviceUnitName: string;
  academicYearName: string;
  contextSummarySentence: string;
  primaryAction: DashboardPrimaryAction | null;
  secondaryAction: DashboardPrimaryAction | null;
  summaryMetrics: DashboardSummaryItem[];
  attentionItems: DashboardAttentionItem[];
  upcomingItems: DashboardUpcomingItem[];
  recentSessionsSummary: {
    latestDateLabel: string;
    recordedClassesCount: number;
    totalClassesCount: number;
    averagePresentRate: number | null;
    canOpenAttendance: boolean;
  };
  activityItems: DashboardActivityItem[];
  canViewAuditLog: boolean;
}

const ROLE_LABELS_ID: Record<Role, string> = {
  PLATFORM_ADMIN: 'Administrator Platform',
  ORG_ADMIN: 'Administrator Organisasi',
  UNIT_COORDINATOR: 'Koordinator Unit Pelayanan',
  PROGRAM_COORDINATOR: 'Koordinator Program',
  TEACHER: 'Guru Pendamping',
  VOLUNTEER: 'Relawan Pendamping',
  EDITOR: 'Editor Publikasi',
  REVIEWER: 'Peninjau Laporan',
  APPROVER: 'Penyetuju Sinodal (BPH Mupel)',
  AUDITOR: 'Auditor Internal',
  STAKEHOLDER: 'Pemangku Kepentingan',
};

export function getTimeGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

export function formatIndonesianDate(isoOrDate: string): string {
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) return isoOrDate;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function getRelativeDateGroup(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return 'Terbaru';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  return formatIndonesianDate(isoTimestamp);
}

/**
 * Maps raw AuditLogEntry into privacy-safe, human-readable Indonesian sentences.
 * Never exposes student names, guardian info, confidential notes, or technical payloads (Section 8 & 18).
 */
function sanitizeAuditEntry(entry: AuditLogEntry): DashboardActivityItem | null {
  if (entry.action === 'USER_ROLE_SWITCH') {
    return null;
  }

  const roleLabel =
    ROLE_LABELS_ID[entry.actorRole as Role] || 'Pengurus';
  const dateGroup = getRelativeDateGroup(entry.timestamp);
  const parsed = new Date(entry.timestamp);
  const timeLabel = Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  switch (entry.action) {
    case 'PUBLIC_REGISTRATION_SUBMITTED':
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: 'Pendaftaran peserta didik baru diterima',
        context: 'Portal Pendaftaran Publik · Menunggu verifikasi pengurus',
        categoryVariant: 'warning',
      };
    case 'REGISTRATION_VERIFIED':
    case 'STUDENT_STATUS_UPDATED':
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: 'Status pendaftaran & penempatan kelas peserta diperbarui',
        context: `Administrasi Siswa · Oleh ${roleLabel}`,
        categoryVariant: 'success',
      };
    case 'ATTENDANCE_RECORDED':
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: 'Presensi sesi belajar Sabtu tercatat',
        context: `Kegiatan Belajar · Oleh ${entry.actorName}`,
        categoryVariant: 'primary',
      };
    case 'DEVELOPMENT_NOTE_CREATED':
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: 'Catatan perkembangan peserta didik ditambahkan',
        context: `Pendampingan Siswa · Oleh ${roleLabel}`,
        categoryVariant: 'learning',
      };
    case 'CONSENT_UPDATED':
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: 'Preferensi izin privasi & dokumentasi diperbarui',
        context: `Perlindungan Data · Oleh ${roleLabel}`,
        categoryVariant: 'info',
      };
    case 'MEDIA_PRIVACY_REVIEW':
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: 'Kelayakan privasi dokumentasi foto ditinjau',
        context: `Kurasi Media · Oleh ${entry.actorName}`,
        categoryVariant: 'info',
      };
    case 'PUBLICATION_CREATED':
    case 'PUBLICATION_STATUS_CHANGED':
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: 'Status materi berita & publikasi diperbarui',
        context: `Publikasi Pelayanan · Oleh ${entry.actorName}`,
        categoryVariant: 'activity',
      };
    case 'REPORT_CREATED':
    case 'REPORT_WORKFLOW_ADVANCED':
    case 'REPORT_FINAL_APPROVED':
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title:
          entry.action === 'REPORT_FINAL_APPROVED'
            ? 'Laporan pelayanan disetujui secara final'
            : 'Alur peninjauan laporan pelayanan diperbarui',
        context: `Pelaporan Pelayanan · Oleh ${entry.actorName}`,
        categoryVariant:
          entry.action === 'REPORT_FINAL_APPROVED' ? 'success' : 'info',
      };
    case 'SYSTEM_INITIALIZATION':
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: 'Ruang kerja pelayanan Rumah Belajar Griya Asih aktif',
        context: 'Platform Pelayanan Terpadu PMKI',
        categoryVariant: 'neutral',
      };
    default:
      return null;
  }
}

export function buildDashboardViewModel(): DashboardViewModel {
  const currentUser = storage.getCurrentUser();
  const serviceUnits = storage.getServiceUnits();
  const academicYears = storage.getAcademicYears();
  const students = storage.getStudents();
  const classes = storage.getClasses();
  const subjects = storage.getSubjects();
  const teachers = storage.getTeachers();
  const schedules = storage.getSchedules();
  const attendanceSessions = storage.getAttendanceSessions();
  const consents = storage.getConsents();
  const mediaAssets = storage.getMediaAssets();
  const publications = storage.getPublications();
  const reports = storage.getReports();
  const auditLogs = storage.getAuditLogs();

  const activeUnit = serviceUnits[0];
  const activeAcademicYear =
    academicYears.find((ay) => ay.isActive) || academicYears[0];

  const hasPerm = (perm: Permission) => can(currentUser, perm);

  // 1. Real Student & Class Calculations
  const activeStudentsCount = students.filter(
    (s) => s.status === 'ACTIVE'
  ).length;
  const totalEnrolledAcrossClasses = classes.reduce(
    (sum, cls) => sum + cls.enrolledCount,
    0
  );
  const pendingVerificationCount = students.filter(
    (s) => s.status === 'SUBMITTED' || s.status === 'PENDING_VERIFICATION'
  ).length;
  const verifiedAwaitingClassCount = students.filter(
    (s) =>
      (s.status === 'VERIFIED' || s.status === 'CLASS_PLACEMENT') &&
      !s.assignedClassId
  ).length;

  // 2. Real Attendance Calculations
  const sortedSessions = [...attendanceSessions].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const latestSessionDate = sortedSessions[0]?.date;
  const sessionsOnLatestDate = latestSessionDate
    ? sortedSessions.filter((s) => s.date === latestSessionDate)
    : [];
  const unrecordedClassesCount = Math.max(
    0,
    classes.length - sessionsOnLatestDate.length
  );

  const totalAttendanceRecords = attendanceSessions.reduce(
    (acc, sess) => ({
      present: acc.present + sess.summary.present,
      total: acc.total + sess.summary.total,
    }),
    { present: 0, total: 0 }
  );
  const averagePresentRate =
    totalAttendanceRecords.total > 0
      ? Math.round(
          (totalAttendanceRecords.present / totalAttendanceRecords.total) * 100
        )
      : null;

  // 3. Real Reports Calculations
  const reportsInProgramReview = reports.filter(
    (r) => r.status === 'PROGRAM_REVIEW' || r.status === 'UNIT_VALIDATION'
  );
  const reportsAwaitingFinalApproval = reports.filter(
    (r) => r.status === 'ORGANIZATION_APPROVAL'
  );
  const reportsPendingAll = reports.filter(
    (r) =>
      r.status === 'PROGRAM_REVIEW' ||
      r.status === 'UNIT_VALIDATION' ||
      r.status === 'ORGANIZATION_APPROVAL' ||
      r.status === 'DRAFT'
  );

  // 4. Real Consent & Publication Calculations
  const studentsMissingConsentRecord = students.filter(
    (s) => !consents.some((c) => c.studentId === s.id)
  ).length;
  const unreviewedMediaCount = mediaAssets.filter(
    (m) => !m.privacyReviewed
  ).length;
  const publicationsAwaitingPublish = publications.filter(
    (p) =>
      p.status === 'DRAFT' ||
      p.status === 'PRIVACY_REVIEW' ||
      p.status === 'APPROVED'
  ).length;

  // 5. Role-Aware Attention Items (Strict RBAC Check: Section 6, 9, 19, 20)
  const rawAttentionItems: DashboardAttentionItem[] = [];

  if (
    hasPerm('student.verify') &&
    (pendingVerificationCount > 0 || verifiedAwaitingClassCount > 0)
  ) {
    const totalStudentActionCount =
      pendingVerificationCount + verifiedAwaitingClassCount;
    const parts: string[] = [];
    if (pendingVerificationCount > 0) {
      parts.push(`${pendingVerificationCount} menunggu verifikasi dokumen`);
    }
    if (verifiedAwaitingClassCount > 0) {
      parts.push(`${verifiedAwaitingClassCount} siap ditempatkan ke rombel kelas`);
    }

    rawAttentionItems.push({
      id: 'att-registrations',
      category: 'Pendaftaran',
      title: `${totalStudentActionCount} calon peserta didik memerlukan tindak lanjut`,
      detail: parts.join(' · '),
      count: totalStudentActionCount,
      variant: 'warning',
      actionLabel: 'Tinjau pendaftaran',
      destination: 'students',
      priority:
        currentUser.role === 'UNIT_COORDINATOR' ||
        currentUser.role === 'PLATFORM_ADMIN'
          ? 1
          : 2,
    });
  }

  if (hasPerm('attendance.record') && unrecordedClassesCount > 0) {
    rawAttentionItems.push({
      id: 'att-attendance',
      category: 'Presensi',
      title: `${unrecordedClassesCount} rombongan belajar belum mencatat presensi sesi terakhir`,
      detail: latestSessionDate
        ? `Baru ${sessionsOnLatestDate.length} dari ${classes.length} kelas tercatat pada sesi ${formatIndonesianDate(latestSessionDate)}`
        : `Seluruh ${classes.length} kelas belum memiliki catatan presensi`,
      count: unrecordedClassesCount,
      variant: 'activity',
      actionLabel: 'Catat presensi',
      destination: 'attendance',
      priority: currentUser.role === 'TEACHER' ? 1 : 3,
    });
  }

  if (
    (hasPerm('report.review') || hasPerm('report.approve')) &&
    reportsPendingAll.length > 0
  ) {
    const actionableReports =
      currentUser.role === 'APPROVER'
        ? reports.filter(
            (r) =>
              r.status !== 'APPROVED' &&
              r.status !== 'REJECTED' &&
              r.createdBy !== currentUser.id
          )
        : reportsPendingAll;

    if (actionableReports.length > 0) {
      rawAttentionItems.push({
        id: 'att-reports',
        category: 'Laporan',
        title: `${actionableReports.length} laporan pelayanan menunggu peninjauan`,
        detail:
          reportsInProgramReview.length > 0
            ? `Termasuk "${reportsInProgramReview[0].title}" (${reportsInProgramReview[0].period})`
            : `${reportsAwaitingFinalApproval.length} laporan dalam tahap persetujuan akhir`,
        count: actionableReports.length,
        variant: 'info',
        actionLabel: 'Periksa laporan',
        destination: 'reports',
        priority:
          currentUser.role === 'APPROVER' || currentUser.role === 'REVIEWER'
            ? 1
            : 2,
      });
    }
  }

  if (
    (hasPerm('consent.read') || hasPerm('media.review')) &&
    (studentsMissingConsentRecord > 0 || unreviewedMediaCount > 0)
  ) {
    const totalPrivacyItems =
      studentsMissingConsentRecord + unreviewedMediaCount;
    rawAttentionItems.push({
      id: 'att-consent',
      category: 'Privasi & Media',
      title: `${totalPrivacyItems} kelengkapan izin privasi perlu diperiksa`,
      detail:
        studentsMissingConsentRecord > 0
          ? `${studentsMissingConsentRecord} peserta baru belum memiliki arsip lembar persetujuan media`
          : `${unreviewedMediaCount} foto dokumentasi menunggu kurasi privasi`,
      count: totalPrivacyItems,
      variant: 'learning',
      actionLabel: 'Kelola izin privasi',
      destination: 'consent-media',
      priority: 4,
    });
  }

  if (
    (hasPerm('publication.write') || hasPerm('publication.publish')) &&
    publicationsAwaitingPublish > 0
  ) {
    rawAttentionItems.push({
      id: 'att-publishing',
      category: 'Publikasi',
      title: `${publicationsAwaitingPublish} materi publikasi belum ditayangkan`,
      detail:
        'Materi pengumuman & berita kegiatan siap ditinjau sebelum terbit di halaman publik',
      count: publicationsAwaitingPublish,
      variant: 'primary',
      actionLabel: 'Buka publikasi',
      destination: 'publishing',
      priority: currentUser.role === 'PROGRAM_COORDINATOR' ? 2 : 5,
    });
  }

  const attentionItems = rawAttentionItems.sort(
    (a, b) => a.priority - b.priority
  );

  // 6. Enriched Upcoming Schedule (Section 7)
  // Find if currentUser matches a teacher profile
  const matchedTeacher = teachers.find(
    (t) =>
      t.email.toLowerCase() === currentUser.email.toLowerCase() ||
      currentUser.name.toLowerCase().includes(t.fullName.toLowerCase().split(' ')[0])
  );

  const enrichedSchedules: DashboardUpcomingItem[] = schedules
    .map((sch) => {
      const cls = classes.find((c) => c.id === sch.classId);
      const subj = subjects.find((s) => s.id === sch.subjectId);
      const teacher = teachers.find((t) => t.id === sch.teacherId);
      const isCurrentUserTeacher = Boolean(
        matchedTeacher && teacher && matchedTeacher.id === teacher.id
      );

      return {
        id: sch.id,
        timeRange: `${sch.timeStart} – ${sch.timeEnd}`,
        subjectName: subj?.name || 'Sesi Pembelajaran',
        className: cls?.name || 'Rombongan Belajar',
        roomName: sch.location || cls?.roomName || 'Ruang Belajar',
        enrolledCount: cls?.enrolledCount || 0,
        teacherName: teacher?.fullName || 'Guru Pendamping',
        isCurrentUserTeacher,
        canManageAttendance: hasPerm('attendance.read'),
      };
    })
    .sort((a, b) => {
      if (a.isCurrentUserTeacher && !b.isCurrentUserTeacher) return -1;
      if (!a.isCurrentUserTeacher && b.isCurrentUserTeacher) return 1;
      return a.timeRange.localeCompare(b.timeRange);
    });

  // 7. Operational Summary Metrics (Lightweight, Real Data Only — Section 5)
  const summaryMetrics: DashboardSummaryItem[] = [
    {
      id: 'metric-students',
      label: 'Peserta didik terdaftar',
      value: totalEnrolledAcrossClasses,
      context: `${activeStudentsCount} profil sampel aktif · ${pendingVerificationCount + verifiedAwaitingClassCount} proses daftar`,
      destination: hasPerm('student.read') ? 'students' : undefined,
    },
    {
      id: 'metric-classes',
      label: 'Rombongan belajar',
      value: classes.length,
      context: `TK, SD Kelas 1–6, SMP 7–8 & Literasi`,
      destination: hasPerm('unit.read') ? 'organization' : undefined,
    },
    {
      id: 'metric-teachers',
      label: 'Guru pendamping',
      value: teachers.length,
      context: `${subjects.length} bidang program utama Sabtu`,
      destination: hasPerm('unit.read') ? 'organization' : undefined,
    },
    {
      id: 'metric-attendance',
      label: 'Rata-rata kehadiran',
      value: averagePresentRate !== null ? `${averagePresentRate}%` : '—',
      context: `${attendanceSessions.length} sesi kelas tercatat di buku presensi`,
      destination: hasPerm('attendance.read') ? 'attendance' : undefined,
    },
  ];

  // 8. Role-Contextual Primary & Secondary Actions + Summary Sentence
  let primaryAction: DashboardPrimaryAction | null = null;
  let secondaryAction: DashboardPrimaryAction | null = null;

  if (currentUser.role === 'TEACHER') {
    if (hasPerm('attendance.record')) {
      primaryAction = {
        label: 'Catat presensi Sabtu',
        destination: 'attendance',
      };
    }
    if (hasPerm('development.write')) {
      secondaryAction = {
        label: 'Tambah catatan perkembangan',
        destination: 'development',
      };
    }
  } else if (currentUser.role === 'APPROVER' || currentUser.role === 'REVIEWER') {
    if (hasPerm('report.read')) {
      primaryAction = {
        label: 'Tinjau laporan pelayanan',
        destination: 'reports',
      };
    }
    if (hasPerm('publication.read')) {
      secondaryAction = {
        label: 'Lihat publikasi',
        destination: 'publishing',
      };
    }
  } else if (currentUser.role === 'PROGRAM_COORDINATOR') {
    if (hasPerm('attendance.record')) {
      primaryAction = {
        label: 'Kelola presensi kelas',
        destination: 'attendance',
      };
    }
    if (hasPerm('publication.write')) {
      secondaryAction = {
        label: 'Kelola publikasi & agenda',
        destination: 'publishing',
      };
    }
  } else {
    // UNIT_COORDINATOR, PLATFORM_ADMIN, ORG_ADMIN
    if (hasPerm('student.verify') && (pendingVerificationCount + verifiedAwaitingClassCount) > 0) {
      primaryAction = {
        label: 'Verifikasi pendaftaran',
        destination: 'students',
      };
      if (hasPerm('attendance.record')) {
        secondaryAction = {
          label: 'Catat presensi Sabtu',
          destination: 'attendance',
        };
      }
    } else if (hasPerm('attendance.record')) {
      primaryAction = {
        label: 'Catat presensi Sabtu',
        destination: 'attendance',
      };
      if (hasPerm('student.read')) {
        secondaryAction = {
          label: 'Data peserta didik',
          destination: 'students',
        };
      }
    }
  }

  const totalAttentionCount = attentionItems.length;
  const contextSummarySentence =
    totalAttentionCount > 0
      ? `Terdapat ${totalAttentionCount} hal operasional yang memerlukan perhatian Anda hari ini untuk mendukung kegiatan belajar hari Sabtu.`
      : 'Seluruh administrasi pendaftaran, presensi, dan pelaporan pelayanan saat ini telah tertangani dengan baik.';

  // 9. Sanitized Recent Activity Feed (Section 8 & 18)
  const activityItems = auditLogs
    .map(sanitizeAuditEntry)
    .filter((item): item is DashboardActivityItem => item !== null)
    .slice(0, 5);

  return {
    currentUser,
    roleLabel: ROLE_LABELS_ID[currentUser.role] || currentUser.role,
    greeting: getTimeGreeting(),
    serviceUnitName: activeUnit?.name || 'Rumah Belajar Griya Asih',
    academicYearName: activeAcademicYear?.name || '2026/2027',
    contextSummarySentence,
    primaryAction,
    secondaryAction,
    summaryMetrics,
    attentionItems,
    upcomingItems: enrichedSchedules,
    recentSessionsSummary: {
      latestDateLabel: latestSessionDate
        ? formatIndonesianDate(latestSessionDate)
        : 'Belum ada sesi',
      recordedClassesCount: sessionsOnLatestDate.length,
      totalClassesCount: classes.length,
      averagePresentRate,
      canOpenAttendance: hasPerm('attendance.read'),
    },
    activityItems,
    canViewAuditLog: hasPerm('audit.read'),
  };
}

