"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

export type FeedbackTone = "success" | "warning" | "danger" | "info";

export interface FeedbackBannerProps {
  tone?: FeedbackTone;
  message: React.ReactNode;
  onDismiss?: () => void;
  autoDismissMs?: number;
  className?: string;
}

const TONE_META: Record<
  FeedbackTone,
  {
    icon: typeof CheckCircle2;
    role: "status" | "alert";
    containerClasses: string;
    iconClasses: string;
    defaultAutoDismissMs: number;
  }
> = {
  success: {
    icon: CheckCircle2,
    role: "status",
    containerClasses:
      "bg-success-soft text-success-foreground border-success-border",
    iconClasses: "text-success",
    defaultAutoDismissMs: 3000,
  },
  warning: {
    icon: TriangleAlert,
    role: "status",
    containerClasses:
      "bg-warning-soft text-warning-foreground border-warning-border",
    iconClasses: "text-warning",
    defaultAutoDismissMs: 4000,
  },
  danger: {
    icon: AlertCircle,
    role: "alert",
    containerClasses:
      "bg-danger-soft text-danger-foreground border-danger-border",
    iconClasses: "text-danger",
    defaultAutoDismissMs: 5000,
  },
  info: {
    icon: Info,
    role: "status",
    containerClasses: "bg-info-soft text-info-foreground border-info-border",
    iconClasses: "text-info",
    defaultAutoDismissMs: 4000,
  },
};

/**
 * Standardized Non-Intrusive Feedback Banner (UI-UX §22, 10 §14).
 * - Full card is tap-to-dismiss (comfortable touch target >= 44px on mobile).
 * - Calibrated auto-dismiss duration (success 3s, warning/info 4s, danger 5s).
 * - Restrained elevation: thin border without harsh dropshadows.
 */
export function FeedbackBanner({
  tone = "info",
  message,
  onDismiss,
  autoDismissMs,
  className,
}: FeedbackBannerProps) {
  const meta = TONE_META[tone];
  const timeoutMs = autoDismissMs ?? meta.defaultAutoDismissMs;

  React.useEffect(() => {
    if (!onDismiss || timeoutMs <= 0) return;
    const timer = window.setTimeout(onDismiss, timeoutMs);
    return () => window.clearTimeout(timer);
  }, [onDismiss, timeoutMs]);

  return (
    <div
      role={meta.role}
      aria-live="polite"
      onClick={onDismiss}
      className={cn(
        "rounded-control border px-4 py-3 text-sm flex items-start justify-between gap-3 transition-all duration-150 animate-dialog",
        onDismiss && "cursor-pointer hover:opacity-95 active:scale-[0.99]",
        meta.containerClasses,
        className
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon
          icon={meta.icon}
          size="sm"
          className={cn("shrink-0 mt-0.5", meta.iconClasses)}
        />
        <div className="min-w-0 font-medium leading-relaxed">{message}</div>
      </div>

      {onDismiss && (
        <span
          aria-label="Tutup pemberitahuan"
          className="shrink-0 p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon icon={X} size="xs" />
        </span>
      )}
    </div>
  );
}

/**
 * Floating Safe-Area Toast Container for mobile & desktop.
 * Positioned at bottom-center on mobile with safe-area offset; bottom-right on desktop.
 */
export function FloatingFeedbackToast({
  tone,
  message,
  onDismiss,
  autoDismissMs,
  className,
}: FeedbackBannerProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "fixed z-50 bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md",
        "pb-[env(safe-area-inset-bottom,0px)]",
        className
      )}
    >
      <FeedbackBanner
        tone={tone}
        message={message}
        onDismiss={onDismiss}
        autoDismissMs={autoDismissMs}
        className="shadow-sm"
      />
    </div>
  );
}

