/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Newspaper,
  Plus,
  Send,
  Eye,
  ShieldCheck,
  Globe,
  Archive,
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  CheckCircle2,
  X,
} from 'lucide-react';
import { storage } from '../../services/storage.ts';
import { PublicationPost, PublicationStatus } from '../../types/index.ts';
import { can } from '../../permissions/can.ts';
import {
  Badge,
  type BadgeVariant,
  Button,
  Dialog,
  Input,
  Select,
  Textarea,
} from '../ui/index.ts';
import {
  PageHeader,
  StatSummary,
  SearchToolbar,
  DataTable,
  type DataTableColumn,
  EmptyState,
  WorkflowProgress,
  type WorkflowStageItem,
} from '../patterns/index.ts';

const PUBLICATION_CATEGORY_LABEL: Record<PublicationPost['category'], string> =
  {
    BERITA: 'Berita Kegiatan',
    AGENDA: 'Agenda Pelayanan',
    PENGUMUMAN: 'Pengumuman Resmi',
    ARTIKEL: 'Artikel Literasi',
  };

const PUBLICATION_STATUS_META: Record<
  PublicationStatus,
  {
    label: string;
    badgeVariant: BadgeVariant;
    whyText: string;
    nextActor: string;
    nextTransitionText: string;
  }
> = {
  DRAFT: {
    label: 'Draft Konten',
    badgeVariant: 'neutral',
    whyText:
      'Konten baru ditulis dan belum diajukan ke pemeriksaan privasi anak.',
    nextActor: 'Penulis / Koordinator Program',
    nextTransitionText:
      'Mengajukan ke Tinjauan Privasi akan menyerahkan naskah dan foto sampul untuk diperiksa kepatuhan perlindungan anaknya.',
  },
  PRIVACY_REVIEW: {
    label: 'Tinjauan Privasi',
    badgeVariant: 'warning',
    whyText:
      'Konten sedang diperiksa untuk memastikan tidak ada identitas atau foto anak tanpa persetujuan wali.',
    nextActor: 'Peninjau Privasi Media / Kepala Unit',
    nextTransitionText:
      'Menyetujui tinjauan privasi akan menandai konten Disetujui Editorial dan siap ditayangkan.',
  },
  APPROVED: {
    label: 'Disetujui Editorial',
    badgeVariant: 'info',
    whyText:
      'Naskah dan dokumentasi telah lolos tinjauan privasi dan siap diterbitkan ke halaman publik.',
    nextActor: 'Pejabat Publikasi / Kepala Unit / Pengurus',
    nextTransitionText:
      'Menayangkan konten akan membuatnya langsung tampil pada portal informasi publik Rumah Belajar.',
  },
  PUBLISHED: {
    label: 'Tayang di Publik',
    badgeVariant: 'success',
    whyText:
      'Konten telah diterbitkan secara resmi dan dapat dibaca oleh masyarakat umum.',
    nextActor: 'Tidak ada tindakan tertunda (Dapat diarsipkan bila selesai)',
    nextTransitionText:
      'Mengarsipkan konten akan menariknya dari daftar berita aktif di halaman publik.',
  },
  ARCHIVED: {
    label: 'Diarsipkan',
    badgeVariant: 'neutral',
    whyText:
      'Konten telah ditarik dari halaman publik dan disimpan sebagai arsip dokumentasi.',
    nextActor:
      'Pejabat Publikasi (Dapat diaktifkan kembali ke Draft bila diperlukan)',
    nextTransitionText:
      'Konten tetap tersimpan di basis data internal namun tidak tampil di portal publik.',
  },
};

function buildPublicationWorkflowStages(
  status: PublicationStatus
): WorkflowStageItem[] {
  const order: Array<{
    id: PublicationStatus;
    label: string;
    actorHint: string;
  }> = [
    {
      id: 'DRAFT',
      label: '1. Draft Konten',
      actorHint: 'Penulis / Pengajar',
    },
    {
      id: 'PRIVACY_REVIEW',
      label: '2. Tinjauan Privasi',
      actorHint: 'Peninjau Privasi & Media',
    },
    {
      id: 'APPROVED',
      label: '3. Disetujui Editorial',
      actorHint: 'Koordinator / Kepala Unit',
    },
    {
      id: 'PUBLISHED',
      label: '4. Tayang di Publik',
      actorHint: 'Pejabat Publikasi',
    },
  ];

  if (status === 'ARCHIVED') {
    return order.map((item) => ({
      ...item,
      state: 'archived',
    }));
  }

  const currentIdx = order.findIndex((o) => o.id === status);

  return order.map((item, idx) => {
    if (status === 'PUBLISHED') {
      return { ...item, state: 'completed' };
    }
    if (idx < currentIdx) {
      return { ...item, state: 'completed' };
    }
    if (idx === currentIdx) {
      return { ...item, state: 'current' };
    }
    return { ...item, state: 'upcoming' };
  });
}

export const PublishingView: React.FC = () => {
  const [posts, setPosts] = useState<PublicationPost[]>(() =>
    storage.getPublications()
  );
  const mediaAssets = useMemo(() => storage.getMediaAssets(), []);
  const currentUser = storage.getCurrentUser();

  // Permissions
  const canWritePublication = can(currentUser, 'publication.write');
  const canReviewMedia = can(currentUser, 'media.review');
  const canPublish = can(currentUser, 'publication.publish');

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Selected post for governance detail review
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Consequential status transition dialog
  const [pendingTransition, setPendingTransition] = useState<{
    post: PublicationPost;
    targetStatus: PublicationStatus;
  } | null>(null);

  // Create new publication dialog
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] =
    useState<PublicationPost['category']>('BERITA');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState(
    '/images/gallery/griya_asih_8.jpg'
  );
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('RAAL Griya Asih Lawang');
  const [formError, setFormError] = useState<string | null>(null);

  // Feedback banner
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  const refreshPosts = () => {
    setPosts([...storage.getPublications()]);
  };

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedPostId) ?? null,
    [posts, selectedPostId]
  );

  // Summary metrics
  const stats = useMemo(() => {
    const total = posts.length;
    const inReview = posts.filter(
      (p) => p.status === 'DRAFT' || p.status === 'PRIVACY_REVIEW'
    ).length;
    const approvedReady = posts.filter((p) => p.status === 'APPROVED').length;
    const publishedLive = posts.filter((p) => p.status === 'PUBLISHED').length;

    return [
      {
        id: 'total-posts',
        label: 'Total Konten Editorial',
        value: total,
        meta: 'Berita, agenda, pengumuman, dan artikel',
      },
      {
        id: 'in-review',
        label: 'Draft & Tinjauan Privasi',
        value: inReview,
        meta: 'Menunggu pemeriksaan perlindungan anak',
      },
      {
        id: 'approved-ready',
        label: 'Siap Tayang (Disetujui)',
        value: approvedReady,
        meta: 'Telah lolos kurasi privasi',
      },
      {
        id: 'published-live',
        label: 'Tayang di Portal Publik',
        value: publishedLive,
        meta: 'Aktif diakses masyarakat umum',
      },
    ];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.summary.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' || post.status === statusFilter;
      const matchesCategory =
        categoryFilter === 'ALL' || post.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [posts, searchQuery, statusFilter, categoryFilter]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim()) {
      setFormError(
        'Judul, ringkasan singkat, dan isi lengkap konten wajib diisi.'
      );
      return;
    }

    const created = storage.createPublication({
      title: title.trim(),
      category,
      summary: summary.trim(),
      content: content.trim(),
      coverImage: coverImage || '/images/gallery/griya_asih_8.jpg',
      eventDate: eventDate || undefined,
      eventLocation: eventLocation.trim() || undefined,
    });

    refreshPosts();
    setModalOpen(false);
    setTitle('');
    setSummary('');
    setContent('');
    setFormError(null);
    setSelectedPostId(created.id);
    setFeedbackMsg({
      type: 'success',
      text: `Konten "${created.title}" berhasil disimpan sebagai Draft Konten. Silakan ajukan ke Tinjauan Privasi sebelum ditayangkan.`,
    });
  };

  const handleConfirmTransition = () => {
    if (!pendingTransition) return;
    storage.updatePublicationStatus(
      pendingTransition.post.id,
      pendingTransition.targetStatus
    );
    refreshPosts();

    const targetMeta = PUBLICATION_STATUS_META[pendingTransition.targetStatus];
    setFeedbackMsg({
      type: 'success',
      text: `Status publikasi "${pendingTransition.post.title}" telah diperbarui menjadi ${targetMeta.label}.`,
    });
    setPendingTransition(null);
  };

  // Helper to check if coverImage matches a known media asset and its eligibility
  const getCoverMediaGovernance = (imageUrl?: string) => {
    if (!imageUrl) return null;
    return mediaAssets.find((m) => m.url === imageUrl) ?? null;
  };

  const columns: DataTableColumn<PublicationPost>[] = [
    {
      id: 'post',
      header: 'Judul & Kategori Konten',
      cell: (post) => (
        <div className="space-y-1 max-w-md">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="neutral" size="sm">
              {PUBLICATION_CATEGORY_LABEL[post.category]}
            </Badge>
            <span className="text-xs font-semibold text-foreground">
              {post.title}
            </span>
          </div>
          <p className="text-xs text-secondary-foreground line-clamp-1">
            {post.summary}
          </p>
        </div>
      ),
    },
    {
      id: 'author',
      header: 'Penulis & Tanggal',
      cell: (post) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground">{post.authorName}</div>
          <div className="text-[11px] text-muted-foreground">
            {post.publishedAt
              ? `Tayang: ${new Date(post.publishedAt).toLocaleDateString('id-ID')}`
              : post.eventDate
                ? `Agenda: ${post.eventDate}`
                : 'Belum tayang'}
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Tahap Tata Kelola',
      cell: (post) => {
        const meta = PUBLICATION_STATUS_META[post.status];
        return (
          <div className="space-y-1">
            <Badge variant={meta.badgeVariant} size="sm" dot>
              {meta.label}
            </Badge>
            <p className="text-[11px] text-muted-foreground">
              Selanjutnya: {meta.nextActor}
            </p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Tindakan',
      align: 'right',
      cell: (post) => (
        <div className="flex items-center justify-end gap-1.5">
          {post.status === 'DRAFT' && canWritePublication && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setPendingTransition({
                  post,
                  targetStatus: 'PRIVACY_REVIEW',
                });
              }}
            >
              Ajukan Tinjauan Privasi
            </Button>
          )}
          {post.status === 'PRIVACY_REVIEW' &&
            (canReviewMedia || canPublish) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingTransition({
                    post,
                    targetStatus: 'APPROVED',
                  });
                }}
              >
                Setujui Editorial
              </Button>
            )}
          {post.status === 'APPROVED' && canPublish && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setPendingTransition({
                  post,
                  targetStatus: 'PUBLISHED',
                });
              }}
            >
              Tayangkan ke Publik
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Eye className="h-3.5 w-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPostId(post.id);
              setFeedbackMsg(null);
            }}
          >
            Periksa
          </Button>
        </div>
      ),
    },
  ];

  // Detailed Publication Governance Inspector View
  if (selectedPost) {
    const statusMeta = PUBLICATION_STATUS_META[selectedPost.status];
    const stages = buildPublicationWorkflowStages(selectedPost.status);
    const matchedAsset = getCoverMediaGovernance(selectedPost.coverImage);

    const canAdvanceToPrivacyReview =
      selectedPost.status === 'DRAFT' && canWritePublication;
    const canApproveEditorial =
      selectedPost.status === 'PRIVACY_REVIEW' &&
      (canReviewMedia || canPublish);
    const canPublishLive = selectedPost.status === 'APPROVED' && canPublish;
    const canArchivePost = selectedPost.status === 'PUBLISHED' && canPublish;
    const canReturnToDraft =
      (selectedPost.status === 'PRIVACY_REVIEW' ||
        selectedPost.status === 'APPROVED' ||
        selectedPost.status === 'ARCHIVED') &&
      (canWritePublication || canReviewMedia || canPublish);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => setSelectedPostId(null)}
          >
            Kembali ke Daftar Publikasi
          </Button>
          <Badge variant={statusMeta.badgeVariant} dot>
            {statusMeta.label}
          </Badge>
        </div>

        {feedbackMsg && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-md border border-success/35 bg-success-soft px-4 py-3 text-xs text-foreground"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div>
                <p className="font-semibold">Status Publikasi Diperbarui</p>
                <p className="mt-0.5 text-secondary-foreground">
                  {feedbackMsg.text}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Tutup pesan"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-border pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-secondary-foreground">
                <Badge variant="neutral" size="sm">
                  {PUBLICATION_CATEGORY_LABEL[selectedPost.category]}
                </Badge>
                <span>•</span>
                <span>Penulis: {selectedPost.authorName}</span>
                {selectedPost.publishedAt && (
                  <>
                    <span>•</span>
                    <span>
                      Diterbitkan:{' '}
                      {new Date(selectedPost.publishedAt).toLocaleDateString(
                        'id-ID'
                      )}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {selectedPost.title}
              </h2>
              <p className="text-xs text-secondary-foreground">
                {selectedPost.summary}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedPost.status === 'PUBLISHED' ? (
                <Badge variant="success" dot>
                  Tayang di Portal Publik
                </Badge>
              ) : (
                <Badge variant="neutral">Belum Tayang di Publik</Badge>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
              Alur Kendali Editorial & Privasi
            </p>
            <WorkflowProgress stages={stages} />
          </div>

          {/* 5 Governance Questions Summary Grid */}
          <div className="grid grid-cols-1 gap-3 rounded-md border border-border bg-surface-subtle/50 p-4 md:grid-cols-3">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                1. Mengapa dalam status ini?
              </span>
              <p className="text-xs leading-relaxed text-foreground">
                {statusMeta.whyText}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                2. Siapa yang menindaklanjuti?
              </span>
              <p className="text-xs font-semibold text-foreground">
                {statusMeta.nextActor}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                3. Dampak langkah berikutnya
              </span>
              <p className="text-xs leading-relaxed text-secondary-foreground">
                {statusMeta.nextTransitionText}
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Article Content & Media Eligibility Check */}
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Pratinjau Naskah & Dokumentasi Visual
                </h3>
                <p className="text-xs text-secondary-foreground mt-0.5">
                  Periksa kesesuaian isi artikel dan kelayakan privasi gambar
                  sampul sebelum diterbitkan.
                </p>
              </div>

              {selectedPost.coverImage && (
                <div className="overflow-hidden rounded-md border border-border bg-surface-subtle/40">
                  <div className="aspect-16/9 max-h-64 w-full overflow-hidden bg-surface-subtle">
                    <img
                      src={selectedPost.coverImage}
                      alt={selectedPost.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs">
                    <span className="text-secondary-foreground">
                      Aset Sampul:{' '}
                      <strong className="text-foreground">
                        {matchedAsset
                          ? matchedAsset.title
                          : selectedPost.coverImage}
                      </strong>
                    </span>
                    {matchedAsset ? (
                      <Badge
                        variant={
                          matchedAsset.isEligibleForPublic
                            ? 'success'
                            : 'warning'
                        }
                        size="sm"
                        dot
                      >
                        {matchedAsset.isEligibleForPublic
                          ? 'Media Terverifikasi Layak Publik'
                          : 'Perhatian: Media Bertanda Hanya Internal'}
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Ilustrasi Standar
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {(selectedPost.eventDate || selectedPost.eventLocation) && (
                <div className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-surface-subtle/40 px-3.5 py-2.5 text-xs text-secondary-foreground">
                  {selectedPost.eventDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Tanggal Agenda: {selectedPost.eventDate}</span>
                    </span>
                  )}
                  {selectedPost.eventLocation && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Lokasi: {selectedPost.eventLocation}</span>
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground">
                  Isi Lengkap Publikasi
                </h4>
                <div className="rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-foreground whitespace-pre-line">
                  {selectedPost.content}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Governance Action Controls */}
          <div className="space-y-6">
            <section className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Keputusan Alur Publikasi
                </h3>
                <p className="text-xs text-secondary-foreground mt-0.5">
                  Peran aktif:{' '}
                  <strong className="text-foreground">
                    {currentUser.name}
                  </strong>{' '}
                  ({currentUser.role})
                </p>
              </div>

              <div className="rounded-md border border-border bg-surface-subtle/50 p-3.5 text-xs space-y-1.5">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Daftar Periksa Sebelum Tayang:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-secondary-foreground">
                  <li>
                    Tidak mencantumkan alamat rumah atau kontak pribadi anak.
                  </li>
                  <li>
                    Foto sampul tidak menampilkan wajah anak yang izin fotonya
                    ditolak/dicabut.
                  </li>
                  <li>
                    Bahasa menghormati martabat peserta didik dan keluarga.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                {selectedPost.status === 'DRAFT' && (
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={!canAdvanceToPrivacyReview}
                    leftIcon={<Send className="h-4 w-4" />}
                    onClick={() =>
                      setPendingTransition({
                        post: selectedPost,
                        targetStatus: 'PRIVACY_REVIEW',
                      })
                    }
                  >
                    Ajukan ke Tinjauan Privasi
                  </Button>
                )}

                {selectedPost.status === 'PRIVACY_REVIEW' && (
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={!canApproveEditorial}
                    leftIcon={<ShieldCheck className="h-4 w-4" />}
                    onClick={() =>
                      setPendingTransition({
                        post: selectedPost,
                        targetStatus: 'APPROVED',
                      })
                    }
                  >
                    Setujui Tinjauan Privasi & Editorial
                  </Button>
                )}

                {selectedPost.status === 'APPROVED' && (
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={!canPublishLive}
                    leftIcon={<Globe className="h-4 w-4" />}
                    onClick={() =>
                      setPendingTransition({
                        post: selectedPost,
                        targetStatus: 'PUBLISHED',
                      })
                    }
                  >
                    Tayangkan ke Website Publik
                  </Button>
                )}

                {selectedPost.status === 'PUBLISHED' && (
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={!canArchivePost}
                    leftIcon={<Archive className="h-4 w-4" />}
                    onClick={() =>
                      setPendingTransition({
                        post: selectedPost,
                        targetStatus: 'ARCHIVED',
                      })
                    }
                  >
                    Arsipkan dari Halaman Publik
                  </Button>
                )}

                {canReturnToDraft && (
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() =>
                      setPendingTransition({
                        post: selectedPost,
                        targetStatus: 'DRAFT',
                      })
                    }
                  >
                    Kembalikan ke Status Draft
                  </Button>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Consequential Publication Status Confirmation Dialog */}
        <Dialog
          open={pendingTransition !== null}
          onClose={() => setPendingTransition(null)}
          title={
            pendingTransition?.targetStatus === 'PUBLISHED'
              ? 'Tayangkan konten ini ke website publik?'
              : pendingTransition?.targetStatus === 'ARCHIVED'
                ? 'Arsipkan konten ini dari website publik?'
                : pendingTransition?.targetStatus === 'APPROVED'
                  ? 'Setujui tinjauan privasi & editorial?'
                  : 'Ubah tahapan status publikasi?'
          }
          description={
            pendingTransition
              ? PUBLICATION_STATUS_META[pendingTransition.targetStatus]
                  .nextTransitionText
              : ''
          }
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setPendingTransition(null)}
              >
                Batal
              </Button>
              <Button variant="primary" onClick={handleConfirmTransition}>
                Ya, Konfirmasi Perubahan Status
              </Button>
            </div>
          }
        >
          {pendingTransition && (
            <div className="space-y-3 text-xs">
              <div className="rounded-md border border-border bg-surface-subtle/50 p-3 space-y-1">
                <p className="font-semibold text-foreground">
                  {pendingTransition.post.title}
                </p>
                <p className="text-secondary-foreground">
                  Perubahan tahapan:{' '}
                  <strong>
                    {
                      PUBLICATION_STATUS_META[pendingTransition.post.status]
                        .label
                    }
                  </strong>{' '}
                  →{' '}
                  <strong>
                    {
                      PUBLICATION_STATUS_META[pendingTransition.targetStatus]
                        .label
                    }
                  </strong>
                </p>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    );
  }

  // Default Workspace List View
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alur Publikasi Editorial & Informasi Publik"
        description="Kelola siklus penerbitan berita, agenda kegiatan, pengumuman, dan artikel literasi melalui peninjauan privasi sebelum tayang di website publik."
        primaryAction={
          canWritePublication ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setFormError(null);
                setModalOpen(true);
              }}
            >
              Tulis Konten Baru
            </Button>
          ) : undefined
        }
      />

      {feedbackMsg && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-md border border-success/35 bg-success-soft px-4 py-3 text-xs text-foreground"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div>
              <p className="font-semibold">Status Publikasi Diperbarui</p>
              <p className="mt-0.5 text-secondary-foreground">
                {feedbackMsg.text}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Tutup pesan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <StatSummary items={stats} />

      {/* Editorial Governance Chain Overview */}
      <div className="flex items-start gap-3 rounded-md border border-border bg-surface-subtle/60 px-4 py-3 text-xs text-secondary-foreground">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground">
            Rantai Kendali Editorial:
          </span>{' '}
          Setiap konten melalui tahapan{' '}
          <strong>
            Draft Konten → Tinjauan Privasi → Disetujui Editorial → Tayang di
            Publik
          </strong>{' '}
          untuk memastikan perlindungan data dan foto anak selalu terjaga.
        </div>
      </div>

      <section className="rounded-card border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
        <SearchToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari judul berita, ringkasan, atau nama penulis..."
          filters={[
            {
              id: 'status',
              label: 'Tahap Publikasi',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'ALL', label: 'Semua Tahap' },
                { value: 'DRAFT', label: 'Draft Konten' },
                { value: 'PRIVACY_REVIEW', label: 'Tinjauan Privasi' },
                { value: 'APPROVED', label: 'Disetujui Editorial' },
                { value: 'PUBLISHED', label: 'Tayang di Publik' },
                { value: 'ARCHIVED', label: 'Diarsipkan' },
              ],
            },
            {
              id: 'category',
              label: 'Kategori',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { value: 'ALL', label: 'Semua Kategori' },
                { value: 'BERITA', label: 'Berita Kegiatan' },
                { value: 'AGENDA', label: 'Agenda Pelayanan' },
                { value: 'PENGUMUMAN', label: 'Pengumuman Resmi' },
                { value: 'ARTIKEL', label: 'Artikel Literasi' },
              ],
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={filteredPosts}
          getRowKey={(p) => p.id}
          onRowClick={(p) => {
            setSelectedPostId(p.id);
            setFeedbackMsg(null);
          }}
          renderMobileRow={(post) => {
            const meta = PUBLICATION_STATUS_META[post.status];
            return (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {PUBLICATION_CATEGORY_LABEL[post.category]} •{' '}
                      {post.authorName}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                      {post.title}
                    </h3>
                  </div>
                  <Badge variant={meta.badgeVariant} size="sm" dot>
                    {meta.label}
                  </Badge>
                </div>

                <p className="text-xs text-secondary-foreground line-clamp-2">
                  {post.summary}
                </p>

                <div className="flex items-center justify-between border-t border-border pt-2.5">
                  <span className="text-[11px] text-muted-foreground">
                    Selanjutnya: {meta.nextActor}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPostId(post.id);
                    }}
                  >
                    Periksa & Kelola
                  </Button>
                </div>
              </div>
            );
          }}
          emptyState={
            <EmptyState
              icon={Newspaper}
              title="Tidak ada konten publikasi yang sesuai"
              description="Ubah kata kunci pencarian atau filter tahapan untuk menampilkan konten lainnya."
            />
          }
        />
      </section>

      {/* Consequential Transition Dialog from Table Actions */}
      <Dialog
        open={pendingTransition !== null}
        onClose={() => setPendingTransition(null)}
        title={
          pendingTransition?.targetStatus === 'PUBLISHED'
            ? 'Tayangkan konten ini ke website publik?'
            : pendingTransition?.targetStatus === 'APPROVED'
              ? 'Setujui tinjauan privasi & editorial?'
              : 'Lanjutkan tahapan publikasi?'
        }
        description={
          pendingTransition
            ? PUBLICATION_STATUS_META[pendingTransition.targetStatus]
                .nextTransitionText
            : ''
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setPendingTransition(null)}
            >
              Batal
            </Button>
            <Button variant="primary" onClick={handleConfirmTransition}>
              Ya, Lanjutkan Tahapan
            </Button>
          </div>
        }
      >
        {pendingTransition && (
          <div className="space-y-3 text-xs">
            <div className="rounded-md border border-border bg-surface-subtle/50 p-3 space-y-1">
              <p className="font-semibold text-foreground">
                {pendingTransition.post.title}
              </p>
              <p className="text-secondary-foreground">
                Tahapan:{' '}
                <strong>
                  {PUBLICATION_STATUS_META[pendingTransition.post.status].label}
                </strong>{' '}
                →{' '}
                <strong>
                  {
                    PUBLICATION_STATUS_META[pendingTransition.targetStatus]
                      .label
                  }
                </strong>
              </p>
            </div>
          </div>
        )}
      </Dialog>

      {/* Create New Publication Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tulis Konten Publikasi Baru"
        description="Konten baru akan disimpan dengan status Draft Konten dan perlu melewati Tinjauan Privasi sebelum ditayangkan ke publik."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="create-publication-form"
              leftIcon={<FileText className="h-4 w-4" />}
            >
              Simpan sebagai Draft
            </Button>
          </div>
        }
      >
        <form
          id="create-publication-form"
          onSubmit={handleCreatePost}
          className="space-y-4"
        >
          {formError && (
            <div
              role="alert"
              className="rounded-md border border-danger/40 bg-danger-soft p-3 text-xs text-danger font-medium"
            >
              {formError}
            </div>
          )}

          <Input
            label="Judul Konten"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Kegiatan Kelas Literasi & Pembagian Buku Bacaan..."
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Kategori Publikasi"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as PublicationPost['category'])
              }
              options={[
                { value: 'BERITA', label: 'Berita Kegiatan' },
                { value: 'AGENDA', label: 'Agenda Pelayanan' },
                { value: 'PENGUMUMAN', label: 'Pengumuman Resmi' },
                { value: 'ARTIKEL', label: 'Artikel Literasi' },
              ]}
            />
            <Input
              label="Tanggal Agenda (Opsional)"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Pilih Dokumentasi Sampul"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              options={mediaAssets.map((m) => ({
                value: m.url,
                label: `${m.title} (${
                  m.isEligibleForPublic ? 'Layak Publik' : 'Hanya Internal'
                })`,
              }))}
            />
            <Input
              label="Lokasi Kegiatan (Opsional)"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="RAAL Griya Asih Lawang"
            />
          </div>

          <Input
            label="Ringkasan Singkat"
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="1–2 kalimat pengantar yang tampil pada daftar berita..."
          />

          <Textarea
            label="Isi Lengkap Konten"
            required
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tuliskan isi berita, agenda, atau artikel secara lengkap..."
            hint="Pastikan tidak mencantumkan data pribadi sensitif peserta didik."
          />
        </form>
      </Dialog>
    </div>
  );
};
