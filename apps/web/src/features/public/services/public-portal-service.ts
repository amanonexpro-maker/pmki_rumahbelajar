import {
  listPublicGalleryMedia,
  MEDIA_CATEGORY_LABELS,
  type MediaAssetDTO,
} from "@/features/media";
import {
  getDefaultPilotServiceUnit,
} from "@/features/organization";
import {
  getPublishedPublicationBySlug,
  listPublishedContent,
  PUBLICATION_CATEGORY_LABELS,
  type PublicationDTO,
} from "@/features/publishing";
import { formatToIndonesianStandard } from "@/utils/date-formatter";
import type {
  ArticleContent,
  GalleryAlbumContent,
  GalleryPhoto,
  PublicContent,
  PublicCoordinatorContactDTO,
  PublicGalleryItemDTO,
  PublicGradeTargetDTO,
  PublicNewsItemDTO,
  PublicPortalDataDTO,
  PublicProgramItemDTO,
  PublicScheduleSlotDTO,
  PublicVolunteerTeacherDTO,
} from "../types/public-types";

/**
 * Canonical Public Curriculum & Community Narrative Constants
 * Sourced directly from validated prototype UI-12 & `docs/10-CONTENT-MICROCOPY-GUIDE.md §21`.
 */
export const CANONICAL_PUBLIC_COPY = {
  heroHeadline: "Ayo belajar dan tumbuh bersama.",
  heroSubheadline: "Rumah belajar yang terbuka bagi semua.",
  missionHeadline: "Setiap anak memiliki kesempatan untuk berkembang.",
  ctaHeadline: "Mari belajar dan tumbuh bersama di Rumah Belajar Griya Asih.",
  sloganEnglish: '"Dare to be Great"',
  sloganIndonesian: "Berani menjadi unggul",
  philosophyQuote:
    "“Belajar itu bukan tentang menjadi sempurna, tetapi tentang menjadi lebih baik setiap hari.”",
  scheduleDay: "Setiap hari Sabtu",
  scheduleHours: "15.00 – 17.00 WIB",
  locationFull:
    'RAAL (Rumah Asuh Anak & Lansia) "Griya Asih", Kecamatan Lawang, Kabupaten Malang, Jawa Timur',
  subDistrictsLabel: "Kelurahan Kalirejo & Kelurahan Lawang",
} as const;

export const PUBLIC_PROGRAMS_LIST: PublicProgramItemDTO[] = [
  {
    id: "matematika-ceria",
    number: "01",
    title: "Matematika Ceria",
    description:
      "Belajar berhitung, penjumlahan, pengurangan, perkalian, pembagian, dan penalaran soal cerita dengan latihan bertahap yang menyenangkan.",
    highlights: [
      "Latihan hitung angka besar dan soal cerita bertahap",
      "Pemantapan persiapan ujian akhir SD (EBTA/EBTANAS)",
      "Metode penalaran matematika SMP Kelas 7 & 8",
    ],
    targetNote: "Tersedia untuk jenjang TK, SD, dan SMP",
    accentTone: "info",
  },
  {
    id: "bahasa-inggris-praktis",
    number: "02",
    title: "Bahasa Inggris Praktis",
    description:
      "Pengenalan kosakata tematik, percakapan sehari-hari, tata bahasa praktis, dan latihan komunikasi aktif bersama pengajar relawan.",
    highlights: [
      "Perbendaharaan kata tematik yang interaktif",
      "Teori dasar dan latihan soal bimbingan pengajar relawan",
      "Latihan percakapan dan bermain peran kontekstual",
    ],
    targetNote: "Praktik komunikasi dan percakapan aktif",
    accentTone: "learning",
  },
  {
    id: "pendidikan-karakter",
    number: "03",
    title: "Pendidikan Karakter & Budi Pekerti",
    description:
      "Membiasakan respons santun, empati saling menolong, menghormati orang tua dan pengajar, serta menjaga batas privasi diri.",
    highlights: [
      "Pembiasaan salam santun dan ucapan terima kasih",
      "Etika menghormati orang tua, pengajar, dan teman",
      "Belajar menjaga batas privasi diri dan empati sosial",
    ],
    targetNote: "Fondasi karakter di setiap sesi belajar",
    accentTone: "success",
  },
  {
    id: "kelas-khusus-membaca",
    number: "04",
    title: "Kelas Khusus Membaca",
    badgeText: "Literasi 1 jam",
    description:
      "Pendampingan intensif bagi peserta didik yang memerlukan asistensi membaca hingga mampu membaca mandiri dan percaya diri.",
    highlights: [
      "Pendampingan personal fonetik dan suku kata selama 1 jam",
      "Suasana tenang tanpa tekanan agar peserta didik senang membaca",
    ],
    storyHighlight:
      "Tiga peserta didik kelas 2 yang semula belum lancar membaca kini berhasil membaca mandiri dengan percaya diri di tahun ajaran 2026/2027.",
    targetNote: "Didampingi pengajar relawan spesialis literasi",
    accentTone: "activity",
  },
];

export const PUBLIC_GRADE_TARGETS: PublicGradeTargetDTO[] = [
  {
    id: "jenjang-tk",
    badgeLabel: "Jenjang TK (A & B)",
    title: "Pengenalan dasar angka dan huruf",
    description:
      "Fokus pembelajaran dalam pengenalan angka, huruf, dan penjumlahan angka kecil dengan alat peraga visual yang menyenangkan.",
    focusLabel: "Asistensi membaca",
    focusText:
      "Disediakan sesi membaca paralel 1 jam agar peserta didik siap saat memasuki jenjang sekolah dasar.",
    accentTone: "primary",
  },
  {
    id: "jenjang-sd",
    badgeLabel: "Jenjang SD (Kelas 1 – 6)",
    title: "Penalaran dan penguatan ujian",
    description:
      "Matematika angka besar, pengurangan, perkalian, soal cerita, serta Bahasa Inggris teori dan praktik percakapan sehari-hari.",
    focusLabel: "Khusus kelas 6",
    focusText:
      "Pemantapan soal latihan intensif untuk persiapan menempuh ujian kelulusan sekolah dasar.",
    accentTone: "info",
  },
  {
    id: "jenjang-smp",
    badgeLabel: "Jenjang SMP (Kelas 7 & 8)",
    extraBadge: "Kelas baru TA 2026/2027",
    title: "Penalaran logika dan percakapan aktif",
    description:
      "Dibuka untuk mengakomodasi kebutuhan peserta didik yang ingin melanjutkan bimbingan belajar dengan materi pendalaman matematika dan Bahasa Inggris aktif.",
    focusLabel: "Fokus utama",
    focusText:
      "Metode penalaran logika matematika dan dialog Bahasa Inggris lanjutan dengan bimbingan modul khusus.",
    accentTone: "warning",
  },
];

export const PUBLIC_SCHEDULE_SLOTS: PublicScheduleSlotDTO[] = [
  {
    time: "14.45 – 15.00 WIB",
    activity: "Kedatangan & pembiasaan salam",
    description:
      "Peserta didik hadir, saling menyapa dengan santun (selamat sore), menaruh tas dengan tertib, dan menyiapkan meja lipat mandiri.",
    tag: "Penyambutan",
    accentTone: "primary",
  },
  {
    time: "15.00 – 15.45 WIB",
    activity: "Sesi pembelajaran I: Matematika & berhitung ceria",
    description:
      "Bimbingan berhitung, penjumlahan, perkalian, penalaran soal cerita, dan pemantapan materi persiapan ujian sekolah.",
    tag: "Akademik",
    accentTone: "info",
  },
  {
    time: "15.00 – 16.00 WIB",
    activity: "Kelas khusus membaca intensif (1 jam paralel)",
    description:
      "Sesi paralel intensif 1 jam bagi peserta didik TK dan SD yang memerlukan asistensi kelancaran membaca mandiri.",
    tag: "Literasi khusus",
    accentTone: "activity",
  },
  {
    time: "15.45 – 16.30 WIB",
    activity: "Sesi pembelajaran II: Bahasa Inggris & percakapan",
    description:
      "Kosakata baru tematik, latihan tata bahasa praktis, dialog percakapan sehari-hari, dan latihan komunikasi aktif.",
    tag: "Bahasa",
    accentTone: "learning",
  },
  {
    time: "16.30 – 17.00 WIB",
    activity: "Sesi pembelajaran III: Pendidikan karakter & budi pekerti",
    description:
      "Pembiasaan respons santun, empati saling menolong, etika menghormati orang tua dan pengajar, serta refleksi bersama.",
    tag: "Karakter",
    accentTone: "success",
  },
];

export const PUBLIC_VOLUNTEER_TEACHERS: PublicVolunteerTeacherDTO[] = [
  {
    name: "Ms. Evi S.Pd",
    originInstitution: "Sekolah Katholik Lawang",
    focusRole: "Koordinator pelayanan & Bahasa Inggris",
    isCoordinator: true,
  },
  {
    name: "Ms. Lilian",
    originInstitution: "Pengurus RAAL Griya Asih Lawang",
    focusRole: "Humas pelayanan & pendidikan karakter",
    isCoordinator: true,
  },
  {
    name: "Budi Santoso S.Pd",
    originInstitution: "Pengajar SDN Lawang 1",
    focusRole: "Matematika dasar & penalaran",
  },
  {
    name: "Theresia Maria S.Pd",
    originInstitution: "Sekolah Katholik Lawang",
    focusRole: "Kelas khusus membaca (literasi 1 jam)",
  },
  {
    name: "Paulus Hendra S.Si",
    originInstitution: "Pengajar SMPN Lawang",
    focusRole: "Matematika SMP Kelas 7 & 8",
  },
  {
    name: "Clara Novita S.Pd",
    originInstitution: "Sekolah Katholik Lawang",
    focusRole: "Bahasa Inggris percakapan SMP",
  },
  {
    name: "Agustinus Wibowo",
    originInstitution: "Pengajar SDN Kalirejo",
    focusRole: "Bimbingan SD Kelas 1 – 3",
  },
  {
    name: "Siti Rahmawati S.Pd",
    originInstitution: "Pengajar Relawan Lawang",
    focusRole: "Literasi membaca & karakter",
  },
  {
    name: "Fransiska Dewi",
    originInstitution: "Sekolah Katholik Lawang",
    focusRole: "Matematika SD Kelas 4 – 6",
  },
  {
    name: "Markus Dian S.Pd",
    originInstitution: "Pengajar SDN Lawang 2",
    focusRole: "Pembinaan karakter & budi pekerti",
  },
  {
    name: "Yuliana Putri",
    originInstitution: "Relawan Mahasiswa Edukasi",
    focusRole: "Bahasa Inggris SD",
  },
  {
    name: "Antonius Kevin S.Pd",
    originInstitution: "Sekolah Katholik Lawang",
    focusRole: "Pemantapan ujian akhir SD",
  },
  {
    name: "Debora Christina",
    originInstitution: "Pengajar TK Kasih Ibu Lawang",
    focusRole: "Fondasi jenjang TK (A & B)",
  },
];

export const PUBLIC_COORDINATOR_CONTACTS: PublicCoordinatorContactDTO[] = [
  {
    initials: "ME",
    name: "Ms. Evi S.Pd",
    roleLabel: "Koordinator pelayanan & pengurus",
    institutionLabel: "Sekolah Katholik Lawang",
    phoneDisplay: "+62 812-323-5318",
    whatsappUrl:
      "https://wa.me/628123235318?text=Halo%20Ms.%20Evi,%20saya%20ingin%20bertanya%20mengenai%20Rumah%20Belajar%20Griya%20Asih%20Lawang",
    accentTone: "primary",
  },
  {
    initials: "ML",
    name: "Ms. Lilian",
    roleLabel: "Pengurus & humas pelayanan",
    institutionLabel: "Pengurus RAAL Griya Asih Lawang",
    phoneDisplay: "+62 813-3298-7491",
    whatsappUrl:
      "https://wa.me/6281332987491?text=Halo%20Ms.%20Lilian,%20saya%20ingin%20bertanya%20seputar%20Rumah%20Belajar%20Griya%20Asih%20Lawang",
    accentTone: "learning",
  },
];

function formatIndonesianDate(isoDate: string | null): string {
  if (!isoDate) return "24 Oktober 2026";
  return formatToIndonesianStandard(isoDate, "24 Oktober 2026");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Defensive sanitizer for public text content (`config.HOURS.window` enforcement).
 * Replaces any legacy drift "17.15" or "17:15" with official "17.00".
 */
export function sanitizePublicTextTimes(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/17[.:]15/g, "17.00");
}

/**
 * Pure mapper & defensive filter for Public Gallery items (`04 §19`, `11 §15`, PO Rule #2 & #4).
 * Ensures ONLY items with `privacyReviewed === true && eligibleForPublic === true`
 * and a valid server-resolved signedReadUrl are exposed to the public experience.
 * Always resolves absolute Indonesian dates without relying on ambiguous "Terbaru" labels.
 */
export function filterAndMapPublicGalleryItems(
  rawAssets: MediaAssetDTO[]
): PublicGalleryItemDTO[] {
  return rawAssets
    .filter(
      (asset) =>
        asset.privacyReviewed === true &&
        asset.eligibleForPublic === true &&
        Boolean(asset.signedReadUrl)
    )
    .sort((a, b) => {
      const timeA = new Date(a.capturedDate || a.createdAt || "2026-10-24").getTime();
      const timeB = new Date(b.capturedDate || b.createdAt || "2026-10-24").getTime();
      return timeB - timeA;
    })
    .map((asset) => {
      const generatedSlug = slugify(asset.title);
      const rawDate = asset.capturedDate || asset.createdAt || "2026-10-24";
      const formattedDate = formatToIndonesianStandard(rawDate, "24 Oktober 2026");

      return {
        id: asset.id,
        slug: generatedSlug.length > 3 ? generatedSlug : `galeri-${asset.id}`,
        title: asset.title,
        description:
          asset.description ??
          "Dokumentasi kegiatan belajar bersama di Rumah Belajar Griya Asih Lawang.",
        category: asset.category,
        categoryLabel:
          MEDIA_CATEGORY_LABELS[asset.category] ?? "Kegiatan belajar",
        capturedDate: formattedDate,
        date: formattedDate,
        rawTimestamp: typeof rawDate === "string" ? rawDate : "2026-10-24",
        signedReadUrl: asset.signedReadUrl ?? "/images/gallery/griya_asih_4.jpg",
        signedUrlTtlSeconds: asset.signedUrlTtlSeconds ?? 3600,
        privacyReviewed: true,
        eligibleForPublic: true,
      };
    });
}

/**
 * Pure mapper & defensive filter for Public News/Publications (`04 §22`, `11 §17`, PO Rule #4).
 * Ensures ONLY posts with `status === "PUBLISHED"` are exposed to the public channel.
 */
export function filterAndMapPublicNewsItems(
  rawPosts: PublicationDTO[]
): PublicNewsItemDTO[] {
  return rawPosts
    .filter((post) => post.status === "PUBLISHED")
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      category: post.category,
      categoryLabel: PUBLICATION_CATEGORY_LABELS[post.category] ?? "Berita",
      excerpt: sanitizePublicTextTimes(post.excerpt ?? post.content.slice(0, 140) + "..."),
      content: sanitizePublicTextTimes(post.content),
      coverSignedUrl:
        post.coverSignedUrl ?? "/images/gallery/griya_asih_4.jpg",
      publishedAt: post.publishedAt,
      publishedDateFormatted: formatIndonesianDate(post.publishedAt),
      authorLabel: "Tim Pelayanan Griya Asih",
      eventDate: post.eventDate ? formatToIndonesianStandard(post.eventDate) : null,
      eventLocation: post.eventLocation ? sanitizePublicTextTimes(post.eventLocation) : null,
    }));
}

export const CANONICAL_AUTHENTIC_PUBLICATIONS: PublicNewsItemDTO[] = [
  {
    id: "pub-smp-8",
    title: "Tahun Ajaran 2026/2027: Griya Asih Buka Kelas Baru SMP Kelas 8",
    slug: "tahun-ajaran-2026-2027-buka-kelas-smp-8",
    category: "BERITA",
    categoryLabel: "Berita",
    excerpt:
      "Merespons antusiasme dan permohonan orang tua wali peserta didik, Rumah Belajar Griya Asih Lawang resmi menambah jenjang kelas SMP Kelas 8.",
    content: `Di tahun ajaran 2026/2027 ini, pengurus Rumah Belajar Griya Asih Lawang bersepakat untuk menambah 1 kelas baru yaitu SMP Kelas 8. Sebelumnya pelayanan mencakup jenjang TK sampai dengan SMP Kelas 7.

Keputusan penting ini diambil berkaitan langsung dengan permintaan peserta didik dan orang tua wali agar dapat terus melanjutkan bimbingan belajar bersama para pengajar relawan di Griya Asih.

"Kami melihat semangat belajar anak-anak luar biasa. Dengan ditambahkannya kelas 8, kami menyiapkan metode penalaran matematika yang lebih mendalam, Bahasa Inggris lanjutan dengan metode percakapan serta role-play, dan buku referensi khusus," tutur Ms. Evi selaku Koordinator Unit.

Rumah Belajar Griya Asih kini didukung oleh 13 pengajar relawan berdedikasi yang berasal dari guru sekolah Katolik dan guru sekolah negeri di sekitar Lawang. Pembelajaran dilaksanakan setiap hari Sabtu pukul 15.00 s/d 17.00 WIB.`,
    coverSignedUrl: "/images/gallery/griya_asih_8.jpg",
    publishedAt: "2026-08-01T09:00:00.000Z",
    publishedDateFormatted: "1 Agustus 2026",
    authorLabel: "Tim Pelayanan Griya Asih",
    eventDate: null,
    eventLocation: null,
  },
  {
    id: "pub-literasi-1-jam",
    title: "Keberhasilan Kelas Membaca 1 Jam: Membuka Potensi Literasi Peserta Didik",
    slug: "keberhasilan-kelas-khusus-membaca-1-jam",
    category: "ARTIKEL",
    categoryLabel: "Artikel",
    excerpt:
      "Tiga peserta didik kelas 2 yang sebelumnya belum lancar membaca kini berhasil membaca mandiri dengan percaya diri mengikuti pelajaran.",
    content: `Bagi peserta didik yang belum lancar membaca, Rumah Belajar Griya Asih membuka kelas khusus di mana pengajar relawan memberikan bimbingan membaca intensif selama 1 jam. Sesi ini dirancang personal dan menyenangkan agar peserta didik menemukan kegembiraan belajar ("Happy Learning").

Bukti nyata keberhasilan program ini tampak pada 3 peserta didik kelas 2 yang semula belum lancar membaca. Setelah rutin mengikuti sesi khusus membaca, saat ini mereka telah berhasil membaca dengan lancar sehingga di tahun ajaran 2026/2027 sudah dapat mengikuti kelas pembelajaran sesuai jenjangnya.

Kami percaya bahwa setiap anak memiliki kesempatan untuk berkembang. Dengan pendampingan yang tulus dan penuh kasih, peserta didik dapat bertumbuh menjadi pribadi yang percaya diri dan penuh rasa ingin tahu.`,
    coverSignedUrl: "/images/gallery/griya_asih_7.jpg",
    publishedAt: "2026-09-15T10:00:00.000Z",
    publishedDateFormatted: "15 September 2026",
    authorLabel: "Tim Pelayanan Griya Asih",
    eventDate: null,
    eventLocation: null,
  },
  {
    id: "pub-jadwal-ganjil",
    title: "Jadwal Bimbingan Belajar Semester Ganjil 2026/2027",
    slug: "jadwal-bimbingan-belajar-semester-ganjil",
    category: "AGENDA",
    categoryLabel: "Agenda",
    excerpt:
      "Bimbingan belajar rutin setiap hari Sabtu pukul 15.00 – 17.00 WIB bertempat di RAAL Griya Asih Lawang.",
    content: `Diumumkan kepada seluruh orang tua dan wali peserta didik bahwa jadwal kegiatan bimbingan belajar Rumah Belajar Griya Asih berjalan rutin:

- Hari: Setiap Hari Sabtu
- Waktu: Pukul 15.00 s/d 17.00 WIB
- Tempat: RAAL (Rumah Asuh Anak & Lansia) "Griya Asih" Lawang, Kab. Malang
- Mata Pelajaran: Matematika Ceria, Bahasa Inggris Praktis, Pendidikan Karakter, dan Kelas Khusus Membaca (1 Jam).

Peserta didik diharapkan hadir 15 menit sebelum jam belajar dimulai dengan membawa buku catatan dan alat tulis masing-masing. Rumah belajar yang terbuka bagi semua anak di wilayah Kalirejo, Lawang, dan sekitarnya tanpa memandang latar belakang suku maupun agama.`,
    coverSignedUrl: "/images/gallery/griya_asih_4.jpg",
    publishedAt: "2026-10-01T08:00:00.000Z",
    publishedDateFormatted: "1 Oktober 2026",
    eventDate: "28 November 2026",
    eventLocation: 'RAAL "Griya Asih" Lawang (Setiap Sabtu, 15.00 – 17.00 WIB)',
    authorLabel: "Tim Pelayanan Griya Asih",
  },
  {
    id: "pub-ebta-kelas-6",
    title: "Sosialisasi Persiapan Ujian Akhir Matematika SD Kelas 6",
    slug: "sosialisasi-persiapan-ebta-sd-kelas-6",
    category: "PENGUMUMAN",
    categoryLabel: "Pengumuman",
    excerpt:
      "Pemantapan soal latihan matematika dan strategi pengerjaan soal cerita intensif bagi peserta didik kelas 6.",
    content: `Menjelang persiapan ujian kelulusan sekolah dasar (EBTA/EBTANAS), Rumah Belajar Griya Asih Lawang menyelenggarakan pemantapan materi matematika khusus untuk peserta didik kelas 6.

Pendampingan berfokus pada teknik pemecahan soal cerita matematika bertingkat, konsep pecahan, perkalian dan pembagian cepat, serta latihan ketelitian berhitung.

Pembinaan ini diberikan secara intensif setiap hari Sabtu bersama pengajar relawan lulusan pendidikan matematika, agar peserta didik memiliki kesiapan mental dan akademis yang prima.`,
    coverSignedUrl: "/images/gallery/griya_asih_1.jpg",
    publishedAt: "2026-10-15T08:00:00.000Z",
    publishedDateFormatted: "15 Oktober 2026",
    authorLabel: "Tim Pelayanan Griya Asih",
    eventDate: null,
    eventLocation: null,
  },
];

export const CANONICAL_AUTHENTIC_ALBUMS: GalleryAlbumContent[] = [
  {
    type: "gallery_album",
    title: "Suasana Belajar Sabtu Griya Asih",
    slug: "suasana-belajar-sabtu-griya-asih",
    date: "24 Oktober 2026",
    categoryLabel: "DOKUMENTASI KEGIATAN",
    author: "Tim Pelayanan Griya Asih",
    description:
      "Dokumentasi kebersamaan dan keceriaan peserta didik bersama para pengajar relawan saat sesi bimbingan belajar Matematika Ceria, Literasi Membaca, dan Bahasa Inggris di RAAL Griya Asih Lawang.",
    coverImage: "/images/gallery/griya_asih_8.jpg",
    photos: [
      {
        url: "/images/gallery/griya_asih_8.jpg",
        caption: "Kelompok belajar peserta didik jenjang SMP Kelas 7 & 8 bersama pengajar relawan matematika.",
      },
      {
        url: "/images/gallery/griya_asih_7.jpg",
        caption: "Pojok baca dan pendampingan literasi membaca intensif 1 jam bagi peserta didik TK dan SD.",
      },
      {
        url: "/images/gallery/griya_asih_4.jpg",
        caption: "Sesi bimbingan belajar Matematika Ceria dengan penalaran soal cerita terpadu.",
      },
      {
        url: "/images/gallery/griya_asih_9.jpg",
        caption: "Foto bersama seluruh peserta didik dan pengajar relawan dengan seragam Rumah Belajar Griya Asih di halaman RAAL.",
      },
      {
        url: "/images/gallery/griya_asih_10.jpg",
        caption: "Sesi pembiasaan salam santun, pendidikan karakter, dan budi pekerti.",
      },
      {
        url: "/images/gallery/griya_asih_11.jpg",
        caption: "Suasana ruang belajar yang nyaman, terbuka, dan penuh kasih didampingi para pengajar.",
      },
    ],
  },
  {
    type: "gallery_album",
    title: "Momen Ujian Akhir Semester & Evaluasi Belajar",
    slug: "momen-ujian-akhir-semester",
    date: "14 November 2026",
    categoryLabel: "DOKUMENTASI KEGIATAN",
    author: "Tim Pelayanan Griya Asih",
    description:
      "Potret antusiasme dan kesungguhan anak-anak dalam mengikuti latihan pemantapan evaluasi belajar semester ganjil tahun ajaran 2026/2027.",
    coverImage: "/images/gallery/griya_asih_1.jpg",
    photos: [
      {
        url: "/images/gallery/griya_asih_1.jpg",
        caption: "Latihan pemantapan materi matematika dasar dan penalaran logika berhitung.",
      },
      {
        url: "/images/gallery/griya_asih_2.jpg",
        caption: "Pendampingan privat bagi peserta didik jenjang sekolah dasar yang memerlukan bimbingan tambahan.",
      },
      {
        url: "/images/gallery/griya_asih_3.jpg",
        caption: "Diskusi kelompok bimbingan belajar Bahasa Inggris praktis dan percakapan kontekstual.",
      },
      {
        url: "/images/gallery/griya_asih_5.jpg",
        caption: "Suasana tenang saat evaluasi mandiri kelancaran membaca peserta didik.",
      },
      {
        url: "/images/gallery/griya_asih_6.jpg",
        caption: "Apresiasi atas ketekunan dan kemajuan belajar peserta didik di akhir sesi.",
      },
    ],
  },
];

/**
 * Public Dual-Mode Detail Resolver (`11 §17`, FASE 14 Hotfix Lanjutan).
 * Mendeteksi contentType:
 * - 'article': Publikasi warta/berita (Header -> Paragraf -> Share).
 * - 'gallery_album': Dokumentasi album foto (Header Narasi -> Grid Foto Responsif -> Share).
 * Menerapkan SQL WHERE clause consent gate ketat pada level server query untuk semua media asset.
 */
export async function getPublicArticleDetail(
  slug: string
): Promise<PublicContent | null> {
  // 1. Cek apakah cocok dengan Canonical Fallback Albums
  const canonicalAlbum = CANONICAL_AUTHENTIC_ALBUMS.find((a) => a.slug === slug);
  if (canonicalAlbum) {
    return canonicalAlbum;
  }

  // 2. Query database publikasi
  try {
    const rawPost = await getPublishedPublicationBySlug(slug).catch(() => null);
    if (rawPost) {
      const isGalleryCategory =
        rawPost.category.toUpperCase() === "GALERI" ||
        rawPost.category.toUpperCase() === "DOKUMENTASI";

      if (isGalleryCategory) {
        // Query media assets dengan SQL Consent Gate ketat
        const eligibleMedia = await listPublicGalleryMedia(rawPost.serviceUnitId).catch(() => []);
        const photos: GalleryPhoto[] = eligibleMedia
          .filter((m) => m.privacyReviewed === true && m.eligibleForPublic === true && Boolean(m.signedReadUrl))
          .map((m) => ({
            url: m.signedReadUrl ?? "/images/gallery/griya_asih_4.jpg",
            caption: m.description ?? m.title,
          }));

        return {
          type: "gallery_album",
          title: rawPost.title,
          slug: rawPost.slug,
          date: formatIndonesianDate(rawPost.publishedAt),
          description: rawPost.excerpt ?? rawPost.content,
          author: "Tim Pelayanan Griya Asih",
          categoryLabel: PUBLICATION_CATEGORY_LABELS[rawPost.category] ?? "Dokumentasi Kegiatan",
          coverImage: rawPost.coverSignedUrl ?? photos[0]?.url,
          photos: photos.length > 0 ? photos : (CANONICAL_AUTHENTIC_ALBUMS[0]?.photos ?? []),
        };
      }

      // Tipe 'article'
      const [mapped] = filterAndMapPublicNewsItems([rawPost]);
      if (mapped) {
        return {
          type: "article",
          title: mapped.title,
          slug: mapped.slug,
          date: mapped.publishedDateFormatted,
          publishedDateFormatted: mapped.publishedDateFormatted,
          author: mapped.authorLabel,
          categoryLabel: mapped.categoryLabel,
          excerpt: mapped.excerpt,
          bodyHtml: mapped.content,
          content: mapped.content,
          coverImage: mapped.coverSignedUrl,
          coverSignedUrl: mapped.coverSignedUrl,
          eventDate: mapped.eventDate,
          eventLocation: mapped.eventLocation,
        };
      }
    }
  } catch (err) {
    console.error(`[getPublicArticleDetail] DB query error for slug "${slug}":`, err);
  }

  // 3. Graceful fallback ke authentic canonical publication (artikel berita)
  const rawFallback = CANONICAL_AUTHENTIC_PUBLICATIONS.find((p) => p.slug === slug);
  if (rawFallback) {
    const fallbackArticle: ArticleContent = {
      type: "article",
      title: rawFallback.title,
      slug: rawFallback.slug,
      date: rawFallback.publishedDateFormatted,
      publishedDateFormatted: rawFallback.publishedDateFormatted,
      author: rawFallback.authorLabel,
      categoryLabel: rawFallback.categoryLabel,
      excerpt: rawFallback.excerpt,
      bodyHtml: rawFallback.content,
      content: rawFallback.content,
      coverImage: rawFallback.coverSignedUrl,
      coverSignedUrl: rawFallback.coverSignedUrl,
      eventDate: rawFallback.eventDate,
      eventLocation: rawFallback.eventLocation,
    };
    return fallbackArticle;
  }

  // 4. Cek fallback per-media gallery item jika slug cocok
  const fallbackGalleryPhotos: GalleryPhoto[] = [
    ...CANONICAL_AUTHENTIC_ALBUMS[0].photos,
    ...CANONICAL_AUTHENTIC_ALBUMS[1].photos,
  ];
  const matchedPhoto = fallbackGalleryPhotos.find(
    (p) => slugify(p.caption).includes(slug) || slug.includes(slugify(p.caption).slice(0, 15))
  );
  if (matchedPhoto) {
    return {
      type: "gallery_album",
      title: matchedPhoto.caption.slice(0, 60),
      slug,
      date: "2026",
      description: matchedPhoto.caption,
      author: "Tim Pelayanan Griya Asih",
      categoryLabel: "DOKUMENTASI KEGIATAN",
      coverImage: matchedPhoto.url,
      photos: [
        matchedPhoto,
        ...fallbackGalleryPhotos.filter((p) => p.url !== matchedPhoto.url),
      ],
    };
  }

  return null;
}

/**
 * Cross-Domain Public Portal Application Service (`11 §20–21`).
 * Fetches public data strictly through `organization`, `media`, and `publishing` Public APIs.
 */
export async function getPublicPortalData(): Promise<PublicPortalDataDTO> {
  let rawGallery: MediaAssetDTO[] = [];
  let rawPublications: PublicationDTO[] = [];

  try {
    const pilotScope = await getDefaultPilotServiceUnit().catch(() => null);
    const serviceUnitId = pilotScope?.serviceUnitId;

    const [galleryRes, pubRes] = await Promise.allSettled([
      listPublicGalleryMedia(serviceUnitId),
      listPublishedContent(serviceUnitId),
    ]);

    if (galleryRes.status === "fulfilled") {
      rawGallery = galleryRes.value;
    } else {
      console.error("[getPublicPortalData] Gallery fetch failed:", galleryRes.reason);
    }

    if (pubRes.status === "fulfilled") {
      rawPublications = pubRes.value;
    } else {
      console.error("[getPublicPortalData] Publications fetch failed:", pubRes.reason);
    }
  } catch (err) {
    console.error("[getPublicPortalData] Fallback triggered due to transient database error:", err);
  }

  const mappedGallery = filterAndMapPublicGalleryItems(rawGallery);
  const galleryItems =
    mappedGallery.length > 0
      ? mappedGallery
      : CANONICAL_AUTHENTIC_ALBUMS.map((album, idx) => ({
          id: `canonical-album-${idx + 1}`,
          slug: album.slug,
          title: album.title,
          description: album.description,
          category: "KEGIATAN" as const,
          categoryLabel: "Kegiatan belajar",
          capturedDate: formatToIndonesianStandard(album.date, "24 Oktober 2026"),
          date: formatToIndonesianStandard(album.date, "24 Oktober 2026"),
          rawTimestamp: album.date,
          signedReadUrl: album.photos[0]?.url ?? "/images/gallery/griya_asih_4.jpg",
          signedUrlTtlSeconds: 3600,
          privacyReviewed: true as const,
          eligibleForPublic: true as const,
        }));

  const mappedNews = filterAndMapPublicNewsItems(rawPublications);
  const newsItems =
    mappedNews.length > 0 ? mappedNews : CANONICAL_AUTHENTIC_PUBLICATIONS;

  return {
    serviceUnitName: "Rumah Belajar Griya Asih Lawang",
    organizationName: "PMKI Mupel Jawa Timur",
    locationFull: CANONICAL_PUBLIC_COPY.locationFull,
    subDistrictsLabel: CANONICAL_PUBLIC_COPY.subDistrictsLabel,
    scheduleDay: CANONICAL_PUBLIC_COPY.scheduleDay,
    scheduleHours: CANONICAL_PUBLIC_COPY.scheduleHours,
    heroHeadline: CANONICAL_PUBLIC_COPY.heroHeadline,
    heroSubheadline: CANONICAL_PUBLIC_COPY.heroSubheadline,
    missionHeadline: CANONICAL_PUBLIC_COPY.missionHeadline,
    ctaHeadline: CANONICAL_PUBLIC_COPY.ctaHeadline,
    sloganEnglish: CANONICAL_PUBLIC_COPY.sloganEnglish,
    sloganIndonesian: CANONICAL_PUBLIC_COPY.sloganIndonesian,
    philosophyQuote: CANONICAL_PUBLIC_COPY.philosophyQuote,
    metrics: {
      registeredStudentsValue: "80+",
      registeredStudentsLabel: "Peserta didik terdaftar",
      volunteerTeachersValue: "13",
      volunteerTeachersLabel: "Pengajar relawan",
      educationLevelsValue: "TK – SMP 8",
      educationLevelsLabel: "Jenjang pendidikan",
    },
    programs: PUBLIC_PROGRAMS_LIST,
    gradeTargets: PUBLIC_GRADE_TARGETS,
    scheduleSlots: PUBLIC_SCHEDULE_SLOTS,
    volunteerTeachers: PUBLIC_VOLUNTEER_TEACHERS,
    coordinators: PUBLIC_COORDINATOR_CONTACTS,
    galleryItems,
    newsItems,
  };
}

export {
  deduplicateFeedItems,
  deduplicateHomeFeed,
  getImageFingerprint,
  type DeduplicatedHomeFeedResult,
  type DeduplicatedSecondaryFeedItem,
} from "../utils/feed-deduplicator";
