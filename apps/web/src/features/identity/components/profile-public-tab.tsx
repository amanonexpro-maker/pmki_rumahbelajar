"use client";

import * as React from "react";
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Icon,
  Input,
  Textarea,
} from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { formatDateID, formatTimeID } from "@/utils/date-formatter";
import type { MyProfileViewDTO } from "../services/auth-service";

export interface ProfilePublicTabProps {
  profile: MyProfileViewDTO;
  avatarUrl: string | null;
  name: string;
  onNameChange: (val: string) => void;
  publicBio: string;
  onBioChange: (val: string) => void;
  showOnPublic: boolean;
  onShowOnPublicChange: (val: boolean) => void;
  uploadingPhoto: boolean;
  removingPhoto: boolean;
  savingProfile: boolean;
  isOffline: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onOpenPreview: () => void;
  onRemoveAvatar: () => Promise<void>;
  onSaveProfile: (e: React.FormEvent) => Promise<void>;
}

export function ProfilePublicTab({
  profile,
  avatarUrl,
  name,
  onNameChange,
  publicBio,
  onBioChange,
  showOnPublic,
  onShowOnPublicChange,
  uploadingPhoto,
  removingPhoto,
  savingProfile,
  isOffline,
  fileInputRef,
  onAvatarFileChange,
  onOpenPreview,
  onRemoveAvatar,
  onSaveProfile,
}: ProfilePublicTabProps) {
  const nameFieldId = React.useId();
  const bioFieldId = React.useId();
  const publicToggleId = React.useId();

  return (
    <section className="rounded-card border border-border bg-surface p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {avatarUrl ? (
            <button
              type="button"
              onClick={onOpenPreview}
              aria-label="Lihat pratinjau foto profil"
              className="rounded-full focus-ring cursor-pointer shrink-0 hover:opacity-90 transition-opacity"
            >
              <Avatar name={name} src={avatarUrl} size="lg" />
            </button>
          ) : (
            <Avatar name={name} src={avatarUrl} size="lg" />
          )}
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-foreground truncate">
                {name}
              </h2>
              <Badge variant={profile.active ? "success" : "danger"} size="sm">
                {profile.active ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <p className="text-xs font-mono text-muted-foreground truncate">
              {profile.email}
            </p>
            {profile.lastLoginAt && (
              <p className="text-xs text-secondary-foreground">
                Masuk terakhir: {formatDateID(profile.lastLoginAt)},{" "}
                {formatTimeID(profile.lastLoginAt)} WIB
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => void onAvatarFileChange(e)}
            className="hidden"
          />
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenPreview}
              className="flex-1 sm:flex-initial"
            >
              Lihat foto
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isOffline || uploadingPhoto || removingPhoto}
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Icon icon={ICON_MAP.image} size="xs" />}
            className="flex-1 sm:flex-initial"
          >
            {uploadingPhoto ? "Mengunggah..." : "Ubah foto profil"}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isOffline || uploadingPhoto || removingPhoto}
              onClick={() => void onRemoveAvatar()}
              className="text-danger hover:bg-danger-soft/60 hover:text-danger"
            >
              {removingPhoto ? "Menghapus..." : "Hapus foto"}
            </Button>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => void onSaveProfile(e)}
        className="space-y-4 pt-4 border-t border-border-subtle"
      >
        <div className="space-y-1">
          <label
            htmlFor={nameFieldId}
            className="block text-xs font-medium text-foreground"
          >
            Nama tampilan *
          </label>
          <Input
            id={nameFieldId}
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={savingProfile || isOffline}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor={bioFieldId}
            className="block text-xs font-medium text-foreground"
          >
            Bio singkat untuk halaman publik (opsional)
          </label>
          <Textarea
            id={bioFieldId}
            rows={2}
            maxLength={280}
            placeholder="Contoh: Mengajar matematika dasar dan senang mendampingi anak-anak belajar sambil bermain."
            value={publicBio}
            onChange={(e) => onBioChange(e.target.value)}
            disabled={savingProfile || isOffline}
          />
          <p className="text-[11px] text-muted-foreground">
            {publicBio.length}/280 karakter. Email dan akun internal tidak
            pernah ditampilkan ke publik.
          </p>
        </div>

        <label
          htmlFor={publicToggleId}
          className="flex items-start gap-2.5 rounded-control border border-border-subtle bg-surface-subtle/40 p-3 text-xs cursor-pointer"
        >
          <Checkbox
            id={publicToggleId}
            checked={showOnPublic}
            onCheckedChange={(checked) => onShowOnPublicChange(checked === true)}
            disabled={savingProfile || isOffline}
          />
          <span className="leading-relaxed">
            <strong className="text-foreground block">
              Tampilkan foto &amp; profil singkat saya di halaman publik
            </strong>
            <span className="text-secondary-foreground">
              Membantu orang tua/wali mengenal pengajar relawan Rumah Belajar
              PMKI.
            </span>
          </span>
        </label>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={savingProfile || isOffline}
            className="w-full sm:w-auto"
          >
            {savingProfile ? "Menyimpan..." : "Simpan informasi profil"}
          </Button>
        </div>
      </form>
    </section>
  );
}

