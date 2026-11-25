"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ICON_MAP } from "@/config/icons";
import { CONTACTS, HOURS } from "@/config/site";
import { cn } from "@/lib/cn";
import {
  publicVolunteerRegistrationSchema,
  type PublicVolunteerRegistrationInput,
} from "../../validators/public-validator";

const VOLUNTEER_SUBJECT_OPTIONS = [
  "Matematika Ceria",
  "Bahasa Inggris Praktis",
  "Literasi & Membaca",
  "Pendidikan Karakter & Budi Pekerti",
  "Seni, Musik & Kreativitas",
  "Pendampingan Belajar Umum",
] as const;

const DEFAULT_VALUES: PublicVolunteerRegistrationInput = {
  namaLengkap: "",
  bidangKeahlian: ["Matematika Ceria"],
  komitmenWaktu: false as unknown as true,
  phoneRelawan: "",
  motivasi: "",
};

export function VolunteerRegistrationTab() {
  const [volunteerSubmitted, setVolunteerSubmitted] = React.useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PublicVolunteerRegistrationInput>({
    resolver: zodResolver(publicVolunteerRegistrationSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const selectedSubjects =
    useWatch({
      control,
      name: "bidangKeahlian",
    }) ?? [];

  const CentangIcon = ICON_MAP.centang;
  const KontakIcon = ICON_MAP.kontak;

  const toggleSubject = (subject: string) => {
    const next = selectedSubjects.includes(subject)
      ? selectedSubjects.filter((item) => item !== subject)
      : [...selectedSubjects, subject];
    setValue("bidangKeahlian", next, { shouldValidate: true });
  };

  const handleVolunteerSubmit = (data: PublicVolunteerRegistrationInput) => {
    const coordinator = CONTACTS[0] ?? {
      name: "Ms. Evi",
      waNumber: "628123235318",
    };
    const message = `Halo Pengurus Rumah Belajar Griya Asih Lawang, saya ingin mendaftar sebagai Pengajar Relawan.\n\n*Data Relawan:*\n- Nama Lengkap: ${data.namaLengkap}\n- Bidang Bimbingan: ${data.bidangKeahlian.join(", ")}\n- Komitmen Waktu: Setiap Sabtu sore (${HOURS.window})\n- Nomor WhatsApp: ${data.phoneRelawan}\n- Motivasi / Pengalaman: ${data.motivasi || "-"}`;

    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/${coordinator.waNumber}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
    setVolunteerSubmitted(true);
  };

  return (
    <div
      role="tabpanel"
      id="panel-relawan"
      aria-labelledby="tab-relawan"
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">
          Pendaftaran pengajar relawan
        </h2>
        <p className="text-xs sm:text-sm text-secondary-foreground leading-relaxed">
          Mari berbagi ilmu, inspirasi, dan keteladanan bersama anak-anak di
          Griya Asih Lawang setiap hari Sabtu sore ({HOURS.window}).
        </p>
      </div>

      {volunteerSubmitted ? (
        <div className="p-6 rounded-card bg-success-soft/30 border border-success-border text-center space-y-3">
          <div className="w-12 h-12 rounded-pill bg-success-soft text-success flex items-center justify-center mx-auto border border-success-border">
            <CentangIcon className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            Pendaftaran relawan berhasil dikirim
          </h3>
          <p className="text-xs sm:text-sm text-secondary-foreground max-w-md mx-auto leading-relaxed">
            Terima kasih atas kepedulian Anda. Pesan telah disiapkan ke{" "}
            {CONTACTS[0]?.name ?? "Ms. Evi"}. Pengurus akan segera menghubungi
            Anda untuk berbincang santai dan pengenalan kelas.
          </p>
          <button
            type="button"
            onClick={() => {
              setVolunteerSubmitted(false);
              reset(DEFAULT_VALUES);
            }}
            className="inline-flex min-h-11 items-center justify-center px-4 py-2 rounded-control bg-surface hover:bg-surface-subtle text-foreground border border-border text-xs font-semibold focus-ring cursor-pointer"
          >
            Kirim pendaftaran relawan lain
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(handleVolunteerSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Nama Relawan */}
          <div className="space-y-1.5">
            <label
              htmlFor="volunteer-name"
              className="block text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Nama lengkap Anda *
            </label>
            <input
              id="volunteer-name"
              type="text"
              placeholder="Contoh: Yohanes Prasetyo"
              className={cn(
                "w-full min-h-12 px-3.5 py-2.5 rounded-control bg-surface border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors",
                errors.namaLengkap ? "border-danger-border" : "border-border"
              )}
              {...register("namaLengkap")}
            />
            {errors.namaLengkap && (
              <p className="text-xs text-danger-foreground font-medium">
                {errors.namaLengkap.message}
              </p>
            )}
          </div>

          {/* Bidang Minat / Keahlian */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-foreground uppercase tracking-wider">
              Bidang bimbingan yang diminati *
            </span>
            <div className="flex flex-wrap gap-2">
              {VOLUNTEER_SUBJECT_OPTIONS.map((subject) => {
                const isSelected = selectedSubjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    className={cn(
                      "min-h-11 px-3.5 py-2 rounded-pill text-xs font-semibold border transition-colors focus-ring cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface hover:bg-surface-subtle text-secondary-foreground border-border"
                    )}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {subject}
                  </button>
                );
              })}
            </div>
            {errors.bidangKeahlian && (
              <p className="text-xs text-danger-foreground font-medium">
                {errors.bidangKeahlian.message}
              </p>
            )}
          </div>

          {/* Komitmen Waktu */}
          <div className="space-y-1.5">
            <label className="flex items-start gap-3 p-3.5 rounded-control bg-surface border border-border cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 rounded text-primary focus-ring border-border shrink-0 cursor-pointer"
                {...register("komitmenWaktu")}
              />
              <span className="text-xs sm:text-sm text-secondary-foreground leading-relaxed">
                Saya bersedia hadir mendampingi sesi belajar tatap muka setiap
                hari Sabtu sore ({HOURS.window}) di Griya Asih Lawang. *
              </span>
            </label>
            {errors.komitmenWaktu && (
              <p className="text-xs text-danger-foreground font-medium">
                {errors.komitmenWaktu.message}
              </p>
            )}
          </div>

          {/* No WhatsApp Relawan */}
          <div className="space-y-1.5">
            <label
              htmlFor="volunteer-phone"
              className="block text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Nomor WhatsApp aktif Anda *
            </label>
            <input
              id="volunteer-phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              className={cn(
                "w-full min-h-12 px-3.5 py-2.5 rounded-control bg-surface border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors",
                errors.phoneRelawan ? "border-danger-border" : "border-border"
              )}
              {...register("phoneRelawan")}
            />
            {errors.phoneRelawan && (
              <p className="text-xs text-danger-foreground font-medium">
                {errors.phoneRelawan.message}
              </p>
            )}
          </div>

          {/* Motivasi / Latar Belakang */}
          <div className="space-y-1.5">
            <label
              htmlFor="volunteer-motivation"
              className="block text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Motivasi singkat atau pengalaman mengajar (opsional)
            </label>
            <textarea
              id="volunteer-motivation"
              rows={3}
              placeholder="Ceritakan latar belakang pendidikan, hobi, atau alasan ingin berbagi bersama anak-anak..."
              className="w-full px-3.5 py-2.5 rounded-control bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors resize-none"
              {...register("motivasi")}
            />
            {errors.motivasi && (
              <p className="text-xs text-danger-foreground font-medium">
                {errors.motivasi.message}
              </p>
            )}
          </div>

          {/* Reassurance Note */}
          <div className="p-3.5 rounded-control bg-surface-subtle border border-border-subtle text-xs text-secondary-foreground leading-relaxed">
            Tanpa berkas rumit: Kami tidak meminta upload berkas CV atau ijazah
            di tahap awal. Pengurus akan mengundang Anda berbincang hangat
            mengenai suasana kelas.
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-colors shadow-xs active:scale-[0.985] focus-ring cursor-pointer"
          >
            <KontakIcon aria-hidden="true" className="w-4 h-4" />
            <span>Kirim formulir relawan via WhatsApp</span>
          </button>
        </form>
      )}
    </div>
  );
}

