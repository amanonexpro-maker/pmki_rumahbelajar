import {
  listPublicGalleryMedia,
  MEDIA_CATEGORY_LABELS,
  type MediaAssetDTO,
} from "@/features/media";
import {
  getDefaultPilotServiceUnit,
} from "@/features/organization";
import {
  getPublishedPublicationBySlug,
  listPublishedContent,
  PUBLICATION_CATEGORY_LABELS,
  type PublicationDTO,
} from "@/features/publishing";
import { formatToIndonesianStandard } from "@/utils/date-formatter";
import {
  CANONICAL_AUTHENTIC_ALBUMS,
  CANONICAL_AUTHENTIC_PUBLICATIONS,
  CANONICAL_PUBLIC_COPY,
  PUBLIC_COORDINATOR_CONTACTS,
  PUBLIC_GRADE_TARGETS,
  PUBLIC_PROGRAMS_LIST,
  PUBLIC_SCHEDULE_SLOTS,
  PUBLIC_VOLUNTEER_TEACHERS,
} from "../constants/portal-content";
import type {
  ArticleContent,
  GalleryPhoto,
  PublicContent,
  PublicGalleryItemDTO,
  PublicNewsItemDTO,
  PublicPortalDataDTO,
} from "../types/public-types";

function formatIndonesianDate(isoDate: string | null): string {
  if (!isoDate) return "24 Oktober 2026";
  return formatToIndonesianStandard(isoDate, "24 Oktober 2026");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Defensive sanitizer for public text content (`config.HOURS.window` enforcement).
 * Replaces any legacy drift "17.15" or "17:15" with official "17.00".
 */
export function sanitizePublicTextTimes(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/17[.:]15/g, "17.00");
}

/**
 * Pure mapper & defensive filter for Public Gallery items (`04 §19`, `11 §15`, PO Rule #2 & #4).
 * Ensures ONLY items with `privacyReviewed === true && eligibleForPublic === true`
 * and a valid server-resolved signedReadUrl are exposed to the public experience.
 * Always resolves absolute Indonesian dates without relying on ambiguous "Terbaru" labels.
 */
export function filterAndMapPublicGalleryItems(
  rawAssets: MediaAssetDTO[]
): PublicGalleryItemDTO[] {
  return rawAssets
    .filter(
      (asset) =>
        asset.privacyReviewed === true &&
        asset.eligibleForPublic === true &&
        Boolean(asset.signedReadUrl)
    )
    .sort((a, b) => {
      const timeA = new Date(a.capturedDate || a.createdAt || "2026-10-24").getTime();
      const timeB = new Date(b.capturedDate || b.createdAt || "2026-10-24").getTime();
      return timeB - timeA;
    })
    .map((asset) => {
      const generatedSlug = slugify(asset.title);
      const rawDate = asset.capturedDate || asset.createdAt || "2026-10-24";
      const formattedDate = formatToIndonesianStandard(rawDate, "24 Oktober 2026");

      return {
        id: asset.id,
        slug: generatedSlug.length > 3 ? generatedSlug : `galeri-${asset.id}`,
        title: asset.title,
        description:
          asset.description ??
          "Dokumentasi kegiatan belajar bersama di Rumah Belajar Griya Asih Lawang.",
        category: asset.category,
        categoryLabel:
          MEDIA_CATEGORY_LABELS[asset.category] ?? "Kegiatan belajar",
        capturedDate: formattedDate,
        date: formattedDate,
        rawTimestamp: typeof rawDate === "string" ? rawDate : "2026-10-24",
        signedReadUrl: asset.signedReadUrl ?? "/images/gallery/griya_asih_4.jpg",
        signedUrlTtlSeconds: asset.signedUrlTtlSeconds ?? 3600,
        privacyReviewed: true,
        eligibleForPublic: true,
      };
    });
}

/**
 * Pure mapper & defensive filter for Public News/Publications (`04 §22`, `11 §17`, PO Rule #4).
 * Ensures ONLY posts with `status === "PUBLISHED"` are exposed to the public channel.
 */
export function filterAndMapPublicNewsItems(
  rawPosts: PublicationDTO[]
): PublicNewsItemDTO[] {
  return rawPosts
    .filter((post) => post.status === "PUBLISHED")
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      category: post.category,
      categoryLabel: PUBLICATION_CATEGORY_LABELS[post.category] ?? "Berita",
      excerpt: sanitizePublicTextTimes(post.excerpt ?? post.content.slice(0, 140) + "..."),
      content: sanitizePublicTextTimes(post.content),
      coverSignedUrl:
        post.coverSignedUrl ?? "/images/gallery/griya_asih_4.jpg",
      publishedAt: post.publishedAt,
      publishedDateFormatted: formatIndonesianDate(post.publishedAt),
      authorLabel: "Tim Pelayanan Griya Asih",
      eventDate: post.eventDate ? formatToIndonesianStandard(post.eventDate) : null,
      eventLocation: post.eventLocation ? sanitizePublicTextTimes(post.eventLocation) : null,
    }));
}

/**
 * Public Dual-Mode Detail Resolver (`11 §17`, FASE 14 Hotfix Lanjutan).
 * Mendeteksi contentType:
 * - 'article': Publikasi warta/berita (Header -> Paragraf -> Share).
 * - 'gallery_album': Dokumentasi album foto (Header Narasi -> Grid Foto Responsif -> Share).
 * Menerapkan SQL WHERE clause consent gate ketat pada level server query untuk semua media asset.
 */
/**
 * Explicit Error for Database Timeout in Public Portal Layer (W2 Hardening).
 * Ensures timeouts are loud, traceable, and cannot silently produce empty feeds.
 */
export class PublicDataTimeoutError extends Error {
  readonly scope: string;
  readonly code = "PUBLIC_DATA_TIMEOUT" as const;

  constructor(scope: string, timeoutMs: number) {
    super(`[PublicDataTimeoutError] Timed out after ${timeoutMs}ms while querying ${scope} from database.`);
    this.name = "PublicDataTimeoutError";
    this.scope = scope;
  }
}

export async function getPublicArticleDetail(
  slug: string
): Promise<PublicContent | null> {
  // 1. Cek apakah cocok dengan Canonical Fallback Albums
  const canonicalAlbum = CANONICAL_AUTHENTIC_ALBUMS.find((a) => a.slug === slug);
  if (canonicalAlbum) {
    return canonicalAlbum;
  }

  // 2. Query database publikasi (dengan defensive timeout untuk keamanan prerender static build)
  try {
    const timeoutMs = process.env.VITEST ? 15000 : 1500;
    const rawPost = await Promise.race([
      getPublishedPublicationBySlug(slug),
      new Promise<null>((_, reject) =>
        setTimeout(
          () => reject(new PublicDataTimeoutError(`publication slug "${slug}"`, timeoutMs)),
          timeoutMs
        )
      ),
    ]).catch((err) => {
      console.warn(`[getPublicArticleDetail] FAIL-LOUD: Database query failed or timed out for slug "${slug}":`, err);
      return null;
    });

    if (rawPost) {
      const isGalleryCategory =
        rawPost.category.toUpperCase() === "GALERI" ||
        rawPost.category.toUpperCase() === "DOKUMENTASI";

      if (isGalleryCategory) {
        let queryFailed = false;
        // Query media assets dengan SQL Consent Gate ketat
        const eligibleMedia = await listPublicGalleryMedia(rawPost.serviceUnitId).catch((err) => {
          queryFailed = true;
          console.warn(`[getPublicArticleDetail] FAIL-LOUD: Gallery media query failed for unit "${rawPost.serviceUnitId}" on album slug "${rawPost.slug}":`, err);
          return [];
        });
        const mappedPhotos: GalleryPhoto[] = eligibleMedia
          .filter((m) => m.privacyReviewed === true && m.eligibleForPublic === true && Boolean(m.signedReadUrl))
          .map((m) => ({
            url: m.signedReadUrl ?? "/images/gallery/griya_asih_4.jpg",
            caption: m.description ?? m.title,
          }));

        // R2 & W-WATCH-3: Bedakan degradasi (throw/timeout) vs kosong-sah (query sukses tapi 0 foto lolos consent)
        let finalPhotos: GalleryPhoto[] = mappedPhotos;
        let isDegraded = false;
        let isEmptyLegitimate = false;

        if (finalPhotos.length === 0) {
          // Rule 3a: If slug matches a canonical album, use THAT canonical album's photos
          const matchedCanonical = CANONICAL_AUTHENTIC_ALBUMS.find((a) => a.slug === rawPost.slug);
          if (matchedCanonical && matchedCanonical.photos.length > 0) {
            finalPhotos = matchedCanonical.photos;
          } else {
            // Rule 3b: Non-canonical album with 0 photos:
            finalPhotos = [];
            if (queryFailed) {
              isDegraded = true;
              console.warn(`[getPublicArticleDetail] FAIL-LOUD: Album "${rawPost.slug}" media query failed/timed out. Rendering degraded empty state.`);
            } else {
              isEmptyLegitimate = true;
              // Kosong sah: TANPA warn degradasi karena query sukses dan media memang belum ada / belum lolos review
            }
          }
        }

        return {
          type: "gallery_album",
          title: rawPost.title,
          slug: rawPost.slug,
          date: formatIndonesianDate(rawPost.publishedAt),
          description: rawPost.excerpt ?? rawPost.content,
          author: "Tim Pelayanan Griya Asih",
          categoryLabel: PUBLICATION_CATEGORY_LABELS[rawPost.category] ?? "Dokumentasi Kegiatan",
          coverImage: rawPost.coverSignedUrl ?? finalPhotos[0]?.url,
          photos: finalPhotos,
          isDegraded,
          isEmptyLegitimate,
        };
      }

      // Tipe 'article'
      const [mapped] = filterAndMapPublicNewsItems([rawPost]);
      if (mapped) {
        return {
          type: "article",
          title: mapped.title,
          slug: mapped.slug,
          date: mapped.publishedDateFormatted,
          publishedDateFormatted: mapped.publishedDateFormatted,
          author: mapped.authorLabel,
          categoryLabel: mapped.categoryLabel,
          excerpt: mapped.excerpt,
          bodyHtml: mapped.content,
          content: mapped.content,
          coverImage: mapped.coverSignedUrl,
          coverSignedUrl: mapped.coverSignedUrl,
          eventDate: mapped.eventDate,
          eventLocation: mapped.eventLocation,
        };
      }
    }
  } catch (err) {
    console.error(`[getPublicArticleDetail] DB query error for slug "${slug}":`, err);
  }

  // 3. Graceful fallback ke authentic canonical publication (artikel berita)
  const rawFallback = CANONICAL_AUTHENTIC_PUBLICATIONS.find((p) => p.slug === slug);
  if (rawFallback) {
    const fallbackArticle: ArticleContent = {
      type: "article",
      title: rawFallback.title,
      slug: rawFallback.slug,
      date: rawFallback.publishedDateFormatted,
      publishedDateFormatted: rawFallback.publishedDateFormatted,
      author: rawFallback.authorLabel,
      categoryLabel: rawFallback.categoryLabel,
      excerpt: rawFallback.excerpt,
      bodyHtml: rawFallback.content,
      content: rawFallback.content,
      coverImage: rawFallback.coverSignedUrl,
      coverSignedUrl: rawFallback.coverSignedUrl,
      eventDate: rawFallback.eventDate,
      eventLocation: rawFallback.eventLocation,
    };
    return fallbackArticle;
  }

  // 4. Cek fallback per-media gallery item jika slug cocok
  const fallbackGalleryPhotos: GalleryPhoto[] = [
    ...CANONICAL_AUTHENTIC_ALBUMS[0].photos,
    ...CANONICAL_AUTHENTIC_ALBUMS[1].photos,
  ];
  const matchedPhoto = fallbackGalleryPhotos.find(
    (p) => slugify(p.caption).includes(slug) || slug.includes(slugify(p.caption).slice(0, 15))
  );
  if (matchedPhoto) {
    return {
      type: "gallery_album",
      title: matchedPhoto.caption.slice(0, 60),
      slug,
      date: "2026",
      description: matchedPhoto.caption,
      author: "Tim Pelayanan Griya Asih",
      categoryLabel: "DOKUMENTASI KEGIATAN",
      coverImage: matchedPhoto.url,
      photos: [
        matchedPhoto,
        ...fallbackGalleryPhotos.filter((p) => p.url !== matchedPhoto.url),
      ],
    };
  }

  return null;
}

/**
 * Cross-Domain Public Portal Application Service (`11 §20–21`).
 * Fetches public data strictly through `organization`, `media`, and `publishing` Public APIs.
 */
export async function getPublicPortalData(): Promise<PublicPortalDataDTO> {
  let rawGallery: MediaAssetDTO[] = [];
  let rawPublications: PublicationDTO[] = [];

  try {
    const timeoutMs = process.env.VITEST ? 15000 : 1500;
    const pilotScope = await Promise.race([
      getDefaultPilotServiceUnit(),
      new Promise<null>((_, reject) =>
        setTimeout(
          () => reject(new PublicDataTimeoutError("pilot service unit", timeoutMs)),
          timeoutMs
        )
      ),
    ]).catch((err) => {
      console.warn("[getPublicPortalData] FAIL-LOUD: Pilot service unit query timed out or failed:", err);
      return null;
    });
    const serviceUnitId = pilotScope?.serviceUnitId;

    const [galleryRes, pubRes] = await Promise.allSettled([
      Promise.race([
        listPublicGalleryMedia(serviceUnitId),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new PublicDataTimeoutError("gallery media", timeoutMs)),
            timeoutMs
          )
        ),
      ]),
      Promise.race([
        listPublishedContent(serviceUnitId),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new PublicDataTimeoutError("published content", timeoutMs)),
            timeoutMs
          )
        ),
      ]),
    ]);

    if (galleryRes.status === "fulfilled") {
      rawGallery = galleryRes.value;
    } else {
      console.warn("[getPublicPortalData] FAIL-LOUD: Gallery query failed/timed out, activating defined canonical fallback:", galleryRes.reason);
    }

    if (pubRes.status === "fulfilled") {
      rawPublications = pubRes.value;
    } else {
      console.warn("[getPublicPortalData] FAIL-LOUD: Publications query failed/timed out, activating defined canonical fallback:", pubRes.reason);
    }
  } catch (err) {
    console.error("[getPublicPortalData] FAIL-LOUD: Transient database failure encountered:", err);
  }

  const mappedGallery = filterAndMapPublicGalleryItems(rawGallery);
  const galleryItems =
    mappedGallery.length > 0
      ? mappedGallery
      : CANONICAL_AUTHENTIC_ALBUMS.map((album, idx) => ({
          id: `canonical-album-${idx + 1}`,
          slug: album.slug,
          title: album.title,
          description: album.description,
          category: "KEGIATAN" as const,
          categoryLabel: "Kegiatan belajar",
          capturedDate: formatToIndonesianStandard(album.date, "24 Oktober 2026"),
          date: formatToIndonesianStandard(album.date, "24 Oktober 2026"),
          rawTimestamp: album.date,
          signedReadUrl: album.photos[0]?.url ?? "/images/gallery/griya_asih_4.jpg",
          signedUrlTtlSeconds: 3600,
          privacyReviewed: true as const,
          eligibleForPublic: true as const,
        }));

  const mappedNews = filterAndMapPublicNewsItems(rawPublications);
  const newsItems = (
    mappedNews.length > 0 ? mappedNews : CANONICAL_AUTHENTIC_PUBLICATIONS
  ).filter((post) => post.slug !== "sosialisasi-persiapan-ebta-sd-kelas-6");

  return {
    serviceUnitName: "Rumah Belajar Griya Asih Lawang",
    organizationName: "PMKI Mupel Jawa Timur",
    locationFull: CANONICAL_PUBLIC_COPY.locationFull,
    subDistrictsLabel: CANONICAL_PUBLIC_COPY.subDistrictsLabel,
    scheduleDay: CANONICAL_PUBLIC_COPY.scheduleDay,
    scheduleHours: CANONICAL_PUBLIC_COPY.scheduleHours,
    heroHeadline: CANONICAL_PUBLIC_COPY.heroHeadline,
    heroSubheadline: CANONICAL_PUBLIC_COPY.heroSubheadline,
    missionHeadline: CANONICAL_PUBLIC_COPY.missionHeadline,
    ctaHeadline: CANONICAL_PUBLIC_COPY.ctaHeadline,
    sloganEnglish: CANONICAL_PUBLIC_COPY.sloganEnglish,
    sloganIndonesian: CANONICAL_PUBLIC_COPY.sloganIndonesian,
    philosophyQuote: CANONICAL_PUBLIC_COPY.philosophyQuote,
    metrics: {
      registeredStudentsValue: "80+",
      registeredStudentsLabel: "Peserta didik terdaftar",
      volunteerTeachersValue: "13",
      volunteerTeachersLabel: "Pengajar relawan",
      educationLevelsValue: "TK – SMP 8",
      educationLevelsLabel: "Jenjang pendidikan",
    },
    programs: PUBLIC_PROGRAMS_LIST,
    gradeTargets: PUBLIC_GRADE_TARGETS,
    scheduleSlots: PUBLIC_SCHEDULE_SLOTS,
    volunteerTeachers: PUBLIC_VOLUNTEER_TEACHERS,
    coordinators: PUBLIC_COORDINATOR_CONTACTS,
    galleryItems,
    newsItems,
  };
}

export {
  deduplicateFeedItems,
  deduplicateHomeFeed,
  getImageFingerprint,
  type DeduplicatedHomeFeedResult,
  type DeduplicatedSecondaryFeedItem,
} from "../utils/feed-deduplicator";
