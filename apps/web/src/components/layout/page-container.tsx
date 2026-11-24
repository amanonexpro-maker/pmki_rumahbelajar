import * as React from "react";
import { cn } from "@/lib/cn";

export type ContainerWidth = "narrow" | "default" | "wide" | "public" | "full";

export interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  width?: ContainerWidth;
  padded?: boolean;
  bottomInset?: "none" | "nav";
}

const widthClasses: Record<ContainerWidth, string> = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-[90rem]",
  public: "max-w-[78rem]",
  full: "max-w-none",
};

export function PageContainer({
  width = "default",
  padded = true,
  bottomInset = "nav",
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto",
        widthClasses[width],
        padded && "px-4 sm:px-6 lg:px-8",
        padded &&
          bottomInset === "nav" &&
          "pb-[calc(5rem+max(env(safe-area-inset-bottom,0px),16px))] md:pb-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

