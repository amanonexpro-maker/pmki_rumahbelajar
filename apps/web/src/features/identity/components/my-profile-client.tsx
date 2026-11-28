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
  Avatar,
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
  Input,
  Textarea,
} from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { useConnectivity } from "@/hooks/use-connectivity";
import { formatDateID, formatTimeID } from "@/utils/date-formatter";
import { updateMyProfileAction } from "../actions/auth-actions";
import type { MyProfileViewDTO } from "../services/auth-service";
import { ChangePasswordCard } from "./change-password-card";

export interface MyProfileClientProps {
  profile: MyProfileViewDTO;
  initialTab?: string;
}

const VALID_TABS = new Set(["profile", "access", "security"]);

const ACTION_LABELS: Record<string, string> = {
  read: "Lihat data",
  create: "Tambah baru",
  update: "Perbarui data",
  archive: "Arsipkan",
  record: "Catat data",
  export: "Ekspor laporan",
  review: "Tinjau kelayakan",
  approve: "Setujui / sahkan",
  publish: "Terbitkan ke publik",
  manage: "Kelola penuh",
  assign: "Tetapkan penempatan",
  upload: "Unggah berkas",
};

function getPermissionActionLabel(code: string): string {
  const action = code.split(".")[1] ?? "";
  return ACTION_LABELS[action] ?? code;
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
  const activeTabIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeTab)
  );

  function goToMobileTab(index: number) {
    const target = tabs[index];
    if (!target) return;
    handleTabChange(target.id);
    const el = mobileScrollRef.current;
    if (el && el.clientWidth > 0) {
      el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    }
  }

  function handleMobileScroll() {
    const el = mobileScrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const nextIdx = Math.min(
      tabs.length - 1,
      Math.max(0, Math.round(el.scrollLeft / el.clientWidth))
    );
    const nextTab = tabs[nextIdx];
    if (nextTab && nextTab.id !== activeTab) {
      handleTabChange(nextTab.id);
    }
  }

  React.useEffect(() => {
    const el = mobileScrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const expectedLeft = activeTabIndex * el.clientWidth;
    if (Math.abs(el.scrollLeft - expectedLeft) > 8) {
      el.scrollTo({ left: expectedLeft, behavior: "auto" });
    }
  }, [activeTabIndex]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const nameFieldId = React.useId();
  const bioFieldId = React.useId();
  const publicToggleId = React.useId();

  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(
    profile.avatarUrl
  );
  const [name, setName] = React.useState(profile.name);
  const [publicBio, setPublicBio] = React.useState(profile.publicBio ?? "");
  const [showOnPublic, setShowOnPublic] = React.useState(profile.showOnPublic);

  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(
    () => new Set()
  );
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

  const profileSection = (
    <section className="rounded-card border border-border bg-surface p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {avatarUrl ? (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
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
              onChange={(e) => void handleAvatarFileChange(e)}
              className="hidden"
            />
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="flex-1 sm:flex-initial"
              >
                Lihat foto
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isOffline || uploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Icon icon={ICON_MAP.image} size="xs" />}
              className="flex-1 sm:flex-initial"
            >
              {uploadingPhoto ? "Mengunggah..." : "Ubah foto profil"}
            </Button>
          </div>
        </div>

        <form
          onSubmit={handleSaveProfile}
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
              onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setPublicBio(e.target.value)}
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
              onCheckedChange={(checked) => setShowOnPublic(checked === true)}
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

  const accessSection = (
    <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="rounded-card border border-border bg-surface p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Icon
                  icon={ICON_MAP.shieldCheck}
                  size="sm"
                  className="text-primary"
                />
                <h2 className="text-sm font-semibold text-foreground">
                  Peran yang dipegang
                </h2>
              </div>
              {profile.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.roles.map((r) => (
                    <Badge key={r.code} variant="primary" size="sm">
                      {r.label}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-secondary-foreground">
                  Belum ada peran yang ditetapkan pada akun ini.
                </p>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed">
                Peran dan hak akses dikelola oleh Administrator Platform sesuai
                kebutuhan tugas Anda.
              </p>
            </section>

            <section className="rounded-card border border-border bg-surface p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Icon
                  icon={ICON_MAP.lokasi}
                  size="sm"
                  className="text-primary"
                />
                <h2 className="text-sm font-semibold text-foreground">
                  Lingkup unit layanan
                </h2>
              </div>
              {profile.memberships.length > 0 ? (
                <ul className="space-y-2">
                  {profile.memberships.map((m) => (
                    <li
                      key={`${m.organizationId}-${m.serviceUnitId}`}
                      className="rounded-control border border-border-subtle bg-surface-subtle/40 px-3 py-2 text-xs"
                    >
                      <p className="font-medium text-foreground">
                        {m.serviceUnitName}
                      </p>
                      <p className="text-muted-foreground">
                        {m.organizationName}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-secondary-foreground">
                  Belum ada lingkup unit layanan yang ditetapkan.
                </p>
              )}
            </section>
          </div>

          <section className="rounded-card border border-border bg-surface p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h2 className="text-base font-semibold text-foreground">
                  Kewenangan akses Anda
                </h2>
                <p className="text-xs text-secondary-foreground">
                  Pilih modul untuk melihat rincian hak akses aktif Anda.
                </p>
              </div>
              <Badge variant="neutral" size="sm">
                {profile.totalPermissions} izin aktif
              </Badge>
            </div>

            {profile.permissionGroups.length === 0 ? (
              <p className="text-xs text-secondary-foreground">
                Akun ini belum memiliki hak akses modul yang aktif.
              </p>
            ) : (
              <div className="rounded-control border border-border divide-y divide-border">
                {profile.permissionGroups.map((group) => {
                  const isExpanded = expandedModules.has(group.moduleKey);
                  return (
                    <div key={group.moduleKey} className="bg-surface">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => {
                          setExpandedModules((prev) => {
                            const next = new Set(prev);
                            if (next.has(group.moduleKey)) {
                              next.delete(group.moduleKey);
                            } else {
                              next.add(group.moduleKey);
                            }
                            return next;
                          });
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-surface-subtle/50 transition-colors cursor-pointer focus-ring"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {group.moduleLabel}
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <Badge variant="neutral" size="sm">
                            {group.permissions.length} izin
                          </Badge>
                          <span className="hidden sm:inline text-xs text-primary font-medium">
                            {isExpanded ? "Tutup" : "Lihat detail"}
                          </span>
                          <Icon
                            icon={ICON_MAP.chevronRight}
                            size="xs"
                            className={
                              isExpanded
                                ? "text-muted-foreground rotate-90 transition-transform duration-150"
                                : "text-muted-foreground transition-transform duration-150"
                            }
                          />
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-3.5 pt-1 border-t border-border-subtle bg-surface-subtle/30">
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
                            {group.permissions.map((perm) => (
                              <li
                                key={perm}
                                className="flex items-center justify-between gap-2 rounded-xs bg-surface px-2.5 py-1.5 border border-border-subtle text-xs"
                              >
                                <span className="text-foreground font-medium">
                                  {getPermissionActionLabel(perm)}
                                </span>
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  {perm}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
  );

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

      {/* Desktop: DetailTabs standar */}
      <div className="hidden sm:block">
        <DetailTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
          ariaLabel="Tab profil saya"
        />
      </div>

      {/* Mobile: 3 label tab bersih tanpa garis bawah (aktif dicetak tebal), tetap dukung swipe panel */}
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
              onClick={() => goToMobileTab(idx)}
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

      {/* Mobile: Swipeable horizontal panels sinkron dengan dot pagination */}
      <div
        ref={mobileScrollRef}
        onScroll={handleMobileScroll}
        className="sm:hidden flex overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="w-full shrink-0 snap-start">{profileSection}</div>
        <div className="w-full shrink-0 snap-start">{accessSection}</div>
        <div className="w-full shrink-0 snap-start">{securitySection}</div>
      </div>

      {/* Desktop: Konten tab aktif */}
      <div className="hidden sm:block">
        {activeTab === "profile" && profileSection}
        {activeTab === "access" && accessSection}
        {activeTab === "security" && securitySection}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pratinjau foto profil</DialogTitle>
            <DialogDescription>{name}</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex justify-center">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={`Foto profil ${name}`}
                className="max-h-[65vh] w-auto rounded-card border border-border object-contain"
              />
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={isOffline || uploadingPhoto}
              onClick={() => {
                setPreviewOpen(false);
                fileInputRef.current?.click();
              }}
            >
              Ganti foto
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPreviewOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {feedback && (
        <FloatingFeedbackToast
          tone={feedback.tone}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}
    </div>
  );
}
