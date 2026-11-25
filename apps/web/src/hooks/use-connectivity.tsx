"use client";

import * as React from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatTimeID } from "@/utils/date-formatter";

export type ConnectivityState = "ONLINE" | "OFFLINE" | "RECONNECTING" | "SYNCING";

interface ConnectivityContextValue {
  status: ConnectivityState;
  lastSyncedAt: string | null;
  setSyncing: (syncing: boolean) => void;
  markSynced: (isoTimestamp?: string) => void;
}

const ConnectivityContext = React.createContext<
  ConnectivityContextValue | undefined
>(undefined);

function subscribeOnlineStatus(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getBrowserOnlineSnapshot(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.navigator?.onLine !== "boolean"
  ) {
    return true;
  }
  return window.navigator.onLine;
}

function getServerOnlineSnapshot(): boolean {
  return true;
}

export function ConnectivityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isOnline = React.useSyncExternalStore(
    subscribeOnlineStatus,
    getBrowserOnlineSnapshot,
    getServerOnlineSnapshot
  );
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isReconnecting, setIsReconnecting] = React.useState(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleOffline = () => {
      setIsReconnecting(false);
    };

    const handleOnline = () => {
      setIsReconnecting(true);
      window.setTimeout(() => setIsReconnecting(false), 1200);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const status: ConnectivityState = !isOnline
    ? "OFFLINE"
    : isSyncing
      ? "SYNCING"
      : isReconnecting
        ? "RECONNECTING"
        : "ONLINE";

  const markSynced = React.useCallback((isoTimestamp?: string) => {
    setLastSyncedAt(isoTimestamp ?? new Date().toISOString());
  }, []);

  return (
    <ConnectivityContext.Provider
      value={{
        status,
        lastSyncedAt,
        setSyncing: setIsSyncing,
        markSynced,
      }}
    >
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity(): ConnectivityContextValue {
  const ctx = React.useContext(ConnectivityContext);
  if (!ctx) {
    throw new Error(
      "useConnectivity must be used within a ConnectivityProvider"
    );
  }
  return ctx;
}

const STATE_UI: Record<
  ConnectivityState,
  { label: string; tone: string; dotTone: string }
> = {
  ONLINE: {
    label: "Terhubung",
    tone: "bg-success-soft text-success-foreground border-success-border",
    dotTone: "bg-success ring-success/25",
  },
  OFFLINE: {
    label: "Offline",
    tone: "bg-warning-soft text-warning-foreground border-warning-border",
    dotTone: "bg-warning ring-warning/30",
  },
  RECONNECTING: {
    label: "Menyambung ulang...",
    tone: "bg-info-soft text-info-foreground border-info-border",
    dotTone: "bg-info ring-info/30",
  },
  SYNCING: {
    label: "Menyinkronkan...",
    tone: "bg-info-soft text-info-foreground border-info-border",
    dotTone: "bg-info ring-info/30",
  },
};

/**
 * Subtle, non-intrusive connectivity & last-sync indicator (06 §15–16).
 * Displays "Sinkron terakhir: [waktu]" instead of ambiguous "Up To Date".
 */
export function ConnectivityIndicator({ className }: { className?: string }) {
  const { status, lastSyncedAt } = useConnectivity();
  const meta = STATE_UI[status];

  const formattedTime = React.useMemo(() => {
    if (!lastSyncedAt) return null;
    try {
      return formatTimeID(lastSyncedAt) || null;
    } catch {
      return null;
    }
  }, [lastSyncedAt]);

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {/* Mobile (< md): clean status dot without text clutter */}
      <span
        role="status"
        aria-live="polite"
        title={meta.label}
        className="md:hidden inline-flex items-center justify-center p-1"
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-2.5 w-2.5 rounded-full ring-4",
            meta.dotTone
          )}
        />
        <span className="sr-only">{meta.label}</span>
      </span>

      {/* Tablet & Desktop (>= md): full semantic status pill */}
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "hidden md:inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
          meta.tone
        )}
      >
        {status === "OFFLINE" ? (
          <Icon icon={WifiOff} size="xs" />
        ) : status === "SYNCING" || status === "RECONNECTING" ? (
          <Icon icon={RefreshCw} size="xs" className="animate-spin" />
        ) : (
          <Icon icon={Wifi} size="xs" />
        )}
        <span>{meta.label}</span>
      </span>

      {formattedTime && (
        <span className="hidden lg:inline text-[11px] text-muted-foreground whitespace-nowrap">
          Sinkron terakhir: {formattedTime} WIB
        </span>
      )}
    </div>
  );
}

/**
 * Non-intrusive slim connectivity banner (06 §16).
 * Automatically appears during OFFLINE or SYNCING states and disappears without manual intervention
 * once re-established to ONLINE + SYNCED.
 */
export function ConnectivityTopBanner({ className }: { className?: string }) {
  const { status } = useConnectivity();
  if (status === "ONLINE") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "sticky top-16 z-20 w-full py-1.5 px-4 text-center text-xs font-medium border-b transition-all duration-150",
        status === "OFFLINE"
          ? "bg-warning-soft text-warning-foreground border-warning-border"
          : "bg-info-soft text-info-foreground border-info-border",
        className
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {status === "OFFLINE" ? (
          <>
            <Icon icon={WifiOff} size="xs" />
            <span>Mode Luring. Perubahan data tersimpan di perangkat lokal.</span>
          </>
        ) : status === "RECONNECTING" ? (
          <>
            <Icon icon={RefreshCw} size="xs" className="animate-spin" />
            <span>Menyambungkan kembali ke server...</span>
          </>
        ) : (
          <>
            <Icon icon={RefreshCw} size="xs" className="animate-spin" />
            <span>Menyinkronkan data dengan server...</span>
          </>
        )}
      </div>
    </div>
  );
}
