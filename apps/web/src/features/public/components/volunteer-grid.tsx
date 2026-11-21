import * as React from "react";
import type { PublicVolunteerTeacherDTO } from "../types/public-types";

export interface VolunteerGridProps {
  teachers: PublicVolunteerTeacherDTO[];
}

function getInitials(name: string): string {
  const cleaned = name.replace(/^(Ms\.|Mr\.)\s*/, "").trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * VolunteerGrid (Fase 14 Step 6, UI-UX §15, 03 §9).
 * Grid avatar responsive menampilkan 13 pengajar relawan dari sekolah Katolik & negeri di Lawang.
 * - Menggunakan fallback lingkaran inisial elegan karena photoUrl absent di model data.
 * - Aksesibilitas WCAG AA: aria-label deskriptif per pengajar.
 */
export function VolunteerGrid({ teachers }: VolunteerGridProps) {
  return (
    <div
      role="list"
      aria-label="Daftar pengajar relawan Rumah Belajar Griya Asih"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4"
    >
      {teachers.map((teacher) => {
        const initials = getInitials(teacher.name);

        return (
          <div
            key={teacher.name}
            role="listitem"
            aria-label={`${teacher.name} (${teacher.focusRole})`}
            className="flex flex-col items-center text-center p-3.5 rounded-card bg-surface border border-border hover:border-primary/30 transition-colors space-y-2"
          >
            {/* Avatar Lingkaran Inisial Elegan */}
            <div
              className="w-14 h-14 rounded-full bg-primary-soft text-primary font-bold text-sm flex items-center justify-center border-2 border-surface shadow-xs shrink-0 select-none"
              aria-hidden="true"
            >
              {initials}
            </div>

            {/* Identitas Pengajar */}
            <div className="w-full space-y-0.5">
              <p className="font-semibold text-xs text-foreground truncate max-w-full" title={teacher.name}>
                {teacher.name}
              </p>
              <p className="text-[10px] text-primary font-medium truncate max-w-full" title={teacher.originInstitution}>
                {teacher.originInstitution}
              </p>
              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight" title={teacher.focusRole}>
                {teacher.focusRole}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

