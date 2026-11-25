"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  DatePicker,
  FeedbackBanner,
  FormBottomSheet,
} from "@/components/patterns";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { EDUCATION_LEVEL_LABELS } from "../types/student-types";
import {
  EDUCATION_LEVEL_VALUES,
  editStudentProfileFormSchema,
  type EditStudentProfileFormValues,
} from "../validators/student-validator";

export interface EditStudentProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: EditStudentProfileFormValues;
  onSubmit: (
    values: EditStudentProfileFormValues
  ) => Promise<{ success: true } | { success: false; error: string }>;
  pending: boolean;
}

export function EditStudentProfileSheet({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  pending,
}: EditStudentProfileSheetProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const fullNameId = React.useId();
  const nicknameId = React.useId();
  const birthDateId = React.useId();
  const genderId = React.useId();
  const levelId = React.useId();
  const districtId = React.useId();
  const schoolId = React.useId();

  const form = useForm<EditStudentProfileFormValues>({
    resolver: zodResolver(editStudentProfileFormSchema),
    defaultValues: initialData,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  React.useEffect(() => {
    if (open) {
      reset(initialData);
    }
  }, [open, initialData, reset]);

  async function handleFormSubmit(values: EditStudentProfileFormValues) {
    setSubmitError(null);
    const result = await onSubmit(values);
    if (!result.success) {
      setSubmitError(result.error);
    }
  }

  const renderForm = (formId: string) => (
    <form
      id={formId}
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4"
      noValidate
    >
      {submitError && (
        <FeedbackBanner
          tone="danger"
          message={submitError}
          onDismiss={() => setSubmitError(null)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor={fullNameId}
            className="block text-xs font-medium text-foreground"
          >
            Nama lengkap
          </label>
          <Input id={fullNameId} autoFocus {...register("fullName")} />
          {errors.fullName && (
            <p className="text-xs text-danger">{errors.fullName.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label
            htmlFor={nicknameId}
            className="block text-xs font-medium text-foreground"
          >
            Nama panggilan
          </label>
          <Input id={nicknameId} {...register("nickname")} />
          {errors.nickname && (
            <p className="text-xs text-danger">{errors.nickname.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Controller
            control={control}
            name="birthDate"
            render={({ field }) => (
              <DatePicker
                id={birthDateId}
                label="Tanggal lahir"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.birthDate && (
            <p className="text-xs text-danger">{errors.birthDate.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label
            htmlFor={genderId}
            className="block text-xs font-medium text-foreground"
          >
            Jenis kelamin
          </label>
          <Controller
            control={form.control}
            name="gender"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={genderId}>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && (
            <p className="text-xs text-danger">{errors.gender.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label
            htmlFor={levelId}
            className="block text-xs font-medium text-foreground"
          >
            Jenjang kelas
          </label>
          <Controller
            control={form.control}
            name="educationLevel"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={levelId}>
                  <SelectValue placeholder="Pilih jenjang kelas" />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                  {EDUCATION_LEVEL_VALUES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {EDUCATION_LEVEL_LABELS[code]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.educationLevel && (
            <p className="text-xs text-danger">
              {errors.educationLevel.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label
            htmlFor={districtId}
            className="block text-xs font-medium text-foreground"
          >
            Wilayah
          </label>
          <Controller
            control={form.control}
            name="district"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={districtId}>
                  <SelectValue placeholder="Pilih wilayah" />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                  <SelectItem value="Kalirejo">Kelurahan Kalirejo</SelectItem>
                  <SelectItem value="Lawang">Kecamatan Lawang</SelectItem>
                  <SelectItem value="Lainnya">Wilayah lainnya</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.district && (
            <p className="text-xs text-danger">{errors.district.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor={schoolId}
          className="block text-xs font-medium text-foreground"
        >
          Asal sekolah
        </label>
        <Input id={schoolId} {...register("schoolName")} />
        {errors.schoolName && (
          <p className="text-xs text-danger">{errors.schoolName.message}</p>
        )}
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input type="checkbox" {...register("isRaalResident")} />
        <span>Anak asuh Asrama RAAL Griya Asih</span>
      </label>
    </form>
  );

  const renderFooter = (formId: string, isMobile: boolean) => (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onOpenChange(false)}
        disabled={pending}
        fullWidth={isMobile}
      >
        Batal
      </Button>
      <Button
        type="submit"
        form={formId}
        variant="primary"
        disabled={pending}
        fullWidth={isMobile}
      >
        {pending ? "Menyimpan..." : "Simpan perubahan"}
      </Button>
    </>
  );

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setSubmitError(null);
        onOpenChange(nextOpen);
      }}
      title="Ubah profil peserta didik"
      description="Perbarui data identitas dan pendidikan peserta didik."
      footer={renderFooter}
    >
      {renderForm}
    </FormBottomSheet>
  );
}

