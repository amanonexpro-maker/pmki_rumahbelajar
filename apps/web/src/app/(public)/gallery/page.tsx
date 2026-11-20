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
  title: "Dokumentasi Kegiatan | Rumah Belajar Griya Asih Lawang",
  description:
    "Galeri dokumentasi kegiatan belajar, pengajar relawan, dan kebersamaan peserta didik Rumah Belajar Griya Asih Lawang yang telah melalui tinjauan privasi dan persetujuan wali.",
};

export default async function PublicGalleryPage() {
  await connection();
  const data = await getPublicPortalData();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicNavbar activeSection="galeri" />

      <main className="flex-1">
        <PublicCommunityStorySection
          volunteerTeachers={data.volunteerTeachers}
          galleryItems={data.galleryItems}
          newsItems={data.newsItems}
          showLocalContext={false}
          showGallery={true}
          showNews={false}
        />
      </main>

      <PublicFooter />
    </div>
  );
}

