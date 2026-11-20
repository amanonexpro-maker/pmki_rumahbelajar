"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Workspace Human-Friendly Error Boundary (`10 §14`, `AGENTS.md`: DILARANG kode teknis/stack/SQL/secrets ke UI).
 */
export default function WorkspaceErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-card bg-surface border border-border p-8 max-w-xl mx-auto my-12 text-center space-y-4"
    >
      <div className="w-11 h-11 rounded-pill bg-warning-soft text-warning flex items-center justify-center mx-auto">
        <AlertTriangle aria-hidden="true" className="w-5 h-5" />
      </div>
      <div className="space-y-1.5">
        <h2 className="type-title text-foreground">
          Gagal memuat halaman ruang kerja
        </h2>
        <p className="type-body-sm text-secondary-foreground leading-relaxed">
          Terjadi kendala sementara saat menyiapkan data pelayanan. Silakan muat
          ulang bagian ini atau periksa koneksi internet Anda.
        </p>
      </div>
      <div className="pt-2">
        <Button type="button" variant="primary" size="md" onClick={reset}>
          <RotateCcw aria-hidden="true" className="w-4 h-4 mr-2" />
          <span>Coba muat ulang</span>
        </Button>
      </div>
    </div>
  );
}

