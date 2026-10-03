# WORKLOG.md — Log Kerja Kronologis

> File ini bersifat **append-only**. Jangan menghapus atau menulis ulang entri lama.

---

## 2026-10-04 04:00 — Fase 0 — Inisialisasi Proyek

- **Fase:** 0 (Setup & Perencanaan)
- **Branch:** main
- **Commit:** (initial commit — belum di-commit)
- **Yang dilakukan:**
  - Membaca AGENT_RULES.md dan PRD lengkap
  - Inisialisasi git repository (`git init`)
  - Membuat branch `main`
  - Membuat struktur folder: `tasks/`, `docs/`, `frontend/`
  - Menyalin PRD ke `tasks/prd-pytagotech-integrated-portal.md`
  - Membuat file: `.gitignore`, `README.md`, `CHANGELOG.md`, `.env.example`
  - Membuat semua file dokumentasi: `docs/PROGRESS.md`, `docs/WORKLOG.md`, `docs/DECISIONS.md`, `docs/QUESTIONS.md`, `docs/API.md`, `docs/DEPLOYMENT.md`, `docs/CHANGE_REQUESTS.md`
  - Mengisi `docs/PROGRESS.md` dengan semua 44 US dan 31 FR berstatus `TODO`
  - Mencatat semua keputusan teknis di `docs/DECISIONS.md`
  - Mencatat semua Open Questions PRD di `docs/QUESTIONS.md`
  - Membuat initial commit dan branch `develop`
- **File berubah:** Semua file baru (inisialisasi)
- **Verifikasi:** struktur folder sesuai AGENT_RULES.md ✅
- **Catatan/Masalah:** Belum ada Next.js project — akan dijalankan di US-001
- **Langkah berikutnya:** Fase 1 dimulai dengan US-001 (Setup proyek & desain sistem) — scaffold Next.js, Tailwind, shadcn/ui

---

## 2026-10-04 05:00 — Fase 0 — Gate 0 DONE (initial commit)

- **Fase:** 0 (Setup & Perencanaan)
- **Branch:** main (+ develop dibuat)
- **Commit:** 0cb0d80 — chore(repo): inisialisasi proyek Fase 0
- **Yang dilakukan:**
  - Rename branch `master` → `main`, buat branch `develop`
  - Hapus duplikat PRD di root (kanonis: `tasks/prd-pytagotech-integrated-portal.md`)
  - Initial commit: 55 file (Next.js scaffold, shadcn/ui, Supabase client, docs, `.env.example`)
- **File berubah:** semua file awal (lihat commit 0cb0d80)
- **Verifikasi:** `git log` ✅ branch main/develop ✅ `.next/` & `node_modules/` ter-ignore ✅
- **Catatan/Masalah:** shim `pnpm.ps1`/`pnpm.cmd` bermasalah di PowerShell — gunakan binary langsung (`node_modules/.bin/<tool>.cmd`)
- **Langkah berikutnya:** US-001

---

## 2026-10-04 05:15 — US-001 — Setup proyek & desain sistem (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-001-setup-fondasi
- **Commit:** 2b04163 — docs(frontend): kontrak dashboard US-001 + PROGRESS/CHANGELOG
- **Yang dilakukan:**
  - Verifikasi implementasi US-001 yang sudah ada: layout dashboard (sidebar per modul + header user menu + pencarian global), ThemeToggle light/dark, komponen shadcn/ui (Button, Input, Select, Table, Dialog, Tabs, Badge, Toast), Supabase client browser/server, lapisan `services/dashboard.ts` + mock terpisah + `types/dashboard.ts`
  - Dokumentasikan kontrak `getDashboardSnapshot` / `DashboardSnapshot` di `docs/API.md` (draft acuan backend)
  - Update `docs/PROGRESS.md` (US-001 DONE 6/6, Gate 0 DONE), `CHANGELOG.md`
- **File berubah:** docs/API.md, docs/PROGRESS.md, CHANGELOG.md
- **Verifikasi:** lint ✅ (eslint exit 0) · typecheck ✅ (`tsc --noEmit` exit 0) · test ✅ (vitest 1/1 passed) · build ✅ (`next build` sukses, route `/` static) · browser ✅ (`next start` → GET / 200, mengandung "Pytagotech Portal") · tanpa `console.log`/`TODO` ✅
- **Acceptance Criteria:** 6/6 — Next.js+Supabase ✅ shadcn/ui ✅ layout dashboard ✅ light/dark ✅ lint/typecheck ✅ browser ✅
- **Catatan/Masalah:** -
- **Langkah berikutnya:** US-002 (Autentikasi & manajemen user)

---

## 2026-10-04 06:00 — US-002 — Autentikasi & manajemen user (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-002-auth-manajemen-user
- **Commit:** 9c1834f — feat(frontend): autentikasi dan manajemen user dengan mock US-002
- **Yang dilakukan:**
  - Kontrak `types/auth.ts`: 7 role kanonis PRD Bagian 3, `PortalUser` multi-role, `AuthSession`, `hasRole`
  - Mock `mocks/auth.ts` (5 user, 1 nonaktif); selaraskan label role di `mocks/dashboard.ts` + tambah nav "Pengguna"
  - `services/auth.ts`: login/logout/reset/list/create/update-roles/set-active + proteksi (akun sendiri, Super Admin terakhir); `services/result.ts` sebagai tipe hasil bersama
  - `store/auth.ts` (Zustand): status loading/authenticated/unauthenticated, signIn/signOut/initialize
  - Komponen `auth/require-role.tsx` (guard → konten 403, bukan data kosong), `auth/login-form.tsx`, `auth/user-management.tsx`
  - Halaman `/login`, `/403`, `/pengaturan/pengguna` (khusus Super Admin)
  - Test: `services/auth.test.ts`, `store/auth.test.ts`, `require-role.test.tsx`
- **File berubah:** 16 file (lihat commit 9c1834f)
- **Verifikasi:** lint ✅ (exit 0, setelah perbaiki `set-state-in-effect` di user-management) · typecheck ✅ · test ✅ (22/22, 4 file) · build ✅ (route `/login`, `/403`, `/pengaturan/pengguna` static) · browser ✅ (`next start` → semua route 200; `/403` memuat konten 403; `/login` & `/pengaturan/pengguna` me-render state loading guard) · tanpa `console.log`/`TODO` ✅
- **Acceptance Criteria:** 6/6 — login/logout/reset ✅ CRUD user + multi-role ✅ halaman 403 ✅ lint/typecheck ✅ browser ✅
- **Catatan/Masalah:** proteksi route Fase 1 hanya client-side; middleware + RLS server-side dicatat di DEC-007 dan dikerjakan di US-003 (Fase 2). FR-1 tetap TODO sampai RLS selesai.
- **Langkah berikutnya:** US-006 (Komentar, lampiran, notifikasi)

---

## 2026-10-04 06:45 — US-006 — Komentar, lampiran, notifikasi (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-006-kolaborasi
- **Commit:** 52af09f — feat(frontend): komentar, lampiran, dan notifikasi reusable US-006
- **Yang dilakukan:**
  - Kontrak `types/collaboration.ts`: `CollaborableEntityType` (lead/task/fitur/konten), Comment/Attachment/Notification
  - Mock + `services/collaboration.ts`: komentar per entitas, mention `@Nama` → notifikasi otomatis, upload validasi batas env, hapus lampiran, notifikasi (daftar/tandai dibaca)
  - `store/notifications.ts` (Zustand) untuk badge bell
  - Komponen: `CommentSection`, `AttachmentList`, `NotificationBell` (pasang di header dashboard), `NotificationCenter`
  - Halaman `/notifikasi` + galeri verifikasi `/demo/kolaborasi` (komponen sama di 4 tipe entitas)
- **File berubah:** 15 file (lihat commit 52af09f)
- **Verifikasi:** lint ✅ (exit 0, setelah perbaiki `set-state-in-effect` ×2) · typecheck ✅ · test ✅ (39/39, 7 file; perbaiki matcher textContent untuk @-mention yang ter-split span) · build ✅ (route `/notifikasi`, `/demo/kolaborasi` static) · browser ✅ (`next start` → demo/notifikasi/beranda 200; konten 4 host + link bell terkonfirmasi) · tanpa `console.log`/`TODO` ✅
- **Acceptance Criteria:** 5/5 — komentar reusable + mention ✅ lampiran + batas ukuran ✅ notifikasi in-app ✅ lint/typecheck ✅ browser ✅
- **Catatan/Masalah:** `/demo/kolaborasi` scaffolding Fase 1 (dicatat DEC-008); mention Fase 2 diganti user picker. FR-4 tetap TODO sampai backend (tabel + Storage + Realtime).
- **Langkah berikutnya:** EPIC B / US-007 (Database Lead)

---

## 2026-10-04 07:30 — US-007 — Database Lead (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-007-database-lead
- **Commit:** 98c62e1 — feat(frontend): database lead CRM dengan validasi dan duplikat US-007
- **Yang dilakukan:**
  - Kontrak `types/lead.ts`: 7 status, 10 kategori industri (lokal; digantikan master data US-005), `Lead` + input
  - `lib/validators.ts` bersama (email, normalisasi + validasi WA Indonesia); service auth dialihkan ke validator ini
  - Mock 8 lead (semua status + contoh duplikat WA); tambah user mock Fira & Figo (PIC sesuai contoh PRD)
  - `services/leads.ts`: list/get/create/update + `findDuplicates` (WA ternormalisasi atau nama perusahaan, non-blokir) + `listLeadPICs`
  - Komponen `crm/`: `LeadTable` (badge warna per status), `LeadForm` (tambah/ubah + error service), `LeadsManager` (loading/empty/error + banner peringatan)
  - Halaman `/crm/leads`; nav dashboard "Database Lead" → route nyata
- **File berubah:** 14 file (lihat commit 98c62e1)
- **Verifikasi:** lint ✅ · typecheck ✅ (setelah perbaiki tipe state status) · test ✅ (52/52, 9 file; tambah Fira/Figo ke mock agar PIC valid) · build ✅ (route `/crm/leads` static) · browser ✅ (`next start` → `/crm/leads` 200 + judul; nav beranda menaut ke `/crm/leads`) · tanpa `console.log`/`TODO` ✅
- **Acceptance Criteria:** 6/6 — form+tabel lengkap ✅ 7 status ✅ validasi WA/email ✅ peringatan duplikat ✅ lint/typecheck ✅ browser ✅
- **Catatan/Masalah:** FR-6/FR-7 tetap TODO sampai backend (tabel + trigger + unique index).
- **Langkah berikutnya:** US-008 (Pencarian, filter, pewarnaan status)

---

## 2026-10-04 08:00 — US-008 — Pencarian, filter, pewarnaan status (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-008-lead-filter
- **Commit:** cbb3c07 — feat(frontend): filter, sort, paginasi lead US-008
- **Yang dilakukan:**
  - `queryLeads` di `services/leads.ts`: pencarian teks + filter status/PIC/industri/rentang tanggal + sort 4 kolom + paginasi
  - Komponen `crm/lead-filters.tsx`; header tabel bisa diklik untuk sort; kontrol paginasi (5/halaman)
  - Badge status berwarna konsisten sudah ada sejak US-007 (7 warna di `LeadTable`)
- **File berubah:** services/leads.ts, services/lead-query.test.ts, components/crm/lead-filters.tsx, lead-table.tsx, leads-manager.tsx, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (57/57) · browser menyusul di sweep akhir EPIC B
- **Acceptance Criteria:** 5/5 — filter multi-kriteria ✅ badge/baris berwarna ✅ sort + paginasi ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** -
- **Langkah berikutnya:** US-009 (Penugasan PIC & bulk action)

---

## 2026-10-04 08:30 — US-009 — Penugasan PIC & bulk action (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-009-assign-pic
- **Commit:** ecac4e0 — feat(frontend): assign PIC satuan & massal + audit US-009
- **Yang dilakukan:**
  - `types/audit.ts` + `mocks/audit.ts` + `services/audit.ts` (append-only, pratinjau US-004)
  - `assignLeadPIC` di `services/leads.ts`: validasi PIC + pencatatan `lead.assign-pic` per perubahan
  - Checkbox seleksi di `LeadTable` + bilah bulk assign di `LeadsManager` (dengan aktor dari sesi)
- **File berubah:** types/audit, mocks/audit, services/audit, services/leads, lead-assign.test, lead-table, leads-manager, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (61/61) · browser menyusul di sweep akhir EPIC B
- **Acceptance Criteria:** 4/4 — assign satuan+massal ✅ audit PIC ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** halaman Audit Log penuh tetap di US-004 (Fase 2).
- **Langkah berikutnya:** US-010 (Import lead dari CSV)

---

## 2026-10-04 09:00 — US-010 — Import lead dari CSV (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-010-impor-csv
- **Commit:** 046168d — feat(frontend): impor lead CSV dengan preview US-010
- **Yang dilakukan:**
  - Ekspor `validateLeadInput` dari `services/leads.ts` agar impor memakai aturan identik
  - `services/lead-import.ts`: parser CSV (kutip/koma), `LEAD_CSV_TEMPLATE`, preview (valid/tidak-valid/duplikat vs data + dalam file ternormalisasi), `importLeads` dengan opsi lewati duplikat
  - Komponen `crm/import-leads-dialog.tsx`: unduh template, unggah, preview, konfirmasi; tombol di `LeadsManager`
- **File berubah:** services/leads.ts, services/lead-import.ts(.test), components/crm/import-leads-dialog.tsx, leads-manager.tsx, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (67/67) · browser menyusul di sweep akhir EPIC B
- **Acceptance Criteria:** 5/5 — template ✅ preview ✅ duplikat dilewati ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** -
- **Langkah berikutnya:** US-011 (Pipeline Interested Leads)

---

## 2026-10-04 09:30 — US-011 — Pipeline Interested Leads (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-011-pipeline
- **Commit:** 069d400 — feat(frontend): pipeline Interested Kanban + tabel US-011
- **Yang dilakukan:**
  - Kontrak `types/interest.ts`: 7 tahapan + kebutuhan klien
  - `services/interest.ts`: pipeline otomatis dari lead Interest; pindah tahap (audit `lead.move-stage`) + ubah kebutuhan
  - LEAD-006 (Kopi Nusantara) → Interest agar pipeline berisi 2 kartu demo
  - Komponen `crm/interest-pipeline.tsx`: Kanban drag-and-drop 7 kolom + tampilan tabel + dialog tahap/kebutuhan; halaman `/crm/interested`; nav dashboard
- **File berubah:** types/interest, services/interest(.test), mocks/leads, components/crm/interest-pipeline.tsx, app/crm/interested, mocks/dashboard, services/lead-import (hapus import tak terpakai), docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (71/71) · browser menyusul di sweep akhir EPIC B
- **Acceptance Criteria:** 5/5 — otomatis dari Interest ✅ 7 tahap ✅ Kanban + tabel ✅ kebutuhan ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-8 tetap TODO sampai backend (Closing → klien + handover di US-014).
- **Langkah berikutnya:** US-012 (Activity log per lead)

---

## 2026-10-04 10:00 — US-012 — Activity log per lead (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-012-activity-log
- **Commit:** da59d42 — feat(frontend): activity log dan follow-up lead US-012
- **Yang dilakukan:**
  - `Lead.nextFollowUp` opsional + input di form; validasi tanggal
  - `services/lead-activities.ts`: catatan, timeline gabungan (catatan + audit), `isFollowUpOverdue`
  - `updateLead` mencatat `lead.update-status` bila status berubah; `setNextFollowUp` + audit `lead.followup`
  - `LeadActivityDialog`: timeline, tambah catatan, jadwalkan follow-up; badge Overdue di tabel
- **File berubah:** types/lead, mocks/leads, services/leads, services/lead-activities(.test), components/crm (table, form, manager, activity-dialog), docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (77/77) · browser menyusul di sweep akhir EPIC B
- **Acceptance Criteria:** 4/4 — timeline ✅ follow-up + Overdue ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** -
- **Langkah berikutnya:** US-013 (Dashboard CRM)

---

## 2026-10-04 10:30 — US-013 — Dashboard CRM (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-013-dashboard-crm
- **Commit:** b0bcd8b — feat(frontend): dashboard CRM dengan KPI otomatis US-013
- **Yang dilakukan:**
  - `services/crm-dashboard.ts`: periode harian/bulanan/kustom (WIB), KPI (database, outreach, 5 status, 2 rate), kinerja per PIC
  - Komponen `crm/crm-dashboard.tsx`: kartu KPI + rumus di tooltip/keterangan, tabel PIC, filter periode; halaman `/crm/dashboard`; nav dashboard
- **File berubah:** services/crm-dashboard(.test), components/crm/crm-dashboard.tsx, app/crm/dashboard, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (83/83) · browser menyusul di sweep akhir EPIC B
- **Acceptance Criteria:** 5/5 — KPI ✅ rumus di tooltip ✅ tabel per PIC ✅ filter periode ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** definisi Outreach = tanggal hubungi dalam periode (terdokumentasi di API + tooltip).
- **Langkah berikutnya:** Sweep verifikasi akhir EPIC B (build + browser semua route)

---

## 2026-10-04 11:00 — EPIC B — Sweep verifikasi akhir (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** develop
- **Yang dilakukan:**
  - `next build` bersih: 9 route static (`/`, `/403`, `/crm/dashboard`, `/crm/interested`, `/crm/leads`, `/demo/kolaborasi`, `/login`, `/notifikasi`, `/pengaturan/pengguna`)
  - `next start` + fetch semua route: 200 semua; penanda konten terkonfirmasi (`/login` me-render state loading guard, form muncul setelah hidrasi — sama seperti verifikasi US-002)
  - EPIC B lengkap: US-007–US-013 DONE (US-008–US-013 masing-masing lint ✅ typecheck ✅ test ✅; total 83/83)
- **Verifikasi:** build ✅ browser ✅
- **Catatan/Masalah:** FR-6/FR-7/FR-8/FR-10 tetap TODO sampai backend Fase 2.
- **Langkah berikutnya:** EPIC C / US-014 (Master Klien)
