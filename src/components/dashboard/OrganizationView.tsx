/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Building2,
  Calendar,
  CalendarCheck,
  ChevronRight,
  GraduationCap,
  MapPin,
  Users,
} from 'lucide-react';
import { can } from '../../permissions/can.ts';
import { storage } from '../../services/storage.ts';
import { ClassRoom } from '../../types/index.ts';
import {
  Avatar,
  Badge,
  Button,
  Icon,
} from '../ui/index.ts';
import {
  DataTable,
  DetailTabs,
  EmptyState,
  EntityHeader,
  PageHeader,
  type DataTableColumn,
  type DetailTabItem,
} from '../patterns/index.ts';

export interface OrganizationViewProps {
  onOpenAttendanceForClass?: (classId: string) => void;
  onOpenStudentDetail?: (studentId: string) => void;
}

export const OrganizationView: React.FC<OrganizationViewProps> = ({
  onOpenAttendanceForClass,
  onOpenStudentDetail,
}) => {
  const currentUser = storage.getCurrentUser();
  const canReadAttendance = can(currentUser, 'attendance.read');
  const units = storage.getServiceUnits();
  const classes = storage.getClasses();
  const subjects = storage.getSubjects();
  const schedules = storage.getSchedules();
  const teachers = storage.getTeachers();
  const students = storage.getStudents();
  const attendanceSessions = storage.getAttendanceSessions();

  const pilotUnit = units[0];

  const [activeSectionTab, setActiveSectionTab] = useState<string>('classes');
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [classDetailTab, setClassDetailTab] = useState<string>('roster');

  /*
   * CLASS DETAIL EXPERIENCE (Section 33 of UI-UX-DESIGN-SYSTEM.md)
   * Displays subject/class context, schedule, student count, and tabs (Roster, Schedule, Attendance).
   */
  if (selectedClass) {
    const mainTeacher = teachers.find(
      (t) => t.id === selectedClass.mainTeacherId
    );
    const enrolledStudents = students.filter(
      (s) => s.assignedClassId === selectedClass.id
    );
    const classSchedules = schedules.filter(
      (sch) => sch.classId === selectedClass.id
    );
    const classSessions = attendanceSessions.filter(
      (sess) => sess.classId === selectedClass.id
    );

    const detailTabs: DetailTabItem[] = [
      {
        id: 'roster',
        label: 'Peserta Kelas',
        count: enrolledStudents.length,
      },
      {
        id: 'schedule',
        label: 'Jadwal & Materi Sabtu',
        count: classSchedules.length || subjects.length,
      },
      {
        id: 'attendance',
        label: 'Riwayat Presensi',
        count: classSessions.length,
      },
    ];

    return (
      <div className="space-y-6">
        <EntityHeader
          backLabel="Kembali ke daftar rombongan belajar"
          onBack={() => {
            setSelectedClass(null);
            setClassDetailTab('roster');
          }}
          icon={<Icon icon={BookOpen} size="lg" />}
          eyebrow={`Rombongan Belajar · Kategori ${selectedClass.category}`}
          title={selectedClass.name}
          subtitle={`Ruang belajar: ${selectedClass.roomName} · Waktu rutin: Setiap Sabtu pukul 15.00 – 17.15 WIB`}
          badges={
            <Badge variant="primary" size="md" dot>
              Aktif TA 2026/2027
            </Badge>
          }
          meta={[
            {
              id: 'teacher',
              label: 'Guru Pendamping Utama',
              value: mainTeacher?.fullName || 'Tim Guru Griya Asih',
            },
            {
              id: 'room',
              label: 'Lokasi Ruang',
              value: selectedClass.roomName,
            },
            {
              id: 'capacity',
              label: 'Kapasitas & Terdaftar',
              value: `${selectedClass.enrolledCount} / ${selectedClass.capacity} peserta`,
            },
            {
              id: 'sessions',
              label: 'Sesi Presensi Tercatat',
              value: `${classSessions.length} sesi`,
            },
          ]}
          primaryAction={
            canReadAttendance && onOpenAttendanceForClass ? (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Icon icon={CalendarCheck} size="sm" />}
                onClick={() => onOpenAttendanceForClass(selectedClass.id)}
              >
                Catat presensi kelas ini
              </Button>
            ) : undefined
          }
        />

        <DetailTabs
          tabs={detailTabs}
          activeTab={classDetailTab}
          onChange={setClassDetailTab}
          ariaLabel="Tab detail rombongan belajar"
        />

        {/* CLASS TAB 1: ROSTER */}
        {classDetailTab === 'roster' && (
          <div
            id="tabpanel-roster"
            role="tabpanel"
            aria-labelledby="tab-roster"
            className="space-y-4 pt-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="type-title text-foreground">
                  Daftar Peserta Rombongan Belajar
                </h2>
                <p className="type-caption text-secondary-foreground">
                  {selectedClass.enrolledCount} peserta terdaftar pada rombel ini ({enrolledStudents.length} profil sampel aktif di sistem)
                </p>
              </div>
            </div>

            {enrolledStudents.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Belum ada profil peserta sampel pada kelas ini"
                description={`Kapasitas kelas tercatat ${selectedClass.enrolledCount} dari ${selectedClass.capacity} peserta. Anda dapat menempatkan peserta baru yang telah diverifikasi melalui modul Peserta Didik.`}
              />
            ) : (
              <div className="rounded-card bg-surface border border-border divide-y divide-border">
                {enrolledStudents.map((student) => (
                  <div
                    key={student.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={student.fullName} size="sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {onOpenStudentDetail ? (
                            <button
                              type="button"
                              onClick={() => onOpenStudentDetail(student.id)}
                              className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left cursor-pointer focus-ring rounded-xs"
                            >
                              {student.fullName}
                            </button>
                          ) : (
                            <span className="text-sm font-semibold text-foreground">
                              {student.fullName}
                            </span>
                          )}
                          {student.isRaalResident && (
                            <Badge variant="learning" size="sm">
                              Anak Asuh RAAL
                            </Badge>
                          )}
                        </div>
                        <p className="type-caption text-secondary-foreground">
                          {student.registrationNumber} · Panggilan{' '}
                          {student.nickname} · Kel. {student.kelurahan}
                        </p>
                      </div>
                    </div>

                    <Badge variant="success" size="sm" dot>
                      Aktif
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CLASS TAB 2: SCHEDULE & SUBJECTS */}
        {classDetailTab === 'schedule' && (
          <div
            id="tabpanel-schedule"
            role="tabpanel"
            aria-labelledby="tab-schedule"
            className="space-y-6 pt-2"
          >
            {classSchedules.length > 0 && (
              <section className="space-y-3">
                <h2 className="type-title text-foreground">
                  Jadwal Sesi Spesifik Kelas
                </h2>
                <div className="rounded-card bg-surface border border-border divide-y divide-border">
                  {classSchedules.map((sch) => {
                    const subj = subjects.find((s) => s.id === sch.subjectId);
                    const tchr = teachers.find((t) => t.id === sch.teacherId);
                    return (
                      <div
                        key={sch.id}
                        className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="primary" size="sm">
                              {sch.dayOfWeek} · {sch.timeStart} – {sch.timeEnd}
                            </Badge>
                            <span className="text-sm font-semibold text-foreground">
                              {subj?.name || 'Sesi Belajar'}
                            </span>
                          </div>
                          <p className="type-caption text-secondary-foreground">
                            Pengajar: {tchr?.fullName || 'Tim Guru'} · Lokasi:{' '}
                            {sch.location}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="type-title text-foreground">
                Kurikulum Program Rumah Belajar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((subj) => (
                  <div
                    key={subj.id}
                    className="rounded-card bg-surface border border-border p-5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground">
                        {subj.name}
                      </h3>
                      <Badge variant="neutral" size="sm">
                        {subj.code}
                      </Badge>
                    </div>
                    <p className="type-caption text-secondary-foreground leading-relaxed">
                      {subj.description}
                    </p>
                    <p className="text-xs font-medium text-primary pt-1">
                      Fokus: {subj.targetFocus}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* CLASS TAB 3: ATTENDANCE SESSIONS */}
        {classDetailTab === 'attendance' && (
          <div
            id="tabpanel-attendance"
            role="tabpanel"
            aria-labelledby="tab-attendance"
            className="space-y-4 pt-2"
          >
            {classSessions.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="Belum ada sesi presensi tercatat untuk kelas ini"
                description="Catatan kehadiran sesi Sabtu untuk kelas ini dapat ditambahkan melalui modul Presensi Sesi Belajar."
                action={
                  canReadAttendance && onOpenAttendanceForClass ? (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Icon icon={CalendarCheck} size="xs" />}
                      onClick={() => onOpenAttendanceForClass(selectedClass.id)}
                    >
                      Mulai presensi kelas ini
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="rounded-card bg-surface border border-border divide-y divide-border">
                {classSessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          Sesi Sabtu, {sess.date}
                        </span>
                        <span className="type-caption text-secondary-foreground">
                          · Dicatat oleh {sess.recordedByName}
                        </span>
                      </div>
                      {sess.notes && (
                        <p className="type-caption text-secondary-foreground">
                          {sess.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="success" size="sm" dot>
                        {sess.summary.present} Hadir
                      </Badge>
                      {sess.summary.sick > 0 && (
                        <Badge variant="warning" size="sm">
                          {sess.summary.sick} Sakit
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /*
   * MAIN ORGANIZATION, CLASSES, PROGRAMS & TEACHERS VIEW
   */
  const sectionTabs: DetailTabItem[] = [
    {
      id: 'classes',
      label: 'Rombongan Belajar',
      count: classes.length,
    },
    {
      id: 'programs',
      label: 'Program & Kurikulum',
      count: subjects.length,
    },
    {
      id: 'teachers',
      label: 'Tenaga Pengajar',
      count: teachers.length,
    },
    {
      id: 'institution',
      label: 'Kelembagaan PMKI',
    },
  ];

  const classColumns: DataTableColumn<ClassRoom>[] = [
    {
      id: 'name',
      header: 'Rombongan Belajar',
      cell: (cls) => (
        <div>
          <button
            type="button"
            onClick={() => setSelectedClass(cls)}
            className="font-semibold text-foreground hover:text-primary transition-colors text-left cursor-pointer focus-ring rounded-xs"
          >
            {cls.name}
          </button>
          <span className="type-caption text-secondary-foreground block">
            Kategori {cls.category}
          </span>
        </div>
      ),
    },
    {
      id: 'room',
      header: 'Ruang Belajar',
      cell: (cls) => (
        <span className="text-sm text-foreground">{cls.roomName}</span>
      ),
    },
    {
      id: 'teacher',
      header: 'Guru Pendamping Utama',
      cell: (cls) => {
        const t = teachers.find((tchr) => tchr.id === cls.mainTeacherId);
        return (
          <span className="text-sm font-medium text-foreground">
            {t?.fullName || 'Tim Guru'}
          </span>
        );
      },
    },
    {
      id: 'enrollment',
      header: 'Peserta Terdaftar',
      cell: (cls) => (
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {cls.enrolledCount}{' '}
          <span className="font-normal text-secondary-foreground">
            / {cls.capacity} kapasitas
          </span>
        </span>
      ),
    },
    {
      id: 'action',
      header: 'Tindakan',
      align: 'right',
      cell: (cls) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedClass(cls)}
        >
          Lihat kelas
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisasi, Kelas & Tenaga Pengajar"
        description="Rombongan belajar Sabtu, kurikulum program utama, direktori guru pendamping, dan struktur kelembagaan PMKI."
      />

      <DetailTabs
        tabs={sectionTabs}
        activeTab={activeSectionTab}
        onChange={setActiveSectionTab}
        ariaLabel="Bagian informasi organisasi dan program"
      />

      {/* SECTION TAB 1: CLASSES */}
      {activeSectionTab === 'classes' && (
        <div
          id="tabpanel-classes"
          role="tabpanel"
          aria-labelledby="tab-classes"
          className="space-y-4 pt-2"
        >
          <DataTable
            columns={classColumns}
            data={classes}
            getRowKey={(c) => c.id}
            onRowClick={(c) => setSelectedClass(c)}
            caption="Daftar rombongan belajar Rumah Belajar Griya Asih"
            renderMobileRow={(cls) => {
              const t = teachers.find((tchr) => tchr.id === cls.mainTeacherId);
              return (
                <button
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className="w-full text-left flex items-center justify-between gap-3 py-1 cursor-pointer focus-ring rounded-control"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {cls.name}
                      </span>
                      <Badge variant="neutral" size="sm">
                        {cls.enrolledCount}/{cls.capacity}
                      </Badge>
                    </div>
                    <p className="type-caption text-secondary-foreground">
                      {cls.roomName} · {t?.fullName || 'Tim Guru'}
                    </p>
                  </div>
                  <Icon
                    icon={ChevronRight}
                    size="sm"
                    className="text-muted-foreground shrink-0"
                  />
                </button>
              );
            }}
          />
        </div>
      )}

      {/* SECTION TAB 2: PROGRAMS & CURRICULUM */}
      {activeSectionTab === 'programs' && (
        <div
          id="tabpanel-programs"
          role="tabpanel"
          aria-labelledby="tab-programs"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2"
        >
          {subjects.map((subj) => {
            const subjectSchedules = schedules.filter(
              (s) => s.subjectId === subj.id
            );
            return (
              <section
                key={subj.id}
                className="rounded-card bg-surface border border-border p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="primary" size="md">
                      Kode {subj.code}
                    </Badge>
                    <span className="type-caption text-secondary-foreground">
                      Sabtu, 15.00 – 17.15 WIB
                    </span>
                  </div>

                  <h2 className="type-h3 text-foreground">{subj.name}</h2>

                  <p className="text-sm text-secondary-foreground leading-relaxed">
                    {subj.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border-subtle space-y-2">
                  <div>
                    <span className="type-caption font-semibold text-foreground block">
                      Sasaran Capaian Pembelajaran
                    </span>
                    <p className="type-caption text-secondary-foreground mt-0.5">
                      {subj.targetFocus}
                    </p>
                  </div>

                  {subjectSchedules.length > 0 && (
                    <p className="text-xs text-primary font-medium pt-1">
                      {subjectSchedules.length} sesi terjadwal spesifik pada hari Sabtu
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* SECTION TAB 3: TEACHERS DIRECTORY */}
      {activeSectionTab === 'teachers' && (
        <div
          id="tabpanel-teachers"
          role="tabpanel"
          aria-labelledby="tab-teachers"
          className="space-y-4 pt-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="rounded-card bg-surface border border-border p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={teacher.fullName} size="md" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {teacher.fullName}
                      </h3>
                      {teacher.isCoordinator && (
                        <Badge variant="primary" size="sm">
                          Koordinator
                        </Badge>
                      )}
                    </div>
                    <p className="type-caption text-secondary-foreground">
                      {teacher.originSchool}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-subtle space-y-1.5">
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.map((subj) => (
                      <Badge key={subj} variant="neutral" size="sm">
                        {subj}
                      </Badge>
                    ))}
                  </div>
                  <p className="type-caption text-secondary-foreground font-mono pt-1">
                    {teacher.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION TAB 4: INSTITUTIONAL STRUCTURE */}
      {activeSectionTab === 'institution' && (
        <div
          id="tabpanel-institution"
          role="tabpanel"
          aria-labelledby="tab-institution"
          className="space-y-6 pt-2"
        >
          {/* 3-Tier Institutional Hierarchy */}
          <section className="rounded-card bg-surface border border-border p-6 space-y-4">
            <h2 className="type-title text-foreground">
              Hierarki Kelembagaan Pelayanan Terpadu
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-control bg-surface-subtle border border-border space-y-1">
                <span className="type-eyebrow text-secondary-foreground uppercase">
                  Tingkat I · Pusat
                </span>
                <h3 className="text-base font-bold text-foreground">
                  PMKI Sinodal
                </h3>
                <p className="type-caption text-secondary-foreground">
                  Departemen Pelayanan Kasih (Pelkes)
                </p>
              </div>

              <div className="p-4 rounded-control bg-surface-subtle border border-border space-y-1">
                <span className="type-eyebrow text-secondary-foreground uppercase">
                  Tingkat II · Wilayah
                </span>
                <h3 className="text-base font-bold text-foreground">
                  PMKI Mupel Jawa Timur
                </h3>
                <p className="type-caption text-secondary-foreground">
                  Musyawarah Pelayanan Provinsi Jawa Timur
                </p>
              </div>

              <div className="p-4 rounded-control bg-primary-soft/60 border border-primary/25 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="type-eyebrow text-primary uppercase">
                    Pilot Service Unit
                  </span>
                  <Badge variant="success" size="sm" dot>
                    Aktif
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Rumah Belajar Griya Asih
                </h3>
                <p className="type-caption text-secondary-foreground">
                  RAAL Lawang, Kabupaten Malang
                </p>
              </div>
            </div>
          </section>

          {/* Pilot Service Unit Profile */}
          {pilotUnit && (
            <section className="rounded-card bg-surface border border-border p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-4">
                <div>
                  <span className="type-caption font-mono text-primary font-semibold">
                    {pilotUnit.code}
                  </span>
                  <h2 className="type-h3 text-foreground mt-0.5">
                    {pilotUnit.name}
                  </h2>
                  <p className="type-body-sm text-secondary-foreground italic mt-0.5">
                    "{pilotUnit.headline}"
                  </p>
                </div>
                <Badge variant="activity" size="md">
                  {pilotUnit.slogan}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Icon icon={MapPin} size="xs" className="text-primary" />
                    <span>Lokasi & Cakupan Wilayah</span>
                  </h3>
                  <p className="text-foreground leading-relaxed">
                    {pilotUnit.location}
                  </p>
                  <p className="type-caption text-secondary-foreground">
                    Wilayah layanan utama: {pilotUnit.subDistricts.join(', ')}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Icon icon={Users} size="xs" className="text-primary" />
                    <span>Koordinator & Pengurus Unit</span>
                  </h3>
                  <ul className="space-y-1.5">
                    {pilotUnit.contactPersons.map((cp, idx) => (
                      <li key={idx} className="text-foreground">
                        <span className="font-semibold">{cp.name}</span>{' '}
                        <span className="text-secondary-foreground">
                          ({cp.role})
                        </span>{' '}
                        ·{' '}
                        <span className="font-mono text-primary font-medium">
                          {cp.phone}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
