"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ICON_MAP } from "@/config/icons";
import { CONTACTS } from "@/config/site";
import { cn } from "@/lib/cn";
import {
  publicStudentRegistrationSchema,
  type PublicStudentRegistrationInput,
} from "../../validators/public-validator";

const DEFAULT_VALUES: PublicStudentRegistrationInput = {
  namaAnak: "",
  jenjang: "SD",
  namaWali: "",
  phoneWali: "",
  catatan: "",
};

export function StudentRegistrationTab() {
  const [studentSubmitted, setStudentSubmitted] = React.useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PublicStudentRegistrationInput>({
    resolver: zodResolver(publicStudentRegistrationSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const selectedGrade = useWatch({ control, name: "jenjang" });

  const CentangIcon = ICON_MAP.centang;
  const KontakIcon = ICON_MAP.kontak;

  const handleStudentSubmit = (data: PublicStudentRegistrationInput) => {
    const coordinator = CONTACTS[0] ?? {
      name: "Ms. Evi",
      waNumber: "628123235318",
    };
    const message = `Halo ${coordinator.name}, saya ingin mendaftarkan anak untuk bimbingan belajar di Rumah Belajar Griya Asih Lawang.\n\n*Data Calon Peserta Didik:*\n- Nama Lengkap Anak: ${data.namaAnak}\n- Jenjang: ${data.jenjang}\n- Nama Orang Tua/Wali: ${data.namaWali}\n- Nomor WhatsApp: ${data.phoneWali}\n- Catatan Kebutuhan Belajar: ${data.catatan || "-"}`;

    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/${coordinator.waNumber}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
    setStudentSubmitted(true);
  };

  return (
    <div
      role="tabpanel"
      id="panel-siswa"
      aria-labelledby="tab-siswa"
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">
          Pendaftaran awal peserta didik baru
        </h2>
        <p className="text-xs sm:text-sm text-secondary-foreground leading-relaxed">
          Bimbingan belajar di Rumah Belajar Griya Asih terbuka gratis tanpa
          biaya pendidikan bagi anak-anak usia TK hingga SMP.
        </p>
      </div>

      {studentSubmitted ? (
        <div className="p-6 rounded-card bg-success-soft/30 border border-success-border text-center space-y-3">
          <div className="w-12 h-12 rounded-pill bg-success-soft text-success flex items-center justify-center mx-auto border border-success-border">
            <CentangIcon className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            Pendaftaran awal berhasil diproses
          </h3>
          <p className="text-xs sm:text-sm text-secondary-foreground max-w-md mx-auto leading-relaxed">
            Pesan WhatsApp telah disiapkan dan dikirimkan ke{" "}
            {CONTACTS[0]?.name ?? "Ms. Evi"} (Koordinator Pelayanan). Pengurus
            akan segera memverifikasi ketersediaan kelas tatap muka.
          </p>
          <button
            type="button"
            onClick={() => {
              setStudentSubmitted(false);
              reset(DEFAULT_VALUES);
            }}
            className="inline-flex min-h-11 items-center justify-center px-4 py-2 rounded-control bg-surface hover:bg-surface-subtle text-foreground border border-border text-xs font-semibold focus-ring cursor-pointer"
          >
            Daftarkan peserta didik lain
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(handleStudentSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Nama Calon Siswa */}
          <div className="space-y-1.5">
            <label
              htmlFor="student-name"
              className="block text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Nama lengkap calon peserta didik *
            </label>
            <input
              id="student-name"
              type="text"
              placeholder="Contoh: Maria Yosephine"
              className={cn(
                "w-full min-h-12 px-3.5 py-2.5 rounded-control bg-surface border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors",
                errors.namaAnak ? "border-danger-border" : "border-border"
              )}
              {...register("namaAnak")}
            />
            {errors.namaAnak && (
              <p className="text-xs text-danger-foreground font-medium">
                {errors.namaAnak.message}
              </p>
            )}
          </div>

          {/* Jenjang Kelas */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-foreground uppercase tracking-wider">
              Jenjang pendidikan *
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["TK", "SD", "SMP"] as const).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() =>
                    setValue("jenjang", grade, { shouldValidate: true })
                  }
                  className={cn(
                    "min-h-12 rounded-control text-xs font-semibold border transition-colors flex items-center justify-center focus-ring cursor-pointer",
                    selectedGrade === grade
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-surface hover:bg-surface-subtle text-secondary-foreground border-border"
                  )}
                >
                  {grade === "TK"
                    ? "Jenjang TK"
                    : grade === "SD"
                      ? "SD (Kelas 1–6)"
                      : "SMP (Kelas 7–8)"}
                </button>
              ))}
            </div>
          </div>

          {/* Nama Orang Tua / Wali */}
          <div className="space-y-1.5">
            <label
              htmlFor="parent-name"
              className="block text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Nama orang tua / wali *
            </label>
            <input
              id="parent-name"
              type="text"
              placeholder="Nama orang tua atau pendamping"
              className={cn(
                "w-full min-h-12 px-3.5 py-2.5 rounded-control bg-surface border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors",
                errors.namaWali ? "border-danger-border" : "border-border"
              )}
              {...register("namaWali")}
            />
            {errors.namaWali && (
              <p className="text-xs text-danger-foreground font-medium">
                {errors.namaWali.message}
              </p>
            )}
          </div>

          {/* No WhatsApp Wali */}
          <div className="space-y-1.5">
            <label
              htmlFor="parent-phone"
              className="block text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Nomor WhatsApp aktif wali *
            </label>
            <input
              id="parent-phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              className={cn(
                "w-full min-h-12 px-3.5 py-2.5 rounded-control bg-surface border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors",
                errors.phoneWali ? "border-danger-border" : "border-border"
              )}
              {...register("phoneWali")}
            />
            {errors.phoneWali && (
              <p className="text-xs text-danger-foreground font-medium">
                {errors.phoneWali.message}
              </p>
            )}
          </div>

          {/* Catatan Tambahan */}
          <div className="space-y-1.5">
            <label
              htmlFor="student-notes"
              className="block text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Kebutuhan belajar atau catatan khusus (opsional)
            </label>
            <textarea
              id="student-notes"
              rows={3}
              placeholder="Contoh: Butuh pendampingan khusus membaca atau persiapan ujian matematika..."
              className="w-full px-3.5 py-2.5 rounded-control bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors resize-none"
              {...register("catatan")}
            />
            {errors.catatan && (
              <p className="text-xs text-danger-foreground font-medium">
                {errors.catatan.message}
              </p>
            )}
          </div>

          {/* Privacy Reassurance Note */}
          <div className="p-3.5 rounded-control bg-surface-subtle border border-border-subtle text-xs text-secondary-foreground leading-relaxed">
            Perlindungan privasi anak: Kami tidak meminta dokumen KTP, KK, atau
            akta lahir di formulir online. Konfirmasi berkas dilakukan langsung
            saat orientasi kelas tatap muka.
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-colors shadow-xs active:scale-[0.985] focus-ring cursor-pointer"
          >
            <KontakIcon aria-hidden="true" className="w-4 h-4" />
            <span>Kirim pendaftaran via WhatsApp</span>
          </button>
        </form>
      )}
    </div>
  );
}

