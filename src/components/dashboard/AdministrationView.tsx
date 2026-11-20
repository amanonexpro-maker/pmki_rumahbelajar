/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Settings,
  Users,
  Key,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Lock,
  CheckCircle2,
  XCircle,
  Check,
  UserCheck,
  Calendar,
  Building,
  Info,
  X,
} from 'lucide-react';
import { storage } from '../../services/storage.ts';
import { ROLE_PERMISSIONS, can } from '../../permissions/can.ts';
import { User, Role, Permission } from '../../types/index.ts';
import {
  Badge,
  type BadgeVariant,
  Button,
  Dialog,
  Select,
} from '../ui/index.ts';
import {
  PageHeader,
  StatSummary,
  DetailTabs,
  SearchToolbar,
  DataTable,
  type DataTableColumn,
  EmptyState,
  ChangeSummary,
} from '../patterns/index.ts';

export const ROLE_DISPLAY_CONFIG: Record<
  Role,
  { label: string; description: string; scope: string }
> = {
  PLATFORM_ADMIN: {
    label: 'Platform Administrator',
    description:
      'Akses penuh konfigurasi platform, administrasi akun pengurus, dan seluruh jejak audit sistem.',
    scope: 'Seluruh Layanan PMKI',
  },
  ORG_ADMIN: {
    label: 'Admin Organisasi (Sinodal / Mupel)',
    description:
      'Pengawasan operasional tingkat wilayah/mupel, administrasi unit, dan pengesahan tata kelola.',
    scope: 'Tingkat Organisasi Mupel / Sinode',
  },
  UNIT_COORDINATOR: {
    label: 'Koordinator Unit Pelayanan',
    description:
      'Penanggung jawab operasional harian Rumah Belajar, verifikasi berkas siswa, pembagian kelas, dan penyusunan laporan.',
    scope: 'Unit Rumah Belajar Griya Asih',
  },
  PROGRAM_COORDINATOR: {
    label: 'Koordinator Program Belajar',
    description:
      'Perencanaan kurikulum belajar, evaluasi efektivitas kelas, dan peninjauan berkala substansi program.',
    scope: 'Program Bimbingan Belajar',
  },
  TEACHER: {
    label: 'Pengajar / Guru Relawan',
    description:
      'Pencatatan presensi kehadiran sesi kelas, pengamatan karakter budi pekerti anak, dan pencatatan bimbingan belajar.',
    scope: 'Sesi Kelas Pembelajaran',
  },
  VOLUNTEER: {
    label: 'Relawan Pendamping',
    description:
      'Pencatatan kehadiran sesi belajar dan pendampingan kegiatan belajar anak.',
    scope: 'Sesi Kelas Pembelajaran',
  },
  EDITOR: {
    label: 'Penyusun Konten / Humas',
    description:
      'Penyusunan naskah draft berita, agenda kegiatan pelayanan, dan artikel literasi publik.',
    scope: 'Portal Informasi Publik',
  },
  REVIEWER: {
    label: 'Peninjau Privasi & Media',
    description:
      'Pemeriksaan perlindungan anak (Child Safeguarding), kurasi kelayakan publikasi dokumentasi foto/video, dan naskah publik.',
    scope: 'Kurasi Konten & Privasi',
  },
  APPROVER: {
    label: 'Pejabat Penyetuju Tata Kelola',
    description:
      'Pengesahan akhir publikasi portal dan persetujuan resmi dokumen laporan (Pemisahan Tugas ditegakkan).',
    scope: 'Pengesahan Tata Kelola',
  },
  AUDITOR: {
    label: 'Auditor Independen',
    description:
      'Akses baca jejak audit transaksi sistem, arsip kepatuhan izin data anak, dan laporan resmi.',
    scope: 'Audit & Kepatuhan',
  },
  STAKEHOLDER: {
    label: 'Pemangku Kepentingan / Majelis',
    description:
      'Pemantauan ringkasan eksekutif capaian pelayanan dan ketercapaian program anak.',
    scope: 'Pemantauan Ringkasan',
  },
};

export const PERMISSION_DOMAINS: Array<{
  id: string;
  name: string;
  permissions: Array<{ key: Permission; label: string; description: string }>;
}> = [
  {
    id: 'students',
    name: 'Peserta Didik & Wali',
    permissions: [
      {
        key: 'student.read',
        label: 'Lihat Data Siswa',
        description: 'Melihat profil pendaftaran dan riwayat akademik siswa',
      },
      {
        key: 'student.write',
        label: 'Ubah Data Siswa',
        description: 'Menambah atau memperbarui profil siswa',
      },
      {
        key: 'student.verify',
        label: 'Verifikasi Pendaftaran',
        description: 'Memvalidasi formulir dan menempatkan kelas siswa',
      },
      {
        key: 'guardian.read',
        label: 'Lihat Data Wali',
        description: 'Melihat identitas dan informasi orang tua/wali',
      },
      {
        key: 'guardian.write',
        label: 'Ubah Data Wali',
        description: 'Memperbarui informasi orang tua/wali',
      },
    ],
  },
  {
    id: 'learning',
    name: 'Presensi & Pembelajaran',
    permissions: [
      {
        key: 'attendance.read',
        label: 'Lihat Presensi Kelas',
        description: 'Melihat riwayat kehadiran sesi belajar',
      },
      {
        key: 'attendance.record',
        label: 'Catat Presensi Sesi',
        description: 'Mengisi kehadiran peserta pada sesi kelas',
      },
      {
        key: 'development.read',
        label: 'Lihat Catatan Karakter',
        description: 'Membaca evaluasi perkembangan dan observasi siswa',
      },
      {
        key: 'development.write',
        label: 'Tulis Catatan Karakter',
        description: 'Menambahkan observasi dan rekomendasi tindak lanjut',
      },
    ],
  },
  {
    id: 'governance',
    name: 'Laporan & Tata Kelola',
    permissions: [
      {
        key: 'report.read',
        label: 'Lihat Dokumen Laporan',
        description: 'Membaca laporan evaluasi pelayanan',
      },
      {
        key: 'report.write',
        label: 'Susun Draft Laporan',
        description: 'Menyusun laporan kegiatan baru',
      },
      {
        key: 'report.review',
        label: 'Tinjau Substansi Program',
        description: 'Melakukan review program dan validasi unit',
      },
      {
        key: 'report.approve',
        label: 'Persetujuan Akhir Laporan',
        description:
          'Mengesahkan laporan resmi (Pemisahan Tugas: bukan pembuat laporan)',
      },
    ],
  },
  {
    id: 'privacy',
    name: 'Persetujuan & Privasi Media',
    permissions: [
      {
        key: 'consent.read',
        label: 'Lihat Persetujuan Wali',
        description: 'Membaca status izin data dan izin publikasi foto anak',
      },
      {
        key: 'consent.write',
        label: 'Perbarui Persetujuan Wali',
        description: 'Mencatat pembaruan, penolakan, atau pencabutan izin wali',
      },
      {
        key: 'media.read',
        label: 'Lihat Galeri Dokumentasi',
        description: 'Mengakses media internal kegiatan',
      },
      {
        key: 'media.write',
        label: 'Kelola Dokumentasi Media',
        description: 'Menambahkan dan memperbarui aset foto kegiatan',
      },
      {
        key: 'media.review',
        label: 'Kurasi Kelayakan Privasi',
        description: 'Menilai dan menetapkan foto layak tampil di portal publik',
      },
    ],
  },
  {
    id: 'publishing',
    name: 'Publikasi Portal',
    permissions: [
      {
        key: 'publication.read',
        label: 'Lihat Konten Berita',
        description: 'Membaca artikel publikasi internal',
      },
      {
        key: 'publication.write',
        label: 'Tulis Konten Publikasi',
        description: 'Menyusun draft berita, agenda, dan pengumuman',
      },
      {
        key: 'publication.publish',
        label: 'Tayangkan ke Portal Publik',
        description: 'Menerbitkan berita ke website publik setelah disetujui',
      },
    ],
  },
  {
    id: 'system',
    name: 'Organisasi & Administrasi Sistem',
    permissions: [
      {
        key: 'org.read',
        label: 'Lihat Data Organisasi',
        description: 'Membaca profil sinode dan mupel',
      },
      {
        key: 'org.write',
        label: 'Ubah Data Organisasi',
        description: 'Mengelola entitas organisasi pelayanan',
      },
      {
        key: 'unit.read',
        label: 'Lihat Unit Pelayanan',
        description: 'Membaca data Rumah Belajar dan ruang kelas',
      },
      {
        key: 'unit.write',
        label: 'Ubah Unit Pelayanan',
        description: 'Mengelola profil unit, kelas, dan jadwal',
      },
      {
        key: 'program.read',
        label: 'Lihat Program Pelayanan',
        description: 'Membaca rincian bimbingan belajar',
      },
      {
        key: 'program.write',
        label: 'Kelola Program Pelayanan',
        description: 'Memperbarui kurikulum program',
      },
      {
        key: 'user.read',
        label: 'Lihat Akun Pengguna',
        description: 'Membaca daftar akun pengurus terdaftar',
      },
      {
        key: 'user.write',
        label: 'Kelola Keaktifan Akun',
        description: 'Mengaktifkan atau menonaktifkan status akun pengurus',
      },
      {
        key: 'audit.read',
        label: 'Akses Jejak Audit',
        description: 'Membaca riwayat audit log permanen',
      },
    ],
  },
];

export const AdministrationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'RBAC' | 'MAINTENANCE'>(
    'USERS'
  );
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const currentUser = storage.getCurrentUser();

  // Permissions
  const canReadUsers = can(currentUser, 'user.read');
  const canWriteUsers = can(currentUser, 'user.write');

  // Search & Filters for Users
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // RBAC Tab State
  const [selectedRole, setSelectedRole] = useState<Role>('UNIT_COORDINATOR');

  // Consequential Dialogs
  const [pendingUserToggle, setPendingUserToggle] = useState<User | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Feedback banner
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'danger';
    text: string;
  } | null>(null);

  const refreshUsers = () => {
    setUsers([...storage.getUsers()]);
  };

  const stats = useMemo(() => {
    const total = users.length;
    const activeCount = users.filter((u) => u.active).length;
    const inactiveCount = total - activeCount;
    const rolesCovered = new Set(users.map((u) => u.role)).size;

    return [
      {
        id: 'total-users',
        label: 'Total Akun Pengurus',
        value: total,
        meta: 'Terdaftar dalam sistem',
      },
      {
        id: 'active-users',
        label: 'Akun Aktif',
        value: activeCount,
        meta: 'Dapat masuk & bertransaksi',
      },
      {
        id: 'inactive-users',
        label: 'Akun Nonaktif',
        value: inactiveCount,
        meta: 'Akses masuk ditangguhkan',
      },
      {
        id: 'active-roles',
        label: 'Variasi Peran Bertugas',
        value: `${rolesCovered} Peran`,
        meta: 'Terkonfigurasi dalam matriks RBAC',
      },
    ];
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const q = userSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && user.active) ||
        (statusFilter === 'INACTIVE' && !user.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearch, roleFilter, statusFilter]);

  const handleExecuteToggleUser = () => {
    if (!pendingUserToggle) return;

    const result = storage.toggleUserActive(pendingUserToggle.id);
    if (result.success) {
      setFeedbackMsg({ type: 'success', text: result.message });
      refreshUsers();
    } else {
      setFeedbackMsg({ type: 'danger', text: result.message });
    }
    setPendingUserToggle(null);
  };

  const handleResetDemoData = () => {
    storage.resetToSeed();
    window.location.reload();
  };

  const permissionsForRole = useMemo(
    () => ROLE_PERMISSIONS[selectedRole] || [],
    [selectedRole]
  );

  const userColumns: DataTableColumn<User>[] = [
    {
      id: 'name',
      header: 'Nama Pengguna & Email',
      cell: (user) => (
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">
            {user.name}
          </div>
          <div className="text-[11px] font-mono text-muted-foreground">
            {user.email}
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Peran & Cakupan Tanggung Jawab',
      cell: (user) => {
        const config = ROLE_DISPLAY_CONFIG[user.role];
        return (
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-foreground">
              {config ? config.label : user.role}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-secondary-foreground">
              <Badge variant="neutral" size="sm">
                {user.role}
              </Badge>
              <span>•</span>
              <span className="text-muted-foreground">{config.scope}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: 'lastLogin',
      header: 'Waktu Masuk Terakhir',
      cell: (user) => (
        <div className="text-xs text-secondary-foreground space-y-0.5">
          {user.lastLoginAt ? (
            <>
              <div className="font-medium text-foreground">
                {new Date(user.lastLoginAt).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">
                {new Date(user.lastLoginAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                WIB
              </div>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Belum pernah masuk
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status Akses',
      cell: (user) => (
        <div className="space-y-0.5">
          <Badge
            variant={user.active ? 'success' : 'neutral'}
            size="sm"
            dot
          >
            {user.active ? 'Aktif' : 'Nonaktif'}
          </Badge>
          <p className="text-[11px] text-muted-foreground">
            {user.active ? 'Dapat login sistem' : 'Akses ditangguhkan'}
          </p>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Tindakan',
      align: 'right',
      cell: (user) => {
        const isSelf = user.id === currentUser.id;
        const isPlatformAdmin = user.id === 'user-admin';

        return (
          <div className="flex items-center justify-end gap-1.5">
            {canWriteUsers ? (
              <Button
                variant={user.active ? 'secondary' : 'primary'}
                size="sm"
                disabled={isPlatformAdmin && user.active}
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingUserToggle(user);
                }}
              >
                {user.active ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Hanya Baca
              </span>
            )}
          </div>
        );
      },
    },
  ];

  if (!canReadUsers) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Administrasi & Hak Akses"
          eyebrow="TATA KELOLA AKSES & SISTEM"
          description="Konfigurasi akun pengurus, status keaktifan login, dan inspeksi kewenangan izin sistem."
        />
        <EmptyState
          icon={Lock}
          title="Akses Terbatas: Izin Administrasi Diperlukan"
          description={`Peran Anda saat ini (${currentUser.role}) tidak memiliki izin 'user.read' untuk mengakses modul administrasi akun. Silakan gunakan pemilih peran simulasi di bilah atas untuk beralih ke Platform Admin atau Koordinator Unit.`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrasi & Hak Akses"
        eyebrow="TATA KELOLA AKSES & SISTEM"
        description="Konfigurasi akun pengurus, penegakan kontrol akses berbasis peran (RBAC), dan pemeliharaan integritas sistem operasional."
      />

      {feedbackMsg && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-xs ${
            feedbackMsg.type === 'success'
              ? 'border-success/35 bg-success-soft text-foreground'
              : 'border-danger/35 bg-danger-soft text-foreground'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            )}
            <div>
              <p className="font-semibold">
                {feedbackMsg.type === 'success'
                  ? 'Status Akun Pengguna Diperbarui'
                  : 'Tindakan Tidak Dapat Dilakukan'}
              </p>
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

      {/* Demo vs Production Role Switching Guidance */}
      <div className="flex items-start gap-3 rounded-md border border-border bg-surface-subtle/60 px-4 py-3 text-xs text-secondary-foreground">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground">
            Perbedaan Fitur Simulasi Peran vs Administrasi Akun:
          </span>{' '}
          Menu pemilih akun pada bilah navigasi atas adalah fitur <strong>Simulasi Peran Uji Coba (Demo Role Switching)</strong> untuk mengevaluasi batasan izin sistem. Daftar akun di bawah ini adalah data pengguna operasional yang tercatat di basis data lokal.
        </div>
      </div>

      <StatSummary items={stats} />

      <DetailTabs
        activeTab={activeTab}
        onChange={(id) =>
          setActiveTab(id as 'USERS' | 'RBAC' | 'MAINTENANCE')
        }
        tabs={[
          {
            id: 'USERS',
            label: 'Akun Pengurus & Akses',
            count: users.length,
            icon: <Users className="h-4 w-4" />,
          },
          {
            id: 'RBAC',
            label: 'Inspektur Hak Akses (Read-Only RBAC)',
            icon: <Key className="h-4 w-4" />,
          },
          {
            id: 'MAINTENANCE',
            label: 'Lingkungan Uji Coba (Demo Sandbox)',
            icon: <Settings className="h-4 w-4" />,
          },
        ]}
      />

      {activeTab === 'USERS' && (
        <section className="rounded-card border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
          <SearchToolbar
            searchValue={userSearch}
            onSearchChange={setUserSearch}
            searchPlaceholder="Cari nama pengurus, email login, atau peran..."
            filters={[
              {
                id: 'role',
                label: 'Peran Akun',
                value: roleFilter,
                onChange: setRoleFilter,
                options: [
                  { value: 'ALL', label: 'Semua Peran' },
                  ...Object.keys(ROLE_DISPLAY_CONFIG).map((r) => ({
                    value: r,
                    label: ROLE_DISPLAY_CONFIG[r as Role].label,
                  })),
                ],
              },
              {
                id: 'status',
                label: 'Status Akses',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: 'ALL', label: 'Semua Status' },
                  { value: 'ACTIVE', label: 'Akun Aktif' },
                  { value: 'INACTIVE', label: 'Akun Nonaktif' },
                ],
              },
            ]}
          />

          <DataTable
            columns={userColumns}
            data={filteredUsers}
            getRowKey={(u) => u.id}
            renderMobileRow={(user) => {
              const config = ROLE_DISPLAY_CONFIG[user.role];
              return (
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {user.name}
                      </h4>
                      <p className="text-xs font-mono text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Badge
                      variant={user.active ? 'success' : 'neutral'}
                      size="sm"
                      dot
                    >
                      {user.active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-secondary-foreground">
                    <span className="font-medium text-foreground">
                      {config ? config.label : user.role}
                    </span>
                    <span>•</span>
                    <span>{config ? config.scope : '-'}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                    <span className="text-[11px] text-muted-foreground">
                      {user.lastLoginAt
                        ? `Masuk: ${new Date(user.lastLoginAt).toLocaleDateString('id-ID')}`
                        : 'Belum pernah masuk'}
                    </span>
                    {canWriteUsers && (
                      <Button
                        variant={user.active ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={user.id === 'user-admin' && user.active}
                        onClick={() => setPendingUserToggle(user)}
                      >
                        {user.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            }}
            emptyState={
              <EmptyState
                icon={Users}
                title="Tidak ada akun pengurus yang sesuai"
                description="Ubah kata kunci pencarian atau sesuaikan filter untuk menampilkan data akun pengurus lainnya."
              />
            }
          />
        </section>
      )}

      {activeTab === 'RBAC' && (
        <div className="space-y-6">
          <section className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  <span>Inspektur Hak Akses (Read-Only RBAC Inspector)</span>
                </h3>
                <p className="text-xs text-secondary-foreground mt-0.5">
                  Setiap peran memiliki hak akses granular yang telah dipetakan secara terpusat untuk menjaga prinsip kepemilikan wewenang terkecil (Least Privilege).
                </p>
              </div>

              <div className="w-full sm:w-72">
                <Select
                  label="Pilih Peran Untuk Diperiksa"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  options={Object.keys(ROLE_DISPLAY_CONFIG).map((r) => ({
                    value: r,
                    label: ROLE_DISPLAY_CONFIG[r as Role].label,
                  }))}
                />
              </div>
            </div>

            {/* Read-Only Invariant Notice */}
            <div className="flex items-start gap-2.5 rounded-md border border-border bg-surface-subtle/60 p-3 text-xs text-secondary-foreground">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Matriks Baku Sistem:</strong> Hak akses dikonfigurasi secara statis pada arsitektur sistem demi menjamin ketertiban tata kelola dan pemisahan tugas. Modul ini bersifat read-only untuk transparansi kepatuhan dan tidak menyediakan pengeditan izin sembarangan.
              </span>
            </div>

            {/* Role Summary Card */}
            <div className="rounded-md border border-border bg-surface-subtle/50 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {ROLE_DISPLAY_CONFIG[selectedRole].label}
                  </span>
                  <Badge variant="primary" size="sm">
                    {selectedRole}
                  </Badge>
                </div>
                <Badge variant="neutral" size="sm">
                  {permissionsForRole.length} Hak Akses Aktif
                </Badge>
              </div>
              <p className="text-xs text-secondary-foreground leading-relaxed">
                {ROLE_DISPLAY_CONFIG[selectedRole].description}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Cakupan Layanan: <strong>{ROLE_DISPLAY_CONFIG[selectedRole].scope}</strong>
              </p>
            </div>
          </section>

          {/* Grouped Permission Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {PERMISSION_DOMAINS.map((domain) => {
              const activeCountInDomain = domain.permissions.filter((p) =>
                permissionsForRole.includes(p.key)
              ).length;

              return (
                <section
                  key={domain.id}
                  className="rounded-card border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <h4 className="text-xs font-semibold text-foreground">
                      {domain.name}
                    </h4>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {activeCountInDomain} dari {domain.permissions.length} diizinkan
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {domain.permissions.map((perm) => {
                      const isGranted = permissionsForRole.includes(perm.key);
                      return (
                        <li
                          key={perm.key}
                          className={`flex items-start justify-between gap-3 rounded-md border p-2.5 text-xs transition-colors ${
                            isGranted
                              ? 'border-border bg-surface'
                              : 'border-border/60 bg-surface-subtle/40 opacity-70'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={
                                  isGranted
                                    ? 'font-medium text-foreground'
                                    : 'text-muted-foreground line-through'
                                }
                              >
                                {perm.label}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                ({perm.key})
                              </span>
                            </div>
                            <p className="text-[11px] text-secondary-foreground">
                              {perm.description}
                            </p>
                          </div>

                          <div className="shrink-0 pt-0.5">
                            {isGranted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
                                <Check className="h-3.5 w-3.5" />
                                <span>Diizinkan</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <X className="h-3 w-3" />
                                <span>Tidak</span>
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'MAINTENANCE' && (
        <div className="space-y-6">
          <section className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              <span>Informasi Lingkungan & Status Basis Data</span>
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
              <div className="rounded-md border border-border bg-surface-subtle/40 p-3.5 space-y-1">
                <span className="text-[11px] text-muted-foreground">
                  Versi Platform
                </span>
                <p className="text-sm font-semibold text-foreground">
                  PMKI v2.0 (Griya Asih Pilot)
                </p>
                <p className="text-[11px] text-secondary-foreground">
                  Rumah Belajar Griya Asih Lawang
                </p>
              </div>

              <div className="rounded-md border border-border bg-surface-subtle/40 p-3.5 space-y-1">
                <span className="text-[11px] text-muted-foreground">
                  Koneksi Penyimpanan
                </span>
                <p className="text-sm font-semibold text-success flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Lokal + Sinkronisasi Database</span>
                </p>
                <p className="text-[11px] text-secondary-foreground">
                  Status persistensi aktif
                </p>
              </div>

              <div className="rounded-md border border-border bg-surface-subtle/40 p-3.5 space-y-1">
                <span className="text-[11px] text-muted-foreground">
                  Integritas Jejak Audit
                </span>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Immutable Append-Only</span>
                </p>
                <p className="text-[11px] text-secondary-foreground">
                  Terproteksi dari modifikasi
                </p>
              </div>
            </div>
          </section>

          {/* Demo Sandbox Reset Section */}
          <section className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <RefreshCw className="h-4 w-4" />
              <span>Pemulihan Data Contoh Uji Coba (Seed Demo Reset)</span>
            </div>
            
            <div className="rounded-md border border-border bg-surface-subtle/50 p-3.5 text-xs text-secondary-foreground space-y-1.5">
              <p className="font-semibold text-foreground">
                Batasan Lingkungan Demo & Evaluasi:
              </p>
              <p className="leading-relaxed">
                Fitur ini khusus disediakan untuk lingkungan evaluasi, pengujian prototype, dan demonstrasi alur operasional Rumah Belajar Griya Asih. Fitur ini <strong>BUKAN</strong> administrasi basis data produksi.
              </p>
            </div>

            <p className="text-xs text-secondary-foreground leading-relaxed max-w-2xl">
              Mengeksekusi pemulihan akan mengembalikan data pendaftaran siswa, rekap presensi kelas, persetujuan wali, media, berita publikasi, dan laporan ke keadaan awal data contoh (seed PDF Griya Asih Lawang).
            </p>

            <div className="pt-2">
              <Button
                variant="destructive"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => setResetConfirmOpen(true)}
              >
                Reset Data Simulasi ke Bawaan Seed
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* Consequential User Status Toggle Dialog */}
      <Dialog
        open={pendingUserToggle !== null}
        onClose={() => setPendingUserToggle(null)}
        title={
          pendingUserToggle?.active
            ? `Nonaktifkan akun ${pendingUserToggle.name}?`
            : `Aktifkan kembali akun ${pendingUserToggle?.name}?`
        }
        description={
          pendingUserToggle?.active
            ? 'Akun yang dinonaktifkan tidak akan dapat masuk ke sistem atau melakukan tindakan operasional apa pun.'
            : 'Akun yang diaktifkan kembali akan dapat masuk dan menggunakan hak akses sesuai peran yang dimilikinya.'
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setPendingUserToggle(null)}
            >
              Batal
            </Button>
            <Button
              variant={pendingUserToggle?.active ? 'destructive' : 'primary'}
              onClick={handleExecuteToggleUser}
            >
              {pendingUserToggle?.active
                ? 'Ya, Nonaktifkan Akun'
                : 'Ya, Aktifkan Akun'}
            </Button>
          </div>
        }
      >
        {pendingUserToggle && (
          <div className="space-y-3 text-xs">
            <ChangeSummary
              title="Konfirmasi Perubahan Status Akun"
              items={[
                {
                  label: 'Pengguna',
                  newValue: `${pendingUserToggle.name} (${pendingUserToggle.email})`,
                },
                {
                  label: 'Peran Bertugas',
                  newValue:
                    ROLE_DISPLAY_CONFIG[pendingUserToggle.role]?.label ||
                    pendingUserToggle.role,
                },
                {
                  label: 'Status Akses',
                  previousValue: pendingUserToggle.active ? 'Aktif' : 'Nonaktif',
                  newValue: pendingUserToggle.active ? 'Nonaktif' : 'Aktif',
                },
              ]}
            />
          </div>
        )}
      </Dialog>

      {/* Consequential Factory Demo Reset Dialog */}
      <Dialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Konfirmasi Reset Data Simulasi Uji Coba"
        description="Apakah Anda yakin ingin mengatur ulang data platform ke keadaan data contoh (seed prototype)?"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setResetConfirmOpen(false)}
            >
              Batalkan
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetDemoData}
            >
              Ya, Pulihkan ke Data Awal Seed
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="rounded-md border border-danger/40 bg-danger-soft p-3.5 space-y-2 text-foreground">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-danger">
                  Dampak Nyata Pemulihan Data Awal Seed:
                </p>
                <ul className="mt-1.5 list-disc pl-4 space-y-1 text-secondary-foreground">
                  <li>Data pendaftaran siswa dikembalikan ke 15 data awal seed PDF Griya Asih Lawang.</li>
                  <li>Seluruh sesi pencatatan presensi yang baru diinput akan direset ke sesi bawaan.</li>
                  <li>Catatan perkembangan karakter dan observasi belajar baru akan direset.</li>
                  <li>Perubahan status pada perizinan wali dan publikasi berita dikembalikan ke kondisi seed awal.</li>
                  <li>Draf dokumen laporan pelayanan dikembalikan ke draf awal seed.</li>
                  <li>Jejak audit dikembalikan ke 3 catatan inisialisasi awal.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
