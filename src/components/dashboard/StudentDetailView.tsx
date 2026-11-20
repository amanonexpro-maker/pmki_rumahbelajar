/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  CalendarCheck,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { can } from '../../permissions/can.ts';
import { storage } from '../../services/storage.ts';
import {
  ConsentStatus,
  RegistrationStatus,
  Student,
  StudentDevelopmentNote,
} from '../../types/index.ts';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  Icon,
  Input,
  RadioGroup,
  Select,
  Textarea,
  type BadgeVariant,
} from '../ui/index.ts';
import {
  DetailTabs,
  EmptyState,
  EntityHeader,
  FormSection,
  ReviewSection,
  type DetailTabItem,
} from '../patterns/index.ts';

const STATUS_CONFIG: Record<
  RegistrationStatus,
  { label: string; variant: BadgeVariant }
> = {
  SUBMITTED: { label: 'Pendaftaran masuk', variant: 'warning' },
  PENDING_VERIFICATION: { label: 'Menunggu verifikasi', variant: 'warning' },
  VERIFIED: { label: 'Terverifikasi', variant: 'info' },
  CLASS_PLACEMENT: { label: 'Penempatan kelas', variant: 'info' },
  ACTIVE: { label: 'Aktif', variant: 'success' },
  WAITLIST: { label: 'Daftar tunggu', variant: 'neutral' },
  REJECTED: { label: 'Ditolak', variant: 'danger' },
  CANCELLED: { label: 'Dibatalkan', variant: 'neutral' },
};

const GRADE_LABELS: Record<Student['gradeLevel'], string> = {
  TK: 'TK (A & B)',
  SD_1: 'SD Kelas 1',
  SD_2: 'SD Kelas 2',
  SD_3: 'SD Kelas 3',
  SD_4: 'SD Kelas 4',
  SD_5: 'SD Kelas 5',
  SD_6: 'SD Kelas 6',
  SMP_7: 'SMP Kelas 7',
  SMP_8: 'SMP Kelas 8',
};

const RELATIONSHIP_LABELS: Record<Student['guardian']['relationship'], string> =
  {
    AYAH: 'Ayah',
    IBU: 'Ibu',
    WALI: 'Wali Keluarga',
    PENGASUH_RAAL: 'Pengasuh Asrama RAAL',
    LAINNYA: 'Lainnya',
  };

const CATEGORY_LABELS: Record<StudentDevelopmentNote['category'], string> = {
  KARAKTER: 'Karakter & Budi Pekerti',
  MEMBACA: 'Literasi Membaca',
  AKADEMIK: 'Akademik & Penalaran',
  KEDISIPLINAN: 'Kedisiplinan',
  SOSIAL: 'Empati & Sosial',
};

export interface StudentDetailViewProps {
  student: Student;
  onBack: () => void;
  onStudentUpdated: (updated: Student) => void;
}

/**
 * Signature Student Detail Experience (Sections 24, 32 & 39 of UI-UX-DESIGN-SYSTEM.md)
 * Features identity header, status workflow, tabs (Overview, Attendance, Learning, Development),
 * and progressive disclosure for confidential guardian, consent, and development records.
 */
export const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  student,
  onBack,
  onStudentUpdated,
}) => {
  const currentUser = storage.getCurrentUser();
  const canWriteStudent = can(currentUser, 'student.write');
  const canVerifyStudent = can(currentUser, 'student.verify');
  const canReadGuardian = can(currentUser, 'guardian.read');
  const canReadConsent = can(currentUser, 'consent.read');
  const canWriteConsent = can(currentUser, 'consent.write');
  const canReadDevelopment = can(currentUser, 'development.read');
  const canWriteDevelopment = can(currentUser, 'development.write');

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [revealGuardianContact, setRevealGuardianContact] = useState(false);
  const [revealedNoteIds, setRevealedNoteIds] = useState<Record<string, boolean>>({});

  // Class placement modal state (UI-6 Section 24)
  const classes = storage.getClasses();
  const teachers = storage.getTeachers();
  const schedules = storage.getSchedules();
  const subjects = storage.getSubjects();
  const [assignClassModalOpen, setAssignClassModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    student.assignedClassId || classes[0]?.id || ''
  );

  // Registration verification modal state (UI-6 Section 23)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyDecision, setVerifyDecision] = useState<
    'VERIFIED' | 'WAITLIST' | 'PENDING_VERIFICATION' | 'REJECTED'
  >('VERIFIED');
  const [verifyNote, setVerifyNote] = useState(student.notes || '');
  const [verifyError, setVerifyError] = useState('');

  // Consequential status change confirmation modal (UI-6 Section 25)
  const [consequentialAction, setConsequentialAction] = useState<
    'WAITLIST' | 'CANCELLED' | null
  >(null);
  const [consequentialNote, setConsequentialNote] = useState('');

  // Internal Edit Student & Guardian Profile modal (UI-6 Section 22)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState(student.fullName);
  const [editNickname, setEditNickname] = useState(student.nickname);
  const [editGender, setEditGender] = useState<'L' | 'P'>(student.gender);
  const [editDob, setEditDob] = useState(student.dateOfBirth);
  const [editPob, setEditPob] = useState(student.placeOfBirth);
  const [editKelurahan, setEditKelurahan] = useState<
    'Kalirejo' | 'Lawang' | 'Lainnya'
  >(student.kelurahan);
  const [editAddress, setEditAddress] = useState(student.address);
  const [editGradeLevel, setEditGradeLevel] = useState<Student['gradeLevel']>(
    student.gradeLevel
  );
  const [editIsRaal, setEditIsRaal] = useState(student.isRaalResident);
  const [editNotes, setEditNotes] = useState(student.notes || '');
  const [editGuardianName, setEditGuardianName] = useState(
    student.guardian.fullName
  );
  const [editGuardianRel, setEditGuardianRel] = useState<
    Student['guardian']['relationship']
  >(student.guardian.relationship);
  const [editGuardianPhone, setEditGuardianPhone] = useState(
    student.guardian.phone
  );
  const [editGuardianOccupation, setEditGuardianOccupation] = useState(
    student.guardian.occupation
  );
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Consent state
  const [consents, setConsents] = useState(storage.getConsents());
  const studentConsent = consents.find((c) => c.studentId === student.id);

  // Development notes state
  const [devNotes, setDevNotes] = useState<StudentDevelopmentNote[]>(
    storage.getDevelopmentNotes()
  );
  const studentDevNotes = devNotes.filter((n) => n.studentId === student.id);
  const [addNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [noteDate, setNoteDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [noteCategory, setNoteCategory] =
    useState<StudentDevelopmentNote['category']>('KARAKTER');
  const [noteObservation, setNoteObservation] = useState('');
  const [noteProgress, setNoteProgress] = useState('');
  const [noteFollowUp, setNoteFollowUp] = useState('');

  // Attendance records for this student
  const attendanceSessions = storage.getAttendanceSessions();
  const studentAttendanceHistory = attendanceSessions
    .map((sess) => {
      const record = sess.records.find((r) => r.studentId === student.id);
      if (!record) return null;
      return {
        sessionId: sess.id,
        date: sess.date,
        className: sess.className,
        recordedByName: sess.recordedByName,
        status: record.status,
        note: record.note || sess.notes,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const assignedClass = classes.find((c) => c.id === student.assignedClassId);
  const classTeacher = assignedClass
    ? teachers.find((t) => t.id === assignedClass.mainTeacherId)
    : undefined;
  const classSchedules = assignedClass
    ? schedules.filter((sch) => sch.classId === assignedClass.id)
    : [];

  const handleStatusChange = (
    newStatus: RegistrationStatus,
    classId?: string,
    notes?: string
  ) => {
    if (!canVerifyStudent) return;
    storage.updateStudentStatus(student.id, newStatus, classId, notes);
    const updated = storage.getStudentById(student.id);
    if (updated) {
      onStudentUpdated({ ...updated });
    }
    setAssignClassModalOpen(false);
    setVerifyModalOpen(false);
    setConsequentialAction(null);
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canVerifyStudent) return;
    if (verifyDecision === 'REJECTED' && !verifyNote.trim()) {
      setVerifyError(
        'Mohon tuliskan alasan penolakan pendaftaran agar tercatat dengan jelas.'
      );
      return;
    }
    setVerifyError('');
    handleStatusChange(
      verifyDecision,
      undefined,
      verifyNote.trim() || undefined
    );
  };

  const openEditProfileModal = () => {
    setEditFullName(student.fullName);
    setEditNickname(student.nickname);
    setEditGender(student.gender);
    setEditDob(student.dateOfBirth);
    setEditPob(student.placeOfBirth);
    setEditKelurahan(student.kelurahan);
    setEditAddress(student.address);
    setEditGradeLevel(student.gradeLevel);
    setEditIsRaal(student.isRaalResident);
    setEditNotes(student.notes || '');
    setEditGuardianName(student.guardian.fullName);
    setEditGuardianRel(student.guardian.relationship);
    setEditGuardianPhone(student.guardian.phone);
    setEditGuardianOccupation(student.guardian.occupation);
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWriteStudent) return;

    const nextErrors: Record<string, string> = {};
    if (!editFullName.trim()) {
      nextErrors.fullName = 'Masukkan nama lengkap peserta.';
    }
    if (!editNickname.trim()) {
      nextErrors.nickname = 'Masukkan nama panggilan peserta.';
    }
    if (!editDob) {
      nextErrors.dob = 'Pilih tanggal lahir peserta.';
    }
    if (canReadGuardian) {
      if (!editGuardianName.trim()) {
        nextErrors.guardianName = 'Masukkan nama orang tua atau wali.';
      }
      const cleanPhone = editGuardianPhone.replace(/[^0-9+]/g, '');
      if (!cleanPhone || cleanPhone.length < 9) {
        nextErrors.guardianPhone =
          'Masukkan nomor WhatsApp atau telepon wali yang dapat dihubungi.';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setEditErrors(nextErrors);
      return;
    }

    const updated = storage.updateStudentProfile(student.id, {
      fullName: editFullName.trim(),
      nickname: editNickname.trim(),
      gender: editGender,
      dateOfBirth: editDob,
      placeOfBirth: editPob.trim() || 'Malang',
      address: editAddress.trim() || `Kelurahan ${editKelurahan}`,
      kelurahan: editKelurahan,
      gradeLevel: editGradeLevel,
      isRaalResident: editIsRaal,
      notes: editNotes.trim() || undefined,
      guardian: canReadGuardian
        ? {
            fullName: editGuardianName.trim(),
            relationship: editGuardianRel,
            phone: editGuardianPhone.trim(),
            occupation: editGuardianOccupation.trim() || '-',
            address: editAddress.trim() || `Kelurahan ${editKelurahan}`,
          }
        : undefined,
    });

    if (updated) {
      onStudentUpdated({ ...updated });
    }
    setEditModalOpen(false);
  };

  const handleToggleMediaConsent = (nextStatus: ConsentStatus) => {
    if (!canWriteConsent || !studentConsent) return;
    storage.updateConsent(
      studentConsent.id,
      studentConsent.personalDataConsent,
      nextStatus
    );
    setConsents([...storage.getConsents()]);
  };

  const handleAddDevelopmentNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWriteDevelopment || !noteObservation.trim()) return;

    storage.addDevelopmentNote({
      studentId: student.id,
      studentName: student.fullName,
      date: noteDate,
      category: noteCategory,
      observation: noteObservation.trim(),
      progressNotes: noteProgress.trim(),
      followUp: noteFollowUp.trim(),
    });

    setDevNotes([...storage.getDevelopmentNotes()]);
    setAddNoteModalOpen(false);
    setNoteObservation('');
    setNoteProgress('');
    setNoteFollowUp('');
  };

  const statusCfg = STATUS_CONFIG[student.status] || {
    label: student.status,
    variant: 'neutral' as BadgeVariant,
  };

  const tabs: DetailTabItem[] = [
    { id: 'overview', label: 'Ringkasan' },
    {
      id: 'attendance',
      label: 'Kehadiran',
      count: studentAttendanceHistory.length,
    },
    { id: 'learning', label: 'Pembelajaran & Kelas' },
    {
      id: 'development',
      label: 'Perkembangan',
      count: canReadDevelopment ? studentDevNotes.length : undefined,
    },
  ];

  // Contextual Primary & Secondary Actions for EntityHeader (UI-6 Sections 23, 24 & 25)
  let primaryAction: React.ReactNode = undefined;
  let secondaryActions: React.ReactNode = undefined;

  if (canVerifyStudent) {
    if (
      student.status === 'SUBMITTED' ||
      student.status === 'PENDING_VERIFICATION' ||
      student.status === 'WAITLIST'
    ) {
      secondaryActions = canWriteStudent ? (
        <Button
          variant="secondary"
          size="md"
          leftIcon={<Icon icon={Pencil} size="xs" />}
          onClick={openEditProfileModal}
        >
          Perbarui data
        </Button>
      ) : undefined;
      primaryAction = (
        <Button
          variant="primary"
          size="md"
          leftIcon={<Icon icon={UserCheck} size="sm" />}
          onClick={() => {
            setVerifyDecision('VERIFIED');
            setVerifyNote(student.notes || '');
            setVerifyError('');
            setVerifyModalOpen(true);
          }}
        >
          Verifikasi pendaftaran
        </Button>
      );
    } else if (student.status === 'VERIFIED' || !student.assignedClassId) {
      secondaryActions = (
        <>
          {canWriteStudent && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Icon icon={Pencil} size="xs" />}
              onClick={openEditProfileModal}
            >
              Perbarui data
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setConsequentialNote('');
              setConsequentialAction('WAITLIST');
            }}
          >
            Pindah ke daftar tunggu
          </Button>
        </>
      );
      primaryAction = (
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setSelectedClassId(
              student.assignedClassId || classes[0]?.id || ''
            );
            setAssignClassModalOpen(true);
          }}
        >
          Tempatkan di kelas
        </Button>
      );
    } else {
      secondaryActions = (
        <>
          {canWriteStudent && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Icon icon={Pencil} size="xs" />}
              onClick={openEditProfileModal}
            >
              Perbarui data
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedClassId(
                student.assignedClassId || classes[0]?.id || ''
              );
              setAssignClassModalOpen(true);
            }}
          >
            Pindah kelas
          </Button>
          {student.status === 'ACTIVE' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setConsequentialNote('');
                setConsequentialAction('CANCELLED');
              }}
            >
              Nonaktifkan
            </Button>
          )}
        </>
      );
    }
  } else if (canWriteStudent) {
    secondaryActions = (
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Icon icon={Pencil} size="xs" />}
        onClick={openEditProfileModal}
      >
        Perbarui data
      </Button>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. SIGNATURE ENTITY HEADER (Section 32) */}
      <EntityHeader
        backLabel="Kembali ke daftar peserta"
        onBack={onBack}
        avatarName={student.fullName}
        consentGranted={
          studentConsent?.photoVideoPublicConsent !== 'DENIED' &&
          studentConsent?.photoVideoPublicConsent !== 'REVOKED'
        }
        eyebrow={`Peserta Didik · ${student.registrationNumber}`}
        title={student.fullName}
        subtitle={`Panggilan: ${student.nickname} · Terdaftar pada ${new Date(
          student.createdAt
        ).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`}
        badges={
          <>
            <Badge variant={statusCfg.variant} size="md" dot>
              {statusCfg.label}
            </Badge>
            {student.isRaalResident && (
              <Badge variant="learning" size="md">
                Anak Asuh RAAL
              </Badge>
            )}
          </>
        }
        meta={[
          {
            id: 'grade',
            label: 'Jenjang Pendidikan',
            value: GRADE_LABELS[student.gradeLevel] || student.gradeLevel,
          },
          {
            id: 'class',
            label: 'Rombongan Belajar',
            value: assignedClass ? assignedClass.name : 'Belum ditempatkan',
          },
          {
            id: 'region',
            label: 'Wilayah Domisili',
            value: `Kelurahan ${student.kelurahan}`,
          },
          {
            id: 'consent',
            label: 'Izin Dokumentasi Publik',
            value: studentConsent
              ? studentConsent.photoVideoPublicConsent === 'GRANTED'
                ? 'Diizinkan wali'
                : 'Tidak untuk publik'
              : 'Belum tercatat',
          },
        ]}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />

      {/* 2. DETAIL TABS (Section 24 & 32) */}
      <DetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Bagian informasi peserta didik"
      />

      {/* TAB 1: OVERVIEW (Identity, Progressive Disclosure Guardian & Consent) */}
      {activeTab === 'overview' && (
        <div
          id="tabpanel-overview"
          role="tabpanel"
          aria-labelledby="tab-overview"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2"
        >
          {/* Left Column: Participant Profile & Initial Context */}
          <div className="lg:col-span-7 space-y-6">
            <section className="rounded-card bg-surface border border-border p-5 sm:p-6 space-y-4">
              <h2 className="type-title text-foreground">
                Biodata Peserta Didik
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm pt-2 border-t border-border-subtle">
                <div>
                  <dt className="type-caption text-secondary-foreground">
                    Nama Lengkap
                  </dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {student.fullName}
                  </dd>
                </div>
                <div>
                  <dt className="type-caption text-secondary-foreground">
                    Nama Panggilan
                  </dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {student.nickname}
                  </dd>
                </div>
                <div>
                  <dt className="type-caption text-secondary-foreground">
                    Tempat, Tanggal Lahir
                  </dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {student.placeOfBirth}, {student.dateOfBirth}
                  </dd>
                </div>
                <div>
                  <dt className="type-caption text-secondary-foreground">
                    Jenis Kelamin
                  </dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </dd>
                </div>
                <div>
                  <dt className="type-caption text-secondary-foreground">
                    Jenjang Pendidikan
                  </dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {GRADE_LABELS[student.gradeLevel]}
                  </dd>
                </div>
                <div>
                  <dt className="type-caption text-secondary-foreground">
                    Status Verifikasi
                  </dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {student.verifiedBy
                      ? `Diverifikasi oleh ${student.verifiedBy}`
                      : 'Menunggu verifikasi pengurus'}
                  </dd>
                </div>
              </dl>

              {student.notes && (
                <div className="pt-4 border-t border-border-subtle space-y-1">
                  <span className="type-caption font-semibold text-secondary-foreground block">
                    Catatan Konteks Awal
                  </span>
                  <p className="text-sm text-foreground leading-relaxed">
                    {student.notes}
                  </p>
                </div>
              )}
            </section>

            {/* Guardian & Family Information with Progressive Disclosure (Section 32 & 39) */}
            <section className="rounded-card bg-surface border border-border p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="type-title text-foreground">
                      Orang Tua / Wali & Kontak
                    </h2>
                    <Badge variant="confidential" size="sm">
                      Data Keluarga
                    </Badge>
                  </div>
                  <p className="type-caption text-secondary-foreground">
                    Informasi kontak wali dilindungi dan hanya dibuka saat diperlukan
                  </p>
                </div>

                {canReadGuardian && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={
                      <Icon
                        icon={revealGuardianContact ? EyeOff : Eye}
                        size="xs"
                      />
                    }
                    onClick={() =>
                      setRevealGuardianContact((prev) => !prev)
                    }
                  >
                    {revealGuardianContact
                      ? 'Sembunyikan kontak'
                      : 'Tampilkan kontak & alamat'}
                  </Button>
                )}
              </div>

              {!canReadGuardian ? (
                <div className="p-4 rounded-control bg-surface-subtle border border-border flex items-start gap-3 type-caption text-secondary-foreground">
                  <Icon
                    icon={Lock}
                    size="sm"
                    className="text-muted-foreground mt-0.5"
                  />
                  <span>
                    Peran Anda saat ini (<strong>{currentUser.role}</strong>) tidak memiliki izin untuk melihat rincian kontak telepon dan alamat rumah orang tua/wali. Hubungi Koordinator Unit bila memerlukan koordinasi keluarga.
                  </span>
                </div>
              ) : (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm pt-2 border-t border-border-subtle">
                  <div>
                    <dt className="type-caption text-secondary-foreground">
                      Nama Orang Tua / Wali
                    </dt>
                    <dd className="font-medium text-foreground mt-0.5">
                      {student.guardian.fullName}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-caption text-secondary-foreground">
                      Hubungan Keluarga
                    </dt>
                    <dd className="font-medium text-foreground mt-0.5">
                      {RELATIONSHIP_LABELS[student.guardian.relationship] ||
                        student.guardian.relationship}
                    </dd>
                  </div>

                  {revealGuardianContact ? (
                    <>
                      <div>
                        <dt className="type-caption text-secondary-foreground">
                          Nomor Telepon / WhatsApp
                        </dt>
                        <dd className="mt-0.5">
                          <a
                            href={`https://wa.me/${student.guardian.phone.replace(
                              /[^0-9]/g,
                              ''
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-semibold text-primary hover:underline focus-ring rounded-xs"
                          >
                            {student.guardian.phone}
                          </a>
                        </dd>
                      </div>
                      <div>
                        <dt className="type-caption text-secondary-foreground">
                          Pekerjaan Wali
                        </dt>
                        <dd className="font-medium text-foreground mt-0.5">
                          {student.guardian.occupation}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="type-caption text-secondary-foreground">
                          Alamat Lengkap Tempat Tinggal
                        </dt>
                        <dd className="font-medium text-foreground mt-0.5">
                          {student.address} (Kelurahan {student.kelurahan})
                        </dd>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2 p-3 rounded-control bg-surface-subtle/70 border border-border-subtle flex items-center justify-between gap-2 type-caption text-secondary-foreground">
                      <span>
                        Nomor telepon WhatsApp, pekerjaan, dan alamat rumah disembunyikan secara default untuk menjaga privasi.
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setRevealGuardianContact(true)}
                      >
                        Buka rincian
                      </Button>
                    </div>
                  )}
                </dl>
              )}
            </section>
          </div>

          {/* Right Column: Independent Consent & Safeguarding Status */}
          <div className="lg:col-span-5 space-y-6">
            <section className="rounded-card bg-surface border border-border p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon icon={ShieldCheck} size="md" className="text-primary" />
                  <h2 className="type-title text-foreground">
                    Persetujuan & Privasi Anak
                  </h2>
                </div>
              </div>

              <p className="type-caption text-secondary-foreground leading-relaxed">
                Persetujuan publikasi media dipisahkan secara independen dari izin pemrosesan data belajar peserta didik.
              </p>

              {!canReadConsent ? (
                <p className="type-caption text-muted-foreground">
                  Informasi persetujuan tidak tersedia untuk peran ini.
                </p>
              ) : studentConsent ? (
                <div className="space-y-3 pt-2 border-t border-border-subtle">
                  <div className="flex items-center justify-between gap-2 py-1.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Izin Pemrosesan Data Belajar
                      </p>
                      <p className="type-caption text-secondary-foreground">
                        Administrasi akademik & presensi internal
                      </p>
                    </div>
                    <Badge
                      variant={
                        studentConsent.personalDataConsent === 'GRANTED'
                          ? 'success'
                          : 'danger'
                      }
                      dot
                    >
                      {studentConsent.personalDataConsent === 'GRANTED'
                        ? 'Disetujui'
                        : 'Ditolak'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2 py-1.5 border-t border-border-subtle">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Izin Dokumentasi Foto/Video Publik
                      </p>
                      <p className="type-caption text-secondary-foreground">
                        Galeri dan berita website publik
                      </p>
                    </div>
                    <Badge
                      variant={
                        studentConsent.photoVideoPublicConsent === 'GRANTED'
                          ? 'success'
                          : 'warning'
                      }
                      dot
                    >
                      {studentConsent.photoVideoPublicConsent === 'GRANTED'
                        ? 'Diizinkan'
                        : 'Tidak dipublikasikan'}
                    </Badge>
                  </div>

                  {studentConsent.notes && (
                    <p className="p-3 rounded-control bg-surface-subtle type-caption text-secondary-foreground">
                      Catatan wali: "{studentConsent.notes}"
                    </p>
                  )}

                  {canWriteConsent && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleToggleMediaConsent(
                            studentConsent.photoVideoPublicConsent === 'GRANTED'
                              ? 'DENIED'
                              : 'GRANTED'
                          )
                        }
                      >
                        {studentConsent.photoVideoPublicConsent === 'GRANTED'
                          ? 'Batasi publikasi foto anak'
                          : 'Izinkan publikasi foto'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-control bg-warning-soft border border-warning-border type-caption text-warning-foreground">
                  Peserta ini belum memiliki rekaman lembar persetujuan media terpisah.
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE HISTORY */}
      {activeTab === 'attendance' && (
        <div
          id="tabpanel-attendance"
          role="tabpanel"
          aria-labelledby="tab-attendance"
          className="space-y-6 pt-2"
        >
          {studentAttendanceHistory.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="Belum ada catatan kehadiran untuk peserta ini"
              description="Rekaman kehadiran akan muncul secara otomatis setelah guru atau pengurus mencatat presensi sesi belajar Sabtu pada kelas peserta."
            />
          ) : (
            <div className="rounded-card bg-surface border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="type-title text-foreground">
                    Riwayat Kehadiran Sesi Sabtu
                  </h2>
                  <p className="type-caption text-secondary-foreground">
                    Total {studentAttendanceHistory.length} sesi tercatat untuk {student.fullName}
                  </p>
                </div>
                <Badge variant="success" dot>
                  {
                    studentAttendanceHistory.filter(
                      (r) => r.status === 'PRESENT'
                    ).length
                  }{' '}
                  Hadir
                </Badge>
              </div>

              <ul role="list" className="divide-y divide-border">
                {studentAttendanceHistory.map((item) => (
                  <li
                    key={item.sessionId}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-semibold text-foreground">
                          {item.className}
                        </span>
                        <span className="type-caption text-secondary-foreground">
                          · Sesi {item.date}
                        </span>
                      </div>
                      {item.note && (
                        <p className="type-caption text-secondary-foreground">
                          {item.note}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Dicatat oleh {item.recordedByName}
                      </p>
                    </div>

                    <Badge
                      variant={
                        item.status === 'PRESENT'
                          ? 'success'
                          : item.status === 'SICK' ||
                            item.status === 'PERMITTED'
                          ? 'warning'
                          : 'danger'
                      }
                      dot
                    >
                      {item.status === 'PRESENT'
                        ? 'Hadir'
                        : item.status === 'SICK'
                        ? 'Sakit'
                        : item.status === 'PERMITTED'
                        ? 'Izin'
                        : 'Tanpa keterangan'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LEARNING & CLASS CONTEXT */}
      {activeTab === 'learning' && (
        <div
          id="tabpanel-learning"
          role="tabpanel"
          aria-labelledby="tab-learning"
          className="space-y-6 pt-2"
        >
          {!assignedClass ? (
            <EmptyState
              icon={BookOpen}
              title="Peserta belum ditempatkan di rombongan belajar"
              description="Tempatkan peserta ke dalam kelas yang sesuai dengan jenjang pendidikannya agar jadwal belajar Sabtu dan daftar presensi terhubung."
              action={
                canVerifyStudent ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setAssignClassModalOpen(true)}
                  >
                    Tempatkan di kelas sekarang
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <section className="lg:col-span-5 rounded-card bg-surface border border-border p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="primary" size="sm">
                    Rombel Aktif
                  </Badge>
                  <span className="type-caption text-secondary-foreground">
                    Kategori {assignedClass.category}
                  </span>
                </div>

                <div>
                  <h2 className="type-h3 text-foreground">
                    {assignedClass.name}
                  </h2>
                  <p className="type-caption text-secondary-foreground mt-1 flex items-center gap-1.5">
                    <Icon icon={MapPin} size="xs" />
                    <span>{assignedClass.roomName}</span>
                  </p>
                </div>

                <dl className="pt-3 border-t border-border-subtle space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-secondary-foreground">Wali / Guru Utama</dt>
                    <dd className="font-semibold text-foreground">
                      {classTeacher?.fullName || 'Tim Guru Griya Asih'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-foreground">Jumlah Peserta</dt>
                    <dd className="font-semibold text-foreground">
                      {assignedClass.enrolledCount} / {assignedClass.capacity} anak
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-foreground">Waktu Belajar</dt>
                    <dd className="font-semibold text-foreground">
                      Sabtu, 15.00 – 17.15 WIB
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="lg:col-span-7 rounded-card bg-surface border border-border p-5 sm:p-6 space-y-4">
                <h2 className="type-title text-foreground">
                  Program & Kurikulum Pembelajaran
                </h2>
                <p className="type-caption text-secondary-foreground">
                  Empat pilar pembelajaran utama di Rumah Belajar Griya Asih Lawang
                </p>

                <ul role="list" className="divide-y divide-border-subtle pt-1">
                  {subjects.map((subj) => {
                    const matchingSchedule = classSchedules.find(
                      (s) => s.subjectId === subj.id
                    );
                    return (
                      <li key={subj.id} className="py-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {subj.name}
                          </span>
                          {matchingSchedule ? (
                            <Badge variant="primary" size="sm">
                              Sabtu {matchingSchedule.timeStart} –{' '}
                              {matchingSchedule.timeEnd}
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Terintegrasi Sabtu
                            </Badge>
                          )}
                        </div>
                        <p className="type-caption text-secondary-foreground">
                          {subj.targetFocus}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DEVELOPMENT NOTES (Confidential + Progressive Disclosure) */}
      {activeTab === 'development' && (
        <div
          id="tabpanel-development"
          role="tabpanel"
          aria-labelledby="tab-development"
          className="space-y-6 pt-2"
        >
          {!canReadDevelopment ? (
            <EmptyState
              icon={Lock}
              title="Catatan perkembangan bersifat rahasia (Confidential)"
              description="Hanya Guru Pendamping, Koordinator Program, Koordinator Unit, dan Administrator yang memiliki wewenang untuk membuka catatan observasi perkembangan anak."
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="type-title text-foreground">
                      Catatan Observasi & Perkembangan Anak
                    </h2>
                    <Badge variant="confidential" size="sm">
                      Confidential
                    </Badge>
                  </div>
                  <p className="type-caption text-secondary-foreground">
                    Rekaman perkembangan akademik, literasi membaca, dan karakter peserta didik
                  </p>
                </div>

                {canWriteDevelopment && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Icon icon={Plus} size="xs" />}
                    onClick={() => setAddNoteModalOpen(true)}
                  >
                    Tambah catatan perkembangan
                  </Button>
                )}
              </div>

              {studentDevNotes.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Belum ada catatan perkembangan untuk peserta ini"
                  description="Guru pendamping dapat mencatat perkembangan literasi membaca, karakter, maupun akademik anak setelah sesi belajar selesai."
                  action={
                    canWriteDevelopment ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Icon icon={Plus} size="xs" />}
                        onClick={() => setAddNoteModalOpen(true)}
                      >
                        Buat catatan pertama
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ul role="list" className="space-y-4">
                  {studentDevNotes.map((note) => {
                    const isRevealed = Boolean(revealedNoteIds[note.id]);
                    return (
                      <li
                        key={note.id}
                        className="rounded-card bg-surface border border-border p-5 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="learning" size="sm">
                              {CATEGORY_LABELS[note.category] || note.category}
                            </Badge>
                            <span className="type-caption text-secondary-foreground">
                              {note.date} · Oleh {note.teacherName}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={
                              <Icon
                                icon={isRevealed ? EyeOff : Eye}
                                size="xs"
                              />
                            }
                            onClick={() =>
                              setRevealedNoteIds((prev) => ({
                                ...prev,
                                [note.id]: !prev[note.id],
                              }))
                            }
                          >
                            {isRevealed
                              ? 'Sembunyikan rincian'
                              : 'Buka rincian observasi'}
                          </Button>
                        </div>

                        <p className="text-sm font-medium text-foreground">
                          {note.progressNotes || note.observation}
                        </p>

                        {isRevealed && (
                          <div className="pt-3 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="type-caption font-semibold text-secondary-foreground block">
                                Hasil Observasi Lengkap
                              </span>
                              <p className="text-foreground mt-1 leading-relaxed">
                                {note.observation}
                              </p>
                            </div>
                            <div>
                              <span className="type-caption font-semibold text-secondary-foreground block">
                                Rencana Tindak Lanjut Pendampingan
                              </span>
                              <p className="text-foreground mt-1 leading-relaxed">
                                {note.followUp || 'Lanjutkan pendampingan berkala pada sesi Sabtu berikutnya.'}
                              </p>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {/* 1. REGISTRATION VERIFICATION DIALOG (UI-6 Section 23) */}
      <Dialog
        open={verifyModalOpen}
        onClose={() => {
          setVerifyModalOpen(false);
          setVerifyError('');
        }}
        size="md"
        title="Verifikasi Pendaftaran Peserta"
        description={`Periksa kesiapan data pendaftaran ${student.fullName} (${student.registrationNumber}) sebelum melanjutkan ke tahap penempatan kelas.`}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setVerifyModalOpen(false);
                setVerifyError('');
              }}
            >
              Batal
            </Button>
            <Button
              variant={verifyDecision === 'REJECTED' ? 'destructive' : 'primary'}
              size="sm"
              type="submit"
              form="student-verification-form"
            >
              {verifyDecision === 'VERIFIED'
                ? 'Setujui verifikasi'
                : verifyDecision === 'WAITLIST'
                ? 'Simpan ke daftar tunggu'
                : verifyDecision === 'PENDING_VERIFICATION'
                ? 'Tandai menunggu kelengkapan'
                : 'Tolak pendaftaran'}
            </Button>
          </>
        }
      >
        <form
          id="student-verification-form"
          onSubmit={handleVerificationSubmit}
          noValidate
          className="space-y-5"
        >
          <div className="rounded-control bg-surface-subtle/60 border border-border px-4">
            <ReviewSection
              title="Ringkasan Data Pendaftar"
              items={[
                {
                  label: 'Nama & panggilan',
                  value: `${student.fullName} (${student.nickname})`,
                },
                {
                  label: 'Jenjang pendidikan',
                  value: GRADE_LABELS[student.gradeLevel],
                },
                {
                  label: 'Domisili',
                  value: `Kelurahan ${student.kelurahan}${
                    student.isRaalResident ? ' · Anak Asuh RAAL' : ''
                  }`,
                },
                {
                  label: 'Orang tua / wali',
                  value: `${student.guardian.fullName} (${
                    RELATIONSHIP_LABELS[student.guardian.relationship]
                  })`,
                },
                {
                  label: 'Persetujuan data & media',
                  value: studentConsent
                    ? `Data: ${
                        studentConsent.personalDataConsent === 'GRANTED'
                          ? 'Disetujui'
                          : 'Belum'
                      } · Foto publik: ${
                        studentConsent.photoVideoPublicConsent === 'GRANTED'
                          ? 'Diizinkan'
                          : 'Internal saja'
                      }`
                    : 'Tercatat saat pendaftaran',
                  fullWidth: true,
                },
              ]}
            />
          </div>

          <RadioGroup
            name="verification-decision"
            label="Keputusan verifikasi pendaftaran"
            value={verifyDecision}
            onChange={(val) => {
              setVerifyDecision(
                val as
                  | 'VERIFIED'
                  | 'WAITLIST'
                  | 'PENDING_VERIFICATION'
                  | 'REJECTED'
              );
              setVerifyError('');
            }}
            options={[
              {
                value: 'VERIFIED',
                label: 'Setujui verifikasi (Siap ditempatkan ke kelas)',
                description:
                  'Data peserta dan wali telah lengkap. Peserta dapat langsung ditempatkan pada rombongan belajar Sabtu.',
              },
              {
                value: 'WAITLIST',
                label: 'Masukkan ke daftar tunggu (Waitlist)',
                description:
                  'Data pendaftaran memenuhi syarat, namun kapasitas rombongan belajar jenjang terkait sedang penuh.',
              },
              {
                value: 'PENDING_VERIFICATION',
                label: 'Menunggu konfirmasi ulang orang tua / wali',
                description:
                  'Masih terdapat informasi jadwal atau data wali yang perlu dikonfirmasi lebih lanjut.',
              },
              {
                value: 'REJECTED',
                label: 'Tolak pendaftaran',
                description:
                  'Pendaftaran tidak dapat dilanjutkan (misalnya di luar cakupan layanan). Wajib menyertakan alasan.',
              },
            ]}
          />

          <Textarea
            label={
              verifyDecision === 'REJECTED'
                ? 'Alasan penolakan pendaftaran'
                : 'Catatan verifikasi atau kebutuhan belajar (Opsional)'
            }
            required={verifyDecision === 'REJECTED'}
            rows={2}
            value={verifyNote}
            onChange={(e) => {
              setVerifyNote(e.target.value);
              if (verifyError) setVerifyError('');
            }}
            error={verifyError}
            placeholder={
              verifyDecision === 'REJECTED'
                ? 'Tuliskan alasan penolakan secara jelas...'
                : 'Catatan hasil konfirmasi dengan wali atau rekomendasi kelas...'
            }
          />
        </form>
      </Dialog>

      {/* 2. CLASS PLACEMENT DIALOG (UI-6 Section 24) */}
      <Dialog
        open={assignClassModalOpen}
        onClose={() => setAssignClassModalOpen(false)}
        size="md"
        title="Penempatan Rombongan Belajar"
        description={`Pilih kelas sesi Sabtu yang sesuai untuk ${student.fullName} (Jenjang: ${
          GRADE_LABELS[student.gradeLevel]
        }).`}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAssignClassModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange('ACTIVE', selectedClassId)}
            >
              Simpan & aktifkan peserta
            </Button>
          </>
        }
      >
        <fieldset className="space-y-2.5">
          <legend className="type-label text-foreground mb-1">
            Daftar Rombongan Belajar Sabtu (15.00 – 17.15 WIB)
          </legend>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {classes.map((cls) => {
              const isSelected = selectedClassId === cls.id;
              const teacher = teachers.find((t) => t.id === cls.mainTeacherId);
              const isRecommended =
                (student.gradeLevel === 'TK' && cls.category === 'TK') ||
                (student.gradeLevel.startsWith('SD_') &&
                  cls.category === 'SD') ||
                (student.gradeLevel.startsWith('SMP_') &&
                  cls.category === 'SMP');

              return (
                <label
                  key={cls.id}
                  className={`flex items-start justify-between gap-3 p-3.5 rounded-control border cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary-soft/50'
                      : 'border-border bg-surface hover:bg-surface-subtle/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="detail-class-placement"
                      value={cls.id}
                      checked={isSelected}
                      onChange={() => setSelectedClassId(cls.id)}
                      className="mt-1 accent-primary"
                    />
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {cls.name}
                        </span>
                        {isRecommended && (
                          <Badge variant="primary" size="sm">
                            Sesuai jenjang
                          </Badge>
                        )}
                      </div>
                      <p className="type-caption text-secondary-foreground">
                        {cls.roomName} · Wali Kelas:{' '}
                        {teacher?.fullName || 'Tim Guru'}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      cls.enrolledCount >= cls.capacity ? 'warning' : 'neutral'
                    }
                    size="sm"
                  >
                    {cls.enrolledCount}/{cls.capacity} anak
                  </Badge>
                </label>
              );
            })}
          </div>
        </fieldset>
      </Dialog>

      {/* 3. CONSEQUENTIAL STATUS CONFIRMATION DIALOG (UI-6 Section 25) */}
      <Dialog
        open={Boolean(consequentialAction)}
        onClose={() => setConsequentialAction(null)}
        size="sm"
        title={
          consequentialAction === 'CANCELLED'
            ? `Nonaktifkan Kepesertaan ${student.nickname}?`
            : `Pindahkan ${student.nickname} ke Daftar Tunggu?`
        }
        description={
          consequentialAction === 'CANCELLED'
            ? `Status ${student.fullName} akan diubah menjadi Dibatalkan (Nonaktif). Riwayat kehadiran dan catatan perkembangan sebelumnya tetap tersimpan, namun peserta tidak lagi muncul pada daftar presensi kelas aktif.`
            : `Status ${student.fullName} akan dipindahkan ke Daftar Tunggu (Waitlist) hingga tersedia kuota pada rombongan belajar yang sesuai.`
        }
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConsequentialAction(null)}
            >
              Kembali
            </Button>
            {consequentialAction && (
              <Button
                variant={
                  consequentialAction === 'CANCELLED'
                    ? 'destructive'
                    : 'primary'
                }
                size="sm"
                onClick={() =>
                  handleStatusChange(
                    consequentialAction,
                    undefined,
                    consequentialNote.trim() || undefined
                  )
                }
              >
                {consequentialAction === 'CANCELLED'
                  ? 'Ya, nonaktifkan peserta'
                  : 'Ya, pindahkan ke daftar tunggu'}
              </Button>
            )}
          </>
        }
      >
        <Textarea
          label="Catatan perubahan status (Opsional)"
          rows={2}
          value={consequentialNote}
          onChange={(e) => setConsequentialNote(e.target.value)}
          placeholder="Contoh: Pindah domisili keluar Lawang, atau menunggu semester depan..."
        />
      </Dialog>

      {/* 4. INTERNAL EDIT PARTICIPANT & GUARDIAN PROFILE DIALOG (UI-6 Section 22) */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        size="lg"
        title={`Perbarui Data Peserta — ${student.fullName}`}
        description="Perubahan akan langsung memperbarui biodata peserta dan dicatat dalam log audit internal."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="internal-edit-student-form"
            >
              Simpan perubahan
            </Button>
          </>
        }
      >
        <form
          id="internal-edit-student-form"
          onSubmit={handleEditStudentSubmit}
          noValidate
          className="space-y-6"
        >
          <FormSection title="Identitas & Pendidikan Peserta">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama lengkap peserta"
                required
                value={editFullName}
                onChange={(e) => {
                  setEditFullName(e.target.value);
                  if (editErrors.fullName) {
                    setEditErrors((prev) => ({ ...prev, fullName: '' }));
                  }
                }}
                error={editErrors.fullName}
              />
              <Input
                label="Nama panggilan"
                required
                value={editNickname}
                onChange={(e) => {
                  setEditNickname(e.target.value);
                  if (editErrors.nickname) {
                    setEditErrors((prev) => ({ ...prev, nickname: '' }));
                  }
                }}
                error={editErrors.nickname}
              />
              <Input
                label="Tanggal lahir"
                type="date"
                required
                value={editDob}
                onChange={(e) => {
                  setEditDob(e.target.value);
                  if (editErrors.dob) {
                    setEditErrors((prev) => ({ ...prev, dob: '' }));
                  }
                }}
                error={editErrors.dob}
              />
              <Select
                label="Jenis kelamin"
                required
                value={editGender}
                onChange={(e) => setEditGender(e.target.value as 'L' | 'P')}
                options={[
                  { value: 'L', label: 'Laki-laki' },
                  { value: 'P', label: 'Perempuan' },
                ]}
              />
              <Input
                label="Tempat lahir (Opsional)"
                value={editPob}
                onChange={(e) => setEditPob(e.target.value)}
              />
              <Select
                label="Jenjang pendidikan saat ini"
                required
                value={editGradeLevel}
                onChange={(e) =>
                  setEditGradeLevel(e.target.value as Student['gradeLevel'])
                }
                options={Object.entries(GRADE_LABELS).map(([val, label]) => ({
                  value: val,
                  label,
                }))}
              />
              <Select
                label="Wilayah domisili"
                required
                value={editKelurahan}
                onChange={(e) =>
                  setEditKelurahan(
                    e.target.value as 'Kalirejo' | 'Lawang' | 'Lainnya'
                  )
                }
                options={[
                  { value: 'Kalirejo', label: 'Kelurahan Kalirejo' },
                  { value: 'Lawang', label: 'Kelurahan Lawang' },
                  { value: 'Lainnya', label: 'Sekitar Lawang lainnya' },
                ]}
              />
              <Input
                label="Alamat tempat tinggal (Opsional)"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>

            <Checkbox
              checked={editIsRaal}
              onChange={(e) => setEditIsRaal(e.target.checked)}
              label="Peserta merupakan anak asuh yang tinggal di Asrama RAAL Griya Asih"
            />

            <Textarea
              label="Catatan kebutuhan belajar / konteks pendampingan (Opsional)"
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </FormSection>

          {canReadGuardian && (
            <FormSection
              divider
              title="Data Orang Tua / Wali"
              description="Perbarui kontak keluarga bila terdapat perubahan nomor WhatsApp atau wali."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nama orang tua / wali"
                  required
                  value={editGuardianName}
                  onChange={(e) => {
                    setEditGuardianName(e.target.value);
                    if (editErrors.guardianName) {
                      setEditErrors((prev) => ({
                        ...prev,
                        guardianName: '',
                      }));
                    }
                  }}
                  error={editErrors.guardianName}
                />
                <Select
                  label="Hubungan dengan peserta"
                  required
                  value={editGuardianRel}
                  onChange={(e) =>
                    setEditGuardianRel(
                      e.target.value as Student['guardian']['relationship']
                    )
                  }
                  options={Object.entries(RELATIONSHIP_LABELS).map(
                    ([val, label]) => ({
                      value: val,
                      label,
                    })
                  )}
                />
                <Input
                  label="Nomor WhatsApp aktif"
                  type="tel"
                  required
                  value={editGuardianPhone}
                  onChange={(e) => {
                    setEditGuardianPhone(e.target.value);
                    if (editErrors.guardianPhone) {
                      setEditErrors((prev) => ({
                        ...prev,
                        guardianPhone: '',
                      }));
                    }
                  }}
                  error={editErrors.guardianPhone}
                />
                <Input
                  label="Pekerjaan orang tua / wali (Opsional)"
                  value={editGuardianOccupation}
                  onChange={(e) => setEditGuardianOccupation(e.target.value)}
                />
              </div>
            </FormSection>
          )}
        </form>
      </Dialog>

      {/* 5. ADD DEVELOPMENT NOTE DIALOG */}
      <Dialog
        open={addNoteModalOpen}
        onClose={() => setAddNoteModalOpen(false)}
        size="md"
        title={`Catatan Perkembangan — ${student.fullName}`}
        description="Rekaman ini diklasifikasikan sebagai CONFIDENTIAL dan hanya dapat diakses oleh pendamping yang berwenang."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAddNoteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="student-detail-add-note-form"
            >
              Simpan catatan
            </Button>
          </>
        }
      >
        <form
          id="student-detail-add-note-form"
          onSubmit={handleAddDevelopmentNote}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal observasi"
              type="date"
              required
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
            />
            <Select
              label="Aspek perkembangan"
              required
              value={noteCategory}
              onChange={(e) =>
                setNoteCategory(
                  e.target.value as StudentDevelopmentNote['category']
                )
              }
              options={Object.entries(CATEGORY_LABELS).map(([val, label]) => ({
                value: val,
                label,
              }))}
            />
          </div>

          <Input
            label="Ringkasan kemajuan singkat"
            required
            value={noteProgress}
            onChange={(e) => setNoteProgress(e.target.value)}
            placeholder="Contoh: Kemandirian membaca meningkat pesat"
          />

          <Textarea
            label="Uraian observasi lengkap"
            required
            rows={3}
            value={noteObservation}
            onChange={(e) => setNoteObservation(e.target.value)}
            placeholder="Tuliskan hasil pengamatan selama sesi belajar berlangsung..."
          />

          <Textarea
            label="Rencana tindak lanjut (Opsional)"
            rows={2}
            value={noteFollowUp}
            onChange={(e) => setNoteFollowUp(e.target.value)}
            placeholder="Langkah pendampingan berikutnya..."
          />
        </form>
      </Dialog>
    </div>
  );
};

