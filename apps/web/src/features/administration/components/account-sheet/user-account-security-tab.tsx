"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button, Icon, Textarea } from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import type { AdminUserRecordDTO } from "../../types/administration-types";

export interface UserAccountSecurityTabProps {
  currentUser: AdminUserRecordDTO;
  currentUserId: string;
  pending: boolean;
  isOffline: boolean;
  generatedTempPassword: string | null;
  copiedTempPassword: boolean;
  onGenerateTempPassword: () => Promise<void>;
  onCopyTempPassword: () => Promise<void>;
  confirmDeactivate: boolean;
  onSetConfirmDeactivate: (val: boolean) => void;
  toggleReason: string;
  onChangeToggleReason: (val: string) => void;
  onToggleActive: (
    userId: string,
    active: boolean,
    reason: string | null
  ) => Promise<boolean>;
}

export function UserAccountSecurityTab({
  currentUser,
  currentUserId,
  pending,
  isOffline,
  generatedTempPassword,
  copiedTempPassword,
  onGenerateTempPassword,
  onCopyTempPassword,
  confirmDeactivate,
  onSetConfirmDeactivate,
  toggleReason,
  onChangeToggleReason,
  onToggleActive,
}: UserAccountSecurityTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Icon
              icon={ICON_MAP.lock}
              size="sm"
              className="text-primary shrink-0 mt-0.5"
            />
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">
                Reset kata sandi
              </h3>
              <p className="text-xs text-secondary-foreground">
                Membuat sandi sementara acak sekali pakai. Pengguna wajib
                menggantinya saat masuk berikutnya.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending || isOffline}
            onClick={() => void onGenerateTempPassword()}
            className="w-full sm:w-auto shrink-0"
          >
            {pending ? "Memproses..." : "Buat sandi sementara"}
          </Button>
        </div>

        {generatedTempPassword && (
          <div
            role="status"
            className="rounded-control border border-primary/30 bg-primary-soft/50 p-3.5 space-y-2"
          >
            <p className="text-xs font-medium text-foreground">
              Sandi sementara baru (hanya ditampilkan satu kali):
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xs border border-border bg-surface px-3 py-2">
              <code className="font-mono text-sm font-semibold text-foreground select-all">
                {generatedTempPassword}
              </code>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={
                  <Icon icon={copiedTempPassword ? Check : Copy} size="xs" />
                }
                onClick={() => void onCopyTempPassword()}
              >
                {copiedTempPassword ? "Tersalin" : "Salin sandi"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {currentUser.id !== currentUserId && (
        <div className="pt-5 border-t border-border space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Icon
                icon={ICON_MAP.alertTriangle}
                size="sm"
                className={
                  currentUser.active
                    ? "text-danger shrink-0 mt-0.5"
                    : "text-primary shrink-0 mt-0.5"
                }
              />
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-foreground">
                  {currentUser.active
                    ? "Nonaktifkan akun"
                    : "Aktifkan kembali akun"}
                </h3>
                <p className="text-xs text-secondary-foreground">
                  {currentUser.active
                    ? "Mencabut seluruh akses ruang kerja tanpa menghapus riwayat audit."
                    : "Memulihkan akses pengguna sesuai peran dan lingkupnya."}
                </p>
              </div>
            </div>

            {!confirmDeactivate && (
              <Button
                type="button"
                variant={currentUser.active ? "destructive" : "primary"}
                size="sm"
                disabled={pending || isOffline}
                onClick={() => {
                  if (currentUser.active) {
                    onSetConfirmDeactivate(true);
                  } else {
                    void onToggleActive(currentUser.id, true, null);
                  }
                }}
                className="w-full sm:w-auto shrink-0"
              >
                {currentUser.active ? "Nonaktifkan akun" : "Aktifkan kembali"}
              </Button>
            )}
          </div>

          {confirmDeactivate && currentUser.active && (
            <div className="rounded-control border border-danger/30 bg-danger-soft/30 p-3.5 space-y-3">
              <Textarea
                rows={2}
                placeholder="Tuliskan alasan penonaktifan akun (minimal 5 karakter)..."
                value={toggleReason}
                onChange={(e) => onChangeToggleReason(e.target.value)}
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    onSetConfirmDeactivate(false);
                    onChangeToggleReason("");
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending || isOffline || toggleReason.trim().length < 5}
                  onClick={async () => {
                    const okToggle = await onToggleActive(
                      currentUser.id,
                      false,
                      toggleReason.trim() || null
                    );
                    if (okToggle) {
                      onSetConfirmDeactivate(false);
                      onChangeToggleReason("");
                    }
                  }}
                >
                  {pending ? "Memproses..." : "Ya, nonaktifkan"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

