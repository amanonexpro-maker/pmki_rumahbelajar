import type { Metadata } from "next";
import {
  getMyProfileView,
  MyProfileClient,
} from "@/features/identity";
import { requireSession } from "@/server/auth/session";

export const instant = false;

export const metadata: Metadata = {
  title: "Profil Saya | PMKI",
  description:
    "Informasi akun, peran, lingkup unit layanan, kewenangan akses, dan pengaturan kata sandi Anda.",
};

export default async function WorkspaceProfilePage() {
  const session = await requireSession();
  const profileRes = await getMyProfileView(session);

  if (!profileRes.success) {
    return (
      <div
        role="alert"
        className="rounded-card border border-danger/30 bg-danger-soft p-6 text-sm text-danger"
      >
        <p className="font-semibold">Profil tidak tersedia</p>
        <p className="mt-1">{profileRes.error.message}</p>
      </div>
    );
  }

  return <MyProfileClient profile={profileRes.data} />;
}

