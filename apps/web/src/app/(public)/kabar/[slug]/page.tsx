import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Calendar, MapPin, Share2, ShieldCheck, User } from "lucide-react";
import { ICON_MAP } from "@/config/icons";
import { formatToIndonesianStandard } from "@/utils/date-formatter";
import {
  GalleryAlbumGrid,
  getPublicArticleDetail,
  PublicNavbar,
  type PublicContent,
} from "@/features/public";

export const instant = false;

interface PublicKabarDetailPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Standardized WhatsApp Share Formatter for Articles and Gallery Albums.
 * Ensures consistent tone, warm narrative, correct date formatting, canonical URL, and canonical hashtags.
 * Receives the already resolved canonicalUrl to prevent duplicate path segments (/kabar/.../kabar/...).
 */
export function generateWaShareText(content: PublicContent, canonicalUrl: string): string {
  if (content.type === "gallery_album") {
    const formattedDate = formatToIndonesianStandard(content.date);
    return `📸 Dokumentasi Kegiatan: "${content.title}"\n\nHari ini anak-anak Griya Asih belajar dengan semangat! Senang melihat perkembangan mereka.\n\nTanggal: ${formattedDate}\n\nLihat momen lengkapnya di sini:\n${canonicalUrl}\n\n#GriyaAsih #HappyLearning`;
  }

  const dateStr = formatToIndonesianStandard(content.publishedDateFormatted || content.date);
  return `📰 Warta Griya Asih: "${content.title}"\n\n${content.excerpt}\n\nTanggal: ${dateStr}\n\nBaca warta selengkapnya di sini:\n${canonicalUrl}\n\n#GriyaAsih #KabarGriyaAsih #RumahBelajar`;
}

export async function generateMetadata({
  params,
}: PublicKabarDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await getPublicArticleDetail(slug);

  if (!content) {
    return {
      title: "Warta Tidak Ditemukan | Rumah Belajar Griya Asih Lawang",
      description: "Halaman warta atau publikasi kegiatan tidak ditemukan.",
    };
  }

  const baseUrl =
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://pmkirumahbelajar-web.vercel.app");
  const cleanSlug = typeof content.slug === "string" ? content.slug.replace(/^\/?kabar\//, "").replace(/^\/+/, "") : "";
  const canonicalUrl = `${baseUrl}/kabar/${cleanSlug}`;

  const coverUrl =
    content.type === "article"
      ? content.coverSignedUrl || content.coverImage
      : content.coverImage || content.photos[0]?.url;

  const description =
    content.type === "article" ? content.excerpt : content.description;

  return {
    title: `${content.title} | Kabar Griya Asih`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: content.title,
      description,
      url: canonicalUrl,
      type: "article",
      images: coverUrl
        ? [
            {
              url: coverUrl,
              alt: content.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description,
      images: coverUrl ? [coverUrl] : undefined,
    },
  };
}

/**
 * PublicKabarDetailPage (Dual-Mode Content Renderer: Berita & Galeri Album).
 * Mendeteksi contentType dari PublicContent:
 * 1. 'article': Merender layout warta berita (Breadcrumb -> Header -> Cover -> Paragraf -> Share).
 * 2. 'gallery_album': Merender layout galeri dokumentasi (Breadcrumb -> Header Narasi -> Grid Foto Responsif -> Enhanced Lightbox -> Share).
 * Sesuai Design Identity §7 (Narrative Flow), §9 (Visual Restraint), UI-UX §15, §30.
 */
export default async function PublicKabarDetailPage({
  params,
}: PublicKabarDetailPageProps) {
  await connection();
  const { slug } = await params;
  const content = await getPublicArticleDetail(slug);

  if (!content) {
    notFound();
  }

  const baseUrl =
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://pmkirumahbelajar-web.vercel.app");
  const cleanSlug = typeof content.slug === "string" ? content.slug.replace(/^\/?kabar\//, "").replace(/^\/+/, "") : "";
  const canonicalUrl = `${baseUrl}/kabar/${cleanSlug}`;
  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(
    generateWaShareText(content, canonicalUrl)
  )}`;

  // ==========================================
  // MODE 1: DOKUMENTASI GALERI (gallery_album)
  // ==========================================
  if (content.type === "gallery_album") {

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <PublicNavbar activeSection="kabar" />

        <main className="flex-1 py-8 sm:py-12">
          <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* 1. Breadcrumb & Back Navigation */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link
                href="/"
                className="hover:text-primary transition-colors focus-ring rounded-xs"
              >
                Beranda
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href="/kabar?tab=galeri"
                className="hover:text-primary transition-colors focus-ring rounded-xs"
              >
                Kabar Griya Asih
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-secondary-foreground font-medium truncate max-w-[180px] sm:max-w-xs">
                Dokumentasi Kegiatan
              </span>
            </nav>

            <div>
              <Link
                href="/kabar?tab=galeri"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus-ring rounded-control"
              >
                <ArrowLeft aria-hidden="true" className="w-4 h-4 shrink-0" />
                <span>Kembali ke Kabar Griya Asih</span>
              </Link>
            </div>

            {/* 2. Header Album & Narasi */}
            <header className="space-y-4 text-left">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-success-soft text-success shadow-xs">
                  {content.categoryLabel || "DOKUMENTASI KEGIATAN"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono tabular-nums">
                  <Calendar aria-hidden="true" className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{formatToIndonesianStandard(content.date)}</span>
                </span>
              </div>

              <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-snug">
                {content.title}
              </h1>

              <div className="flex items-center gap-2 text-xs text-secondary-foreground pt-1">
                <User aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>
                  Dokumentasi oleh: <strong className="font-semibold text-foreground">{content.author}</strong>
                </span>
              </div>

              {/* Narasi Deskriptif Intro */}
              <p className="text-sm sm:text-base leading-relaxed text-secondary-foreground pt-2 max-w-3xl">
                {content.description}
              </p>
            </header>

            {/* 3. Grid Foto Responsif (Click opens Enhanced Lightbox) */}
            <section aria-labelledby="album-grid-heading" className="pt-2">
              <h2 id="album-grid-heading" className="sr-only">
                Koleksi Foto {content.title}
              </h2>
              <GalleryAlbumGrid photos={content.photos} albumTitle={content.title} />
            </section>

            {/* 4. Privacy Notice */}
            <div className="p-3.5 rounded-card bg-surface-subtle border border-border text-[11px] text-muted-foreground leading-relaxed flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
              <span>
                Seluruh foto dokumentasi kegiatan ini telah mendapatkan persetujuan wali peserta didik dan melalui tinjauan privasi pengurus Rumah Belajar Griya Asih Lawang.
              </span>
            </div>

            {/* 5. Action Footer */}
            <footer className="pt-4 pb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-border">
              <a
                href={waShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary text-primary-foreground font-medium text-xs px-5 py-2.5 shadow-xs hover:bg-primary-hover focus-ring transition-colors"
              >
                <Share2 aria-hidden="true" className="w-4 h-4 shrink-0" />
                <span>Bagikan Album Ini</span>
              </a>

              <Link
                href="/kontak"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-surface border border-border text-foreground hover:bg-surface-subtle font-medium text-xs px-5 py-2.5 focus-ring transition-colors"
              >
                <span>Ada pertanyaan seputar kegiatan ini? Hubungi kami</span>
              </Link>
            </footer>
          </article>
        </main>
      </div>
    );
  }

  // ==========================================
  // MODE 2: WARTA BERITA (article)
  // ==========================================
  const sanitizedContent = (content.content || "").replace(/17[.:]15/g, "17.00");
  const eventLocation = content.eventLocation
    ? content.eventLocation.replace(/17[.:]15/g, "17.00")
    : null;

  const paragraphs = sanitizedContent
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const MapPinIcon = ICON_MAP.lokasi ?? MapPin;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicNavbar activeSection="kabar" />

      <main className="flex-1 py-8 sm:py-12">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* 1. Breadcrumb & Back Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/"
              className="hover:text-primary transition-colors focus-ring rounded-xs"
            >
              Beranda
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href="/kabar?tab=berita"
              className="hover:text-primary transition-colors focus-ring rounded-xs"
            >
              Kabar Griya Asih
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-secondary-foreground font-medium truncate max-w-[180px] sm:max-w-xs">
              {content.categoryLabel}
            </span>
          </nav>

          <div>
            <Link
              href="/kabar?tab=berita"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus-ring rounded-control"
            >
              <ArrowLeft aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>Kembali ke Kabar Griya Asih</span>
            </Link>
          </div>

          {/* 2. Article Header */}
          <header className="space-y-4 text-left">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-info-soft text-info shadow-xs">
                {content.categoryLabel}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono tabular-nums">
                <Calendar aria-hidden="true" className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{formatToIndonesianStandard(content.publishedDateFormatted || content.date)}</span>
              </span>
            </div>

            <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-snug">
              {content.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-secondary-foreground pt-1">
              <User aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>
                Ditulis oleh: <strong className="font-semibold text-foreground">{content.author}</strong>
              </span>
            </div>

            {/* Event Specific Block if applicable */}
            {(content.eventDate || content.eventLocation) && (
              <div className="p-3.5 rounded-card bg-surface-subtle border border-border space-y-1.5 text-xs">
                {content.eventDate && (
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <Calendar aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
                    <span>Jadwal agenda: <strong className="font-bold">{formatToIndonesianStandard(content.eventDate)}</strong></span>
                  </p>
                )}
                {eventLocation && (
                  <p className="flex items-center gap-2 text-secondary-foreground">
                    <MapPinIcon aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
                    <span>Lokasi kegiatan: {eventLocation}</span>
                  </p>
                )}
              </div>
            )}
          </header>

          {/* 3. Cover Media with Privacy Protection note */}
          {(content.coverSignedUrl || content.coverImage) && (
            <figure className="space-y-2">
              <div className="relative aspect-video w-full rounded-card overflow-hidden bg-surface-subtle border border-border shadow-xs">
                <Image
                  src={content.coverSignedUrl || content.coverImage || "/images/gallery/griya_asih_4.jpg"}
                  alt={content.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 896px"
                  className="object-cover"
                />
              </div>
              <figcaption className="text-[11px] text-muted-foreground text-left italic">
                Dokumentasi resmi Rumah Belajar Griya Asih Lawang. Telah melalui tinjauan privasi dan persetujuan publikasi.
              </figcaption>
            </figure>
          )}

          {/* 4. Article Body Content */}
          <section className="space-y-4 text-left leading-relaxed text-secondary-foreground text-sm sm:text-base border-b border-border pb-8">
            {paragraphs.map((para, idx) => (
              <p key={idx} className="leading-relaxed">
                {para}
              </p>
            ))}
          </section>

          {/* 5. Share & Interaction Footer */}
          <footer className="pt-2 pb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary text-primary-foreground font-medium text-xs px-5 py-2.5 shadow-xs hover:bg-primary-hover focus-ring transition-colors"
            >
              <Share2 aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>Bagikan ke WhatsApp</span>
            </a>

            <Link
              href="/kontak"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-surface border border-border text-foreground hover:bg-surface-subtle font-medium text-xs px-5 py-2.5 focus-ring transition-colors"
            >
              <span>Ada pertanyaan seputar kabar ini? Hubungi kami</span>
            </Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
