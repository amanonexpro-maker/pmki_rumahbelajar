"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button, Icon } from "@/components/ui";

/**
 * Turbopack-safe PWA Service Worker registration (06 §21).
 * Surfaces calm "Perbarui sekarang / Nanti" banner when a new SW is waiting.
 */
export function PwaRegister() {
  const [waitingWorker, setWaitingWorker] =
    React.useState<ServiceWorker | null>(null);

  React.useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    let isMounted = true;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (!isMounted) return;
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
        }
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(installing);
            }
          });
        });
      })
      .catch(() => {
        // Silent fail on unsupported environments; never block app rendering.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!waitingWorker) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-card border border-border bg-surface p-4 shadow-overlay space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <Icon icon={RefreshCw} size="sm" className="text-primary mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            Pembaruan aplikasi tersedia
          </p>
          <p className="type-caption text-secondary-foreground">
            Muat ulang untuk mendapatkan versi terbaru platform PMKI.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWaitingWorker(null)}
        >
          Nanti
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            waitingWorker.postMessage({ type: "SKIP_WAITING" });
            window.location.reload();
          }}
        >
          Perbarui sekarang
        </Button>
      </div>
    </div>
  );
}

