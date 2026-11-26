import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listClassesForServiceUnit } from "@/features/academic";
import { listEntityAuditLogs } from "@/features/audit";
import {
  getStudentDetailForWorkspace,
  StudentDetailClient,
} from "@/features/students";
import { requireSession } from "@/server/auth/session";
import { can } from "@/server/permissions";

export const instant = false;

export const metadata: Metadata = {
  title: "Profil Peserta Didik | PMKI",
  description:
    "Detail profil, verifikasi pendaftaran, penempatan kelas, dan riwayat audit peserta didik.",
};

interface StudentDetailPageProps {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function WorkspaceStudentDetailPage({
  params,
  searchParams,
}: StudentDetailPageProps) {
  const [session, { studentId }, resolvedSearch] = await Promise.all([
    requireSession(),
    params,
    searchParams,
  ]);

  const detailRes = await getStudentDetailForWorkspace(session, studentId);
  if (!detailRes.success) {
    if (detailRes.error.code === "RESOURCE_NOT_FOUND") {
      notFound();
    }
    return (
      <div
        role="alert"
        className="rounded-card border border-danger/30 bg-danger-soft p-6 text-sm text-danger"
      >
        <p className="font-semibold">Akses ditolak</p>
        <p className="mt-1">{detailRes.error.message}</p>
      </div>
    );
  }

  const student = detailRes.data;
  const [classes, rawAuditLogs] = await Promise.all([
    listClassesForServiceUnit(student.serviceUnitId, student.academicYearId),
    listEntityAuditLogs("student", student.id),
  ]);

  const auditLogs = rawAuditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    description: log.description,
    createdAt: log.createdAt.toISOString(),
  }));

  const canVerifyStudent = can(session, "student.verify", {
    serviceUnitId: student.serviceUnitId,
  });
  const canUpdateStudent = can(session, "student.update", {
    serviceUnitId: student.serviceUnitId,
  });
  const canArchiveStudent = can(session, "student.archive", {
    serviceUnitId: student.serviceUnitId,
  });
  const canUpdateGuardian = can(session, "guardian.update", {
    serviceUnitId: student.serviceUnitId,
  });

  return (
    <StudentDetailClient
      student={student}
      classes={classes}
      auditLogs={auditLogs}
      canVerifyStudent={canVerifyStudent}
      canUpdateStudent={canUpdateStudent}
      canArchiveStudent={canArchiveStudent}
      canUpdateGuardian={canUpdateGuardian}
      initialTab={resolvedSearch.tab ?? "overview"}
    />
  );
}

