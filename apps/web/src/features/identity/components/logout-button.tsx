"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button, Icon } from "@/components/ui";
import { logoutAction } from "../actions/auth-actions";

export interface LogoutButtonProps {
  showLabelOnMobile?: boolean;
  className?: string;
}

export function LogoutButton({
  showLabelOnMobile = false,
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

  return (
    <Button
      type="button"
      variant={showLabelOnMobile ? "soft" : "ghost"}
      size={showLabelOnMobile ? "md" : "sm"}
      onClick={handleLogout}
      disabled={pending}
      aria-label="Keluar dari ruang kerja"
      className={
        showLabelOnMobile
          ? `text-danger bg-danger-soft hover:bg-danger-soft/80 ${className ?? ""}`.trim()
          : className
      }
    >
      <Icon icon={LogOut} size="xs" />
      <span className={showLabelOnMobile ? "inline" : "hidden sm:inline"}>
        {pending ? "Keluar..." : "Keluar"}
      </span>
    </Button>
  );
}

