/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { storage } from '../../services/storage.ts';
import { PublicationPost } from '../../types/index.ts';
import {
  Calendar,
  User,
  ArrowRight,
  MapPin,
  Newspaper,
} from 'lucide-react';
import { Button, Dialog, Icon } from '../ui/index.ts';

/**
 * UI-12 News & Community Stories Section
 * Editorial storytelling with featured story hierarchy and canonical Dialog reader.
 */
export const NewsSection: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<PublicationPost | null>(null);

  const posts = storage.getPublications().filter((p) => p.status === 'PUBLISHED');
  const featuredPost = posts[0] || null;
  const supportingPosts = posts.slice(1);

  return (
    <section
      id="berita"
      aria-labelledby="news-section-heading"
      className="scroll-mt-32 py-16 sm:py-24 bg-background border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <div className="type-eyebrow text-primary uppercase tracking-wider">
            Kabar &amp; Perkembangan
          </div>
          <h2
            id="news-section-heading"
            className="type-page-title text-foreground tracking-tight"
          >
            Berita &amp; Agenda Rumah Belajar
          </h2>
          <p className="type-body-sm text-secondary-foreground leading-relaxed">
            Informasi terkini kegiatan, penambahan kelas belajar, kisah inspiratif literasi anak, dan pengumuman pelayanan.
          </p>
        </div>

        {/* Editorial Story Layout: Featured Story + Supporting Stories */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Featured Lead Story (Column Span 7) */}
          {featuredPost && (
            <article
              onClick={() => setSelectedPost(featuredPost)}
              tabIndex={0}
              role="button"
              aria-label={`Baca artikel utama: ${featuredPost.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPost(featuredPost);
                }
              }}
              className="lg:col-span-7 rounded-card overflow-hidden border border-border bg-surface shadow-xs hover:shadow-md transition-all cursor-pointer focus-ring flex flex-col justify-between group"
            >
              <div>
                <div className="aspect-16/9 overflow-hidden bg-surface-subtle relative">
                  <img
                    src={featuredPost.coverImage || '/images/gallery/griya_asih_4.jpg'}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-pill text-xs font-bold uppercase tracking-wider bg-surface/90 text-foreground backdrop-blur-xs border border-border shadow-xs">
                      {featuredPost.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-3 text-left">
                  <div className="flex items-center gap-3 type-caption text-secondary-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Icon icon={Calendar} size="xs" className="text-primary" />
                      {featuredPost.publishedAt
                        ? new Date(featuredPost.publishedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Terbaru'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Icon icon={User} size="xs" className="text-muted-foreground" />
                      {featuredPost.authorName}
                    </span>
                  </div>

                  <h3 className="type-h3 text-foreground group-hover:text-primary transition-colors leading-snug">
                    {featuredPost.title}
                  </h3>

                  <p className="type-body-sm text-secondary-foreground line-clamp-3 leading-relaxed">
                    {featuredPost.summary}
                  </p>
                </div>
              </div>

              <div className="px-6 sm:px-8 pb-6 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-semibold text-primary">
                <span>Baca Selengkapnya</span>
                <Icon icon={ArrowRight} size="xs" className="group-hover:translate-x-1 transition-transform" />
              </div>
            </article>
          )}

          {/* Supporting Stories List (Column Span 5) */}
          <div className="lg:col-span-5 space-y-4">
            {supportingPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => setSelectedPost(post)}
                tabIndex={0}
                role="button"
                aria-label={`Baca: ${post.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPost(post);
                  }
                }}
                className="rounded-control border border-border bg-surface p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer focus-ring group space-y-2 text-left"
              >
                <div className="flex items-center gap-2.5 type-caption text-secondary-foreground">
                  <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-surface-subtle text-foreground border border-border">
                    {post.category}
                  </span>
                  <span>•</span>
                  <span className="text-[11px] font-mono">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Terbaru'}
                  </span>
                </div>

                <h4 className="type-title text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                  {post.title}
                </h4>

                <p className="type-caption text-secondary-foreground line-clamp-2 leading-relaxed">
                  {post.summary}
                </p>

                <div className="pt-1 flex items-center gap-1 text-xs font-semibold text-primary">
                  <span>Baca ringkasan</span>
                  <Icon icon={ArrowRight} size="xs" className="group-hover:translate-x-1 transition-transform" />
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Canonical Dialog Article Reader */}
        <Dialog
          open={Boolean(selectedPost)}
          onClose={() => setSelectedPost(null)}
          title={selectedPost?.title || 'Berita Rumah Belajar'}
          description={
            selectedPost
              ? `Kategori: ${selectedPost.category} · Oleh: ${selectedPost.authorName} · ${
                  selectedPost.publishedAt
                    ? new Date(selectedPost.publishedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : ''
                }`
              : undefined
          }
          size="lg"
          footer={
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setSelectedPost(null)}
            >
              Tutup Berita
            </Button>
          }
        >
          {selectedPost && (
            <div className="space-y-4 text-left">
              {selectedPost.coverImage && (
                <div className="rounded-control overflow-hidden border border-border">
                  <img
                    src={selectedPost.coverImage}
                    alt={selectedPost.title}
                    className="w-full h-56 sm:h-64 object-cover"
                  />
                </div>
              )}

              {selectedPost.eventDate && (
                <div className="p-3.5 rounded-control bg-primary-soft/60 border border-primary/20 text-xs text-primary flex items-center gap-2.5 font-medium">
                  <Icon icon={Calendar} size="xs" className="shrink-0" />
                  <span>
                    Jadwal Agenda: {selectedPost.eventDate} {selectedPost.eventLocation ? `| Lokasi: ${selectedPost.eventLocation}` : ''}
                  </span>
                </div>
              )}

              <div className="type-body-sm text-secondary-foreground whitespace-pre-line leading-relaxed">
                {selectedPost.content}
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </section>
  );
};
