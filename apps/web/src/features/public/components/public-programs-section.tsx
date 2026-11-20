"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Calculator,
  Calendar,
  Check,
  Clock,
  HeartHandshake,
  Languages,
  MapPin,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  PublicGradeTargetDTO,
  PublicProgramItemDTO,
  PublicScheduleSlotDTO,
} from "../types/public-types";

export interface PublicProgramsSectionProps {
  programs: PublicProgramItemDTO[];
  gradeTargets: PublicGradeTargetDTO[];
  scheduleSlots: PublicScheduleSlotDTO[];
  scheduleDay: string;
  scheduleHours: string;
  locationFull: string;
}

/**
 * UI-12 Programs & Saturday Schedule Section (`03 §15`, `UI-UX §18`, `10 §5`, `10 §5A`).
 * - Visual Rhythm: Programs `64px` (`py-12 lg:py-16` / `--space-16`).
 * - Canonical terminology: `Peserta Didik`, `Pengajar Relawan`, `Kelas`.
 * - Saturday 15.00–17.15 WIB schedule at RAAL Griya Asih Lawang.
 */
export function PublicProgramsSection({
  programs,
  gradeTargets,
  scheduleSlots,
  scheduleDay,
  scheduleHours,
  locationFull,
}: PublicProgramsSectionProps) {
  const [activeTab, setActiveTab] = React.useState<"PROGRAM" | "JENJANG">(
    "PROGRAM"
  );

  const getProgramIcon = (id: string) => {
    switch (id) {
      case "matematika-ceria":
        return <Calculator aria-hidden="true" className="w-5 h-5" />;
      case "bahasa-inggris-praktis":
        return <Languages aria-hidden="true" className="w-5 h-5" />;
      case "pendidikan-karakter":
        return <HeartHandshake aria-hidden="true" className="w-5 h-5" />;
      default:
        return <BookOpenCheck aria-hidden="true" className="w-5 h-5" />;
    }
  };

  return (
    <>
      {/* Section A: Programs & Grade Levels (64px rhythm) */}
      <section
        id="program"
        aria-labelledby="program-section-heading"
        className="scroll-mt-28 py-12 sm:py-16 lg:py-20 bg-surface border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 lg:space-y-12">
          {/* Header & Accessible Tab Switcher */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="type-eyebrow text-primary uppercase tracking-wider">
                Kurikulum &amp; layanan belajar
              </div>
              <h2
                id="program-section-heading"
                className="type-section-title text-foreground tracking-tight text-balance"
              >
                Pilihan program pembelajaran unggulan
              </h2>
              <p className="type-body-sm text-secondary-foreground leading-relaxed">
                Dirancang untuk membangun pemahaman akademik sekaligus
                kematangan budi pekerti peserta didik melalui bimbingan
                interaktif yang menyenangkan (
                <span className="text-primary font-medium">Happy Learning</span>
                ).
              </p>
            </div>

            {/* Tab Controls (touch target >= 44px) */}
            <div
              role="tablist"
              aria-label="Tampilan kurikulum atau sasaran jenjang kelas"
              className="inline-flex p-1 bg-surface-subtle rounded-control border border-border shrink-0 self-start md:self-auto"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "PROGRAM"}
                onClick={() => setActiveTab("PROGRAM")}
                className={cn(
                  "min-h-11 px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-colors cursor-pointer focus-ring",
                  activeTab === "PROGRAM"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-secondary-foreground hover:text-foreground"
                )}
              >
                Mata pelajaran &amp; kurikulum
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "JENJANG"}
                onClick={() => setActiveTab("JENJANG")}
                className={cn(
                  "min-h-11 px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-colors cursor-pointer focus-ring",
                  activeTab === "JENJANG"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-secondary-foreground hover:text-foreground"
                )}
              >
                Sasaran kelas (TK – SMP 8)
              </button>
            </div>
          </div>

          {activeTab === "PROGRAM" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {programs.map((prog) => {
                const iconToneClass =
                  prog.accentTone === "info"
                    ? "bg-info-soft text-info"
                    : prog.accentTone === "learning"
                      ? "bg-learning-soft text-learning"
                      : prog.accentTone === "success"
                        ? "bg-success-soft text-success"
                        : "bg-activity-soft text-activity";
                const borderToneClass =
                  prog.accentTone === "info"
                    ? "border-info-border"
                    : prog.accentTone === "learning"
                      ? "border-learning-border"
                      : prog.accentTone === "success"
                        ? "border-success-border"
                        : "border-activity-border";
                const textToneClass =
                  prog.accentTone === "info"
                    ? "text-info"
                    : prog.accentTone === "learning"
                      ? "text-learning"
                      : prog.accentTone === "success"
                        ? "text-success"
                        : "text-activity";

                return (
                  <article
                    key={prog.id}
                    className={cn(
                      "rounded-card p-6 bg-surface border flex flex-col justify-between space-y-6",
                      borderToneClass
                    )}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={cn(
                            "w-11 h-11 rounded-control flex items-center justify-center",
                            iconToneClass
                          )}
                        >
                          {getProgramIcon(prog.id)}
                        </div>
                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                          {prog.number}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="type-title text-foreground">
                            {prog.title}
                          </h3>
                          {prog.badgeText && (
                            <span className="px-2 py-0.5 rounded-pill bg-activity-soft text-activity text-[11px] font-semibold border border-activity-border">
                              {prog.badgeText}
                            </span>
                          )}
                        </div>
                        <p className="type-caption text-secondary-foreground mt-1.5 leading-relaxed">
                          {prog.description}
                        </p>
                      </div>

                      <ul className="space-y-2 type-caption text-secondary-foreground pt-3 border-t border-border-subtle">
                        {prog.highlights.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <Check
                              aria-hidden="true"
                              className={cn(
                                "w-3.5 h-3.5 shrink-0 mt-0.5",
                                textToneClass
                              )}
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {prog.storyHighlight && (
                        <div className="p-3 bg-surface-subtle rounded-control border border-border text-xs text-foreground space-y-1">
                          <p
                            className={cn(
                              "font-semibold flex items-center gap-1.5",
                              textToneClass
                            )}
                          >
                            <Sparkles aria-hidden="true" className="w-3.5 h-3.5" />
                            <span>Kisah nyata kemajuan:</span>
                          </p>
                          <p className="type-caption text-secondary-foreground leading-relaxed">
                            {prog.storyHighlight}
                          </p>
                        </div>
                      )}
                    </div>

                    <div
                      className={cn(
                        "pt-3 border-t border-border text-xs font-semibold",
                        textToneClass
                      )}
                    >
                      {prog.targetNote}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {gradeTargets.map((target) => (
                <article
                  key={target.id}
                  className={cn(
                    "rounded-card bg-surface border border-border p-6 sm:p-8 space-y-4 flex flex-col justify-between",
                    target.accentTone === "warning" &&
                      "border-l-4 border-l-warning"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-pill text-xs font-semibold",
                          target.accentTone === "primary"
                            ? "bg-primary-soft text-primary"
                            : target.accentTone === "info"
                              ? "bg-info-soft text-info"
                              : "bg-warning-soft text-warning"
                        )}
                      >
                        {target.badgeLabel}
                      </span>
                      {target.extraBadge && (
                        <span className="px-2.5 py-0.5 rounded-pill bg-primary text-primary-foreground text-[11px] font-semibold">
                          {target.extraBadge}
                        </span>
                      )}
                    </div>
                    <h3 className="type-title text-foreground">
                      {target.title}
                    </h3>
                    <p className="type-body-sm text-secondary-foreground leading-relaxed">
                      {target.description}
                    </p>
                  </div>

                  <div className="bg-surface-subtle p-3.5 rounded-control border border-border-subtle text-xs text-secondary-foreground">
                    <strong className="text-foreground">
                      {target.focusLabel}:
                    </strong>{" "}
                    {target.focusText}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Welcoming CTA Strip Leading into Registration */}
          <div className="rounded-card bg-surface-subtle border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="type-title text-foreground">
                Ingin mengikutsertakan putra atau putri Anda?
              </h3>
              <p className="type-body-sm text-secondary-foreground max-w-2xl">
                Pendaftaran peserta didik terbuka tanpa memandang latar belakang
                agama maupun suku. Seluruh kegiatan bimbingan belajar
                diselenggarakan cuma-cuma dengan kasih.
              </p>
            </div>
            <Link
              href="/pendaftaran"
              className="shrink-0 inline-flex min-h-11 items-center justify-center gap-2 px-6 py-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold shadow-xs transition-colors active:scale-[0.985] focus-ring"
            >
              <span>Isi formulir pendaftaran</span>
              <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section B: Saturday Schedule 15.00 - 17.15 WIB at RAAL Lawang (64px rhythm) */}
      <section
        id="jadwal"
        aria-labelledby="schedule-section-heading"
        className="scroll-mt-28 py-12 sm:py-16 lg:py-20 bg-background border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Column: Schedule Orientation & RAAL Location Anchor */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <div className="type-eyebrow text-primary uppercase tracking-wider">
                  Jadwal &amp; waktu pelayanan
                </div>
                <h2
                  id="schedule-section-heading"
                  className="type-section-title text-foreground tracking-tight text-balance"
                >
                  Waktu pelaksanaan bimbingan belajar
                </h2>
                <p className="type-body-sm text-secondary-foreground leading-relaxed">
                  Dilaksanakan secara berkala setiap akhir pekan agar tidak
                  mengganggu jadwal sekolah formal peserta didik.
                </p>
              </div>

              <div className="rounded-card bg-surface border border-border p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-control bg-primary-soft/60 border border-primary/20">
                  <div className="w-11 h-11 rounded-pill bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Calendar aria-hidden="true" className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-primary font-semibold block">
                      Hari pelaksanaan
                    </span>
                    <p className="text-lg sm:text-xl font-bold text-foreground">
                      {scheduleDay}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-control bg-warning-soft/60 border border-warning-border">
                  <div className="w-11 h-11 rounded-pill bg-warning text-white flex items-center justify-center shrink-0">
                    <Clock aria-hidden="true" className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-warning-foreground font-semibold block">
                      Jam belajar
                    </span>
                    <p className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
                      {scheduleHours}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-control bg-surface-subtle border border-border">
                  <div className="w-10 h-10 rounded-control bg-surface text-foreground border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin
                      aria-hidden="true"
                      className="w-4 h-4 text-primary"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-secondary-foreground font-semibold block">
                      Tempat belajar
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      RAAL (Rumah Asuh Anak &amp; Lansia) &ldquo;Griya
                      Asih&rdquo;
                    </p>
                    <p className="type-caption text-secondary-foreground mt-0.5 leading-relaxed">
                      {locationFull} (akses mudah dari Kelurahan Kalirejo &amp;
                      Kelurahan Lawang).
                    </p>
                  </div>
                </div>
              </div>

              {/* Attendance Guidelines */}
              <div className="p-4 rounded-control bg-surface border border-border text-xs text-secondary-foreground space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <AlertCircle
                    aria-hidden="true"
                    className="w-4 h-4 text-primary"
                  />
                  <span>Ketentuan kehadiran peserta didik:</span>
                </div>
                <ul className="space-y-1 list-disc pl-5 type-caption">
                  <li>
                    Diharapkan hadir 15 menit sebelum kegiatan dimulai untuk
                    pembiasaan salam santun.
                  </li>
                  <li>
                    Membawa alat tulis pribadi; meja lipat mandiri disediakan di
                    ruangan kelas.
                  </li>
                  <li>
                    Jika berhalangan hadir (sakit atau izin keperluan keluarga),
                    mohon konfirmasi melalui WhatsApp pengajar kelas.
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Saturday Timetable Progression */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2 text-foreground font-bold text-base sm:text-lg">
                <Clock aria-hidden="true" className="w-5 h-5 text-primary" />
                <span>Susunan alur pembelajaran setiap sesi Sabtu</span>
              </div>

              <div className="space-y-3.5">
                {scheduleSlots.map((slot) => {
                  const borderAccent =
                    slot.accentTone === "primary"
                      ? "border-l-primary"
                      : slot.accentTone === "info"
                        ? "border-l-info"
                        : slot.accentTone === "activity"
                          ? "border-l-activity"
                          : slot.accentTone === "learning"
                            ? "border-l-learning"
                            : "border-l-success";
                  const badgeTone =
                    slot.accentTone === "primary"
                      ? "bg-primary-soft text-primary"
                      : slot.accentTone === "info"
                        ? "bg-info-soft text-info"
                        : slot.accentTone === "activity"
                          ? "bg-activity-soft text-activity"
                          : slot.accentTone === "learning"
                            ? "bg-learning-soft text-learning"
                            : "bg-success-soft text-success";

                  return (
                    <div
                      key={`${slot.time}-${slot.activity}`}
                      className={cn(
                        "p-4 sm:p-5 rounded-control border border-border border-l-4 bg-surface",
                        borderAccent
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                        <span className="text-xs font-bold text-foreground font-mono tabular-nums">
                          {slot.time}
                        </span>
                        <span
                          className={cn(
                            "self-start sm:self-auto px-2.5 py-0.5 rounded-pill text-[11px] font-semibold",
                            badgeTone
                          )}
                        >
                          {slot.tag}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground">
                        {slot.activity}
                      </h3>
                      <p className="type-caption text-secondary-foreground mt-1 leading-relaxed">
                        {slot.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

