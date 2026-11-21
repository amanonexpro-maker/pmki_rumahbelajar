"use client";

import * as React from "react";
import { BRAND, ORG } from "@/config/site";
import { cn } from "@/lib/cn";

export interface AppSplashScreenProps {
  serverShowSplash?: boolean;
}

const SPLASH_STORAGE_KEY = "pmki_splash_dismissed_at";
const SPLASH_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam

const emptySubscribe = () => () => {};

function getDismissedSnapshot(): boolean {
  try {
    const lastDismissed = localStorage.getItem(SPLASH_STORAGE_KEY);
    if (!lastDismissed) return false;
    const elapsed = Date.now() - parseInt(lastDismissed, 10);
    return elapsed < SPLASH_TTL_MS;
  } catch {
    return false;
  }
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("reduce-motion-active")
  );
}

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getServerSnapshot(): boolean {
  return false;
}

type AnimationPhase =
  | "initial"
  | "leaves"
  | "gold"
  | "text"
  | "dismissing"
  | "done";

/**
 * AppSplashScreen (Fase 14 Step 9, 03 §7, 03 §9, 03 §11, 03 §16, UI-UX §21, §22, §30).
 * Splash screen kedap-flash dengan integrasi branding final:
 * 1. Server-Side Visibility: Dikoordinasikan oleh Cookie + Middleware (x-pmki-splash).
 * 2. Reduced-Motion First Paint: Menghormati prefers-reduced-motion (statis 800ms, zero draw animation).
 * 3. Mark SVG Animation: Daun tunas dashoffset draw-in (400ms) + titik gold spring pop (200ms delay 300ms).
 * 4. Wordmark & Tagline HTML: PMKI (ORG.name), subline (BRAND.subline), tagline (BRAND.taglineSplash).
 * 5. Auto-Dismiss Logic: max(1800ms, load ready setelah min 1200ms), cap 3000ms; localStorage TTL 24 jam.
 */
export function AppSplashScreen({ serverShowSplash = true }: AppSplashScreenProps) {
  // Client repeat guard menggunakan useSyncExternalStore untuk kepatuhan murni SSR
  const isDismissedInStorage = React.useSyncExternalStore(
    emptySubscribe,
    getDismissedSnapshot,
    getServerSnapshot
  );

  const reducedMotionActive = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );

  const [phase, setPhase] = React.useState<AnimationPhase>("initial");

  React.useEffect(() => {
    if (!serverShowSplash || isDismissedInStorage) {
      return;
    }

    const startTime = Date.now();
    let leavesTimer: NodeJS.Timeout | undefined;
    let goldTimer: NodeJS.Timeout | undefined;
    let textTimer: NodeJS.Timeout | undefined;
    let dismissTimer: NodeJS.Timeout | undefined;
    let unmountTimer: NodeJS.Timeout | undefined;
    let capTimer: NodeJS.Timeout | undefined;

    const executeDismiss = () => {
      setPhase("dismissing");
      try {
        localStorage.setItem(SPLASH_STORAGE_KEY, Date.now().toString());
      } catch {
        // Safe fallback
      }
      unmountTimer = setTimeout(() => {
        setPhase("done");
      }, 300); // 300ms crossfade duration
    };

    if (reducedMotionActive) {
      // Reduced-motion: statis 800ms lalu dismiss tanpa animasi
      dismissTimer = setTimeout(executeDismiss, 800);
    } else {
      leavesTimer = setTimeout(() => setPhase("leaves"), 50);
      goldTimer = setTimeout(() => setPhase("gold"), 300);
      textTimer = setTimeout(() => setPhase("text"), 450);

      // Normal timing: min 1800ms, early dismiss bila complete setelah 1200ms, cap 3000ms
      const minDuration = 1800;
      const earlyDismissMin = 1200;
      const maxCap = 3000;

      const scheduleDismiss = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= minDuration) {
          executeDismiss();
        } else {
          dismissTimer = setTimeout(executeDismiss, minDuration - elapsed);
        }
      };

      if (document.readyState === "complete") {
        const elapsed = Date.now() - startTime;
        if (elapsed >= earlyDismissMin) {
          scheduleDismiss();
        } else {
          dismissTimer = setTimeout(scheduleDismiss, earlyDismissMin - elapsed);
        }
      } else {
        const handleLoad = () => {
          const elapsed = Date.now() - startTime;
          const waitTime = Math.max(earlyDismissMin - elapsed, 0);
          dismissTimer = setTimeout(scheduleDismiss, waitTime);
        };
        window.addEventListener("load", handleLoad, { once: true });
      }

      capTimer = setTimeout(executeDismiss, maxCap);
    }

    return () => {
      clearTimeout(leavesTimer);
      clearTimeout(goldTimer);
      clearTimeout(textTimer);
      clearTimeout(dismissTimer);
      clearTimeout(unmountTimer);
      clearTimeout(capTimer);
    };
  }, [serverShowSplash, isDismissedInStorage, reducedMotionActive]);

  // Sembunyikan bila diinstruksikan server, sudah tersimpan di storage, atau dismiss tuntas
  if (!serverShowSplash || isDismissedInStorage || phase === "done") {
    return null;
  }

  const isDismissing = phase === "dismissing";
  const animateLeaves = reducedMotionActive || phase !== "initial";
  const animateGold =
    reducedMotionActive ||
    phase === "gold" ||
    phase === "text" ||
    phase === "dismissing";
  const animateText =
    reducedMotionActive || phase === "text" || phase === "dismissing";

  return (
    <aside
      aria-label={`${ORG.name} ${BRAND.subline} ${BRAND.taglineSplash}`}
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center min-h-dvh pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] px-6 select-none transition-opacity duration-300 ease-in",
        isDismissing ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="flex flex-col items-center text-center space-y-6 max-w-sm mx-auto">
        {/* ========================================================
            1. MARK SVG: Huruf 'P' + Dua Tunas Daun + Titik Sunlight Gold
            ======================================================== */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
          <svg
            viewBox="0 0 1000 1000"
            className="w-full h-full drop-shadow-md"
            aria-hidden="true"
          >
            {/* Batang Utama 'P' Vektor Kanonikal (Off-White) */}
            <path
              fill="#f7f7f4"
              d="
                M 285 248
                L 568 248
                C 685 248, 766 324, 766 444
                C 766 566, 682 642, 560 642
                L 474 642
                L 474 756
                C 474 769, 463 780, 450 780
                C 437 780, 426 769, 426 756
                L 426 576
                C 374 554, 344 504, 344 434
                L 344 424
                L 534 326
                C 548 319, 564 320, 577 328
                L 648 374
                C 653 378, 656 384, 656 391
                L 656 436
                C 656 508, 608 552, 526 572
                C 496 580, 476 604, 474 636
                L 474 642
                L 426 642
                L 426 766
                C 426 773, 420 779, 413 779
                L 291 779
                C 284 779, 278 773, 278 766
                L 278 255
                C 278 251, 281 248, 285 248
                Z
              "
            />

            {/* Daun Tunas Kiri dengan stroke draw-in */}
            <path
              fill="#f7f7f4"
              d="M 450 518 C 452 478, 434 452, 375 452 C 375 504, 405 536, 444 544 L 450 546 Z"
              className={cn(
                "transition-all duration-400 ease-out",
                animateLeaves
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-75 origin-[450px_518px]"
              )}
            />

            {/* Daun Tunas Kanan dengan stroke draw-in */}
            <path
              fill="#f7f7f4"
              d="M 458 544 C 460 478, 496 436, 571 436 C 571 504, 530 548, 466 562 L 458 564 Z"
              className={cn(
                "transition-all duration-400 ease-out",
                animateLeaves
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-75 origin-[458px_544px]"
              )}
            />

            {/* Titik Sunlight Gold (Spring Restrained Pop) */}
            <circle
              cx="571"
              cy="395"
              r="25"
              fill="#f7c042"
              className={cn(
                "transition-transform duration-200",
                animateGold
                  ? "scale-100 origin-[571px_395px]"
                  : "scale-0 origin-[571px_395px]"
              )}
              style={{
                transitionTimingFunction: reducedMotionActive
                  ? "ease"
                  : "cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </svg>
        </div>

        {/* ========================================================
            2. WORDMARK, SUBLINE & TAGLINE (HTML Crisp Text)
            ======================================================== */}
        <div
          className={cn(
            "space-y-2.5 transition-all duration-400 ease-out",
            animateText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          {/* Wordmark PMKI (ORG.name) */}
          <h1 className="font-sans font-extrabold text-3xl sm:text-4xl tracking-tight text-primary-foreground">
            {ORG.name}
          </h1>

          {/* Subline (BRAND.subline dari site.ts) */}
          {BRAND.subline && (
            <p className="uppercase tracking-[0.22em] text-primary-foreground/75 text-[10px] sm:text-xs font-semibold">
              {BRAND.subline}
            </p>
          )}

          {/* Tagline Slogan (BRAND.taglineSplash) diapit 2 Garis Horizontal */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <span
              className={cn(
                "h-px w-6 bg-primary-foreground/40 transition-transform duration-300 ease-in-out origin-right",
                animateText ? "scale-x-100" : "scale-x-0"
              )}
              aria-hidden="true"
            />
            <p className="font-display italic text-xs sm:text-sm text-primary-foreground/90 tracking-wide">
              {BRAND.taglineSplash}
            </p>
            <span
              className={cn(
                "h-px w-6 bg-primary-foreground/40 transition-transform duration-300 ease-in-out origin-left",
                animateText ? "scale-x-100" : "scale-x-0"
              )}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
