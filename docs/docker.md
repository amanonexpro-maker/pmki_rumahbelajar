# Panduan Docker & PostgreSQL

Compose menyediakan PostgreSQL 16 dan pgAdmin opsional. Frontend memakai API
Express lokal untuk membaca dan menyimpan data ke PostgreSQL; browser tidak
terhubung langsung ke database.

## Persiapan

1. Pastikan Docker Desktop berjalan dengan Linux containers.
2. Salin `.env.example` menjadi `.env`.
3. Isi `SQL_ADMIN_PASSWORD` dengan password lokal yang kuat. Jika ingin
   menjalankan pgAdmin, isi juga `PGADMIN_DEFAULT_PASSWORD` terlebih dahulu.

PowerShell:

```powershell
Copy-Item .env.example .env
```

## Menjalankan PostgreSQL

```powershell
# Menjalankan database saja
docker compose up -d

# Memeriksa status dan health database
docker compose ps

# Menguji kesiapan PostgreSQL dari dalam container
docker compose exec db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# Menguji query SQL
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;"'
```

Port `5432` hanya di-bind ke komputer lokal. Aplikasi/database client yang
berjalan di komputer host menggunakan host `localhost` dan port dari
`SQL_PORT` (default `5432`). Container lain di network Compose menggunakan
host `db` dan port `5432`.

Kredensial PostgreSQL yang dibuat oleh Compose adalah `SQL_ADMIN_USER` dan
`SQL_ADMIN_PASSWORD`. Variabel `SQL_HOST`/`SQL_PORT` adalah nilai koneksi untuk
client di host; dari container lain, host koneksinya adalah `db`.

## Menjalankan website dengan PostgreSQL

Jalankan dua perintah berikut di dua terminal PowerShell dari folder proyek:

```powershell
# Terminal 1: API database
npm run api:dev

# Terminal 2: frontend
npm run dev
```

Buka `http://localhost:3000`. Endpoint `http://localhost:3001/api/health`
menampilkan status API dan koneksi database. Pada koneksi pertama, data awal
browser akan disimpan ke database jika database belum memiliki data. Setelah
itu database menjadi sumber data saat aplikasi dimuat.

Pada startup, data snapshot lama akan dimigrasikan ke tabel-tabel relasional
secara otomatis. Detail dan batasan model data dijelaskan di
[panduan database](./database.md). Autentikasi dashboard masih berupa
simulasi akun/peran demo; jangan gunakan data pribadi nyata atau ekspos API
ini ke jaringan sebelum menambahkan autentikasi dan kontrol akses backend.

## pgAdmin (opsional)

```powershell
docker compose --profile dev up -d
```

Buka `http://localhost:5050`, lalu tambahkan server PostgreSQL dengan host
`db`, port `5432`, database `SQL_DB_NAME`, dan kredensial `SQL_ADMIN_USER` /
`SQL_ADMIN_PASSWORD` dari `.env`.

## Menghentikan layanan

```powershell
docker compose down
```

Data tetap tersimpan di volume `postgres_data`. Untuk menghapus data tersebut,
hapus volume secara terpisah hanya jika memang ingin menghapus seluruh data
database lokal.
