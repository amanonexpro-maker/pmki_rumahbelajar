"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowRight,
  Calendar,
  Eye,
  Factory,
  GraduationCap,
  Image as ImageIcon,
  Newspaper,
  ShieldCheck,
  User,
} from "lucide-react";
import { EmptyState } from "@/components/compositions/empty-state";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatToIndonesianStandard } from "@/utils/date-formatter";
import type {
  PublicGalleryItemDTO,
  PublicNewsItemDTO,
  PublicVolunteerTeacherDTO,
} from "../types/public-types";
import type { PublicGalleryFilterCode } from "../validators/public-validator";

export interface PublicCommunityStorySectionProps {
  volunteerTeachers: PublicVolunteerTeacherDTO[];
  galleryItems: PublicGalleryItemDTO[];
  newsItems: PublicNewsItemDTO[];
  showLocalContext?: boolean;
  showGallery?: boolean;
  showNews?: boolean;
}

const GALLERY_CATEGORIES: { id: PublicGalleryFilterCode; label: string }[] = [
  { id: "ALL", label: "Semua dokumentasi" },
  { id: "KEGIATAN", label: "Kegiatan belajar" },
  { id: "PENGURUS", label: "Pengurus & pengajar relawan" },
  { id: "ACARA", label: "Acara & kebersamaan" },
];

/**
 * UI-12 Stop-Scrolling Moment 3: Community Story, 13 Volunteer Teachers,
 * Verified Public Gallery (`Dokumentasi`), and Published News (`Publikasi`).
 * - Visual Rhythm: Community Story `96px` (`py-16 lg:py-24` / `--space-24`).
 * - Uses `Newsreader` Display Typography (`type-display`) for the community narrative headline.
 * - Gallery strictly displays `privacyReviewed === true && eligibleForPublic === true` media via server signed URLs.
 * - News strictly displays `status === "PUBLISHED"` content via `PublishingService.listPublishedContent()`.
 */
export function PublicCommunityStorySection({
  volunteerTeachers,
  galleryItems,
  newsItems,
  showLocalContext = true,
  showGallery = true,
  showNews = true,
}: PublicCommunityStorySectionProps) {
  const [selectedCategory, setSelectedCategory] =
    React.useState<PublicGalleryFilterCode>("ALL");
  const [activeMedia, setActiveMedia] =
    React.useState<PublicGalleryItemDTO | null>(null);
  const [selectedPost, setSelectedPost] =
    React.useState<PublicNewsItemDTO | null>(null);

  const filteredGallery =
    selectedCategory === "ALL"
      ? galleryItems
      : galleryItems.filter((item) => item.category === selectedCategory);

  const featuredPost = newsItems[0] ?? null;
  const supportingPosts = newsItems.slice(1);

  return (
    <div className="divide-y divide-border">
      {/* Part 1: Local Context Kalirejo-Lawang & 13 Pengajar Relawan (96px rhythm) */}
      {showLocalContext && (
        <section
          aria-labelledby="community-story-heading"
          className="py-12 sm:py-20 lg:py-24 bg-surface"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 lg:space-y-16">
            {/* Dignified Local Community Story */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-surface-subtle border border-border text-xs font-semibold text-foreground">
                  <Factory
                    aria-hidden="true"
                    className="w-3.5 h-3.5 text-primary"
                  />
                  <span>Kisah komunitas &amp; latar belakang pelayanan</span>
                </div>

                <h2
                  id="community-story-heading"
                  className="type-display text-foreground tracking-tight"
                >
                  Hadir di tengah keluarga pekerja Kalirejo dan Lawang.
                </h2>

                <p className="type-body-sm text-secondary-foreground leading-relaxed">
                  Rumah Belajar Griya Asih berlokasi di perbatasan antara{" "}
                  <strong className="text-foreground">
                    Kelurahan Kalirejo
                  </strong>{" "}
                  dan{" "}
                  <strong className="text-foreground">Kelurahan Lawang</strong>,
                  Kabupaten Malang. Kawasan ini merupakan area industri dan
                  pabrik di mana mayoritas orang tua bekerja dengan jadwal yang
                  padat setiap hari.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-secondary-foreground">
                  <div className="flex items-start gap-2.5 p-3.5 rounded-control bg-surface-subtle border border-border-subtle">
                    <span className="text-primary font-bold">•</span>
                    <span>
                      Mendampingi peserta didik di RAAL Griya Asih yang
                      memerlukan bimbingan belajar terarah setiap pekan.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3.5 rounded-control bg-surface-subtle border border-border-subtle">
                    <span className="text-primary font-bold">•</span>
                    <span>
                      Memberikan bimbingan tambahan cuma-cuma bagi keluarga
                      pekerja di sekitar lingkungan pelayanan.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3.5 rounded-control bg-surface-subtle border border-border-subtle">
                    <span className="text-primary font-bold">•</span>
                    <span>
                      Ruang tumbuh yang aman dan hangat bagi peserta didik saat
                      orang tua menjalani jam kerja pabrik.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3.5 rounded-control bg-surface-subtle border border-border-subtle">
                    <span className="text-primary font-bold">•</span>
                    <span>
                      Saat ini 80+ peserta didik terdaftar aktif dari potensi
                      125 anak di sekitar Kalirejo dan Lawang.
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <figure className="rounded-card overflow-hidden border border-border bg-surface-subtle">
                  <div className="relative w-full h-64 sm:h-72 bg-surface-subtle">
                    <Image
                      src="/images/gallery/griya_asih_9.jpg"
                      alt="Foto bersama peserta didik dan pengajar relawan dengan seragam Rumah Belajar Griya Asih Lawang"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 480px"
                      className="object-cover object-top"
                    />
                  </div>
                  <figcaption className="p-3.5 bg-surface border-t border-border text-xs text-secondary-foreground">
                    Kebersamaan peserta didik dan pengajar relawan dengan
                    seragam Rumah Belajar Griya Asih Lawang.
                  </figcaption>
                </figure>
              </div>
            </div>

            {/* 13 Pengajar Relawan */}
            <div className="rounded-card bg-surface-subtle border border-border p-6 sm:p-8 lg:p-10 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border">
                <div>
                  <div className="type-eyebrow text-primary uppercase tracking-wider mb-1">
                    Kekuatan komunitas pendidik
                  </div>
                  <h3 className="type-h3 text-foreground">
                    Didukung oleh 13 pengajar relawan berpengalaman
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-surface rounded-pill border border-border text-primary text-xs font-semibold">
                  <GraduationCap aria-hidden="true" className="w-4 h-4" />
                  <span>
                    Kolaborasi pendidik sekolah Katolik &amp; sekolah negeri
                    Lawang
                  </span>
                </div>
              </div>

              <p className="type-body-sm text-secondary-foreground leading-relaxed">
                Para <strong className="text-foreground">pengajar relawan</strong>{" "}
                Rumah Belajar Griya Asih berdomisili di seputar Kelurahan
                Kalirejo dan Kelurahan Lawang. Mereka berasal dari sekolah
                Katolik dan sekolah negeri di Lawang yang dengan sukarela
                mempersembahkan waktu, keahlian, dan kasih demi masa depan
                peserta didik.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 text-xs">
                {volunteerTeachers.map((teacher) => (
                  <div
                    key={teacher.name}
                    className="p-3.5 rounded-control bg-surface border border-border space-y-1"
                  >
                    <p className="font-semibold text-foreground">
                      {teacher.name}
                    </p>
                    <p className="text-secondary-foreground">
                      {teacher.originInstitution}
                    </p>
                    <span
                      className={cn(
                        "text-[11px] font-medium block",
                        teacher.isCoordinator
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {teacher.focusRole}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Part 2: Verified Public Gallery / Dokumentasi (96px rhythm) */}
      {showGallery && (
        <section
          id="galeri"
          aria-labelledby="gallery-section-heading"
          className="scroll-mt-28 py-12 sm:py-20 lg:py-24 bg-background"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl space-y-3">
                <div className="type-eyebrow text-primary uppercase tracking-wider">
                  Dokumentasi kegiatan
                </div>
                <h2
                  id="gallery-section-heading"
                  className="type-section-title text-foreground tracking-tight text-balance"
                >
                  Momen kebersamaan di Rumah Belajar Griya Asih
                </h2>
                <p className="type-body-sm text-secondary-foreground leading-relaxed">
                  Keceriaan, kesungguhan belajar, dan interaksi hangat antara
                  para pengajar relawan serta peserta didik di Lawang.
                </p>
              </div>

              {/* Privacy Verification Safeguard Ribbon (100% Bahasa Indonesia) */}
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-pill bg-surface border border-border text-xs text-secondary-foreground self-start md:self-auto">
                <ShieldCheck
                  aria-hidden="true"
                  className="w-4 h-4 text-primary shrink-0"
                />
                <span>
                  Dokumentasi publik telah melalui tinjauan privasi &amp;
                  persetujuan wali
                </span>
              </div>
            </div>

            {/* Category Filter Pills (touch target >= 44px) */}
            <div
              role="tablist"
              aria-label="Filter kategori dokumentasi"
              className="flex flex-wrap items-center gap-2"
            >
              {GALLERY_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "min-h-11 px-4 py-2 rounded-pill text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer focus-ring",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-surface hover:bg-surface-subtle text-secondary-foreground hover:text-foreground border border-border"
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Gallery Grid */}
            {filteredGallery.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="Belum ada dokumentasi pada kategori ini"
                description="Dokumentasi kegiatan belajar hanya ditampilkan setelah lolos tinjauan privasi dan persetujuan foto & video dari wali peserta didik."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGallery.map((item, index) => {
                  const isFeatured = index === 0 && selectedCategory === "ALL";
                  return (
                    <article
                      key={item.id}
                      onClick={() => setActiveMedia(item)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Buka dokumentasi foto: ${item.title}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveMedia(item);
                        }
                      }}
                      className={cn(
                        "group relative rounded-card overflow-hidden border border-border bg-surface transition-colors cursor-pointer focus-ring flex flex-col justify-between",
                        isFeatured && "sm:col-span-2 lg:col-span-2"
                      )}
                    >
                      <div
                        className={cn(
                          "relative overflow-hidden bg-surface-subtle w-full aspect-4/3",
                          isFeatured && "sm:aspect-16/10"
                        )}
                      >
                        <Image
                          src={item.signedReadUrl}
                          alt={item.title}
                          fill
                          sizes={
                            isFeatured
                              ? "(max-width: 768px) 100vw, 66vw"
                              : "(max-width: 768px) 100vw, 33vw"
                          }
                          className="object-cover"
                        />
                      </div>

                      <div className="p-4 sm:p-5 bg-surface border-t border-border space-y-1.5 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-primary">
                            {item.categoryLabel}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                            {formatToIndonesianStandard(item.capturedDate)}
                          </span>
                        </div>

                        <h3 className="type-title text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>

                        <p className="type-caption text-secondary-foreground line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="pt-2 flex items-center gap-1.5 text-xs text-primary font-semibold">
                          <Eye aria-hidden="true" className="w-3.5 h-3.5" />
                          <span>Lihat foto penuh</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Canonical Dialog Lightbox (100% Bahasa Indonesia per TERMINOLOGY-CHECKLIST) */}
            <Dialog
              open={Boolean(activeMedia)}
              onOpenChange={(open) => {
                if (!open) setActiveMedia(null);
              }}
            >
              <DialogContent size="lg">
                <DialogHeader>
                  <DialogTitle>
                    {activeMedia?.title ?? "Dokumentasi rumah belajar"}
                  </DialogTitle>
                  {activeMedia && (
                    <DialogDescription>
                      Kategori: {activeMedia.categoryLabel} · Tanggal:{" "}
                      {formatToIndonesianStandard(activeMedia.capturedDate)}
                    </DialogDescription>
                  )}
                </DialogHeader>
                {activeMedia && (
                  <DialogBody className="space-y-4">
                    <div className="relative rounded-control overflow-hidden border border-border bg-surface-subtle w-full h-72 sm:h-96">
                      <Image
                        src={activeMedia.signedReadUrl}
                        alt={activeMedia.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 720px"
                        className="object-contain"
                      />
                    </div>
                    <p className="type-body-sm text-secondary-foreground leading-relaxed">
                      {activeMedia.description}
                    </p>
                  </DialogBody>
                )}
                <DialogFooter className="justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-secondary-foreground">
                    <ShieldCheck
                      aria-hidden="true"
                      className="w-4 h-4 text-primary shrink-0"
                    />
                    <span>
                      Dokumentasi ini telah mendapatkan persetujuan wali untuk
                      publikasi.
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveMedia(null)}
                  >
                    Tutup dialog
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>
      )}

      {/* Part 3: Published News / Publikasi (96px rhythm) */}
      {showNews && (
        <section
          id="berita"
          aria-labelledby="news-section-heading"
          className="scroll-mt-28 py-16 lg:py-24 bg-surface"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-2xl space-y-3">
              <div className="type-eyebrow text-primary uppercase tracking-wider">
                Publikasi &amp; kabar kegiatan
              </div>
              <h2
                id="news-section-heading"
                className="type-section-title text-foreground tracking-tight"
              >
                Berita dan agenda Rumah Belajar
              </h2>
              <p className="type-body-sm text-secondary-foreground leading-relaxed">
                Informasi terkini kegiatan belajar, penambahan kelas baru, kisah
                kemajuan literasi peserta didik, dan pengumuman pelayanan.
              </p>
            </div>

            {newsItems.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title="Belum ada publikasi yang ditayangkan"
                description="Berita dan agenda kegiatan akan tampil di sini setelah disetujui melalui tinjauan privasi dan diterbitkan oleh pengurus."
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Featured Lead Story */}
                {featuredPost && (
                  <article
                    onClick={() => setSelectedPost(featuredPost)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Baca publikasi utama: ${featuredPost.title}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedPost(featuredPost);
                      }
                    }}
                    className="lg:col-span-7 rounded-card overflow-hidden border border-border bg-surface transition-colors cursor-pointer focus-ring flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative aspect-16/9 overflow-hidden bg-surface-subtle">
                        <Image
                          src={featuredPost.coverSignedUrl}
                          alt={featuredPost.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 60vw"
                          className="object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 rounded-pill text-xs font-semibold bg-surface/95 text-foreground border border-border">
                            {featuredPost.categoryLabel}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 sm:p-8 space-y-3 text-left">
                        <div className="flex flex-wrap items-center gap-3 type-caption text-secondary-foreground">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar
                              aria-hidden="true"
                              className="w-3.5 h-3.5 text-primary"
                            />
                            <span>{featuredPost.publishedDateFormatted}</span>
                          </span>
                          <span aria-hidden="true">•</span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <User
                              aria-hidden="true"
                              className="w-3.5 h-3.5 text-muted-foreground"
                            />
                            <span>{featuredPost.authorLabel}</span>
                          </span>
                        </div>

                        <h3 className="type-h3 text-foreground group-hover:text-primary transition-colors leading-snug">
                          {featuredPost.title}
                        </h3>

                        <p className="type-body-sm text-secondary-foreground line-clamp-3 leading-relaxed">
                          {featuredPost.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 sm:px-8 pb-6 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-semibold text-primary">
                      <span>Baca artikel lengkap</span>
                      <ArrowRight aria-hidden="true" className="w-4 h-4" />
                    </div>
                  </article>
                )}

                {/* Supporting Stories List */}
                <div className="lg:col-span-5 space-y-4">
                  {supportingPosts.map((post) => (
                    <article
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Baca publikasi: ${post.title}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedPost(post);
                        }
                      }}
                      className="rounded-control border border-border bg-surface p-5 transition-colors cursor-pointer focus-ring group space-y-2 text-left"
                    >
                      <div className="flex items-center gap-2.5 type-caption text-secondary-foreground">
                        <span className="px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-surface-subtle text-foreground border border-border">
                          {post.categoryLabel}
                        </span>
                        <span aria-hidden="true">•</span>
                        <span className="text-xs font-mono tabular-nums">
                          {post.publishedDateFormatted}
                        </span>
                      </div>

                      <h3 className="type-title text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="type-caption text-secondary-foreground line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>

                      <div className="pt-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <span>Baca artikel lengkap</span>
                        <ArrowRight
                          aria-hidden="true"
                          className="w-3.5 h-3.5"
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* Canonical Dialog Article Reader */}
            <Dialog
              open={Boolean(selectedPost)}
              onOpenChange={(open) => {
                if (!open) setSelectedPost(null);
              }}
            >
              <DialogContent size="lg">
                <DialogHeader>
                  <DialogTitle>
                    {selectedPost?.title ?? "Publikasi rumah belajar"}
                  </DialogTitle>
                  {selectedPost && (
                    <DialogDescription>
                      Kategori: {selectedPost.categoryLabel} ·{" "}
                      {selectedPost.publishedDateFormatted}
                    </DialogDescription>
                  )}
                </DialogHeader>
                {selectedPost && (
                  <DialogBody className="space-y-4 text-left">
                    <div className="relative rounded-control overflow-hidden border border-border w-full h-56 sm:h-64 bg-surface-subtle">
                      <Image
                        src={selectedPost.coverSignedUrl}
                        alt={selectedPost.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 680px"
                        className="object-cover"
                      />
                    </div>

                    {selectedPost.eventDate && (
                      <div className="p-3.5 rounded-control bg-primary-soft/60 border border-primary/20 text-xs text-primary flex items-center gap-2.5 font-medium">
                        <Calendar
                          aria-hidden="true"
                          className="w-4 h-4 shrink-0"
                        />
                        <span>
                          Jadwal agenda: {formatToIndonesianStandard(selectedPost.eventDate)}
                          {selectedPost.eventLocation
                            ? ` · Lokasi: ${selectedPost.eventLocation}`
                            : ""}
                        </span>
                      </div>
                    )}

                    <div className="type-body-sm text-secondary-foreground whitespace-pre-line leading-relaxed">
                      {selectedPost.content}
                    </div>
                  </DialogBody>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setSelectedPost(null)}
                  >
                    Tutup publikasi
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>
      )}
    </div>
  );
}
