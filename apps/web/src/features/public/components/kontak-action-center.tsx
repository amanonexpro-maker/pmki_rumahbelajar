"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ICON_MAP } from "@/config/icons";
import { ADDRESS, CONTACTS, HOURS, MAPS_LOCATION } from "@/config/site";
import { cn } from "@/lib/cn";
import {
  publicStudentRegistrationSchema,
  publicVolunteerRegistrationSchema,
} from "../validators/public-validator";

export type KontakTabId = "info" | "siswa" | "relawan" | "donasi";

export interface KontakActionCenterProps {
  initialTab?: KontakTabId;
}

interface TabItem {
  id: KontakTabId;
  label: string;
  iconKey: string;
}

const TABS: readonly TabItem[] = [
  { id: "info", label: "Info & Lokasi", iconKey: "info" },
  { id: "siswa", label: "Daftar Siswa", iconKey: "daftarSiswa" },
  { id: "relawan", label: "Jadi Relawan", iconKey: "relawan" },
  { id: "donasi", label: "Dukungan Donasi", iconKey: "donasi" },
] as const;

const VOLUNTEER_SUBJECT_OPTIONS = [
  "Matematika Ceria",
  "Bahasa Inggris Praktis",
  "Literasi & Membaca",
  "Pendidikan Karakter & Budi Pekerti",
  "Seni, Musik & Kreativitas",
  "Pendampingan Belajar Umum",
] as const;

/**
 * KontakActionCenter (Fase 14 Step 8, UI-UX §15, §28, §30, 03 §7, 03 §9).
 * Pusat interaksi layanan publik terpadu dengan segmented control multi-tujuan:
 * 1. Info & Lokasi: Alamat kanonikal bersumber ADDRESS (pelunasan TD-ADDR), narahubung CONTACTS, jadwal HOURS, maps responsif.
 * 2. Daftar Siswa: Pendaftaran awal peserta didik touch-friendly tanpa meminta dokumen KTP/KK/Akta.
 * 3. Jadi Relawan: Pendaftaran pengajar relawan tanpa meminta CV/ijazah awal.
 * 4. Donasi: Narasi transparansi + placeholder graceful QRIS & rekening (audit-verified missing) + konfirmasi WhatsApp bendahara.
 */
export function KontakActionCenter({ initialTab = "info" }: KontakActionCenterProps) {
  const searchParams = useSearchParams();
  const queryTab = searchParams ? (searchParams.get("tab") as KontakTabId | null) : null;
  const resolvedTab: KontakTabId =
    queryTab === "siswa" || queryTab === "relawan" || queryTab === "donasi" || queryTab === "info"
      ? queryTab
      : initialTab;

  const [activeTab, setActiveTab] = React.useState<KontakTabId>(resolvedTab);

  React.useEffect(() => {
    if (
      queryTab &&
      (queryTab === "siswa" || queryTab === "relawan" || queryTab === "donasi" || queryTab === "info") &&
      queryTab !== activeTab
    ) {
      setActiveTab(queryTab);
    }
  }, [queryTab, activeTab]);

  // Address copy state
  const [isCopied, setIsCopied] = React.useState(false);

  // Student Form State
  const [studentName, setStudentName] = React.useState("");
  const [studentGrade, setStudentGrade] = React.useState<"TK" | "SD" | "SMP">("SD");
  const [parentName, setParentName] = React.useState("");
  const [parentPhone, setParentPhone] = React.useState("");
  const [studentNotes, setStudentNotes] = React.useState("");
  const [studentErrors, setStudentErrors] = React.useState<Record<string, string>>({});
  const [studentSubmitted, setStudentSubmitted] = React.useState(false);

  // Volunteer Form State
  const [volunteerName, setVolunteerName] = React.useState("");
  const [selectedSubjects, setSelectedSubjects] = React.useState<string[]>([
    "Matematika Ceria",
  ]);
  const [timeCommitment, setTimeCommitment] = React.useState(false);
  const [volunteerPhone, setVolunteerPhone] = React.useState("");
  const [volunteerMotivation, setVolunteerMotivation] = React.useState("");
  const [volunteerErrors, setVolunteerErrors] = React.useState<Record<string, string>>({});
  const [volunteerSubmitted, setVolunteerSubmitted] = React.useState(false);

  // Synchronize URL query parameter without full-page navigation
  const handleTabSelect = (tabId: KontakTabId) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      window.history.replaceState(null, "", url.toString());
    }
  };

  // Copy official Google Maps Short URL to clipboard
  const handleCopyLocation = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(MAPS_LOCATION.shortUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch {
      // Graceful fallback
    }
  };

  // Student Registration Submission
  const handleStudentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStudentErrors({});

    const result = publicStudentRegistrationSchema.safeParse({
      namaAnak: studentName,
      jenjang: studentGrade,
      namaWali: parentName,
      phoneWali: parentPhone,
      catatan: studentNotes,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0];
        if (typeof fieldName === "string" && !fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setStudentErrors(fieldErrors);
      return;
    }

    const coordinator = CONTACTS[0] ?? {
      name: "Ms. Evi",
      waNumber: "628123235318",
    };
    const message = `Halo ${coordinator.name}, saya ingin mendaftarkan anak untuk bimbingan belajar di Rumah Belajar Griya Asih Lawang.\n\n*Data Calon Peserta Didik:*\n- Nama Lengkap Anak: ${result.data.namaAnak}\n- Jenjang: ${result.data.jenjang}\n- Nama Orang Tua/Wali: ${result.data.namaWali}\n- Nomor WhatsApp: ${result.data.phoneWali}\n- Catatan Kebutuhan Belajar: ${result.data.catatan || "-"}`;

    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/${coordinator.waNumber}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
    setStudentSubmitted(true);
  };

  // Volunteer Registration Submission
  const handleVolunteerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVolunteerErrors({});

    const result = publicVolunteerRegistrationSchema.safeParse({
      namaLengkap: volunteerName,
      bidangKeahlian: selectedSubjects,
      komitmenWaktu: timeCommitment,
      phoneRelawan: volunteerPhone,
      motivasi: volunteerMotivation,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0];
        if (typeof fieldName === "string" && !fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setVolunteerErrors(fieldErrors);
      return;
    }

    const coordinator = CONTACTS[0] ?? {
      name: "Ms. Evi",
      waNumber: "628123235318",
    };
    const message = `Halo Pengurus Rumah Belajar Griya Asih Lawang, saya ingin mendaftar sebagai Pengajar Relawan.\n\n*Data Relawan:*\n- Nama Lengkap: ${result.data.namaLengkap}\n- Bidang Bimbingan: ${result.data.bidangKeahlian.join(", ")}\n- Komitmen Waktu: Setiap Sabtu sore (${HOURS.window})\n- Nomor WhatsApp: ${result.data.phoneRelawan}\n- Motivasi / Pengalaman: ${result.data.motivasi || "-"}`;

    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/${coordinator.waNumber}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
    setVolunteerSubmitted(true);
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((item) => item !== subject)
        : [...prev, subject]
    );
  };

  // Semantic Icon references from frozen registry
  const SalinIcon = ICON_MAP.salin;
  const CentangIcon = ICON_MAP.centang;
  const KontakIcon = ICON_MAP.kontak;
  const WaktuIcon = ICON_MAP.waktu;
  const LokasiIcon = ICON_MAP.lokasi;
  const DonasiIcon = ICON_MAP.donasi;
  const InfoIcon = ICON_MAP.info;
  const TautanLuarIcon = ICON_MAP.tautanLuar;

  return (
    <div className="space-y-8">
      {/* 1. Accessible Segmented Control Tabs */}
      <div
        role="tablist"
        aria-label="Pilihan Layanan Kontak & Komunitas"
        className="flex flex-wrap p-1.5 rounded-card bg-surface-subtle border border-border gap-1.5"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = ICON_MAP[tab.iconKey] ?? ICON_MAP.info;

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabSelect(tab.id)}
              className={cn(
                "flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 min-h-11 rounded-control text-xs sm:text-sm font-medium transition-colors focus-ring cursor-pointer",
                isActive
                  ? "bg-surface text-foreground font-semibold shadow-xs border border-border"
                  : "text-secondary-foreground hover:text-foreground hover:bg-surface/50"
              )}
            >
              <TabIcon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. TAB 1: Info & Lokasi */}
      {activeTab === "info" && (
        <div
          role="tabpanel"
          id="panel-info"
          aria-labelledby="tab-info"
          className="space-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Direct WhatsApp Contacts & Operational Hours */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                  Narahubung resmi (WhatsApp)
                </h2>

                {/* Primary Coordinator Contact (Ms. Evi) */}
                {CONTACTS[0] && (
                  <div className="p-5 rounded-card bg-surface border border-border shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground font-medium">
                          {CONTACTS[0].label}
                        </p>
                        <h3 className="text-base font-bold text-foreground">
                          {CONTACTS[0].name}
                        </h3>
                        <p className="text-xs text-secondary-foreground font-mono">
                          {CONTACTS[0].phoneDisplay}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-pill bg-primary-soft text-primary flex items-center justify-center shrink-0">
                        <KontakIcon aria-hidden="true" className="w-5 h-5" />
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/${CONTACTS[0].waNumber}?text=${encodeURIComponent(
                        `Halo ${CONTACTS[0].name}, saya ingin bertanya seputar bimbingan belajar di Rumah Belajar Griya Asih Lawang.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex min-h-12 items-center justify-center gap-2.5 px-5 py-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-colors shadow-xs active:scale-[0.985] focus-ring"
                    >
                      <KontakIcon aria-hidden="true" className="w-4 h-4" />
                      <span>WhatsApp {CONTACTS[0].name}</span>
                    </a>
                  </div>
                )}

                {/* Secondary Humas Contact (Ms. Lilian) */}
                {CONTACTS[1] && (
                  <div className="p-5 rounded-card bg-surface border border-border shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground font-medium">
                          {CONTACTS[1].label}
                        </p>
                        <h3 className="text-base font-bold text-foreground">
                          {CONTACTS[1].name}
                        </h3>
                        <p className="text-xs text-secondary-foreground font-mono">
                          {CONTACTS[1].phoneDisplay}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-pill bg-primary-soft text-primary flex items-center justify-center shrink-0">
                        <KontakIcon aria-hidden="true" className="w-5 h-5" />
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/${CONTACTS[1].waNumber}?text=${encodeURIComponent(
                        `Halo ${CONTACTS[1].name}, saya ingin bertanya seputar kegiatan dan warta Rumah Belajar Griya Asih Lawang.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex min-h-12 items-center justify-center gap-2.5 px-5 py-3 rounded-control bg-surface hover:bg-surface-subtle text-foreground border border-border font-semibold text-sm transition-colors shadow-xs active:scale-[0.985] focus-ring"
                    >
                      <KontakIcon aria-hidden="true" className="w-4 h-4 text-primary" />
                      <span>WhatsApp {CONTACTS[1].name}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Verified Operational Hours Card */}
              <div className="p-5 rounded-card bg-surface-subtle border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <WaktuIcon aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Jadwal Belajar Rutin
                  </h3>
                </div>
                <div className="space-y-1 text-xs sm:text-sm text-secondary-foreground pl-6">
                  <p className="font-semibold text-foreground">
                    {HOURS.day} • {HOURS.window}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {HOURS.arriveNote}
                  </p>
                </div>
              </div>

              {/* Privacy Reassurance Note */}
              <div className="p-4 rounded-control bg-surface border border-border-subtle text-xs text-secondary-foreground leading-relaxed">
                Komunikasi Anda dilindungi privasi sesuai komitmen perlindungan data peserta didik dan keluarga besar PMKI.
              </div>
            </div>

            {/* Right Column: Physical Address (TD-ADDR Repaid) & Interactive Google Maps */}
            <div className="lg:col-span-6 space-y-6">
              <div className="p-6 rounded-card bg-surface border border-border shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                      <LokasiIcon aria-hidden="true" className="w-4 h-4 shrink-0" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider">
                        Alamat
                      </h3>
                    </div>
                    <p className="text-base font-bold text-foreground">
                      {ADDRESS.street}, {ADDRESS.rtRw}
                    </p>
                    <p className="text-xs sm:text-sm text-secondary-foreground leading-relaxed">
                      {ADDRESS.desa}, Kecamatan {ADDRESS.kecamatan}, Kabupaten {ADDRESS.kabupaten}, {ADDRESS.provinsi} {ADDRESS.postalCode}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyLocation}
                    aria-label="Salin tautan Google Maps ke papan klip"
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-control text-xs font-medium border transition-colors focus-ring shrink-0 cursor-pointer",
                      isCopied
                        ? "bg-success-soft text-success border-success-border font-semibold"
                        : "bg-surface hover:bg-surface-subtle text-secondary-foreground border-border"
                    )}
                  >
                    {isCopied ? (
                      <>
                        <CentangIcon aria-hidden="true" className="w-3.5 h-3.5" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <SalinIcon aria-hidden="true" className="w-3.5 h-3.5" />
                        <span>Salin Lokasi</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Google Maps Responsive Embed (Aspect 16:9) with Direct Maps App Link */}
                <div className="relative w-full aspect-video rounded-control overflow-hidden border border-border bg-surface-subtle group">
                  <iframe
                    title='Peta Lokasi Rumah Asuh Anak & Lansia (RAAL) "GRIYA ASIH"'
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      `${MAPS_LOCATION.coordinates.lat},${MAPS_LOCATION.coordinates.lng}`
                    )}&t=&z=17&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />

                  {/* Direct Maps Link Overlay */}
                  <a
                    href={MAPS_LOCATION.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-control bg-surface/95 hover:bg-surface text-foreground border border-border shadow-xs text-[11px] font-semibold backdrop-blur-xs transition-colors focus-ring"
                    aria-label="Buka lokasi di Google Maps"
                  >
                    <span>Buka di Maps</span>
                    <TautanLuarIcon aria-hidden="true" className="w-3.5 h-3.5 text-primary" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 2: Daftar Siswa */}
      {activeTab === "siswa" && (
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
              Bimbingan belajar di Rumah Belajar Griya Asih terbuka gratis tanpa biaya pendidikan bagi anak-anak usia TK hingga SMP.
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
                Pesan WhatsApp telah disiapkan dan dikirimkan ke {CONTACTS[0]?.name ?? "Ms. Evi"} (Koordinator Pelayanan). Pengurus akan segera memverifikasi ketersediaan kelas tatap muka.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStudentSubmitted(false);
                  setStudentName("");
                  setStudentGrade("SD");
                  setParentName("");
                  setParentPhone("");
                  setStudentNotes("");
                }}
                className="inline-flex min-h-11 items-center justify-center px-4 py-2 rounded-control bg-surface hover:bg-surface-subtle text-foreground border border-border text-xs font-semibold focus-ring cursor-pointer"
              >
                Daftarkan peserta didik lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleStudentSubmit} className="space-y-4" noValidate>
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
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Contoh: Maria Yosephine"
                  className={cn(
                    "w-full min-h-12 px-3.5 py-2.5 rounded-control bg-surface border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors",
                    studentErrors.namaAnak ? "border-danger-border" : "border-border"
                  )}
                />
                {studentErrors.namaAnak && (
                  <p className="text-xs text-danger-foreground font-medium">
                    {studentErrors.namaAnak}
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
                      onClick={() => setStudentGrade(grade)}
                      className={cn(
                        "min-h-12 rounded-control text-xs font-semibold border transition-colors flex items-center justify-center focus-ring cursor-pointer",
                        studentGrade === grade
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
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Nama orang tua atau pendamping"
                  className={cn(
                    "w-full min-h-12 px-3.5 py-2.5 rounded-control bg-surface border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors",
                    studentErrors.namaWali ? "border-danger-border" : "border-border"
                  )}
                />
                {studentErrors.namaWali && (
                  <p className="text-xs text-danger-foreground font-medium">
                    {studentErrors.namaWali}
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
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className={cn(
                    "w-full min-h-12 px-3.5 py-2.5 rounded-control bg-surface border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors",
                    studentErrors.phoneWali ? "border-danger-border" : "border-border"
                  )}
                />
                {studentErrors.phoneWali && (
                  <p className="text-xs text-danger-foreground font-medium">
                    {studentErrors.phoneWali}
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
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="Contoh: Butuh pendampingan khusus membaca atau persiapan ujian matematika..."
                  className="w-full px-3.5 py-2.5 rounded-control bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors resize-none"
                />
              </div>

              {/* Privacy Reassurance Note */}
              <div className="p-3.5 rounded-control bg-surface-subtle border border-border-subtle text-xs text-secondary-foreground leading-relaxed">
                Perlindungan privasi anak: Kami tidak meminta dokumen KTP, KK, atau akta lahir di formulir online. Konfirmasi berkas dilakukan langsung saat orientasi kelas tatap muka.
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
      )}

      {/* 4. TAB 3: Jadi Relawan */}
      {activeTab === "relawan" && (
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
              Mari berbagi ilmu, inspirasi, dan keteladanan bersama anak-anak di Griya Asih Lawang setiap hari Sabtu sore ({HOURS.window}).
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
                Terima kasih atas kepedulian Anda. Pesan telah disiapkan ke {CONTACTS[0]?.name ?? "Ms. Evi"}. Pengurus akan segera menghubungi Anda untuk berbincang santai dan pengenalan kelas.
              </p>
              <button
                type="button"
                onClick={() => {
                  setVolunteerSubmitted(false);
                  setVolunteerName("");
                  setSelectedSubjects(["Matematika Ceria"]);
                  setTimeCommitment(false);
                  setVolunteerPhone("");
                  setVolunteerMotivation("");
                }}
                className="inline-flex min-h-11 items-center justify-center px-4 py-2 rounded-control bg-surface hover:bg-surface-subtle text-foreground border border-border text-xs font-semibold focus-ring cursor-pointer"
              >
                Kirim pendaftaran relawan lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleVolunteerSubmit} className="space-y-4" noValidate>
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
                  required
                  value={volunteerName}
                  onChange={(e) => setVolunteerName(e.target.value)}
                  placeholder="Contoh: Yohanes Prasetyo"
                  className={cn(
                    "w-full min-h-12 px-3.5 py-2.5 rounded-control bg-surface border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors",
                    volunteerErrors.namaLengkap ? "border-danger-border" : "border-border"
                  )}
                />
                {volunteerErrors.namaLengkap && (
                  <p className="text-xs text-danger-foreground font-medium">
                    {volunteerErrors.namaLengkap}
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
                {volunteerErrors.bidangKeahlian && (
                  <p className="text-xs text-danger-foreground font-medium">
                    {volunteerErrors.bidangKeahlian}
                  </p>
                )}
              </div>

              {/* Komitmen Waktu */}
              <div className="space-y-1.5">
                <label className="flex items-start gap-3 p-3.5 rounded-control bg-surface border border-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timeCommitment}
                    onChange={(e) => setTimeCommitment(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-primary focus-ring border-border shrink-0 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-secondary-foreground leading-relaxed">
                    Saya bersedia hadir mendampingi sesi belajar tatap muka setiap hari Sabtu sore ({HOURS.window}) di Griya Asih Lawang. *
                  </span>
                </label>
                {volunteerErrors.komitmenWaktu && (
                  <p className="text-xs text-danger-foreground font-medium">
                    {volunteerErrors.komitmenWaktu}
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
                  required
                  value={volunteerPhone}
                  onChange={(e) => setVolunteerPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className={cn(
                    "w-full min-h-12 px-3.5 py-2.5 rounded-control bg-surface border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors",
                    volunteerErrors.phoneRelawan ? "border-danger-border" : "border-border"
                  )}
                />
                {volunteerErrors.phoneRelawan && (
                  <p className="text-xs text-danger-foreground font-medium">
                    {volunteerErrors.phoneRelawan}
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
                  value={volunteerMotivation}
                  onChange={(e) => setVolunteerMotivation(e.target.value)}
                  placeholder="Ceritakan latar belakang pendidikan, hobi, atau alasan ingin berbagi bersama anak-anak..."
                  className="w-full px-3.5 py-2.5 rounded-control bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors resize-none"
                />
              </div>

              {/* Reassurance Note */}
              <div className="p-3.5 rounded-control bg-surface-subtle border border-border-subtle text-xs text-secondary-foreground leading-relaxed">
                Tanpa berkas rumit: Kami tidak meminta upload berkas CV atau ijazah di tahap awal. Pengurus akan mengundang Anda berbincang hangat mengenai suasana kelas.
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
      )}

      {/* 5. TAB 4: Donasi */}
      {activeTab === "donasi" && (
        <div
          role="tabpanel"
          id="panel-donasi"
          aria-labelledby="tab-donasi"
          className="max-w-2xl mx-auto space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Dukungan operasional &amp; donasi pendidikan
            </h2>
            <p className="text-xs sm:text-sm text-secondary-foreground leading-relaxed">
              Rumah Belajar Griya Asih Lawang beroperasi secara swadaya untuk memberikan bimbingan belajar gratis bagi anak-anak di Lawang dan sekitarnya. Seluruh dukungan dialokasikan langsung untuk modul latihan berhitung, buku bacaan literasi, dan konsumsi sehat setiap sesi belajar.
            </p>
          </div>

          {/* Audit Result: QRIS Asset Missing Graceful Placeholder */}
          <div className="p-6 sm:p-8 rounded-card border-2 border-dashed border-border bg-surface-subtle text-center space-y-3">
            <div className="w-12 h-12 rounded-pill bg-surface text-secondary-foreground flex items-center justify-center mx-auto border border-border">
              <DonasiIcon className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              Asset QRIS resmi sedang disiapkan oleh pengurus
            </h3>
            <p className="text-xs sm:text-sm text-secondary-foreground max-w-md mx-auto leading-relaxed">
              Untuk penyaluran donasi non-tunai yang terverifikasi dan aman, silakan konfirmasi langsung kepada pengurus humas melalui WhatsApp.
            </p>
          </div>

          {/* Audit Result: Bank Account Missing Graceful Notice */}
          <div className="p-5 rounded-card border border-border bg-surface shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-pill bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <InfoIcon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-foreground">
                  Rekening Bank Resmi
                </h4>
                <p className="text-xs sm:text-sm text-secondary-foreground leading-relaxed">
                  Nomor rekening resmi sedang dikonfirmasi oleh pengurus &amp; bendahara yayasan demi menjaga akuntabilitas, transparansi, dan tertib pencatatan audit.
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp Direct Confirmation Button to Ms. Lilian */}
          {CONTACTS[1] && (
            <div className="pt-2">
              <a
                href={`https://wa.me/${CONTACTS[1].waNumber}?text=${encodeURIComponent(
                  `Halo ${CONTACTS[1].name}, saya ingin mengonfirmasi metode donasi resmi dan dukungan untuk Rumah Belajar Griya Asih Lawang.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex min-h-12 items-center justify-center gap-2.5 px-5 py-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-colors shadow-xs active:scale-[0.985] focus-ring"
              >
                <KontakIcon aria-hidden="true" className="w-4 h-4" />
                <span>Konfirmasi Donasi &amp; Dukungan</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

