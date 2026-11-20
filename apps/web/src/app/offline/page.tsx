import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button, Icon } from "@/components/ui";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-card bg-surface border border-border p-8 text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-pill bg-warning-soft text-warning-foreground border border-warning-border flex items-center justify-center">
          <Icon icon={WifiOff} size="md" />
        </div>
        <h1 className="type-h3 text-foreground">Koneksi internet tidak tersedia</h1>
        <p className="type-body-sm text-secondary-foreground leading-relaxed">
          Halaman ini belum tersimpan di perangkat Anda. Periksa koneksi
          internet lalu coba muat ulang, atau kembali ke halaman utama.
        </p>
        <div className="pt-2 flex justify-center">
          <Button asChild variant="primary" size="md">
            <Link href="/">Kembali ke beranda</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

