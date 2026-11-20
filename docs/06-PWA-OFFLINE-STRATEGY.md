# 06-PWA-OFFLINE-STRATEGY.md

# PMKI PWA & Offline Strategy

## Platform Pelayanan Terpadu PMKI
### Rumah Belajar Griya Asih Lawang

Version: 1.0  
Status: Production PWA Architecture  
Priority: Critical  
Architecture Type: Offline-First Operational Workflows

Dependencies:

- 03-DESIGN-IDENTITY-SYSTEM.md
- UI-UX-DESIGN-SYSTEM.md v2.1
- PRODUCTION-ARCHITECTURE-BLUEPRINT.md
- 02-NEXTJS-PRODUCTION-BLUEPRINT.md
- 04-DRIZZLE-DATABASE-ARCHITECTURE.md
- 05-AUTHORIZATION-RBAC-BLUEPRINT.md

---

# 1. Purpose

Dokumen ini mendefinisikan strategi PWA dan offline untuk PMKI.

Tujuan utama:

```text
Mobile First

Reliable

Fast

Installable

Offline Friendly

Field Ready
```

PMKI digunakan oleh:

- Guru
- Relawan
- Koordinator
- Pengurus Program

yang tidak selalu memiliki koneksi internet stabil.

Karena itu aplikasi harus tetap dapat mendukung pekerjaan lapangan penting meskipun koneksi tidak tersedia.

---

# 2. Offline Philosophy

PMKI TIDAK menggunakan pendekatan:

```text
Always Online
```

PMKI menggunakan:

```text
Offline Aware
```

Artinya:

- Pengguna tetap dapat bekerja saat koneksi hilang.
- Data disinkronkan ketika koneksi kembali.
- Konflik ditangani secara eksplisit.
- Keakuratan data lebih penting daripada kenyamanan.

---

# 3. Mobile First Principle

Perangkat utama:

```text
Smartphone
```

Bukan desktop.

Target pengguna paling umum:

```text
Teacher

Volunteer

Coordinator
```

Target viewport utama:

```text
375px
```

---

# 4. PWA Strategy

PMKI adalah:

```text
Progressive Web App
```

bukan sekadar website yang dapat diinstall.

---

# 5. PWA Features

## Installable

Mendukung:

```text
Add To Home Screen

Standalone Mode

Splash Screen

Theme Color

App Icons
```

---

## Offline Shell

Aplikasi tetap dapat dibuka tanpa internet.

Termasuk:

```text
Navigation

Layout

Header

Dashboard Shell

Last Known Data
```

---

## Local Persistence

Menyimpan data kerja sementara secara aman.

---

## Background Sync

Mengirim perubahan yang tertunda saat koneksi kembali.

---

# 6. Offline Classification

Tidak semua fitur memiliki prioritas yang sama.

---

# Tier A — Offline Critical

Harus tetap dapat digunakan.

## Attendance

```text
Record attendance

Update attendance

Queue attendance
```

---

## Development Notes

```text
Create notes

Draft notes

Queue notes
```

---

## Student Lookup

Data yang telah dibuka sebelumnya dapat dilihat kembali.

---

# Tier B — Offline Useful

Boleh tersedia offline.

## Dashboard

```text
Cached
```

---

## Student Detail

```text
Last synced version
```

---

## Schedules

```text
Cached
```

---

# Tier C — Online Required

Harus terkoneksi internet.

## Governance

```text
Approval

Validation

Review
```

---

## Publishing

```text
Publish

Archive
```

---

## Administration

```text
User Management

RBAC Management
```

---

## Audit

```text
Full live audit
```

---

# 7. Data Storage Strategy

Jangan gunakan:

```text
localStorage
```

untuk data operasional.

---

Gunakan:

```text
IndexedDB
```

melalui abstraction service.

---

Contoh:

```text
Attendance Drafts

Development Drafts

Sync Queue

Cached Lists

Cached Detail Pages
```

---

# 8. Local Storage Layers

## Layer 1

Static Assets

```text
Logo

Icons

Fonts
```

---

## Layer 2

Reference Data

```text
Classes

Schedules

Academic Years
```

---

## Layer 3

Operational Drafts

```text
Attendance

Development Notes
```

---

## Layer 4

Sync Queue

```text
Pending Writes
```

---

# 9. Caching Strategy

## Cache First

Untuk:

```text
Images

Icons

Fonts
```

---

## Network First

Untuk:

```text
User Sensitive Data

Governance
```

---

## Stale While Revalidate

Untuk:

```text
Dashboard

Student Lists

Schedules
```

---

# 10. Attendance Offline Strategy

Attendance adalah workflow paling kritis.

---

Mode Offline:

```text
Select Session

↓

Record Attendance

↓

Save Draft

↓

Queue Sync
```

---

Pengguna harus mendapatkan indikator:

```text
Disimpan Lokal

Belum Tersinkronisasi
```

---

Bukan indikator menyesatkan seperti:

```text
Berhasil Disimpan
```

padahal belum masuk server.

---

# 11. Development Notes Offline Strategy

Saat offline:

```text
Create Note

↓

Save Draft

↓

Queue Sync
```

---

Status:

```text
Draft Lokal

Menunggu Sinkronisasi

Tersinkronisasi
```

---

# 12. Sync Queue Architecture

Setiap perubahan tersimpan ke queue.

Structure:

```text
operation_id

entity_type

entity_id

created_at

payload

sync_status
```

---

Status:

```text
PENDING

PROCESSING

SUCCESS

FAILED
```

---

# 13. Background Sync

Saat koneksi kembali:

```text
Pending Queue

↓

Background Sync

↓

Server

↓

Success / Failure
```

---

Tidak memerlukan refresh halaman.

---

# 14. Conflict Resolution

Prinsip:

```text
Clarity over automation
```

---

## Attendance

Jika terjadi konflik:

```text
Server Wins

Manual Review
```

ditandai untuk diperiksa.

---

## Development Notes

Dapat disimpan sebagai:

```text
Versioned Notes
```

dan tidak langsung ditimpa.

---

# 15. Last Sync Strategy

Tampilkan:

```text
Sinkron terakhir:

7 Nov 2026 15:30 WIB
```

---

bukan:

```text
Up To Date
```

yang ambigu.

---

# 16. Connectivity Awareness

Aplikasi harus mengetahui:

```text
ONLINE

OFFLINE

RECONNECTING
```

---

Status harus terlihat tetapi tidak mengganggu.

---

Contoh:

```text
Offline

Perubahan akan dikirim saat koneksi kembali.
```

---

# 17. UX States

## Online

```text
Connected
```

---

## Offline

```text
Saved Locally
```

---

## Syncing

```text
Sync in Progress
```

---

## Failed

```text
Action Required
```

---

# 18. Registration Strategy

Public Registration:

```text
Online Preferred
```

---

Jika offline:

Data tetap dapat diisi.

Tetapi pengiriman:

```text
Queued
```

hingga koneksi tersedia.

---

# 19. Authentication Strategy

Session tetap memiliki masa berlaku.

Offline bukan berarti bypass authentication.

---

User harus:

```text
Sudah login sebelumnya
```

untuk mengakses workspace offline.

---

# 20. Service Worker Strategy

Service Worker bertanggung jawab terhadap:

```text
Caching

Offline Assets

Background Sync

Update Detection
```

---

Tidak digunakan untuk authorization.

---

# 21. Update Strategy

Ketika versi baru tersedia:

```text
Update Available
```

ditampilkan secara halus.

---

Pengguna memilih:

```text
Update Now

Later
```

---

Hindari hard refresh mendadak.

---

# 22. Media Strategy

Media tidak otomatis tersedia offline.

Prioritas:

```text
Thumbnail
```

lebih dulu.

---

Gambar besar:

```text
Network First
```

---

# 23. Security Rules

Tidak boleh menyimpan:

```text
Password

Auth Secrets

Server Tokens
```

secara lokal.

---

Data sensitif offline harus minimal.

---

# 24. Offline Privacy Rules

Jika perangkat hilang:

Dampak harus dibatasi.

---

Jangan menyimpan:

```text
Guardian Details
Consent Evidence
Private Notes
```

secara massal ke cache.

---

# 25. Offline Audit

Tindakan offline tetap menghasilkan audit intent.

Saat sinkronisasi:

```text
Original Timestamp

Sync Timestamp
```

dicatat.

---

# 26. Notification Strategy

Masa depan:

```text
Push Notifications
```

untuk:

- review
- approvals
- publication
- coordinator alerts

---

Tidak menjadi bagian MVP pertama.

---

# 27. Monitoring Strategy

Track:

```text
Sync Failures

Offline Sessions

Queue Size

Retry Count
```

---

# 28. Performance Budget

Target:

```text
Initial Load
< 3s

Repeated Load
< 1s
```

pada koneksi umum.

---

# 29. Implementation Architecture

```text
Next.js PWA

        ↓

Service Worker

        ↓

IndexedDB

        ↓

Sync Queue

        ↓

Server Actions

        ↓

Drizzle

        ↓

PostgreSQL
```

---

# 30. Feature Readiness Matrix

| Feature | Offline | Draft | Sync |
|----------|----------|----------|----------|
| Attendance | ✅ | ✅ | ✅ |
| Development Notes | ✅ | ✅ | ✅ |
| Student List | ✅ Cached | ❌ | Refresh |
| Student Detail | ✅ Cached | ❌ | Refresh |
| Dashboard | ✅ Cached | ❌ | Refresh |
| Reports | ❌ | ❌ | Online |
| Publishing | ❌ | ❌ | Online |
| Administration | ❌ | ❌ | Online |
| Audit | ❌ | ❌ | Online |

---

# 31. PWA Non-Negotiables

Rule 01

```text
Mobile First
```

---

Rule 02

```text
Attendance must survive connectivity loss.
```

---

Rule 03

```text
Offline work must not be silently lost.
```

---

Rule 04

```text
Users must know sync status.
```

---

Rule 05

```text
Offline does not bypass security.
```

---

Rule 06

```text
Clarity beats automation.
```

---

# 32. Definition of Done

PWA dianggap siap jika:

✅ Installable

✅ Offline Shell

✅ Offline Attendance

✅ Offline Development Notes

✅ Background Sync

✅ Sync Queue

✅ Connectivity Awareness

✅ Conflict Handling

✅ Mobile First

✅ Secure Offline Storage

✅ IndexedDB Strategy

✅ Service Worker Strategy

✅ Production Ready

---

# 33. Final Statement

> PMKI menggunakan strategi Mobile-First Progressive Web Application dengan pendekatan Offline-Aware Operational Workflows. Fokus utama bukan sekadar membuat aplikasi dapat diinstal, melainkan memastikan aktivitas pelayanan yang paling kritis seperti presensi dan catatan perkembangan tetap dapat dilakukan secara aman, jelas, dan andal ketika koneksi internet tidak tersedia.

> Connectivity is preferred.

> Work must continue.

> Data integrity must survive offline conditions.
