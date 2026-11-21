import type { Metadata } from "next";
import { PublicNavbar } from "@/features/public";
import { PublicRegistrationWizard } from "@/features/students";

export const instant = false;

export const metadata: Metadata = {
  title: "Pendaftaran Peserta Didik Baru | Rumah Belajar Griya Asih Lawang",
  description:
    "Formulir pendaftaran peserta didik baru Rumah Belajar Griya Asih Lawang — Platform Pelayanan Terpadu PMKI. Mendukung penyimpanan draf dan antrean pengiriman luring.",
};

export default function PublicRegistrationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicNavbar activeSection="pendaftaran" />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="space-y-3">
            <p className="type-eyebrow text-primary uppercase tracking-wider">
              Pendaftaran Peserta Didik Baru
            </p>
            <h1 className="type-display text-foreground tracking-tight">
              Mari belajar dan tumbuh bersama.
            </h1>
            <p className="type-body-sm text-secondary-foreground leading-relaxed">
              Rumah belajar yang terbuka bagi semua anak jenjang TK hingga SMP
              Kelas 8 di wilayah Kalirejo, Lawang, dan sekitarnya. Jika koneksi
              internet sedang terputus, formulir Anda tetap dapat diisi dan akan
              disimpan ke antrean lokal untuk dikirim saat kembali daring.
            </p>
          </div>

          <PublicRegistrationWizard />
        </div>
      </main>
    </div>
  );
}
