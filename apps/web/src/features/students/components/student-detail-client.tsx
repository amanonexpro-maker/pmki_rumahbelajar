"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Pencil,
  QrCode,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/compositions";
import {
  DetailTabs,
  EntityHeader,
  FloatingFeedbackToast,
  WorkflowProgress,
  type DetailTabItem,
} from "@/components/patterns";
import {
  Badge,
  Button,
  Icon,
} from "@/components/ui";
import type { ClassSummaryDTO } from "@/features/academic";
import {
  archiveStudentAction,
  placeStudentInClassAction,
  restoreStudentAction,
  updateStudentProfileAction,
  verifyStudentRegistrationAction,
} from "../actions/student-actions";
import type { StudentDetailDTO } from "../types/student-types";
import { buildLifecycleStages } from "../utils/lifecycle-stages";
import type {
  EditStudentProfileFormValues,
  PlaceStudentFormValues,
  VerifyStudentFormValues,
} from "../validators/student-validator";
import { ArchiveStudentSheet } from "./archive-student-sheet";
import { EditStudentProfileSheet } from "./edit-student-profile-sheet";
import { PlaceStudentSheet } from "./place-student-sheet";
import {
  StudentAuditTab,
  type AuditEntrySummary,
} from "./student-audit-tab";
import { StudentLearningTab } from "./student-learning-tab";
import { StudentOverviewTab } from "./student-overview-tab";
import { StudentQrCardSheet } from "./student-qr-card-sheet";
import { VerifyStudentSheet } from "./verify-student-sheet";

export type { AuditEntrySummary };

export interface StudentDetailClientProps {
  student: StudentDetailDTO;
  classes: ClassSummaryDTO[];
  auditLogs: AuditEntrySummary[];
  canVerifyStudent: boolean;
  canUpdateStudent: boolean;
  canArchiveStudent?: boolean;
  initialTab?: string;
}

export function StudentDetailClient({
  student,
  classes,
  auditLogs,
  canVerifyStudent,
  canUpdateStudent,
  canArchiveStudent = false,
  initialTab = "overview",
}: StudentDetailClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = React.useState(initialTab);

  // Verification dialog state
  const [verifyOpen, setVerifyOpen] = React.useState(false);
  const [verifyPending, setVerifyPending] = React.useState(false);

  // Class placement dialog state
  const [placeOpen, setPlaceOpen] = React.useState(false);
  const [placePending, setPlacePending] = React.useState(false);

  // Edit profile dialog state
  const [editOpen, setEditOpen] = React.useState(false);
  const [editPending, setEditPending] = React.useState(false);

  // Archive / restore & QR card dialog state
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [restoreOpen, setRestoreOpen] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);
  const [archivePending, setArchivePending] = React.useState(false);
  const [feedbackToast, setFeedbackToast] = React.useState<{
    tone: "success" | "danger";
    message: string;
  } | null>(null);

  async function handleRestoreStudent(
    reason: string
  ): Promise<{ success: true } | { success: false; error: string }> {
    setArchivePending(true);
    try {
      const res = await restoreStudentAction({
        studentId: student.id,
        reason: reason || undefined,
      });
      if (!res.success) {
        return { success: false, error: res.error.message };
      }
      setRestoreOpen(false);
      setFeedbackToast({
        tone: "success",
        message: `Peserta didik ${student.fullName} berhasil dipulihkan ke daftar aktif.`,
      });
      router.refresh();
      return { success: true };
    } finally {
      setArchivePending(false);
    }
  }

  async function handleArchiveSubmit(
    reason: string
  ): Promise<{ success: true } | { success: false; error: string }> {
    setArchivePending(true);
    try {
      const res = await archiveStudentAction({
        studentId: student.id,
        reason,
      });
      if (!res.success) {
        return { success: false, error: res.error.message };
      }
      setArchiveOpen(false);
      router.push(
        `/workspace/students?notice=archived&name=${encodeURIComponent(student.fullName)}`
      );
      router.refresh();
      return { success: true };
    } finally {
      setArchivePending(false);
    }
  }

  function handleTabChange(nextTab: string) {
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextTab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  async function handleVerifySubmit(
    values: VerifyStudentFormValues
  ): Promise<{ success: true } | { success: false; error: string }> {
    setVerifyPending(true);
    try {
      const res = await verifyStudentRegistrationAction({
        studentId: student.id,
        decision: values.decision,
        reason: values.reason?.trim() || undefined,
      });
      if (!res.success) {
        return { success: false, error: res.error.message };
      }
      setVerifyOpen(false);
      router.refresh();
      return { success: true };
    } finally {
      setVerifyPending(false);
    }
  }

  async function handlePlaceSubmit(
    values: PlaceStudentFormValues
  ): Promise<{ success: true } | { success: false; error: string }> {
    setPlacePending(true);
    try {
      const res = await placeStudentInClassAction({
        studentId: student.id,
        classId: values.classId,
        notes: values.notes?.trim() || undefined,
      });
      if (!res.success) {
        return { success: false, error: res.error.message };
      }
      setPlaceOpen(false);
      router.refresh();
      return { success: true };
    } finally {
      setPlacePending(false);
    }
  }

  async function handleEditSubmit(
    values: EditStudentProfileFormValues
  ): Promise<{ success: true } | { success: false; error: string }> {
    setEditPending(true);
    try {
      const res = await updateStudentProfileAction({
        studentId: student.id,
        fullName: values.fullName,
        nickname: values.nickname,
        gender: values.gender,
        birthDate: values.birthDate,
        educationLevel: values.educationLevel,
        schoolName: values.schoolName || undefined,
        district: values.district,
        isRaalResident: values.isRaalResident,
      });
      if (!res.success) {
        return { success: false, error: res.error.message };
      }
      setEditOpen(false);
      router.refresh();
      return { success: true };
    } finally {
      setEditPending(false);
    }
  }

  const tabs: DetailTabItem[] = [
    { id: "overview", label: "Ringkasan profil" },
    {
      id: "learning",
      label: "Pembelajaran & kelas",
      count: student.learningContext?.schedules.length ?? 0,
    },
    {
      id: "audit",
      label: "Riwayat audit",
      count: auditLogs.length,
    },
  ];

  const isNeedsVerification =
    student.registrationStatus === "SUBMITTED" ||
    student.registrationStatus === "PENDING_VERIFICATION";

  const isPlaceable =
    student.registrationStatus === "VERIFIED" ||
    student.registrationStatus === "CLASS_PLACEMENT" ||
    student.registrationStatus === "WAITLIST" ||
    student.registrationStatus === "ACTIVE";

  return (
    <div className="space-y-6">
      {/* 1. Entity Header */}
      <EntityHeader
        backLabel="Kembali ke daftar peserta didik"
        onBack={() => router.push("/workspace/students")}
        avatarName={student.fullName}
        consentGranted={
          student.consentSummary?.photoVideoConsent === "GRANTED"
        }
        eyebrow={`Nomor pendaftaran: ${student.registrationNumber}`}
        title={student.fullName}
        subtitle={`Panggilan: ${student.nickname} · ${student.educationLevelLabel} · TA ${student.academicYearName}`}
        badges={
          <>
            <StatusBadge
              domain="registration"
              status={student.registrationStatus}
            />
            {student.isRaalResident && (
              <Badge variant="info">Anak asuh RAAL Griya Asih</Badge>
            )}
          </>
        }
        meta={[
          {
            id: "class",
            label: "Kelas aktif",
            value: student.assignedClassName ?? "Belum ditempatkan",
          },
          {
            id: "district",
            label: "Wilayah",
            value: student.district ? `Kel. ${student.district}` : "Lawang",
          },
          {
            id: "media-consent",
            label: "Persetujuan foto & video",
            value: student.consentSummary ? (
              <StatusBadge
                domain="consent"
                status={student.consentSummary.photoVideoConsent}
              />
            ) : (
              "—"
            ),
          },
        ]}
        primaryAction={
          canVerifyStudent ? (
            isNeedsVerification ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setVerifyOpen(true)}
                leftIcon={<Icon icon={ShieldCheck} size="sm" />}
                className="w-full sm:w-auto min-h-11 sm:min-h-10"
              >
                Verifikasi pendaftaran
              </Button>
            ) : isPlaceable ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setPlaceOpen(true)}
                leftIcon={<Icon icon={UserCheck} size="sm" />}
                className="w-full sm:w-auto min-h-11 sm:min-h-10"
              >
                {student.assignedClassId
                  ? "Pindahkan kelas"
                  : "Tempatkan ke kelas"}
              </Button>
            ) : undefined
          ) : undefined
        }
        secondaryActions={
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            {canVerifyStudent && !isNeedsVerification && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setVerifyOpen(true)}
                leftIcon={<Icon icon={ShieldCheck} size="xs" />}
                className="w-full sm:w-auto min-h-11 sm:min-h-9"
              >
                Ubah status pendaftaran
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setQrOpen(true)}
              leftIcon={<Icon icon={QrCode} size="xs" />}
              className="w-full sm:w-auto min-h-11 sm:min-h-9"
            >
              Kartu QR
            </Button>
            {canUpdateStudent && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditOpen(true)}
                leftIcon={<Icon icon={Pencil} size="xs" />}
                className="w-full sm:w-auto min-h-11 sm:min-h-9"
              >
                Ubah profil
              </Button>
            )}
            {canArchiveStudent && (
              student.archivedAt ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRestoreOpen(true)}
                  leftIcon={<Icon icon={ArchiveRestore} size="xs" />}
                  className="w-full sm:w-auto min-h-11 sm:min-h-9"
                >
                  Pulihkan peserta didik
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setArchiveOpen(true)}
                  leftIcon={<Icon icon={Archive} size="xs" />}
                  className="w-full sm:w-auto min-h-11 sm:min-h-9 text-danger hover:text-danger"
                >
                  Arsipkan peserta didik
                </Button>
              )
            )}
          </div>
        }
      />

      {/* 2. Stored Registration Lifecycle WorkflowProgress */}
      <WorkflowProgress
        stages={buildLifecycleStages(student.registrationStatus)}
      />

      {/* 3. Detail Tabs */}
      <DetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        ariaLabel="Detail profil peserta didik"
      />

      {/* 4. Tab Content */}
      {activeTab === "overview" && <StudentOverviewTab student={student} />}

      {activeTab === "learning" && (
        <StudentLearningTab
          learningContext={student.learningContext}
          canPlaceStudent={canVerifyStudent && isPlaceable}
          onRequestPlace={() => setPlaceOpen(true)}
        />
      )}

      {activeTab === "audit" && <StudentAuditTab auditLogs={auditLogs} />}

      {/* Dialog: Verifikasi pendaftaran */}
      <VerifyStudentSheet
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        studentName={student.fullName}
        onSubmit={handleVerifySubmit}
        pending={verifyPending}
      />

      {/* Dialog: Tempatkan ke kelas */}
      <PlaceStudentSheet
        open={placeOpen}
        onOpenChange={setPlaceOpen}
        studentName={student.fullName}
        defaultClassId={student.assignedClassId ?? undefined}
        classes={classes}
        onSubmit={handlePlaceSubmit}
        pending={placePending}
      />

      {/* Dialog: Ubah profil */}
      <EditStudentProfileSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        initialData={{
          fullName: student.fullName,
          nickname: student.nickname,
          gender: student.gender,
          birthDate: student.birthDate,
          educationLevel: student.educationLevel,
          schoolName: student.schoolName ?? "",
          district:
            (student.district as "Kalirejo" | "Lawang" | "Lainnya") ||
            "Kalirejo",
          isRaalResident: student.isRaalResident,
        }}
        onSubmit={handleEditSubmit}
        pending={editPending}
      />
      {/* Dialog: Arsipkan peserta didik */}
      <ArchiveStudentSheet
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        mode="archive"
        targetCount={1}
        studentName={student.fullName}
        onSubmit={handleArchiveSubmit}
        pending={archivePending}
      />

      {/* Dialog: Pulihkan peserta didik */}
      <ArchiveStudentSheet
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        mode="restore"
        targetCount={1}
        studentName={student.fullName}
        onSubmit={handleRestoreStudent}
        pending={archivePending}
      />

      {/* Dialog: Kartu QR Peserta Didik */}
      <StudentQrCardSheet
        open={qrOpen}
        onOpenChange={setQrOpen}
        student={{
          fullName: student.fullName,
          nickname: student.nickname,
          registrationNumber: student.registrationNumber,
          educationLevelLabel: student.educationLevelLabel,
          assignedClassName: student.assignedClassName,
        }}
      />

      {feedbackToast && (
        <FloatingFeedbackToast
          tone={feedbackToast.tone}
          message={feedbackToast.message}
          onDismiss={() => setFeedbackToast(null)}
        />
      )}
    </div>
  );
}
