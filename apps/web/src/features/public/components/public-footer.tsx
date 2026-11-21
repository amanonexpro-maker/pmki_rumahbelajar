"use client";

import * as React from "react";
import { ICON_MAP } from "@/config/icons";
import { LEGAL, ORG, SOCIAL_LINKS, UNIT } from "@/config/site";
import { PrivacyPolicyModal } from "./privacy-policy-modal";

interface LegalModalState {
  open: boolean;
  type: "privacy" | "terms";
}

// Client-safe dynamic year via useSyncExternalStore (Next.js 16 PPR safe, fallback 2026)
const subscribe = () => () => {};
const getSnapshot = () => new Date().getFullYear();
const getServerSnapshot = () => 2026;

function useCurrentYear(): number {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * PublicFooter (Fase 14 Step 4, UI-UX §28, 03 §9).
 * Footer utilitarian 3-baris kompak tanpa duplikasi nama brand / logo.
 * - Baris 1: Ikon sosial media (config-gated via SOCIAL_LINKS; graceful absent saat kosong).
 * - Baris 2: Tautan modal legal [Kebijakan Privasi] • [Syarat & Ketentuan].
 * - Baris 3: Copyright ORG + tagline UNIT dinamis tahun berjalan.
 */
export function PublicFooter() {
  const [modalState, setModalState] = React.useState<LegalModalState>({
    open: false,
    type: "privacy",
  });

  const currentYear = useCurrentYear();

  const handleOpenModal = (type: "privacy" | "terms") => {
    setModalState({ open: true, type });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, open: false }));
  };

  const modalConfig = React.useMemo(() => {
    if (modalState.type === "privacy") {
      return {
        title: "Kebijakan Privasi",
        content: LEGAL.privacySummary,
        gracefulMsg: "Ringkasan kebijakan privasi sedang disiapkan oleh pengurus.",
      };
    }
    return {
      title: "Syarat & Ketentuan",
      content: LEGAL.termsSummary,
      gracefulMsg: "Ringkasan syarat dan ketentuan sedang disiapkan oleh pengurus.",
    };
  }, [modalState.type]);

  return (
    <footer className="border-t border-border-subtle py-8 sm:py-10 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-3 text-center">
        {/* BARIS 1: Sosial Media Row (Graceful absent saat SOCIAL_LINKS kosong) */}
        {SOCIAL_LINKS && SOCIAL_LINKS.length > 0 && (
          <div className="flex items-center justify-center gap-x-5">
            {SOCIAL_LINKS.map((link) => {
              const SocialIcon = ICON_MAP[link.platform];
              if (!SocialIcon) return null;

              return (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ikuti kami di ${link.platform}`}
                  className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-colors duration-200 focus-ring"
                >
                  <SocialIcon aria-hidden="true" className="w-5 h-5 shrink-0" />
                </a>
              );
            })}
          </div>
        )}

        {/* BARIS 2: Legal Links Row (Membuka Accessible Modal) */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenModal("privacy")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 underline-offset-2 hover:underline focus-ring rounded-control px-1 py-0.5 min-h-11 inline-flex items-center"
          >
            Kebijakan Privasi
          </button>
          <span aria-hidden="true" className="text-border-subtle text-xs select-none">
            •
          </span>
          <button
            type="button"
            onClick={() => handleOpenModal("terms")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 underline-offset-2 hover:underline focus-ring rounded-control px-1 py-0.5 min-h-11 inline-flex items-center"
          >
            Syarat &amp; Ketentuan
          </button>
        </div>

        {/* BARIS 3: Copyright Row */}
        <div className="w-full border-t border-border-subtle pt-3 mt-1">
          <p className="text-xs text-muted-foreground text-center">
            © {currentYear} {ORG.name} Hub — {UNIT.taglineFooter}
          </p>
        </div>
      </div>

      {/* Accessible Modal Legal / Bottom-Sheet */}
      <PrivacyPolicyModal
        open={modalState.open}
        onClose={handleCloseModal}
        title={modalConfig.title}
        content={modalConfig.content}
        gracefulMsg={modalConfig.gracefulMsg}
      />
    </footer>
  );
}
