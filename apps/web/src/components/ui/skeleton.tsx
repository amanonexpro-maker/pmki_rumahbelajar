import * as React from "react";
import { cn } from "@/lib/cn";

export type SkeletonVariant = "text" | "circle" | "card" | "rect";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: "h-4 rounded-xs",
  circle: "rounded-pill",
  card: "rounded-card",
  rect: "rounded-control",
};

export function Skeleton({
  variant = "rect",
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-surface-subtle border border-border-subtle/50",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

