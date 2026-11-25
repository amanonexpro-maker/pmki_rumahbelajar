"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ICON_MAP } from "@/config/icons";
import { cn } from "@/lib/cn";
import { DonationTab } from "./tabs/donation-tab";
import { InfoLocationTab } from "./tabs/info-location-tab";
import { StudentRegistrationTab } from "./tabs/student-registration-tab";
import { VolunteerRegistrationTab } from "./tabs/volunteer-registration-tab";

export type KontakTabId = "info" | "siswa" | "relawan" | "donasi";

export interface KontakActionCenterProps {
  initialTab?: KontakTabId;
}

interface TabItem {
  id: KontakTabId;
  label: string;
  iconKey: string;
}

const TABS: readonly TabItem[] = [
  { id: "info", label: "Info & Lokasi", iconKey: "info" },
  { id: "siswa", label: "Daftar Siswa", iconKey: "daftarSiswa" },
  { id: "relawan", label: "Jadi Relawan", iconKey: "relawan" },
  { id: "donasi", label: "Dukungan Donasi", iconKey: "donasi" },
] as const;

/**
 * KontakActionCenter (Fase 14 Step 8, UI-UX §15, §28, §30, 03 §7, 03 §9).
 * Pusat interaksi layanan publik terpadu dengan segmented control multi-tujuan:
 * 1. Info & Lokasi: Alamat kanonikal, narahubung WhatsApp, jadwal rutin, dan peta.
 * 2. Daftar Siswa: Pendaftaran awal peserta didik tanpa meminta dokumen KTP/KK/Akta.
 * 3. Jadi Relawan: Pendaftaran pengajar relawan tanpa meminta CV/ijazah awal.
 * 4. Donasi: Narasi transparansi, status QRIS/rekening, dan konfirmasi WhatsApp humas.
 */
export function KontakActionCenter({
  initialTab = "info",
}: KontakActionCenterProps) {
  const searchParams = useSearchParams();
  const queryTab = searchParams
    ? (searchParams.get("tab") as KontakTabId | null)
    : null;
  const resolvedTab: KontakTabId =
    queryTab === "siswa" ||
    queryTab === "relawan" ||
    queryTab === "donasi" ||
    queryTab === "info"
      ? queryTab
      : initialTab;

  const [activeTab, setActiveTab] = React.useState<KontakTabId>(resolvedTab);
  const [prevQueryTab, setPrevQueryTab] = React.useState(queryTab);

  if (queryTab !== prevQueryTab) {
    setPrevQueryTab(queryTab);
    if (
      queryTab === "siswa" ||
      queryTab === "relawan" ||
      queryTab === "donasi" ||
      queryTab === "info"
    ) {
      setActiveTab(queryTab);
    }
  }

  // Synchronize URL query parameter without full-page navigation
  const handleTabSelect = (tabId: KontakTabId) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      window.history.replaceState(null, "", url.toString());
    }
  };

  return (
    <div className="space-y-8">
      {/* Accessible Segmented Control Tabs */}
      <div
        role="tablist"
        aria-label="Pilihan Layanan Kontak & Komunitas"
        className="flex flex-wrap p-1.5 rounded-card bg-surface-subtle border border-border gap-1.5"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = ICON_MAP[tab.iconKey] ?? ICON_MAP.info;

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabSelect(tab.id)}
              className={cn(
                "flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 min-h-11 rounded-control text-xs sm:text-sm font-medium transition-colors focus-ring cursor-pointer",
                isActive
                  ? "bg-surface text-foreground font-semibold shadow-xs border border-border"
                  : "text-secondary-foreground hover:text-foreground hover:bg-surface/50"
              )}
            >
              <TabIcon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "info" && <InfoLocationTab />}
      {activeTab === "siswa" && <StudentRegistrationTab />}
      {activeTab === "relawan" && <VolunteerRegistrationTab />}
      {activeTab === "donasi" && <DonationTab />}
    </div>
  );
}
