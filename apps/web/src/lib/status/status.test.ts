import { describe, expect, it } from "vitest";
import {
  ATTENDANCE_STATUS_META,
  CONSENT_STATUS_META,
  PUBLICATION_STATUS_META,
  REGISTRATION_STATUS_META,
  REPORT_STATUS_META,
  ROLE_LABELS,
  SYNC_STATUS_META,
  getRoleLabel,
} from "./index";

describe("src/lib/status (10 §6–7)", () => {
  it("maps all 11 official roles to canonical Indonesian labels", () => {
    expect(Object.keys(ROLE_LABELS)).toHaveLength(11);
    expect(getRoleLabel("PLATFORM_ADMIN")).toBe("Administrator Platform");
    expect(getRoleLabel("TEACHER")).toBe("Pengajar");
    expect(getRoleLabel("APPROVER")).toBe("Pejabat Penyetuju");
    expect(getRoleLabel("STAKEHOLDER")).toBe("Pemangku Kepentingan");
  });

  it("uses canonical sentence case status labels without forbidden terms", () => {
    expect(REGISTRATION_STATUS_META.ACTIVE.label).toBe("Aktif belajar");
    expect(ATTENDANCE_STATUS_META.ABSENT.label).toBe("Tidak hadir");
    expect(REPORT_STATUS_META.PROGRAM_REVIEW.label).toBe("Tinjauan program");
    expect(REPORT_STATUS_META.ORGANIZATION_APPROVAL.label).toBe(
      "Persetujuan organisasi"
    );
    expect(PUBLICATION_STATUS_META.PUBLISHED.label).toBe("Tayang di publik");
    expect(CONSENT_STATUS_META.REVOKED.label).toBe("Izin dicabut");
    expect(SYNC_STATUS_META.LOCAL_SAVED.label).toBe("Disimpan lokal");
  });
});

