import {
  getActiveAcademicYear,
  getClassLearningContext,
  listClassesForServiceUnit,
  listTeachersForServiceUnit,
  resolveTeacherForActor,
} from "@/features/academic";
import { listAttendanceSessionHistory } from "@/features/attendance";
import { listAuditLogsForWorkspace } from "@/features/audit";
import { countRevokedConsentsForDashboard } from "@/features/consent";
import { listGovernanceReportsForWorkspace } from "@/features/governance";
import { countUnreviewedMediaForDashboard } from "@/features/media";
import { countAwaitingPublicationsForDashboard } from "@/features/publishing";
import { countStudentsForDashboard } from "@/features/students";
import { getRoleLabel, type SystemRole } from "@/lib/status";
import type { SessionUser } from "@/server/auth/session";
import { can } from "@/server/permissions/can";
import { formatDateID, formatTimeID } from "@/utils/date-formatter";

export type DashboardTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "learning"
  | "activity";

export interface DashboardSummaryMetricDTO {
  id: string;
  label: string;
  value: string | number;
  context: string;
  href?: string;
}

export interface DashboardAttentionItemDTO {
  id: string;
  category: string;
  title: string;
  detail: string;
  count: number;
  tone: DashboardTone;
  actionLabel: string;
  href: string;
  priority: number;
}

export interface DashboardUpcomingScheduleDTO {
  id: string;
  timeRange: string;
  subjectName: string;
  className: string;
  roomName: string;
  enrolledCount: number;
  teacherName: string;
  isCurrentUserTeacher: boolean;
  canManageAttendance: boolean;
  href: string;
}

export interface DashboardActivityEntryDTO {
  id: string;
  dateGroup: string;
  timeLabel: string;
  title: string;
  context: string;
  tone: DashboardTone;
}

export interface DashboardActionLinkDTO {
  label: string;
  href: string;
}

export interface ContextualDashboardViewModelDTO {
  userName: string;
  primaryRoleLabel: string;
  greeting: string;
  serviceUnitName: string;
  academicYearName: string;
  contextSummarySentence: string;
  primaryAction: DashboardActionLinkDTO | null;
  secondaryAction: DashboardActionLinkDTO | null;
  summaryMetrics: DashboardSummaryMetricDTO[];
  attentionItems: DashboardAttentionItemDTO[];
  upcomingSchedules: DashboardUpcomingScheduleDTO[];
  recentSessionsSummary: {
    latestDateLabel: string;
    recordedClassesCount: number;
    totalClassesCount: number;
    averagePresentRate: number | null;
    canOpenAttendance: boolean;
  };
  activityItems: DashboardActivityEntryDTO[];
  canViewAuditLog: boolean;
}

export function getIndonesianTimeGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 19) return "Selamat sore";
  return "Selamat malam";
}

function formatShortIndonesianDate(isoOrDate: string): string {
  return formatDateID(isoOrDate, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRelativeDateGroupLabel(isoTimestamp: string, now = new Date()): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "Terbaru";

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfTarget = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  return formatShortIndonesianDate(isoTimestamp);
}

/**
 * Sanitizes audit log entries into privacy-safe, human-readable activity items (`UI-UX §24`, `05 §13`).
 * Never exposes student full names, guardian phone numbers, or confidential notes on the overview feed.
 */
function mapPrivacySafeActivityEntry(
  entry: {
    id: string;
    action: string;
    actionLabel: string;
    actorName: string;
    createdAt: string;
  },
  now: Date
): DashboardActivityEntryDTO {
  const dateGroup = getRelativeDateGroupLabel(entry.createdAt, now);
  const timeLabel = formatTimeID(entry.createdAt);

  switch (entry.action) {
    case "StudentRegistered":
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: "Pendaftaran peserta didik baru diterima",
        context: "Portal Pendaftaran Publik · Menunggu verifikasi pengurus",
        tone: "warning",
      };
    case "StudentVerified":
    case "StudentPlaced":
    case "StudentProfileUpdated":
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: "Status pendaftaran & penempatan kelas peserta didik diperbarui",
        context: `Peserta Didik · Oleh ${entry.actorName}`,
        tone: "success",
      };
    case "AttendanceRecorded":
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: "Presensi sesi belajar Sabtu tercatat",
        context: `Kehadiran · Oleh ${entry.actorName}`,
        tone: "primary",
      };
    case "DevelopmentNoteCreated":
    case "DevelopmentNoteUpdated":
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: "Catatan perkembangan peserta didik diperbarui",
        context: `Perkembangan Peserta · Oleh ${entry.actorName}`,
        tone: "learning",
      };
    case "ConsentUpdated":
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: "Status persetujuan data atau foto & video diperbarui",
        context: `Persetujuan · Oleh ${entry.actorName}`,
        tone: "info",
      };
    case "MediaUploaded":
    case "MediaPrivacyReviewed":
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: "Dokumentasi kegiatan & tinjauan privasi diperbarui",
        context: `Dokumentasi · Oleh ${entry.actorName}`,
        tone: "info",
      };
    case "PublicationDraftCreated":
    case "PublicationStatusChanged":
    case "PublicationPublished":
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title:
          entry.action === "PublicationPublished"
            ? "Konten publikasi diterbitkan ke situs publik"
            : "Status konten publikasi diperbarui",
        context: `Publikasi · Oleh ${entry.actorName}`,
        tone: "activity",
      };
    case "ReportCreated":
    case "ReportStatusChanged":
    case "ReportApproved":
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title:
          entry.action === "ReportApproved"
            ? "Laporan pelayanan disetujui secara final"
            : "Alur peninjauan laporan pelayanan diperbarui",
        context: `Laporan · Oleh ${entry.actorName}`,
        tone: entry.action === "ReportApproved" ? "success" : "info",
      };
    default:
      return {
        id: entry.id,
        dateGroup,
        timeLabel,
        title: entry.actionLabel,
        context: `Ruang Kerja Pelayanan · Oleh ${entry.actorName}`,
        tone: "neutral",
      };
  }
}

/**
 * Contextual Dashboard Application Service (`UI-3`, `UI-UX §24`, `11 §20–21`).
 * Mental Model: Orientation -> Operational Summary Strip -> Needs Attention -> Upcoming Work -> Recent Activity.
 * Strictly aggregates data through domain Public APIs (`academic`, `students`, `attendance`, `governance`, `consent`, `media`, `publishing`, `audit`).
 */
export async function buildContextualDashboardViewModel(
  session: SessionUser,
  now = new Date()
): Promise<ContextualDashboardViewModelDTO> {
  const serviceUnitId = session.memberships[0]?.serviceUnitId;
  const primaryRole = (session.roles[0] ?? "TEACHER") as SystemRole;
  const primaryRoleLabel = getRoleLabel(primaryRole) ?? primaryRole;

  const hasPerm = (perm: string) =>
    can(session, perm, serviceUnitId ? { serviceUnitId } : undefined);

  // Chunk 1: Academic Context (Classes, Teachers, Active Academic Year, Schedules)
  const [activeYear, classesList, teachersList, matchedTeacher] =
    serviceUnitId
      ? await Promise.all([
          getActiveAcademicYear(serviceUnitId),
          listClassesForServiceUnit(serviceUnitId),
          listTeachersForServiceUnit(serviceUnitId),
          resolveTeacherForActor(serviceUnitId, session.id),
        ])
      : [null, [], [], null];

  // Chunk 2: Class Learning Contexts, limited to four concurrent classes.
  const classContexts: Awaited<ReturnType<typeof getClassLearningContext>>[] = [];
  for (let i = 0; i < classesList.length; i += 4) {
    const batch = classesList.slice(i, i + 4);
    classContexts.push(
      ...(await Promise.all(batch.map((cls) => getClassLearningContext(cls.id))))
    );
  }

  // Chunk 3a: Operational Aggregates (Targeted students count, attendance history, governance reports)
  const [studentCounts, attendanceResult, reportsResult] = await Promise.all([
    hasPerm("student.read")
      ? countStudentsForDashboard(session)
      : Promise.resolve({
          activeCount: 0,
          pendingVerificationCount: 0,
          verifiedAwaitingClassCount: 0,
        }),
    hasPerm("attendance.read") && serviceUnitId
      ? listAttendanceSessionHistory(session, serviceUnitId)
      : Promise.resolve(null),
    hasPerm("report.read")
      ? listGovernanceReportsForWorkspace(session)
      : Promise.resolve(null),
  ]);

  // Chunk 3b: Targeted Auxiliary Counts & Audit Feed (Zero loops, zero over-fetching, connection-pool safe <= 4)
  const [
    revokedOrDeniedConsentCount,
    unreviewedMediaCount,
    publicationsAwaitingPublishCount,
    auditRes,
  ] = await Promise.all([
    hasPerm("consent.read")
      ? countRevokedConsentsForDashboard(session)
      : Promise.resolve(0),
    hasPerm("media.read")
      ? countUnreviewedMediaForDashboard(session)
      : Promise.resolve(0),
    hasPerm("publication.create") ||
    hasPerm("publication.review") ||
    hasPerm("publication.publish")
      ? countAwaitingPublicationsForDashboard(session)
      : Promise.resolve(0),
    hasPerm("audit.read")
      ? listAuditLogsForWorkspace(session, { page: 1, pageSize: 8 })
      : Promise.resolve(null),
  ]);

  const activeStudentsCount = studentCounts.activeCount;
  const pendingVerificationCount = studentCounts.pendingVerificationCount;
  const verifiedAwaitingClassCount = studentCounts.verifiedAwaitingClassCount;

  const totalEnrolledAcrossClasses = classesList.reduce(
    (sum, cls) => sum + cls.enrolledCount,
    0
  );

  const attendanceHistory =
    attendanceResult && attendanceResult.success ? attendanceResult.data : [];

  const latestSessionDate = attendanceHistory[0]?.sessionDate ?? null;
  const sessionsOnLatestDate = latestSessionDate
    ? attendanceHistory.filter((s) => s.sessionDate === latestSessionDate)
    : [];
  const recordedClassIdsOnLatest = new Set(
    sessionsOnLatestDate.map((s) => s.classId)
  );
  const unrecordedClasses = classesList.filter(
    (c) => !recordedClassIdsOnLatest.has(c.id)
  );

  const attendanceTotals = attendanceHistory.reduce(
    (acc, sess) => ({
      present: acc.present + sess.presentCount,
      total: acc.total + sess.totalRecorded,
    }),
    { present: 0, total: 0 }
  );
  const averagePresentRate =
    attendanceTotals.total > 0
      ? Math.round((attendanceTotals.present / attendanceTotals.total) * 100)
      : null;

  const reportsItems =
    reportsResult && reportsResult.success ? reportsResult.data : [];

  const reportsInReview = reportsItems.filter(
    (r) => r.status === "PROGRAM_REVIEW" || r.status === "UNIT_VALIDATION"
  );
  const reportsAwaitingApproval = reportsItems.filter(
    (r) => r.status === "ORGANIZATION_APPROVAL"
  );

  // 6. Build Role-Aware "Perlu perhatian" (Needs Attention) Items
  const rawAttentionItems: DashboardAttentionItemDTO[] = [];

  if (
    hasPerm("student.verify") &&
    (pendingVerificationCount > 0 || verifiedAwaitingClassCount > 0)
  ) {
    const totalPending =
      pendingVerificationCount + verifiedAwaitingClassCount;
    const details: string[] = [];
    if (pendingVerificationCount > 0) {
      details.push(`${pendingVerificationCount} menunggu verifikasi pendaftaran`);
    }
    if (verifiedAwaitingClassCount > 0) {
      details.push(`${verifiedAwaitingClassCount} siap ditempatkan ke kelas`);
    }

    rawAttentionItems.push({
      id: "attention-registrations",
      category: "Pendaftaran",
      title: `Ada ${totalPending} peserta didik menunggu verifikasi atau penempatan kelas`,
      detail: details.join(" · "),
      count: totalPending,
      tone: "warning",
      actionLabel: "Verifikasi pendaftaran",
      href: "/workspace/students",
      priority:
        primaryRole === "UNIT_COORDINATOR" || primaryRole === "PLATFORM_ADMIN"
          ? 1
          : 2,
    });
  }

  if (hasPerm("attendance.record") && unrecordedClasses.length > 0) {
    const firstUnrecordedName = unrecordedClasses[0]?.name ?? "Kelas";
    const title =
      unrecordedClasses.length === 1
        ? `Presensi kelas ${firstUnrecordedName} sesi terakhir belum dicatat`
        : `${unrecordedClasses.length} kelas belum mencatat presensi sesi terakhir`;

    rawAttentionItems.push({
      id: "attention-attendance",
      category: "Kehadiran",
      title,
      detail: latestSessionDate
        ? `Baru ${sessionsOnLatestDate.length} dari ${classesList.length} kelas tercatat pada sesi ${formatShortIndonesianDate(latestSessionDate)}`
        : `Seluruh ${classesList.length} kelas belum memiliki catatan presensi sesi ini`,
      count: unrecordedClasses.length,
      tone: "activity",
      actionLabel: "Catat presensi",
      href: "/workspace/attendance",
      priority: primaryRole === "TEACHER" ? 1 : 3,
    });
  }

  if (hasPerm("report.review") || hasPerm("report.approve")) {
    // Respect Separation of Duties: exclude reports created by current user when role is APPROVER/REVIEWER
    const actionableReports = reportsItems.filter(
      (r) =>
        (r.status === "PROGRAM_REVIEW" ||
          r.status === "UNIT_VALIDATION" ||
          r.status === "ORGANIZATION_APPROVAL") &&
        r.createdBy !== session.id
    );

    if (actionableReports.length > 0) {
      rawAttentionItems.push({
        id: "attention-reports",
        category: "Laporan",
        title: `${actionableReports.length} laporan pelayanan menunggu peninjauan atau persetujuan`,
        detail:
          reportsInReview.length > 0
            ? `Termasuk "${reportsInReview[0]?.title}" (${reportsInReview[0]?.period})`
            : `${reportsAwaitingApproval.length} laporan menunggu persetujuan organisasi`,
        count: actionableReports.length,
        tone: "info",
        actionLabel: "Tinjau laporan",
        href: "/workspace/reports",
        priority:
          primaryRole === "APPROVER" || primaryRole === "REVIEWER" ? 1 : 2,
      });
    }
  }

  if (hasPerm("media.review") && unreviewedMediaCount > 0) {
    rawAttentionItems.push({
      id: "attention-media-privacy",
      category: "Dokumentasi",
      title: `${unreviewedMediaCount} dokumentasi menunggu tinjauan privasi`,
      detail:
        "Dokumentasi wajib diverifikasi kesesuaian persetujuan foto & video sebelum layak tayang di publik",
      count: unreviewedMediaCount,
      tone: "learning",
      actionLabel: "Tinjau dokumentasi",
      href: "/workspace/media",
      priority: primaryRole === "REVIEWER" ? 2 : 4,
    });
  } else if (hasPerm("consent.read") && revokedOrDeniedConsentCount > 0) {
    rawAttentionItems.push({
      id: "attention-consent",
      category: "Persetujuan",
      title: `${revokedOrDeniedConsentCount} catatan pencabutan persetujuan aktif`,
      detail:
        "Pastikan dokumentasi peserta didik terkait tetap terlindungi di arsip internal",
      count: revokedOrDeniedConsentCount,
      tone: "info",
      actionLabel: "Periksa persetujuan",
      href: "/workspace/consent",
      priority: 4,
    });
  }

  if (
    (hasPerm("publication.create") ||
      hasPerm("publication.review") ||
      hasPerm("publication.publish")) &&
    publicationsAwaitingPublishCount > 0
  ) {
    rawAttentionItems.push({
      id: "attention-publishing",
      category: "Publikasi",
      title: `${publicationsAwaitingPublishCount} konten publikasi dalam alur editorial`,
      detail:
        "Konten berita dan agenda siap ditinjau privasi atau diterbitkan ke halaman publik",
      count: publicationsAwaitingPublishCount,
      tone: "primary",
      actionLabel: "Kelola publikasi",
      href: "/workspace/publishing",
      priority: primaryRole === "EDITOR" ? 1 : 5,
    });
  }

  const attentionItems = rawAttentionItems.sort(
    (a, b) => a.priority - b.priority
  );

  // 7. Build Upcoming Saturday Learning Schedule ("Jadwal belajar")
  const upcomingSchedules: DashboardUpcomingScheduleDTO[] = [];
  for (const ctx of classContexts) {
    if (!ctx) continue;
    const isCurrentUserMainTeacher = Boolean(
      matchedTeacher &&
        ctx.classInfo.mainTeacherName &&
        matchedTeacher.name.toLowerCase() ===
          ctx.classInfo.mainTeacherName.toLowerCase()
    );

    if (ctx.schedules.length > 0) {
      for (const sch of ctx.schedules) {
        const isScheduleTeacher = Boolean(
          matchedTeacher &&
            sch.teacherName.toLowerCase() === matchedTeacher.name.toLowerCase()
        );
        upcomingSchedules.push({
          id: sch.id,
          timeRange: `${sch.startTime} – ${sch.endTime}`,
          subjectName: sch.subjectName,
          className: ctx.classInfo.name,
          roomName:
            sch.location ?? ctx.classInfo.roomName ?? "Ruang Belajar",
          enrolledCount: ctx.classInfo.enrolledCount,
          teacherName:
            sch.teacherName ||
            ctx.classInfo.mainTeacherName ||
            "Pengajar Rumah Belajar",
          isCurrentUserTeacher:
            isCurrentUserMainTeacher || isScheduleTeacher,
          canManageAttendance: hasPerm("attendance.read"),
          href: `/workspace/attendance?classId=${ctx.classInfo.id}`,
        });
      }
    } else {
      upcomingSchedules.push({
        id: `cls-${ctx.classInfo.id}`,
        timeRange: "15:00 – 17:00",
        subjectName: "Sesi Bimbingan Belajar Sabtu",
        className: ctx.classInfo.name,
        roomName: ctx.classInfo.roomName ?? "Ruang Belajar",
        enrolledCount: ctx.classInfo.enrolledCount,
        teacherName:
          ctx.classInfo.mainTeacherName ?? "Pengajar Rumah Belajar",
        isCurrentUserTeacher: isCurrentUserMainTeacher,
        canManageAttendance: hasPerm("attendance.read"),
        href: `/workspace/attendance?classId=${ctx.classInfo.id}`,
      });
    }
  }

  upcomingSchedules.sort((a, b) => {
    if (a.isCurrentUserTeacher && !b.isCurrentUserTeacher) return -1;
    if (!a.isCurrentUserTeacher && b.isCurrentUserTeacher) return 1;
    return a.timeRange.localeCompare(b.timeRange);
  });

  // 8. Lightweight Operational Summary Strip (No isolated KPI cards, no charts — UI-UX §24)
  const summaryMetrics: DashboardSummaryMetricDTO[] = [
    {
      id: "metric-students",
      label: "Peserta didik terdaftar",
      value: Math.max(activeStudentsCount, totalEnrolledAcrossClasses),
      context:
        pendingVerificationCount + verifiedAwaitingClassCount > 0
          ? `${activeStudentsCount} aktif belajar · ${pendingVerificationCount + verifiedAwaitingClassCount} proses pendaftaran`
          : `${activeStudentsCount} peserta didik aktif belajar`,
      href: hasPerm("student.read") ? "/workspace/students" : undefined,
    },
    {
      id: "metric-classes",
      label: "Kelas aktif",
      value: classesList.length,
      context: `Tahun ajaran ${activeYear?.name ?? "2026/2027"}`,
      href: hasPerm("class.read") ? "/workspace/academic" : undefined,
    },
    {
      id: "metric-teachers",
      label: "Pengajar",
      value: teachersList.length,
      context: "Pendamping sesi belajar Sabtu",
      href: hasPerm("teacher.read") ? "/workspace/academic" : undefined,
    },
    {
      id: "metric-attendance",
      label: "Rata-rata kehadiran",
      value: averagePresentRate !== null ? `${averagePresentRate}%` : "—",
      context: `${attendanceHistory.length} sesi kelas tercatat`,
      href: hasPerm("attendance.read") ? "/workspace/attendance" : undefined,
    },
  ];

  // 9. Role-Contextual Primary & Secondary Actions
  let primaryAction: DashboardActionLinkDTO | null = null;
  let secondaryAction: DashboardActionLinkDTO | null = null;

  if (primaryRole === "TEACHER") {
    if (hasPerm("attendance.record")) {
      primaryAction = {
        label: "Catat presensi",
        href: "/workspace/attendance",
      };
    }
    if (hasPerm("development.create")) {
      secondaryAction = {
        label: "Tambah catatan perkembangan",
        href: "/workspace/development",
      };
    }
  } else if (primaryRole === "APPROVER" || primaryRole === "REVIEWER") {
    if (hasPerm("report.read")) {
      primaryAction = {
        label: "Tinjau laporan",
        href: "/workspace/reports",
      };
    }
    if (hasPerm("media.review")) {
      secondaryAction = {
        label: "Tinjau dokumentasi",
        href: "/workspace/media",
      };
    } else if (hasPerm("publication.read")) {
      secondaryAction = {
        label: "Lihat publikasi",
        href: "/workspace/publishing",
      };
    }
  } else if (primaryRole === "EDITOR") {
    if (hasPerm("publication.create")) {
      primaryAction = {
        label: "Buat publikasi",
        href: "/workspace/publishing",
      };
    }
    if (hasPerm("media.create")) {
      secondaryAction = {
        label: "Unggah dokumentasi",
        href: "/workspace/media",
      };
    }
  } else if (primaryRole === "AUDITOR") {
    if (hasPerm("audit.read")) {
      primaryAction = {
        label: "Lihat jejak audit",
        href: "/workspace/audit",
      };
    }
    if (hasPerm("report.read")) {
      secondaryAction = {
        label: "Lihat laporan",
        href: "/workspace/reports",
      };
    }
  } else {
    // UNIT_COORDINATOR, PROGRAM_COORDINATOR, ORG_ADMIN, PLATFORM_ADMIN
    if (
      hasPerm("student.verify") &&
      pendingVerificationCount + verifiedAwaitingClassCount > 0
    ) {
      primaryAction = {
        label: "Verifikasi pendaftaran",
        href: "/workspace/students",
      };
      if (hasPerm("attendance.record")) {
        secondaryAction = {
          label: "Catat presensi",
          href: "/workspace/attendance",
        };
      }
    } else if (hasPerm("attendance.record")) {
      primaryAction = {
        label: "Catat presensi",
        href: "/workspace/attendance",
      };
      if (hasPerm("student.read")) {
        secondaryAction = {
          label: "Daftar peserta didik",
          href: "/workspace/students",
        };
      }
    }
  }

  const contextSummarySentence =
    attentionItems.length > 0
      ? `Terdapat ${attentionItems.length} kategori tindak lanjut operasional yang memerlukan perhatian Anda hari ini untuk mendukung kegiatan belajar hari Sabtu.`
      : "Seluruh administrasi pendaftaran, presensi, dan pelaporan pelayanan dalam cakupan tugas Anda saat ini telah tertangani dengan baik.";

  // 10. Privacy-Safe Recent Activity Feed (via Audit Public API or synthesized operational summary)
  const canViewAuditLog = hasPerm("audit.read");
  let activityItems: DashboardActivityEntryDTO[] = [];

  if (canViewAuditLog && auditRes && auditRes.success) {
    activityItems = auditRes.data.items
      .map((item) => mapPrivacySafeActivityEntry(item, now))
      .slice(0, 6);
  }

  if (activityItems.length === 0) {
    // Provide calm, privacy-safe operational activity entries for roles without audit.read
    if (latestSessionDate) {
      activityItems.push({
        id: "act-latest-attendance",
        dateGroup: getRelativeDateGroupLabel(latestSessionDate, now),
        timeLabel: "17:00",
        title: "Presensi sesi belajar Sabtu tercatat",
        context: `${sessionsOnLatestDate.length} kelas tercatat pada buku presensi`,
        tone: "primary",
      });
    }
    if (activeStudentsCount > 0) {
      activityItems.push({
        id: "act-active-students",
        dateGroup: "Terbaru",
        timeLabel: "",
        title: "Status pendaftaran & penempatan kelas peserta didik aktif",
        context: `${activeStudentsCount} peserta didik terdaftar aktif pada tahun ajaran ${activeYear?.name ?? "2026/2027"}`,
        tone: "success",
      });
    }
  }

  return {
    userName: session.name,
    primaryRoleLabel,
    greeting: getIndonesianTimeGreeting(now),
    serviceUnitName: "Rumah Belajar Griya Asih Lawang",
    academicYearName: activeYear?.name ?? "2026/2027",
    contextSummarySentence,
    primaryAction,
    secondaryAction,
    summaryMetrics,
    attentionItems,
    upcomingSchedules,
    recentSessionsSummary: {
      latestDateLabel: latestSessionDate
        ? formatShortIndonesianDate(latestSessionDate)
        : "Belum ada sesi",
      recordedClassesCount: sessionsOnLatestDate.length,
      totalClassesCount: classesList.length,
      averagePresentRate,
      canOpenAttendance: hasPerm("attendance.read"),
    },
    activityItems,
    canViewAuditLog,
  };
}
