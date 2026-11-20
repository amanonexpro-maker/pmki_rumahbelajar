# Otorisasi & Kontrol Akses (Role-Based Access Control)

## 1. Prinsip Otorisasi Terpusat
Otorisasi tidak diimplementasikan dengan pengecekan `if (role === 'ADMIN')` yang tersebar di komponen UI. Sebaliknya, seluruh mutasi data dan hak melihat melewati modul terpusat di `src/permissions/can.ts`:

```typescript
can(user, permission, context)
```

Fungsi ini mengevaluasi 4 dimensi sekaligus:
1. **Peran (Technical Role):** Memeriksa apakah role memiliki izin granular bersangkutan.
2. **Cakupan Organisasi (Organization Scope):** Memastikan entitas target berada dalam organisasi/unit pengguna.
3. **Klasifikasi Data (Data Classification):** Data bertanda `CONFIDENTIAL` hanya dapat diakses oleh role terpilih (Deny-by-Default).
4. **Pemisahan Tugas (Separation of Duties):** Memastikan pembuat dokumen tidak menjadi penyetuju akhir (*final approver*).

---

## 2. Matriks Peran Teknis

| Role | Cakupan Mandat | Izin Kunci |
| :--- | :--- | :--- |
| `PLATFORM_ADMIN` | Lintas Organisasi PMKI | Hak penuh seluruh modul dan konfigurasi |
| `ORG_ADMIN` | Tingkat Mupel (Jawa Timur) | Manajemen unit pelayanan, program, dan laporan |
| `UNIT_COORDINATOR` | Unit Griya Asih Lawang | Verifikasi siswa, koordinasi guru, persetujuan media |
| `PROGRAM_COORDINATOR` | Program Bimbingan Belajar | Review program, monitoring kelas literasi membaca |
| `TEACHER` | Rombel Kelas & Siswa | Presensi sesi Sabtu, catatan perkembangan karakter |
| `VOLUNTEER` | Asistensi Kelas | Presensi kehadiran dan pencatatan absensi |
| `EDITOR` | Redaksi Publikasi | Penyusunan draft berita dan dokumentasi acara |
| `REVIEWER` | Peninjau Mutu | Review privasi foto dan draft laporan |
| `APPROVER` | Pejabat Berwenang | Persetujuan akhir laporan triwulan dan publikasi |
| `AUDITOR` | Kepatuhan & Tata Kelola | Pembacaan read-only riwayat audit log |
| `STAKEHOLDER` | Mitra & Donatur | Pembacaan ringkasan publik dan indikator capaian |

---

## 3. Penegakan Pemisahan Tugas (Separation of Duties)
Dalam alur persetujuan laporan (`ServiceReport`), sistem memverifikasi:
```typescript
if (action === 'APPROVED' && report.createdBy === currentUser.id) {
  // DITOLAK: Pembuat laporan tidak boleh menyetujui laporannya sendiri
}
```
Aturan ini mencegah konflik kepentingan dan menjamin akuntabilitas tata kelola kelembagaan PMKI.
