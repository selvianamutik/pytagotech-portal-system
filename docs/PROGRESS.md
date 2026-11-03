# PROGRESS.md — Status User Story & Functional Requirement

> **Update terakhir:** 2026-11-03
> **Fase saat ini:** Fase 3 — Backend **Gate 3 DONE**. Q-005 (template RAD/PUS/SAD) & Q-013 (divisi = tim/role) ANSWERED 2026-11-03. Wave 1 (FR-15, `88efe62`), Wave 2 (FR-16..20, `4672501`), Wave 3 (FR-21..24, `e2ad591`), Wave 4 (FR-25..29, `067bf29`), dan Wave 5 (FR-31, `45d10d8`) DB-backed dan di-commit; FR-5..FR-31 `DONE`. Verifikasi hijau: test **265/265**, `tsc --noEmit`, `eslint .`, dan `next build` (36 halaman statis) semua lulus. Tidak ada service mock tersisa untuk alur PRD DB-backed. **Catatan residual (diluar penutupan):** verifikasi browser per-US dan RLS tulis live belum tuntas rerun — environment terbatas (Supabase free intermitten `404`, Docker/CLI tidak tersedia untuk `db reset`); dicatat sebagai follow-up Gate 4, analog penanganan Q-014.
> **Status legend:** `TODO` · `IN_PROGRESS` · `BLOCKED` · `DONE`

---

## EPIC A: Fondasi Platform (Fase 1)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-001 | Setup proyek & desain sistem | Frontend | DONE | 6/6 ✅ | 2b04163 |
| US-002 | Autentikasi & manajemen user | Frontend | DONE | 6/6 ✅ | 9c1834f |
| US-003 | Row Level Security per role | Backend | DONE | 4/4 ✅ | 000e34f, d2e34c9 (verifikasi live + CR-003) |
| US-004 | Audit trail | Backend | DONE | 5/5 ✅ | 19c6a6c |
| US-005 | Pengaturan master data & dropdown | Backend | DONE | 5/5 ✅ | 3f85213, 9bfd0af (live REST + browser) |
| US-006 | Komentar, lampiran, dan notifikasi | Frontend | DONE | 5/5 ✅ | 52af09f, FR-4 DB-backed (commit ini) |

---

## EPIC B: CRM Marketing (Fase 2)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-007 | Database Lead | Frontend | DONE | 6/6 ✅ | 98c62e1 |
| US-008 | Pencarian, filter, dan pewarnaan status | Frontend | DONE | 5/5 ✅ | cbb3c07 |
| US-009 | Penugasan PIC & bulk action | Frontend | DONE | 4/4 ✅ | ecac4e0 |
| US-010 | Import lead dari CSV | Frontend | DONE | 5/5 ✅ | 046168d |
| US-011 | Pipeline Interested Leads | Frontend | DONE | 5/5 ✅ | 069d400 |
| US-012 | Activity log per lead | Frontend | DONE | 4/4 ✅ | da59d42 |
| US-013 | Dashboard CRM | Frontend | DONE | 5/5 ✅ | b0bcd8b |

---

## EPIC C: Klien & Deal Handover (Fase 3)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-014 | Master Klien | Frontend | DONE | 5/5 ✅ | 21cf55d |
| US-015 | Form Deal Handover | Frontend | DONE | 6/6 ✅ | 753e989 |
| US-016 | Termin pembayaran | Frontend | DONE | 5/5 ✅ | 91a9fb0 |
| US-017 | Konfirmasi Produksi atas handover | Frontend | DONE | 5/5 ✅ | d1455b3 |
| US-018 | Change request & catatan khusus | Frontend | DONE | 4/4 ✅ | a06d4fb |

---

## EPIC D: Manajemen Proyek & Produksi (Fase 3 & 4)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-019 | Pembuatan proyek dari handover | Frontend | DONE | 5/5 ✅ | 3a81d7e |
| US-020 | Daftar proyek | Frontend | DONE | 4/4 ✅ | 7f2d81f |
| US-021 | Template task otomatis | Frontend | DONE | 4/4 ✅ | 1aba6f4 |
| US-022 | Task board (Kanban dan List) | Frontend | DONE | 6/6 ✅ | 965b175 |
| US-023 | Backlog fitur | Frontend | DONE | 4/4 ✅ | 0e761ff |
| US-024 | Penjadwalan fitur otomatis | Frontend | DONE | 5/5 ✅ | 29e7f2c |
| US-025 | Gantt chart interaktif | Frontend | DONE | 5/5 ✅ | 3fd89a1 |
| US-026 | Dashboard eksekutif produksi | Frontend | DONE | 5/5 ✅ | e1eac90 |

---

## EPIC E: Sosmed: Perencanaan & Produksi Konten (Fase 4)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-027 | Content Planner | Frontend | DONE | 5/5 ✅ | dee11fe |
| US-028 | Database Produksi Konten | Frontend | DONE | 4/4 ✅ | 081b5da |
| US-029 | Quality gate pra-rilis | Frontend | DONE | 3/3 ✅ | 10b1121 |
| US-030 | Alur approval & riwayat revisi | Frontend | DONE | 5/5 ✅ | 14445e0 |
| US-031 | Distribusi multiplatform (Parent-Child) | Frontend | DONE | 4/4 ✅ | a01fc8a |
| US-032 | Kalender publikasi | Frontend | DONE | 5/5 ✅ | 105bfa3 |
| US-033 | Pelacakan rilis & post live | Frontend | DONE | 3/3 ✅ | 2e2e0aa |
| US-034 | Asset & Content Library | Frontend | DONE | 4/4 ✅ | 8615370 |

---

## EPIC F: Sosmed: Analytics, Komunitas & Evaluasi (Fase 5)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-035 | Analytics performa posting | Frontend | DONE | 5/5 ✅ | 57f1440 |
| US-036 | Pertumbuhan akun | Frontend | DONE | 4/4 ✅ | 31c6dc8 |
| US-037 | Community management & SLA response time | Frontend | DONE | 4/4 ✅ | 72b17c7 |
| US-038 | Inquiry tracking & handover WhatsApp | Frontend | DONE | 5/5 ✅ | 8c84adb |
| US-039 | Dashboard eksekutif Sosmed (KPI Scorecard) | Frontend | DONE | 4/4 ✅ | 2c9b118 |
| US-040 | Evaluasi strategi KIST | Frontend | DONE | 4/4 ✅ | b554c2d |

---

## EPIC G: Tata Kelola, Integrasi & Penutup (Fase 5)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-041 | Pengaturan KPI, SLA, dan routing | Backend | DONE | 3/3 ✅ | 4163c88 |
| US-042 | SOP, panduan, dan matriks RACI | Backend | DONE | 3/3 ✅ | 34604b3 |
| US-043 | Arsip data & backup | Backend | DONE | 4/4 ✅ | 45d84bc |
| US-044 | Pencarian global & beranda per role | Frontend | DONE | 4/4 ✅ | ac3b400 |

---

## Functional Requirements

| ID | Deskripsi | Status |
|----|-----------|--------|
| FR-1 | Auth email/password + RLS | DONE |
| FR-2 | Audit trail (siapa/kapan/apa/nilai lama/baru) | DONE |
| FR-3 | Dropdown dari master data terpusat | DONE |
| FR-4 | Komentar, lampiran, notifikasi reusable | DONE |
| FR-5 | Semua kalkulasi metrik di sistem, rumus terdokumentasi | DONE |
| FR-6 | Lead dengan field kontak, industri, PIC, status 7 tahap | DONE |
| FR-7 | Deteksi lead duplikat | DONE |
| FR-8 | Lead Interest → pipeline Interested Leads otomatis | DONE |
| FR-9 | Lead Closing → klien + deal handover tanpa input ulang | DONE |
| FR-10 | Dashboard CRM agregat + per PIC + filter periode | DONE |
| FR-11 | Format nama proyek otomatis + kode unik | DONE |
| FR-12 | Validasi total termin = nilai deal | DONE |
| FR-13 | Alur status handover Draft→Menunggu→Dikonfirmasi/Perlu Revisi | DONE |
| FR-14 | Change request dengan riwayat versi setelah konfirmasi | DONE |
| FR-15 | Proyek mewarisi data handover | DONE |
| FR-16 | Generate task dari template saat proyek dibuat | DONE |
| FR-17 | Task: Kanban, List, sub-task, komentar, lampiran, progress otomatis | DONE |
| FR-18 | Jadwal fitur otomatis + deteksi bentrok | DONE |
| FR-19 | Gantt: drag-drop, zoom, dependensi finish-to-start | DONE |
| FR-20 | Dashboard produksi: filter + ekspor PDF/Excel | DONE |
| FR-21 | Skor kelengkapan brief + validasi status | DONE |
| FR-22 | Materi tidak bisa jadwal sebelum quality gate + Disetujui | DONE |
| FR-23 | Relasi MAT → banyak PUB (Single/Crosspost) | DONE |
| FR-24 | Kalender publikasi dari data distribusi + filter | DONE |
| FR-25 | Metrik snapshot Monitoring/KPI Final; deduplikasi Final | DONE |
| FR-26 | Hitung response time komunitas + SLA routing WA | DONE |
| FR-27 | Aset kedaluwarsa tidak bisa ditautkan; peringatan 30 hari | DONE |
| FR-28 | Inquiry → lead CRM dengan sumber tercatat | DONE |
| FR-29 | Evaluasi strategi KIST + hipotesis untuk Test | DONE |
| FR-30 | Target KPI, SLA, jam layanan, nomor WA, kalender libur dari Pengaturan | DONE |
| FR-31 | Arsip, ekspor CSV, pencarian global dengan hak akses | DONE |

---

## Gates

| Gate | Deskripsi | Status |
|------|-----------|--------|
| Gate 0 | Fase 0 selesai: proyek jalan kosong, lint/typecheck lolos | DONE |
| Gate 1 | Frontend selesai: semua UI dengan mock, kontrak API draft | DONE |
| Gate 2 | Skema Database selesai & disetujui (`DATABASE.md` + tag `v0.2.0-database`) | DONE |
| Gate 3 | Backend selesai: semua US & FR DONE, mock diganti API | DONE |
| Gate 4 | Deploy Ready: build produksi bersih, dokumentasi lengkap | TODO |

---

## Non-Goals (Larangan Scope)

- ❌ Migrasi data dari spreadsheet lama
- ❌ Portal klien eksternal
- ❌ Modul invoicing/akuntansi penuh
- ❌ Integrasi API otomatis Instagram/TikTok/Meta
- ❌ Integrasi WhatsApp Business API
- ❌ Aplikasi mobile native
- ❌ Penyimpanan file master besar (PSD/MP4) di sistem
- ❌ Fitur penagihan/pembayaran online, HRIS, payroll
