# Kebijakan Keamanan & Perlindungan Privasi Anak

## 1. Perlindungan Data Anak (Child Safeguarding by Design)
Aplikasi memuat data anak-anak penerima manfaat dan anak asuh di RAAL (Rumah Asuh Anak & Lansia) Griya Asih. Sesuai prinsip *Privacy-by-Design*:

1. **Deny-by-Default untuk Data Confidential:**
   - Nama lengkap anak, alamat, kontak orang tua/wali, catatan perkembangan karakter, dan rincian presensi diklasifikasikan sebagai **CONFIDENTIAL**.
   - Data ini tidak pernah diekspos melalui endpoint atau halaman website publik.
2. **Pemisahan Independen Persetujuan Media (Media Consent):**
   - Izin pengolahan data pendaftaran dipisahkan secara tegas dari izin publikasi foto/video.
   - Orang tua atau wali berhak menolak izin foto/video publik tanpa menghilangkan hak anak untuk mengikuti bimbingan belajar.
3. **Penyaringan Eligibilitas Media Publik:**
   - Setiap foto di galeri publik wajib melalui peninjauan kurasi (`privacyReviewed: true` dan `isEligibleForPublic: true`).
4. **Jejak Audit Transaksi (Audit Trail):**
   - Setiap mutasi status pendaftaran siswa, presensi, persetujuan media, dan persetujuan laporan dicatat secara permanen dalam tabel log audit (*immutable append-only*).
