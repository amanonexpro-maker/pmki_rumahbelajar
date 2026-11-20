# Platform Pelayanan Terpadu PMKI
### Pilot Service Unit: Rumah Belajar Griya Asih Lawang, Jawa Timur

> **Slogan:** *"Dare to be Great (Berani Menjadi Unggul)"*  
> **Motto:** *"Ayo Belajar & Tumbuh Bersama!"*  
> **Nilai Dasar:** *"Belajar itu bukan tentang menjadi sempurna, tetapi tentang menjadi lebih baik setiap hari."*

---

## 1. Ikhtisar Proyek (Project Overview)

**Platform Pelayanan Terpadu PMKI** adalah sistem informasi manajemen pelayanan berbasis web yang modular dan terintegrasi untuk Yayasan Pelayanan Kristen Indonesia (PMKI). Platform ini dirancang dengan pendekatan **Modular Monolith** untuk mendukung berbagai unit pelayanan, program, dan kelompok sasaran di masa mendatang.

Implementasi perdana (Pilot Project) dari platform ini berfokus pada **Rumah Belajar Griya Asih Lawang, Kabupaten Malang, Jawa Timur**, yang melayani anak-anak di lingkungan Kelurahan Kalirejo dan Kelurahan Lawang serta anak asuh di **RAAL (Rumah Asuh Anak & Lansia) Griya Asih**.

### Fitur Utama:
1. **Public Website:**
   - Profil kelembagaan, visi, misi, dan nilai *Happy Learning*.
   - Kurikulum 4 Program Utama: **Matematika Ceria**, **Bahasa Inggris Praktis**, **Pembelajaran Karakter & Budi Pekerti**, dan **Kelas Khusus Membaca (Literasi 1 Jam)**.
   - Informasi Sasaran Jenjang: TK (A & B), SD Kelas 1-6 (Pemantapan EBTA/EBTANAS), dan SMP Kelas 7 & 8 (Penambahan Kelas 8 tahun 2026/2027).
   - Jadwal Belajar: Setiap Hari **Sabtu, 15.00 – 17.15 WIB**.
   - Galeri Dokumentasi Foto Asli kegiatan siswa dan guru relawan.
   - Portal Formulir Pendaftaran Siswa Baru dengan **Informed Consent** independen.
   - Kanal Kontak WhatsApp Pengurus: Ms. Evi (+62 812-323-5318) dan Ms. Lilian (+62 813-3298-7491).
2. **Internal Management Dashboard:**
   - **Multi-Role RBAC Simulation:** Pengalih peran instan (Platform Admin, Koordinator Unit, Guru, Approver) untuk evaluasi alur hak akses secara langsung.
   - **Beneficiaries (Siswa):** Manajemen pendaftaran bertingkat (`SUBMITTED` $\to$ `PENDING_VERIFICATION` $\to$ `VERIFIED` $\to$ `CLASS_PLACEMENT` $\to$ `ACTIVE`).
   - **Attendance:** Pencatatan presensi sesi Sabtu per rombel kelas dengan ringkasan status realtime.
   - **Student Development:** Pencatatan observasi karakter, literasi membaca, dan akademik dengan klasifikasi **CONFIDENTIAL** (Deny-by-Default).
   - **Media Consent & Privacy Review:** Pemisahan izin data pribadi vs izin publikasi media; kurasi kelayakan foto sebelum tayang publik.
   - **Publishing Workflow:** Pengendalian editorial bertahap (`DRAFT` $\to$ `PRIVACY_REVIEW` $\to$ `APPROVED` $\to$ `PUBLISHED`).
   - **Service Reports & Approval:** Alur persetujuan 4 tingkat dengan penegakan **Pemisahan Tugas (Separation of Duties)**—pembuat laporan dilarang menyetujui laporannya sendiri secara final.
   - **Organization & Teacher Directory:** Struktur PMKI Sinodal $\to$ Mupel Jatim $\to$ Griya Asih Lawang beserta direktori 13 guru pendamping.
   - **Audit Trail:** Jejak audit rekaman mutasi data sistem (*immutable append-only*).

---

## 2. Struktur Modul & Folder (Architecture)

```
├── docker-compose.yml           # PostgreSQL 16 Alpine, PgAdmin opsional
├── .env.example                 # Template variabel lingkungan
├── package.json
├── tsconfig.json
├── docs/                        # Dokumentasi arsitektur dan keamanan
│   ├── architecture.md
│   ├── database.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── docker.md
│   ├── development.md
│   ├── deployment.md
│   └── security.md
└── src/
    ├── types/                   # Definisi tipe domain & enums
    ├── permissions/             # Mesin otorisasi terpusat (can.ts)
    ├── db/
    │   └── seed-data.ts         # Data awal otentik dari PDF Griya Asih
    ├── services/
    │   └── storage.ts           # Storage reactive state & audit log
    └── components/
        ├── layout/              # Navbar, Footer
        ├── public/              # Komponen halaman publik
        └── dashboard/           # 10 Modul dashboard operasional
```

---

## 3. Akun Uji Coba Demo (Demo Accounts)

Untuk mempermudah pengujian hak akses (RBAC) dan pemisahan tugas, sistem menyediakan akun demo bawaan yang dapat diganti sewaktu-waktu melalui menu di bilah atas:

| Nama Akun | Email | Peran (Role) | Kewenangan Utama |
| :--- | :--- | :--- | :--- |
| **Administrator PMKI** | `superadmin@pmki.org` | `PLATFORM_ADMIN` | Hak akses penuh seluruh organisasi & modul |
| **Ms. Evi S.Pd** | `pengurus.lawang@pmki.org` | `UNIT_COORDINATOR` | Koordinator Unit Griya Asih Lawang, verifikasi siswa |
| **Ms. Lilian** | `lilian@pmki.org` | `PROGRAM_COORDINATOR` | Humas & Koordinator Program Membaca |
| **Budi Santoso S.Pd** | `guru.matematika@pmki.org` | `TEACHER` | Guru Matematika, pencatatan presensi & perkembangan |
| **Pdt. Andreas** | `reviewer.sinodal@pmki.org` | `APPROVER` | BPH Mupel Jatim, persetujuan akhir laporan pelayanan |

---

## 4. Panduan Menjalankan Aplikasi (Local Development)

### Menggunakan Node.js
```bash
# 1. Salin konfigurasi environment
cp .env.example .env.local

# 2. Pasang dependensi
npm install

# 3. Jalankan server pengembangan
npm run dev
```

Aplikasi dapat diakses di: `http://localhost:3000`

### Menggunakan Docker Compose
```bash
# Menjalankan PostgreSQL
docker compose up -d

# Memeriksa status database
docker compose ps

# Menjalankan database beserta pgAdmin (opsional)
docker compose --profile dev up -d
```

> Docker Compose saat ini hanya menyiapkan PostgreSQL dan pgAdmin. Aplikasi
> terhubung ke PostgreSQL melalui API lokal. Untuk membuka website, jalankan
> `npm run api:dev` dan `npm run dev` di dua terminal. Lihat
> [panduan Docker](./docs/docker.md) untuk langkah lengkap.

---

## 5. Lisensi
Hak Cipta © 2026 Yayasan Pelayanan Kristen Indonesia (PMKI). Pilot Unit: Rumah Belajar Griya Asih Lawang.
Semua hak dilindungi undang-undang.
