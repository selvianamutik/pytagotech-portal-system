# PROGRESS.md — Status User Story & Functional Requirement

> **Update terakhir:** 2026-10-04  
> **Fase saat ini:** Fase 1 — Frontend (US-001, US-002, US-006 DONE; US-003–US-005 bertipe Backend, dikerjakan di Fase 2; berikutnya EPIC B / US-007)
> **Status legend:** `TODO` · `IN_PROGRESS` · `BLOCKED` · `DONE`

---

## EPIC A: Fondasi Platform (Fase 1)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-001 | Setup proyek & desain sistem | Frontend | DONE | 6/6 ✅ | 2b04163 |
| US-002 | Autentikasi & manajemen user | Frontend | DONE | 6/6 ✅ | 9c1834f |
| US-003 | Row Level Security per role | Backend | TODO | 0/4 | - |
| US-004 | Audit trail | Backend | TODO | 0/5 | - |
| US-005 | Pengaturan master data & dropdown | Backend | TODO | 0/5 | - |
| US-006 | Komentar, lampiran, dan notifikasi | Frontend | DONE | 5/5 ✅ | 52af09f |

---

## EPIC B: CRM Marketing (Fase 2)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-007 | Database Lead | Frontend | TODO | 0/6 | - |
| US-008 | Pencarian, filter, dan pewarnaan status | Frontend | TODO | 0/5 | - |
| US-009 | Penugasan PIC & bulk action | Frontend | TODO | 0/4 | - |
| US-010 | Import lead dari CSV | Frontend | TODO | 0/5 | - |
| US-011 | Pipeline Interested Leads | Frontend | TODO | 0/5 | - |
| US-012 | Activity log per lead | Frontend | TODO | 0/4 | - |
| US-013 | Dashboard CRM | Frontend | TODO | 0/5 | - |

---

## EPIC C: Klien & Deal Handover (Fase 3)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-014 | Master Klien | Frontend | TODO | 0/5 | - |
| US-015 | Form Deal Handover | Frontend | TODO | 0/6 | - |
| US-016 | Termin pembayaran | Frontend | TODO | 0/5 | - |
| US-017 | Konfirmasi Produksi atas handover | Frontend | TODO | 0/5 | - |
| US-018 | Change request & catatan khusus | Frontend | TODO | 0/4 | - |

---

## EPIC D: Manajemen Proyek & Produksi (Fase 3 & 4)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-019 | Pembuatan proyek dari handover | Frontend | TODO | 0/5 | - |
| US-020 | Daftar proyek | Frontend | TODO | 0/4 | - |
| US-021 | Template task otomatis | Frontend | TODO | 0/4 | - |
| US-022 | Task board (Kanban dan List) | Frontend | TODO | 0/6 | - |
| US-023 | Backlog fitur | Frontend | TODO | 0/4 | - |
| US-024 | Penjadwalan fitur otomatis | Frontend | TODO | 0/5 | - |
| US-025 | Gantt chart interaktif | Frontend | TODO | 0/5 | - |
| US-026 | Dashboard eksekutif produksi | Frontend | TODO | 0/5 | - |

---

## EPIC E: Sosmed: Perencanaan & Produksi Konten (Fase 4)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-027 | Content Planner | Frontend | TODO | 0/5 | - |
| US-028 | Database Produksi Konten | Frontend | TODO | 0/4 | - |
| US-029 | Quality gate pra-rilis | Frontend | TODO | 0/3 | - |
| US-030 | Alur approval & riwayat revisi | Frontend | TODO | 0/5 | - |
| US-031 | Distribusi multiplatform (Parent-Child) | Frontend | TODO | 0/4 | - |
| US-032 | Kalender publikasi | Frontend | TODO | 0/5 | - |
| US-033 | Pelacakan rilis & post live | Frontend | TODO | 0/3 | - |
| US-034 | Asset & Content Library | Frontend | TODO | 0/4 | - |

---

## EPIC F: Sosmed: Analytics, Komunitas & Evaluasi (Fase 5)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-035 | Analytics performa posting | Frontend | TODO | 0/5 | - |
| US-036 | Pertumbuhan akun | Frontend | TODO | 0/4 | - |
| US-037 | Community management & SLA response time | Frontend | TODO | 0/4 | - |
| US-038 | Inquiry tracking & handover WhatsApp | Frontend | TODO | 0/5 | - |
| US-039 | Dashboard eksekutif Sosmed (KPI Scorecard) | Frontend | TODO | 0/4 | - |
| US-040 | Evaluasi strategi KIST | Frontend | TODO | 0/4 | - |

---

## EPIC G: Tata Kelola, Integrasi & Penutup (Fase 5)

| ID | Judul | Fase | Status | AC Terpenuhi | Commit/Tag |
|----|-------|------|--------|--------------|------------|
| US-041 | Pengaturan KPI, SLA, dan routing | Backend | TODO | 0/3 | - |
| US-042 | SOP, panduan, dan matriks RACI | Frontend | TODO | 0/3 | - |
| US-043 | Arsip data & backup | Backend | TODO | 0/4 | - |
| US-044 | Pencarian global & beranda per role | Frontend | TODO | 0/4 | - |

---

## Functional Requirements

| ID | Deskripsi | Status |
|----|-----------|--------|
| FR-1 | Auth email/password + RLS | TODO |
| FR-2 | Audit trail (siapa/kapan/apa/nilai lama/baru) | TODO |
| FR-3 | Dropdown dari master data terpusat | TODO |
| FR-4 | Komentar, lampiran, notifikasi reusable | TODO |
| FR-5 | Semua kalkulasi metrik di sistem, rumus terdokumentasi | TODO |
| FR-6 | Lead dengan field kontak, industri, PIC, status 7 tahap | TODO |
| FR-7 | Deteksi lead duplikat | TODO |
| FR-8 | Lead Interest → pipeline Interested Leads otomatis | TODO |
| FR-9 | Lead Closing → klien + deal handover tanpa input ulang | TODO |
| FR-10 | Dashboard CRM agregat + per PIC + filter periode | TODO |
| FR-11 | Format nama proyek otomatis + kode unik | TODO |
| FR-12 | Validasi total termin = nilai deal | TODO |
| FR-13 | Alur status handover Draft→Menunggu→Dikonfirmasi/Perlu Revisi | TODO |
| FR-14 | Change request dengan riwayat versi setelah konfirmasi | TODO |
| FR-15 | Proyek mewarisi data handover | TODO |
| FR-16 | Generate task dari template saat proyek dibuat | TODO |
| FR-17 | Task: Kanban, List, sub-task, komentar, lampiran, progress otomatis | TODO |
| FR-18 | Jadwal fitur otomatis + deteksi bentrok | TODO |
| FR-19 | Gantt: drag-drop, zoom, dependensi finish-to-start | TODO |
| FR-20 | Dashboard produksi: filter + ekspor PDF/Excel | TODO |
| FR-21 | Skor kelengkapan brief + validasi status | TODO |
| FR-22 | Materi tidak bisa jadwal sebelum quality gate + Disetujui | TODO |
| FR-23 | Relasi MAT → banyak PUB (Single/Crosspost) | TODO |
| FR-24 | Kalender publikasi dari data distribusi + filter | TODO |
| FR-25 | Metrik snapshot Monitoring/KPI Final; deduplikasi Final | TODO |
| FR-26 | Hitung response time komunitas + SLA routing WA | TODO |
| FR-27 | Aset kedaluwarsa tidak bisa ditautkan; peringatan 30 hari | TODO |
| FR-28 | Inquiry → lead CRM dengan sumber tercatat | TODO |
| FR-29 | Evaluasi strategi KIST + hipotesis untuk Test | TODO |
| FR-30 | Target KPI, SLA, jam layanan, nomor WA, kalender libur dari Pengaturan | TODO |
| FR-31 | Arsip, ekspor CSV, pencarian global dengan hak akses | TODO |

---

## Gates

| Gate | Deskripsi | Status |
|------|-----------|--------|
| Gate 0 | Fase 0 selesai: proyek jalan kosong, lint/typecheck lolos | DONE |
| Gate 1 | Frontend selesai: semua UI dengan mock, kontrak API draft | TODO |
| Gate 2 | Backend selesai: semua US & FR DONE, mock diganti API | TODO |
| Gate 3 | Deploy Ready: build produksi bersih, dokumentasi lengkap | TODO |

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
