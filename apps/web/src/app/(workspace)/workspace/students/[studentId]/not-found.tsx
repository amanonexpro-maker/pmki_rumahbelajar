import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Button, Icon } from "@/components/ui";

export default function StudentDetailNotFound() {
  return (
    <div className="mx-auto max-w-lg py-12 px-4">
      <div className="rounded-card border border-border bg-surface p-6 sm:p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-card bg-surface-subtle text-muted-foreground">
          <Icon icon={Users} size="md" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold text-foreground">
            Peserta didik tidak ditemukan
          </h1>
          <p className="text-sm text-secondary-foreground leading-relaxed">
            Data peserta didik tidak tersedia, sudah diarsipkan, atau Anda tidak
            memiliki akses pada unit layanan terkait.
          </p>
        </div>
        <div className="pt-2">
          <Button asChild variant="primary" className="w-full sm:w-auto">
            <Link href="/workspace/students">
              <Icon icon={ArrowLeft} size="xs" />
              <span>Kembali ke daftar peserta didik</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

