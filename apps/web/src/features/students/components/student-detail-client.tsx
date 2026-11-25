"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Pencil,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/compositions";
import {
  DetailTabs,
  EntityHeader,
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
  placeStudentInClassAction,
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
import { EditStudentProfileSheet } from "./edit-student-profile-sheet";
import { PlaceStudentSheet } from "./place-student-sheet";
import {
  StudentAuditTab,
  type AuditEntrySummary,
} from "./student-audit-tab";
import { StudentLearningTab } from "./student-learning-tab";
import { StudentOverviewTab } from "./student-overview-tab";
import { VerifyStudentSheet } from "./verify-student-sheet";

export type { AuditEntrySummary };

export interface StudentDetailClientProps {
  student: StudentDetailDTO;
  classes: ClassSummaryDTO[];
  auditLogs: AuditEntrySummary[];
  canVerifyStudent: boolean;
  canUpdateStudent: boolean;
  initialTab?: string;
}

export function StudentDetailClient({
  student,
  classes,
  auditLogs,
  canVerifyStudent,
  canUpdateStudent,
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

  function handleTabChange(nextTab: string) {
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextTab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
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
              >
                Verifikasi pendaftaran
              </Button>
            ) : isPlaceable ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setPlaceOpen(true)}
                leftIcon={<Icon icon={UserCheck} size="sm" />}
              >
                {student.assignedClassId
                  ? "Pindahkan kelas"
                  : "Tempatkan ke kelas"}
              </Button>
            ) : undefined
          ) : undefined
        }
        secondaryActions={
          <div className="flex flex-wrap items-center gap-2">
            {canVerifyStudent && !isNeedsVerification && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setVerifyOpen(true)}
              >
                Ubah status pendaftaran
              </Button>
            )}
            {canUpdateStudent && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditOpen(true)}
                leftIcon={<Icon icon={Pencil} size="xs" />}
              >
                Ubah profil
              </Button>
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
    </div>
  );
}
