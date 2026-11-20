# Model Basis Data Relasional - PostgreSQL

## Skema yang berjalan

Migrasi `migrations/001_relational_schema.sql` membuat tabel PostgreSQL dan
relasi foreign key. API memetakan tabel-tabel ini kembali ke bentuk data
frontend. Data snapshot lama di `pmki_app_state` akan dipindahkan otomatis
satu kali saat API dimulai; tabel lama sengaja dipertahankan sebagai cadangan
dan tidak lagi digunakan untuk baca/tulis setelah migrasi.

Entitas utama meliputi:

1. **Organisasi & unit:** `organizations`, `service_units`,
   `service_unit_sub_districts`, `service_unit_contacts`.
2. **Identitas:** `users` dan `application_settings` untuk pengguna aktif
   simulasi.
3. **Siswa & wali:** `students`, `guardians`, `consents`.
4. **Pendidikan:** `academic_years`, `subjects`, `teachers`,
   `teacher_subjects`, `classes`, `class_schedules`.
5. **Operasional:** `attendance_sessions`, `attendance_records`,
   `student_development_notes`.
6. **Konten & tata kelola:** `media_assets`, `publication_posts`,
   `service_reports`, `report_approval_logs`, `audit_logs`.

Daftar tabel aktual, tipe kolom, indeks, dan foreign key ada di file migrasi
SQL. Daftar ini menggambarkan data yang saat ini digunakan aplikasi; bukan
berarti otentikasi dan RBAC server sudah diterapkan.

## Migrasi data yang sudah ada

Pada startup pertama, API memindahkan snapshot lama di `pmki_app_state` ke
tabel-tabel relasional dalam satu transaksi. Tabel snapshot lama tidak dihapus
agar tersedia sebagai cadangan. Semua perubahan setelah migrasi ditulis
transaksional ke tabel relasional.

## Batasan saat ini

- Penyimpanan penuh dari frontend mengganti semua tabel dalam satu transaksi.
  Model ini cocok untuk penggunaan lokal/demo satu pengguna, bukan penggunaan
  multi-pengguna bersamaan.
- `teacher_subjects` menyimpan nama fokus mata pelajaran relawan karena nilai
  asalnya adalah teks bebas yang tidak selalu mengacu ke katalog `subjects`.
- API masih menggunakan akun demo dan belum mengimplementasikan autentikasi,
  otorisasi server, atau role database terpisah. Jangan memublikasikan API
  maupun menyimpan data pribadi nyata sebelum hal tersebut ditangani.
