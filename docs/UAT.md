# UAT — User Acceptance Test · Pytagotech Portal

> **Versi:** 1.0 · 2026-11-03
> **Ruang lingkup:** Gate 4 (Deploy Ready) — verifikasi fungsional per role, RBAC/RLS, dan non-fungsional terhadap PRD.
> **Kredensial & data seed:** lihat `docs/CREDENTIALS.md`.
> **Status legend:** ✅ Lulus · ❌ Gagal · N/A Tidak berlaku

---

## 1. Tujuan

Membuktikan seluruh alur inti PRD bekerja secara end-to-end terhadap database live (Supabase production) dengan akun per role, sebelum go-live di Vercel.

## 2. Prasyarat

- [ ] App berjalan (`npm run dev` → `http://localhost:3000`, atau URL Vercel).
- [ ] Supabase reachable dari browser tester (bukan tunnel/proxy).
- [ ] Data seed live tersedia (lihat `docs/CREDENTIALS.md`).

## 3. Autentikasi (US-002)

| ID | Langkah | Hasil diharapkan | Status |
|----|---------|------------------|--------|
| UAT-A1 | Buka `/`, belum login | Redirect ke `/login` | |
| UAT-A2 | Login `pilot.sales@...` + sandi salah | Notif "Email atau kata sandi salah." | |
| UAT-A3 | Login `pilot.sales@...` + sandi benar | Masuk ke beranda Sales | |
| UAT-A4 | Klik "Lupa kata sandi?" | Form reset tampil | |
| UAT-A5 | Logout | Kembali ke `/login` | |

## 4. RBAC & beranda per role (US-003, US-044)

| Role | Menu tampak | Menu tersembunyi | Status |
|------|-------------|------------------|--------|
| Sales / Marketing | CRM (lead, pipeline, dashboard) | Proyek, Sosmed, Pengaturan | |
| Project Manager | Proyek (task board, gantt, backlog) | CRM tulis, Pengaturan user | |
| Developer | Proyek (read/task/backlog) | CRM, Pengaturan | |
| Social Media Specialist | Sosmed (planner, ide, materi, kalender) | CRM, Proyek | |
| Graphic Designer / … | Materi konten, asset/library | Ide, publikasi, CRM | |
| Executive / Leader | Semua dashboard (CRM, produksi, sosmed) | Pengaturan master | |
| Super Admin | Semua + Pengaturan (user, master data, arsip, SOP) | — | |

## 5. CRM (Sales) — US-007..US-013

| ID | Langkah | Hasil diharapkan | Status |
|----|---------|------------------|--------|
| UAT-C1 | Login Sales → buka Lead | Melihat `LEAD-012`, `LEAD-013` | |
| UAT-C2 | Tambah lead baru (industri `F&B`, status `New`) | Lead tersimpan, `display_id` `LEAD-xxx` | |
| UAT-C3 | Ubah PIC lead ke Nabila | Tersimpan, muncul di activity log | |
| UAT-C4 | Deteksi duplikat (email/WA sama) | Peringatan duplikat | |
| UAT-C5 | Impor CSV | Baris terimport, error per baris terlapor | |
| UAT-C6 | Pipeline Interested Leads | `LEAD-013` (Interest) muncul di pipeline | |
| UAT-C7 | Dashboard CRM | Angka agregat per PIC | |

## 6. Proyek & produksi (PM) — US-019..US-026

| ID | Langkah | Hasil diharapkan | Status |
|----|---------|------------------|--------|
| UAT-P1 | Login PM → Daftar Proyek | Melihat `PRJ-010` `teduh - pak abi (pyt-001)` | |
| UAT-P2 | Buka detail `PRJ-010` | Nama/kode/klien/deal/nilai 8jt sesuai | |
| UAT-P3 | Task board | 3 task (RAD, PUS, SAD) urut tanggal | |
| UAT-P4 | Geser kartu kanban | Status task berubah, progress terhitung | |
| UAT-P5 | Gantt chart | Bar task sesuai 09–19 Nov | |
| UAT-P6 | Backlog fitur | Kosong / dapat tambah fitur | |
| UAT-P7 | Buat proyek dari handover `HDV-011` | Proyek baru + task template + kode unik (idempoten bila sudah ada) | |
| UAT-P8 | (Developer) Akses `PRJ-010` read-only | Dapat lihat, tak dapat ubah | |

## 7. Sosmed (Sosmed/Designer) — US-027..US-034

| ID | Langkah | Hasil diharapkan | Status |
|----|---------|------------------|--------|
| UAT-S1 | Login Sosmed → Content Planner | Melihat `IDE-001`, `IDE-002` | |
| UAT-S2 | Tambah ide (brand `Pytagotech`, pillar `Edukasi`) | Tersimpan, `IDE-xxx` | |
| UAT-S3 | Ide `readiness = Siap Masuk Produksi` tanpa brief lengkap | Ditolak (skor brief < 5) | |
| UAT-S4 | Materi `MAT-0002` — ubah status ke `Dijadwalkan` sebelum quality gate | Ditolak (gate belum lengkap) | |
| UAT-S5 | Lengkapi gate (visual/audio/cover/cta/proofread) → `Dijadwalkan` | Berhasil | |
| UAT-S6 | Kalender publikasi | `PUB-0001` muncul 20 Nov | |
| UAT-S7 | (Designer) Buka materi, coba buat ide | Materi bisa, ide ditolak | |

## 8. Pengaturan & tata kelola (Super Admin) — US-041..US-043

| ID | Langkah | Hasil diharapkan | Status |
|----|---------|------------------|--------|
| UAT-G1 | Pengaturan → Pengguna | Buat user + role | |
| UAT-G2 | Pengaturan → Master Data | Tambah/hapus opsi (brand/pillar/platform) | |
| UAT-G3 | SOP / panduan (RACI) | Edit panduan markdown + sel RACI | |
| UAT-G4 | Arsip data | Arsipkan lead → tak tampil; restore | |
| UAT-G5 | Ekspor CSV | File terunduh | |
| UAT-G6 | Pengaturan → Reset Data Demo | Konfirmasi → data operasional kembali ke snapshot (2 lead, 1 klien, 1 handover, 1 proyek, 3 task, 2 ide, 1 materi, 1 publikasi) tanpa menyentuh akun/role/master | |

## 9. RLS — kontrol akses tulis (hasil live terverifikasi 2026-11-03)

| ID | Aktor | Aksi | Harapan | Live | Status UAT |
|----|-------|------|---------|------|-----------|
| UAT-R1 | Sales | insert `leads` | diizinkan | 201 | ✅ |
| UAT-R2 | Sales | insert `projects` | ditolak | 403 | ✅ |
| UAT-R3 | PM | insert `leads` | ditolak | 403 | ✅ |
| UAT-R4 | Developer | insert `projects` | ditolak | 403 | ✅ |
| UAT-R5 | Sosmed | insert `content_ideas` | diizinkan | 201 | ✅ |
| UAT-R6 | Designer | insert `content_ideas` | ditolak | 403 | ✅ |
| UAT-R7 | anon | insert `leads` | ditolak | 401 | ✅ |
| UAT-R8 | PM | select `projects` | melihat `PRJ-010` | 200 | ✅ |
| UAT-R9 | Sales | select `projects` | kosong `[]` | 200 | ✅ |

## 10. Non-fungsional & deploy

| ID | Cek | Hasil diharapkan | Status |
|----|-----|------------------|--------|
| UAT-N1 | `GET /api/health` (tanpa login) | JSON 200 `status:ok`, `db:ok` | |
| UAT-N2 | `next build` | Build bersih, 36 halaman | ✅ (tercatat) |
| UAT-N3 | `npm test` / vitest | 265/265 | ✅ (tercatat) |
| UAT-N4 | Lint + type-check | Bersih | ✅ (tercatat) |

> **Catatan UAT-N1:** saat environment tester memblokir akses ke `supabase.co`, endpoint sah mengembalikan `503 degraded` (bukan kegagalan kode).

## 11. Kriteria terima & sign-off

Seluruh kasus wajib `✅`. Kegagalan dicatat dengan deskripsi + skenario repro.

| Nama | Role | Tanda tangan | Tanggal |
|------|------|--------------|---------|
|  | Pemilik proyek |  |  |
|  |  |  |  |