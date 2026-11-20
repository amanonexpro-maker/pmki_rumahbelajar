import type { Metadata } from "next";
import { connection } from "next/server";
import {
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  getPublicPortalData,
  PublicContactForm,
  PublicFooter,
  PublicNavbar,
} from "@/features/public";

export const instant = false;

export const metadata: Metadata = {
  title: "Kontak & Lokasi | Rumah Belajar Griya Asih Lawang",
  description:
    "Informasi kontak pengurus, alamat sekretariat RAAL Griya Asih Lawang, jadwal bimbingan belajar Sabtu 15.00–17.15 WIB, dan jalur komunikasi resmi melalui WhatsApp.",
};

export default async function PublicContactPage() {
  await connection();
  const data = await getPublicPortalData();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicNavbar activeSection="kontak" />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Page Header */}
          <div className="max-w-3xl space-y-3">
            <p className="type-eyebrow text-primary uppercase tracking-wider">
              Kontak &amp; Pelayanan
            </p>
            <h1 className="type-display text-foreground tracking-tight">
              Hubungi kami
            </h1>
            <p className="type-body text-secondary-foreground">
              Kami siap membantu Anda mendaftar atau menjawab pertanyaan seputar
              kegiatan bimbingan belajar di {data.serviceUnitName}.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Direct WhatsApp Quick Actions & Verified Operational Location */}
            <div className="lg:col-span-6 space-y-6">
              {/* WhatsApp Quick Action Cards (Touch Target >= 44px) */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                  Jalur komunikasi langsung (WhatsApp)
                </h2>

                {/* Ms. Evi Card */}
                <div className="p-5 rounded-card bg-surface border border-border shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium">
                        Koordinator pelayanan bimbingan belajar &amp; pendaftaran
                      </p>
                      <h3 className="text-base font-bold text-foreground">
                        Ms. Evi
                      </h3>
                      <p className="text-xs text-secondary-foreground font-mono">
                        +62 812-323-5318
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-pill bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      <Phone aria-hidden="true" className="w-5 h-5" />
                    </div>
                  </div>

                  <a
                    href="https://wa.me/628123235318"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex min-h-12 items-center justify-center gap-2.5 px-5 py-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-colors shadow-xs active:scale-[0.985] focus-ring"
                  >
                    <MessageCircle aria-hidden="true" className="w-4 h-4" />
                    <span>Chat WhatsApp Ms. Evi (Pengurus)</span>
                  </a>
                </div>

                {/* Ms. Lilian Card */}
                <div className="p-5 rounded-card bg-surface border border-border shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium">
                        Pengurus, humas, dan konfirmasi kegiatan belajar
                      </p>
                      <h3 className="text-base font-bold text-foreground">
                        Ms. Lilian
                      </h3>
                      <p className="text-xs text-secondary-foreground font-mono">
                        +62 813-3298-7491
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-pill bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      <Phone aria-hidden="true" className="w-5 h-5" />
                    </div>
                  </div>

                  <a
                    href="https://wa.me/6281332987491"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex min-h-12 items-center justify-center gap-2.5 px-5 py-3 rounded-control bg-surface hover:bg-surface-subtle text-foreground border border-border font-semibold text-sm transition-colors shadow-xs active:scale-[0.985] focus-ring"
                  >
                    <MessageCircle aria-hidden="true" className="w-4 h-4 text-primary" />
                    <span>Chat WhatsApp Ms. Lilian (Publikasi)</span>
                  </a>
                </div>
              </div>

              {/* Location & Saturday Schedule Card */}
              <div className="p-5 rounded-card bg-surface-subtle border border-border space-y-4">
                <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                  Jadwal &amp; alamat belajar
                </h2>

                <div className="space-y-3 text-xs sm:text-sm text-secondary-foreground">
                  <div className="flex items-start gap-3">
                    <Calendar aria-hidden="true" className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {data.scheduleDay}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sesi tatap muka bersama pengajar relawan
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock aria-hidden="true" className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">
                        Pukul {data.scheduleHours}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Waktu Indonesia Barat (WIB)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin aria-hidden="true" className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {data.locationFull}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.subDistrictsLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="https://maps.google.com/?q=RAAL+Griya+Asih+Lawang"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus-ring rounded-xs"
                  >
                    <span>Buka petunjuk arah di Google Maps</span>
                    <ExternalLink aria-hidden="true" className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Privacy Assurance Note */}
              <div className="flex items-center gap-2 p-3.5 rounded-control bg-surface border border-border-subtle text-xs text-secondary-foreground">
                <ShieldCheck aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Komunikasi Anda dilindungi privasi sesuai komitmen perlindungan data peserta didik dan keluarga PMKI.
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Form Message Composer */}
            <div className="lg:col-span-6">
              <div className="p-6 sm:p-8 rounded-card bg-surface border border-border shadow-xs space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Kirim pesan atau konfirmasi cepat
                  </h2>
                  <p className="text-xs text-secondary-foreground leading-relaxed">
                    Tuliskan nama dan pesan Anda. Formulir ini akan membantu Anda membuka WhatsApp dengan pesan yang sudah terstruktur.
                  </p>
                </div>

                <PublicContactForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

