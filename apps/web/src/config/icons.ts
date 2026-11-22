/**
 * ICON REGISTRY — SEMANTIC ICON MAPPING (ANTI-DRIFT)
 * 
 * Sesuai FASE 14 — STEP 2: Satu-satunya tempat nama komponen ikon Lucide dibekukan.
 * Step perombakan IMPOR dari sini, TIDAK menulis <Home/> literal tersebar di JSX.
 * 
 * ============================================================================
 * KONVENSI PENGGUNAAN IKONOGRAFI:
 * 1. Stroke Width: strokeWidth={2} (default Lucide, JANGAN di-override).
 * 2. Layout & Flex: Selalu gunakan class `shrink-0` untuk mencegah distorsi flexbox.
 * 3. Aksesibilitas: Selalu sertakan `aria-hidden="true"` pada ikon yang mendampingi teks label.
 * 4. Warna & Tema: Pewarnaan murni berbasis semantic tokens (`text-primary`,
 *    `text-muted-foreground`, `text-secondary-foreground`), BUKAN hardcoded hex.
 * 5. Transisi: Efek interaktif hover menggunakan `transition-colors duration-200`.
 * 6. Ukuran Baku:
 *    - Bottom Navigation: `w-5 h-5` (20x20px)
 *    - Header / Navbar: `w-4 h-4` (16x16px)
 *    - Footer Sosial Media: `w-5 h-5` (20x20px)
 *    - TIDAK ada penambahan ukuran lain sendiri (mis. w-6) — bila step butuh, usulkan di step tsb.
 * ============================================================================
 */

import {
  AlertTriangle,
  BookOpen,
  BookText,
  Calculator,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  CloudOff,
  Copy,
  createLucideIcon,
  ExternalLink,
  Globe,
  HeartHandshake,
  HelpCircle,
  History,
  Home,
  Image as ImageIcon,
  Info,
  Lock,
  type LucideIcon,
  MapPin,
  Newspaper,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";

/**
 * Brand Icons yang di-build menggunakan helper resmi createLucideIcon
 * untuk menjamin kompatibilitas tipe LucideIcon dan styling SVG seragam.
 */
const Instagram: LucideIcon = createLucideIcon("Instagram", [
  ["rect", { width: "20", height: "20", x: "2", y: "2", rx: "5", ry: "5", key: "r" }],
  ["path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z", key: "c" }],
  ["line", { x1: "17.5", x2: "17.51", y1: "6.5", y2: "6.5", key: "d" }],
]);

const Facebook: LucideIcon = createLucideIcon("Facebook", [
  ["path", { d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z", key: "f" }],
]);

const Youtube: LucideIcon = createLucideIcon("Youtube", [
  [
    "path",
    {
      d: "M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17",
      key: "yt1",
    },
  ],
  ["path", { d: "m10 15 5-3-5-3z", key: "yt2" }],
]);

/**
 * Peta Ikon Semantik Kanonik (Frozen Registry)
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  beranda: Home,
  program: BookOpen,
  kabar: Newspaper,
  kontak: PhoneCall,
  portal: Lock,
  peserta: Users,
  biaya: HeartHandshake,
  waktu: Clock,
  lokasi: MapPin,
  math: Calculator,
  literacy: BookText,
  karakter: Sparkles,
  daftarSiswa: UserPlus,
  relawan: HelpCircle,
  donasi: Wallet,
  info: Info,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tutup: X,
  centang: Check,
  checkCircle: CheckCircle2,
  search: Search,
  refresh: RefreshCw,
  calendarCheck: CalendarCheck,
  cloudOff: CloudOff,
  alertTriangle: AlertTriangle,
  history: History,
  plus: Plus,
  globe: Globe,
  send: Send,
  shieldCheck: ShieldCheck,
  image: ImageIcon,
  trash: Trash2,
  salin: Copy,
  tautanLuar: ExternalLink,
} as const;

