"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FeedbackBanner } from "@/components/patterns";
import { Button, Icon, Input } from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { useConnectivity } from "@/hooks/use-connectivity";
import { changeMyPasswordAction } from "../actions/auth-actions";

export interface ChangePasswordCardProps {
  forceMode?: boolean;
  onSuccessRedirectTo?: string;
}

export function ChangePasswordCard({
  forceMode = false,
  onSuccessRedirectTo,
}: ChangePasswordCardProps) {
  const router = useRouter();
  const { status: connectivityStatus } = useConnectivity();
  const isOffline = connectivityStatus === "OFFLINE";

  const newPassId = React.useId();
  const confirmPassId = React.useId();

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    tone: "success" | "danger" | "warning";
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isOffline || pending) return;
    setPending(true);
    setFeedback(null);

    try {
      const res = await changeMyPasswordAction({
        newPassword,
        confirmPassword,
      });

      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setFeedback({
        tone: "success",
        message: forceMode
          ? "Kata sandi berhasil diperbarui. Membuka ruang kerja..."
          : "Kata sandi Anda berhasil diperbarui.",
      });

      if (onSuccessRedirectTo) {
        router.push(onSuccessRedirectTo);
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5 space-y-4">
      <div className="flex items-start gap-2.5">
        <Icon
          icon={ICON_MAP.lock}
          size="sm"
          className="text-primary shrink-0 mt-0.5"
        />
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold text-foreground">
            {forceMode ? "Wajib ubah kata sandi bawaan" : "Keamanan akun"}
          </h2>
          <p className="text-xs text-secondary-foreground leading-relaxed">
            {forceMode
              ? "Untuk keamanan akun, Anda perlu mengganti kata sandi bawaan sebelum menggunakan fitur ruang kerja."
              : "Perbarui kata sandi Anda secara berkala. Minimal 8 karakter dan tidak menggunakan sandi bawaan."}
          </p>
        </div>
      </div>

      {isOffline && (
        <FeedbackBanner
          tone="warning"
          message="Pengubahan kata sandi memerlukan koneksi internet aktif."
        />
      )}

      {feedback && (
        <FeedbackBanner
          tone={feedback.tone}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label
              htmlFor={newPassId}
              className="block text-xs font-medium text-foreground"
            >
              Kata sandi baru *
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
              disabled={pending || isOffline}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor={confirmPassId}
              className="block text-xs font-medium text-foreground"
            >
              Ulangi kata sandi baru *
            </label>
            <Input
              id={confirmPassId}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Ketik ulang kata sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={pending || isOffline}
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={pending || isOffline}
            className="w-full sm:w-auto"
          >
            {pending ? "Menyimpan kata sandi..." : "Simpan kata sandi baru"}
          </Button>
        </div>
      </form>
    </section>
  );
}

