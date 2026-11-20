import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { Avatar, Button, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

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

export function EntityHeader({
  backLabel = "Kembali",
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
}: EntityHeaderProps) {
  return (
    <header className={cn("space-y-4 pb-2", className)}>
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
            <div className="h-12 w-12 rounded-card bg-primary-soft text-primary border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
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
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>

      {meta && meta.length > 0 && (
        <dl className="flex flex-wrap gap-x-6 gap-y-2 pt-3 border-t border-border-subtle text-xs">
          {meta.map((item) => (
            <div key={item.id} className="space-y-0.5">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="font-semibold text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}

