/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Globe,
  Image as ImageIcon,
  FileCheck,
  Edit3,
  Calendar,
  CheckCircle2,
  X,
} from 'lucide-react';
import { storage } from '../../services/storage.ts';
import { ConsentRecord, MediaAsset, ConsentStatus } from '../../types/index.ts';
import { can } from '../../permissions/can.ts';
import {
  Badge,
  type BadgeVariant,
  Button,
  Dialog,
  Select,
  Textarea,
} from '../ui/index.ts';
import {
  PageHeader,
  StatSummary,
  DetailTabs,
  SearchToolbar,
  DataTable,
  type DataTableColumn,
  EmptyState,
} from '../patterns/index.ts';

const CONSENT_STATUS_META: Record<
  ConsentStatus,
  {
    label: string;
    photoLabel: string;
    badgeVariant: BadgeVariant;
    explanation: string;
  }
> = {
  GRANTED: {
    label: 'Disetujui',
    photoLabel: 'Diizinkan Publik',
    badgeVariant: 'success',
    explanation:
      'Orang tua/wali telah memberikan persetujuan tertulis yang masih berlaku.',
  },
  DENIED: {
    label: 'Tidak Diizinkan',
    photoLabel: 'Hanya Internal',
    badgeVariant: 'warning',
    explanation:
      'Wali memilih agar dokumentasi anak tidak dipublikasikan ke media umum.',
  },
  REVOKED: {
    label: 'Dicabut',
    photoLabel: 'Izin Dicabut',
    badgeVariant: 'danger',
    explanation:
      'Persetujuan yang sebelumnya diberikan telah ditarik kembali oleh orang tua/wali.',
  },
};

const MEDIA_CATEGORY_LABEL: Record<MediaAsset['category'], string> = {
  KEGIATAN_BELAJAR: 'Kegiatan Belajar',
  PENGURUS: 'Pengurus & Pengajar',
  DOKUMENTASI_ACARA: 'Dokumentasi Acara',
  SARANA: 'Sarana & Fasilitas',
};

export const ConsentMediaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CONSENTS' | 'MEDIA'>('CONSENTS');
  const [consents, setConsents] = useState<ConsentRecord[]>(() =>
    storage.getConsents()
  );
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() =>
    storage.getMediaAssets()
  );
  const currentUser = storage.getCurrentUser();

  // Permissions
  const canReadConsent = can(currentUser, 'consent.read');
  const canWriteConsent = can(currentUser, 'consent.write');
  const canReviewMedia = can(currentUser, 'media.review');

  // Consent filters
  const [consentSearch, setConsentSearch] = useState('');
  const [photoConsentFilter, setPhotoConsentFilter] = useState<string>('ALL');
  const [expandedConsentId, setExpandedConsentId] = useState<string | null>(
    null
  );

  // Consent Edit / Consequential Dialog state
  const [editingConsent, setEditingConsent] = useState<ConsentRecord | null>(
    null
  );
  const [draftPersonalConsent, setDraftPersonalConsent] =
    useState<ConsentStatus>('GRANTED');
  const [draftPhotoConsent, setDraftPhotoConsent] =
    useState<ConsentStatus>('DENIED');
  const [draftConsentNotes, setDraftConsentNotes] = useState('');

  // Media filters
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaEligibilityFilter, setMediaEligibilityFilter] =
    useState<string>('ALL');
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>('ALL');

  // Media Privacy Confirmation Dialog
  const [pendingMediaReview, setPendingMediaReview] = useState<{
    asset: MediaAsset;
    targetEligible: boolean;
  } | null>(null);

  // Feedback banner
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  const refreshData = () => {
    setConsents([...storage.getConsents()]);
    setMediaAssets([...storage.getMediaAssets()]);
  };

  // Summary Metrics
  const stats = useMemo(() => {
    const totalConsents = consents.length;
    const publicPhotoAllowed = consents.filter(
      (c) => c.photoVideoPublicConsent === 'GRANTED'
    ).length;
    const restrictedPhotoCount = consents.filter(
      (c) => c.photoVideoPublicConsent !== 'GRANTED'
    ).length;
    const eligibleMediaCount = mediaAssets.filter(
      (m) => m.isEligibleForPublic
    ).length;

    return [
      {
        id: 'total-consents',
        label: 'Arsip Persetujuan Wali',
        value: totalConsents,
        meta: 'Tercatat per peserta didik',
      },
      {
        id: 'photo-granted',
        label: 'Izin Dokumentasi Publik',
        value: publicPhotoAllowed,
        meta: 'Diizinkan tampil di kanal publik',
      },
      {
        id: 'photo-restricted',
        label: 'Perlindungan Non-Publik',
        value: restrictedPhotoCount,
        meta: 'Wajib disamarkan / hanya internal',
      },
      {
        id: 'media-eligible',
        label: 'Dokumentasi Layak Publik',
        value: `${eligibleMediaCount} / ${mediaAssets.length}`,
        meta: 'Telah lolos kurasi privasi',
      },
    ];
  }, [consents, mediaAssets]);

  const filteredConsents = useMemo(() => {
    return consents.filter((c) => {
      const q = consentSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.studentName.toLowerCase().includes(q) ||
        c.guardianName.toLowerCase().includes(q) ||
        (c.notes ?? '').toLowerCase().includes(q);

      const matchesFilter =
        photoConsentFilter === 'ALL' ||
        c.photoVideoPublicConsent === photoConsentFilter;

      return matchesSearch && matchesFilter;
    });
  }, [consents, consentSearch, photoConsentFilter]);

  const filteredMedia = useMemo(() => {
    return mediaAssets.filter((m) => {
      const q = mediaSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.reviewedBy ?? '').toLowerCase().includes(q);

      const matchesEligibility =
        mediaEligibilityFilter === 'ALL' ||
        (mediaEligibilityFilter === 'PUBLIC' && m.isEligibleForPublic) ||
        (mediaEligibilityFilter === 'INTERNAL' && !m.isEligibleForPublic) ||
        (mediaEligibilityFilter === 'UNREVIEWED' && !m.privacyReviewed);

      const matchesCategory =
        mediaCategoryFilter === 'ALL' || m.category === mediaCategoryFilter;

      return matchesSearch && matchesEligibility && matchesCategory;
    });
  }, [mediaAssets, mediaSearch, mediaEligibilityFilter, mediaCategoryFilter]);

  const openConsentEditor = (
    record: ConsentRecord,
    presetPhoto?: ConsentStatus
  ) => {
    setEditingConsent(record);
    setDraftPersonalConsent(record.personalDataConsent);
    setDraftPhotoConsent(presetPhoto ?? record.photoVideoPublicConsent);
    setDraftConsentNotes(record.notes ?? '');
  };

  const handleSaveConsentDecision = () => {
    if (!editingConsent) return;
    storage.updateConsent(
      editingConsent.id,
      draftPersonalConsent,
      draftPhotoConsent,
      draftConsentNotes.trim() || undefined
    );
    refreshData();
    setFeedbackMsg({
      type: 'success',
      text: `Status persetujuan wali untuk ${editingConsent.studentName} telah diperbarui dan dicatat pada log audit.`,
    });
    setEditingConsent(null);
  };

  const handleConfirmMediaReview = () => {
    if (!pendingMediaReview) return;
    storage.updateMediaPrivacy(
      pendingMediaReview.asset.id,
      pendingMediaReview.targetEligible
    );
    refreshData();
    setFeedbackMsg({
      type: 'success',
      text: pendingMediaReview.targetEligible
        ? `Dokumentasi "${pendingMediaReview.asset.title}" telah disetujui sebagai Layak Publik.`
        : `Dokumentasi "${pendingMediaReview.asset.title}" telah dibatasi menjadi Hanya Internal.`,
    });
    setPendingMediaReview(null);
  };

  const consentColumns: DataTableColumn<ConsentRecord>[] = [
    {
      id: 'participant',
      header: 'Peserta Didik & Wali',
      cell: (c) => (
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">
            {c.studentName}
          </div>
          <div className="text-[11px] text-secondary-foreground">
            Wali: <span className="font-medium">{c.guardianName}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'personalData',
      header: '1. Izin Data Belajar',
      cell: (c) => {
        const meta = CONSENT_STATUS_META[c.personalDataConsent];
        return (
          <div className="space-y-0.5">
            <Badge variant={meta.badgeVariant} size="sm" dot>
              {meta.label}
            </Badge>
            <p className="text-[11px] text-muted-foreground">
              Administrasi & akademik
            </p>
          </div>
        );
      },
    },
    {
      id: 'photoConsent',
      header: '2. Izin Publikasi Foto/Video',
      cell: (c) => {
        const meta = CONSENT_STATUS_META[c.photoVideoPublicConsent];
        return (
          <div className="space-y-0.5">
            <Badge variant={meta.badgeVariant} size="sm" dot>
              {meta.photoLabel}
            </Badge>
            <p className="text-[11px] text-muted-foreground">
              {c.photoVideoPublicConsent === 'GRANTED'
                ? 'Boleh tampil di publikasi'
                : 'Wajib dilindungi / non-publik'}
            </p>
          </div>
        );
      },
    },
    {
      id: 'dateAndNotes',
      header: 'Tanggal Efektif & Keterangan Wali',
      cell: (c) => {
        const isExpanded = expandedConsentId === c.id;
        return (
          <div className="space-y-1 max-w-xs">
            <div className="flex items-center gap-1.5 text-[11px] text-secondary-foreground">
              <Calendar
                className="h-3 w-3 text-muted-foreground"
                aria-hidden="true"
              />
              <span>Berlaku sejak: {c.effectiveDate}</span>
            </div>
            {canReadConsent && c.notes ? (
              <div>
                <p
                  className={
                    isExpanded
                      ? 'text-xs text-foreground leading-relaxed'
                      : 'text-xs text-secondary-foreground truncate'
                  }
                >
                  {c.notes}
                </p>
                {c.notes.length > 48 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedConsentId(isExpanded ? null : c.id);
                    }}
                    className="mt-0.5 text-[11px] font-medium text-primary hover:underline"
                  >
                    {isExpanded
                      ? 'Sembunyikan catatan'
                      : 'Lihat catatan lengkap'}
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Tidak ada catatan khusus
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Tindakan Tata Kelola',
      align: 'right',
      cell: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          {canWriteConsent ? (
            <>
              {c.photoVideoPublicConsent === 'GRANTED' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openConsentEditor(c, 'REVOKED');
                  }}
                >
                  Cabut Izin Foto
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openConsentEditor(c, 'GRANTED');
                  }}
                >
                  Ubah / Beri Izin
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                onClick={(e) => {
                  e.stopPropagation();
                  openConsentEditor(c);
                }}
              >
                Rincian
              </Button>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Hanya Baca
            </span>
          )}
        </div>
      ),
    },
  ];

  // Restricted students list for reviewer reference in Media tab
  const restrictedStudents = useMemo(
    () => consents.filter((c) => c.photoVideoPublicConsent !== 'GRANTED'),
    [consents]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Persetujuan Wali & Kelayakan Privasi Media"
        description="Tata kelola perlindungan anak (Child Safeguarding): pastikan pemisahan izin data akademik dan izin publikasi dokumentasi visual dipatuhi sebelum foto/video ditampilkan ke publik."
      />

      {feedbackMsg && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-md border border-success/35 bg-success-soft px-4 py-3 text-xs text-foreground"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div>
              <p className="font-semibold">Keputusan Privasi Tersimpan</p>
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

      <DetailTabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'CONSENTS' | 'MEDIA')}
        tabs={[
          {
            id: 'CONSENTS',
            label: 'Persetujuan Data & Media Peserta',
            count: consents.length,
            icon: <FileCheck className="h-4 w-4" />,
          },
          {
            id: 'MEDIA',
            label: 'Kelayakan Privasi Dokumentasi',
            count: mediaAssets.length,
            icon: <ImageIcon className="h-4 w-4" />,
          },
        ]}
      />

      {activeTab === 'CONSENTS' ? (
        <div className="space-y-4">
          {/* Calm Safeguarding Notice */}
          <div className="flex items-start gap-3 rounded-md border border-border bg-surface-subtle/60 px-4 py-3 text-xs text-secondary-foreground">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground">
                Prinsip Persetujuan Independen:
              </span>{' '}
              Penolakan atau pencabutan izin publikasi foto/video sama sekali
              tidak mengurangi hak anak untuk mengikuti seluruh layanan
              pendidikan di Rumah Belajar.
            </div>
          </div>

          <section className="rounded-card border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
            <SearchToolbar
              searchValue={consentSearch}
              onSearchChange={setConsentSearch}
              searchPlaceholder="Cari nama peserta didik, nama orang tua/wali, atau keterangan..."
              filters={[
                {
                  id: 'photoConsent',
                  label: 'Status Izin Foto Publik',
                  value: photoConsentFilter,
                  onChange: setPhotoConsentFilter,
                  options: [
                    { value: 'ALL', label: 'Semua Status Izin Foto' },
                    { value: 'GRANTED', label: 'Diizinkan Publik' },
                    {
                      value: 'DENIED',
                      label: 'Hanya Internal (Tidak Diizinkan)',
                    },
                    { value: 'REVOKED', label: 'Izin Dicabut' },
                  ],
                },
              ]}
            />

            <DataTable
              columns={consentColumns}
              data={filteredConsents}
              getRowKey={(c) => c.id}
              renderMobileRow={(c) => {
                const personalMeta =
                  CONSENT_STATUS_META[c.personalDataConsent];
                const photoMeta =
                  CONSENT_STATUS_META[c.photoVideoPublicConsent];
                return (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {c.studentName}
                        </h3>
                        <p className="text-xs text-secondary-foreground">
                          Wali: {c.guardianName} • Berlaku {c.effectiveDate}
                        </p>
                      </div>
                      <Badge variant={photoMeta.badgeVariant} size="sm" dot>
                        Foto: {photoMeta.photoLabel}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-secondary-foreground">
                      <span>Data Belajar:</span>
                      <Badge variant={personalMeta.badgeVariant} size="sm">
                        {personalMeta.label}
                      </Badge>
                    </div>

                    {canReadConsent && c.notes && (
                      <p className="rounded-sm bg-surface-subtle/60 px-2.5 py-1.5 text-xs text-secondary-foreground">
                        Catatan wali: {c.notes}
                      </p>
                    )}

                    {canWriteConsent && (
                      <div className="flex items-center justify-end gap-2 border-t border-border pt-2.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openConsentEditor(c)}
                        >
                          Perbarui Persetujuan
                        </Button>
                      </div>
                    )}
                  </div>
                );
              }}
              emptyState={
                <EmptyState
                  icon={FileCheck}
                  title="Tidak ada arsip persetujuan yang sesuai"
                  description="Ubah kata kunci pencarian atau filter izin foto untuk menampilkan data persetujuan wali."
                />
              }
            />
          </section>
        </div>
      ) : (
        /* TAB 2: MEDIA ELIGIBILITY & PRIVACY GOVERNANCE */
        <div className="space-y-4">
          {/* Safeguarding Cross-Check Reminder */}
          <div className="flex flex-col gap-2 rounded-md border border-warning/35 bg-warning-soft/50 px-4 py-3 text-xs text-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <ShieldAlert
                className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                aria-hidden="true"
              />
              <div>
                <span className="font-semibold">
                  Pemeriksaan Silang Perlindungan Anak:
                </span>{' '}
                Terdapat{' '}
                <strong>{restrictedStudents.length} peserta didik</strong>{' '}
                dengan status izin foto non-publik (
                {restrictedStudents.map((s) => s.studentName).join(', ') ||
                  'tidak ada'}
                ). Pastikan wajah peserta tersebut tidak tampil teridentifikasi
                pada dokumentasi bertanda Layak Publik.
              </div>
            </div>
          </div>

          <section className="rounded-card border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-5">
            <SearchToolbar
              searchValue={mediaSearch}
              onSearchChange={setMediaSearch}
              searchPlaceholder="Cari judul dokumentasi, deskripsi kegiatan, atau nama peninjau..."
              filters={[
                {
                  id: 'eligibility',
                  label: 'Status Kelayakan',
                  value: mediaEligibilityFilter,
                  onChange: setMediaEligibilityFilter,
                  options: [
                    { value: 'ALL', label: 'Semua Status Kelayakan' },
                    { value: 'PUBLIC', label: 'Layak Publik' },
                    { value: 'INTERNAL', label: 'Hanya Internal' },
                    { value: 'UNREVIEWED', label: 'Belum Ditinjau' },
                  ],
                },
                {
                  id: 'category',
                  label: 'Kategori Dokumentasi',
                  value: mediaCategoryFilter,
                  onChange: setMediaCategoryFilter,
                  options: [
                    { value: 'ALL', label: 'Semua Kategori' },
                    { value: 'KEGIATAN_BELAJAR', label: 'Kegiatan Belajar' },
                    { value: 'DOKUMENTASI_ACARA', label: 'Dokumentasi Acara' },
                    { value: 'PENGURUS', label: 'Pengurus & Pengajar' },
                    { value: 'SARANA', label: 'Sarana & Fasilitas' },
                  ],
                },
              ]}
            />

            {filteredMedia.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="Tidak ada aset dokumentasi yang sesuai"
                description="Ubah filter status kelayakan atau kategori untuk memeriksa aset dokumentasi lainnya."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredMedia.map((asset) => {
                  const isEligible = asset.isEligibleForPublic;
                  const isReviewed = asset.privacyReviewed;

                  return (
                    <div
                      key={asset.id}
                      className="flex flex-col justify-between overflow-hidden rounded-card border border-border bg-surface transition-shadow hover:shadow-xs"
                    >
                      <div>
                        {/* Governance Status Header BEFORE Decorative Image */}
                        <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-subtle/60 px-4 py-2.5">
                          <Badge
                            variant={
                              isEligible
                                ? 'success'
                                : isReviewed
                                  ? 'warning'
                                  : 'neutral'
                            }
                            size="sm"
                            dot
                          >
                            {isEligible
                              ? 'Layak Publik'
                              : isReviewed
                                ? 'Hanya Internal'
                                : 'Perlu Tinjauan Privasi'}
                          </Badge>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {MEDIA_CATEGORY_LABEL[asset.category]}
                          </span>
                        </div>

                        {/* Media Preview */}
                        <div className="relative aspect-4/3 overflow-hidden bg-surface-subtle">
                          <img
                            src={asset.url}
                            alt={asset.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Metadata & Governance Context */}
                        <div className="space-y-2 p-4">
                          <h3 className="text-sm font-semibold leading-snug text-foreground">
                            {asset.title}
                          </h3>
                          <p className="text-xs leading-relaxed text-secondary-foreground">
                            {asset.description}
                          </p>

                          <div className="space-y-1 rounded-sm border border-border bg-surface-subtle/40 p-2.5 text-[11px] text-secondary-foreground">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                Peninjau Privasi:
                              </span>
                              <span className="font-medium text-foreground">
                                {asset.reviewedBy || 'Belum ditinjau'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                Tanggal Dokumentasi:
                              </span>
                              <span>{asset.capturedDate}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                Dampak Visibilitas:
                              </span>
                              <span className="font-medium">
                                {isEligible
                                  ? 'Dapat tampil di galeri publik'
                                  : 'Tertutup dari akses publik'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Governance Action Footer */}
                      <div className="flex items-center justify-between gap-2 border-t border-border bg-surface-subtle/30 px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          {isEligible ? (
                            <>
                              <Globe className="h-3.5 w-3.5 text-success" />
                              <span>Publik</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Internal</span>
                            </>
                          )}
                        </span>

                        {canReviewMedia ? (
                          <Button
                            variant={isEligible ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() =>
                              setPendingMediaReview({
                                asset,
                                targetEligible: !isEligible,
                              })
                            }
                          >
                            {isEligible
                              ? 'Batasi ke Internal'
                              : 'Setujui Layak Publik'}
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            Perlu akses peninjau media
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Consequential Consent Update / Revocation Dialog */}
      <Dialog
        open={editingConsent !== null}
        onClose={() => setEditingConsent(null)}
        title={
          editingConsent
            ? `Perbarui Persetujuan Wali — ${editingConsent.studentName}`
            : 'Perbarui Persetujuan Wali'
        }
        description="Perubahan status persetujuan akan langsung berlaku pada aturan perlindungan data dan kelayakan publikasi dokumentasi anak."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingConsent(null)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveConsentDecision}>
              Simpan Perubahan Persetujuan
            </Button>
          </div>
        }
      >
        {editingConsent && (
          <div className="space-y-4 text-xs">
            <div className="rounded-md border border-border bg-surface-subtle/50 p-3 space-y-1">
              <p className="font-semibold text-foreground">
                Peserta: {editingConsent.studentName}
              </p>
              <p className="text-secondary-foreground">
                Orang Tua / Wali: {editingConsent.guardianName} • Tanggal
                Berlaku: {editingConsent.effectiveDate}
              </p>
            </div>

            <Select
              label="1. Persetujuan Pemrosesan Data Akademik & Administrasi"
              value={draftPersonalConsent}
              onChange={(e) =>
                setDraftPersonalConsent(e.target.value as ConsentStatus)
              }
              options={[
                {
                  value: 'GRANTED',
                  label:
                    'Disetujui (GRANTED) — Data digunakan untuk layanan belajar',
                },
                {
                  value: 'DENIED',
                  label: 'Tidak Diizinkan (DENIED)',
                },
                {
                  value: 'REVOKED',
                  label: 'Dicabut oleh Wali (REVOKED)',
                },
              ]}
            />

            <Select
              label="2. Persetujuan Publikasi Foto / Video di Kanal Publik"
              value={draftPhotoConsent}
              onChange={(e) =>
                setDraftPhotoConsent(e.target.value as ConsentStatus)
              }
              options={[
                {
                  value: 'GRANTED',
                  label:
                    'Diizinkan Publik (GRANTED) — Boleh tampil pada dokumentasi umum',
                },
                {
                  value: 'DENIED',
                  label: 'Hanya Internal / Tidak Diizinkan (DENIED)',
                },
                {
                  value: 'REVOKED',
                  label: 'Izin Publikasi Dicabut oleh Wali (REVOKED)',
                },
              ]}
            />

            {draftPhotoConsent !== 'GRANTED' && (
              <div className="rounded-md border border-warning/40 bg-warning-soft/50 p-3 text-foreground">
                <strong>Dampak Perlindungan Privasi:</strong> Dengan status{' '}
                <strong>
                  {CONSENT_STATUS_META[draftPhotoConsent].photoLabel}
                </strong>
                , dokumentasi yang menampilkan wajah{' '}
                {editingConsent.studentName} secara jelas tidak boleh
                diterbitkan ke galeri publik.
              </div>
            )}

            <Textarea
              label="Catatan Wali / Dasar Perubahan Status"
              rows={3}
              value={draftConsentNotes}
              onChange={(e) => setDraftConsentNotes(e.target.value)}
              placeholder="Contoh: Wali meminta agar foto anak hanya digunakan untuk dokumentasi internal..."
            />
          </div>
        )}
      </Dialog>

      {/* Consequential Media Eligibility Confirmation Dialog */}
      <Dialog
        open={pendingMediaReview !== null}
        onClose={() => setPendingMediaReview(null)}
        title={
          pendingMediaReview?.targetEligible
            ? 'Setujui dokumentasi ini untuk tampil di halaman publik?'
            : 'Batasi dokumentasi ini menjadi Hanya Internal?'
        }
        description={
          pendingMediaReview?.targetEligible
            ? 'Pastikan seluruh anak yang tampak pada dokumentasi ini telah memiliki izin publikasi foto/video dari orang tua/wali.'
            : 'Dokumentasi ini akan segera ditarik dari galeri publik dan hanya dapat diakses oleh pengurus internal.'
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setPendingMediaReview(null)}
            >
              Batal
            </Button>
            <Button
              variant={
                pendingMediaReview?.targetEligible ? 'primary' : 'destructive'
              }
              onClick={handleConfirmMediaReview}
            >
              {pendingMediaReview?.targetEligible
                ? 'Ya, Setujui Layak Publik'
                : 'Ya, Batasi ke Internal'}
            </Button>
          </div>
        }
      >
        {pendingMediaReview && (
          <div className="space-y-3 text-xs">
            <div className="rounded-md border border-border bg-surface-subtle/50 p-3 space-y-1">
              <p className="font-semibold text-foreground">
                {pendingMediaReview.asset.title}
              </p>
              <p className="text-secondary-foreground">
                Kategori:{' '}
                {MEDIA_CATEGORY_LABEL[pendingMediaReview.asset.category]} •
                Tanggal: {pendingMediaReview.asset.capturedDate}
              </p>
              <p className="text-muted-foreground pt-1">
                Peninjau yang akan dicatat:{' '}
                <strong>{currentUser.name}</strong>
              </p>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
