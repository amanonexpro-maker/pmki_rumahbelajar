import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

export type SheetSide = 'right' | 'left' | 'bottom';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: SheetSide;
  closeOnBackdrop?: boolean;
  className?: string;
}

const sidePositionClasses: Record<SheetSide, string> = {
  right: 'inset-y-0 right-0 h-full w-full max-w-md border-l border-border',
  left: 'inset-y-0 left-0 h-full w-full max-w-md border-r border-border',
  bottom: 'inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-feature border-t border-border',
};

export const Sheet: React.FC<SheetProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  closeOnBackdrop = true,
  className,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const focusable = sheetRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) {
        focusable.focus();
      } else {
        sheetRef.current?.focus();
      }
    }, 10);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/45 backdrop-blur-[2px] animate-backdrop"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'fixed bg-surface text-foreground shadow-overlay flex flex-col outline-none',
          side === 'left' ? 'animate-sheet-left' : 'animate-sheet-right',
          sidePositionClasses[side],
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
          <div className="space-y-1 min-w-0">
            {title && (
              <h2 id={titleId} className="type-title text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p id={descriptionId} className="type-body-sm text-secondary-foreground">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel"
            className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors focus-ring shrink-0"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 bg-surface-subtle border-t border-border flex flex-wrap items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

