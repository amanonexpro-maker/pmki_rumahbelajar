# Arsitektur Sistem - Platform Pelayanan Terpadu PMKI

## 1. Pendekatan Modular Monolith
Platform Pelayanan Terpadu PMKI mengadopsi pola arsitektur **Modular Monolith**. Arsitektur ini dipilih karena memberikan isolasi domain bisnis yang kuat tanpa komplikasi jaringan, latensi, dan kompleksitas orkestrasi yang tidak diperlukan pada layanan sosial-edukasi.

### Lapisan Arsitektur (Layered Clean Architecture):
1. **Presentation Layer (UI / Views):**
   - Komponen React modular berbasis Tailwind CSS.
   - Komponen UI tidak pernah menjalankan query database langsung.
2. **Controller / Dispatcher Layer:**
   - Menghubungkan interaksi pengguna dengan use-case bisnis.
   - Memvalidasi format masukan menggunakan skema Zod.
3. **Authorization & Security Layer:**
   - Evaluasi izin melalui fungsi terpusat `can(user, permission, context)`.
   - Penerapan aturan klasifikasi data (**PUBLIC**, **STAKEHOLDER**, **INTERNAL**, **CONFIDENTIAL**).
   - Penegakan **Separation of Duties** (Pemisahan Tugas).
4. **Domain Services & Use Cases:**
   - Menjalankan alur bisnis: pendaftaran siswa, presensi sesi, kurasi media, persetujuan bertingkat.
5. **Persistence & Storage Layer:**
   - Abstraksi penyimpanan data dengan pencatatan audit log otomatis pada setiap operasi penulisan (*mutation*).

---

## 2. Model Multi-Organisasi (Multi-Tenancy Scoping)
Sistem mendukung struktur hierarki bertingkat:
- **Tingkat 1:** PMKI Sinodal (Pusat)
- **Tingkat 2:** PMKI Mupel (Wilayah, contoh: Jawa Timur)
- **Tingkat 3:** Jemaat / Unit Pelayanan (contoh: Rumah Belajar Griya Asih Lawang, RAAL)
- **Tingkat 4:** Program & Aktivitas Pelayanan

Setiap entitas data operasional terikat pada `organization_id` atau `service_unit_id`, sehingga pengguna dari unit lain tidak dapat membaca maupun memodifikasi data tanpa otorisasi eksplisit.
