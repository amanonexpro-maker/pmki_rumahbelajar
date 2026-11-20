"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CloudOff, RotateCcw, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/compositions";
import {
  FormSection,
  ReviewSection,
  StepIndicator,
  type StepItem,
} from "@/components/patterns";
import { Badge, Button, Icon, Input, Textarea } from "@/components/ui";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import { submitPublicRegistrationAction } from "../actions/student-actions";
import {
  clearRegistrationDraft,
  enqueueOfflineRegistration,
  loadRegistrationDraft,
  saveRegistrationDraft,
  useOfflineRegistrationSync,
} from "../hooks/use-registration-offline";
import {
  EDUCATION_LEVEL_LABELS,
  GUARDIAN_RELATIONSHIP_LABELS,
  type EducationLevelCode,
  type GuardianRelationshipCode,
} from "../types/student-types";
import {
  EDUCATION_LEVEL_VALUES,
  GUARDIAN_RELATIONSHIP_VALUES,
  publicRegistrationSchema,
  type PublicRegistrationInput,
} from "../validators/student-validator";

const WIZARD_STEPS: StepItem[] = [
  { number: 1, label: "Identitas peserta didik", shortLabel: "Peserta" },
  { number: 2, label: "Orang tua / wali", shortLabel: "Wali" },
  { number: 3, label: "Pendidikan", shortLabel: "Pendidikan" },
  { number: 4, label: "Persetujuan & privasi", shortLabel: "Persetujuan" },
  { number: 5, label: "Periksa kembali", shortLabel: "Periksa" },
];

export interface PublicRegistrationWizardProps {
  onSuccess?: (result: {
    registrationNumber: string;
    fullName: string;
  }) => void;
  embedded?: boolean;
}

export function PublicRegistrationWizard({
  onSuccess,
  embedded = false,
}: PublicRegistrationWizardProps) {
  const [step, setStep] = React.useState(1);
  const [draftRestored, setDraftRestored] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submissionOutcome, setSubmissionOutcome] = React.useState<
    | {
        mode: "ONLINE_CONFIRMED";
        registrationNumber: string;
        fullName: string;
        photoVideoConsent: "GRANTED" | "DENIED";
      }
    | {
        mode: "OFFLINE_QUEUED";
        operationId: string;
        fullName: string;
        photoVideoConsent: "GRANTED" | "DENIED";
      }
    | null
  >(null);

  const form = useForm<PublicRegistrationInput>({
    resolver: zodResolver(publicRegistrationSchema),
    defaultValues: {
      fullName: "",
      nickname: "",
      gender: "L",
      birthDate: "",
      district: "Kalirejo",
      address: "",
      isRaalResident: false,
      guardianFullName: "",
      guardianRelationship: "IBU",
      guardianPhone: "",
      guardianOccupation: "",
      educationLevel: "SD_1",
      schoolName: "",
      notes: "",
      personalDataConsent: undefined as unknown as true,
      photoVideoConsent: undefined as unknown as "GRANTED" | "DENIED",
    },
    mode: "onTouched",
  });

  const {
    register,
    control,
    trigger,
    reset,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const watchedValues = useWatch({ control });

  const { refreshPendingCount } = useOfflineRegistrationSync((results) => {
    const first = results[0];
    if (first && submissionOutcome?.mode === "OFFLINE_QUEUED") {
      setSubmissionOutcome({
        mode: "ONLINE_CONFIRMED",
        registrationNumber: first.registrationNumber,
        fullName: first.fullName,
        photoVideoConsent: submissionOutcome.photoVideoConsent,
      });
    }
  });

  // Recover draft from IndexedDB on initial mount
  React.useEffect(() => {
    let active = true;
    void (async () => {
      const saved = await loadRegistrationDraft();
      if (active && saved && saved.fullName) {
        reset({
          ...form.getValues(),
          ...saved,
        });
        setDraftRestored(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [form, reset]);

  // Persist draft automatically to IndexedDB as user types
  React.useEffect(() => {
    if (submissionOutcome) return;
    if (!watchedValues.fullName && !watchedValues.guardianFullName) return;
    const timer = window.setTimeout(() => {
      void saveRegistrationDraft(watchedValues);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [watchedValues, submissionOutcome]);

  async function handleNextStep() {
    setSubmitError(null);
    let valid = false;
    if (step === 1) {
      valid = await trigger([
        "fullName",
        "nickname",
        "gender",
        "birthDate",
        "district",
        "address",
        "isRaalResident",
      ]);
    } else if (step === 2) {
      valid = await trigger([
        "guardianFullName",
        "guardianRelationship",
        "guardianPhone",
        "guardianOccupation",
      ]);
    } else if (step === 3) {
      valid = await trigger(["educationLevel", "schoolName", "notes"]);
    } else if (step === 4) {
      valid = await trigger(["personalDataConsent", "photoVideoConsent"]);
    }

    if (valid) {
      setStep((s) => Math.min(5, s + 1));
    }
  }

  async function onSubmit(data: PublicRegistrationInput) {
    setSubmitError(null);

    const isOffline =
      typeof navigator !== "undefined" && navigator.onLine === false;

    if (isOffline) {
      const queued = await enqueueOfflineRegistration(data);
      await refreshPendingCount();
      setSubmissionOutcome({
        mode: "OFFLINE_QUEUED",
        operationId: queued.operationId,
        fullName: data.fullName,
        photoVideoConsent: data.photoVideoConsent,
      });
      return;
    }

    try {
      const result = await submitPublicRegistrationAction(data);
      if (!result.success) {
        setSubmitError(result.error.message);
        return;
      }

      await clearRegistrationDraft();
      setSubmissionOutcome({
        mode: "ONLINE_CONFIRMED",
        registrationNumber: result.data.registrationNumber,
        fullName: result.data.fullName,
        photoVideoConsent: data.photoVideoConsent,
      });
      onSuccess?.({
        registrationNumber: result.data.registrationNumber,
        fullName: result.data.fullName,
      });
    } catch {
      // Network dropped mid-request -> enqueue offline with honest status
      const queued = await enqueueOfflineRegistration(data);
      await refreshPendingCount();
      setSubmissionOutcome({
        mode: "OFFLINE_QUEUED",
        operationId: queued.operationId,
        fullName: data.fullName,
        photoVideoConsent: data.photoVideoConsent,
      });
    }
  }

  async function handleResetNewRegistration() {
    await clearRegistrationDraft();
    setDraftRestored(false);
    setSubmissionOutcome(null);
    setSubmitError(null);
    reset({
      fullName: "",
      nickname: "",
      gender: "L",
      birthDate: "",
      district: "Kalirejo",
      address: "",
      isRaalResident: false,
      guardianFullName: "",
      guardianRelationship: "IBU",
      guardianPhone: "",
      guardianOccupation: "",
      educationLevel: "SD_1",
      schoolName: "",
      notes: "",
      personalDataConsent: undefined as unknown as true,
      photoVideoConsent: undefined as unknown as "GRANTED" | "DENIED",
    });
    setStep(1);
  }

  if (submissionOutcome) {
    const isQueued = submissionOutcome.mode === "OFFLINE_QUEUED";
    return (
      <div className="rounded-card border border-border bg-surface p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div
            className={
              isQueued
                ? "h-12 w-12 rounded-pill bg-warning-soft text-warning flex items-center justify-center shrink-0"
                : "h-12 w-12 rounded-pill bg-success-soft text-success flex items-center justify-center shrink-0"
            }
          >
            <Icon icon={isQueued ? CloudOff : CheckCircle2} size="lg" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                domain="sync"
                status={isQueued ? "LOCAL_SAVED" : "SYNCED"}
              />
              {!isQueued && (
                <StatusBadge domain="registration" status="SUBMITTED" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {isQueued
                ? "Pendaftaran disimpan lokal. Akan dikirim saat online."
                : "Pendaftaran berhasil dikirim"}
            </h3>
            <p className="text-sm text-secondary-foreground leading-relaxed">
              {isQueued
                ? `Data pendaftaran ${submissionOutcome.fullName} telah diamankan di perangkat ini dan akan otomatis dikirim ke server begitu koneksi internet kembali tersedia.`
                : `Terima kasih. Data pendaftaran ${submissionOutcome.fullName} telah diterima oleh pengurus Rumah Belajar Griya Asih Lawang untuk tahap verifikasi.`}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-control border border-border bg-surface-subtle/50 p-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">
              {isQueued ? "Kode antrean lokal" : "Nomor pendaftaran"}
            </dt>
            <dd className="font-mono font-semibold text-foreground mt-0.5">
              {isQueued
                ? submissionOutcome.operationId.slice(0, 13).toUpperCase()
                : submissionOutcome.registrationNumber}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              Persetujuan dokumentasi foto & video
            </dt>
            <dd className="mt-1">
              <StatusBadge
                domain="consent"
                status={submissionOutcome.photoVideoConsent}
              />
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleResetNewRegistration}
          >
            Daftarkan peserta didik lain
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "space-y-6"
          : "rounded-card border border-border bg-surface p-5 sm:p-8 space-y-6 shadow-xs"
      }
    >
      {!embedded && (
        <div className="space-y-2">
          <Badge variant="primary" size="md">
            Mari belajar dan tumbuh bersama
          </Badge>
          <h2 className="text-xl font-semibold text-foreground">
            Formulir pendaftaran peserta didik baru
          </h2>
          <p className="text-sm text-secondary-foreground leading-relaxed">
            Terbuka bagi anak-anak jenjang TK, SD (Kelas 1–6), dan SMP (Kelas
            7–8) di wilayah Kalirejo, Lawang, serta anak asuh RAAL Griya Asih.
          </p>
        </div>
      )}

      {draftRestored && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-info/30 bg-info-soft px-4 py-2.5 text-xs text-foreground"
        >
          <span>
            Draft pendaftaran sebelumnya dipulihkan secara otomatis dari
            perangkat ini.
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetNewRegistration}
            leftIcon={<Icon icon={RotateCcw} size="xs" />}
          >
            Mulai dari awal
          </Button>
        </div>
      )}

      <StepIndicator
        steps={WIZARD_STEPS}
        currentStep={step}
        onStepClick={(target) => {
          if (target < step) setStep(target);
        }}
      />

      {submitError && (
        <div
          role="alert"
          className="rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {step === 1 && (
          <FormSection
            title="Identitas peserta didik"
            description="Masukkan informasi dasar peserta didik yang akan mengikuti kegiatan belajar."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-fullName"
                  className="block text-sm font-medium text-foreground"
                >
                  Nama lengkap peserta didik *
                </label>
                <Input
                  id="reg-fullName"
                  placeholder="Contoh: Samuel Pratama"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-xs text-danger">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reg-nickname"
                  className="block text-sm font-medium text-foreground"
                >
                  Nama panggilan *
                </label>
                <Input
                  id="reg-nickname"
                  placeholder="Contoh: Sam"
                  {...register("nickname")}
                />
                {errors.nickname && (
                  <p className="text-xs text-danger">
                    {errors.nickname.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reg-birthDate"
                  className="block text-sm font-medium text-foreground"
                >
                  Tanggal lahir *
                </label>
                <Input
                  id="reg-birthDate"
                  type="date"
                  {...register("birthDate")}
                />
                {errors.birthDate && (
                  <p className="text-xs text-danger">
                    {errors.birthDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reg-gender"
                  className="block text-sm font-medium text-foreground"
                >
                  Jenis kelamin *
                </label>
                <select
                  id="reg-gender"
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-ring"
                  {...register("gender")}
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reg-district"
                  className="block text-sm font-medium text-foreground"
                >
                  Wilayah tempat tinggal *
                </label>
                <select
                  id="reg-district"
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-ring"
                  {...register("district")}
                >
                  <option value="Kalirejo">Kelurahan Kalirejo</option>
                  <option value="Lawang">Kecamatan Lawang</option>
                  <option value="Lainnya">Wilayah lainnya</option>
                </select>
              </div>

              <div className="space-y-1.5 flex items-end pb-1">
                <label className="inline-flex items-center gap-2.5 text-sm text-foreground cursor-pointer min-h-11">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-xs border-border text-primary focus-ring"
                    {...register("isRaalResident")}
                  />
                  <span>Anak asuh Asrama RAAL Griya Asih</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-address"
                className="block text-sm font-medium text-foreground"
              >
                Alamat tempat tinggal (opsional)
              </label>
              <Input
                id="reg-address"
                placeholder="Nama jalan, RT/RW, atau keterangan tempat tinggal"
                {...register("address")}
              />
            </div>
          </FormSection>
        )}

        {step === 2 && (
          <FormSection
            title="Data orang tua atau wali"
            description="Data kontak wali bersifat rahasia dan hanya digunakan untuk komunikasi resmi pelayanan Rumah Belajar."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-guardianFullName"
                  className="block text-sm font-medium text-foreground"
                >
                  Nama lengkap orang tua / wali *
                </label>
                <Input
                  id="reg-guardianFullName"
                  placeholder="Contoh: Ibu Maria Lestari"
                  {...register("guardianFullName")}
                />
                {errors.guardianFullName && (
                  <p className="text-xs text-danger">
                    {errors.guardianFullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reg-guardianRelationship"
                  className="block text-sm font-medium text-foreground"
                >
                  Hubungan dengan peserta didik *
                </label>
                <select
                  id="reg-guardianRelationship"
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-ring"
                  {...register("guardianRelationship")}
                >
                  {GUARDIAN_RELATIONSHIP_VALUES.map((code) => (
                    <option key={code} value={code}>
                      {GUARDIAN_RELATIONSHIP_LABELS[code]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reg-guardianPhone"
                  className="block text-sm font-medium text-foreground"
                >
                  Nomor WhatsApp / telepon aktif *
                </label>
                <Input
                  id="reg-guardianPhone"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  {...register("guardianPhone")}
                />
                {errors.guardianPhone && (
                  <p className="text-xs text-danger">
                    {errors.guardianPhone.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reg-guardianOccupation"
                  className="block text-sm font-medium text-foreground"
                >
                  Pekerjaan (opsional)
                </label>
                <Input
                  id="reg-guardianOccupation"
                  placeholder="Contoh: Wiraswasta"
                  {...register("guardianOccupation")}
                />
              </div>
            </div>
          </FormSection>
        )}

        {step === 3 && (
          <FormSection
            title="Informasi pendidikan"
            description="Membantu pengurus menempatkan peserta didik ke kelas bimbingan yang sesuai."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-educationLevel"
                  className="block text-sm font-medium text-foreground"
                >
                  Jenjang kelas saat ini *
                </label>
                <select
                  id="reg-educationLevel"
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-ring"
                  {...register("educationLevel")}
                >
                  {EDUCATION_LEVEL_VALUES.map((code) => (
                    <option key={code} value={code}>
                      {EDUCATION_LEVEL_LABELS[code]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reg-schoolName"
                  className="block text-sm font-medium text-foreground"
                >
                  Asal sekolah (opsional)
                </label>
                <Input
                  id="reg-schoolName"
                  placeholder="Contoh: SDN Kalirejo 1"
                  {...register("schoolName")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-notes"
                className="block text-sm font-medium text-foreground"
              >
                Catatan pendampingan belajar (opsional)
              </label>
              <Textarea
                id="reg-notes"
                rows={3}
                placeholder="Misalnya: perlu pendampingan khusus membaca atau berhitung dasar."
                {...register("notes")}
              />
            </div>
          </FormSection>
        )}

        {step === 4 && (
          <FormSection
            title="Persetujuan data & privasi anak"
            description="Kami menghormati martabat dan privasi setiap peserta didik. Persetujuan data dan dokumentasi dipisahkan secara tegas."
          >
            <div className="rounded-control border border-border bg-surface-subtle/50 p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded-xs border-border text-primary focus-ring"
                  checked={Boolean(watchedValues.personalDataConsent)}
                  onChange={(e) =>
                    setValue(
                      "personalDataConsent",
                      (e.target.checked ? true : undefined) as unknown as true,
                      { shouldValidate: true }
                    )
                  }
                />
                <span className="text-sm text-foreground leading-relaxed">
                  <strong>Persetujuan Data Pendaftaran (Wajib):</strong> Saya
                  menyetujui pencatatan data peserta didik dan wali untuk
                  keperluan verifikasi pendaftaran, penempatan kelas, pencatatan
                  kehadiran, dan pendampingan belajar di Rumah Belajar PMKI.
                </span>
              </label>
              {errors.personalDataConsent && (
                <p className="text-xs text-danger">
                  {errors.personalDataConsent.message}
                </p>
              )}
            </div>

            <div className="rounded-control border border-border bg-surface-subtle/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon icon={ShieldCheck} size="sm" className="text-primary" />
                <span>Persetujuan Foto & Video (Terpisah & Sukarela)</span>
              </div>
              <p className="text-xs text-secondary-foreground leading-relaxed">
                {PRIVACY_MESSAGES.mediaConsentIndependent}
              </p>

              <div className="space-y-2.5 pt-1">
                <label className="flex items-start gap-3 rounded-control border border-border bg-surface p-3 cursor-pointer">
                  <input
                    type="radio"
                    name="photoVideoConsentChoice"
                    className="mt-0.5 h-4 w-4 text-primary focus-ring"
                    checked={watchedValues.photoVideoConsent === "GRANTED"}
                    onChange={() =>
                      setValue("photoVideoConsent", "GRANTED", {
                        shouldValidate: true,
                      })
                    }
                  />
                  <span className="text-sm text-foreground">
                    <strong>Disetujui:</strong> Mengizinkan foto/video kegiatan
                    belajar yang telah ditinjau kelayakan privasinya untuk
                    dokumentasi resmi PMKI.
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-control border border-border bg-surface p-3 cursor-pointer">
                  <input
                    type="radio"
                    name="photoVideoConsentChoice"
                    className="mt-0.5 h-4 w-4 text-primary focus-ring"
                    checked={watchedValues.photoVideoConsent === "DENIED"}
                    onChange={() =>
                      setValue("photoVideoConsent", "DENIED", {
                        shouldValidate: true,
                      })
                    }
                  />
                  <span className="text-sm text-foreground">
                    <strong>Tidak diizinkan:</strong> Peserta didik tetap
                    mengikuti seluruh kegiatan belajar secara penuh tanpa
                    publikasi foto/video.
                  </span>
                </label>
              </div>

              {errors.photoVideoConsent && (
                <p className="text-xs text-danger">
                  {errors.photoVideoConsent.message}
                </p>
              )}
            </div>
          </FormSection>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <ReviewSection
              title="Identitas peserta didik"
              onEdit={() => setStep(1)}
              items={[
                { label: "Nama lengkap", value: watchedValues.fullName },
                { label: "Nama panggilan", value: watchedValues.nickname },
                { label: "Tanggal lahir", value: watchedValues.birthDate },
                {
                  label: "Jenis kelamin",
                  value:
                    watchedValues.gender === "P" ? "Perempuan" : "Laki-laki",
                },
                { label: "Wilayah", value: watchedValues.district },
                {
                  label: "Status RAAL",
                  value: watchedValues.isRaalResident
                    ? "Anak asuh RAAL Griya Asih"
                    : "Warga sekitar",
                },
              ]}
            />

            <ReviewSection
              title="Orang tua / wali"
              onEdit={() => setStep(2)}
              items={[
                { label: "Nama wali", value: watchedValues.guardianFullName },
                {
                  label: "Hubungan",
                  value:
                    GUARDIAN_RELATIONSHIP_LABELS[
                      watchedValues.guardianRelationship as GuardianRelationshipCode
                    ] ?? watchedValues.guardianRelationship,
                },
                {
                  label: "Nomor WhatsApp",
                  value: watchedValues.guardianPhone,
                },
                {
                  label: "Pekerjaan",
                  value: watchedValues.guardianOccupation || "—",
                },
              ]}
            />

            <ReviewSection
              title="Pendidikan & persetujuan"
              onEdit={() => setStep(3)}
              items={[
                {
                  label: "Jenjang kelas",
                  value:
                    EDUCATION_LEVEL_LABELS[
                      watchedValues.educationLevel as EducationLevelCode
                    ] ?? watchedValues.educationLevel,
                },
                {
                  label: "Asal sekolah",
                  value: watchedValues.schoolName || "—",
                },
                {
                  label: "Persetujuan data pendaftaran",
                  value: (
                    <StatusBadge domain="consent" status="GRANTED" />
                  ),
                },
                {
                  label: "Persetujuan foto & video",
                  value: (
                    <StatusBadge
                      domain="consent"
                      status={watchedValues.photoVideoConsent || "DENIED"}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={isSubmitting}
            >
              Kembali
            </Button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <Button type="button" variant="primary" onClick={handleNextStep}>
              Lanjutkan
            </Button>
          ) : (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Mengirim pendaftaran..." : "Kirim pendaftaran"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
