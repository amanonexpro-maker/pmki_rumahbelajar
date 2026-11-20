import Link from "next/link";
import {
  Building,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";

/**
 * UI-12 Institutional Public Footer (`07 §14`, `10 §5`, `10 §21`).
 * Warm, trustworthy community orientation with direct WhatsApp links and privacy assurance.
 */
export function PublicFooter() {
  return (
    <footer className="bg-surface-subtle text-secondary-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Identity & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-control bg-surface border border-border-subtle flex items-center justify-center shrink-0 overflow-hidden">
                <picture className="flex items-center justify-center">
                  <source srcSet="/pmki_logo.svg" type="image/svg+xml" />
                  <img
                    src="/pmki_logo.png"
                    alt="Logo PMKI - Rumah Belajar Griya Asih Lawang"
                    width={36}
                    height={36}
                    className="w-8 h-8 object-contain"
                    loading="lazy"
                  />
                </picture>
              </div>
              <div>
                <h2 className="text-foreground font-bold text-base leading-tight">
                  Rumah Belajar Griya Asih
                </h2>
                <p className="text-xs text-primary font-medium">
                  PMKI Mupel Jawa Timur
                </p>
              </div>
            </div>
            <p className="type-body-sm text-secondary-foreground leading-relaxed">
              Rumah belajar yang terbuka bagi semua. Mendampingi peserta didik
              bertumbuh lewat pendekatan Happy Learning, mengembangkan nalar
              kreatif, dan memupuk karakter luhur tanpa memandang latar belakang
              suku maupun agama.
            </p>
            <p className="pt-1 text-xs text-warning font-semibold italic">
              &ldquo;Belajar itu bukan tentang menjadi sempurna, tetapi tentang
              menjadi lebih baik setiap hari.&rdquo;
            </p>
          </div>

          {/* Column 2: Program & Layanan */}
          <div className="space-y-4">
            <h3 className="text-foreground font-bold text-xs tracking-wider uppercase border-b border-border pb-2">
              Program pembelajaran
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-secondary-foreground">
              <li>
                <Link
                  href="/program"
                  className="inline-flex min-h-9 items-center hover:text-primary transition-colors text-left focus-ring rounded-xs"
                >
                  Bimbingan Matematika &amp; Berhitung Ceria
                </Link>
              </li>
              <li>
                <Link
                  href="/program"
                  className="inline-flex min-h-9 items-center hover:text-primary transition-colors text-left focus-ring rounded-xs"
                >
                  Bahasa Inggris Praktis &amp; Percakapan
                </Link>
              </li>
              <li>
                <Link
                  href="/program"
                  className="inline-flex min-h-9 items-center hover:text-primary transition-colors text-left focus-ring rounded-xs"
                >
                  Pendidikan Karakter &amp; Budi Pekerti
                </Link>
              </li>
              <li>
                <Link
                  href="/program"
                  className="inline-flex min-h-9 items-center hover:text-primary transition-colors text-left focus-ring rounded-xs"
                >
                  Kelas Khusus Membaca (Literasi 1 jam)
                </Link>
              </li>
              <li>
                <Link
                  href="/program"
                  className="inline-flex min-h-9 items-center hover:text-primary transition-colors text-left focus-ring rounded-xs"
                >
                  Pemantapan Ujian SD &amp; SMP Kelas 7 – 8
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Jadwal & Lokasi */}
          <div className="space-y-4">
            <h3 className="text-foreground font-bold text-xs tracking-wider uppercase border-b border-border pb-2">
              Jadwal &amp; lokasi belajar
            </h3>
            <div className="space-y-3 text-xs sm:text-sm text-secondary-foreground">
              <div className="flex items-start gap-2.5">
                <Calendar
                  aria-hidden="true"
                  className="w-4 h-4 text-primary shrink-0 mt-0.5"
                />
                <span>
                  Setiap hari <strong className="text-foreground">Sabtu</strong>
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock
                  aria-hidden="true"
                  className="w-4 h-4 text-primary shrink-0 mt-0.5"
                />
                <span>
                  Pukul{" "}
                  <strong className="text-foreground">
                    15.00 s/d 17.15 WIB
                  </strong>
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin
                  aria-hidden="true"
                  className="w-4 h-4 text-primary shrink-0 mt-0.5"
                />
                <span>
                  RAAL (Rumah Asuh Anak &amp; Lansia) &ldquo;Griya Asih&rdquo;,
                  Lawang, Kab. Malang, Jawa Timur
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    (Wilayah Kelurahan Kalirejo &amp; Kelurahan Lawang)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Column 4: Kontak Pengurus */}
          <div className="space-y-4">
            <h3 className="text-foreground font-bold text-xs tracking-wider uppercase border-b border-border pb-2">
              Hubungi pengurus
            </h3>
            <div className="space-y-3 text-xs sm:text-sm text-secondary-foreground">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Koordinator pelayanan:
                </span>
                <a
                  href="https://wa.me/628123235318"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hubungi Ms. Evi melalui WhatsApp"
                  className="inline-flex min-h-10 items-center gap-2 text-foreground font-medium hover:text-primary mt-0.5 focus-ring rounded-xs"
                >
                  <Phone aria-hidden="true" className="w-4 h-4 text-primary" />
                  <span>Ms. Evi (+62 812-323-5318)</span>
                </a>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">
                  Pengurus &amp; humas:
                </span>
                <a
                  href="https://wa.me/6281332987491"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hubungi Ms. Lilian melalui WhatsApp"
                  className="inline-flex min-h-10 items-center gap-2 text-foreground font-medium hover:text-primary mt-0.5 focus-ring rounded-xs"
                >
                  <Phone aria-hidden="true" className="w-4 h-4 text-primary" />
                  <span>Ms. Lilian (+62 813-3298-7491)</span>
                </a>
              </div>

              <div className="pt-2">
                <Link
                  href="/workspace"
                  className="w-full min-h-11 py-2.5 px-3 text-xs font-semibold rounded-control bg-surface hover:bg-surface-subtle text-foreground border border-border transition-colors flex items-center justify-center gap-2 focus-ring shadow-xs"
                >
                  <Building
                    aria-hidden="true"
                    className="w-4 h-4 text-primary"
                  />
                  <span>Akses portal pengurus &amp; pengajar</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Privacy Assurance */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div>
            <span>
              © 2026 Platform Pelayanan Terpadu PMKI. Pilot: Rumah Belajar Griya
              Asih Lawang.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-secondary-foreground">
              <ShieldCheck
                aria-hidden="true"
                className="w-4 h-4 text-primary"
              />
              <span>Perlindungan privasi peserta didik &amp; data aman</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

