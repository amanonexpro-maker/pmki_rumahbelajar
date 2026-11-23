import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatToIndonesianStandard } from "@/utils/date-formatter";
import { generateWaShareText } from "../../app/(public)/kabar/[slug]/page";
import type { MediaAssetDTO } from "@/features/media";
import type { PublicationDTO } from "@/features/publishing";
import {
  CANONICAL_PUBLIC_COPY,
  deduplicateFeedItems,
  deduplicateHomeFeed,
  filterAndMapPublicGalleryItems,
  filterAndMapPublicNewsItems,
  getImageFingerprint,
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
    expect(CANONICAL_PUBLIC_COPY.scheduleHours).toBe("15.00 – 17.00 WIB");
    expect(CANONICAL_PUBLIC_COPY.locationFull).toContain("RAAL");
    expect(CANONICAL_PUBLIC_COPY.locationFull).toContain("Lawang");
  });

  it("includes the 4 core learning programs, Saturday 15.00–17.00 WIB schedule, and 13 Pengajar Relawan", () => {
    expect(PUBLIC_PROGRAMS_LIST).toHaveLength(4);
    expect(PUBLIC_SCHEDULE_SLOTS).toHaveLength(5);
    expect(PUBLIC_VOLUNTEER_TEACHERS).toHaveLength(13);
    expect(
      PUBLIC_SCHEDULE_SLOTS.some((s) => s.time.includes("15.00 – 15.45 WIB"))
    ).toBe(true);
    expect(
      PUBLIC_SCHEDULE_SLOTS.some((s) => s.time.includes("16.30 – 17.00 WIB"))
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
    expect(filtered[0]?.capturedDate).toBe("15 Agustus 2026");
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
        eventDate: "2026-11-28",
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
    expect(filtered[0]?.eventDate).toBe("28 November 2026");
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
      // `/` dan `/pendaftaran` kini berada di route group (public) (Fase 13b)
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

  it("resolves dual-mode content for both articles and gallery albums in getPublicArticleDetail", async () => {
    const { getPublicArticleDetail } = await import("./index");

    // 1. Article type
    const article = await getPublicArticleDetail("tahun-ajaran-2026-2027-buka-kelas-smp-8");
    expect(article).not.toBeNull();
    expect(article?.type).toBe("article");
    if (article?.type === "article") {
      expect(article.title).toContain("SMP Kelas 8");
      expect(article.content).toContain("Griya Asih");
    }

    // 2. Gallery Album type
    const album = await getPublicArticleDetail("suasana-belajar-sabtu-griya-asih");
    expect(album).not.toBeNull();
    expect(album?.type).toBe("gallery_album");
    if (album?.type === "gallery_album") {
      expect(album.title).toBe("Suasana Belajar Sabtu Griya Asih");
      expect(album.photos.length).toBeGreaterThan(1);
      expect(album.photos[0].url).toContain("/images/gallery/");
    }
  });

  it("formats dates to Indonesian standard D MMMM YYYY without timezone drifting", () => {
    expect(formatToIndonesianStandard("2026-10-24")).toBe("24 Oktober 2026");
    expect(formatToIndonesianStandard("2026-08-15")).toBe("15 Agustus 2026");
    expect(formatToIndonesianStandard("2026-01-01")).toBe("1 Januari 2026");
    expect(formatToIndonesianStandard("2026-12-31")).toBe("31 Desember 2026");
    expect(formatToIndonesianStandard("24 Oktober 2026")).toBe("24 Oktober 2026");
    expect(formatToIndonesianStandard("2026-10-24T12:00:00Z")).toBe("24 Oktober 2026");
    expect(formatToIndonesianStandard(null)).toBe("24 Oktober 2026");
    expect(formatToIndonesianStandard(undefined)).toBe("24 Oktober 2026");
    expect(formatToIndonesianStandard("Terbaru")).toBe("24 Oktober 2026");
  });

  it("ensures filterAndMapPublicGalleryItems maps absolute Indonesian dates and never yields 'Terbaru'", () => {
    const rawMockAssets: any[] = [
      {
        id: "asset-1",
        title: "Dokumentasi Matematika Ceria",
        category: "KEGIATAN",
        privacyReviewed: true,
        eligibleForPublic: true,
        capturedDate: "2026-08-15",
        createdAt: new Date("2026-08-15T10:00:00Z"),
        signedReadUrl: "/images/gallery/griya_asih_8.jpg",
      },
      {
        id: "asset-2",
        title: "Pojok Baca Literasi",
        category: "KEGIATAN",
        privacyReviewed: true,
        eligibleForPublic: true,
        capturedDate: null, // Null captured date in DB!
        createdAt: new Date("2026-09-05T10:00:00Z"),
        signedReadUrl: "/images/gallery/griya_asih_7.jpg",
      },
      {
        id: "asset-3",
        title: "Evaluasi Belajar",
        category: "KEGIATAN",
        privacyReviewed: true,
        eligibleForPublic: true,
        capturedDate: null,
        createdAt: null,
        signedReadUrl: "/images/gallery/griya_asih_4.jpg",
      },
    ];

    const mapped = filterAndMapPublicGalleryItems(rawMockAssets);
    expect(mapped).toHaveLength(3);
    // Verified descending sort by timestamp: Oktober -> September -> Agustus
    expect(mapped[0].capturedDate).toBe("24 Oktober 2026");
    expect(mapped[1].capturedDate).toBe("5 September 2026");
    expect(mapped[2].capturedDate).toBe("15 Agustus 2026");
    expect(mapped.every((m) => m.capturedDate !== "Terbaru")).toBe(true);
  });

  it("formats WhatsApp share text with single valid canonical URL without duplicating /kabar/ segment", () => {
    const mockArticle = {
      type: "article" as const,
      title: "Jadwal Bimbingan Belajar Semester Ganjil",
      slug: "jadwal-bimbingan-belajar-semester-ganjil",
      date: "2026-11-28",
      categoryLabel: "Jadwal",
      excerpt: "Jadwal bimbingan belajar semester ganjil dimulai.",
      author: "Pengurus",
      content: "Isi artikel.",
    };
    const canonicalUrl = "https://pmkirumahbelajar-web.vercel.app/kabar/jadwal-bimbingan-belajar-semester-ganjil";
    const waText = generateWaShareText(mockArticle as any, canonicalUrl);

    expect(waText).toContain("https://pmkirumahbelajar-web.vercel.app/kabar/jadwal-bimbingan-belajar-semester-ganjil");
    expect(waText).not.toContain("/kabar/jadwal-bimbingan-belajar-semester-ganjil/kabar/");
    expect(waText.match(/\/kabar\//g)?.length).toBe(1);

    const mockAlbum = {
      type: "gallery_album" as const,
      title: "Suasana Belajar Sabtu Griya Asih",
      slug: "suasana-belajar-sabtu-griya-asih",
      date: "2026-10-24",
      author: "Tim Dokumentasi",
      photos: [],
      description: "Dokumentasi foto kegiatan.",
    };
    const albumCanonicalUrl = "https://pmkirumahbelajar-web.vercel.app/kabar/suasana-belajar-sabtu-griya-asih";
    const albumWaText = generateWaShareText(mockAlbum as any, albumCanonicalUrl);

    expect(albumWaText).toContain("https://pmkirumahbelajar-web.vercel.app/kabar/suasana-belajar-sabtu-griya-asih");
    expect(albumWaText).not.toContain("/kabar/suasana-belajar-sabtu-griya-asih/kabar/");
    expect(albumWaText.match(/\/kabar\//g)?.length).toBe(1);
  });

  it("extracts clean image fingerprint stripping query tokens and local paths", () => {
    expect(getImageFingerprint("/images/gallery/griya_asih_8.jpg")).toBe("griya_asih_8.jpg");
    expect(
      getImageFingerprint(
        "https://abc.supabase.co/storage/v1/object/sign/media/griya_asih_8.jpg?token=eyJhbGciOi"
      )
    ).toBe("griya_asih_8.jpg");
    expect(getImageFingerprint("")).toBe("");
    expect(getImageFingerprint(null)).toBe("");
  });

  it("intelligently deduplicates home feed so news and gallery never share the same image", () => {
    const mockNews: any[] = [
      {
        id: "news-1",
        title: "Tahun Ajaran 2026/2027",
        slug: "tahun-ajaran-2026-2027",
        categoryLabel: "Berita",
        coverSignedUrl: "https://storage/griya_asih_8.jpg?token=123",
        excerpt: "Buka kelas baru SMP 8",
        publishedDateFormatted: "1 Agustus 2026",
      },
      {
        id: "news-2",
        title: "Kelas Khusus Membaca",
        slug: "kelas-khusus-membaca",
        categoryLabel: "Berita",
        coverSignedUrl: "/images/gallery/griya_asih_7.jpg",
        excerpt: "Pojok baca intensif",
        publishedDateFormatted: "10 Agustus 2026",
      },
    ];

    const mockGallery: any[] = [
      {
        id: "gal-1",
        title: "Suasana Belajar",
        slug: "suasana-belajar",
        categoryLabel: "Kegiatan",
        // Identical cover image as news-1!
        signedReadUrl: "/images/gallery/griya_asih_8.jpg",
        capturedDate: "24 Oktober 2026",
      },
      {
        id: "gal-2",
        title: "Ujian Akhir Semester",
        slug: "ujian-akhir-semester",
        categoryLabel: "Kegiatan",
        // Distinct cover image!
        signedReadUrl: "https://storage/griya_asih_1.jpg?token=456",
        capturedDate: "14 November 2026",
      },
    ];

    const result = deduplicateHomeFeed(mockNews, mockGallery);

    // Primary slot prioritizes the news article
    expect(result.primaryArticle?.id).toBe("news-1");
    // Flags that gallery album with same photo exists
    expect(result.hasMatchedGalleryPhotos).toBe(true);

    // Secondary slot skips gal-1 (same image as news-1) and picks gal-2 (distinct image)
    expect(result.secondaryItem?.type).toBe("gallery");
    if (result.secondaryItem?.type === "gallery") {
      expect(result.secondaryItem.item.id).toBe("gal-2");
      expect(result.secondaryItem.item.title).toBe("Ujian Akhir Semester");
    }

    // Verify both items have completely distinct images
    const primaryImg = getImageFingerprint(result.primaryArticle?.coverSignedUrl);
    const secondaryImg = getImageFingerprint(
      result.secondaryItem?.type === "gallery"
        ? result.secondaryItem.item.signedReadUrl
        : result.secondaryItem?.item.coverSignedUrl
    );
    expect(primaryImg).toBe("griya_asih_8.jpg");
    expect(secondaryImg).toBe("griya_asih_1.jpg");
    expect(primaryImg).not.toBe(secondaryImg);
  });

  it("deduplicates mixed feed items prioritizing articles over duplicate gallery items", () => {
    const mixed = [
      { id: "1", type: "berita", coverUrl: "/images/gallery/griya_asih_8.jpg" },
      { id: "2", type: "galeri", coverUrl: "/images/gallery/griya_asih_8.jpg" }, // Duplicate image, should be filtered out
      { id: "3", type: "galeri", coverUrl: "/images/gallery/griya_asih_1.jpg" },
    ];

    const deduped = deduplicateFeedItems(mixed);
    expect(deduped).toHaveLength(2);
    expect(deduped.map((d) => d.id)).toEqual(["1", "3"]);
  });

  it("enforces W1 Consent Hardening: media without active consent/review NEVER leaks into public DTO even on timeout/fallback", async () => {
    const unconsentedAssets: MediaAssetDTO[] = [
      {
        id: "m-no-consent",
        organizationId: "org-1",
        serviceUnitId: "unit-1",
        title: "Dokumentasi Tanpa Consent Siswa",
        description: "Anak tanpa izin foto",
        filePath: "raw/no-consent.jpg",
        mimeType: "image/jpeg",
        fileSize: 120000,
        category: "KEGIATAN",
        categoryLabel: "Kegiatan belajar",
        privacyReviewed: false, // NOT REVIEWED
        eligibleForPublic: false, // NOT ELIGIBLE
        reviewedBy: null,
        reviewedAt: null,
        capturedDate: "2026-11-20",
        uploadedBy: "u-1",
        createdAt: "2026-11-20T00:00:00Z",
        signedReadUrl: "/images/no-consent.jpg",
        signedUrlTtlSeconds: 3600,
      },
      {
        id: "m-partial-revoked",
        organizationId: "org-1",
        serviceUnitId: "unit-1",
        title: "Dokumentasi Izin Dicabut",
        description: "Consent dicabut orang tua",
        filePath: "raw/revoked.jpg",
        mimeType: "image/jpeg",
        fileSize: 120000,
        category: "KEGIATAN",
        categoryLabel: "Kegiatan belajar",
        privacyReviewed: true,
        eligibleForPublic: false, // Revocation turns eligible to false
        reviewedBy: "rev-1",
        reviewedAt: "2026-11-20T00:00:00Z",
        capturedDate: "2026-11-20",
        uploadedBy: "u-1",
        createdAt: "2026-11-20T00:00:00Z",
        signedReadUrl: "/images/revoked.jpg",
        signedUrlTtlSeconds: 3600,
      },
    ];

    // 1. Direct mapper check: must be strictly filtered out
    const mapped = filterAndMapPublicGalleryItems(unconsentedAssets);
    expect(mapped).toHaveLength(0);

    // 2. Full portal data check (even if DB is mocked/timed out and canonical fallback triggers)
    const { getPublicPortalData } = await import("./index");
    const portalData = await getPublicPortalData();
    expect(portalData.galleryItems.length).toBeGreaterThan(0);
    for (const item of portalData.galleryItems) {
      expect(item.privacyReviewed).toBe(true);
      expect(item.eligibleForPublic).toBe(true);
      expect(item.title).not.toMatch(/tanpa consent|izin dicabut|belum ditinjau/i);
    }
  });

  it("enforces R2 Gallery Fallback Accuracy: NEVER substitutes photos from album X for album Y on timeout/failure", async () => {
    const { getPublicArticleDetail, CANONICAL_AUTHENTIC_ALBUMS } = await import("./index");

    // 1. For a canonical album (e.g. 'suasana-belajar-sabtu-griya-asih'), must match THAT album's photos
    const canonicalSlug = "suasana-belajar-sabtu-griya-asih";
    const canonicalDetail = await getPublicArticleDetail(canonicalSlug);
    expect(canonicalDetail).not.toBeNull();
    expect(canonicalDetail?.type).toBe("gallery_album");
    if (canonicalDetail?.type === "gallery_album") {
      expect(canonicalDetail.slug).toBe(canonicalSlug);
      // Photos must match the canonical album's own photos, not an arbitrary fallback
      const expectedAlbum = CANONICAL_AUTHENTIC_ALBUMS.find((a) => a.slug === canonicalSlug);
      expect(canonicalDetail.photos).toEqual(expectedAlbum?.photos);
      expect(canonicalDetail.isDegraded).toBeFalsy();
    }

    // 2. For a non-existent / non-canonical album slug, must return null or EmptyState with isDegraded: true
    // NEVER returning photos from CANONICAL_AUTHENTIC_ALBUMS[0]
    const nonCanonicalSlug = "dokumentasi-kegiatan-luar-kota-99999";
    const nonCanonicalDetail = await getPublicArticleDetail(nonCanonicalSlug);
    if (nonCanonicalDetail && nonCanonicalDetail.type === "gallery_album") {
      expect(nonCanonicalDetail.photos).toHaveLength(0);
      expect(nonCanonicalDetail.isDegraded).toBe(true);
      expect(nonCanonicalDetail.photos).not.toEqual(CANONICAL_AUTHENTIC_ALBUMS[0].photos);
    } else {
      expect(nonCanonicalDetail).toBeNull();
    }
  });

  it("enforces W-WATCH-3: distinguishes legitimate-empty (query success with 0 eligible photos) vs degradation (query throw/timeout) in empty-state rendering", async () => {
    const { GalleryAlbumGrid } = await import("./index");
    const React = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");

    // 1. Mock legitimate-empty: query succeeded, but 0 photos eligible (isEmptyLegitimate: true, isDegraded: false)
    const legitEmptyHtml = renderToStaticMarkup(
      React.createElement(GalleryAlbumGrid, {
        photos: [],
        albumTitle: "Album Tanpa Foto Publik",
        isDegraded: false,
        isEmptyLegitimate: true,
      })
    );
    expect(legitEmptyHtml).toContain("Belum ada dokumentasi publik untuk album ini.");
    expect(legitEmptyHtml).not.toContain("kendala");

    // 2. Mock degraded: query failed/timed out (isDegraded: true, isEmptyLegitimate: false)
    const degradedHtml = renderToStaticMarkup(
      React.createElement(GalleryAlbumGrid, {
        photos: [],
        albumTitle: "Album Terganggu",
        isDegraded: true,
        isEmptyLegitimate: false,
      })
    );
    expect(degradedHtml).toContain("Terjadi kendala memuat dokumentasi kegiatan");
    expect(degradedHtml).not.toContain("Belum ada dokumentasi publik untuk album ini.");
  });
});

