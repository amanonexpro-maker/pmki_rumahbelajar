import { permanentRedirect as redirect } from "next/navigation";

/**
 * Fase 14 Gelombang 1b: Redirect stub dua-fase (Tahap 1 -> '/').
 * Mencegah 404 pada rute warisan /news; akan dialihkan ke /kabar?tab=berita pada Step 7.
 */
export default function PublicNewsPage() {
  redirect("/");
}
