"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import {
  loginAction,
  requestPasswordResetAction,
} from "../actions/auth-actions";

export interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = "/workspace" }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"login" | "recovery">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setPending(true);

    try {
      const result = await loginAction({ email, password });
      if (!result.success) {
        setErrorMessage(result.error.message);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleRecoverySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setPending(true);

    try {
      const result = await requestPasswordResetAction({ email });
      if (!result.success) {
        setErrorMessage(result.error.message);
        return;
      }
      setSuccessMessage(
        "Jika alamat email terdaftar, tautan pemulihan kata sandi telah dikirim."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      aria-labelledby="auth-form-title"
      className="w-full max-w-md rounded-card border border-border bg-surface p-6 sm:p-8"
    >
      <header className="space-y-2 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-control bg-surface border border-border-subtle flex items-center justify-center shrink-0 overflow-hidden">
            <picture className="flex items-center justify-center">
              <source srcSet="/pmki_logo.svg" type="image/svg+xml" />
              <img
                src="/pmki_logo.png"
                alt="Logo PMKI - Rumah Belajar Griya Asih Lawang"
                width={36}
                height={36}
                className="w-8 h-8 object-contain"
                loading="eager"
              />
            </picture>
          </div>
          <div>
            <p className="text-xs font-semibold text-primary leading-tight">
              PMKI Jawa Timur
            </p>
            <p className="text-[11px] text-secondary-foreground leading-tight">
              Platform Pelayanan Terpadu
            </p>
          </div>
        </div>
        <h1
          id="auth-form-title"
          className="text-xl font-semibold text-foreground"
        >
          {mode === "login"
            ? "Masuk ke ruang kerja"
            : "Pulihkan kata sandi"}
        </h1>
        <p className="text-sm text-secondary-foreground">
          {mode === "login"
            ? "Gunakan akun resmi yang diberikan oleh Administrator Platform."
            : "Masukkan alamat email akun Anda untuk menerima tautan pemulihan."}
        </p>
      </header>

      <div className="space-y-5">
        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            <p className="font-semibold">Gagal melanjutkan</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
          >
            <p className="font-semibold">Permintaan diterima</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-foreground"
              >
                Alamat email
              </label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@pmki.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-foreground"
                >
                  Kata sandi
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("recovery");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-sm px-1 py-0.5 min-h-11 inline-flex items-center"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={pending}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={pending}
            >
              {pending ? "Memeriksa akun..." : "Masuk ke ruang kerja"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRecoverySubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="recovery-email"
                className="block text-sm font-medium text-foreground"
              >
                Alamat email
              </label>
              <Input
                id="recovery-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@pmki.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={pending}
              >
                {pending ? "Mengirim tautan..." : "Kirim tautan pemulihan"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={pending}
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
              >
                Kembali ke halaman masuk
              </Button>
            </div>
          </form>
        )}

        <p className="text-xs text-muted-foreground pt-3 border-t border-border">
          Pendaftaran akun baru dilakukan secara terpusat oleh Administrator Platform.
        </p>
      </div>
    </section>
  );
}
