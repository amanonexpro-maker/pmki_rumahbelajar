/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { storage } from '../../services/storage.ts';
import { Student } from '../../types/index.ts';
import {
  Badge,
  Button,
  Checkbox,
  Icon,
  Input,
  RadioGroup,
  Select,
  Textarea,
} from '../ui/index.ts';
import {
  FormActions,
  FormSection,
  ReviewSection,
  StepIndicator,
  type StepItem,
} from '../patterns/index.ts';

interface RegistrationFormProps {
  onSuccessRegistered?: (student: Student) => void;
}

const REGISTRATION_STEPS: StepItem[] = [
  { number: 1, label: 'Identitas Peserta', shortLabel: 'Peserta' },
  { number: 2, label: 'Orang Tua / Wali', shortLabel: 'Wali' },
  { number: 3, label: 'Pendidikan', shortLabel: 'Pendidikan' },
  { number: 4, label: 'Persetujuan & Privasi', shortLabel: 'Persetujuan' },
  { number: 5, label: 'Periksa Kembali', shortLabel: 'Periksa' },
];

const GRADE_OPTIONS: { value: Student['gradeLevel']; label: string }[] = [
  { value: 'TK', label: 'TK (A & B) — Pengenalan Huruf & Angka' },
  { value: 'SD_1', label: 'SD Kelas 1' },
  { value: 'SD_2', label: 'SD Kelas 2' },
  { value: 'SD_3', label: 'SD Kelas 3' },
  { value: 'SD_4', label: 'SD Kelas 4' },
  { value: 'SD_5', label: 'SD Kelas 5' },
  { value: 'SD_6', label: 'SD Kelas 6' },
  { value: 'SMP_7', label: 'SMP Kelas 7' },
  { value: 'SMP_8', label: 'SMP Kelas 8' },
];

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

const RELATIONSHIP_OPTIONS: {
  value: Student['guardian']['relationship'];
  label: string;
}[] = [
  { value: 'AYAH', label: 'Ayah kandung' },
  { value: 'IBU', label: 'Ibu kandung' },
  { value: 'WALI', label: 'Wali keluarga' },
  { value: 'PENGASUH_RAAL', label: 'Pengasuh Asrama RAAL Griya Asih' },
  { value: 'LAINNYA', label: 'Kerabat lainnya' },
];

const RELATIONSHIP_LABELS: Record<Student['guardian']['relationship'], string> =
  {
    AYAH: 'Ayah kandung',
    IBU: 'Ibu kandung',
    WALI: 'Wali keluarga',
    PENGASUH_RAAL: 'Pengasuh Asrama RAAL Griya Asih',
    LAINNYA: 'Kerabat lainnya',
  };

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccessRegistered,
}) => {
  const formTopRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredStudent, setRegisteredStudent] = useState<Student | null>(
    null
  );
  const [submittedMediaConsent, setSubmittedMediaConsent] = useState<
    'GRANTED' | 'DENIED'
  >('DENIED');

  // Step 1: Participant State
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [kelurahan, setKelurahan] = useState<'Kalirejo' | 'Lawang' | 'Lainnya'>(
    'Kalirejo'
  );
  const [address, setAddress] = useState('');
  const [isRaalResident, setIsRaalResident] = useState(false);

  // Step 2: Guardian State
  const [guardianName, setGuardianName] = useState('');
  const [relationship, setRelationship] =
    useState<Student['guardian']['relationship']>('IBU');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianOccupation, setGuardianOccupation] = useState('');

  // Step 3: Education State
  const [gradeLevel, setGradeLevel] = useState<Student['gradeLevel']>('SD_1');
  const [notes, setNotes] = useState('');

  // Step 4: Independent Consent State (Never preselected — Section 17)
  const [personalDataConsent, setPersonalDataConsent] = useState(false);
  const [mediaConsentChoice, setMediaConsentChoice] = useState<
    'GRANTED' | 'DENIED' | ''
  >('');

  // Field-level validation errors (Section 11)
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const scrollToFormTop = () => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const goToStep = (targetStep: number) => {
    setErrors({});
    setStep(targetStep);
    scrollToFormTop();
  };

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      nextErrors.fullName = 'Masukkan nama lengkap peserta sesuai identitas.';
    }
    if (!nickname.trim()) {
      nextErrors.nickname =
        'Masukkan nama panggilan sehari-hari untuk sapaan di kelas.';
    }
    if (!dateOfBirth) {
      nextErrors.dateOfBirth = 'Pilih tanggal lahir peserta.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!guardianName.trim()) {
      nextErrors.guardianName = 'Masukkan nama lengkap orang tua atau wali.';
    }
    const cleanPhone = guardianPhone.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      nextErrors.guardianPhone =
        'Masukkan nomor WhatsApp atau telepon yang dapat dihubungi (minimal 9 digit).';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = (): boolean => {
    setErrors({});
    return true;
  };

  // Step 4 Validation
  const validateStep4 = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!personalDataConsent) {
      nextErrors.personalDataConsent =
        'Persetujuan pemrosesan data pendaftaran diperlukan agar pengurus dapat memverifikasi dan menempatkan kelas peserta.';
    }
    if (!mediaConsentChoice) {
      nextErrors.mediaConsentChoice =
        'Pilih salah satu preferensi penggunaan dokumentasi foto/video anak.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && validateStep1()) {
      goToStep(2);
    } else if (step === 2 && validateStep2()) {
      goToStep(3);
    } else if (step === 3 && validateStep3()) {
      goToStep(4);
    } else if (step === 4 && validateStep4()) {
      goToStep(5);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateStep1() || !validateStep2() || !validateStep4()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const isPhotoGranted = mediaConsentChoice === 'GRANTED';
      const resolvedAddress =
        address.trim() || `Kelurahan ${kelurahan}, Lawang`;

      const student = storage.submitPublicRegistration({
        fullName: fullName.trim(),
        nickname: nickname.trim(),
        gender,
        dateOfBirth,
        placeOfBirth: 'Malang', // Deferred detailed birth place to internal verification
        address: resolvedAddress,
        kelurahan,
        gradeLevel,
        isRaalResident,
        guardian: {
          fullName: guardianName.trim(),
          relationship,
          phone: guardianPhone.trim(),
          occupation: guardianOccupation.trim() || '-',
          address: resolvedAddress,
        },
        notes: notes.trim() || undefined,
        personalDataConsent: true,
        photoVideoPublicConsent: isPhotoGranted,
      });

      setSubmittedMediaConsent(isPhotoGranted ? 'GRANTED' : 'DENIED');
      setRegisteredStudent(student);
      setStep(6);
      scrollToFormTop();
      if (onSuccessRegistered) {
        onSuccessRegistered(student);
      }
    } catch {
      setErrors({
        submit:
          'Terjadi kendala saat menyimpan pendaftaran. Silakan periksa koneksi Anda dan coba kembali.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewParticipant = () => {
    setFullName('');
    setNickname('');
    setGender('L');
    setDateOfBirth('');
    setKelurahan('Kalirejo');
    setAddress('');
    setIsRaalResident(false);
    setNotes('');
    setPersonalDataConsent(false);
    setMediaConsentChoice('');
    setRegisteredStudent(null);
    setErrors({});
    goToStep(1);
  };

  return (
    <section
      id="pendaftaran"
      ref={formTopRef}
      className="scroll-mt-24 py-16 sm:py-20 bg-background border-t border-border"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="space-y-2.5 mb-8">
          <Badge variant="primary" size="md">
            Pendaftaran Peserta Didik
          </Badge>
          <h2 className="type-page-title text-foreground">
            Formulir Pendaftaran Rumah Belajar
          </h2>
          <p className="type-body-sm text-secondary-foreground leading-relaxed">
            Terbuka bagi anak-anak jenjang TK, SD (Kelas 1–6), dan SMP (Kelas
            7–8) di wilayah Kalirejo, Lawang, serta anak asuh RAAL Griya Asih.
            Seluruh kegiatan bimbingan belajar diselenggarakan tanpa biaya.
          </p>
        </div>

        {/* STEP 1–5: ACTIVE REGISTRATION FLOW */}
        {step <= 5 && (
          <div className="rounded-card bg-surface border border-border p-5 sm:p-8 space-y-8 shadow-xs">
            <StepIndicator
              steps={REGISTRATION_STEPS}
              currentStep={step}
              onStepClick={(target) => goToStep(target)}
            />

            {errors.submit && (
              <div
                role="alert"
                className="p-4 rounded-control bg-danger-soft border border-danger-border text-danger-foreground text-xs font-medium"
              >
                {errors.submit}
              </div>
            )}

            {/* STEP 1: PESERTA */}
            {step === 1 && (
              <form onSubmit={handleNextStep} noValidate className="space-y-6">
                <FormSection
                  title="Identitas Peserta"
                  description="Masukkan informasi dasar anak yang akan mengikuti kegiatan belajar."
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nama lengkap peserta"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearFieldError('fullName');
                      }}
                      error={errors.fullName}
                      placeholder="Contoh: Samuel Pratama"
                      autoComplete="name"
                    />

                    <Input
                      label="Nama panggilan"
                      required
                      value={nickname}
                      onChange={(e) => {
                        setNickname(e.target.value);
                        clearFieldError('nickname');
                      }}
                      error={errors.nickname}
                      placeholder="Contoh: Samuel"
                      hint="Nama yang digunakan guru untuk menyapa peserta di kelas."
                    />

                    <Input
                      label="Tanggal lahir"
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        clearFieldError('dateOfBirth');
                      }}
                      error={errors.dateOfBirth}
                      autoComplete="bday"
                    />

                    <Select
                      label="Jenis kelamin"
                      required
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                      options={[
                        { value: 'L', label: 'Laki-laki' },
                        { value: 'P', label: 'Perempuan' },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <Select
                      label="Wilayah domisili"
                      required
                      value={kelurahan}
                      onChange={(e) =>
                        setKelurahan(
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
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Contoh: Jl.Sumber Waras RT 03"
                      autoComplete="street-address"
                    />
                  </div>

                  <div className="pt-2">
                    <Checkbox
                      checked={isRaalResident}
                      onChange={(e) => setIsRaalResident(e.target.checked)}
                      label="Peserta merupakan anak asuh yang tinggal di Asrama RAAL Griya Asih"
                      description="Centang pilihan ini bila peserta berdomisili di dalam lingkungan Rumah Asuh Anak & Lansia Griya Asih."
                    />
                  </div>
                </FormSection>

                <FormActions
                  helperText="Langkah 1 dari 5"
                  primaryAction={
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      rightIcon={<Icon icon={ArrowRight} size="sm" />}
                    >
                      Lanjut ke Data Wali
                    </Button>
                  }
                />
              </form>
            )}

            {/* STEP 2: ORANG TUA / WALI */}
            {step === 2 && (
              <form onSubmit={handleNextStep} noValidate className="space-y-6">
                <FormSection
                  title="Data Orang Tua atau Wali"
                  description="Informasi kontak keluarga digunakan khusus oleh pengurus untuk koordinasi jadwal belajar dan kehadiran anak."
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nama orang tua / wali"
                      required
                      value={guardianName}
                      onChange={(e) => {
                        setGuardianName(e.target.value);
                        clearFieldError('guardianName');
                      }}
                      error={errors.guardianName}
                      placeholder="Nama lengkap ayah, ibu, atau wali"
                    />

                    <Select
                      label="Hubungan dengan peserta"
                      required
                      value={relationship}
                      onChange={(e) =>
                        setRelationship(
                          e.target.value as Student['guardian']['relationship']
                        )
                      }
                      options={RELATIONSHIP_OPTIONS}
                    />

                    <Input
                      label="Nomor WhatsApp aktif"
                      type="tel"
                      required
                      value={guardianPhone}
                      onChange={(e) => {
                        setGuardianPhone(e.target.value);
                        clearFieldError('guardianPhone');
                      }}
                      error={errors.guardianPhone}
                      placeholder="Contoh: 0812-3456-7890"
                      hint="Digunakan untuk komunikasi terkait kegiatan Rumah Belajar."
                      autoComplete="tel"
                    />

                    <Input
                      label="Pekerjaan orang tua / wali (Opsional)"
                      value={guardianOccupation}
                      onChange={(e) => setGuardianOccupation(e.target.value)}
                      placeholder="Contoh: Wiraswasta, Karyawan"
                    />
                  </div>
                </FormSection>

                <FormActions
                  secondaryAction={
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      leftIcon={<Icon icon={ArrowLeft} size="sm" />}
                      onClick={() => goToStep(1)}
                    >
                      Kembali
                    </Button>
                  }
                  primaryAction={
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      rightIcon={<Icon icon={ArrowRight} size="sm" />}
                    >
                      Lanjut ke Pendidikan
                    </Button>
                  }
                />
              </form>
            )}

            {/* STEP 3: PENDIDIKAN */}
            {step === 3 && (
              <form onSubmit={handleNextStep} noValidate className="space-y-6">
                <FormSection
                  title="Pendidikan & Kebutuhan Belajar"
                  description="Bantu kami memahami jenjang kelas peserta saat ini agar dapat ditempatkan pada rombongan belajar Sabtu yang tepat."
                >
                  <Select
                    label="Jenjang pendidikan saat ini"
                    required
                    value={gradeLevel}
                    onChange={(e) =>
                      setGradeLevel(e.target.value as Student['gradeLevel'])
                    }
                    options={GRADE_OPTIONS}
                    hint="Penempatan rombongan belajar dan kelompok literasi membaca akan disesuaikan dengan jenjang ini."
                  />

                  <Textarea
                    label="Catatan kebutuhan belajar atau minat anak (Opsional)"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Masih perlu pendampingan membaca lancar, atau ingin memperdalam matematika dasar..."
                    hint="Informasi ini hanya dibaca oleh koordinator dan guru pendamping kelas."
                  />
                </FormSection>

                <FormActions
                  secondaryAction={
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      leftIcon={<Icon icon={ArrowLeft} size="sm" />}
                      onClick={() => goToStep(2)}
                    >
                      Kembali
                    </Button>
                  }
                  primaryAction={
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      rightIcon={<Icon icon={ArrowRight} size="sm" />}
                    >
                      Lanjut ke Persetujuan
                    </Button>
                  }
                />
              </form>
            )}

            {/* STEP 4: PERSETUJUAN & PRIVASI */}
            {step === 4 && (
              <form onSubmit={handleNextStep} noValidate className="space-y-6">
                <FormSection
                  title="Persetujuan Data & Privasi Anak"
                  description="Rumah Belajar Griya Asih menerapkan perlindungan data anak (Child Safeguarding). Izin pemrosesan data belajar dipisahkan dari izin dokumentasi foto/video."
                >
                  {/* Privacy Context Note (Section 18) */}
                  <div className="p-4 rounded-control bg-surface-subtle border border-border flex items-start gap-3">
                    <Icon
                      icon={ShieldCheck}
                      size="md"
                      className="text-primary shrink-0 mt-0.5"
                    />
                    <p className="type-caption text-secondary-foreground leading-relaxed">
                      Data pribadi peserta dan kontak keluarga disimpan secara
                      terbatas (<strong>Confidential</strong>) hanya untuk
                      administrasi pembelajaran, pencatatan kehadiran, dan
                      komunikasi wali.
                    </p>
                  </div>

                  {/* A. Data Processing Consent (Required) */}
                  <div className="p-4 rounded-control bg-surface border border-border">
                    <Checkbox
                      checked={personalDataConsent}
                      onChange={(e) => {
                        setPersonalDataConsent(e.target.checked);
                        clearFieldError('personalDataConsent');
                      }}
                      error={errors.personalDataConsent}
                      label="1. Persetujuan pemrosesan data pendaftaran dan pelayanan belajar (Wajib)"
                      description="Saya menyatakan data yang diisi benar dan menyetujui pengurus Rumah Belajar Griya Asih Lawang menyimpan serta memproses data ini untuk keperluan verifikasi peserta, penempatan kelas, dan presensi belajar."
                    />
                  </div>

                  {/* B. Independent Media Consent (Neutral choices, never preselected) */}
                  <div className="p-4 rounded-control bg-surface border border-border space-y-3">
                    <RadioGroup
                      name="media-consent-choice"
                      label="2. Penggunaan dokumentasi foto/video kegiatan belajar"
                      value={mediaConsentChoice}
                      onChange={(val) => {
                        setMediaConsentChoice(val as 'GRANTED' | 'DENIED');
                        clearFieldError('mediaConsentChoice');
                      }}
                      error={errors.mediaConsentChoice}
                      options={[
                        {
                          value: 'GRANTED',
                          label: 'Izinkan penggunaan untuk publikasi kegiatan',
                          description:
                            'Dokumentasi foto atau video kegiatan belajar bersama anak dapat ditampilkan secara santun pada galeri website atau laporan pelayanan resmi yayasan.',
                        },
                        {
                          value: 'DENIED',
                          label:
                            'Batasi untuk dokumentasi internal (Tidak untuk publikasi umum)',
                          description:
                            'Wajah anak tidak akan dipublikasikan pada galeri terbuka. Pilihan ini sama sekali tidak mengurangi hak anak dalam mengikuti seluruh kegiatan belajar.',
                        },
                      ]}
                    />
                  </div>
                </FormSection>

                <FormActions
                  secondaryAction={
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      leftIcon={<Icon icon={ArrowLeft} size="sm" />}
                      onClick={() => goToStep(3)}
                    >
                      Kembali
                    </Button>
                  }
                  primaryAction={
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      rightIcon={<Icon icon={ArrowRight} size="sm" />}
                    >
                      Periksa Kembali Data
                    </Button>
                  }
                />
              </form>
            )}

            {/* STEP 5: PERIKSA KEMBALI (REVIEW) */}
            {step === 5 && (
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <FormSection
                  title="Periksa Kembali Data Pendaftaran"
                  description="Pastikan seluruh informasi sudah sesuai sebelum mengirimkan formulir pendaftaran."
                >
                  <div className="rounded-control border border-border bg-surface-subtle/40 px-4 sm:px-5 divide-y divide-border">
                    <ReviewSection
                      title="Peserta"
                      onEdit={() => goToStep(1)}
                      items={[
                        { label: 'Nama lengkap', value: fullName },
                        { label: 'Nama panggilan', value: nickname },
                        { label: 'Tanggal lahir', value: dateOfBirth },
                        {
                          label: 'Jenis kelamin',
                          value: gender === 'L' ? 'Laki-laki' : 'Perempuan',
                        },
                        {
                          label: 'Wilayah domisili',
                          value: `Kelurahan ${kelurahan}`,
                        },
                        {
                          label: 'Status mukim RAAL',
                          value: isRaalResident
                            ? 'Anak Asuh Asrama RAAL'
                            : 'Peserta masyarakat umum',
                        },
                        ...(address.trim()
                          ? [
                              {
                                label: 'Alamat tempat tinggal',
                                value: address,
                                fullWidth: true,
                              },
                            ]
                          : []),
                      ]}
                    />

                    <ReviewSection
                      title="Orang Tua / Wali"
                      onEdit={() => goToStep(2)}
                      items={[
                        {
                          label: 'Nama orang tua / wali',
                          value: guardianName,
                        },
                        {
                          label: 'Hubungan dengan peserta',
                          value: RELATIONSHIP_LABELS[relationship],
                        },
                        {
                          label: 'Nomor WhatsApp aktif',
                          value: guardianPhone,
                        },
                        {
                          label: 'Pekerjaan',
                          value: guardianOccupation.trim() || 'Tidak diisi',
                        },
                      ]}
                    />

                    <ReviewSection
                      title="Pendidikan"
                      onEdit={() => goToStep(3)}
                      items={[
                        {
                          label: 'Jenjang pendidikan saat ini',
                          value: GRADE_LABELS[gradeLevel],
                        },
                        {
                          label: 'Catatan kebutuhan belajar',
                          value: notes.trim() || 'Tidak ada catatan khusus',
                          fullWidth: true,
                        },
                      ]}
                    />

                    <ReviewSection
                      title="Persetujuan & Privasi"
                      onEdit={() => goToStep(4)}
                      items={[
                        {
                          label: 'Pemrosesan data pendaftaran & belajar',
                          value: 'Disetujui oleh orang tua / wali',
                        },
                        {
                          label: 'Penggunaan dokumentasi foto/video',
                          value:
                            mediaConsentChoice === 'GRANTED'
                              ? 'Diizinkan untuk publikasi kegiatan resmi'
                              : 'Dibatasi hanya untuk dokumentasi internal',
                        },
                      ]}
                    />
                  </div>
                </FormSection>

                <FormActions
                  secondaryAction={
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      leftIcon={<Icon icon={ArrowLeft} size="sm" />}
                      onClick={() => goToStep(4)}
                      disabled={isSubmitting}
                    >
                      Kembali
                    </Button>
                  }
                  primaryAction={
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={isSubmitting}
                      leftIcon={<Icon icon={CheckCircle2} size="sm" />}
                    >
                      Kirim pendaftaran
                    </Button>
                  }
                />
              </form>
            )}
          </div>
        )}

        {/* STEP 6: COMPLETION / SUCCESS STATE (Section 21) */}
        {step === 6 && registeredStudent && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-card bg-surface border border-border p-6 sm:p-8 space-y-6 shadow-xs"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-pill bg-success-soft text-success border border-success-border flex items-center justify-center shrink-0">
                <Icon icon={CheckCircle2} size="lg" />
              </div>

              <div className="space-y-1">
                <Badge variant="success" size="sm">
                  Pendaftaran berhasil dikirim
                </Badge>
                <h3 className="type-h2 text-foreground">
                  Data pendaftaran {registeredStudent.nickname} telah diterima
                </h3>
                <p className="type-body-sm text-secondary-foreground leading-relaxed">
                  Data peserta telah tercatat di Rumah Belajar Griya Asih Lawang
                  dan akan melalui proses verifikasi serta penempatan kelas oleh
                  pengurus.
                </p>
              </div>
            </div>

            {/* Registration Summary */}
            <dl className="rounded-control bg-surface-subtle border border-border p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="type-caption text-secondary-foreground">
                  Nomor pendaftaran
                </dt>
                <dd className="font-mono font-bold text-primary text-base mt-0.5">
                  {registeredStudent.registrationNumber}
                </dd>
              </div>
              <div>
                <dt className="type-caption text-secondary-foreground">
                  Status saat ini
                </dt>
                <dd className="mt-1">
                  <Badge variant="warning" size="sm" dot>
                    Pendaftaran masuk (Menunggu verifikasi)
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="type-caption text-secondary-foreground">
                  Nama peserta & jenjang
                </dt>
                <dd className="font-medium text-foreground mt-0.5">
                  {registeredStudent.fullName} ·{' '}
                  {GRADE_LABELS[registeredStudent.gradeLevel]}
                </dd>
              </div>
              <div>
                <dt className="type-caption text-secondary-foreground">
                  Preferensi dokumentasi visual
                </dt>
                <dd className="font-medium text-foreground mt-0.5">
                  {submittedMediaConsent === 'GRANTED'
                    ? 'Diizinkan untuk publikasi resmi'
                    : 'Dibatasi untuk internal saja'}
                </dd>
              </div>
            </dl>

            {/* Next Steps */}
            <div className="space-y-2 pt-1">
              <h4 className="text-sm font-semibold text-foreground">
                Langkah selanjutnya
              </h4>
              <ul className="space-y-1.5 type-body-sm text-secondary-foreground list-disc pl-5">
                <li>
                  Pengurus Rumah Belajar (Ms. Evi atau Ms. Lilian) akan
                  memeriksa data pendaftaran dan menghubungi nomor WhatsApp wali
                  untuk konfirmasi kelas.
                </li>
                <li>
                  Kegiatan belajar dilaksanakan setiap hari{' '}
                  <strong className="text-foreground">
                    Sabtu pukul 15.00 – 17.15 WIB
                  </strong>{' '}
                  di Rumah Belajar Griya Asih Lawang.
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleResetForNewParticipant}
              >
                Daftarkan peserta lainnya
              </Button>

              <a
                href={`https://wa.me/628123235318?text=Halo%20Pengurus%20Rumah%20Belajar%20Griya%20Asih,%20saya%20telah%20mengirimkan%20pendaftaran%20untuk%20${encodeURIComponent(
                  registeredStudent.fullName
                )}%20dengan%20nomor%20pendaftaran%20${
                  registeredStudent.registrationNumber
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors focus-ring"
              >
                <span>Konfirmasi via WhatsApp Pengurus</span>
                <Icon icon={ArrowRight} size="sm" />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
