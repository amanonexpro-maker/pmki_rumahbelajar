import Link from "next/link";
import {
  ArrowRight,
  Building,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { PublicRegistrationWizard } from "@/features/students";
import { ADDRESS } from "@/config/site";
import { cn } from "@/lib/cn";
import type { PublicCoordinatorContactDTO } from "../types/public-types";
import { PublicContactForm } from "./public-contact-form";

export interface PublicRegistrationCtaSectionProps {
  ctaHeadline: string;
  locationFull: string;
  coordinators: PublicCoordinatorContactDTO[];
  embedRegistrationWizard?: boolean;
}

/**
 * UI-12 Stop-Scrolling Moment 4: Registration CTA, Offline-Ready Registration Flow,
 * and Warm Community Contact (`03 §7`, `UI-UX §6, §18`, `06 §18`, `10 §21`).
 * - Visual Rhythm: CTA `80px` (`py-14 lg:py-20` / `--space-20`).
 * - Uses `Newsreader` Display Typography (`type-display`) for the registration invitation.
 * - Server Component shell that composes `PublicRegistrationWizard` (from `@/features/students` Public API)
 *   and `PublicContactForm` client leaf.
 */
export function PublicRegistrationCtaSection({
  ctaHeadline,
  coordinators,
  embedRegistrationWizard = true,
}: PublicRegistrationCtaSectionProps) {
  return (
    <div className="divide-y divide-border">
      {/* Stop-Scrolling Moment 4: Registration CTA & Wizard (80px rhythm) */}
      <section
        id="pendaftaran"
        aria-labelledby="registration-cta-heading"
        className="scroll-mt-28 py-12 sm:py-20 lg:py-24 bg-background"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl space-y-4">
            <div className="type-eyebrow text-primary uppercase tracking-wider">
              Pendaftaran peserta didik baru
            </div>
            <h2
              id="registration-cta-heading"
              className="type-display text-foreground tracking-tight text-balance"
            >
              {ctaHeadline}
            </h2>
            <p className="type-body text-secondary-foreground leading-relaxed">
              Setiap anak memiliki kesempatan untuk berkembang. Silakan isi
              formulir pendaftaran di bawah ini. Data pribadi peserta didik
              dilindungi secara ketat, dan{" "}
              <strong className="text-foreground">
                persetujuan publikasi foto atau video bersifat sukarela
              </strong>{" "}
              serta tidak mempengaruhi keikutsertaan peserta didik dalam
              kegiatan belajar.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-secondary-foreground">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-surface border border-border">
                <ShieldCheck
                  aria-hidden="true"
                  className="w-3.5 h-3.5 text-primary"
                />
                <span>
                  Mendukung pengisian saat luring (antrean pengiriman otomatis
                  saat koneksi kembali)
                </span>
              </span>
              <Link
                href="/pendaftaran"
                className="inline-flex min-h-9 items-center gap-1 text-primary font-semibold hover:underline focus-ring rounded-xs px-1"
              >
                <span>Buka halaman pendaftaran penuh</span>
                <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {embedRegistrationWizard && (
            <div className="max-w-3xl">
              <PublicRegistrationWizard />
            </div>
          )}
        </div>
      </section>

      {/* Community Contact & WhatsApp Inquiry (80px rhythm) */}
      <section
        id="kontak"
        aria-labelledby="contact-section-heading"
        className="scroll-mt-28 py-14 lg:py-20 bg-surface"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-3">
            <div className="type-eyebrow text-primary uppercase tracking-wider">
              Hubungi pengurus
            </div>
            <h2
              id="contact-section-heading"
              className="type-section-title text-foreground tracking-tight"
            >
              Punya pertanyaan atau ingin melayani sebagai pengajar relawan?
            </h2>
            <p className="type-body-sm text-secondary-foreground leading-relaxed">
              Kami dengan senang hati menyambut orang tua wali, calon peserta
              didik, maupun rekan pengajar relawan yang rindu melayani bersama
              demi masa depan anak-anak Lawang.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Direct WhatsApp Contact Cards */}
            <div className="lg:col-span-5 space-y-4">
              {coordinators.map((coord) => (
                <div
                  key={coord.name}
                  className="p-6 rounded-card bg-background border border-border space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-control flex items-center justify-center font-bold text-base shrink-0",
                        coord.accentTone === "primary"
                          ? "bg-primary-soft text-primary"
                          : "bg-learning-soft text-learning"
                      )}
                    >
                      {coord.initials}
                    </div>
                    <div>
                      <h3 className="type-title text-foreground">
                        {coord.name}
                      </h3>
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          coord.accentTone === "primary"
                            ? "text-primary"
                            : "text-learning"
                        )}
                      >
                        {coord.roleLabel}
                      </p>
                      <p className="type-caption text-secondary-foreground">
                        {coord.institutionLabel}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-foreground tabular-nums">
                      {coord.phoneDisplay}
                    </span>
                    <a
                      href={coord.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Hubungi ${coord.name} melalui WhatsApp`}
                      className="inline-flex min-h-11 items-center gap-1.5 px-4 py-2 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold shadow-xs transition-colors focus-ring"
                    >
                      <MessageCircle
                        aria-hidden="true"
                        className="w-3.5 h-3.5"
                      />
                      <span>Hubungi via WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}

              {/* Location & Secretariat Strip */}
              <div className="p-5 rounded-card bg-surface-subtle border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-control bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <Building
                      aria-hidden="true"
                      className="w-4 h-4 text-primary"
                    />
                  </div>
                  <div className="text-xs leading-relaxed space-y-1">
                    <p className="font-semibold text-foreground">
                      Alamat sekretariat &amp; lokasi belajar:
                    </p>
                    <p className="text-secondary-foreground">
                      {ADDRESS.street}, {ADDRESS.rtRw}, {ADDRESS.desa}, Kecamatan {ADDRESS.kecamatan}, Kabupaten {ADDRESS.kabupaten}.
                    </p>
                    <p className="text-primary font-medium pt-0.5">
                      Pelayanan Terpadu PMKI Mupel Jawa Timur
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Direct Message Composer */}
            <div className="lg:col-span-7 bg-background p-6 sm:p-8 rounded-card border border-border">
              <h3 className="type-h3 text-foreground mb-1">
                Kirim pesan atau konfirmasi cepat
              </h3>
              <p className="type-caption text-secondary-foreground mb-6 leading-relaxed">
                Pesan Anda akan terhubung langsung ke WhatsApp resmi pengurus
                Rumah Belajar Griya Asih Lawang.
              </p>

              <PublicContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
