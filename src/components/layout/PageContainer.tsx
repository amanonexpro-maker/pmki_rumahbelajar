import React from 'react';
import { cn } from '../../utils/cn.ts';

export type ContainerWidth = 'narrow' | 'default' | 'wide' | 'public' | 'full';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: ContainerWidth;
  padded?: boolean;
}

const widthClasses: Record<ContainerWidth, string> = {
  narrow: 'max-w-3xl',       /* Forms & focused tasks (~768px) */
  default: 'max-w-6xl',      /* Standard workspace lists & details (~1152px) */
  wide: 'max-w-[90rem]',     /* Operational tables & broad workspace (~1440px) */
  public: 'max-w-[78rem]',   /* Public website container (~1248px, Section 13) */
  full: 'max-w-none',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  width = 'default',
  padded = true,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'w-full mx-auto',
        widthClasses[width],
        padded && 'px-4 sm:px-6 lg:px-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

