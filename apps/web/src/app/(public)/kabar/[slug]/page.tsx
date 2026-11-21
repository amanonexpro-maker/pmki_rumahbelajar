import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Calendar, MapPin, Share2, User } from "lucide-react";
import { ICON_MAP } from "@/config/icons";
import { getPublicArticleDetail, PublicNavbar } from "@/features/public";

export const instant = false;

interface PublicKabarDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PublicKabarDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicArticleDetail(slug);

  if (!article) {
    return {
      title: "Warta Tidak Ditemukan | Rumah Belajar Griya Asih Lawang",
      description: "Halaman warta atau publikasi kegiatan tidak ditemukan.",
    };
  }

  return {
    title: `${article.title} | Kabar Griya Asih`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [
        {
          url: article.coverSignedUrl,
          alt: article.title,
        },
      ],
    },
  };
}

/**
 * PublicKabarDetailPage (Detail Warta & Konten Berita).
 * Menampilkan konten lengkap artikel berita / publikasi komunitas Rumah Belajar Griya Asih Lawang.
 * - Membaca data publikasi riil dari database atau data kanonik autentik.
 * - Sesuai Design Identity §7 (Narrative Flow), §9 (Visual Restraint), UI-UX §15, §30.
 * - Mematuhi prinsip perlindungan privasi anak dan microcopy warm & human.
 */
export default async function PublicKabarDetailPage({
  params,
}: PublicKabarDetailPageProps) {
  await connection();
  const { slug } = await params;
  const article = await getPublicArticleDetail(slug);

  if (!article) {
    notFound();
  }

  const shareText = `${article.title}\n\n${article.excerpt}\n\nBaca selengkapnya di Kabar Rumah Belajar Griya Asih:`;
  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  // Parse body paragraphs
  const paragraphs = article.content
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
              {article.categoryLabel}
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
                {article.categoryLabel}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono tabular-nums">
                <Calendar aria-hidden="true" className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{article.publishedDateFormatted}</span>
              </span>
            </div>

            <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-snug">
              {article.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-secondary-foreground pt-1">
              <User aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>
                Ditulis oleh: <strong className="font-semibold text-foreground">{article.authorLabel}</strong>
              </span>
            </div>

            {/* Event Specific Block if applicable */}
            {(article.eventDate || article.eventLocation) && (
              <div className="p-3.5 rounded-card bg-surface-subtle border border-border space-y-1.5 text-xs">
                {article.eventDate && (
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <Calendar aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
                    <span>Jadwal agenda: <strong className="font-bold">{article.eventDate}</strong></span>
                  </p>
                )}
                {article.eventLocation && (
                  <p className="flex items-center gap-2 text-secondary-foreground">
                    <MapPinIcon aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
                    <span>Lokasi kegiatan: {article.eventLocation}</span>
                  </p>
                )}
              </div>
            )}
          </header>

          {/* 3. Cover Media with Privacy Protection note */}
          {article.coverSignedUrl && (
            <figure className="space-y-2">
              <div className="relative aspect-video w-full rounded-card overflow-hidden bg-surface-subtle border border-border shadow-xs">
                <Image
                  src={article.coverSignedUrl}
                  alt={article.title}
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
