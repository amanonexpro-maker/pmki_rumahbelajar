import { CheckCircle, Compass, Heart, Target } from "lucide-react";
import type { PublicPortalDataDTO } from "../types/public-types";

export interface PublicMissionSectionProps {
  data: PublicPortalDataDTO;
}

/**
 * UI-12 Stop-Scrolling Moment 2: Mission & Inclusive Purpose (`03 §7, §13–14`, `UI-UX §6, §18`, `10 §21`).
 * - Visual Rhythm: Mission `80px` (`py-14 lg:py-20` / `--space-20`).
 * - Uses Display Typography (`Newsreader`, `type-display`) for the core mission statement.
 */
export function PublicMissionSection({ data }: PublicMissionSectionProps) {
  return (
    <section
      id="tentang"
      aria-labelledby="mission-section-heading"
      className="scroll-mt-28 py-12 sm:py-20 lg:py-24 bg-background border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 lg:space-y-16">
        {/* Editorial Mission Statement (Newsreader Display Typography) */}
        <div className="max-w-3xl space-y-4">
          <div className="type-eyebrow text-primary uppercase tracking-wider">
            Visi &amp; misi pelayanan
          </div>
          <h2
            id="mission-section-heading"
            className="type-display text-foreground tracking-tight text-balance"
          >
            {data.heroSubheadline} {data.missionHeadline}
          </h2>
          <p className="type-body text-secondary-foreground leading-relaxed">
            Rumah Belajar Griya Asih Lawang hadir untuk mewujudkan generasi
            unggul dengan kasih dan karakter luhur. Kami mendampingi peserta
            didik belajar dengan cara yang menyenangkan, kreatif, dan terbuka
            bagi semua—karena setiap anak memiliki potensi untuk bertumbuh
            ketika didampingi dengan ketulusan dan bimbingan yang tepat.
          </p>
        </div>

        {/* Two-Column Vision & Inclusive Commitment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Visi Rumah Belajar */}
          <div className="lg:col-span-6 space-y-5 rounded-card bg-surface border border-border p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Compass aria-hidden="true" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="type-title text-foreground">
                    Visi rumah belajar
                  </h3>
                  <p className="type-caption text-secondary-foreground">
                    Arah pelayanan pendidikan jangka panjang
                  </p>
                </div>
              </div>

              <ul className="space-y-4 type-body-sm text-secondary-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle
                    aria-hidden="true"
                    className="w-4 h-4 text-primary shrink-0 mt-1"
                  />
                  <span>
                    <strong className="text-foreground">
                      Rumah belajar bersama:
                    </strong>{" "}
                    Menjadi wadah belajar bersama bagi peserta didik yang
                    memiliki minat dan semangat belajar yang tangguh untuk maju.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle
                    aria-hidden="true"
                    className="w-4 h-4 text-primary shrink-0 mt-1"
                  />
                  <span>
                    <strong className="text-foreground">
                      Budaya Happy Learning:
                    </strong>{" "}
                    Mencerdaskan anak bangsa dengan membiasakan rasa senang
                    belajar sehingga peserta didik tumbuh percaya diri dan penuh
                    rasa ingin tahu.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border-subtle text-xs text-secondary-foreground">
              Seluruh kegiatan bimbingan belajar diselenggarakan tanpa pungutan
              biaya bagi masyarakat.
            </div>
          </div>

          {/* Right: Tujuan & Komitmen Inklusif */}
          <div className="lg:col-span-6 space-y-5 rounded-card bg-surface border border-border p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-warning-soft text-warning flex items-center justify-center shrink-0">
                  <Target aria-hidden="true" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="type-title text-foreground">
                    Tujuan &amp; nilai inklusif
                  </h3>
                  <p className="type-caption text-secondary-foreground">
                    Pelayanan terbuka tanpa sekat latar belakang
                  </p>
                </div>
              </div>

              <p className="type-body-sm text-secondary-foreground leading-relaxed">
                Sebagai wadah pengembangan pengetahuan dasar dan pembentukan
                mental kepribadian dengan{" "}
                <strong className="text-foreground">
                  komitmen penuh untuk melayani tanpa memandang suku, agama, dan
                  latar belakang budaya
                </strong>
                , serta melatih kemandirian belajar peserta didik demi masa
                depan yang lebih cerah.
              </p>
            </div>

            <div className="p-3.5 rounded-control bg-surface-subtle border border-border text-xs text-foreground font-medium flex items-center gap-2.5">
              <Heart
                aria-hidden="true"
                className="w-4 h-4 text-primary shrink-0"
              />
              <span>
                Terbuka bagi seluruh peserta didik di lingkungan{" "}
                {data.subDistrictsLabel}.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

