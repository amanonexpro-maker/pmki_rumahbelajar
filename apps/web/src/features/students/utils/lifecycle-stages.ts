import type { WorkflowStageItem } from "@/components/patterns";
import type { RegistrationStatus } from "@/lib/status";

export type { WorkflowStageItem };

export function buildLifecycleStages(
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

