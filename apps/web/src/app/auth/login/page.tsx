import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/identity";
import { getCurrentSession } from "@/server/auth/session";

export const instant = false;

export const metadata: Metadata = {
  title: "Masuk Ruang Kerja | PMKI",
  description: "Masuk ke ruang kerja operasional Platform Pelayanan Terpadu PMKI.",
};

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/workspace");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12">
      <LoginForm />
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-secondary-foreground hover:text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-sm px-1 py-0.5"
        >
          Kembali ke halaman publik
        </Link>
      </div>
    </div>
  );
}

