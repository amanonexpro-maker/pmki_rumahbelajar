import type { Metadata } from "next";
import { connection } from "next/server";
import { PublicNavbar } from "@/features/public";
import { KabarFeedView } from "@/features/public/components/kabar-feed-view";

export const instant = false;

export const metadata: Metadata = {
  title: "Kabar Griya Asih | Rumah Belajar Griya Asih Lawang",
  description:
    "Kabar terkini seputar kegiatan bimbingan belajar, kisah kemajuan anak, dan dokumentasi komunitas Rumah Belajar Griya Asih di Lawang.",
};

/**
 * PublicKabarPage (Fase 14 Step 3 — Scaffold Shell).
 * Menghubungkan taksonomi rute /kabar agar tidak ada dead-link / 404 dari navigasi global.
 * Data query artikel dan album nyata diintegrasikan pada Step 7.
 */
export default async function PublicKabarPage() {
  await connection();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Page Header */}
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="font-sans text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Kabar Griya Asih
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {/* TODO Step 7 supply copy resmi */}
              Kabar terkini seputar kegiatan bimbingan belajar, kisah kemajuan anak, dan dokumentasi komunitas.
            </p>
          </div>

          {/* Interactive Filter Tabs & Feed Scaffold */}
          <KabarFeedView initialItems={[]} />
        </div>
      </main>
    </div>
  );
}

