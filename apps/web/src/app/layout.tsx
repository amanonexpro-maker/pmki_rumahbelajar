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
  title: "Rumah Belajar Griya Asih Lawang — Platform Pelayanan Terpadu PMKI",
  description:
    "Platform Pelayanan Terpadu PMKI (Pilot: Rumah Belajar Griya Asih Lawang). Ruang belajar inklusif, hangat, dan akuntabel.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${newsreader.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans flex flex-col">
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
