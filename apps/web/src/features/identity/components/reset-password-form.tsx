"use client";

import * as React from "react";
import Link from "next/link";
import { FeedbackBanner } from "@/components/patterns";
import { Button, Input } from "@/components/ui";
import { changeMyPasswordAction } from "../actions/auth-actions";

export interface ResetPasswordFormProps {
  hasValidSession: boolean;
}

export function ResetPasswordForm({ hasValidSession }: ResetPasswordFormProps) {
  const newPassId = React.useId();
  const confirmPassId = React.useId();

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasValidSession || pending) return;
    setPending(true);
    setErrorMessage(null);

    try {
      const res = await changeMyPasswordAction({
        newPassword,
        confirmPassword,
      });

      if (!res.success) {
        setErrorMessage(res.error.message);
        return;
      }

      setCompleted(true);
    } finally {
      setPending(false);
    }
  }

  if (!hasValidSession) {
    return (
      <div className="space-y-4">
        <FeedbackBanner
          tone="danger"
          message="Tautan pemulihan kata sandi tidak valid atau sudah kedaluwarsa. Silakan ajukan permintaan lupa kata sandi baru dari halaman masuk."
        />
        <Link
          href="/auth/login"
          className="inline-flex w-full min-h-11 items-center justify-center rounded-control bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-ring transition-colors"
        >
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="space-y-4">
        <FeedbackBanner
          tone="success"
          message="Kata sandi baru berhasil disimpan. Anda sekarang dapat masuk ke ruang kerja PMKI."
        />
        <Link
          href="/workspace"
          className="inline-flex w-full min-h-11 items-center justify-center rounded-control bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-ring transition-colors"
        >
          Masuk ke Ruang Kerja
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <FeedbackBanner
          tone="danger"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      <div className="space-y-1.5">
        <label
          htmlFor={newPassId}
          className="block text-sm font-medium text-foreground"
        >
          Kata sandi baru
        </label>
        <Input
          id={newPassId}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Minimal 8 karakter"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={confirmPassId}
          className="block text-sm font-medium text-foreground"
        >
          Konfirmasi kata sandi baru
        </label>
        <Input
          id={confirmPassId}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Ulangi kata sandi baru"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={pending}
        />
      </div>

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Menyimpan kata sandi..." : "Simpan kata sandi baru"}
      </Button>
    </form>
  );
}

