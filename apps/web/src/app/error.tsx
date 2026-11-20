"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Global Application Error Boundary (`10 §14`, `AGENTS.md`: DILARANG kode teknis/stack/SQL/secrets ke UI).
 */
export default function GlobalAppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div
        role="alert"
        className="rounded-card bg-surface border border-border p-8 max-w-lg w-full text-center space-y-4"
      >
        <div className="w-11 h-11 rounded-pill bg-warning-soft text-warning flex items-center justify-center mx-auto">
          <AlertTriangle aria-hidden="true" className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h1 className="type-title text-foreground">
            Terjadi kendala saat memuat halaman
          </h1>
          <p className="type-body-sm text-secondary-foreground leading-relaxed">
            Mohon maaf atas ketidaknyamanan ini. Silakan coba muat ulang halaman
            atau kembali ke beranda utama.
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="primary" size="md" onClick={reset}>
            <RotateCcw aria-hidden="true" className="w-4 h-4 mr-2" />
            <span>Coba muat ulang</span>
          </Button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-control border border-border bg-surface hover:bg-surface-subtle px-4 py-2 text-sm font-semibold text-foreground focus-ring"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </main>
  );
}

