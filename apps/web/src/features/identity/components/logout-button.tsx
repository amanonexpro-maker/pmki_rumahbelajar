"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button, Icon } from "@/components/ui";
import { logoutAction } from "../actions/auth-actions";

export function LogoutButton() {
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
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={pending}
      aria-label="Keluar dari ruang kerja"
    >
      <Icon icon={LogOut} size="xs" />
      <span className="hidden sm:inline">
        {pending ? "Keluar..." : "Keluar"}
      </span>
    </Button>
  );
}

