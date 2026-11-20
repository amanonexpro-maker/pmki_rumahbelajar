import React, { useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  alt?: string;
  size?: AvatarSize;
  /**
   * Respects child media consent rules (Section 12 & 39 of Design System).
   * If false, image is suppressed in favor of initials/fallback.
   */
  consentGranted?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

function getInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  alt,
  size = 'md',
  consentGranted = true,
  className,
  ...props
}) => {
  const [imgError, setImgError] = useState(false);
  const canShowImage = Boolean(src) && consentGranted && !imgError;
  const initials = getInitials(name);

  return (
    <div
      role="img"
      aria-label={alt || name || 'Avatar pengguna'}
      className={cn(
        'relative inline-flex items-center justify-center rounded-pill overflow-hidden shrink-0 select-none',
        'bg-primary-soft text-primary font-semibold border border-border',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {canShowImage ? (
        <img
          src={src!}
          alt={alt || name || ''}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : initials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <UserIcon aria-hidden="true" className="w-1/2 h-1/2" />
      )}
    </div>
  );
};

