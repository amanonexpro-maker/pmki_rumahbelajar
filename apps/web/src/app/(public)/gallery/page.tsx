import { permanentRedirect as redirect } from "next/navigation";

/**
 * Fase 14 Gelombang 1b: Redirect stub dua-fase (Tahap 1 -> '/').
 * Mencegah 404 pada rute warisan /gallery; akan dialihkan ke /kabar?tab=galeri pada Step 7.
 */
export default function PublicGalleryPage() {
  redirect("/");
}
