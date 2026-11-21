import { Suspense } from "react";
import { headers } from "next/headers";
import { AppSplashScreen } from "./app-splash-screen";

async function SplashScreenServer() {
  const headersList = await headers();
  const shouldShow = headersList.get("x-pmki-splash") === "1";
  return <AppSplashScreen serverShowSplash={shouldShow} />;
}

/**
 * Server wrapper dengan Suspense boundary agar keputusan SSR visibility splash
 * tidak membatalkan static prerendering pada rute-rute statis di Next.js 16 (PPR).
 */
export function SplashScreenGate() {
  return (
    <Suspense fallback={null}>
      <SplashScreenServer />
    </Suspense>
  );
}

