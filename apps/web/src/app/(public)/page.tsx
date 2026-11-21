import type { Metadata } from "next";
import { connection } from "next/server";
import { HOURS } from "@/config/site";
import {
  getPublicPortalData,
  PublicCuratedHome,
  PublicNavbar,
} from "@/features/public";

export const instant = false;

export const metadata: Metadata = {
  title:
    "Rumah Belajar Griya Asih Lawang — Ayo Belajar dan Tumbuh Bersama | PMKI",
  description:
    `Rumah belajar yang terbuka bagi semua di Lawang, Kabupaten Malang. Bimbingan belajar Matematika, Bahasa Inggris, Pendidikan Karakter, dan Literasi Membaca 1 Jam setiap Sabtu pukul ${HOURS.window} bersama 13 pengajar relawan.`,
  openGraph: {
    title: "Rumah Belajar Griya Asih Lawang — Platform Pelayanan Terpadu PMKI",
    description:
      "Ayo belajar dan tumbuh bersama. Rumah belajar yang terbuka bagi semua. Setiap anak memiliki kesempatan untuk berkembang.",
    url: "https://pmkirumahbelajar-web.vercel.app",
    siteName: "PMKI Platform",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "https://pmkirumahbelajar-web.vercel.app/pmki_og_image.jpg",
        secureUrl: "https://pmkirumahbelajar-web.vercel.app/pmki_og_image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Rumah Belajar Griya Asih Lawang — PMKI",
      },
      {
        url: "https://pmkirumahbelajar-web.vercel.app/pmki_og_image.png",
        secureUrl: "https://pmkirumahbelajar-web.vercel.app/pmki_og_image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Rumah Belajar Griya Asih Lawang — PMKI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Rumah Belajar Griya Asih Lawang — Ayo Belajar dan Tumbuh Bersama | PMKI",
    description:
      "Ayo belajar dan tumbuh bersama. Rumah belajar yang terbuka bagi semua.",
    images: ["https://pmkirumahbelajar-web.vercel.app/pmki_og_image.jpg"],
  },
};

export default async function PublicHomePage() {
  await connection();
  const data = await getPublicPortalData();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">
        <PublicCuratedHome data={data} />
      </main>
    </div>
  );
}
