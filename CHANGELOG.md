# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Dialog aktivitas lead: ubah status langsung (6 status lain, tercatat di timeline)
- Draf skema database Fase 2 (`docs/DATABASE.md`, Status DRAFT): 37 tabel + ERD + relasi + index, menunggu persetujuan
- Revisi skema dari review: `team_members`, FK master_options, `lead_status_history`, DDL draf `database/schema.sql`
- Revisi ronde 2: RLS deny-all, CHECK murah, padding 4 digit, trgm/GIN, FK komposit, audit jsonb
- Seed demo: 2 handover Dikonfirmasi + 2 proyek + termin seimbang agar `/proyek` terisi
- Gabung Daftar Proyek + Dashboard Produksi menjadi satu halaman `/proyek` (filter dashboard dihapus)
- Kalender proyek per proyek + master data developer (internal/external) + dropdown assignee
- Kalender Kerja universal (`/kalender`): tracking semua task + fitur lintas proyek
- Seed 4 task + 3 fitur berjadwal agar kalender/Gantt/board demo terisi
- Task Board kembali ke halaman asal (`?from=`) bila datang dari kalender
- Semua halaman detail kembali ke halaman asal (`?from=` tervalidasi)
- PIC pelaksana tampil di sel kalender kerja
- Kartu Ubah proyek fixed di bawah layar saat mode edit
- Card konfirmasi handover menampilkan keterangan revisi & riwayat
- Task Board global lintas proyek (`/proyek/board`)
- Card konfirmasi handover fixed bila belum ACC (PM/Admin); card proyek disembunyi untuk non-PM
- Perbaiki guard role yang macet di "Memeriksa akses" (guard kini memicu muat sesi)
- Perbaiki warning Base UI: `nativeButton={false}` pada tombol bermuatan link/label

### Changed
- Layout portal (sidebar + header + menu aktif) menjadi global via grup route `(portal)`; URL tidak berubah; `/login` dan `/403` tetap tanpa shell
- Penyesuaian alur kerja: `Frontend → Skema Database → Backend → Deploy Ready` (Gate 2–4, tag database/backend); scaffold `docs/DATABASE.md` (DRAFT) + `database/schema.sql`

## [0.1.0] - 2026-10-05

### Added
- Fase 1 Frontend selesai (Gate 1): 39 User Story dengan data mock + kontrak API draft (lihat riwayat di bawah; tag `v0.1.0-frontend`)
- US-001: fondasi frontend — layout dashboard (sidebar per modul + header user menu), tema light/dark, komponen shadcn/ui dasar (Button, Input, Select, Table, Dialog, Tabs, Badge, Toast), Supabase client (browser/server), kontrak data `DashboardSnapshot` via lapisan `services/` + mock terpisah
- docs/API.md: draft kontrak `getDashboardSnapshot` (US-001)
- US-002: autentikasi & manajemen user (mock) — halaman `/login` (masuk/keluar/reset), `/pengaturan/pengguna` (CRUD user, multi-role, nonaktifkan, khusus Super Admin), halaman `/403` + guard `RequireRole`, state sesi Zustand
- docs/API.md: draft kontrak auth & manajemen user; docs/DECISIONS.md: DEC-007 (mock-first auth)
- US-006: kolaborasi reusable (mock) — komentar + @mention → notifikasi, lampiran + batas ukuran, bell + halaman `/notifikasi`, galeri `/demo/kolaborasi`
- docs/API.md: draft kontrak komentar/lampiran/notifikasi; docs/DECISIONS.md: DEC-008 (mention + demo)
- US-007: database lead (mock) — form + tabel 7 status, validasi WA/email, peringatan duplikat, halaman `/crm/leads`
- docs/API.md: draft kontrak CRM leads
- US-008: pencarian, filter multi-kriteria, sort per kolom, paginasi di database lead
- US-009: assign/reassign PIC satuan & massal dengan pencatatan audit trail
- US-010: impor lead dari CSV (template, preview, lewati duplikat)
- US-011: pipeline Interested Leads (Kanban drag-and-drop + tabel, tahap + kebutuhan)
- US-012: activity log per lead (timeline catatan + perubahan, follow-up + badge Overdue)
- US-013: dashboard CRM (KPI otomatis + rumus, kinerja per PIC, filter periode)
- US-014: master klien (otomatis dari lead Closing, halaman `/klien`)
- US-015: form deal handover (nama otomatis, kode unik, panel panduan, halaman `/handover`)
- US-016: termin pembayaran (banyak termin %/nominal, total wajib = deal, halaman detail)
- US-017: alur konfirmasi handover (putusan PM, komentar revisi, notifikasi + audit)
- US-018: change request + riwayat versi nilai/deadline di detail handover
- US-019: proyek dari handover Dikonfirmasi (relasi dua arah, halaman detail)
- US-020: daftar proyek (filter, progress otomatis, gerbang PM/Admin)
- US-021: template task + generate otomatis (seed menunggu Q-005)
- US-022: task board Kanban + List (sub-task, rollup %, komentar/lampiran)
- US-023: backlog fitur (impor handover otomatis, ubah jadi task)
- US-024: penjadwalan fitur otomatis (hari kerja, kapasitas, bentrok, override)
- US-025: Gantt interaktif (zoom, drag tersimpan, dependensi FS + kaskade)
- US-026: dashboard produksi (KPI, deadline watch, filter, ekspor Excel + PDF)
- US-027: content planner (skor brief otomatis, ambang 5/5)
- US-028: database materi (ID otomatis, dari ide Disetujui)
- US-029: quality gate pra-rilis (checklist, gerbang jadwal/rilis, override Admin)
- US-030: approval & revisi materi (Rev, 3 keputusan, feedback wajib saat Ditolak)
- US-031: distribusi Parent-Child (Single/Crosspost + rekonsiliasi)
- US-032: kalender publikasi (filter, drag, Overdue/Kritis + ambang konfigurabel)
- US-033: pelacakan rilis (tanggal aktual + link live, kunci jadwal-ulang)
- US-034: asset library (lisensi + 30 hari + tolak kedaluwarsa ditautkan)
- US-035: analytics posting (ER otomatis, snapshot Final + kunci)
- US-036: pertumbuhan akun (Net Growth + grafik tren)
- US-037: community + SLA response time 30 menit
- US-038: inquiry tracking (routing 15 mnt + Jadikan Lead CRM)
- US-039: KPI scorecard sosmed (6 KPI + target interim + verifikasi)
- US-040: evaluasi strategi KIST (hipotesis wajib untuk Test)
- US-042: SOP/panduan markdown + matriks RACI
- US-044: pencarian global Ctrl+K + Tugas saya per role di beranda

### Chore
- Fase 0: inisialisasi repo, branch `main` + `develop`, struktur folder, `.env.example`, docs awal

---

<!-- Template untuk rilis berikutnya:

## [0.1.0] - YYYY-MM-DD
### Added
- ...
### Changed
- ...
### Fixed
- ...

-->
