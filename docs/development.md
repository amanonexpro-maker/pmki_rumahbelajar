# Panduan Pengembangan Lokal (Local Development)

## 1. Prasyarat Sistem
- Node.js versi 20+ atau 22 LTS
- NPM versi 10+
- Docker & Docker Compose (Opsional jika menggunakan database kontainer)

## 2. Langkah Instalasi Reproduktif

### Linux / macOS
```bash
# Salin konfigurasi environment
cp .env.example .env.local

# Pasang dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

### Windows PowerShell
```powershell
# Salin konfigurasi environment
Copy-Item .env.example .env.local

# Pasang dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

## 3. Skrip NPM yang Tersedia
- `npm run dev`: Menjalankan server pengembangan Vite di port 3000.
- `npm run build`: Membangun aset produksi yang teroptimasi.
- `npm run preview`: Menguji hasil build produksi secara lokal.
- `npm run lint`: Memvalidasi tipe data TypeScript dengan `tsc --noEmit`.
