"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
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
 * Grid avatar responsive menampilkan pengajar relawan dengan foto profil opt-in
 * (fallback ke inisial elegan) serta modal detail profil saat diklik.
 */
export function VolunteerGrid({ teachers }: VolunteerGridProps) {
  const [selectedTeacher, setSelectedTeacher] =
    React.useState<PublicVolunteerTeacherDTO | null>(null);

  return (
    <>
      <div
        role="list"
        aria-label="Daftar pengajar relawan Rumah Belajar Griya Asih"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4"
      >
        {teachers.map((teacher) => {
          const initials = getInitials(teacher.name);

          return (
            <button
              key={teacher.name}
              type="button"
              role="listitem"
              onClick={() => setSelectedTeacher(teacher)}
              aria-label={`Lihat profil ${teacher.name} (${teacher.focusRole})`}
              className="flex flex-col items-center text-center p-3.5 rounded-card bg-surface border border-border hover:border-primary/40 hover:bg-surface-subtle/40 transition-colors space-y-2 cursor-pointer focus-ring"
            >
              {teacher.avatarUrl ? (
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-surface shadow-xs shrink-0"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-full bg-primary-soft text-primary font-bold text-sm flex items-center justify-center border-2 border-surface shadow-xs shrink-0 select-none"
                  aria-hidden="true"
                >
                  {initials}
                </div>
              )}

              <div className="w-full space-y-0.5">
                <p
                  className="font-semibold text-xs text-foreground truncate max-w-full"
                  title={teacher.name}
                >
                  {teacher.name}
                </p>
                <p
                  className="text-[10px] text-primary font-medium truncate max-w-full"
                  title={teacher.originInstitution}
                >
                  {teacher.originInstitution}
                </p>
                <p
                  className="text-[10px] text-muted-foreground line-clamp-2 leading-tight"
                  title={teacher.focusRole}
                >
                  {teacher.focusRole}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog
        open={Boolean(selectedTeacher)}
        onOpenChange={(open) => {
          if (!open) setSelectedTeacher(null);
        }}
      >
        <DialogContent>
          {selectedTeacher && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTeacher.name}</DialogTitle>
                <DialogDescription>
                  Profil Pengajar Relawan Rumah Belajar PMKI
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="space-y-4">
                <div className="flex items-center gap-4">
                  {selectedTeacher.avatarUrl ? (
                    <img
                      src={selectedTeacher.avatarUrl}
                      alt={selectedTeacher.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-border shrink-0"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full bg-primary-soft text-primary font-bold text-base flex items-center justify-center border-2 border-border shrink-0"
                      aria-hidden="true"
                    >
                      {getInitials(selectedTeacher.name)}
                    </div>
                  )}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {selectedTeacher.name}
                      </p>
                      {selectedTeacher.isCoordinator && (
                        <Badge variant="primary" size="sm">
                          Koordinator
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-primary">
                      {selectedTeacher.originInstitution}
                    </p>
                    <p className="text-xs text-secondary-foreground">
                      {selectedTeacher.focusRole}
                    </p>
                  </div>
                </div>

                <div className="rounded-control border border-border-subtle bg-surface-subtle/40 p-3.5 text-xs text-secondary-foreground leading-relaxed">
                  {selectedTeacher.publicBio?.trim() ||
                    "Aktif mendampingi peserta didik dengan penuh kasih di Rumah Belajar PMKI."}
                </div>
              </DialogBody>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSelectedTeacher(null)}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
