/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  History,
  ShieldCheck,
  Eye,
  Calendar,
  Lock,
  User,
  Activity,
  FileText,
  AlertCircle,
  X,
  Clock,
  Database,
} from 'lucide-react';
import { storage } from '../../services/storage.ts';
import { AuditLogEntry, Role } from '../../types/index.ts';
import { can } from '../../permissions/can.ts';
import {
  Badge,
  type BadgeVariant,
  Button,
  Dialog,
} from '../ui/index.ts';
import {
  PageHeader,
  SearchToolbar,
  DataTable,
  type DataTableColumn,
  EmptyState,
} from '../patterns/index.ts';

const ROLE_LABEL_MAP: Record<Role, string> = {
  PLATFORM_ADMIN: 'Platform Administrator',
  ORG_ADMIN: 'Admin Organisasi',
  UNIT_COORDINATOR: 'Koordinator Unit',
  PROGRAM_COORDINATOR: 'Koordinator Program',
  TEACHER: 'Pengajar / Guru',
  VOLUNTEER: 'Relawan Pendamping',
  EDITOR: 'Penyusun Konten',
  REVIEWER: 'Peninjau Privasi',
  APPROVER: 'Pejabat Penyetuju',
  AUDITOR: 'Auditor Independen',
  STAKEHOLDER: 'Pemangku Kepentingan',
};

interface ActionMeta {
  label: string;
  badgeVariant: BadgeVariant;
  category: 'PESERTA' | 'PRESENSI' | 'LAPORAN' | 'PRIVASI' | 'PUBLIKASI' | 'SISTEM';
}

const AUDIT_ACTION_MAP: Record<string, ActionMeta> = {
  SYSTEM_INITIALIZATION: {
    label: 'Inisialisasi Sistem',
    badgeVariant: 'neutral',
    category: 'SISTEM',
  },
  REGISTRATION_VERIFIED: {
    label: 'Pendaftaran Diverifikasi',
    badgeVariant: 'success',
    category: 'PESERTA',
  },
  REPORT_FINAL_APPROVED: {
    label: 'Laporan Disetujui Final',
    badgeVariant: 'success',
    category: 'LAPORAN',
  },
  USER_ROLE_SWITCH: {
    label: 'Simulasi Peran Pengguna',
    badgeVariant: 'neutral',
    category: 'SISTEM',
  },
  STUDENT_REGISTERED: {
    label: 'Pendaftaran Siswa Baru',
    badgeVariant: 'info',
    category: 'PESERTA',
  },
  STUDENT_VERIFIED: {
    label: 'Verifikasi & Penempatan',
    badgeVariant: 'success',
    category: 'PESERTA',
  },
  STUDENT_PLACED: {
    label: 'Penempatan Kelas',
    badgeVariant: 'info',
    category: 'PESERTA',
  },
  STUDENT_UPDATED: {
    label: 'Pembaruan Data Siswa',
    badgeVariant: 'neutral',
    category: 'PESERTA',
  },
  ATTENDANCE_RECORDED: {
    label: 'Pencatatan Presensi Kelas',
    badgeVariant: 'info',
    category: 'PRESENSI',
  },
  DEVELOPMENT_NOTE_ADDED: {
    label: 'Catatan Perkembangan',
    badgeVariant: 'info',
    category: 'PRESENSI',
  },
  CONSENT_UPDATED: {
    label: 'Persetujuan Wali Diperbarui',
    badgeVariant: 'warning',
    category: 'PRIVASI',
  },
  MEDIA_PRIVACY_UPDATED: {
    label: 'Status Privasi Media Diubah',
    badgeVariant: 'warning',
    category: 'PRIVASI',
  },
  PUBLICATION_CREATED: {
    label: 'Draft Publikasi Baru',
    badgeVariant: 'info',
    category: 'PUBLIKASI',
  },
  PUBLICATION_STATUS_UPDATED: {
    label: 'Tahap Publikasi Berubah',
    badgeVariant: 'info',
    category: 'PUBLIKASI',
  },
  REPORT_CREATED: {
    label: 'Draft Laporan Baru',
    badgeVariant: 'info',
    category: 'LAPORAN',
  },
  REPORT_WORKFLOW_ACTION: {
    label: 'Aksi Alur Laporan',
    badgeVariant: 'info',
    category: 'LAPORAN',
  },
  USER_STATUS_TOGGLED: {
    label: 'Status Akun Diubah',
    badgeVariant: 'warning',
    category: 'SISTEM',
  },
  SEED_DATA_RESET: {
    label: 'Pemulihan Data Bawaan',
    badgeVariant: 'danger',
    category: 'SISTEM',
  },
};

const ENTITY_LABEL_MAP: Record<string, string> = {
  STUDENT: 'Peserta Didik',
  SERVICE_REPORT: 'Laporan Pelayanan',
  CONSENT: 'Persetujuan Wali',
  MEDIA: 'Aset Dokumentasi',
  PUBLICATION: 'Publikasi & Berita',
  USER: 'Akun Pengguna',
  PLATFORM: 'Platform PMKI',
  CLASS_SESSION: 'Sesi Belajar',
};

function formatAuditTimestamp(isoString: string): { full: string; date: string; time: string } {
  try {
    const d = new Date(isoString);
    const date = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const time = `${d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })} WIB`;
    return { full: `${date}, ${time}`, date, time };
  } catch {
    return { full: isoString, date: isoString, time: '' };
  }
}

export const AuditLogView: React.FC = () => {
  const auditLogs = useMemo(() => storage.getAuditLogs(), []);
  const currentUser = storage.getCurrentUser();
  const canReadAudit = can(currentUser, 'audit.read');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        log.actorName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q);

      const matchesEntity =
        entityFilter === 'ALL' || log.entityType === entityFilter;

      const actionMeta = AUDIT_ACTION_MAP[log.action];
      const matchesCategory =
        categoryFilter === 'ALL' ||
        (actionMeta && actionMeta.category === categoryFilter);

      return matchesSearch && matchesEntity && matchesCategory;
    });
  }, [auditLogs, searchQuery, entityFilter, categoryFilter]);

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      id: 'timestamp',
      header: 'Waktu Transaksi (WIB)',
      cell: (log) => {
        const formatted = formatAuditTimestamp(log.timestamp);
        return (
          <div className="space-y-0.5 whitespace-nowrap text-xs">
            <span className="font-semibold text-foreground">
              {formatted.date}
            </span>
            <div className="text-[11px] text-muted-foreground font-mono">
              {formatted.time}
            </div>
          </div>
        );
      },
    },
    {
      id: 'actor',
      header: 'Pelaku (Aktor Transaksi)',
      cell: (log) => (
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">
            {log.actorName}
          </div>
          <div className="text-[11px] text-secondary-foreground">
            {ROLE_LABEL_MAP[log.actorRole as Role] || log.actorRole}
          </div>
        </div>
      ),
    },
    {
      id: 'action',
      header: 'Aksi Tata Kelola',
      cell: (log) => {
        const meta = AUDIT_ACTION_MAP[log.action] || {
          label: log.action,
          badgeVariant: 'neutral' as BadgeVariant,
        };
        return (
          <div className="space-y-0.5">
            <Badge variant={meta.badgeVariant} size="sm" dot>
              {meta.label}
            </Badge>
            <span className="block font-mono text-[10px] text-muted-foreground">
              {log.action}
            </span>
          </div>
        );
      },
    },
    {
      id: 'entity',
      header: 'Entitas Sumber Daya',
      cell: (log) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-medium text-foreground">
            {ENTITY_LABEL_MAP[log.entityType] || log.entityType}
          </span>
          <div className="font-mono text-[11px] text-muted-foreground">
            {log.entityId}
          </div>
        </div>
      ),
    },
    {
      id: 'description',
      header: 'Uraian Transaksi Mutasi',
      cell: (log) => (
        <p className="text-xs text-secondary-foreground leading-relaxed line-clamp-2 max-w-md">
          {log.description}
        </p>
      ),
    },
    {
      id: 'actions',
      header: 'Rincian',
      align: 'right',
      cell: (log) => (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Eye className="h-3.5 w-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(log);
          }}
        >
          Periksa
        </Button>
      ),
    },
  ];

  if (!canReadAudit) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Jejak Audit Sistem"
          eyebrow="AKUNTABILITAS & INTEGRITAS SISTEM"
          description="Pemeriksaan riwayat mutasi data sensitif, verifikasi siswa, dan keputusan tata kelola."
        />
        <EmptyState
          icon={Lock}
          title="Akses Terbatas: Kewenangan Auditor Diperlukan"
          description={`Peran Anda saat ini (${currentUser.role}) tidak memiliki izin 'audit.read' untuk membuka jejak audit. Anda dapat menggunakan pemilih peran simulasi di bilah atas untuk menguji tampilan sebagai Platform Admin atau Auditor.`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jejak Audit Sistem"
        eyebrow="AKUNTABILITAS & INTEGRITAS SISTEM"
        badge={
          <Badge variant="neutral">
            {auditLogs.length} Catatan Riwayat
          </Badge>
        }
        description="Catatan riwayat transaksi dan mutasi data yang bersifat tidak dapat diubah (immutable append-only) untuk kepatuhan perlindungan data dan pertanggungjawaban pelayanan."
      />

      {/* Calm Immutability Guidance */}
      <div className="flex items-start gap-3 rounded-md border border-border bg-surface-subtle/60 px-4 py-3 text-xs text-secondary-foreground">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground">
            Prinsip Ketidakterubahan (Immutability Policy):
          </span>{' '}
          Setiap mutasi data operasional dicatat secara permanen tanpa opsi manipulasi atau penghapusan. Catatan disinkronkan aman demi keterlacakan akuntabilitas pelayanan.
        </div>
      </div>

      <section className="rounded-card border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
        <SearchToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari nama pelaku, aksi, ID entitas, atau kata kunci uraian transaksi..."
          filters={[
            {
              id: 'entity',
              label: 'Jenis Entitas',
              value: entityFilter,
              onChange: setEntityFilter,
              options: [
                { value: 'ALL', label: 'Semua Entitas' },
                { value: 'STUDENT', label: 'Peserta Didik (STUDENT)' },
                { value: 'SERVICE_REPORT', label: 'Laporan Pelayanan (REPORT)' },
                { value: 'CONSENT', label: 'Persetujuan Wali (CONSENT)' },
                { value: 'MEDIA', label: 'Aset Dokumentasi (MEDIA)' },
                { value: 'PUBLICATION', label: 'Publikasi Portal (PUBLICATION)' },
                { value: 'USER', label: 'Akun Pengguna (USER)' },
                { value: 'PLATFORM', label: 'Inisialisasi Sistem (PLATFORM)' },
              ],
            },
            {
              id: 'category',
              label: 'Kategori Transaksi',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { value: 'ALL', label: 'Semua Kategori' },
                { value: 'PESERTA', label: 'Pendaftaran & Siswa' },
                { value: 'PRESENSI', label: 'Presensi & Bimbingan' },
                { value: 'LAPORAN', label: 'Laporan & Alur Persetujuan' },
                { value: 'PRIVASI', label: 'Perlindungan Privasi' },
                { value: 'PUBLIKASI', label: 'Publikasi Editorial' },
                { value: 'SISTEM', label: 'Sistem & Simulasi Peran' },
              ],
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={filteredLogs}
          getRowKey={(l) => l.id}
          onRowClick={(l) => setSelectedLog(l)}
          renderMobileRow={(log) => {
            const formatted = formatAuditTimestamp(log.timestamp);
            const meta = AUDIT_ACTION_MAP[log.action] || {
              label: log.action,
              badgeVariant: 'neutral' as BadgeVariant,
            };
            return (
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant={meta.badgeVariant} size="sm" dot>
                      {meta.label}
                    </Badge>
                    <p className="mt-1 text-xs font-semibold text-foreground">
                      {log.actorName}{' '}
                      <span className="font-normal text-secondary-foreground">
                        ({ROLE_LABEL_MAP[log.actorRole as Role] || log.actorRole})
                      </span>
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                    {formatted.full}
                  </span>
                </div>

                <p className="text-xs text-secondary-foreground leading-relaxed">
                  {log.description}
                </p>

                <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                  <span className="font-mono">
                    {ENTITY_LABEL_MAP[log.entityType] || log.entityType}: {log.entityId}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLog(log);
                    }}
                  >
                    Rincian
                  </Button>
                </div>
              </div>
            );
          }}
          emptyState={
            <EmptyState
              icon={History}
              title={
                searchQuery || entityFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'Tidak ada catatan audit yang cocok'
                  : 'Belum ada catatan audit'
              }
              description={
                searchQuery || entityFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'Ubah kata kunci pencarian atau sesuaikan filter untuk melihat catatan riwayat lainnya.'
                  : 'Seluruh aksi tata kelola, mutasi data siswa, dan persetujuan akan dicatat di sini secara otomatis.'
              }
            />
          }
        />
      </section>

      {/* Human-Centered Audit Entry Detail Dialog */}
      <Dialog
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Rincian Peristiwa Audit"
        description="Pemeriksaan keterlacakan peristiwa historis yang dicatat secara permanen tanpa ekspos data mentah."
        footer={
          <div className="flex items-center justify-end">
            <Button variant="secondary" onClick={() => setSelectedLog(null)}>
              Tutup Rincian
            </Button>
          </div>
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            {/* Primary Question 1: Apa yang terjadi? */}
            <div className="rounded-md border border-border bg-surface-subtle/50 p-4 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                1. Apa Yang Terjadi?
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {AUDIT_ACTION_MAP[selectedLog.action]?.label || selectedLog.action}
                </span>
                <Badge
                  variant={
                    AUDIT_ACTION_MAP[selectedLog.action]?.badgeVariant || 'neutral'
                  }
                  size="sm"
                >
                  {selectedLog.action}
                </Badge>
              </div>
              <p className="text-secondary-foreground text-xs leading-relaxed pt-1">
                {selectedLog.description}
              </p>
            </div>

            {/* Primary Questions 2 & 3: Siapa dan Kapan? */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-surface p-3.5 space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
                  2. Siapa Pelaku Transaksi?
                </span>
                <p className="font-semibold text-foreground text-xs">
                  {selectedLog.actorName}
                </p>
                <p className="text-[11px] text-secondary-foreground">
                  Peran:{' '}
                  {ROLE_LABEL_MAP[selectedLog.actorRole as Role] || selectedLog.actorRole}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  ID Aktor: {selectedLog.actorId}
                </p>
              </div>

              <div className="rounded-md border border-border bg-surface p-3.5 space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
                  3. Kapan Peristiwa Terjadi?
                </span>
                <p className="font-semibold text-foreground text-xs">
                  {formatAuditTimestamp(selectedLog.timestamp).full}
                </p>
                <p className="text-[11px] text-secondary-foreground">
                  Lingkungan Klien:{' '}
                  <span className="font-mono text-muted-foreground">
                    {selectedLog.ipAddress || '127.0.0.1 (Internal)'}
                  </span>
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  ID Log: {selectedLog.id}
                </p>
              </div>
            </div>

            {/* Primary Question 4: Sumber daya mana yang terdampak? */}
            <div className="rounded-md border border-border bg-surface p-3.5 space-y-1.5">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
                4. Sumber Daya Yang Terdampak
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">
                  {ENTITY_LABEL_MAP[selectedLog.entityType] || selectedLog.entityType}
                </span>
                <span>•</span>
                <span className="font-mono text-xs text-primary font-medium">
                  {selectedLog.entityId}
                </span>
              </div>
            </div>

            {/* Minimum Necessary Disclosure & Immutability Notice */}
            <div className="rounded-md border border-border bg-surface-subtle/40 p-3 text-[11px] text-secondary-foreground flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>
                Prinsip Keterbukaan Minimum: Entri historis ini telah disanitasi sehingga tidak mengekspos kata sandi, token otentikasi, atau data rahasia individu.
              </span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
