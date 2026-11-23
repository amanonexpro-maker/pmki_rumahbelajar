import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LoginForm } from "@/features/identity";
import { getCurrentSession } from "@/server/auth/session";

export const instant = false;

export const metadata: Metadata = {
  title: "Masuk Ruang Kerja | PMKI",
  description: "Masuk ke ruang kerja operasional Platform Pelayanan Terpadu PMKI.",
};

interface LoginPageProps {
  searchParams?: Promise<{ next?: string | string[] }>;
}

function sanitizeNextUrl(next?: string | string[]): string {
  const raw = Array.isArray(next) ? next[0] : next;
  if (!raw || typeof raw !== "string") return "/workspace";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/workspace";
  if (!raw.startsWith("/workspace")) return "/workspace";
  return raw;
}

export default async function LoginPage(props: LoginPageProps) {
  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;
  const redirectTo = sanitizeNextUrl(resolvedSearchParams?.next);

  // R4: Bypass getCurrentSession() jika tidak ada cookie autentikasi sama sekali (0 RTT untuk anonim)
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        (c.name.endsWith("-auth-token") || c.name.includes("-auth-token."))
    );

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

