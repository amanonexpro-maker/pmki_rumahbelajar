import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Avatar, Button, Icon } from '../ui/index.ts';
import { cn } from '../../utils/cn.ts';

export interface EntityMetaItem {
  id: string;
  label: string;
  value: React.ReactNode;
}

export interface EntityHeaderProps {
  backLabel?: string;
  onBack?: () => void;
  avatarName?: string;
  avatarSrc?: string | null;
  consentGranted?: boolean;
  icon?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  meta?: EntityMetaItem[];
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  className?: string;
}

/**
 * EntityHeader Pattern (Sections 32, 33 & 45 of UI-UX-DESIGN-SYSTEM.md)
 * Signature identity header for detail views (Student Detail, Class Detail, Program Detail).
 */
export const EntityHeader: React.FC<EntityHeaderProps> = ({
  backLabel = 'Kembali',
  onBack,
  avatarName,
  avatarSrc,
  consentGranted = true,
  icon,
  eyebrow,
  title,
  subtitle,
  badges,
  meta,
  primaryAction,
  secondaryActions,
  className,
}) => {
  return (
    <header className={cn('space-y-4 pb-2', className)}>
      {onBack && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon icon={ArrowLeft} size="xs" />}
            onClick={onBack}
            className="-ml-2 text-secondary-foreground hover:text-foreground"
          >
            {backLabel}
          </Button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {avatarName && (
            <Avatar
              name={avatarName}
              src={avatarSrc}
              consentGranted={consentGranted}
              size="lg"
              className="mt-0.5"
            />
          )}

          {!avatarName && icon && (
            <div className="w-12 h-12 rounded-card bg-primary-soft text-primary border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
              {icon}
            </div>
          )}

          <div className="space-y-1.5 min-w-0">
            {eyebrow && (
              <div className="type-eyebrow text-primary uppercase tracking-wider">
                {eyebrow}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="type-h2 text-foreground tracking-tight">{title}</h1>
              {badges && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {badges}
                </div>
              )}
            </div>

            {subtitle && (
              <p className="type-body-sm text-secondary-foreground max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {(secondaryActions || primaryAction) && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 lg:pt-1">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>

      {meta && meta.length > 0 && (
        <dl className="pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
          {meta.map((item) => (
            <div key={item.id}>
              <dt className="type-caption text-secondary-foreground">
                {item.label}
              </dt>
              <dd className="text-sm font-semibold text-foreground mt-0.5 truncate">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
};

