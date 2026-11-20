"use client";

import * as React from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

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
  { label: string; tone: string }
> = {
  ONLINE: {
    label: "Terhubung",
    tone: "bg-success-soft text-success-foreground border-success-border",
  },
  OFFLINE: {
    label: "Offline",
    tone: "bg-warning-soft text-warning-foreground border-warning-border",
  },
  RECONNECTING: {
    label: "Menyambung ulang...",
    tone: "bg-info-soft text-info-foreground border-info-border",
  },
  SYNCING: {
    label: "Menyinkronkan...",
    tone: "bg-info-soft text-info-foreground border-info-border",
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
      return new Date(lastSyncedAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  }, [lastSyncedAt]);

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
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
