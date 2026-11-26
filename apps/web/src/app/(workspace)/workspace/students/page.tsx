import type { Metadata } from "next";
import {
  listAcademicYears,
  listClassesForServiceUnit,
} from "@/features/academic";
import {
  listStudentsForWorkspace,
  StudentsWorkspaceClient,
} from "@/features/students";
import { requireSession } from "@/server/auth/session";
import { can } from "@/server/permissions";

export const instant = false;

export const metadata: Metadata = {
  title: "Peserta Didik | PMKI",
  description:
    "Kelola pendaftaran, verifikasi, dan penempatan kelas peserta didik Rumah Belajar PMKI.",
};

interface StudentsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    year?: string;
    classId?: string;
    level?: string;
    page?: string;
    archived?: string;
  }>;
}

export default async function WorkspaceStudentsPage({
  searchParams,
}: StudentsPageProps) {
  const [session, resolvedParams] = await Promise.all([
    requireSession(),
    searchParams,
  ]);

  const primaryUnitId = session.memberships[0]?.serviceUnitId;
  const search = resolvedParams.search ?? "";
  const status = resolvedParams.status ?? "ALL";
  const academicYearId = resolvedParams.year ?? "ALL";
  const classId = resolvedParams.classId ?? "ALL";
  const educationLevel = resolvedParams.level ?? "ALL";
  const parsedPage = Number.parseInt(resolvedParams.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const canArchiveStudent = can(session, "student.archive", {
    serviceUnitId: primaryUnitId,
  });
  const archivedOnly = canArchiveStudent && resolvedParams.archived === "1";

  const [listRes, classes, academicYears] = await Promise.all([
    listStudentsForWorkspace(session, {
      search,
      status,
      academicYearId,
      classId,
      educationLevel,
      page,
      pageSize: 20,
      archivedOnly,
    }),
    primaryUnitId ? listClassesForServiceUnit(primaryUnitId) : Promise.resolve([]),
    primaryUnitId ? listAcademicYears(primaryUnitId) : Promise.resolve([]),
  ]);

  if (!listRes.success) {
    return (
      <div
        role="alert"
        className="rounded-card border border-danger/30 bg-danger-soft p-6 text-sm text-danger"
      >
        <p className="font-semibold">Akses ditolak</p>
        <p className="mt-1">{listRes.error.message}</p>
      </div>
    );
  }

  const canCreateStudent = can(session, "student.create", {
    serviceUnitId: primaryUnitId,
  });
  const canVerifyStudent = can(session, "student.verify", {
    serviceUnitId: primaryUnitId,
  });
  const canImportStudents = can(session, "student.import", {
    serviceUnitId: primaryUnitId,
  });

  return (
    <StudentsWorkspaceClient
      listResult={listRes.data}
      classes={classes}
      academicYears={academicYears}
      initialFilters={{
        search,
        status,
        academicYearId,
        classId,
        educationLevel,
        page,
        archivedOnly,
      }}
      canCreateStudent={canCreateStudent}
      canVerifyStudent={canVerifyStudent}
      canArchiveStudent={canArchiveStudent}
      canImportStudents={canImportStudents}
    />
  );
}

