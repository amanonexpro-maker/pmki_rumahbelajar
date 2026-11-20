import { describe, expect, it } from "vitest";
import { PAGE_CACHE_REVALIDATE_SECONDS } from "@/server/upload/storage-admin";
import { getPublicPortalData } from "./index";

describe("Fase 9 Integration — Public Experience Cross-Domain Data & Privacy Filtering", () => {
  it("loads public portal data strictly through Organization, Media, and Publishing services and excludes unreviewed media & non-published posts", async () => {
    const data = await getPublicPortalData();

    expect(data.serviceUnitName).toContain("Rumah Belajar Griya Asih");
    expect(data.organizationName).toBe("PMKI Mupel Jawa Timur");
    expect(data.heroHeadline).toBe("Ayo belajar dan tumbuh bersama.");
    expect(data.heroSubheadline).toBe("Rumah belajar yang terbuka bagi semua.");
    expect(data.missionHeadline).toBe(
      "Setiap anak memiliki kesempatan untuk berkembang."
    );

    // 1. Gallery items: only privacyReviewed === true && eligibleForPublic === true
    expect(data.galleryItems.length).toBeGreaterThan(0);
    for (const item of data.galleryItems) {
      expect(item.privacyReviewed).toBe(true);
      expect(item.eligibleForPublic).toBe(true);
      expect(item.signedReadUrl).toBeTruthy();
      // D-29: Signed URL TTL strictly exceeds page cache revalidate window (3600s > 300s)
      expect(item.signedUrlTtlSeconds).toBeGreaterThan(
        PAGE_CACHE_REVALIDATE_SECONDS
      );
      expect(item.title).not.toContain("Belum Ditinjau Privasi");
    }

    // 2. News items: only status === PUBLISHED (APPROVED post "Sosialisasi Persiapan Ujian Akhir Matematika SD Kelas 6" must not leak)
    expect(data.newsItems.length).toBeGreaterThan(0);
    for (const post of data.newsItems) {
      expect(post.slug).not.toBe("sosialisasi-persiapan-ebta-sd-kelas-6");
      expect(post.coverSignedUrl).toBeTruthy();
    }
  });
});

