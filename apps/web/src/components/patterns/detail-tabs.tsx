"use client";

import * as React from "react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface DetailTabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface DetailTabsProps {
  tabs: DetailTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function DetailTabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel = "Tab detail entitas",
  className,
}: DetailTabsProps) {
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const targetTab = tabs[nextIndex];
      if (targetTab) {
        onChange(targetTab.id);
        tabRefs.current[nextIndex]?.focus();
      }
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "border-b border-border flex items-center gap-1 overflow-x-auto no-scrollbar",
        className
      )}
    >
      {tabs.map((tab, idx) => {
        const isSelected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "relative inline-flex min-h-11 sm:min-h-10 items-center gap-2 px-3.5 py-2 text-sm whitespace-nowrap transition-colors cursor-pointer focus-ring rounded-t-sm",
              isSelected
                ? "text-primary font-semibold"
                : "text-secondary-foreground hover:text-foreground font-medium"
            )}
          >
            {tab.icon && (
              <span className="shrink-0 inline-flex">{tab.icon}</span>
            )}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <Badge variant={isSelected ? "primary" : "neutral"} size="sm">
                {tab.count}
              </Badge>
            )}
            {isSelected && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-primary rounded-t-pill"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

