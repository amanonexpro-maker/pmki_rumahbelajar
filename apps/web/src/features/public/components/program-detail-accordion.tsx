"use client";

import * as React from "react";
import { ICON_MAP } from "@/config/icons";
import { cn } from "@/lib/cn";
import type { PublicProgramItemDTO } from "../types/public-types";

export interface ProgramDetailAccordionProps {
  programs: PublicProgramItemDTO[];
}

function getProgramIconKey(id: string): string {
  if (id.includes("matematika")) return "math";
  if (id.includes("inggris") || id.includes("membaca")) return "literacy";
  return "karakter";
}

/**
 * ProgramDetailAccordion (Fase 14 Step 6, UI-UX §15, 03 §9).
 * Accordion vertikal kurikulum interaktif hemat ruang vertikal di mobile.
 * - Iterasi 4 program kanonikal lengkap dari PUBLIC_PROGRAMS_LIST.
 * - Verifikasi 3 poin kurikulum Matematika Ceria sesuai KB live.
 * - Default expanded: program pertama (Matematika Ceria).
 * - Transisi halus mematuhi prefers-reduced-motion.
 */
export function ProgramDetailAccordion({ programs }: ProgramDetailAccordionProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(
    programs[0]?.id ?? null
  );

  const toggleProgram = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="divide-y divide-border border-y border-border">
      {programs.map((program) => {
        const isExpanded = expandedId === program.id;
        const iconKey = getProgramIconKey(program.id);
        const IconComponent = ICON_MAP[iconKey] ?? ICON_MAP.program;

        return (
          <div key={program.id} className="py-1">
            {/* Header Clickable Button (min-h-11 touch target) */}
            <button
              type="button"
              onClick={() => toggleProgram(program.id)}
              aria-expanded={isExpanded}
              aria-controls={`program-panel-${program.id}`}
              id={`program-header-${program.id}`}
              className="w-full py-4 px-1 flex items-center justify-between gap-3 text-left hover:text-primary transition-colors duration-200 focus-ring rounded-control min-h-11"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-control bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  {IconComponent && (
                    <IconComponent aria-hidden="true" className="w-4 h-4 shrink-0" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                      Program {program.number}
                    </span>
                    {program.badgeText && (
                      <span className="text-[10px] px-2 py-0.5 rounded-pill bg-activity-soft text-activity font-semibold">
                        {program.badgeText}
                      </span>
                    )}
                  </div>
                  <h3 className="font-sans text-sm sm:text-base font-bold text-foreground leading-snug truncate">
                    {program.title}
                  </h3>
                </div>
              </div>

              {/* Chevron Down/Up Indicator */}
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-muted-foreground transition-transform duration-200",
                  isExpanded && "rotate-180 text-primary"
                )}
                aria-hidden="true"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </button>

            {/* Body Panel (Expanded Content) */}
            {isExpanded && (
              <div
                id={`program-panel-${program.id}`}
                role="region"
                aria-labelledby={`program-header-${program.id}`}
                className="pb-5 pt-1 pl-1 sm:pl-11 pr-2 space-y-3.5 text-xs sm:text-sm text-secondary-foreground leading-relaxed animate-in fade-in-50 duration-200"
              >
                <p>{program.description}</p>

                {/* Poin Kunci Kurikulum (Bullet List) */}
                {program.highlights && program.highlights.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                      Fokus Pembelajaran:
                    </p>
                    <ul className="space-y-1.5 list-disc pl-5 text-muted-foreground">
                      {program.highlights.map((point) => (
                        <li key={point} className="leading-relaxed">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cerita Pencapaian (Bila ada) */}
                {program.storyHighlight && (
                  <div className="p-3 rounded-control bg-surface-subtle border-l-2 border-primary text-xs text-foreground italic">
                    {program.storyHighlight}
                  </div>
                )}

                {/* Jenjang Sasaran */}
                <div className="pt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Sasaran:</span>
                  <span>{program.targetNote}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

