"use client";

import { ICON_MAP } from "@/config/icons";
import { CONTACTS } from "@/config/site";

export function DonationTab() {
  const DonasiIcon = ICON_MAP.donasi;
  const InfoIcon = ICON_MAP.info;
  const KontakIcon = ICON_MAP.kontak;

  return (
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
          Rumah Belajar Griya Asih Lawang beroperasi secara swadaya untuk
          memberikan bimbingan belajar gratis bagi anak-anak di Lawang dan
          sekitarnya. Seluruh dukungan dialokasikan langsung untuk modul latihan
          berhitung, buku bacaan literasi, dan konsumsi sehat setiap sesi
          belajar.
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
          Untuk penyaluran donasi non-tunai yang terverifikasi dan aman, silakan
          konfirmasi langsung kepada pengurus humas melalui WhatsApp.
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
              Nomor rekening resmi sedang dikonfirmasi oleh pengurus &amp;
              bendahara yayasan demi menjaga akuntabilitas, transparansi, dan
              tertib pencatatan audit.
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
  );
}

