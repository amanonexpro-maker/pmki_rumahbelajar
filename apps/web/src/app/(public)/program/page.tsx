import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ICON_MAP } from "@/config/icons";
import { ADDRESS, HOURS, MAP_QUERY } from "@/config/site";
import {
  getPublicPortalData,
  ProgramDetailAccordion,
  PublicNavbar,
  VolunteerGrid,
} from "@/features/public";

export const instant = false;

export const metadata: Metadata = {
  title: "Program & Jadwal Belajar | Rumah Belajar Griya Asih Lawang",
  description:
    "Kurikulum Happy Learning (Matematika Ceria, Bahasa Inggris Praktis, Pendidikan Karakter, Kelas Khusus Membaca 1 Jam) dan jadwal belajar Sabtu 15.00–17.15 WIB di RAAL Griya Asih Lawang.",
};

/**
 * PublicProgramPage (Fase 14 Step 6: Academic Hub).
 * Server Component yang merender 4 section alur akademik berurutan:
 * 1. Header Filosofis: Emosi akademis (Newsreader font-display, tanpa tombol CTA).
 * 2. Detail Kurikulum: Accordion vertikal interaktif 4 program kanonikal.
 * 3. Jadwal & Logistik: Card highlight config-gated beraksen border-l-4 border-primary (Sabtu saja, anti-Kamis mutlak).
 * 4. Pengajar Relawan: Avatar grid 13 relawan dengan inisial circle elegan.
 */
export default async function PublicProgramPage() {
  await connection();
  const data = await getPublicPortalData();

  // Defensive anti-Kamis filter (memastikan DOM publik bebas dari jadwal Kamis)
  const saturdaySlots = data.scheduleSlots.filter(
    (slot) =>
      !slot.activity.toLowerCase().includes("kamis") &&
      !slot.description.toLowerCase().includes("kamis")
  );

  const WaktuIcon = ICON_MAP.waktu;
  const LokasiIcon = ICON_MAP.lokasi;
  const BiayaIcon = ICON_MAP.biaya;

  const formattedAddress = `${ADDRESS.street}, ${ADDRESS.rtRw}, ${ADDRESS.desa}, ${ADDRESS.kecamatan}, ${ADDRESS.kabupaten} ${ADDRESS.postalCode}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicNavbar activeSection="program" />

      <main className="flex-1 space-y-12 sm:space-y-16 lg:space-y-20 pb-16">
        {/* 1. HEADER FILOSOFIS (Emosi Akademis) */}
        <section
          id="filosofi"
          aria-labelledby="program-header-headline"
          className="bg-surface border-b border-border py-12 sm:py-16 lg:py-20"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3.5 text-left">
            <p className="type-eyebrow text-primary uppercase tracking-wider">
              Kurikulum &amp; Program Belajar
            </p>
            <h1
              id="program-header-headline"
              className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight leading-tight"
            >
              Pendampingan belajar yang hangat untuk jenjang TK hingga SMP Kelas 8.
            </h1>
            <p className="font-sans text-xs sm:text-sm text-secondary-foreground leading-relaxed max-w-3xl">
              Setiap anak memiliki kesempatan untuk berkembang. Seluruh sesi bimbingan belajar dilaksanakan setiap hari Sabtu pukul 15.00 – 17.15 WIB di RAAL Griya Asih Lawang bersama 13 pengajar relawan.
            </p>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed pt-1">
              Mendampingi setiap anak menemukan kegembiraan belajar dengan pendekatan Happy Learning yang menyenangkan, terarah, dan bermakna.
            </p>
          </div>
        </section>

        {/* 2. DETAIL KURIKULUM (Accordion Vertical) */}
        <section
          id="kurikulum"
          aria-labelledby="kurikulum-heading"
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-left scroll-mt-20"
        >
          <div className="space-y-1">
            <p className="type-eyebrow text-primary uppercase tracking-wider">
              Pilihan Kurikulum
            </p>
            <h2
              id="kurikulum-heading"
              className="font-sans text-lg sm:text-xl font-bold text-foreground tracking-tight"
            >
              Empat pilar pembelajaran terarah
            </h2>
            <p className="font-sans text-xs sm:text-sm text-muted-foreground">
              Ketuk program untuk melihat fokus materi dan capaian pembelajaran.
            </p>
          </div>

          <ProgramDetailAccordion programs={data.programs} />
        </section>

        {/* 3. JADWAL & LOGISTIK (Card Highlight, Config-Gated, Anti-Kamis) */}
        <section
          id="jadwal"
          aria-labelledby="jadwal-heading"
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20"
        >
          <div className="bg-surface-subtle border-l-4 border-primary p-5 sm:p-6 rounded-card shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="space-y-0.5">
                <span className="font-bold text-xs uppercase tracking-wider text-primary">
                  Jadwal Rutin
                </span>
                <h2
                  id="jadwal-heading"
                  className="font-sans text-base sm:text-lg font-bold text-foreground"
                >
                  Sesi Belajar Mingguan
                </h2>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-surface border border-border text-xs font-semibold text-primary">
                {BiayaIcon && <BiayaIcon aria-hidden="true" className="w-3.5 h-3.5" />}
                <span>Bebas biaya</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2.5">
                {WaktuIcon && <WaktuIcon aria-hidden="true" className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                <div>
                  <p className="font-semibold text-foreground">Waktu Belajar:</p>
                  <p className="text-secondary-foreground">{HOURS.day} • {HOURS.window}</p>
                  <p className="text-muted-foreground italic text-[11px] mt-0.5">{HOURS.arriveNote}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                {LokasiIcon && <LokasiIcon aria-hidden="true" className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                <div>
                  <p className="font-semibold text-foreground">Lokasi Sekretariat:</p>
                  <p className="text-secondary-foreground">{formattedAddress}</p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline mt-1 focus-ring rounded-control"
                  >
                    <span>Lihat lokasi di Google Maps</span>
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Susunan Alur Pembelajaran Sesi Sabtu */}
            <div className="pt-3 border-t border-border-subtle space-y-2.5">
              <p className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Alur Sesi Sabtu:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {saturdaySlots.map((slot) => (
                  <div
                    key={`${slot.time}-${slot.activity}`}
                    className="p-2.5 rounded-control bg-surface border border-border space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-primary">{slot.time}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-surface-subtle text-muted-foreground font-medium">
                        {slot.tag}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground">{slot.activity}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{slot.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. PENGAJAR RELAWAN (Avatar Grid, Data Real) */}
        <section
          id="relawan"
          aria-labelledby="relawan-heading"
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-left scroll-mt-20"
        >
          <div className="space-y-1">
            <p className="type-eyebrow text-primary uppercase tracking-wider">
              Kekuatan Komunitas
            </p>
            <h2
              id="relawan-heading"
              className="font-sans text-lg sm:text-xl font-bold text-foreground tracking-tight"
            >
              Siapa yang Mendampingi?
            </h2>
            <p className="font-sans text-xs sm:text-sm text-secondary-foreground leading-relaxed">
              Para pengajar relawan Rumah Belajar Griya Asih berdomisili di seputar Kelurahan Kalirejo dan Kelurahan Lawang. Mereka berasal dari sekolah Katolik dan sekolah negeri di Lawang yang dengan sukarela mempersembahkan waktu, keahlian, dan kasih demi masa depan peserta didik.
            </p>
          </div>

          <VolunteerGrid teachers={data.volunteerTeachers} />
        </section>

        {/* Teaser Penutup (Jembatan Halus ke Kontak / Konsultasi) */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-card bg-surface border border-border p-6 text-center space-y-2.5">
            <p className="font-sans font-bold text-sm sm:text-base text-foreground">
              Punya pertanyaan seputar kurikulum atau pendaftaran?
            </p>
            <p className="font-sans text-xs text-muted-foreground max-w-lg mx-auto">
              Pengurus kami siap membantu memberikan informasi lebih lengkap mengenai materi bimbingan dan pendampingan anak.
            </p>
            <div className="pt-2">
              <Link
                href="/kontak"
                className="inline-flex min-h-11 items-center justify-center px-6 py-2.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs sm:text-sm transition-colors duration-200 focus-ring shadow-xs"
              >
                Hubungi pengurus
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
