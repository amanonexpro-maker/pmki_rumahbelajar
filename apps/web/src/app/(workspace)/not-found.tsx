import Link from "next/link";
import { Icon } from "@/components/ui";
import { ICON_MAP } from "@/config/icons";

export default function WorkspaceNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full text-center space-y-5 rounded-card bg-surface border border-border p-6 sm:p-8 shadow-xs">
        <div className="space-y-2">
          <span className="font-mono text-4xl font-bold text-primary">404</span>
          <h1 className="font-sans text-lg sm:text-xl font-bold text-foreground">
            Halaman Workspace Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-secondary-foreground leading-relaxed">
            Halaman atau berkas yang Anda akses tidak tersedia. Silakan kembali
            ke workspace untuk melanjutkan.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch justify-center gap-2.5">
          <Link
            href="/workspace"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary text-primary-foreground font-medium text-xs px-4 py-2.5 shadow-xs hover:bg-primary-hover focus-ring transition-colors"
          >
            <Icon icon={ICON_MAP.dashboard} size="sm" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

