import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLICATION_STATUS_META } from "@/lib/status";
import type { SessionUser } from "@/server/auth/session";
import {
  authorizePublishPublicationWithSoD,
  canPublishPublicationWithSoD,
} from "./permissions/publishing-policy";
import { isValidPublicationTransition } from "./services/publishing-service";
import { createPublicationSchema } from "./validators/publishing-validator";

const ORG_ID = "01950000-0000-7000-8000-000000000001";
const UNIT_ID = "01950000-0000-7000-8000-000000000010";

const editorUser: SessionUser = {
  id: "editor-1",
  email: "lilian@pmki.org",
  name: "Ms. Lilian",
  roles: ["EDITOR"],
  permissions: ["publication.read", "publication.create", "publication.update"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const approverUser: SessionUser = {
  id: "approver-1",
  email: "penyetuju.mupel@pmki.org",
  name: "Pdt. Andreas",
  roles: ["APPROVER"],
  permissions: ["publication.read", "publication.publish"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const platformAdminUser: SessionUser = {
  id: "admin-1",
  email: "superadmin@pmki.org",
  name: "Admin PMKI",
  roles: ["PLATFORM_ADMIN"],
  permissions: [
    "publication.read",
    "publication.create",
    "publication.review",
    "publication.publish",
  ],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

function collectTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".test.ts")
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Publishing Domain — Workflow State Machine, SoD Policy, Labels & Boundaries", () => {
  it("uses canonical Indonesian publication status labels (10 §7)", () => {
    expect(PUBLICATION_STATUS_META.DRAFT.label).toBe("Draft konten");
    expect(PUBLICATION_STATUS_META.PRIVACY_REVIEW.label).toBe(
      "Tinjauan privasi"
    );
    expect(PUBLICATION_STATUS_META.APPROVED.label).toBe("Disetujui editorial");
    expect(PUBLICATION_STATUS_META.PUBLISHED.label).toBe("Tayang di publik");
    expect(PUBLICATION_STATUS_META.ARCHIVED.label).toBe("Diarsipkan");
  });

  it("enforces stored publication workflow transitions DRAFT -> PRIVACY_REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED", () => {
    expect(isValidPublicationTransition("DRAFT", "PRIVACY_REVIEW")).toBe(true);
    expect(isValidPublicationTransition("PRIVACY_REVIEW", "APPROVED")).toBe(
      true
    );
    expect(isValidPublicationTransition("APPROVED", "PUBLISHED")).toBe(true);
    expect(isValidPublicationTransition("PUBLISHED", "ARCHIVED")).toBe(true);

    // Illegal jumps
    expect(isValidPublicationTransition("DRAFT", "PUBLISHED")).toBe(false);
    expect(isValidPublicationTransition("DRAFT", "APPROVED")).toBe(false);
    expect(isValidPublicationTransition("PRIVACY_REVIEW", "PUBLISHED")).toBe(
      false
    );
  });

  it("enforces Separation of Duties on publishing (author !== publisher, even for PLATFORM_ADMIN)", () => {
    // Approver publishing editor's post -> ALLOWED
    expect(
      canPublishPublicationWithSoD(approverUser, UNIT_ID, editorUser.id)
    ).toBe(true);
    expect(
      authorizePublishPublicationWithSoD(approverUser, UNIT_ID, editorUser.id)
        .success
    ).toBe(true);

    // Approver trying to publish their OWN post -> POLICY_DENIED
    const selfPublish = authorizePublishPublicationWithSoD(
      approverUser,
      UNIT_ID,
      approverUser.id
    );
    expect(selfPublish.success).toBe(false);
    if (!selfPublish.success) {
      expect(selfPublish.error.code).toBe("POLICY_DENIED");
    }

    // PLATFORM_ADMIN trying to publish their OWN post -> STILL POLICY_DENIED
    const adminSelfPublish = authorizePublishPublicationWithSoD(
      platformAdminUser,
      UNIT_ID,
      platformAdminUser.id
    );
    expect(adminSelfPublish.success).toBe(false);
    if (!adminSelfPublish.success) {
      expect(adminSelfPublish.error.code).toBe("POLICY_DENIED");
    }
  });

  it("validates createPublicationSchema", () => {
    expect(
      createPublicationSchema.safeParse({
        title: "Kegiatan Belajar Sabtu Ceria di Griya Asih",
        category: "BERITA",
        content:
          "Anak-anak Rumah Belajar Griya Asih mengikuti kegiatan literasi dan berhitung bersama pengajar relawan.",
      }).success
    ).toBe(true);

    expect(
      createPublicationSchema.safeParse({
        title: "A",
        category: "BERITA",
        content: "Pendek",
      }).success
    ).toBe(false);
  });

  it("verifies RED-LINE domain boundary: features/publishing never imports other domains' repositories or tables", () => {
    const dir = path.resolve(__dirname);
    const files = collectTsFiles(dir);
    expect(files.length).toBeGreaterThan(4);

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(
        /@\/features\/(?!publishing)[a-z-]+\/(repositories|queries)/
      );
      expect(source).not.toMatch(/db\/schema\/(media|consent|students)/);
    }
  });
});

