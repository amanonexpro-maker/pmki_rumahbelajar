import type { Metadata } from "next";
import { listClassesForServiceUnit } from "@/features/academic";
import {
  AttendanceWorkspaceClient,
  getAttendanceSessionWorkspaceView,
  getQuickAttendanceRosterView,
  listAttendanceSessionHistory,
} from "@/features/attendance";
import { requireSession } from "@/server/auth/session";
import { can } from "@/server/permissions";

export const instant = false;

export const metadata: Metadata = {
  title: "Kehadiran | PMKI",
  description:
    "Catat presensi sesi belajar peserta didik Rumah Belajar PMKI (mendukung mode offline Tier A).",
};

interface AttendancePageProps {
  searchParams: Promise<{
    classId?: string;
    date?: string;
    tab?: string;
  }>;
}

export default async function WorkspaceAttendancePage({
  searchParams,
}: AttendancePageProps) {
  const [session, resolvedParams] = await Promise.all([
    requireSession(),
    searchParams,
  ]);

  const primaryUnitId = session.memberships[0]?.serviceUnitId;
  const classes = primaryUnitId
    ? await listClassesForServiceUnit(primaryUnitId)
    : [];

  const selectedClassId = resolvedParams.classId ?? classes[0]?.id ?? "";
  const todayIso = new Date().toISOString().slice(0, 10);
  const selectedDate = resolvedParams.date ?? todayIso;
  const selectedTab = resolvedParams.tab ?? "session";

  const [sessionViewRes, historyRes, quickRes] = await Promise.all([
    selectedClassId
      ? getAttendanceSessionWorkspaceView(session, {
          classId: selectedClassId,
          sessionDate: selectedDate,
        })
      : Promise.resolve(null),
    listAttendanceSessionHistory(session, selectedClassId || undefined),
    getQuickAttendanceRosterView(session, { sessionDate: selectedDate }),
  ]);

  if (sessionViewRes && !sessionViewRes.success) {
    return (
      <div
        role="alert"
        className="rounded-card border border-danger/30 bg-danger-soft p-6 text-sm text-danger"
      >
        <p className="font-semibold">Akses ditolak</p>
        <p className="mt-1">{sessionViewRes.error.message}</p>
      </div>
    );
  }

  const canRecord =
    can(session, "attendance.record", { serviceUnitId: primaryUnitId }) ||
    can(session, "attendance.update", { serviceUnitId: primaryUnitId });

  return (
    <AttendanceWorkspaceClient
      classes={classes}
      sessionView={sessionViewRes?.success ? sessionViewRes.data : null}
      quickRoster={quickRes.success ? quickRes.data : null}
      historyItems={historyRes.success ? historyRes.data : []}
      initialClassId={selectedClassId}
      initialDate={selectedDate}
      initialTab={selectedTab}
      canRecord={canRecord}
    />
  );
}

