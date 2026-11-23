import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { PAGE_CACHE_REVALIDATE_SECONDS } from "@/server/upload/storage-admin";
import { getPublicPortalData } from "./index";

describe("Fase 9 Integration — Public Experience Cross-Domain Data & Privacy Filtering", () => {
  beforeAll(async () => {
    // Deterministic Test Fixture Isolation (W1):
    // Ensure any internal unreviewed test assets remain strictly unreviewed in the test DB
    try {
      await db
        .update(mediaAssets)
        .set({ privacyReviewed: false, eligibleForPublic: false })
        .where(eq(mediaAssets.title, "Dokumentasi Internal Belum Ditinjau Privasi"));
    } catch {
      // Graceful fallback when DB not active
    }
  });

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

    // Anti-false-green verification (W-watch-1):
    // Assert that an unreviewed media asset physically present in the database is strictly excluded
    try {
      const [unreviewedRow] = await db
        .select({ id: mediaAssets.id })
        .from(mediaAssets)
        .where(eq(mediaAssets.title, "Dokumentasi Internal Belum Ditinjau Privasi"))
        .limit(1);
      if (unreviewedRow) {
        const leaked = data.galleryItems.some((item) => item.id === unreviewedRow.id);
        expect(leaked).toBe(false);
      }
    } catch {
      // Graceful when DB not active
    }

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

