import type { Metadata } from "next";
import {
  DevelopmentWorkspaceClient,
  listDevelopmentCategories,
  listDevelopmentNotesForWorkspace,
} from "@/features/development";
import { listStudentsForWorkspace } from "@/features/students";
import { requireSession } from "@/server/auth/session";
import { can } from "@/server/permissions";

export const instant = false;

export const metadata: Metadata = {
  title: "Perkembangan Peserta | PMKI",
  description:
    "Catatan perkembangan peserta didik Rumah Belajar PMKI (berversi, terlindungi privasi confidential, dan mendukung offline Tier A).",
};

interface DevelopmentPageProps {
  searchParams: Promise<{
    studentId?: string;
    categoryId?: string;
  }>;
}

export default async function WorkspaceDevelopmentPage({
  searchParams,
}: DevelopmentPageProps) {
  const [session, resolvedParams] = await Promise.all([
    requireSession(),
    searchParams,
  ]);

  const primaryUnitId = session.memberships[0]?.serviceUnitId;
  const studentId = resolvedParams.studentId ?? "ALL";
  const categoryId = resolvedParams.categoryId ?? "ALL";

  const [notesRes, categories, studentsRes] = await Promise.all([
    listDevelopmentNotesForWorkspace(session, { studentId, categoryId }),
    primaryUnitId
      ? listDevelopmentCategories(primaryUnitId)
      : Promise.resolve([]),
    listStudentsForWorkspace(session, { pageSize: 50 }),
  ]);

  if (!notesRes.success) {
    return (
      <div
        role="alert"
        className="rounded-card border border-danger/30 bg-danger-soft p-6 text-sm text-danger"
      >
        <p className="font-semibold">Akses ditolak</p>
        <p className="mt-1">{notesRes.error.message}</p>
      </div>
    );
  }

  const canCreate =
    can(session, "development.create", { serviceUnitId: primaryUnitId }) ||
    can(session, "development.update", { serviceUnitId: primaryUnitId });

  return (
    <DevelopmentWorkspaceClient
      notes={notesRes.data}
      categories={categories}
      students={studentsRes.success ? studentsRes.data.items : []}
      initialStudentId={studentId}
      initialCategoryId={categoryId}
      canCreate={canCreate}
    />
  );
}

