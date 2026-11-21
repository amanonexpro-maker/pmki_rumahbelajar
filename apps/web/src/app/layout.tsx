import type { Metadata } from "next";
import {
  Newsreader,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { PwaRegister } from "@/components/layout/pwa-register";
import { SplashScreenGate } from "@/components/layout/splash-screen-gate";
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

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://pmkirumahbelajar-web.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    url: siteUrl,
    siteName: "PMKI Platform",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: `${siteUrl}/pmki_og_image.jpg`,
        secureUrl: `${siteUrl}/pmki_og_image.jpg`,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Rumah Belajar Griya Asih Lawang — PMKI",
      },
      {
        url: `${siteUrl}/pmki_og_image.png`,
        secureUrl: `${siteUrl}/pmki_og_image.png`,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Rumah Belajar Griya Asih Lawang — PMKI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rumah Belajar Griya Asih Lawang — Platform Pelayanan Terpadu PMKI",
    description:
      "Ayo belajar dan tumbuh bersama. Rumah belajar yang terbuka bagi semua.",
    images: [`${siteUrl}/pmki_og_image.jpg`],
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('reduce-motion-active');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full bg-background text-foreground font-sans flex flex-col"
      >
        <ThemeProvider>
          <ConnectivityProvider>
            <SplashScreenGate />
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
            <PwaRegister />
          </ConnectivityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
