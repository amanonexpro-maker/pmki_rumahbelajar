# Panduan Build & Deployment

## Build frontend

```bash
npm run build
```

Hasil build tersedia di direktori `dist/` dan dapat disajikan oleh web server
statis seperti Nginx. Aplikasi belum memiliki backend/API untuk menghubungkan
frontend ke PostgreSQL.

## PostgreSQL lokal

PostgreSQL lokal dijalankan melalui Docker Compose. Ikuti
[panduan Docker](./docker.md) untuk konfigurasi, menjalankan database, dan
menguji koneksi.
