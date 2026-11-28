import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/features/identity";
import { createSupabaseServerClient } from "@/server/auth/supabase-server";

export const instant = false;

export const metadata: Metadata = {
  title: "Atur Ulang Kata Sandi | Rumah Belajar PMKI",
  description: "Tetapkan kata sandi baru untuk akun ruang kerja PMKI Anda.",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { code } = await searchParams;
  const supabase = await createSupabaseServerClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-xl font-bold text-foreground">
            Atur ulang kata sandi
          </h1>
          <p className="text-xs text-secondary-foreground">
            Masukkan kata sandi baru untuk akun Rumah Belajar PMKI Anda.
          </p>
        </div>

        <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
          <ResetPasswordForm hasValidSession={Boolean(user)} />
        </div>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-xs text-secondary-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    </div>
  );
}

