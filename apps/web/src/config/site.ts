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
  privacySummary: undefined, // MISSING — PO TO SUPPLY
  termsSummary: undefined, // MISSING — PO TO SUPPLY
} as const;

