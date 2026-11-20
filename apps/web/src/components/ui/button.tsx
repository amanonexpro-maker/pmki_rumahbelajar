import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center font-semibold select-none cursor-pointer focus-ring",
    "transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150 active:scale-[0.985]",
    "disabled:opacity-55 disabled:pointer-events-none disabled:cursor-not-allowed disabled:active:scale-100",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs border border-transparent",
        secondary:
          "bg-surface text-foreground hover:bg-surface-subtle border border-border shadow-xs",
        soft: "bg-primary-soft text-primary hover:bg-primary-soft-hover border border-transparent",
        ghost:
          "bg-transparent text-secondary-foreground hover:bg-surface-subtle hover:text-foreground border border-transparent",
        destructive:
          "bg-danger text-white hover:opacity-90 shadow-xs border border-transparent",
        link: "bg-transparent text-primary hover:text-primary-hover underline-offset-4 hover:underline p-0 h-auto min-h-0 border-transparent shadow-none",
      },
      size: {
        sm: "min-h-9 sm:min-h-8 px-3 text-xs gap-1.5 rounded-sm",
        md: "min-h-11 sm:min-h-10 px-4 text-sm gap-2 rounded-control",
        lg: "min-h-11 px-5 text-base gap-2.5 rounded-md",
        icon: "h-11 w-11 sm:h-9 sm:w-9 p-0 rounded-control",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      fullWidth = false,
      type = "button",
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    if (asChild) {
      return (
        <Comp
          ref={ref}
          className={cn(
            buttonVariants({ variant, size }),
            fullWidth && "w-full",
            className
          )}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2
            aria-hidden="true"
            className="h-4 w-4 animate-spin shrink-0"
          />
        ) : (
          leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && rightIcon && (
          <span className="shrink-0 inline-flex">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

