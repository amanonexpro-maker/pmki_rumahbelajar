"use client";

import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { ReviewSection } from "@/components/patterns";
import { Button, Icon } from "@/components/ui";
import type { StudentDetailDTO } from "../types/student-types";

export interface StudentOverviewTabProps {
  student: StudentDetailDTO;
}

export function StudentOverviewTab({ student }: StudentOverviewTabProps) {
  const [revealGuardian, setRevealGuardian] = React.useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ReviewSection
        title="Identitas & pendidikan peserta didik"
        items={[
          { label: "Nama lengkap", value: student.fullName },
          { label: "Nama panggilan", value: student.nickname },
          { label: "Tanggal lahir", value: student.birthDate },
          {
            label: "Jenis kelamin",
            value: student.gender === "P" ? "Perempuan" : "Laki-laki",
          },
          { label: "Jenjang kelas", value: student.educationLevelLabel },
          { label: "Asal sekolah", value: student.schoolName ?? "—" },
          {
            label: "Wilayah",
            value: student.district ? `Kel. ${student.district}` : "Lawang",
          },
          {
            label: "Alamat tempat tinggal",
            value: student.guardianAccessDenied
              ? "Terlindungi (memerlukan izin guardian.read)"
              : (student.address ?? "—"),
          },
        ]}
      />

      {/* CONFIDENTIAL Guardian Card with Server-Side Default Deny + Progressive Disclosure */}
      <section className="rounded-control border border-border bg-surface-subtle/50 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Icon icon={Lock} size="xs" className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Data orang tua / wali (Rahasia)
            </h3>
          </div>

          {!student.guardianAccessDenied && student.guardian && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRevealGuardian((v) => !v)}
              leftIcon={
                <Icon icon={revealGuardian ? EyeOff : Eye} size="xs" />
              }
            >
              {revealGuardian
                ? "Sembunyikan kontak"
                : "Tampilkan kontak wali"}
            </Button>
          )}
        </div>

        {student.guardianAccessDenied ? (
          <div className="rounded-control border border-border bg-surface p-4 text-xs text-secondary-foreground space-y-1">
            <p className="font-semibold text-foreground">
              Akses data wali dibatasi
            </p>
            <p>
              Data kontak dan alamat orang tua/wali diklasifikasikan sebagai
              data rahasia (CONFIDENTIAL) dan hanya dapat diakses oleh pengurus
              yang memiliki hak akses <code>guardian.read</code> pada unit
              layanan ini.
            </p>
          </div>
        ) : student.guardian ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">Nama wali</dt>
              <dd className="font-medium text-foreground">
                {student.guardian.fullName}
              </dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">Hubungan</dt>
              <dd className="font-medium text-foreground">
                {student.guardian.relationshipLabel}
              </dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">Nomor WhatsApp</dt>
              <dd className="font-mono font-medium text-foreground">
                {revealGuardian
                  ? student.guardian.phone
                  : "••••-••••-" + student.guardian.phone.slice(-3)}
              </dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">Pekerjaan</dt>
              <dd className="font-medium text-foreground">
                {student.guardian.occupation ?? "—"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-xs text-muted-foreground">
            Data wali belum tercatat.
          </p>
        )}
      </section>
    </div>
  );
}

