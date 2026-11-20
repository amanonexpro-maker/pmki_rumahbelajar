# PMKI Offline & Sync Readiness Matrix (Fase 5)

Dokumen ini mendokumentasikan arsitektur, klasifikasi Tier A/B/C, resolusi konflik, privasi penyimpanan lokal, dan hasil pengujian **Offline Engine & Background Sync** sesuai `docs/06-PWA-OFFLINE-STRATEGY.md`, `docs/08-STATE-MANAGEMENT.md §24–38`, dan `docs/09-API-ARCHITECTURE.md §27–29`.

---

## 1. Feature Readiness Matrix (`06 §30`)

| Fitur / Modul | Tier | Akses Offline | Draft Lokal (IndexedDB) | Antrean Sync (`/api/sync`) | Kebijakan Konflik & Privasi | Status Verifikasi |
| :--- | :-: | :-: | :-: | :-: | :--- | :---: |
| **Kehadiran (`Attendance`)** | **Tier A** | ✅ Penuh | ✅ `operational_drafts` | ✅ `ATTENDANCE_RECORD` (idempoten) | **Server Wins + Manual Review** (`[PERLU TINJAUAN KOORDINATOR]`); `UNIQUE(class_id, session_date)` | `TERVERIFIKASI` |
| **Perkembangan Peserta (`Development Notes`)** | **Tier A** | ✅ Penuh | ✅ `operational_drafts` | ✅ `DEVELOPMENT_NOTE_UPSERT` (idempoten) | **Versioned Notes (`v1 → v2` + `development_note_revisions`)**, tidak menimpa diam-diam; `confidential=true` default | `TERVERIFIKASI` |
| **Pendaftaran Publik (`Public Registration`)** | **Tier A/B** | ✅ Form & Queue | ✅ `registration_drafts` | ✅ Auto-flush saat online | Label jujur: *"Pendaftaran disimpan lokal. Akan dikirim saat online."* | `TERVERIFIKASI` |
| **Situs Publik (`Public Experience /`, `/program`, `/gallery`, `/news`)** | **Tier B** | ✅ Cached Shell & Gambar | ❌ | Refresh saat online | Service Worker `sw.js` Network-First + Cache Fallback untuk halaman publik & Cache-First untuk foto galeri (`06 §9, §28`) | `TERVERIFIKASI (FASE 9)` |
| **Daftar Peserta Didik (`Student List`)** | **Tier B** | ✅ Cached | ❌ | Refresh saat online | Tanpa nomor telepon/alamat wali di cache (`sanitizeForOfflineStorage`) | `TERVERIFIKASI` |
| **Profil Peserta Didik (`Student Detail`)** | **Tier B** | ✅ Cached | ❌ | Refresh saat online | Data `CONFIDENTIAL` wali di-strip sebelum cache lokal | `TERVERIFIKASI` |
| **Dashboard & Jadwal (`Schedules`)** | **Tier B** | ✅ Cached | ❌ | Refresh saat online | Hanya metadata kelas & jadwal non-rahasia | `TERVERIFIKASI` |
| **Laporan & Tata Kelola (`Governance`)** | **Tier C** | ❌ Diblokir | ❌ | **Online-Only** | Ditolak tenang oleh `checkTierCOnlineAvailability` & skema `/api/sync` | `TERVERIFIKASI` |
| **Publikasi (`Publishing`)** | **Tier C** | ❌ Diblokir | ❌ | **Online-Only** | Keputusan publikasi publik wajib tervalidasi server langsung | `TERVERIFIKASI` |
| **Administrasi & RBAC (`Administration`)** | **Tier C** | ❌ Diblokir | ❌ | **Online-Only** | Perubahan peran/override wajib online | `TERVERIFIKASI` |
| **Jejak Audit (`Audit`)** | **Tier C** | ❌ Diblokir | ❌ | **Online-Only** | Live audit bersumber langsung dari PostgreSQL append-only | `TERVERIFIKASI` |

---

## 2. Matriks Uji State & Skenario (`08 §37` & `06 §12–25`)

| # | Skenario State | Perilaku Sistem & Label UI (`10 §7`) | Bukti Pengujian |
| :-: | :--- | :--- | :--- |
| 1 | **Online Normal** | Mutasi lewat Server Action / `/api/sync` → konfirmasi DB → `StatusBadge` **"Tersinkronisasi"** + indikator header **"Terhubung · Sinkron terakhir: [waktu] WIB"** | `attendance-sync.integration.test.ts` |
| 2 | **Offline Draft & Queue** | Perubahan disimpan ke IndexedDB (`idb`) → `StatusBadge` **"Disimpan lokal"** / **"Menunggu sinkronisasi"** (tanpa klaim palsu *"Berhasil disimpan"*) | `offline-engine.test.ts` |
| 3 | **Draft Recovery (Refresh / Tutup Tab)** | Saat halaman dibuka kembali, `useDraftRecovery` memulihkan draft dari IndexedDB dengan banner tenang *"Draft presensi lokal dipulihkan"* | `offline-engine.test.ts` |
| 4 | **Reconnect Auto-Sync** | Event `window.online` memicu `useOfflineQueue().flushQueue()` otomatis di latar belakang tanpa refresh halaman | `use-offline-queue.ts` |
| 5 | **Idempotency (`operationId` dikirim 2×)** | Ledger `sync_operations` menolak pengiriman kedua dengan `409 RESOURCE_CONFLICT` sehingga mutasi hanya terjadi 1 kali | `attendance-sync.integration.test.ts` |
| 6 | **Konflik Presensi (`Server Wins + Manual Review`)** | Jika sesi sudah tercatat di server dengan status berbeda, data server dipertahankan dan sesi ditandai `[PERLU TINJAUAN KOORDINATOR]` | `attendance-sync.integration.test.ts` |
| 7 | **Konflik/Edits Catatan Perkembangan (`Versioned`)** | Update offline menaikkan `version` (`v1 → v2`) dan menambah baris di `development_note_revisions` tanpa menimpa versi lama | `attendance-sync.integration.test.ts` |
| 8 | **Role Change / Revoke Saat Sebelum Sync** | `/api/sync` mengevaluasi `resolveAccess(userId)` per-request saat sinkronisasi tiba; bila izin dicabut → `403 PERMISSION_DENIED` | `attendance-sync.integration.test.ts` |
| 9 | **Session Expiry Saat Sync** | `/api/sync` memverifikasi `getCurrentSession()` (`supabase.auth.getUser()`); bila sesi kedaluwarsa → `401 UNAUTHORIZED` (item tetap aman di IndexedDB) | `attendance-sync.integration.test.ts` |
| 10 | **Privasi Offline (`06 §23–24`) & Audit (`06 §25`)** | `sanitizeForOfflineStorage` menghapus `password`, `accessToken`, `guardian`, `guardianPhone`, `consentEvidence`; `audit_logs` mencatat `originalTimestamp` + `syncedAt` | `offline-engine.test.ts` & `attendance-sync.integration.test.ts` |

