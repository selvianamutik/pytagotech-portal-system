# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
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
