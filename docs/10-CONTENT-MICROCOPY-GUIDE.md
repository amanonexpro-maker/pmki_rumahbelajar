# 10-CONTENT-MICROCOPY-GUIDE.md

# PMKI Content, Terminology & Microcopy Guide

## Platform Pelayanan Terpadu PMKI
### Rumah Belajar Griya Asih Lawang

Version: 2.0 Final  
Status: Production Content Standard  
Priority: High  
Authority Level: Product Language System

Dependencies:

- 03-DESIGN-IDENTITY-SYSTEM.md
- UI-UX-DESIGN-SYSTEM.md v2.1
- 05-AUTHORIZATION-RBAC-BLUEPRINT.md
- 07-COMPONENT-ARCHITECTURE.md

---

# 1. Purpose

Dokumen ini menjadi sumber kebenaran utama untuk:

- Terminologi produk
- Bahasa UI
- Navigasi
- Label menu
- Status
- Tombol
- Empty States
- Error Messages
- Success Messages
- Governance Language
- Audit Language
- Public Communication
- Workspace Communication

Seluruh aplikasi PMKI harus menggunakan terminologi, gaya bahasa, dan aturan penulisan yang terdapat dalam dokumen ini.

---

# 2. Core Principle

PMKI tidak berbicara seperti:

```text
ERP
Government System
Corporate Dashboard
Administrative Software
Generic SaaS
```

PMKI berbicara seperti:

```text
Educational Community Platform
```

Karakter bahasa PMKI:

```text
Human
Clear
Calm
Respectful
Trustworthy
Educational
Inclusive
```

---

# 3. Language Policy

## Bahasa Utama

Seluruh UI menggunakan:

```text
Bahasa Indonesia
```

---

## Bahasa Teknis

Digunakan hanya untuk:

```text
Code

Database

API

Developer Documentation
```

---

## Rule

```text
Code = English

UI = Bahasa Indonesia
```

---

# 4. Tone of Voice

## Public Website

Karakter:

```text
Warm

Hopeful

Inclusive

Encouraging

Community-Oriented
```

Contoh:

✅ Mari belajar dan tumbuh bersama.

✅ Setiap anak memiliki ruang untuk berkembang.

✅ Rumah belajar yang terbuka bagi semua.

---

Hindari:

❌ Join now

❌ Start your learning journey today

❌ Enroll immediately

---

## Workspace

Karakter:

```text
Clear

Calm

Operational

Respectful
```

Contoh:

✅ Catat presensi

✅ Menunggu verifikasi

✅ Perlu perhatian

✅ Simpan perubahan

---

Hindari:

❌ Execute

❌ Submit process

❌ Trigger workflow

---

## Governance

Karakter:

```text
Accountable

Precise

Trustworthy

Neutral
```

Contoh:

✅ Menunggu validasi unit

✅ Menunggu persetujuan

✅ Memerlukan tinjauan privasi

✅ Keputusan akan dicatat dalam jejak audit

---

# 5. Canonical Terminology Dictionary

Bagian ini adalah sumber kebenaran seluruh istilah PMKI.

---

## Peserta Didik

### UI Resmi

```text
Peserta Didik
```

### Alternatif Pendek

```text
Peserta
```

### Jangan Digunakan Sebagai Istilah Utama

```text
Student
Siswa
Murid
Anak
```

### Database

```text
student
```

### Code

```ts
Student
```

---

## Pengajar

### UI Resmi

```text
Pengajar
```

### Public Website

```text
Pengajar Relawan
```

### Database

```text
teacher
```

### Code

```ts
Teacher
```

---

## Kelas

### UI Resmi

```text
Kelas
```

### Penjelasan Internal

```text
Rombongan Belajar
```

### Hindari

```text
Rombel
```

untuk UI umum.

### Database

```text
class
```

---

## Kehadiran

### Nama Modul

```text
Kehadiran
```

### Aksi

```text
Catat Presensi
```

### Database

```text
attendance
```

---

## Perkembangan Peserta

### Nama Modul

```text
Perkembangan Peserta
```

### Item

```text
Catatan Perkembangan
```

### Database

```text
development_note
```

---

## Persetujuan

### Istilah Resmi

```text
Persetujuan
```

### Jenis

```text
Persetujuan Data

Persetujuan Foto & Video
```

### Database

```text
consent
```

---

## Dokumentasi

### UI

```text
Dokumentasi
```

### Database

```text
media_asset
```

---

## Laporan

### UI

```text
Laporan
```

### Database

```text
report
```

---

## Publikasi

### UI

```text
Publikasi
```

### Database

```text
publication
```

---

## Jejak Audit

### Menu

```text
Jejak Audit
```

### Detail

```text
Riwayat Audit
```

### Database

```text
audit_log
```

---

## Administrasi

### Menu

```text
Administrasi
```

### Area

```text
Pengguna

Peran

Hak Akses

Lingkungan Uji Coba
```

---

## Pemangku Kepentingan

### UI

```text
Pemangku Kepentingan
```

### Database

```text
stakeholder
```

---

# 5A. Capitalization & Naming Convention Rules

## Purpose

Konsistensi kapitalisasi sama pentingnya dengan konsistensi istilah.

PMKI menggunakan kapitalisasi yang terkontrol untuk menjaga:

```text
Kejelasan

Konsistensi

Keterbacaan

Profesionalisme
```

---

## Primary Rule

PMKI menggunakan:

```text
Sentence Case
```

sebagai standar utama UI.

---

### Benar

✅ Tambah peserta didik

✅ Catat presensi

✅ Simpan perubahan

✅ Menunggu verifikasi

✅ Belum ada peserta didik

---

### Salah

❌ Tambah Peserta Didik

❌ Catat Presensi

❌ Simpan Perubahan

❌ Menunggu Verifikasi

---

## Navigation Labels

Gunakan:

```text
Title Case
```

### Benar

✅ Dashboard

✅ Peserta Didik

✅ Perkembangan Peserta

✅ Persetujuan

✅ Publikasi

✅ Jejak Audit

✅ Administrasi

---

## Page Titles

Gunakan:

```text
Title Case
```

### Benar

✅ Peserta Didik

✅ Catatan Perkembangan

✅ Jejak Audit

✅ Administrasi

---

## Section Titles

Gunakan:

```text
Sentence Case
```

### Benar

✅ Perlu perhatian

✅ Jadwal belajar

✅ Riwayat aktivitas

✅ Ringkasan program

---

### Salah

❌ Perlu Perhatian

❌ Jadwal Belajar

❌ Riwayat Aktivitas

---

## Button Labels

Gunakan:

```text
Sentence Case
```

### Benar

✅ Tambah peserta didik

✅ Catat presensi

✅ Simpan perubahan

✅ Verifikasi pendaftaran

✅ Tempatkan ke kelas

✅ Terbitkan konten

---

## Form Labels

Gunakan:

```text
Sentence Case
```

### Benar

✅ Nama lengkap peserta didik

✅ Nomor WhatsApp aktif

✅ Hubungan dengan peserta didik

✅ Jenjang pendidikan saat ini

---

## Status Labels

Gunakan:

```text
Sentence Case
```

### Benar

✅ Menunggu verifikasi

✅ Aktif belajar

✅ Tinjauan program

✅ Persetujuan organisasi

---

## Dialog Titles

Gunakan:

```text
Sentence Case
```

### Benar

✅ Nonaktifkan peserta didik?

✅ Cabut persetujuan foto dan video?

✅ Terbitkan konten ini?

---

# 6. Official Role Labels

| System Role | UI Label |
|------------|-----------|
| PLATFORM_ADMIN | Administrator Platform |
| ORG_ADMIN | Administrator Organisasi |
| UNIT_COORDINATOR | Koordinator Unit |
| PROGRAM_COORDINATOR | Koordinator Program |
| TEACHER | Pengajar |
| VOLUNTEER | Relawan |
| EDITOR | Penyusun Konten |
| REVIEWER | Peninjau |
| APPROVER | Pejabat Penyetuju |
| AUDITOR | Auditor |
| STAKEHOLDER | Pemangku Kepentingan |

---

# 7. Status Labels

## Status Pendaftaran

| System | UI |
|----------|----------|
| SUBMITTED | Pendaftaran masuk |
| PENDING_VERIFICATION | Menunggu verifikasi |
| VERIFIED | Terverifikasi |
| CLASS_PLACEMENT | Penempatan kelas |
| ACTIVE | Aktif belajar |
| WAITLIST | Daftar tunggu |
| REJECTED | Ditolak |
| CANCELLED | Dibatalkan |

---

## Status Kehadiran

| System | UI |
|----------|----------|
| PRESENT | Hadir |
| ABSENT | Tidak hadir |
| SICK | Sakit |
| PERMITTED | Izin |

---

## Status Persetujuan

| System | UI |
|----------|----------|
| GRANTED | Disetujui |
| DENIED | Tidak diizinkan |
| REVOKED | Izin dicabut |

---

## Status Laporan

| System | UI |
|----------|----------|
| DRAFT | Draft |
| PROGRAM_REVIEW | Tinjauan program |
| UNIT_VALIDATION | Validasi unit |
| ORGANIZATION_APPROVAL | Persetujuan organisasi |
| APPROVED | Disetujui |
| REJECTED | Ditolak |

---

## Status Publikasi

| System | UI |
|----------|----------|
| DRAFT | Draft konten |
| PRIVACY_REVIEW | Tinjauan privasi |
| APPROVED | Disetujui editorial |
| PUBLISHED | Tayang di publik |
| ARCHIVED | Diarsipkan |

---

# 8. Dashboard Language

## Greeting

✅ Selamat pagi

✅ Selamat siang

✅ Selamat sore

✅ Selamat malam

---

## Attention

✅ Perlu perhatian

✅ Menunggu tindakan

✅ Memerlukan tindak lanjut

---

Hindari:

❌ Critical Alert

❌ Emergency

❌ Urgent Warning

---

# 9. Button Rules

Tombol harus menjelaskan hasil tindakan.

### Good

✅ Tambah peserta didik

✅ Catat presensi

✅ Verifikasi pendaftaran

✅ Tempatkan ke kelas

✅ Simpan perubahan

✅ Tinjau laporan

✅ Terbitkan konten

---

### Avoid

❌ Submit

❌ Execute

❌ Process

❌ Apply

---

# 10. Search Language

### Good

✅ Cari peserta didik...

✅ Cari laporan...

✅ Cari publikasi...

✅ Cari pengajar...

---

### Avoid

❌ Search...

---

# 11. Form Language

### Good

✅ Nama lengkap peserta didik

✅ Nama panggilan

✅ Hubungan dengan peserta didik

✅ Nomor WhatsApp aktif

✅ Jenjang pendidikan saat ini

✅ Catatan kebutuhan belajar

---

# 12. Validation Messages

### Good

✅ Masukkan nama lengkap peserta didik.

✅ Pilih kelas terlebih dahulu.

✅ Masukkan nomor WhatsApp yang dapat dihubungi.

✅ Pilih salah satu opsi persetujuan.

---

### Avoid

❌ Validation failed

❌ Invalid input

❌ Required field

---

# 13. Success Messages

✅ Pendaftaran berhasil dikirim.

✅ Presensi berhasil disimpan.

✅ Catatan perkembangan berhasil ditambahkan.

✅ Persetujuan berhasil diperbarui.

✅ Publikasi berhasil diterbitkan.

---

# 14. Error Messages

✅ Anda tidak memiliki akses untuk tindakan ini.

✅ Data tidak ditemukan.

✅ Gagal menyimpan perubahan. Silakan coba kembali.

✅ Koneksi internet tidak tersedia. Perubahan disimpan secara lokal.

---

# 15. Confirmation Dialogs

### Good

**Nonaktifkan peserta didik?**

Peserta didik tidak akan muncul dalam kegiatan aktif, tetapi data historis tetap tersimpan.

[Batal]

[Nonaktifkan]

---

# 16. Empty States

### Good

Belum ada peserta didik.

Tambahkan peserta didik pertama untuk tahun ajaran ini.

[Tambah peserta didik]

---

### Avoid

❌ No Data Found

---

# 17. Privacy Language

### Good

Persetujuan publikasi foto dan video tidak mempengaruhi partisipasi peserta didik dalam kegiatan belajar.

---

# 18. Governance Language

✅ Menunggu validasi unit.

✅ Menunggu persetujuan.

✅ Memerlukan tinjauan privasi.

✅ Keputusan akan dicatat dalam jejak audit.

---

# 19. Audit Language

✅ Status pendaftaran diperbarui

✅ Persetujuan dicabut

✅ Publikasi ditayangkan

✅ Peran diperbarui

✅ Pengguna dinonaktifkan

---

# 20. Accessibility Language

### Good

✅ Buka profil peserta didik

✅ Tutup dialog

✅ Kembali ke daftar peserta didik

✅ Lihat jejak audit

---

### Avoid

❌ Klik di sini

❌ Selengkapnya

❌ Buka

---

# 21. Public Website Voice

Karakter:

```text
Warm
Inclusive
Educational
Community-Oriented
```

Contoh:

✅ Ayo belajar dan tumbuh bersama.

✅ Rumah belajar yang terbuka bagi semua.

✅ Setiap anak memiliki kesempatan untuk berkembang.

---

# 22. Workspace Voice

Karakter:

```text
Clear
Calm
Operational
```

Contoh:

✅ Catat presensi

✅ Perbarui status

✅ Tambahkan catatan

✅ Perlu perhatian

---

# 23. Governance Voice

Karakter:

```text
Trustworthy
Precise
Neutral
```

Contoh:

✅ Menunggu persetujuan organisasi.

✅ Persetujuan akhir tidak dapat diberikan oleh penyusun laporan.

✅ Keputusan akan dicatat dalam jejak audit.

---

# 24. Reserved Terminology

Istilah berikut tidak boleh diganti dengan sinonim lain pada area UI berbeda.

| Istilah Resmi | Jangan Diganti Menjadi |
|-------------|------------------------|
| Peserta Didik | Student, Siswa, Murid, Anak |
| Pengajar | Teacher, Tutor |
| Kelas | Rombel |
| Kehadiran | Attendance |
| Presensi | Attendance Record |
| Perkembangan Peserta | Student Development |
| Catatan Perkembangan | Development Note |
| Persetujuan | Consent |
| Dokumentasi | Media Asset |
| Laporan | Report |
| Publikasi | Publication |
| Jejak Audit | Audit Log |
| Administrasi | Administration |
| Pemangku Kepentingan | Stakeholder |

---

# 25. Cross Layer Terminology Mapping

| Domain | UI | Database | Code |
|----------|----------|----------|----------|
| Student | Peserta Didik | student | Student |
| Teacher | Pengajar | teacher | Teacher |
| Class | Kelas | class | Class |
| Attendance | Kehadiran | attendance | Attendance |
| Attendance Recording | Presensi | attendance_record | AttendanceRecord |
| Development Note | Catatan Perkembangan | development_note | DevelopmentNote |
| Consent | Persetujuan | consent | Consent |
| Report | Laporan | report | Report |
| Publication | Publikasi | publication | Publication |
| Audit Log | Jejak Audit | audit_log | AuditLog |

---

# 26. Glossary

| Istilah | Definisi |
|----------|----------|
| Peserta Didik | Individu yang mengikuti program Rumah Belajar |
| Pengajar | Individu yang memimpin kegiatan belajar |
| Kelas | Kelompok belajar peserta didik |
| Kehadiran | Data keikutsertaan peserta didik dalam sesi belajar |
| Presensi | Aktivitas pencatatan kehadiran |
| Perkembangan Peserta | Modul pencatatan observasi perkembangan |
| Catatan Perkembangan | Catatan observasi terhadap peserta didik |
| Persetujuan | Otorisasi dari wali terkait data atau media |
| Dokumentasi | Media foto/video kegiatan |
| Laporan | Dokumen pelaporan kegiatan dan program |
| Publikasi | Konten yang diterbitkan ke kanal publik |
| Jejak Audit | Catatan historis seluruh tindakan penting sistem |
| Peran | Sekumpulan tanggung jawab dan izin |
| Hak Akses | Kemampuan yang diberikan kepada pengguna |
| Lingkungan Uji Coba | Area administrasi untuk kebutuhan simulasi/demo |
| Validasi | Pemeriksaan sebelum persetujuan |
| Persetujuan | Keputusan formal pada workflow governance |
| Pemangku Kepentingan | Pihak yang menerima informasi hasil program |

---

# 27. Terminology Governance

Ketika istilah baru dibuat:

Wajib memiliki:

```text
UI Label

Database Term

Code Term
```

---

Contoh:

```text
UI:
Peserta Didik

Database:
student

Code:
Student
```

---

Rule:

```text
One Concept

=

One Official Term
```

---

# 28. AI Content Rules

AI Coding Agent wajib:

✅ menggunakan terminologi resmi

✅ menggunakan glossary

✅ menjaga tone PMKI

✅ menjaga konsistensi status

---

AI tidak boleh:

❌ membuat istilah baru

❌ mencampur bahasa tanpa alasan

❌ menggunakan jargon teknis sebagai UI

❌ menerjemahkan ulang istilah resmi

---

# 29. Definition of Done

Dokumen dianggap berhasil jika:

✅ Terminologi konsisten

✅ Status konsisten

✅ Tombol konsisten

✅ Validasi konsisten

✅ Error konsisten

✅ Governance language konsisten

✅ Glossary lengkap

✅ Capitalization konsisten

✅ Tidak ada istilah teknis bocor ke UI

---

# 30. Final Statement

> Bahasa adalah bagian dari pengalaman pengguna. PMKI menggunakan bahasa yang hangat, jelas, mudah dipahami, dan tetap presisi. Setiap kata harus membantu pengguna memahami konteks, mengambil keputusan, dan merasa dihormati.

> Interface speaks.

> Every word matters.

> Clarity creates trust.