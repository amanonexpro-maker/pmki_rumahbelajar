# Otentikasi (Authentication) - Platform Pelayanan Terpadu PMKI

## 1. Mekanisme Otentikasi MVP
Otentikasi pada rilis awal (MVP) diimplementasikan menggunakan kredensial lokal (Email + Password) dengan enkripsi sandi yang aman.

### Ketentuan Otentikasi:
1. **Pembuatan Akun:** Pengguna dibuat dan diundang oleh Administrator Platform atau Koordinator Unit. Pendaftaran umum tidak otomatis menghasilkan akun internal.
2. **Keamanan Sandi:** Sandi di-hash menggunakan algoritma `bcrypt` dengan *salt rounds* $\ge 10$.
3. **Status Akun (Active/Inactive):** Akun yang dinonaktifkan oleh administrator secara instan diblokir dari semua endpoint dan dashboard.
4. **Metadata Sesi:** Mencatat timestamp `last_login_at` dan alamat IP untuk keperluan audit keamanan.
5. **Dukungan IdP Eksternal:** Struktur penyimpanan identitas telah memisahkan pengenal kredensial sehingga dapat dengan mudah diintegrasikan dengan OAuth / SSO Google Workspace di masa mendatang.
