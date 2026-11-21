/**
 * SITE CONFIGURATION — SINGLE SOURCE OF TRUTH (ANTI-HARDCODE)
 * 
 * Sesuai FASE 14 — STEP 2: Sumber tunggal data statis, brand hierarchy,
 * narahubung resmi, alamat fisik, dan jam belajar Rumah Belajar Griya Asih.
 * 
 * ============================================================================
 * KONSUMEN & PELUNASAN (Peta Adopsi Step-by-Step):
 * - UNIT, ORG                     -> Step 3 (Header Navbar)
 * - UNIT, BRAND, HOURS, CONTACTS  -> Step 5 (Beranda Storytelling)
 * - UNIT, BRAND, SOCIAL_LINKS     -> Step 4 (Footer Utilitarian)
 * - ADDRESS, HOURS, CONTACTS      -> Step 8 (Halaman /kontak & Pelunasan TD-ADDR,
 *                                            supersede locationFull/subDistrictsLabel)
 * - BRAND.taglineSplash, ORG      -> Step 9 (Splash Screen)
 * - UNIT                          -> Step 7 (Feed Hybrid /kabar)
 * 
 * CONTACTS.isPrimaryFor = MISSING; PO to supply mapping (siapa primary utk tab
 * siswa/relawan/donasi/info) sebelum Step 8; Step 8 pakai fallback terdokumentasi + sign-off PO.
 * ============================================================================
 */

export interface PublicContactPerson {
  role: "coordinator" | "humas"; // repo/live caption (transcribed)
  label: string; // repo/live caption (transcribed)
  name: string; // PO-CONFIRMED 2026-11-21
  phoneDisplay: string; // wa.me destination truth (grouping 3235-318)
  waNumber: string; // repo/KB
  isPrimaryFor: Array<"pendaftaran" | "kunjungan" | "donasi" | "umum">; // MISSING — PO TO SUPPLY
}

export interface PublicAddress {
  street: string; // PO-CONFIRMED 2026-11-21
  rtRw: string; // PO-CONFIRMED 2026-11-21
  desa: string; // PO-CONFIRMED 2026-11-21
  kecamatan: string; // PO-CONFIRMED 2026-11-21
  kabupaten: string; // PO-CONFIRMED 2026-11-21
  provinsi: string; // PO-CONFIRMED 2026-11-21
  postalCode: string; // PO-CONFIRMED 2026-11-21
}

export interface PublicOperationalHours {
  day: string; // PO-CONFIRMED 2026-11-21 (Kamis dihilangkan dr publik & seed)
  window: string; // PO-CONFIRMED 2026-11-21
  arriveNote: string; // PO-CONFIRMED 2026-11-21
}

export interface PublicLegalInformation {
  privacySummary?: string; // MISSING — PO TO SUPPLY
  termsSummary?: string; // MISSING — PO TO SUPPLY
}

export interface PublicSocialLink {
  platform: "instagram" | "facebook" | "youtube"; // PO-CONFIRMED 2026-11-21
  url: string; // MISSING — PO TO SUPPLY
}

/**
 * Entitas Induk Organisasi (Lapis 1 - Payung Hukum & Tata Kelola)
 */
export const ORG = {
  name: "PMKI", // PO-CONFIRMED 2026-11-21
  fullname: "Pelayanan Masyarakat Kota & Industri", // PO-CONFIRMED 2026-11-21
  taglineSplash: "Untuk Generasi yang Lebih Baik", // PO-CONFIRMED 2026-11-21
} as const;

/**
 * Satuan Pelayanan Komunitas (Lapis 2 - Pusat Komunitas Belajar Lokal)
 */
export const UNIT = {
  name: "Rumah Belajar Griya Asih", // PO-CONFIRMED 2026-11-21
  location: "Lawang", // PO-CONFIRMED 2026-11-21
  taglineFooter: "Bersama Melayani, Bersama Bertumbuh", // PO-CONFIRMED 2026-11-21
} as const;

/**
 * Slogan & Tagline Branding
 */
export const BRAND = {
  taglineSplash: ORG.taglineSplash, // PO-CONFIRMED 2026-11-21
  taglineFooter: UNIT.taglineFooter, // PO-CONFIRMED 2026-11-21
  subline: "Platform Pelayanan Terpadu", // PO-CONFIRMED 2026-11-21 (NEW FIELD)
} as const;

/**
 * Alamat Kanonik Fisik Rumah Belajar Griya Asih
 */
export const ADDRESS: PublicAddress = {
  street: "Jl. Ngamarto Selatan", // PO-CONFIRMED 2026-11-21
  rtRw: "RT.06/RW.02", // PO-CONFIRMED 2026-11-21
  desa: "Desa Ngamarto", // PO-CONFIRMED 2026-11-21
  kecamatan: "Lawang", // PO-CONFIRMED 2026-11-21
  kabupaten: "Malang", // PO-CONFIRMED 2026-11-21
  provinsi: "Jawa Timur", // PO-CONFIRMED 2026-11-21
  postalCode: "65211", // PO-CONFIRMED 2026-11-21
} as const;

/**
 * Jam Operasional Bimbingan Belajar Komunitas
 * (Kamis DIHILANGKAN dari publik & seed, difokuskan pada Sabtu)
 */
export const HOURS: PublicOperationalHours = {
  day: "Setiap Sabtu", // PO-CONFIRMED 2026-11-21
  window: "15.00 – 17.00 WIB", // PO-CONFIRMED 2026-11-21
  arriveNote: "Hadir 14.45 WIB untuk salam santun & presensi.", // PO-CONFIRMED 2026-11-21
} as const;

/**
 * Daftar Narahubung Resmi Pengurus (WhatsApp)
 */
export const CONTACTS: readonly PublicContactPerson[] = [
  {
    role: "coordinator", // repo/live caption (transcribed)
    label: "Koordinator pelayanan", // repo/live caption (transcribed; p kecil)
    name: "Ms. Evi", // PO-CONFIRMED 2026-11-21
    phoneDisplay: "+62 812-3235-318", // wa.me destination truth (grouping 3235-318)
    waNumber: "628123235318", // repo/KB
    isPrimaryFor: [], // MISSING — PO TO SUPPLY (routing tab belum PO)
  },
  {
    role: "humas", // repo/live caption (transcribed)
    label: "Pengurus & humas", // repo/live caption (transcribed; h kecil)
    name: "Ms. Lilian", // PO-CONFIRMED 2026-11-21
    phoneDisplay: "+62 813-3298-7491", // repo/KB
    waNumber: "6281332987491", // repo/KB
    isPrimaryFor: [], // MISSING — PO TO SUPPLY
  },
] as const;

/**
 * Query Lokasi Google Maps
 * Catatan: Flag upgrade ke encode ADDRESS lengkap (format final ditentukan di Step 8).
 */
export const MAP_QUERY = "RAAL+Griya+Asih+Lawang"; // repo/KB (flag upgrade Step 8)

/**
 * Lokasi & Tautan Google Maps Resmi (PO-CONFIRMED 2026-11-22)
 * Nama Tempat: Rumah Asuh Anak & Lansia (RAAL) "GRIYA ASIH"
 * Tautan Resmi (Short URL): https://maps.app.goo.gl/z6uDaRTFBYW463Sv5
 * Koordinat Presisi: -7.839429, 112.7008636
 */
export const MAPS_LOCATION = {
  placeName: 'Rumah Asuh Anak & Lansia (RAAL) "GRIYA ASIH"',
  shortUrl: "https://maps.app.goo.gl/z6uDaRTFBYW463Sv5",
  coordinates: {
    lat: -7.839429,
    lng: 112.7008636,
  },
  embedQuery: "-7.839429,112.7008636",
} as const;

/**
 * Tautan Media Sosial Resmi
 */
export const SOCIAL_LINKS: readonly PublicSocialLink[] = []; // MISSING — PO TO SUPPLY

/**
 * Ringkasan Hukum & Kebijakan Privasi
 */
export const LEGAL: PublicLegalInformation = {
  privacySummary: `Kebijakan Privasi Rumah Belajar Griya Asih
Pembaruan Terakhir: November 2026

Rumah Belajar Griya Asih (di bawah naungan Yayasan Pelayanan Masyarakat Kota & Industri / PMKI) berkomitmen penuh untuk melindungi privasi, martabat, dan rasa aman seluruh peserta didik serta keluarga.

1. Prinsip Perlindungan Data Anak
Data peserta didik bersifat privat secara bawaan (private by default). Kami menerapkan pengumpulan data seminimal mungkin (minimum disclosure) yang hanya relevan untuk kebutuhan bimbingan belajar dan pendampingan karakter.

2. Informasi yang Kami Kelola
• Data Pendaftaran: Nama lengkap peserta didik, tanggal lahir/usia, jenjang kelas sekolah, serta nama orang tua/wali.
• Kontak Resmi: Nomor telepon/WhatsApp orang tua atau wali untuk koordinasi kegiatan, jadwal, dan keadaan darurat.
• Catatan Operasional: Presensi kehadiran dan catatan perkembangan belajar yang dikelola secara internal oleh pengajar.

3. Pemisahan Hak Persetujuan (Explicit Consent)
Kami memisahkan secara tegas antara persetujuan operasional data dan publikasi media:
• Persetujuan Data: Digunakan semata-mata untuk verifikasi administrasi dan penempatan kelas belajar.
• Persetujuan Foto & Video: Dokumentasi kegiatan hanya dipublikasikan di portal atau media resmi setelah memperoleh izin eksplisit dari orang tua/wali dan lolos peninjauan privasi pengurus.

4. Keamanan & Kerahasiaan
Data Anda tidak pernah diperjualbelikan, disewakan, atau dibagikan kepada pihak ketiga mana pun untuk tujuan komersial. Akses terhadap data dibatasi secara ketat hanya bagi pengurus dan pengajar yang bertugas (need-to-know basis).

5. Hak Orang Tua & Wali
Orang tua atau wali berhak memeriksa data pribadi peserta didik, mengajukan pembaruan data, atau mencabut persetujuan dokumentasi publikasi kapan saja dengan menghubungi pengurus melalui kanal resmi kami.`,

  termsSummary: `Syarat & Ketentuan Rumah Belajar Griya Asih
Pembaruan Terakhir: November 2026

Selamat datang di Rumah Belajar Griya Asih Lawang. Ketentuan ini dibuat demi kenyamanan, keselamatan, dan kebaikan bersama seluruh keluarga besar peserta didik, pengajar relawan, dan pengurus.

1. Sifat Layanan & Pembiayaan
Rumah Belajar Griya Asih adalah gerakan pelayanan bimbingan belajar komunitas non-profit yang terbuka bagi anak-anak usia sekolah (jenjang TK hingga SMP Kelas 8). Seluruh kegiatan belajar mengajar diselenggarakan secara 100% GRATIS tanpa pungutan biaya pendidikan.

2. Jadwal & Disiplin Belajar
• Sesi belajar rutin diadakan setiap hari Sabtu pukul 15.00 – 17.00 WIB bertempat di RAAL Griya Asih Lawang.
• Peserta didik diharapkan hadir 15 menit lebih awal (14.45 WIB) untuk salam santun dan presensi.
• Apabila peserta didik berhalangan hadir karena sakit atau ada keperluan keluarga, orang tua/wali diharapkan menyampaikan pemberitahuan kepada pengurus atau pengajar.

3. Lingkungan Belajar yang Aman & Santun
Kami mewujudkan ruang belajar yang ramah anak, inklusif, dan saling mendukung. Setiap peserta didik, relawan, dan wali wajib menjaga sikap saling menghormati:
• Dilarang keras melakukan perundungan (bullying), kekerasan fisik, perkataan kasar, maupun diskriminasi.
• Menjaga kebersihan dan merawat fasilitas belajar bersama di lingkungan RAAL Griya Asih.

4. Kemitraan Orang Tua & Pengajar Relawan
Kegiatan ini didukung oleh para pengajar relawan yang melayani dengan ketulusan hati. Kami mengajak orang tua dan wali untuk senantiasa mendampingi dan memberi dorongan semangat belajar kepada anak di rumah.

5. Saluran Komunikasi Resmi
Seluruh informasi pendaftaran, perubahan jadwal, dan komunikasi darurat hanya disampaikan melalui narahubung resmi pengurus via WhatsApp (+62 812-3235-318 / +62 813-3298-7491).`,
} as const;

