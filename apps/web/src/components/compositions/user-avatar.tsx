import * as React from "react";
import { Avatar, type AvatarSize } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface UserAvatarProps {
  name: string;
  subtitle?: string;
  src?: string | null;
  consentGranted?: boolean;
  size?: AvatarSize;
  className?: string;
}

export function UserAvatar({
  name,
  subtitle,
  src,
  consentGranted = true,
  size = "sm",
  className,
}: UserAvatarProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 min-w-0", className)}>
      <Avatar
        name={name}
        src={src}
        consentGranted={consentGranted}
        size={size}
      />
      <div className="min-w-0 text-left leading-tight">
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        {subtitle && (
          <p className="type-caption text-secondary-foreground truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

