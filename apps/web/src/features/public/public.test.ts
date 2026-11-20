import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { MediaAssetDTO } from "@/features/media";
import type { PublicationDTO } from "@/features/publishing";
import {
  CANONICAL_PUBLIC_COPY,
  filterAndMapPublicGalleryItems,
  filterAndMapPublicNewsItems,
  PUBLIC_PROGRAMS_LIST,
  PUBLIC_SCHEDULE_SLOTS,
  PUBLIC_VOLUNTEER_TEACHERS,
  publicContactInquirySchema,
  publicGalleryFilterSchema,
} from "./index";

function collectTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
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

describe("Fase 9 — Public Experience: Copywriting, Privacy Filters, Terminology & Boundaries", () => {
  it("preserves exact canonical warm copy from 10 §21 and prototype UI-12", () => {
    expect(CANONICAL_PUBLIC_COPY.heroHeadline).toBe(
      "Ayo belajar dan tumbuh bersama."
    );
    expect(CANONICAL_PUBLIC_COPY.heroSubheadline).toBe(
      "Rumah belajar yang terbuka bagi semua."
    );
    expect(CANONICAL_PUBLIC_COPY.missionHeadline).toBe(
      "Setiap anak memiliki kesempatan untuk berkembang."
    );
    expect(CANONICAL_PUBLIC_COPY.scheduleDay).toBe("Setiap hari Sabtu");
    expect(CANONICAL_PUBLIC_COPY.scheduleHours).toBe("15.00 – 17.15 WIB");
    expect(CANONICAL_PUBLIC_COPY.locationFull).toContain("RAAL");
    expect(CANONICAL_PUBLIC_COPY.locationFull).toContain("Lawang");
  });

  it("includes the 4 core learning programs, Saturday 15.00–17.15 WIB schedule, and 13 Pengajar Relawan", () => {
    expect(PUBLIC_PROGRAMS_LIST).toHaveLength(4);
    expect(PUBLIC_SCHEDULE_SLOTS).toHaveLength(5);
    expect(PUBLIC_VOLUNTEER_TEACHERS).toHaveLength(13);
    expect(
      PUBLIC_SCHEDULE_SLOTS.some((s) => s.time.includes("15.00 – 15.45 WIB"))
    ).toBe(true);
    expect(
      PUBLIC_SCHEDULE_SLOTS.some((s) => s.time.includes("16.30 – 17.15 WIB"))
    ).toBe(true);
  });

  it("defensively filters public gallery items: ONLY privacyReviewed=true AND eligibleForPublic=true with signedReadUrl pass", () => {
    const sampleMedia: MediaAssetDTO[] = [
      {
        id: "m-eligible",
        organizationId: "org-1",
        serviceUnitId: "unit-1",
        title: "Kegiatan Belajar Sabtu",
        description: "Belajar bersama pengajar relawan",
        filePath: "griya-asih/griya_asih_4.jpg",
        mimeType: "image/jpeg",
        fileSize: 120000,
        category: "KEGIATAN",
        categoryLabel: "Kegiatan belajar",
        privacyReviewed: true,
        eligibleForPublic: true,
        reviewedBy: "rev-1",
        reviewedAt: "2026-11-20T00:00:00Z",
        capturedDate: "2026-08-15",
        uploadedBy: "ed-1",
        createdAt: "2026-08-15T00:00:00Z",
        signedReadUrl: "/images/gallery/griya_asih_4.jpg",
        signedUrlTtlSeconds: 3600,
      },
      {
        id: "m-unreviewed",
        organizationId: "org-1",
        serviceUnitId: "unit-1",
        title: "Foto Belum Ditinjau",
        description: "Internal",
        filePath: "griya-asih/griya_asih_12.jpg",
        mimeType: "image/jpeg",
        fileSize: 120000,
        category: "KEGIATAN",
        categoryLabel: "Kegiatan belajar",
        privacyReviewed: false,
        eligibleForPublic: true,
        reviewedBy: null,
        reviewedAt: null,
        capturedDate: "2026-11-01",
        uploadedBy: "ed-1",
        createdAt: "2026-11-01T00:00:00Z",
        signedReadUrl: "/images/gallery/griya_asih_12.jpg",
        signedUrlTtlSeconds: 3600,
      },
      {
        id: "m-ineligible",
        organizationId: "org-1",
        serviceUnitId: "unit-1",
        title: "Foto Internal Saja",
        description: "Tidak layak publik",
        filePath: "griya-asih/griya_asih_13.jpg",
        mimeType: "image/jpeg",
        fileSize: 120000,
        category: "KEGIATAN",
        categoryLabel: "Kegiatan belajar",
        privacyReviewed: true,
        eligibleForPublic: false,
        reviewedBy: "rev-1",
        reviewedAt: "2026-11-20T00:00:00Z",
        capturedDate: "2026-11-01",
        uploadedBy: "ed-1",
        createdAt: "2026-11-01T00:00:00Z",
        signedReadUrl: "/images/gallery/griya_asih_13.jpg",
        signedUrlTtlSeconds: 3600,
      },
    ];

    const filtered = filterAndMapPublicGalleryItems(sampleMedia);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("m-eligible");
  });

  it("defensively filters public news items: ONLY status === PUBLISHED pass", () => {
    const samplePosts: PublicationDTO[] = [
      {
        id: "p-published",
        organizationId: "org-1",
        serviceUnitId: "unit-1",
        title: "Kelas Baru SMP Kelas 8",
        slug: "kelas-baru-smp-8",
        category: "BERITA",
        categoryLabel: "Berita kegiatan",
        excerpt: "Ringkasan berita",
        content: "Isi lengkap berita kegiatan belajar.",
        coverMediaId: "m-1",
        coverSignedUrl: "/images/gallery/griya_asih_8.jpg",
        status: "PUBLISHED",
        publishedAt: "2026-08-01T09:00:00Z",
        eventDate: null,
        eventLocation: null,
        authorId: "ed-1",
        createdAt: "2026-08-01T08:00:00Z",
        updatedAt: "2026-08-01T09:00:00Z",
      },
      {
        id: "p-approved-not-published",
        organizationId: "org-1",
        serviceUnitId: "unit-1",
        title: "Draft Disetujui Tapi Belum Diterbitkan",
        slug: "draft-approved",
        category: "PENGUMUMAN",
        categoryLabel: "Pengumuman",
        excerpt: "Belum tayang",
        content: "Isi pengumuman.",
        coverMediaId: null,
        coverSignedUrl: null,
        status: "APPROVED",
        publishedAt: null,
        eventDate: null,
        eventLocation: null,
        authorId: "ed-1",
        createdAt: "2026-10-01T08:00:00Z",
        updatedAt: "2026-10-01T09:00:00Z",
      },
    ];

    const filtered = filterAndMapPublicNewsItems(samplePosts);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("p-published");
  });

  it("validates publicContactInquirySchema and publicGalleryFilterSchema with Bahasa Indonesia messages", () => {
    expect(
      publicContactInquirySchema.safeParse({
        senderName: "Ibu Maria",
        senderPhone: "08123456789",
        message: "Saya ingin menanyakan pendaftaran peserta didik baru SD Kelas 2.",
      }).success
    ).toBe(true);

    const invalid = publicContactInquirySchema.safeParse({
      senderName: "A",
      message: "Pendek",
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0]?.message).toContain("Masukkan nama");
    }

    expect(publicGalleryFilterSchema.safeParse("ALL").success).toBe(true);
    expect(publicGalleryFilterSchema.safeParse("KEGIATAN").success).toBe(true);
    expect(publicGalleryFilterSchema.safeParse("INVALID").success).toBe(false);
  });

  it("verifies RED-LINE domain boundary: features/public never imports other domains' repositories, queries, or DB schema tables", () => {
    const publicFeatureDir = path.resolve(__dirname);
    const files = collectTsFiles(publicFeatureDir);
    expect(files.length).toBeGreaterThanOrEqual(8);

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(
        /@\/features\/(?!public)[a-z-]+\/(repositories|queries)/
      );
      expect(source).not.toMatch(/db\/schema/);
      expect(source).not.toMatch(/db\/client/);
    }
  });

  it("verifies canonical Indonesian terminology & zero English CTA leaks across all public components and pages", () => {
    const publicFeatureDir = path.resolve(__dirname);
    const appDir = path.resolve(__dirname, "../../app");
    const publicFiles = [
      ...collectTsFiles(publicFeatureDir),
      path.join(appDir, "page.tsx"),
      path.join(appDir, "pendaftaran", "page.tsx"),
      ...collectTsFiles(path.join(appDir, "(public)")),
    ];

    const forbiddenPatterns = [
      /Join now/i,
      /Enroll immediately/i,
      /Enroll Now/i,
      /Join Our Program/i,
      /Media Consent Verified/i,
      /No Data Found/i,
      /Daftar Siswa Baru/,
      /Siswa Terdaftar/,
      /Tenaga Guru Relawan/,
    ];

    for (const file of publicFiles) {
      const source = fs.readFileSync(file, "utf8");
      for (const pattern of forbiddenPatterns) {
        expect(source).not.toMatch(pattern);
      }
    }
  });

  it("verifies Display Typography (Newsreader: type-display / type-display-xl / font-display) NEVER appears inside Workspace", () => {
    const workspaceAppDir = path.resolve(__dirname, "../../app/(workspace)");
    const workspaceFiles = collectTsFiles(workspaceAppDir);
    expect(workspaceFiles.length).toBeGreaterThan(5);

    for (const file of workspaceFiles) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(/\btype-display(-xl)?\b/);
      expect(source).not.toMatch(/\bfont-display\b/);
    }
  });
});

