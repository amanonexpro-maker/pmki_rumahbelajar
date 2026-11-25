"use client";

import * as React from "react";
import { ICON_MAP } from "@/config/icons";
import { ADDRESS, CONTACTS, HOURS, MAPS_LOCATION } from "@/config/site";
import { cn } from "@/lib/cn";

export function InfoLocationTab() {
  const [isCopied, setIsCopied] = React.useState(false);

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

  const SalinIcon = ICON_MAP.salin;
  const CentangIcon = ICON_MAP.centang;
  const KontakIcon = ICON_MAP.kontak;
  const WaktuIcon = ICON_MAP.waktu;
  const LokasiIcon = ICON_MAP.lokasi;
  const TautanLuarIcon = ICON_MAP.tautanLuar;

  return (
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
                  <KontakIcon
                    aria-hidden="true"
                    className="w-4 h-4 text-primary"
                  />
                  <span>WhatsApp {CONTACTS[1].name}</span>
                </a>
              </div>
            )}
          </div>

          {/* Verified Operational Hours Card */}
          <div className="p-5 rounded-card bg-surface-subtle border border-border space-y-3">
            <div className="flex items-center gap-2">
              <WaktuIcon
                aria-hidden="true"
                className="w-4 h-4 text-primary shrink-0"
              />
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
            Komunikasi Anda dilindungi privasi sesuai komitmen perlindungan
            data peserta didik dan keluarga besar PMKI.
          </div>
        </div>

        {/* Right Column: Physical Address (TD-ADDR Repaid) & Interactive Google Maps */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-card bg-surface border border-border shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary">
                  <LokasiIcon
                    aria-hidden="true"
                    className="w-4 h-4 shrink-0"
                  />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Alamat
                  </h3>
                </div>
                <p className="text-base font-bold text-foreground">
                  {ADDRESS.street}, {ADDRESS.rtRw}
                </p>
                <p className="text-xs sm:text-sm text-secondary-foreground leading-relaxed">
                  {ADDRESS.desa}, Kecamatan {ADDRESS.kecamatan}, Kabupaten{" "}
                  {ADDRESS.kabupaten}, {ADDRESS.provinsi} {ADDRESS.postalCode}
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
                <TautanLuarIcon
                  aria-hidden="true"
                  className="w-3.5 h-3.5 text-primary"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

