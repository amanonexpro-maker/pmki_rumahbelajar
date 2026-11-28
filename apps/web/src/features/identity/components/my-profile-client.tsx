"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DetailTabs,
  FeedbackBanner,
  FloatingFeedbackToast,
  PageHeader,
  type DetailTabItem,
} from "@/components/patterns";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
} from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { useConnectivity } from "@/hooks/use-connectivity";
import { updateMyProfileAction } from "../actions/auth-actions";
import type { MyProfileViewDTO } from "../services/auth-service";
import { ChangePasswordCard } from "./change-password-card";
import { ProfileAccessTab } from "./profile-access-tab";
import { ProfilePublicTab } from "./profile-public-tab";

export interface MyProfileClientProps {
  profile: MyProfileViewDTO;
  initialTab?: string;
}

const VALID_TABS = new Set(["profile", "access", "security"]);
const SM_MEDIA_QUERY = "(min-width: 640px)";

function subscribeSmMedia(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(SM_MEDIA_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSmSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(SM_MEDIA_QUERY).matches;
}

function getSmServerSnapshot(): boolean {
  return true;
}

function AvatarPreviewDialog({
  open,
  onOpenChange,
  name,
  avatarUrl,
  disabled,
  removingPhoto,
  onRemove,
  onChangePhoto,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  avatarUrl: string | null;
  disabled: boolean;
  removingPhoto: boolean;
  onRemove: () => Promise<void>;
  onChangePhoto: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pratinjau foto profil</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex justify-center">
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={`Foto profil ${name}`}
              className="max-h-[65vh] w-auto rounded-card border border-border object-contain"
            />
          )}
        </DialogBody>
        <DialogFooter>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={() => void onRemove()}
              className="text-danger hover:bg-danger-soft/60 hover:text-danger sm:mr-auto"
            >
              {removingPhoto ? "Menghapus..." : "Hapus foto"}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={onChangePhoto}
          >
            Ganti foto
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useMyProfileEditor(profile: MyProfileViewDTO, isOffline: boolean) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(
    profile.avatarUrl
  );
  const [name, setName] = React.useState(profile.name);
  const [publicBio, setPublicBio] = React.useState(profile.publicBio ?? "");
  const [showOnPublic, setShowOnPublic] = React.useState(profile.showOnPublic);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [removingPhoto, setRemovingPhoto] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    tone: "success" | "danger" | "warning";
    message: string;
  } | null>(null);

  async function handleAvatarFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || isOffline || uploadingPhoto) return;
    setUploadingPhoto(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json().catch(() => null)) as {
        data?: { avatarUrl?: string };
        error?: { message?: string };
      } | null;
      if (!res.ok || !json?.data?.avatarUrl) {
        setFeedback({
          tone: "danger",
          message: json?.error?.message ?? "Gagal mengunggah foto profil.",
        });
        return;
      }
      setAvatarUrl(json.data.avatarUrl);
      setFeedback({
        tone: "success",
        message: "Foto profil berhasil diperbarui.",
      });
      router.refresh();
    } catch {
      setFeedback({
        tone: "danger",
        message: "Terjadi gangguan jaringan saat mengunggah foto profil.",
      });
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleRemoveAvatar() {
    if (isOffline || uploadingPhoto || removingPhoto || !avatarUrl) return;
    setRemovingPhoto(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: { message?: string };
      } | null;
      if (!res.ok || !json?.success) {
        setFeedback({
          tone: "danger",
          message: json?.error?.message ?? "Gagal menghapus foto profil.",
        });
        return;
      }
      setAvatarUrl(null);
      setPreviewOpen(false);
      setFeedback({
        tone: "success",
        message: "Foto profil dihapus dan kembali ke inisial nama.",
      });
      router.refresh();
    } catch {
      setFeedback({
        tone: "danger",
        message: "Terjadi gangguan jaringan saat menghapus foto profil.",
      });
    } finally {
      setRemovingPhoto(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (isOffline || savingProfile) return;
    setSavingProfile(true);
    setFeedback(null);
    try {
      const res = await updateMyProfileAction({
        name,
        publicBio: publicBio.trim() || null,
        showOnPublic,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return;
      }
      setFeedback({
        tone: "success",
        message: showOnPublic
          ? "Profil & tampilan publik berhasil diperbarui."
          : "Informasi profil berhasil diperbarui.",
      });
      router.refresh();
    } finally {
      setSavingProfile(false);
    }
  }

  return {
    avatarUrl,
    name,
    setName,
    publicBio,
    setPublicBio,
    showOnPublic,
    setShowOnPublic,
    uploadingPhoto,
    removingPhoto,
    previewOpen,
    setPreviewOpen,
    savingProfile,
    feedback,
    setFeedback,
    handleAvatarFileChange,
    handleRemoveAvatar,
    handleSaveProfile,
  };
}

export function MyProfileClient({
  profile,
  initialTab = "profile",
}: MyProfileClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: connectivityStatus } = useConnectivity();
  const isOffline = connectivityStatus === "OFFLINE";
  const isDesktopSm = React.useSyncExternalStore(
    subscribeSmMedia,
    getSmSnapshot,
    getSmServerSnapshot
  );

  const [activeTab, setActiveTab] = React.useState(() =>
    profile.mustChangePassword
      ? "security"
      : VALID_TABS.has(initialTab)
        ? initialTab
        : "profile"
  );

  function handleTabChange(nextTab: string) {
    setActiveTab(nextTab);
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextTab === "profile") next.delete("tab");
    else next.set("tab", nextTab);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const tabs: DetailTabItem[] = React.useMemo(
    () => [
      {
        id: "profile",
        label: "Profil & Publik",
        icon: <Icon icon={ICON_MAP.peserta} size="xs" />,
      },
      {
        id: "access",
        label: "Peran & Kewenangan",
        count: profile.totalPermissions,
        icon: <Icon icon={ICON_MAP.shieldCheck} size="xs" />,
      },
      {
        id: "security",
        label: "Keamanan",
        icon: <Icon icon={ICON_MAP.lock} size="xs" />,
      },
    ],
    [profile.totalPermissions]
  );

  const mobileScrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const activeTabIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeTab)
  );

  React.useEffect(() => {
    const el = mobileScrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const expectedLeft = activeTabIndex * el.clientWidth;
    if (Math.abs(el.scrollLeft - expectedLeft) > 8) {
      el.scrollTo({ left: expectedLeft, behavior: "auto" });
    }
  }, [activeTabIndex]);

  const ed = useMyProfileEditor(profile, isOffline);

  const profileSection = (
    <ProfilePublicTab
      profile={profile}
      avatarUrl={ed.avatarUrl}
      name={ed.name}
      onNameChange={ed.setName}
      publicBio={ed.publicBio}
      onBioChange={ed.setPublicBio}
      showOnPublic={ed.showOnPublic}
      onShowOnPublicChange={ed.setShowOnPublic}
      uploadingPhoto={ed.uploadingPhoto}
      removingPhoto={ed.removingPhoto}
      savingProfile={ed.savingProfile}
      isOffline={isOffline}
      fileInputRef={fileInputRef}
      onAvatarFileChange={ed.handleAvatarFileChange}
      onOpenPreview={() => ed.setPreviewOpen(true)}
      onRemoveAvatar={ed.handleRemoveAvatar}
      onSaveProfile={ed.handleSaveProfile}
    />
  );
  const accessSection = <ProfileAccessTab profile={profile} />;
  const securitySection = <ChangePasswordCard />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Saya"
        description="Informasi akun, foto profil, tampilan publik pengajar, kewenangan akses, dan keamanan kata sandi Anda."
      />

      {profile.mustChangePassword && (
        <FeedbackBanner
          tone="warning"
          message="Akun Anda masih menggunakan kata sandi bawaan. Silakan ubah kata sandi Anda pada tab Keamanan."
        />
      )}

      <div className="hidden sm:block">
        <DetailTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
          ariaLabel="Tab profil saya"
        />
      </div>

      <div
        role="tablist"
        aria-label="Tab profil saya"
        className="sm:hidden flex items-center justify-around gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab, idx) => {
          const isCurrent = idx === activeTabIndex;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => {
                handleTabChange(tab.id);
                const el = mobileScrollRef.current;
                if (el && el.clientWidth > 0) {
                  el.scrollTo({
                    left: idx * el.clientWidth,
                    behavior: "smooth",
                  });
                }
              }}
              className={
                isCurrent
                  ? "px-2 py-1.5 text-xs font-semibold text-primary whitespace-nowrap cursor-pointer focus-ring rounded-control"
                  : "px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap cursor-pointer focus-ring rounded-control"
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {isDesktopSm ? (
        <div>
          {activeTab === "profile" && profileSection}
          {activeTab === "access" && accessSection}
          {activeTab === "security" && securitySection}
        </div>
      ) : (
        <div
          ref={mobileScrollRef}
          onScroll={() => {
            const el = mobileScrollRef.current;
            if (!el || el.clientWidth <= 0) return;
            const idx = Math.min(
              tabs.length - 1,
              Math.max(0, Math.round(el.scrollLeft / el.clientWidth))
            );
            const nextTab = tabs[idx];
            if (nextTab && nextTab.id !== activeTab) handleTabChange(nextTab.id);
          }}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="w-full shrink-0 snap-start">{profileSection}</div>
          <div className="w-full shrink-0 snap-start">{accessSection}</div>
          <div className="w-full shrink-0 snap-start">{securitySection}</div>
        </div>
      )}

      <AvatarPreviewDialog
        open={ed.previewOpen}
        onOpenChange={ed.setPreviewOpen}
        name={ed.name}
        avatarUrl={ed.avatarUrl}
        disabled={isOffline || ed.uploadingPhoto || ed.removingPhoto}
        removingPhoto={ed.removingPhoto}
        onRemove={ed.handleRemoveAvatar}
        onChangePhoto={() => {
          ed.setPreviewOpen(false);
          fileInputRef.current?.click();
        }}
      />

      {ed.feedback && (
        <FloatingFeedbackToast
          tone={ed.feedback.tone}
          message={ed.feedback.message}
          onDismiss={() => ed.setFeedback(null)}
        />
      )}
    </div>
  );
}
