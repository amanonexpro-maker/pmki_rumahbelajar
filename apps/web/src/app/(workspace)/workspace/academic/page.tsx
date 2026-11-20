import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/compositions";
import { PageHeader, StatSummary } from "@/components/patterns";
import { Badge } from "@/components/ui";
import {
  listAcademicYears,
  listClassesForServiceUnit,
} from "@/features/academic";
import { requireSession } from "@/server/auth/session";

export const instant = false;

export const metadata: Metadata = {
  title: "Kelas & Pengajar | PMKI",
  description:
    "Ringkasan kelas aktif, kapasitas peserta didik, dan pengajar Rumah Belajar PMKI.",
};

export default async function WorkspaceAcademicPage() {
  const session = await requireSession();
  const primaryUnitId = session.memberships[0]?.serviceUnitId;

  const [classes, academicYears] = await Promise.all([
    primaryUnitId ? listClassesForServiceUnit(primaryUnitId) : Promise.resolve([]),
    primaryUnitId ? listAcademicYears(primaryUnitId) : Promise.resolve([]),
  ]);

  const activeYear = academicYears.find((y) => y.active) ?? academicYears[0];
  const totalCapacity = classes.reduce((acc, c) => acc + c.capacity, 0);
  const totalEnrolled = classes.reduce((acc, c) => acc + c.enrolledCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelas & Pengajar"
        description={`Pengelolaan kelas dan kapasitas belajar pada Tahun Ajaran ${activeYear?.name ?? "2026/2027"}.`}
      />

      <StatSummary
        items={[
          {
            id: "active-year",
            label: "Tahun ajaran aktif",
            value: activeYear ? `TA ${activeYear.name}` : "—",
          },
          {
            id: "classes",
            label: "Total kelas aktif",
            value: `${classes.length} kelas`,
          },
          {
            id: "enrolled",
            label: "Keterisian kursi",
            value: `${totalEnrolled} / ${totalCapacity} peserta didik`,
          },
        ]}
      />

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((cls) => (
            <section
              key={cls.id}
              className="rounded-card border border-border bg-surface p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {cls.name}
                  </h2>
                  <p className="text-xs text-secondary-foreground">
                    Jenjang {cls.category} · {cls.roomName ?? "Griya Asih Lawang"}
                  </p>
                </div>
                <Badge variant={cls.isFull ? "warning" : "success"}>
                  {cls.isFull
                    ? "Kapasitas penuh"
                    : `Sisa ${cls.remainingSeats} kursi`}
                </Badge>
              </div>

              <dl className="grid grid-cols-2 gap-3 pt-2 border-t border-border-subtle text-xs">
                <div>
                  <dt className="text-muted-foreground">Pengajar utama</dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {cls.mainTeacherName ?? "Belum ditentukan"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Peserta didik aktif</dt>
                  <dd className="font-mono font-semibold text-foreground mt-0.5">
                    {cls.enrolledCount} / {cls.capacity}
                  </dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="Belum ada kelas terdaftar."
          description="Tambahkan kelas bimbingan belajar untuk mulai menempatkan peserta didik."
        />
      )}
    </div>
  );
}

