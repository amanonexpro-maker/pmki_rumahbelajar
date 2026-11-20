import type { Metadata } from "next";
import {
  Newsreader,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { PwaRegister } from "@/components/layout/pwa-register";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectivityProvider } from "@/hooks/use-connectivity";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-loaded",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-loaded",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://pmkirumahbelajar-web.vercel.app"
  ),
  title: "Rumah Belajar Griya Asih Lawang — Platform Pelayanan Terpadu PMKI",
  description:
    "Platform Pelayanan Terpadu PMKI (Pilot: Rumah Belajar Griya Asih Lawang). Ruang belajar inklusif, hangat, dan akuntabel.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/pmki_app_icon.svg", type: "image/svg+xml" },
      { url: "/pmki_app_icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/pmki_app_icon.png", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Rumah Belajar Griya Asih Lawang — Platform Pelayanan Terpadu PMKI",
    description:
      "Ayo belajar dan tumbuh bersama. Rumah belajar yang terbuka bagi semua di Lawang, Kabupaten Malang.",
    siteName: "PMKI Platform",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/pmki_og_image.png",
        width: 1536,
        height: 1024,
        alt: "Rumah Belajar Griya Asih Lawang — PMKI",
      },
      {
        url: "/pmki_og_image.svg",
        width: 1200,
        height: 480,
        alt: "Rumah Belajar Griya Asih Lawang — PMKI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rumah Belajar Griya Asih Lawang — Platform Pelayanan Terpadu PMKI",
    description:
      "Ayo belajar dan tumbuh bersama. Rumah belajar yang terbuka bagi semua.",
    images: ["/pmki_og_image.png", "/pmki_og_image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${newsreader.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full bg-background text-foreground font-sans flex flex-col"
      >
        <ThemeProvider>
          <ConnectivityProvider>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
            <PwaRegister />
          </ConnectivityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
