# TERMINOLOGY-CHECKLIST — Audit String UI & Perbaikan Kanonik

**Referensi Otoritas:** `docs/10-CONTENT-MICROCOPY-GUIDE.md` (§5, §5A, §6, §7, §24)  
**Aturan Utama:**
- UI = **Bahasa Indonesia**. Code/DB/API = **English**.
- Istilah kanonik **WAJIB**: `Peserta Didik` (bukan Siswa/Murid/Anak sebagai istilah utama), `Pengajar` (publik: `Pengajar Relawan`, bukan Teacher/Guru sebagai istilah utama modul), `Kelas` (bukan Rombel), `Kehadiran` / `Presensi`, `Perkembangan Peserta` / `Catatan Perkembangan`, `Persetujuan`, `Dokumentasi`, `Jejak Audit` / `Riwayat Audit`, `Administrasi`, `Pemangku Kepentingan`.
- **Kapitalisasi:** **Sentence case** = standar UI (tombol, label form, status, judul section, judul dialog, pesan). **Title Case** HANYA untuk navigasi & page title.
- **Tombol Terlarang:** `Submit`, `Execute`, `Process`, `Apply`. **Empty State Terlarang:** `No Data Found`.

---

## 1. Daftar Temuan Grep UI Strings Existing (`src/components/`)

| Kategori Temuan | Istilah Existing | Lokasi File & Baris (Sampel Aktual) | Perbaikan Kanonik (`10`) | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Peserta Didik** | `Siswa & Pendaftaran`, `Data Siswa`, `Pendaftaran Siswa Baru`, `Daftar Siswa Baru`, `Siswa Terdaftar`, `siswa`, `murid` | `DashboardLayout.tsx:87`, `AdministrationView.tsx:65,129,130,134,135,140,171,942,1049`, `AuditLogView.tsx:80,95,383,457`, `Hero.tsx:98,119`, `ScheduleSection.tsx:26,42`, `ProgramSection.tsx:222,281`, `ContactSection.tsx:210`, `GallerySection.tsx:164` | `Peserta Didik` (atau `Peserta` untuk pendek); `Daftar peserta didik baru`; `Wali peserta didik` | `TERVERIFIKASI (FASE 4 & 9: /workspace/students, /pendaftaran & Situs Publik)` |
| **Kelas** | `Rombongan Belajar`, `Rombel`, `Kelas Rombel`, `Rombel Aktif` | `AttendanceView.tsx:545,732,765,1167,1177,1275,1279,1296`, `OrganizationView.tsx:100,106,154,168,171,378,400,467,490`, `StudentDetailView.tsx:547,983,1002,1333,1378,1403`, `StudentDevelopmentView.tsx:718`, `StudentsView.tsx:449,738,776`, `UpcomingList.tsx:136` | `Kelas` (penjelasan internal boleh `Rombongan belajar` Sentence case, hindari `Rombel` di UI umum) | `TERVERIFIKASI (FASE 4 & 9: /workspace/students, /workspace/academic & /program)` |
| **Pengajar** | `Organisasi, Kelas & Guru`, `Guru / Wali Kelas`, `Pengajar / Guru Relawan` | `DashboardLayout.tsx:112`, `AttendanceView.tsx:754`, `WorkspaceHeader.tsx:18`, `AdministrationView.tsx:75` | `Pengajar` (di workspace), `Pengajar Relawan` (di publik: `Hero`, `Mission`, `Community Story`) | `TERVERIFIKASI (FASE 4 & 9: /workspace/academic & Situs Publik)` |
| **Navigasi Inggris & Modul** | Grup menu: `Overview`, `Programs`, `Content`, `Reports`, `Administration`; Menu: `Audit Trail Sistem`, `Ringkasan Pelayanan`, `Presensi Sesi Belajar`, `Izin Privasi & Media`, `Publikasi & Berita`, `Administrasi & Hak Akses` | `DashboardLayout.tsx:72,76,94,108,120,124,130,138,142,150,154,160` | Grup & menu Bahasa Indonesia kanonik: `Dashboard`, `Peserta Didik`, `Kehadiran`, `Perkembangan Peserta`, `Kelas & Pengajar`, `Persetujuan`, `Dokumentasi`, `Publikasi`, `Jejak Audit`, `Administrasi` (Title Case untuk navigasi) | `TERVERIFIKASI (FASE 1b, 4 & 9)` |
| **Istilah Inggris Campuran** | `(Media Consent Verified)` | `GallerySection.tsx:164` | Hapus label Inggris; cukup `"Dokumentasi ini telah mendapatkan persetujuan wali untuk publikasi."` | `TERVERIFIKASI (FASE 6 & 9: /workspace/consent, /workspace/media, /workspace/publishing & /gallery)` |
| **Status Kehadiran (`Alpa`)** | Sudah diperbaiki ke `Tidak hadir` di UI-10 | `AttendanceView.tsx:79,665,865,945,1351`, `StudentDevelopmentView.tsx:318`, `SessionProgress.tsx:88` | Pertahankan `Tidak hadir` (wajib cek jangan sampai kembali ke `Alpa`) | `TERVERIFIKASI (JAGA)` |
| **Label Role (`WorkspaceHeader` / `Admin`)** | `Platform Administrator`, `Admin Organisasi` | `WorkspaceHeader.tsx:14-15`, `AdministrationView.tsx:51,57` | Selaraskan dengan `10 §6`: `Administrator Platform`, `Administrator Organisasi`, `Pengajar`, `Peninjau`, `Pejabat Penyetuju`, `Pemangku Kepentingan` | `TERVERIFIKASI (FASE 1a & 3)` |
| **Kapitalisasi (Title Case Salah)** | Tombol, judul section, label status, & caption memakai Title Case (mis. `Rombongan Belajar Aktif`, `Lihat Data Siswa`, `Waktu Pelaksanaan Bimbingan Belajar`) | `AttendanceView.tsx:1279`, `AdministrationView.tsx:129,134`, `ScheduleSection.tsx`, `Hero.tsx`, `StudentsView.tsx` | Terapkan **Sentence case** untuk semua tombol, label form, status, judul section, dan pesan. Title Case HANYA di navigasi & page title (`10 §5A`) | `TERVERIFIKASI (FASE 4–9)` |
| **Tombol & Empty State Terlarang** | Tidak ditemukan teks UI `"No Data Found"`, `"Execute"`, `"Process"`, `"Apply"`, `"Submit"` pada label tombol (hanya `type="submit"` HTML) | Hasil grep `src/components/` & `apps/web/src/` | Pertahankan larangan; pastikan semua tombol menjelaskan hasil (`Simpan perubahan`, `Catat presensi`, `Kirim pendaftaran`, `Daftar peserta didik baru`) | `TERVERIFIKASI (FASE 1–9)` |

---

## 2. Sentralisasi Mapping yang Wajib Dibuat di Target (`src/lib/`)

1. **`src/lib/status.ts`**: Satu sumber kebenaran untuk label & tone status (`RegistrationStatus`, `ApprovalStatus`, `PublicationStatus`, `ConsentStatus`, `AttendanceStatus`, `Role`) sesuai `10 §6–7`.
2. **`src/lib/messages.ts`**: Pesan validasi, konfirmasi, sukses, empty state, dan error manusiawi (`10 §14`), misal: `"Anda tidak memiliki akses untuk tindakan ini."`.

