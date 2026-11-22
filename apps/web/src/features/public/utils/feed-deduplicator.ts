import type {
  PublicGalleryItemDTO,
  PublicNewsItemDTO,
} from "../types/public-types";

/**
 * Helper to extract unique image identifier/fingerprint from URL.
 * Strips query strings, hashes, and handles both local paths and Supabase signed URLs.
 */
export function getImageFingerprint(url?: string | null): string {
  if (!url) return "";
  try {
    const clean = url.split("?")[0].split("#")[0];
    const segments = clean.split("/").filter(Boolean);
    return (segments[segments.length - 1] || clean).toLowerCase().trim();
  } catch {
    return (url || "").toLowerCase().trim();
  }
}

export type DeduplicatedSecondaryFeedItem =
  | { type: "gallery"; item: PublicGalleryItemDTO }
  | { type: "news"; item: PublicNewsItemDTO };

export interface DeduplicatedHomeFeedResult {
  primaryArticle: PublicNewsItemDTO | null;
  secondaryItem: DeduplicatedSecondaryFeedItem | null;
  hasMatchedGalleryPhotos: boolean;
}

/**
 * Intelligent feed deduplication strategy for Home section (Kabar Terbaru).
 * Ensures that:
 * 1. Primary slot is given to the latest informative News Article.
 * 2. Secondary slot is guaranteed to have a DISTINCT visual cover (never repeating primary cover).
 * 3. If a gallery album shares the same cover as the primary article, it flags `hasMatchedGalleryPhotos: true`
 *    and selects the next distinct gallery album (or second distinct news item) for the secondary slot.
 */
export function deduplicateHomeFeed(
  newsItems: PublicNewsItemDTO[] = [],
  galleryItems: PublicGalleryItemDTO[] = []
): DeduplicatedHomeFeedResult {
  const primaryArticle = newsItems[0] ?? null;

  if (!primaryArticle) {
    const firstGallery = galleryItems[0] ?? null;
    return {
      primaryArticle: null,
      secondaryItem: firstGallery ? { type: "gallery", item: firstGallery } : null,
      hasMatchedGalleryPhotos: false,
    };
  }

  const primaryFingerprint = getImageFingerprint(primaryArticle.coverSignedUrl);

  const matchedDuplicateGallery = galleryItems.find(
    (album) => getImageFingerprint(album.signedReadUrl) === primaryFingerprint
  );

  // Find first gallery album with distinct image
  const distinctGallery = galleryItems.find(
    (album) => getImageFingerprint(album.signedReadUrl) !== primaryFingerprint
  );

  if (distinctGallery) {
    return {
      primaryArticle,
      secondaryItem: { type: "gallery", item: distinctGallery },
      hasMatchedGalleryPhotos: Boolean(matchedDuplicateGallery),
    };
  }

  // Fallback to second news article if distinct
  const secondNews = newsItems[1] ?? null;
  if (secondNews && getImageFingerprint(secondNews.coverSignedUrl) !== primaryFingerprint) {
    return {
      primaryArticle,
      secondaryItem: { type: "news", item: secondNews },
      hasMatchedGalleryPhotos: Boolean(matchedDuplicateGallery),
    };
  }

  return {
    primaryArticle,
    secondaryItem: null,
    hasMatchedGalleryPhotos: Boolean(matchedDuplicateGallery),
  };
}

/**
 * Universal feed deduplicator for mixed arrays of news and gallery items.
 * Prioritizes 'berita'/'article' over 'galeri'/'gallery' when cover images match.
 */
export function deduplicateFeedItems<
  T extends { coverUrl?: string; coverSignedUrl?: string; signedReadUrl?: string; type?: string }
>(items: T[]): T[] {
  const seenFingerprints = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const rawUrl = item.coverUrl || item.coverSignedUrl || item.signedReadUrl;
    const fingerprint = getImageFingerprint(rawUrl);

    if (!fingerprint) {
      result.push(item);
      continue;
    }

    if (seenFingerprints.has(fingerprint)) {
      // If image already seen, omit gallery items because articles are prioritized
      if (item.type === "galeri" || item.type === "gallery" || item.type === "gallery_album") {
        continue;
      }
    }

    seenFingerprints.add(fingerprint);
    result.push(item);
  }

  return result;
}
