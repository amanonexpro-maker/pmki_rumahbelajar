# PMKI Dynamic RBAC & Policy Matrix

Dokumen ini mendokumentasikan implementasi **Otorisasi Dinamis, Cakupan (Scope), dan Kebijakan Tata Kelola (Policy)** sesuai `docs/05-AUTHORIZATION-RBAC-BLUEPRINT.md`, `docs/10-CONTENT-MICROCOPY-GUIDE.md §6`, dan `AGENTS.md` (ADR-13).

## 1. Prinsip Dasar
- **Default Deny, Least Privilege, Need To Know.**
- **Identitas ≠ Otorisasi:** Supabase Auth hanya memverifikasi identitas (`supabase.auth.getUser()`). Seluruh izin dihitung **per-request dari PostgreSQL** (`resolveAccess` → `resolveAccessCached`), bukan dari klaim JWT.
- **Urutan Resolusi Izin (`05 §11`):**
  1. `role_permissions` (dari seluruh peran aktif pengguna)
  2. `+ user_permissions (effect = 'GRANT')`
  3. `- user_permissions (effect = 'REVOKE')` — **REVOKE SELALU MENANG**
- **Rantai Evaluasi Otorisasi (`05 §3`, `09 §17`):**
  `Authentication` → `Permission` → `Scope (Organization / Service Unit / Program)` → `Policy (Separation of Duties & Data Classification)`
- **Kebijakan di Atas Peran:** `PLATFORM_ADMIN` tetap tunduk pada kebijakan Separation of Duties (`POLICY_DENIED` jika menyetujui laporannya sendiri).

## 2. Daftar 11 Peran Kanonik (`05 §6`, `10 §6`)

| Kode Peran | Label UI Kanonik | Fokus Cakupan | Catatan Kebijakan |
| :--- | :--- | :--- | :--- |
| `PLATFORM_ADMIN` | Administrator Platform | Seluruh organisasi & unit | Tetap tunduk pada SoD & audit append-only |
| `ORG_ADMIN` | Administrator Organisasi | Organisasi & unit di bawahnya | Tidak dapat mengubah audit |
| `UNIT_COORDINATOR` | Koordinator Unit | Unit layanan | Validasi unit, verifikasi peserta didik, review consent |
| `PROGRAM_COORDINATOR` | Koordinator Program | Unit & program | Tinjauan program, penempatan kelas |
| `TEACHER` | Pengajar | Kelas / unit | Presensi & catatan perkembangan; default TIDAK bisa baca kontak wali (`guardian.read`) |
| `VOLUNTEER` | Relawan | Kelas / unit | Akses operasional terbatas sesuai penugasan |
| `EDITOR` | Penyusun Konten | Unit / publikasi | Draft konten & media; tidak bisa publish tanpa persetujuan privasi |
| `REVIEWER` | Peninjau | Unit / tata kelola | Tinjauan privasi dokumentasi & publikasi |
| `APPROVER` | Pejabat Penyetuju | Organisasi / unit | Persetujuan akhir laporan; wajib SoD |
| `AUDITOR` | Auditor | Read-only audit | Membaca `audit_logs` & laporan |
| `STAKEHOLDER` | Pemangku Kepentingan | Read-only ringkasan | Melihat laporan disetujui tanpa data rahasia anak |

## 3. Klasifikasi Data (`05 §13–14`)

| Klasifikasi | Contoh Data | Kebijakan Default |
| :--- | :--- | :--- |
| `PUBLIC` | Profil publik, jadwal umum, publikasi `PUBLISHED` | Terbuka di situs publik |
| `STAKEHOLDER` | Ringkasan laporan yang telah `APPROVED` | Terbatas untuk pengguna terautentikasi dengan izin baca laporan |
| `INTERNAL` | Presensi kelas, daftar kelas, pengajar | Wajib izin + cocok cakupan unit/program |
| `CONFIDENTIAL` | Kontak wali (`guardian.*`), catatan perkembangan privat (`development.*`), bukti persetujuan (`consent.*`) | **DEFAULT DENY**; wajib izin eksplisit (`canAccessConfidential`) + cocok cakupan |

## 4. Matriks Skenario Verifikasi Wajib (Fase 3)

| # | Skenario | Hasil yang Diharapkan | Status Verifikasi |
| :-: | :--- | :--- | :--- |
| 1 | Self-signup publik (`supabase.auth.signUp`) | Ditolak (`enable_signup = false`) | Terverifikasi (`rbac.integration.test.ts`) |
| 2 | `TEACHER` default | Boleh `attendance.record`, ditolak `guardian.read` (`PERMISSION_DENIED`) | Terverifikasi (unit & integrasi DB live) |
| 3 | `TEACHER` + dynamic `GRANT guardian.read` | Langsung diizinkan pada request berikutnya tanpa re-login / redeploy | Terverifikasi (`rbac.integration.test.ts`) |
| 4 | `TEACHER` + dynamic `REVOKE development.create` | Langsung ditolak (REVOKE menang atas default role) | Terverifikasi (`rbac.integration.test.ts`) |
| 5 | Akses lintas unit layanan (`serviceUnitId` berbeda) | Ditolak dengan `SCOPE_DENIED` | Terverifikasi (unit & integrasi DB live) |
| 6 | `APPROVER` menyetujui laporan miliknya sendiri | Ditolak dengan `POLICY_DENIED` (Separation of Duties) | Terverifikasi (unit & integrasi DB live) |
| 7 | `PLATFORM_ADMIN` menyetujui laporan miliknya sendiri | Tetap ditolak dengan `POLICY_DENIED` (Policy menang atas admin) | Terverifikasi (unit & integrasi DB live) |
| 8 | Email pemulihan kata sandi (`resetPasswordForEmail`) | Terkirim ke Mailpit lokal (`http://127.0.0.1:55424`) | Terverifikasi (`rbac.integration.test.ts`) |

