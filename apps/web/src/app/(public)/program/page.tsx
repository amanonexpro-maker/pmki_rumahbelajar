import type { Metadata } from "next";
import { connection } from "next/server";
import {
  getPublicPortalData,
  PublicCommunityStorySection,
  PublicFooter,
  PublicNavbar,
  PublicProgramsSection,
  PublicRegistrationCtaSection,
} from "@/features/public";

export const instant = false;

export const metadata: Metadata = {
  title: "Program & Jadwal Belajar | Rumah Belajar Griya Asih Lawang",
  description:
    "Kurikulum Happy Learning (Matematika Ceria, Bahasa Inggris Praktis, Pendidikan Karakter, Kelas Khusus Membaca 1 Jam) dan jadwal belajar Sabtu 15.00–17.15 WIB di RAAL Griya Asih Lawang.",
};

export default async function PublicProgramPage() {
  await connection();
  const data = await getPublicPortalData();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicNavbar activeSection="program" />

      <main className="flex-1">
        <section className="bg-surface border-b border-border py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            <p className="type-eyebrow text-primary uppercase tracking-wider">
              Program &amp; Kelas Rumah Belajar
            </p>
            <h1 className="type-display text-foreground tracking-tight">
              Pendampingan belajar yang hangat untuk jenjang TK hingga SMP Kelas
              8.
            </h1>
            <p className="type-body text-secondary-foreground max-w-3xl">
              Setiap anak memiliki kesempatan untuk berkembang. Seluruh sesi
              bimbingan belajar dilaksanakan setiap hari Sabtu pukul 15.00 –
              17.15 WIB di RAAL Griya Asih Lawang bersama 13 pengajar relawan.
            </p>
          </div>
        </section>

        <PublicProgramsSection
          programs={data.programs}
          gradeTargets={data.gradeTargets}
          scheduleSlots={data.scheduleSlots}
          scheduleDay={data.scheduleDay}
          scheduleHours={data.scheduleHours}
          locationFull={data.locationFull}
        />

        <PublicCommunityStorySection
          volunteerTeachers={data.volunteerTeachers}
          galleryItems={data.galleryItems}
          newsItems={data.newsItems}
          showLocalContext={true}
          showGallery={false}
          showNews={false}
        />

        <PublicRegistrationCtaSection
          ctaHeadline={data.ctaHeadline}
          locationFull={data.locationFull}
          coordinators={data.coordinators}
          embedRegistrationWizard={false}
        />
      </main>

      <PublicFooter />
    </div>
  );
}

