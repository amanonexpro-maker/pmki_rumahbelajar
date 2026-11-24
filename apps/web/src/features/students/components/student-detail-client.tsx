"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Eye,
  EyeOff,
  History,
  Lock,
  Pencil,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/compositions";
import {
  DetailTabs,
  EntityHeader,
  FormBottomSheet,
  ReviewSection,
  WorkflowProgress,
  type DetailTabItem,
  type WorkflowStageItem,
} from "@/components/patterns";
import {
  Badge,
  Button,
  Icon,
  Input,
  Textarea,
} from "@/components/ui";
import type { ClassSummaryDTO } from "@/features/academic";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import type { RegistrationStatus } from "@/lib/status";
import {
  placeStudentInClassAction,
  updateStudentProfileAction,
  verifyStudentRegistrationAction,
} from "../actions/student-actions";
import {
  EDUCATION_LEVEL_LABELS,
  type EducationLevelCode,
  type StudentDetailDTO,
} from "../types/student-types";
import { EDUCATION_LEVEL_VALUES } from "../validators/student-validator";

export interface AuditEntrySummary {
  id: string;
  action: string;
  description: string;
  createdAt: string;
}

export interface StudentDetailClientProps {
  student: StudentDetailDTO;
  classes: ClassSummaryDTO[];
  auditLogs: AuditEntrySummary[];
  canVerifyStudent: boolean;
  canUpdateStudent: boolean;
  initialTab?: string;
}

function buildLifecycleStages(
  status: RegistrationStatus
): WorkflowStageItem[] {
  if (status === "REJECTED" || status === "CANCELLED") {
    return [
      {
        id: "submitted",
        label: "Pendaftaran masuk",
        actorHint: "Formulir diterima",
        state: "completed",
      },
      {
        id: "verification",
        label: "Verifikasi pendaftaran",
        actorHint: status === "REJECTED" ? "Ditolak" : "Dibatalkan",
        state: "rejected",
      },
      {
        id: "placement",
        label: "Penempatan kelas",
        actorHint: "Koordinator Unit",
        state: "upcoming",
      },
      {
        id: "active",
        label: "Aktif belajar",
        actorHint: "Mengikuti kegiatan kelas",
        state: "upcoming",
      },
    ];
  }

  const stepIndex =
    status === "SUBMITTED" || status === "PENDING_VERIFICATION"
      ? 1
      : status === "VERIFIED" || status === "WAITLIST"
        ? 2
        : status === "CLASS_PLACEMENT"
          ? 2
          : 4;

  return [
    {
      id: "submitted",
      label: "Pendaftaran masuk",
      actorHint: "Formulir diterima",
      state: "completed",
    },
    {
      id: "verification",
      label: "Verifikasi pendaftaran",
      actorHint: "Koordinator Unit",
      state: stepIndex > 1 ? "completed" : "current",
    },
    {
      id: "placement",
      label: "Penempatan kelas",
      actorHint: "Sesuai kapasitas kelas",
      state:
        stepIndex > 2
          ? "completed"
          : stepIndex === 2
            ? "current"
            : "upcoming",
    },
    {
      id: "active",
      label: "Aktif belajar",
      actorHint: "Terdaftar di kelas aktif",
      state: status === "ACTIVE" ? "completed" : "upcoming",
    },
  ];
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
  const [revealGuardian, setRevealGuardian] = React.useState(false);

  // Field IDs for a11y & multi-container support
  const verifyDecisionId = React.useId();
  const verifyReasonId = React.useId();
  const placeClassId = React.useId();
  const placeNotesId = React.useId();
  const editFullNameId = React.useId();
  const editNicknameId = React.useId();
  const editBirthDateId = React.useId();
  const editGenderId = React.useId();
  const editLevelId = React.useId();
  const editDistrictId = React.useId();
  const editSchoolId = React.useId();

  // Verification dialog state
  const [verifyOpen, setVerifyOpen] = React.useState(false);
  const [verifyDecision, setVerifyDecision] = React.useState<
    "VERIFIED" | "PENDING_VERIFICATION" | "WAITLIST" | "REJECTED" | "CANCELLED"
  >("VERIFIED");
  const [verifyReason, setVerifyReason] = React.useState("");
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [verifyPending, setVerifyPending] = React.useState(false);

  // Class placement dialog state
  const [placeOpen, setPlaceOpen] = React.useState(false);
  const [selectedClassId, setSelectedClassId] = React.useState(
    student.assignedClassId ??
      classes.find((c) => !c.isFull)?.id ??
      classes[0]?.id ??
      ""
  );
  const [placeNotes, setPlaceNotes] = React.useState("");
  const [placeError, setPlaceError] = React.useState<string | null>(null);
  const [placePending, setPlacePending] = React.useState(false);

  // Edit profile dialog state
  const [editOpen, setEditOpen] = React.useState(false);
  const [editFullName, setEditFullName] = React.useState(student.fullName);
  const [editNickname, setEditNickname] = React.useState(student.nickname);
  const [editBirthDate, setEditBirthDate] = React.useState(student.birthDate);
  const [editGender, setEditGender] = React.useState<"L" | "P">(student.gender);
  const [editLevel, setEditLevel] = React.useState<EducationLevelCode>(
    student.educationLevel
  );
  const [editSchoolName, setEditSchoolName] = React.useState(
    student.schoolName ?? ""
  );
  const [editDistrict, setEditDistrict] = React.useState<
    "Kalirejo" | "Lawang" | "Lainnya"
  >(
    (student.district as "Kalirejo" | "Lawang" | "Lainnya") || "Kalirejo"
  );
  const [editIsRaal, setEditIsRaal] = React.useState(student.isRaalResident);
  const [editError, setEditError] = React.useState<string | null>(null);
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

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError(null);
    setVerifyPending(true);
    try {
      const res = await verifyStudentRegistrationAction({
        studentId: student.id,
        decision: verifyDecision,
        reason: verifyReason.trim() || undefined,
      });
      if (!res.success) {
        setVerifyError(res.error.message);
        return;
      }
      setVerifyOpen(false);
      setVerifyReason("");
      router.refresh();
    } finally {
      setVerifyPending(false);
    }
  }

  async function handlePlaceSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPlaceError(null);
    setPlacePending(true);
    try {
      const res = await placeStudentInClassAction({
        studentId: student.id,
        classId: selectedClassId,
        notes: placeNotes.trim() || undefined,
      });
      if (!res.success) {
        setPlaceError(res.error.message);
        return;
      }
      setPlaceOpen(false);
      setPlaceNotes("");
      router.refresh();
    } finally {
      setPlacePending(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    setEditPending(true);
    try {
      const res = await updateStudentProfileAction({
        studentId: student.id,
        fullName: editFullName,
        nickname: editNickname,
        gender: editGender,
        birthDate: editBirthDate,
        educationLevel: editLevel,
        schoolName: editSchoolName || undefined,
        district: editDistrict,
        isRaalResident: editIsRaal,
      });
      if (!res.success) {
        setEditError(res.error.message);
        return;
      }
      setEditOpen(false);
      router.refresh();
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

  // --- Form Factory & Footer Functions for FormBottomSheet (R1/R2/R3/R5) ---
  const renderVerifyForm = (formId: string) => (
    <form id={formId} onSubmit={handleVerifySubmit} className="space-y-4">
      {verifyError && (
        <div
          role="alert"
          className="rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger"
        >
          {verifyError}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor={verifyDecisionId}
          className="block text-sm font-medium text-foreground"
        >
          Keputusan verifikasi
        </label>
        <select
          id={verifyDecisionId}
          autoFocus
          value={verifyDecision}
          onChange={(e) =>
            setVerifyDecision(
              e.target.value as
                | "VERIFIED"
                | "PENDING_VERIFICATION"
                | "WAITLIST"
                | "REJECTED"
                | "CANCELLED"
            )
          }
          className="flex h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-ring"
        >
          <option value="VERIFIED">
            Terverifikasi (Siap ditempatkan ke kelas)
          </option>
          <option value="PENDING_VERIFICATION">
            Menunggu verifikasi lanjutan
          </option>
          <option value="WAITLIST">
            Daftar tunggu (Kapasitas kelas penuh)
          </option>
          <option value="REJECTED">Ditolak (Wajib isi alasan)</option>
          <option value="CANCELLED">
            Dibatalkan (Wajib isi alasan)
          </option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={verifyReasonId}
          className="block text-sm font-medium text-foreground"
        >
          Catatan atau alasan keputusan{" "}
          {(verifyDecision === "REJECTED" ||
            verifyDecision === "CANCELLED") &&
            "*"}
        </label>
        <Textarea
          id={verifyReasonId}
          rows={3}
          value={verifyReason}
          onChange={(e) => setVerifyReason(e.target.value)}
          placeholder="Tuliskan catatan verifikasi atau alasan keputusan..."
        />
      </div>
    </form>
  );

  const renderVerifyFooter = (formId: string, isMobile: boolean) => (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setVerifyOpen(false)}
        disabled={verifyPending}
        fullWidth={isMobile}
      >
        Batal
      </Button>
      <Button
        type="submit"
        form={formId}
        variant="primary"
        disabled={verifyPending}
        fullWidth={isMobile}
      >
        {verifyPending
          ? "Menyimpan..."
          : "Simpan keputusan verifikasi"}
      </Button>
    </>
  );

  const renderPlaceForm = (formId: string) => (
    <form id={formId} onSubmit={handlePlaceSubmit} className="space-y-4">
      {placeError && (
        <div
          role="alert"
          className="rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger"
        >
          {placeError}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor={placeClassId}
          className="block text-sm font-medium text-foreground"
        >
          Kelas tujuan
        </label>
        <select
          id={placeClassId}
          autoFocus
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="flex h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-ring"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} — {cls.enrolledCount}/{cls.capacity} peserta
              didik
              {cls.isFull
                ? " (Penuh)"
                : ` (Sisa ${cls.remainingSeats} kursi)`}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={placeNotesId}
          className="block text-sm font-medium text-foreground"
        >
          Catatan penempatan (opsional)
        </label>
        <Textarea
          id={placeNotesId}
          rows={2}
          value={placeNotes}
          onChange={(e) => setPlaceNotes(e.target.value)}
          placeholder="Catatan tambahan penempatan kelas..."
        />
      </div>
    </form>
  );

  const renderPlaceFooter = (formId: string, isMobile: boolean) => (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setPlaceOpen(false)}
        disabled={placePending}
        fullWidth={isMobile}
      >
        Batal
      </Button>
      <Button
        type="submit"
        form={formId}
        variant="primary"
        disabled={placePending || !selectedClassId}
        fullWidth={isMobile}
      >
        {placePending ? "Menempatkan..." : "Tempatkan ke kelas"}
      </Button>
    </>
  );

  const renderEditForm = (formId: string) => (
    <form id={formId} onSubmit={handleEditSubmit} className="space-y-4">
      {editError && (
        <div
          role="alert"
          className="rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger"
        >
          {editError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor={editFullNameId}
            className="block text-xs font-medium text-foreground"
          >
            Nama lengkap
          </label>
          <Input
            id={editFullNameId}
            autoFocus
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor={editNicknameId}
            className="block text-xs font-medium text-foreground"
          >
            Nama panggilan
          </label>
          <Input
            id={editNicknameId}
            value={editNickname}
            onChange={(e) => setEditNickname(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor={editBirthDateId}
            className="block text-xs font-medium text-foreground"
          >
            Tanggal lahir
          </label>
          <Input
            id={editBirthDateId}
            type="date"
            value={editBirthDate}
            onChange={(e) => setEditBirthDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor={editGenderId}
            className="block text-xs font-medium text-foreground"
          >
            Jenis kelamin
          </label>
          <select
            id={editGenderId}
            value={editGender}
            onChange={(e) =>
              setEditGender(e.target.value as "L" | "P")
            }
            className="flex h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-ring"
          >
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor={editLevelId}
            className="block text-xs font-medium text-foreground"
          >
            Jenjang kelas
          </label>
          <select
            id={editLevelId}
            value={editLevel}
            onChange={(e) =>
              setEditLevel(e.target.value as EducationLevelCode)
            }
            className="flex h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-ring"
          >
            {EDUCATION_LEVEL_VALUES.map((code) => (
              <option key={code} value={code}>
                {EDUCATION_LEVEL_LABELS[code]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor={editDistrictId}
            className="block text-xs font-medium text-foreground"
          >
            Wilayah
          </label>
          <select
            id={editDistrictId}
            value={editDistrict}
            onChange={(e) =>
              setEditDistrict(
                e.target.value as "Kalirejo" | "Lawang" | "Lainnya"
              )
            }
            className="flex h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-ring"
          >
            <option value="Kalirejo">Kelurahan Kalirejo</option>
            <option value="Lawang">Kecamatan Lawang</option>
            <option value="Lainnya">Wilayah lainnya</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor={editSchoolId}
          className="block text-xs font-medium text-foreground"
        >
          Asal sekolah
        </label>
        <Input
          id={editSchoolId}
          value={editSchoolName}
          onChange={(e) => setEditSchoolName(e.target.value)}
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={editIsRaal}
          onChange={(e) => setEditIsRaal(e.target.checked)}
        />
        <span>Anak asuh Asrama RAAL Griya Asih</span>
      </label>
    </form>
  );

  const renderEditFooter = (formId: string, isMobile: boolean) => (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setEditOpen(false)}
        disabled={editPending}
        fullWidth={isMobile}
      >
        Batal
      </Button>
      <Button
        type="submit"
        form={formId}
        variant="primary"
        disabled={editPending}
        fullWidth={isMobile}
      >
        {editPending ? "Menyimpan..." : "Simpan perubahan"}
      </Button>
    </>
  );

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
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReviewSection
            title="Identitas & pendidikan peserta didik"
            items={[
              { label: "Nama lengkap", value: student.fullName },
              { label: "Nama panggilan", value: student.nickname },
              { label: "Tanggal lahir", value: student.birthDate },
              {
                label: "Jenis kelamin",
                value: student.gender === "P" ? "Perempuan" : "Laki-laki",
              },
              { label: "Jenjang kelas", value: student.educationLevelLabel },
              { label: "Asal sekolah", value: student.schoolName ?? "—" },
              {
                label: "Wilayah",
                value: student.district ? `Kel. ${student.district}` : "Lawang",
              },
              {
                label: "Alamat tempat tinggal",
                value: student.guardianAccessDenied
                  ? "Terlindungi (memerlukan izin guardian.read)"
                  : (student.address ?? "—"),
              },
            ]}
          />

          {/* CONFIDENTIAL Guardian Card with Server-Side Default Deny + Progressive Disclosure */}
          <section className="rounded-control border border-border bg-surface-subtle/50 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Icon icon={Lock} size="xs" className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Data orang tua / wali (Rahasia)
                </h3>
              </div>

              {!student.guardianAccessDenied && student.guardian && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevealGuardian((v) => !v)}
                  leftIcon={
                    <Icon icon={revealGuardian ? EyeOff : Eye} size="xs" />
                  }
                >
                  {revealGuardian
                    ? "Sembunyikan kontak"
                    : "Tampilkan kontak wali"}
                </Button>
              )}
            </div>

            {student.guardianAccessDenied ? (
              <div className="rounded-control border border-border bg-surface p-4 text-xs text-secondary-foreground space-y-1">
                <p className="font-semibold text-foreground">
                  Akses data wali dibatasi
                </p>
                <p>
                  Data kontak dan alamat orang tua/wali diklasifikasikan sebagai
                  data rahasia (CONFIDENTIAL) dan hanya dapat diakses oleh
                  pengurus yang memiliki hak akses <code>guardian.read</code>{" "}
                  pada unit layanan ini.
                </p>
              </div>
            ) : student.guardian ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <div className="space-y-0.5">
                  <dt className="text-muted-foreground">Nama wali</dt>
                  <dd className="font-medium text-foreground">
                    {student.guardian.fullName}
                  </dd>
                </div>
                <div className="space-y-0.5">
                  <dt className="text-muted-foreground">Hubungan</dt>
                  <dd className="font-medium text-foreground">
                    {student.guardian.relationshipLabel}
                  </dd>
                </div>
                <div className="space-y-0.5">
                  <dt className="text-muted-foreground">Nomor WhatsApp</dt>
                  <dd className="font-mono font-medium text-foreground">
                    {revealGuardian
                      ? student.guardian.phone
                      : "••••-••••-" + student.guardian.phone.slice(-3)}
                  </dd>
                </div>
                <div className="space-y-0.5">
                  <dt className="text-muted-foreground">Pekerjaan</dt>
                  <dd className="font-medium text-foreground">
                    {student.guardian.occupation ?? "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground">
                Data wali belum tercatat.
              </p>
            )}
          </section>
        </div>
      )}

      {activeTab === "learning" && (
        <div className="space-y-4">
          {student.learningContext ? (
            <div className="space-y-4">
              <ReviewSection
                title="Penempatan kelas aktif"
                items={[
                  {
                    label: "Nama kelas",
                    value: student.learningContext.classInfo.name,
                  },
                  {
                    label: "Kategori jenjang",
                    value: student.learningContext.classInfo.category,
                  },
                  {
                    label: "Pengajar utama",
                    value:
                      student.learningContext.classInfo.mainTeacherName ??
                      "Belum ditentukan",
                  },
                  {
                    label: "Ruang belajar",
                    value:
                      student.learningContext.classInfo.roomName ??
                      "Griya Asih Lawang",
                  },
                  {
                    label: "Kapasitas kelas",
                    value: `${student.learningContext.classInfo.enrolledCount} / ${student.learningContext.classInfo.capacity} peserta didik`,
                  },
                ]}
              />

              <section className="rounded-control border border-border bg-surface p-4 sm:p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Jadwal kegiatan belajar
                </h3>
                {student.learningContext.schedules.length > 0 ? (
                  <ul className="divide-y divide-border-subtle text-xs">
                    {student.learningContext.schedules.map((sch) => (
                      <li
                        key={sch.id}
                        className="py-2.5 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold text-foreground">
                            {sch.subjectName}
                          </p>
                          <p className="text-secondary-foreground">
                            Pengajar: {sch.teacherName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {sch.dayOfWeek}, {sch.startTime}–{sch.endTime}
                          </p>
                          <p className="text-muted-foreground">
                            {sch.location ?? "Ruang Belajar"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Jadwal kelas ini belum ditambahkan.
                  </p>
                )}
              </section>
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Belum ditempatkan ke kelas."
              description="Peserta didik ini belum memiliki kelas aktif pada tahun ajaran berjalan."
              action={
                canVerifyStudent && isPlaceable ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setPlaceOpen(true)}
                  >
                    Tempatkan ke kelas
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <section className="rounded-control border border-border bg-surface p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Icon icon={History} size="sm" className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Riwayat audit peserta didik
            </h3>
          </div>
          {auditLogs.length > 0 ? (
            <ul className="divide-y divide-border-subtle text-xs">
              {auditLogs.map((log) => (
                <li key={log.id} className="py-3 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="neutral" size="sm">
                      {log.action}
                    </Badge>
                    <span className="font-mono text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <p className="text-foreground">{log.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Belum ada catatan riwayat audit untuk peserta didik ini.
            </p>
          )}
        </section>
      )}

      {/* Dialog: Verifikasi pendaftaran */}
      <FormBottomSheet
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        title="Verifikasi pendaftaran"
        description={
          <>
            Tentukan status verifikasi untuk{" "}
            <strong className="text-foreground">{student.fullName}</strong>.{" "}
            {PRIVACY_MESSAGES.auditLogged}
          </>
        }
        footer={renderVerifyFooter}
      >
        {renderVerifyForm}
      </FormBottomSheet>

      {/* Dialog: Tempatkan ke kelas */}
      <FormBottomSheet
        open={placeOpen}
        onOpenChange={setPlaceOpen}
        title="Tempatkan ke kelas"
        description={
          <>
            Pilih kelas bimbingan belajar untuk{" "}
            <strong className="text-foreground">{student.fullName}</strong>.
            Penempatan kelas dikelola melalui layanan domain Academic dan
            dicatat dalam jejak audit.
          </>
        }
        footer={renderPlaceFooter}
      >
        {renderPlaceForm}
      </FormBottomSheet>

      {/* Dialog: Ubah profil */}
      <FormBottomSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Ubah profil peserta didik"
        description="Perbarui data identitas dan pendidikan peserta didik."
        footer={renderEditFooter}
      >
        {renderEditForm}
      </FormBottomSheet>
    </div>
  );
}
