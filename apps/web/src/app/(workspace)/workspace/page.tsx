import type { Metadata } from "next";
import {
  buildContextualDashboardViewModel,
  ContextualDashboardView,
} from "@/features/organization";
import { requireSession } from "@/server/auth/session";

export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard | Rumah Belajar Griya Asih Lawang — PMKI",
  description:
    "Ringkasan operasional kontekstual, antrean tindak lanjut, jadwal belajar Sabtu, dan aktivitas terbaru unit layanan.",
};

export default async function WorkspaceDashboardPage() {
  const session = await requireSession();
  const vm = await buildContextualDashboardViewModel(session);

  return <ContextualDashboardView vm={vm} />;
}
