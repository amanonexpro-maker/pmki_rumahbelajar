"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { logoutAction } from "../actions/auth-actions";

export interface LogoutButtonProps {
  showLabelOnMobile?: boolean;
  compact?: boolean;
  className?: string;
}

export function LogoutButton({
  showLabelOnMobile = false,
  compact = false,
  className,
}: LogoutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await logoutAction();
      router.push("/auth/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (compact) {
    return (
      <Button
        type="button"
        variant="soft"
        size="icon"
        onClick={handleLogout}
        disabled={pending}
        aria-label="Keluar dari ruang kerja"
        title={pending ? "Keluar..." : "Keluar"}
        className={cn(
          "h-10 w-10 sm:h-10 sm:w-10 text-danger bg-danger-soft hover:bg-danger-soft/80 border border-danger-border/60",
          className
        )}
      >
        <Icon icon={LogOut} size="sm" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={showLabelOnMobile ? "soft" : "ghost"}
      size={showLabelOnMobile ? "md" : "sm"}
      onClick={handleLogout}
      disabled={pending}
      aria-label="Keluar dari ruang kerja"
      leftIcon={<Icon icon={LogOut} size="xs" />}
      className={cn(
        "whitespace-nowrap",
        showLabelOnMobile &&
          "text-danger bg-danger-soft hover:bg-danger-soft/80 border border-danger-border/60",
        className
      )}
    >
      <span className={showLabelOnMobile ? "inline" : "hidden sm:inline"}>
        {pending ? "Keluar..." : "Keluar"}
      </span>
    </Button>
  );
}

