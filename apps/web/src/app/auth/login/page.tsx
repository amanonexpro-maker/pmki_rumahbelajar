import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LoginForm } from "@/features/identity";
import { hasSupabaseAuthCookie } from "@/server/auth/cookie";
import { sanitizeRedirectUrl } from "@/server/auth/redirect";
import { getCurrentSession } from "@/server/auth/session";

export const instant = false;

export const metadata: Metadata = {
  title: "Masuk Ruang Kerja | PMKI",
  description: "Masuk ke ruang kerja operasional Platform Pelayanan Terpadu PMKI.",
};

interface LoginPageProps {
  searchParams?: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage(props: LoginPageProps) {
  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;
  const rawNext = Array.isArray(resolvedSearchParams?.next)
    ? resolvedSearchParams.next[0]
    : resolvedSearchParams?.next;
  const redirectTo = sanitizeRedirectUrl(rawNext);

  // R4: Bypass getCurrentSession() jika tidak ada cookie autentikasi sama sekali (0 RTT untuk anonim)
  const cookieStore = await cookies();
  const hasAuthCookie = hasSupabaseAuthCookie(cookieStore.getAll());

  if (hasAuthCookie) {
    const session = await getCurrentSession();
    if (session) {
      redirect(redirectTo);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12">
      <LoginForm redirectTo={redirectTo} />
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

