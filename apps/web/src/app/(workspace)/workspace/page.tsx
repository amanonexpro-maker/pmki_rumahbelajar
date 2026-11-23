import { Suspense } from "react";
import type { Metadata } from "next";
import {
  buildContextualDashboardViewModel,
  ContextualDashboardBody,
  DashboardOrientationHeader,
} from "@/features/organization";
import { requireSession, type SessionUser } from "@/server/auth/session";
import { DashboardBodySkeleton } from "./loading";

export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard | Rumah Belajar Griya Asih Lawang — PMKI",
  description:
    "Ringkasan operasional kontekstual, antrean tindak lanjut, jadwal belajar Sabtu, dan aktivitas terbaru unit layanan.",
};

async function AsyncDashboardBody({ session }: { session: SessionUser }) {
  const vm = await buildContextualDashboardViewModel(session);
  return <ContextualDashboardBody vm={vm} />;
}

export default async function WorkspaceDashboardPage() {
  const session = await requireSession();

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Orientation Header: Immediate 0ms rendering from resolved session */}
      <DashboardOrientationHeader session={session} />

      {/* 2. Granular Streaming Boundary for Operational Aggregates */}
      <Suspense fallback={<DashboardBodySkeleton />}>
        <AsyncDashboardBody session={session} />
      </Suspense>
    </div>
  );
}
