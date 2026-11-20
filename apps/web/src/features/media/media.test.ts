import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { SessionUser } from "@/server/auth/session";
import {
  getMediaSignedUrlTtlSeconds,
  PAGE_CACHE_REVALIDATE_SECONDS,
} from "@/server/upload/storage-admin";
import {
  authorizeCreateMedia,
  authorizeReviewMediaWithSoD,
} from "./permissions/media-policy";
import {
  confirmMediaUploadSchema,
  createUploadUrlSchema,
} from "./validators/media-validator";

const ORG_ID = "01950000-0000-7000-8000-000000000001";
const UNIT_ID = "01950000-0000-7000-8000-000000000010";

const editorUser: SessionUser = {
  id: "editor-1",
  email: "lilian@pmki.org",
  name: "Ms. Lilian",
  roles: ["EDITOR"],
  permissions: ["media.read", "media.create", "media.update"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const reviewerUser: SessionUser = {
  id: "reviewer-1",
  email: "peninjau.privasi@pmki.org",
  name: "Clara Novita",
  roles: ["REVIEWER"],
  permissions: ["media.read", "media.review"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const platformAdminUser: SessionUser = {
  id: "admin-1",
  email: "superadmin@pmki.org",
  name: "Admin PMKI",
  roles: ["PLATFORM_ADMIN"],
  permissions: ["media.read", "media.create", "media.review"],
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

describe("Media Domain — Signed URL TTL, SoD Policy, Validators & Boundaries", () => {
  it("guarantees signed read URL TTL strictly exceeds page cache revalidate window (D-29)", () => {
    const ttl = getMediaSignedUrlTtlSeconds();
    expect(ttl).toBeGreaterThan(PAGE_CACHE_REVALIDATE_SECONDS);
    expect(ttl).toBeGreaterThanOrEqual(3600);
  });

  it("validates createUploadUrlSchema and confirmMediaUploadSchema MIME & size limits", () => {
    const validUpload = createUploadUrlSchema.safeParse({
      fileName: "kegiatan-sabtu.jpg",
      mimeType: "image/jpeg",
      fileSize: 512000,
    });
    expect(validUpload.success).toBe(true);

    const invalidMime = createUploadUrlSchema.safeParse({
      fileName: "malware.exe",
      mimeType: "application/x-msdownload",
      fileSize: 1024,
    });
    expect(invalidMime.success).toBe(false);

    const tooLarge = createUploadUrlSchema.safeParse({
      fileName: "video-besar.jpg",
      mimeType: "image/jpeg",
      fileSize: 25 * 1024 * 1024,
    });
    expect(tooLarge.success).toBe(false);

    const validConfirm = confirmMediaUploadSchema.safeParse({
      title: "Belajar Membaca Kelompok A",
      filePath: "units/unit-1/foto.jpg",
      mimeType: "image/jpeg",
      fileSize: 512000,
      category: "KEGIATAN",
      capturedDate: "2026-11-20",
    });
    expect(validConfirm.success).toBe(true);
  });

  it("enforces Separation of Duties on media privacy review (uploader !== reviewer, even for PLATFORM_ADMIN)", () => {
    expect(authorizeCreateMedia(editorUser, UNIT_ID).success).toBe(true);

    // Different reviewer reviewing editor's upload -> ALLOWED
    expect(
      authorizeReviewMediaWithSoD(reviewerUser, UNIT_ID, editorUser.id).success
    ).toBe(true);

    // Reviewer trying to review their OWN upload -> POLICY_DENIED
    const selfReview = authorizeReviewMediaWithSoD(
      reviewerUser,
      UNIT_ID,
      reviewerUser.id
    );
    expect(selfReview.success).toBe(false);
    if (!selfReview.success) {
      expect(selfReview.error.code).toBe("POLICY_DENIED");
    }

    // PLATFORM_ADMIN trying to review their OWN upload -> STILL POLICY_DENIED
    const adminSelfReview = authorizeReviewMediaWithSoD(
      platformAdminUser,
      UNIT_ID,
      platformAdminUser.id
    );
    expect(adminSelfReview.success).toBe(false);
    if (!adminSelfReview.success) {
      expect(adminSelfReview.error.code).toBe("POLICY_DENIED");
    }
  });

  it("verifies RED-LINE domain boundary: features/media never imports other domains' repositories or tables", () => {
    const dir = path.resolve(__dirname);
    const files = collectTsFiles(dir);
    expect(files.length).toBeGreaterThan(4);

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(
        /@\/features\/(?!media)[a-z-]+\/(repositories|queries)/
      );
      expect(source).not.toMatch(/db\/schema\/(consent|students|publishing)/);
    }
  });
});

