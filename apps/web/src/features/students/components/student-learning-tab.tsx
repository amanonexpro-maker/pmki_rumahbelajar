"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/compositions";
import { ReviewSection } from "@/components/patterns";
import { Button } from "@/components/ui";
import type { StudentDetailDTO } from "../types/student-types";

export interface StudentLearningTabProps {
  learningContext: StudentDetailDTO["learningContext"];
  canPlaceStudent: boolean;
  onRequestPlace: () => void;
}

export function StudentLearningTab({
  learningContext,
  canPlaceStudent,
  onRequestPlace,
}: StudentLearningTabProps) {
  return (
    <div className="space-y-4">
      {learningContext ? (
        <div className="space-y-4">
          <ReviewSection
            title="Penempatan kelas aktif"
            items={[
              {
                label: "Nama kelas",
                value: learningContext.classInfo.name,
              },
              {
                label: "Kategori jenjang",
                value: learningContext.classInfo.category,
              },
              {
                label: "Pengajar utama",
                value:
                  learningContext.classInfo.mainTeacherName ??
                  "Belum ditentukan",
              },
              {
                label: "Ruang belajar",
                value:
                  learningContext.classInfo.roomName ?? "Griya Asih Lawang",
              },
              {
                label: "Kapasitas kelas",
                value: `${learningContext.classInfo.enrolledCount} / ${learningContext.classInfo.capacity} peserta didik`,
              },
            ]}
          />

          <section className="rounded-control border border-border bg-surface p-4 sm:p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Jadwal kegiatan belajar
            </h3>
            {learningContext.schedules.length > 0 ? (
              <ul className="divide-y divide-border-subtle text-xs">
                {learningContext.schedules.map((sch) => (
                  <li
                    key={sch.id}
                    className="py-2.5 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {sch.subjectName}
                      </p>
                      <p className="text-secondary-foreground">
                        Pengajar: {sch.teacherName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        {sch.dayOfWeek}, {sch.startTime}–{sch.endTime}
                      </p>
                      <p className="text-muted-foreground">
                        {sch.location ?? "Ruang Belajar"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Jadwal kelas ini belum ditambahkan.
              </p>
            )}
          </section>
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Belum ditempatkan ke kelas."
          description="Peserta didik ini belum memiliki kelas aktif pada tahun ajaran berjalan."
          action={
            canPlaceStudent ? (
              <Button type="button" variant="primary" onClick={onRequestPlace}>
                Tempatkan ke kelas
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}

