import type { Metadata } from "next";
import { connection } from "next/server";
import {
  getPublicPortalData,
  PublicCommunityStorySection,
  PublicFooter,
  PublicNavbar,
} from "@/features/public";

export const instant = false;

export const metadata: Metadata = {
  title: "Publikasi & Berita | Rumah Belajar Griya Asih Lawang",
  description:
    "Berita terkini, kisah kemajuan literasi peserta didik, dan agenda kegiatan Rumah Belajar Griya Asih Lawang — PMKI Mupel Jawa Timur.",
};

export default async function PublicNewsPage() {
  await connection();
  const data = await getPublicPortalData();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicNavbar activeSection="berita" />

      <main className="flex-1">
        <PublicCommunityStorySection
          volunteerTeachers={data.volunteerTeachers}
          galleryItems={data.galleryItems}
          newsItems={data.newsItems}
          showLocalContext={false}
          showGallery={false}
          showNews={true}
        />
      </main>

      <PublicFooter />
    </div>
  );
}

