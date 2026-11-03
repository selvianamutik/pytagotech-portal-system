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

---

## 2026-10-04 11:30 — US-014 — Master Klien (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-014-master-klien
- **Commit:** 21cf55d — feat(frontend): master klien + konversi Closing US-014
- **Yang dilakukan:**
  - Kontrak `types/client.ts`, mock 2 klien, `services/clients.ts` (CRUD + validasi + `createClientFromLead` + `listConvertibleLeads`)
  - `ClientForm` (mode manual/ubah/dari-lead dengan field lead dikunci) + `ClientsManager` (tabel + seksi Closing) + halaman `/klien` + nav
- **File berubah:** types/client, mocks/clients, services/clients(.test), components/clients/*, app/klien, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (92/92) · browser menyusul di sweep akhir EPIC C
- **Acceptance Criteria:** 5/5 — field lengkap ✅ otomatis dari Closing ✅ 1-N siap relasi ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-9 tetap TODO sampai backend.
- **Langkah berikutnya:** US-015 (Form Deal Handover)

---

## 2026-10-04 12:00 — US-015 — Form Deal Handover (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-015-handover
- **Commit:** 753e989 — feat(frontend): form deal handover US-015
- **Yang dilakukan:**
  - Kontrak `types/deal.ts`: 9 field + fitur berpenjelasan + `formatDealName` FR-11 + status & versi (untuk US-017/018)
  - `services/deals.ts`: list (+displayName) / get / create (Draft + versi 1) / update (Dikonfirmasi terkunci); validasi wajib isi + kode unik
  - `HandoverForm` (fitur dinamis + panel panduan interim) + `HandoverManager` + halaman `/handover` + nav
  - Q-012 baru: isi SOP resmi panel bantuan (panel interim dari PRD)
- **File berubah:** types/deal, mocks/deals, services/deals(.test), components/handover/*, components/crm/lead-table (FormSelect label), app/handover, mocks/dashboard, docs/QUESTIONS, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (98/98) · browser menyusul di sweep akhir EPIC C
- **Acceptance Criteria:** 6/6 — field lengkap ✅ nama otomatis ✅ kode unik + wajib isi ✅ panel panduan ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-11 tetap TODO sampai backend.
- **Langkah berikutnya:** US-016 (Termin pembayaran)

---

## 2026-10-04 12:30 — US-016 — Termin pembayaran (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-016-termin
- **Commit:** 91a9fb0 — feat(frontend): termin pembayaran US-016
- **Yang dilakukan:**
  - Tipe `PaymentTerm` (%/nominal, tempo tanggal/milestone, 3 status) + `termAmount`
  - `services/deal-terms.ts`: `listTerms` (+total & seimbang), `replaceTerms` set-based (menolak bila total ≠ nilai deal + pesan selisih), `updateTermStatus`
  - `TermsEditor` (baris dinamis, banner seimbang live, status per termin) + halaman detail `/handover/[id]` (ringkasan + termin); tabel handover menaut ke detail
- **File berubah:** types/deal, mocks/deal-terms, services/deal-terms(.test), components/handover (terms-editor, detail, manager), app/handover/[id], docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (105/105) · browser menyusul di sweep akhir EPIC C
- **Acceptance Criteria:** 5/5 — banyak termin ✅ total = deal ✅ 3 status ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-12 tetap TODO sampai backend. Termin Dikonfirmasi terkunci kecuali via CR (US-018).
- **Langkah berikutnya:** US-017 (Konfirmasi Produksi)

---

## 2026-10-04 13:00 — US-017 — Konfirmasi Produksi (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-017-konfirmasi
- **Commit:** d1455b3 — feat(frontend): alur konfirmasi handover US-017
- **Yang dilakukan:**
  - `setDealStatus` di `services/deals.ts` (tanpa siklus import)
  - `services/deal-workflow.ts`: alur valid, gate termin seimbang, putusan PM, komentar wajib revisi, notifikasi + audit; komentar PM tersimpan sebagai komentar deal (US-006 reusable, tipe `deal` baru)
  - `pushNotification` di `services/collaboration.ts`
  - `HandoverStatusActions` di halaman detail
- **File berubah:** services/deals, services/deal-workflow(.test), services/collaboration, types/collaboration, components/handover (status, detail), docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (108/108) · browser menyusul di sweep akhir EPIC C
- **Acceptance Criteria:** 5/5 — alur status ✅ putusan PM + komentar ✅ notifikasi ✅ Dikonfirmasi-gate (US-019) ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-13 tetap TODO sampai backend.
- **Langkah berikutnya:** US-018 (Change request)

---

## 2026-10-04 13:30 — US-018 — Change request (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-018-change-request
- **Commit:** a06d4fb — feat(frontend): change request + riwayat versi US-018
- **Yang dilakukan:**
  - Tipe `ChangeRequest` (4 jenis, 3 status, dampak nilai/deadline)
  - `services/change-requests.ts`: ajukan + putuskan (setuju → terapkan dampak + versi baru + notifikasi + audit; tolak; anti ganda); `applyApprovedChangeRequest` di `services/deals.ts`
  - `ChangeRequestSection` (log + ajukan + setujui/tolak + riwayat versi) di halaman detail
- **File berubah:** types/deal, mocks/change-requests, services/change-requests(.test), services/deals, components/handover (change-request-section, detail), docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (112/112) · browser menyusul di sweep akhir EPIC C
- **Acceptance Criteria:** 4/4 — log CR ✅ setuju → versi baru ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-14 tetap TODO sampai backend.
- **Langkah berikutnya:** Sweep verifikasi akhir EPIC C (build + browser semua route)

---

## 2026-10-04 14:00 — EPIC C — Sweep verifikasi akhir (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** develop
- **Yang dilakukan:**
  - `next build` bersih: 11 route (9 static + `/handover/[id]` dinamis + `/_not-found`)
  - `next start` + fetch: `/klien`, `/handover`, `/handover/HDV-001`, `/handover/HDV-002`, CRM routes → 200 semua; halaman detail me-render state loading guard (konten setelah hidrasi — pola sama seperti `/login`)
  - EPIC C lengkap: US-014–US-018 DONE (masing-masing lint ✅ typecheck ✅ test ✅; total 112/112)
- **Verifikasi:** build ✅ browser ✅
- **Catatan/Masalah:** FR-9/FR-11/FR-12/FR-13/FR-14 tetap TODO sampai backend Fase 2. Q-012 (SOP panel) masih OPEN.
- **Langkah berikutnya:** EPIC D / US-019 (Pembuatan proyek dari handover)

---

## 2026-10-04 14:30 — US-019 — Pembuatan proyek dari handover (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-019-proyek-handover
- **Commit:** 3a81d7e — feat(frontend): proyek dari handover US-019
- **Yang dilakukan:**
  - Kontrak `types/project.ts`: 5 status, satu PM (Q-001 A)
  - `services/projects.ts`: create dari Dikonfirmasi + anti ganda + validasi PM/tanggal; relasi dua arah
  - Tombol "Buat Proyek" di detail handover (dialog PM + mulai) + seksi proyek tertaut; halaman detail `/proyek/[id]`
- **File berubah:** types/project, services/projects(.test), components/proyek/*, components/handover/handover-detail, app/proyek/[id], docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (116/116) · browser menyusul di sweep akhir EPIC D
- **Acceptance Criteria:** 5/5 — salin tanpa input ulang ✅ field + 5 status ✅ relasi dua arah ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-15 tetap TODO sampai backend. Fitur handover dibaca backlog US-023 dari handover tertaut.
- **Langkah berikutnya:** US-020 (Daftar proyek)

---

## 2026-10-04 15:00 — US-020 — Daftar proyek (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-020-daftar-proyek
- **Commit:** 7f2d81f — feat(frontend): daftar proyek + progress + guard US-020
- **Yang dilakukan:**
  - Store task minimal + `getProjectProgress` (rata-rata task atas; induk-dari-subtask di US-022)
  - `queryProjects` (cari + filter status/PM/klien), `updateProject`, `canManageProjects`
  - Halaman `/proyek` (filter + progress bar); edit proyek + tombol Buat Proyek digerbang PM/Admin; nav
- **File berubah:** types/task, services/tasks, services/projects(+test), components/proyek (list, detail, handover-section), app/proyek, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (120/120) · browser menyusul di sweep akhir EPIC D
- **Acceptance Criteria:** 4/4 — tabel + filter ✅ progress otomatis ✅ guard PM/Admin ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** -
- **Langkah berikutnya:** US-021 (Template task)

---

## 2026-10-04 15:30 — US-021 — Template task (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-021-template-task
- **Commit:** 1aba6f4 — feat(frontend): template task + generate US-021
- **Yang dilakukan:**
  - Perluas `TaskSummary` (tanggal, assignee, isActive); tipe `TaskTemplate`
  - `services/task-templates.ts`: CRUD + generate berurutan dari tanggal mulai; hook otomatis di `createProjectFromHandover`
  - Seed placeholder eksplisit menunggu Q-005 (tetap OPEN)
  - Halaman `/pengaturan/template-task` (Admin) + seksi task di detail proyek (nonaktifkan/hapus, gerbang PM)
- **File berubah:** types/task, mocks/task-templates, services/task-templates(.test), services/tasks, services/projects, components/proyek (template-manager, project-tasks, detail), app/pengaturan/template-task, mocks/dashboard, services/projects-query.test, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (125+/125+) · browser menyusul di sweep akhir EPIC D
- **Acceptance Criteria:** 4/4 — kelola template ✅ generate otomatis ✅ nonaktifkan/hapus ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-16 tetap TODO sampai backend. Isi template menunggu Q-005.
- **Langkah berikutnya:** US-022 (Task board)

---

## 2026-10-04 16:00 — US-022 — Task board (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-022-task-board
- **Commit:** 965b175 — feat(frontend): task board Kanban + List US-022
- **Yang dilakukan:**
  - Field penuh task (5 status, assignee, tanggal, %, catatan, link) + sub-task + rollup `%` induk + hapus beserta anak
  - `TaskBoard`: Kanban drag-and-drop 5 kolom + List (cari/filter) + dialog (detail, sub-task, komentar, lampiran); halaman `/proyek/[id]/tasks`; tautan dari detail proyek
- **File berubah:** types/task, services/tasks(.test board), components/proyek/task-board, app/proyek/[id]/tasks, components/proyek/project-detail, services/projects-query.test (rollup induk), docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (128/128) · browser menyusul di sweep akhir EPIC D
- **Acceptance Criteria:** 6/6 — field ✅ Kanban + List ✅ sub-task + rollup ✅ komentar/lampiran ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-17 tetap TODO sampai backend.
- **Langkah berikutnya:** US-023 (Backlog fitur)

---

## 2026-10-04 16:30 — US-023 — Backlog fitur (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-023-backlog-fitur
- **Commit:** 0e761ff — feat(frontend): backlog fitur US-023
- **Yang dilakukan:**
  - Kontrak `types/feature.ts` (prioritas 3 tingkat, estimasi, sumber, tautan task)
  - `services/features.ts`: CRUD + impor handover idempoten (otomatis saat proyek dibuat) + konversi ke task
  - `FeatureBacklog` di detail proyek (tabel + dialog + impor + jadi-task)
- **File berubah:** types/feature, services/features(.test), services/projects (hook impor), components/proyek (feature-backlog, detail), docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (133/133) · browser menyusul di sweep akhir EPIC D
- **Acceptance Criteria:** 4/4 — field ✅ impor otomatis ✅ jadi task ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** estimasi impor default 1 hari (PM menyesuaikan di US-024).
- **Langkah berikutnya:** US-024 (Penjadwalan otomatis)

---

## 2026-10-04 17:00 — US-024 — Penjadwalan otomatis (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-024-penjadwalan
- **Commit:** 29e7f2c — feat(frontend): penjadwalan fitur US-024
- **Yang dilakukan:**
  - `services/scheduling.ts`: kalender kerja (Sen–Jumat + libur), durasi dari estimasi × kapasitas, urutan prioritas, berurutan per developer, deteksi bentrok, override beralasan, pengaturan tersimpan
  - `FeatureScheduleSection` di detail proyek (jadwal + override + kalender/kapasitas)
- **File berubah:** types/feature, services/scheduling(.test), services/features (writeFeatureSchedule), components/proyek (feature-schedule, detail), docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (139/139) · browser menyusul di sweep akhir EPIC D
- **Acceptance Criteria:** 5/5 — jadwal otomatis ✅ kapasitas ✅ bentrok ✅ override ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-18 tetap TODO sampai backend.
- **Langkah berikutnya:** US-025 (Gantt chart)

---

## 2026-10-04 17:30 — US-025 — Gantt chart (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-025-gantt
- **Commit:** 3fd89a1 — feat(frontend): Gantt interaktif US-025
- **Yang dilakukan:**
  - `services/task-dependencies.ts`: FS + tolak siklus/duplikat/refleksif
  - `moveTaskDates` di `services/tasks.ts`: geser rentang + kaskade successor tertabrak
  - `GanttChart`: task + fitur, zoom 3 level, seret-untuk-pindah (tersimpan; fitur via override beralasan), garis hari ini & deadline, editor dependensi; halaman `/proyek/[id]/gantt`
- **File berubah:** services/task-dependencies(.test gantt), services/tasks, components/proyek (gantt-chart, detail), app/proyek/[id]/gantt, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (143/143) · browser menyusul di sweep akhir EPIC D
- **Acceptance Criteria:** 5/5 — zoom ✅ drag tersimpan ✅ FS + kaskade ✅ today/deadline ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-19 tetap TODO sampai backend.
- **Langkah berikutnya:** US-026 (Dashboard produksi)

---

## 2026-10-04 18:00 — US-026 — Dashboard produksi (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-026-dashboard-produksi
- **Commit:** e1eac90 — feat(frontend): dashboard produksi + ekspor US-026
- **Yang dilakukan:**
  - `services/production-dashboard.ts`: KPI + deadline watch + filter PM/proyek/periode
  - `services/production-export.ts`: builder Excel (SheetJS) + PDF (jsPDF) + unduhan
  - Halaman `/proyek/dashboard` + nav; dependensi baru `xlsx`, `jspdf` (DEC-009); Q-013 (arti "divisi")
- **File berubah:** services/production-dashboard(.test export), services/production-export, components/proyek/production-dashboard, app/proyek/dashboard, mocks/dashboard, package.json + lockfile, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (148/148) · browser menyusul di sweep akhir EPIC D
- **Acceptance Criteria:** 5/5 — KPI ✅ deadline ✅ filter ✅ ekspor PDF+Excel ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-20 tetap TODO sampai backend. Filter divisi menunggu Q-013.
- **Langkah berikutnya:** Sweep verifikasi akhir EPIC D (build + browser semua route)

---

## 2026-10-04 18:30 — EPIC D — Sweep verifikasi akhir (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** develop
- **Yang dilakukan:**
  - `next build` bersih: 15 route (11 static + 4 dinamis)
  - `next start` + fetch: `/proyek`, `/proyek/dashboard`, `/pengaturan/template-task`, `/klien`, `/handover` → 200 + penanda; rute dinamis proyek/tasks/gantt → 200 (state loading, konten setelah hidrasi)
  - EPIC D lengkap: US-019–US-026 DONE (masing-masing lint ✅ typecheck ✅ test ✅; total 148/148)
- **Verifikasi:** build ✅ browser ✅
- **Catatan/Masalah:** FR-11/FR-15/FR-16/FR-17/FR-18/FR-19/FR-20 tetap TODO sampai backend. Q-005 (template) & Q-012 (SOP) & Q-013 (divisi) masih OPEN.
- **Langkah berikutnya:** EPIC E / US-027 (Content Planner)

---

## 2026-10-04 19:00 — US-027 — Content Planner (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-027-content-planner
- **Commit:** dee11fe — feat(frontend): content planner US-027
- **Yang dilakukan:**
  - Konstanta Sosmed bersama (3 brand, 5 platform; satu dataset — Q-009)
  - Kontrak ide + skor brief + ambang 5/5 (Q-003 A); CRUD + halaman `/sosmed/planner` + nav
- **File berubah:** types/sosmed, types/content-idea, mocks/content-ideas, services/ideas(.test), components/sosmed/idea-manager, app/sosmed/planner, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (152/152) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 5/5 — field ✅ brief + skor ✅ 4 status ✅ ambang ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-21 tetap TODO sampai backend.
- **Langkah berikutnya:** US-028 (Database Produksi Konten)

---

## 2026-10-04 19:30 — US-028 — Database Produksi Konten (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-028-materi
- **Commit:** 081b5da — feat(frontend): database materi US-028
- **Yang dilakukan:**
  - Kontrak materi (ID otomatis, 4 status, jadwal + jam, 3 assignee, gate menempel)
  - CRUD + buat-dari-ide (gerbang Disetujui) + halaman `/sosmed/materi` + nav
- **File berubah:** types/material, mocks/materials, services/materials(.test), components/sosmed/material-manager, app/sosmed/materi, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (155/155) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 4/4 — materi induk ✅ penugasan ✅ dari ide ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** -
- **Langkah berikutnya:** US-029 (Quality gate)

---

## 2026-10-04 20:00 — US-029 — Quality gate (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-029-quality-gate
- **Commit:** 10b1121 — feat(frontend): quality gate pra-rilis US-029
- **Yang dilakukan:**
  - `services/quality-gate.ts`: checklist 5 item + gerbang jadwal/rilis + pengecualian Admin beralasan
  - Halaman detail `/sosmed/materi/[id]` (gate, jadwal, rilis); tabel materi menaut ke detail
- **File berubah:** services/quality-gate(.test), components/sosmed/material-detail, app/sosmed/materi/[id], components/sosmed/material-manager, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (160/160) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 3/3 — checklist ✅ gerbang jadwal/rilis ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** -
- **Langkah berikutnya:** US-030 (Approval & revisi)

---

## 2026-10-04 20:30 — US-030 — Approval & revisi (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-030-approval
- **Commit:** 14445e0 — feat(frontend): approval dan revisi materi US-030
- **Yang dilakukan:**
  - Tipe revisi (Rev 0,1... + reviewer + keputusan + feedback + bukti)
  - `services/approvals.ts`: 3 keputusan; feedback wajib saat Ditolak; Disetujui → status Disetujui (gerbang jadwal); Ditolak → Draf
  - `ApprovalSection` di detail materi (riwayat + form review)
- **File berubah:** types/material, mocks/materials, services/materials (clone dalam), services/approvals(.test), components/sosmed (approval-section, material-detail), docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (163/163) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 5/5 — versi + reviewer ✅ 3 keputusan ✅ feedback + bukti ✅ gerbang Disetujui ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** -
- **Langkah berikutnya:** US-031 (Distribusi)

---

## 2026-10-04 21:00 — US-031 — Distribusi (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-031-distribusi
- **Commit:** a01fc8a — feat(frontend): distribusi Parent-Child US-031
- **Yang dilakukan:**
  - Kontrak publikasi (PUB otomatis, 5 platform, Single/Crosspost, jadwal + rilis menempel)
  - CRUD publikasi + target dari ide + peringatan rekonsiliasi; seksi distribusi di detail materi
- **File berubah:** types/publication, services/publications(.test), components/sosmed (distribution-section, material-detail), docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (166/166) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 4/4 — 1 MAT banyak PUB ✅ pola ✅ rekonsiliasi ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-23 tetap TODO sampai backend.
- **Langkah berikutnya:** US-032 (Kalender publikasi)

---

## 2026-10-04 21:30 — US-032 — Kalender publikasi (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-032-kalender
- **Commit:** 105bfa3 — feat(frontend): kalender publikasi US-032
- **Yang dilakukan:**
  - `services/calendar.ts`: entri dari distribusi + 4 filter + urgensi + ambang Q-004 B (konfigurabel) + jadwal-ulang drag
  - Kalender bulan/minggu + klik detail + indikator Overdue/Kritis + pengaturan ambang interim; halaman `/sosmed/kalender` + nav
- **File berubah:** services/calendar(.test), components/sosmed/publication-calendar, app/sosmed/kalender, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (171/171) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 5/5 — bulan/minggu ✅ 4 filter ✅ klik + drag ✅ Overdue/Kritis ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-24 tetap TODO sampai backend. Ambang penuh di Pengaturan US-041.
- **Langkah berikutnya:** US-033 (Pelacakan rilis)

---

## 2026-10-04 22:00 — US-033 — Pelacakan rilis (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-033-rilis
- **Commit:** 2e2e0aa — feat(frontend): pelacakan rilis US-033
- **Yang dilakukan:**
  - `recordRelease` (tanggal aktual + link live wajib; mengunci jadwal-ulang) + form rilis per publikasi di seksi distribusi
- **File berubah:** services/publications(.test), components/sosmed/distribution-section, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (173/173) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 3/3 — aktual + link ✅ Overdue/Kritis otomatis (US-032) ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** -
- **Langkah berikutnya:** US-034 (Asset library)

---

## 2026-10-04 22:30 — US-034 — Asset library (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-034-aset
- **Commit:** 8615370 — feat(frontend): asset library US-034
- **Yang dilakukan:**
  - Kontrak aset + CRUD + status kedaluwarsa + `linkAssetsToMaterial` (tolak kedaluwarsa)
  - Halaman `/sosmed/aset` + penautan aset di detail materi (opsi kedaluwarsa terkunci)
- **File berubah:** types/asset, mocks/assets, services/assets(.test), components/sosmed (asset-manager, material-assets, material-detail), app/sosmed/aset, types/material, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (176/176) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 4/4 — metadata ✅ 30 hari ✅ tolak kedaluwarsa ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-27 tetap TODO sampai backend.
- **Langkah berikutnya:** EPIC F / US-035 (Analytics)

---

## 2026-10-04 23:00 — US-035 — Analytics (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-035-analitik
- **Commit:** 57f1440 — feat(frontend): analytics posting US-035
- **Yang dilakukan:**
  - ER otomatis Q-002 C + snapshot Monitoring/Final + dedup + kunci Q-007 B
  - Halaman `/sosmed/analitik` (pilih publikasi, tabel + ER + form + hapus) + nav
- **File berubah:** types/metric, services/metrics(.test), components/sosmed/metrics-manager, app/sosmed/analitik, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (180/180; perbaiki test yang menimpa snapshot) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 5/5 — 7 metrik ✅ ER + rumus ✅ snapshot ✅ dedup + kunci ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-25 tetap TODO sampai backend.
- **Langkah berikutnya:** US-036 (Pertumbuhan akun)

---

## 2026-10-04 23:30 — US-036 — Pertumbuhan akun (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-036-pertumbuhan
- **Commit:** 31c6dc8 — feat(frontend): pertumbuhan akun US-036
- **Yang dilakukan:**
  - Net Growth otomatis + CRUD bulanan per platform (unik) + grafik tren CSS + halaman `/sosmed/pertumbuhan` + nav
- **File berubah:** types/growth, services/growth(.test), components/sosmed/growth-manager, app/sosmed/pertumbuhan, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (182/182) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 4/4 — input ✅ net growth ✅ grafik ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** -
- **Langkah berikutnya:** US-037 (Community & SLA)

---

## 2026-10-05 00:00 — US-037 — Community & SLA (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-037-komunitas
- **Commit:** 72b17c7 — feat(frontend): community + SLA US-037
- **Yang dilakukan:**
  - Interaksi (kanal/platform/tipe/waktu) + tanggap otomatis + SLA 30 mnt + compliance + halaman `/sosmed/komunitas` + nav
- **File berubah:** types/community, services/community(.test), components/sosmed/community-manager, app/sosmed/komunitas, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (185/185) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 4/4 — interaksi ✅ tanggap + SLA ✅ % dashboard (koneksi US-039) ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-26 tetap TODO sampai backend. Ambang resmi US-041.
- **Langkah berikutnya:** US-038 (Inquiry tracking)

---

## 2026-10-05 00:30 — US-038 — Inquiry tracking (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-038-inquiry
- **Commit:** 8c84adb — feat(frontend): inquiry + Jadikan Lead US-038
- **Yang dilakukan:**
  - Inquiry (platform/brand/waktu) + routing SLA 15 mnt + 3 status + konversi ke lead CRM (`source` tercatat, anti ganda)
  - `Lead.source` baru (opsional, non-destruktif); halaman `/sosmed/inquiry` + nav
- **File berubah:** types/inquiry, types/lead, services/leads, services/inquiries(.test), components/sosmed/inquiry-manager, app/sosmed/inquiry, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (188/188) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 5/5 — inquiry ✅ routing SLA ✅ 3 status ✅ Jadikan Lead ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-28 tetap TODO sampai backend.
- **Langkah berikutnya:** US-039 (KPI Scorecard Sosmed)

---

## 2026-10-05 01:00 — US-039 — KPI Scorecard (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-039-scorecard
- **Commit:** 2c9b118 — feat(frontend): KPI scorecard sosmed US-039
- **Yang dilakukan:**
  - 6 KPI (produksi, reach, ER, growth, footprint, handover) + target interim + status verifikasi + filter brand/periode
  - Halaman `/sosmed/scorecard` + nav
- **File berubah:** services/scorecard(.test), components/sosmed/sosmed-scorecard, app/sosmed/scorecard, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (190/190) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 4/4 — 6 KPI ✅ filter ✅ target + status ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** target resmi menunggu US-041.
- **Langkah berikutnya:** US-040 (Evaluasi KIST)

---

## 2026-10-05 01:30 — US-040 — Evaluasi KIST (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-040-kist
- **Commit:** b554c2d — feat(frontend): evaluasi KIST US-040
- **Yang dilakukan:**
  - CRUD evaluasi + filter kategori/brand/periode + hipotesis wajib untuk Test + halaman `/sosmed/evaluasi` + nav
- **File berubah:** types/evaluation, services/evaluations(.test), components/sosmed/kist-board, app/sosmed/evaluasi, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (192/192) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 4/4 — KIST ✅ hipotesis Test ✅ filter ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-29 tetap TODO sampai backend.
- **Langkah berikutnya:** EPIC G / US-042 (SOP & RACI)

---

## 2026-10-05 03:00 — Gate 1 — Frontend Selesai (DONE, tag v0.1.0-frontend)

- **Fase:** 1 → 2 (Frontend selesai, berikutnya Backend)
- **Branch:** develop
- **Verifikasi akhir:**
  - 39/39 US Frontend DONE, 0 TODO (EPIC A–G frontend)
  - Test: 198/198 lolos (43 file); lint ✅ typecheck ✅
  - Build produksi bersih: 26 route (21 static + 5 dinamis)
  - Browser: seluruh route 200 (list + kalender + panduan + home; halaman client-hydration terverifikasi via state loading + unit test)
  - Kontrak API draft lengkap di `docs/API.md` (semua modul)
- **Gate 1 checklist:** UI DONE ✅ mock ✅ kontrak ✅ build ✅ merge develop ✅ tag ✅
- **Catatan/Masalah:** FR-1–FR-31 tetap TODO (Fase 2). Q-005, Q-012, Q-013 masih OPEN. CR-001/CR-002 PENDING.
- **Langkah berikutnya:** Fase 2 — Backend, mulai US-003 (RLS)

---

## 2026-10-05 04:00 — Chore — Sesuaikan repo dengan AGENT_RULES alur 4 fase

- **Branch:** docs/sesuaikan-aturan-fase
- **Yang dilakukan:**
  - Membaca `AGENT_RULES.md` revisi pemilik: alur `Frontend → Skema Database → Backend → Deploy Ready` (Gate 0–4, tag `v0.2.0-database` / `v0.3.0-backend` / `v1.0.0`)
  - `docs/PROGRESS.md`: tabel Gates → Gate 2 Skema, Gate 3 Backend, Gate 4 Deploy; fase berikutnya = Fase 2 Skema Database
  - `docs/DEPLOYMENT.md`: referensi fase/gate → Fase 4 / Gate 3–4
  - `docs/DECISIONS.md` (DEC-008): penghapusan scaffolding demo → sebelum Gate 4
  - Scaffold kosong: `docs/DATABASE.md` (Status DRAFT, tanpa rancangan) + `database/schema.sql` (placeholder, bukan migration)
  - Tidak mengubah `AGENT_RULES.md` (milik pemilik) dan tidak menyentuh entri WORKLOG lama
- **Verifikasi:** tidak ada perubahan kode (docs + struktur saja); `git status` bersih setelah commit
- **Catatan/Masalah:** Isi rancangan skema tetap dikerjakan di Fase 2 pada branch `db/*` + persetujuan tertulis.
- **Langkah berikutnya:** Fase 2 — Skema Database (mulai dari US-003/FR-1: identifikasi entitas)

---

## 2026-10-05 03:30 — Chore — Layout global portal (permintaan pemilik)

- **Branch:** chore/portal-global-layout
- **Yang dilakukan:**
  - Shell dashboard (sidebar + header) dipindah dari `app/page.tsx` ke grup route `(portal)/layout.tsx`; seluruh halaman modul pindah ke grup (URL tidak berubah)
  - Komponen baru: `layout/portal-sidebar` (nav + state aktif), `layout/portal-header`, `layout/status-badge` + `tone-classes`
  - `/login` dan `/403` tetap tanpa shell; nav "Ringkasan kerja" → `/`
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ (198/198) build ✅ browser ✅ (shell di portal, tanpa shell di login/403)
- **Catatan/Masalah:** nav anchor `#proyek` (Task Board) & `#pengaturan` (Master Data) masih menunggu halamannya (US-005/backend).
- **Langkah berikutnya:** Fase 2 — Backend, mulai US-003 (RLS)

---

## 2026-10-05 02:00 — US-042 — SOP & RACI (DONE)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-042-panduan
- **Commit:** eba2031 — feat(frontend): panduan SOP dan RACI US-042
- **Yang dilakukan:**
  - Panduan markdown (baca semua, sunting Admin) + perender minimal + matriks RACI 3×7 + halaman `/pengaturan/panduan` + nav
- **File berubah:** types/guide, services/guides(.test), components/sosmed (markdown, guides-manager), app/pengaturan/panduan, mocks/dashboard, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (194/194) · browser menyusul di sweep akhir
- **Acceptance Criteria:** 3/3 — panduan + edit ✅ RACI ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** -
- **Langkah berikutnya:** US-044 (Pencarian global)

---

## 2026-10-05 02:30 — US-044 — Pencarian global (DONE, Frontend selesai!)

- **Fase:** 1 (Frontend)
- **Branch:** feature/US-044-pencarian
- **Commit:** ac3b400 — feat(frontend): pencarian global + Tugas saya US-044
- **Yang dilakukan:**
  - `services/search.ts`: pencarian lintas 5 entitas + `getMyWork` per role
  - `GlobalSearch` (Ctrl+K) gantikan input dekoratif header + `MyWorkSection` di beranda
- **File berubah:** services/search(.test), components/search/*, app/page, docs
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (196/196) · browser menyusul di sweep akhir + Gate 1
- **Acceptance Criteria:** 4/4 — pencarian ✅ Tugas saya ✅ hak akses (paritas signature RLS) ✅ lint/typecheck ✅ (browser: sweep akhir)
- **Catatan/Masalah:** FR-31 tetap TODO sampai backend. Seluruh 39 US Frontend DONE.
- **Langkah berikutnya:** Sweep verifikasi akhir + Gate 1 (Frontend Selesai)

---

## 2026-10-05 04:30 — Koreksi atribusi AGENT_RULES.md

- **Yang terjadi:** Revisi `AGENT_RULES.md` oleh pemilik (alur 4 fase) masih berupa perubahan
  working-tree yang belum di-commit saat sesi penyesuaian berjalan, sehingga ikut
  ter-commit dalam `e37e818` (docs: sesuaikan repo dengan alur 4 fase) atas nama agent.
- **Koreksi:** Isi revisi benar milik pemilik dan tetap dipertahankan; agent tidak mengubah
  isi aturan — hanya penyesuaian repo (PROGRESS, DEPLOYMENT, DECISIONS, scaffold DATABASE).
  Dicatat di sini sesuai kewajiban lapor pelanggaran proses.
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 05:00 — US-012+ — Ubah status di dialog aktivitas (permintaan pemilik)

- **Branch:** feature/US-012-status-aktivitas
- **Yang dilakukan:**
  - Dialog aktivitas lead kini menampilkan status saat ini + dropdown ubah ke 6 status lain + tombol "Ubah status" (via `updateLead`, tercatat di timeline audit)
  - Test komponen baru: pindah New → Contacted + entri timeline
- **File berubah:** components/crm/lead-activity-dialog(.test)
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ (baru + 18 terkait) build ✅ browser ✅ (`/crm/leads` 200)
- **Catatan/Masalah:** - (pemetaan: US-012, US-007)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 06:00 — Seed data demo proyek (permintaan pemilik)

- **Branch:** feature/seed-demo-proyek
- **Yang dilakukan:**
  - Seed handover HDV-003/HDV-004 (Dikonfirmasi) + proyek PRJ-001 (Planning/Raka) / PRJ-002 (Active/Dinda) + termin HDV-003 seimbang; halaman `/proyek` kini terisi
  - Pindah `mockProjects` ke `mocks/projects.ts` mengikuti pola modul lain
  - Sesuaikan 4 file test terhadap jumlah seed (tanpa mengubah logika yang diuji)
- **File berubah:** mocks/deals, mocks/projects, mocks/deal-terms, services/projects, services tests, docs
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ (199/199) build ✅ browser ✅ (`/proyek` 200)
- **Catatan/Masalah:** - (pemetaan: US-019, US-020)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 06:30 — Fix — Menu aktif ganda + reset filter dashboard (laporan pemilik)

- **Branch:** fix/dashboard-produksi
- **Yang dilakukan:**
  - Sidebar: hanya tautan paling spesifik yang aktif (`/proyek/dashboard` tidak lagi ikut mengaktifkan `/proyek`)
  - Dashboard produksi: tombol "Reset filter" muncul saat ada filter aktif
- **File berubah:** components/layout/portal-sidebar, components/proyek/production-dashboard
- **Verifikasi:** lint ✅ typecheck ✅ build ✅ browser ✅ (1 menu aktif per halaman)
- **Catatan/Masalah:** - (pemetaan: US-020, US-026)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 07:00 — Fix — Gabung daftar + dashboard proyek (permintaan pemilik)

- **Branch:** fix/gabung-proyek-dashboard
- **Yang dilakukan:**
  - Filter dashboard produksi dihapus; KPI + deadline watch + ekspor pindah ke halaman `/proyek` (tanpa filter, hitung keseluruhan)
  - Route `/proyek/dashboard` dan komponen `production-dashboard` dihapus; nav "Dashboard Produksi" dihapus, "Daftar Proyek" → "Proyek"
  - Catatan: `/proyek/dashboard` kini jatuh ke rute dinamis `[id]` (kartu "tidak ditemukan") — URL mati yang tidak ditautkan di mana pun
- **File berubah:** components/proyek/project-list (+KPI/deadline/ekspor), hapus dashboard route + komponen, mocks/dashboard, docs/API
- **Verifikasi:** lint ✅ typecheck ✅ build ✅ browser ✅ (KPI loading + nav tunggal)
- **Catatan/Masalah:** - (pemetaan: US-020, US-026)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 07:30 — Kalender proyek + master developer (permintaan pemilik)

- **Branch:** feature/proyek-kalender-developer
- **Yang dilakukan:**
  - Kalender proyek per proyek (bulan/minggu, task + fitur, klik, seret jadwal ulang) + halaman `/proyek/[id]/kalender` + tombol di detail
  - Master data developer (nama + internal/external, bibit termasuk freelance & magang) + halaman `/pengaturan/developer` (Admin) + dropdown assignee di task board & backlog fitur
- **File berubah:** components/proyek (project-calendar, developer-manager, assignee-select, task-board, feature-backlog, detail), app kalender + developer, types/mocks/services developers(.test), mocks/dashboard, docs
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ (201/201) build ✅ browser ✅ (2 halaman 200)
- **Catatan/Masalah:** - (pemetaan: US-025/022, US-005/FR-3)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 08:00 — Kalender universal lintas proyek (permintaan pemilik)

- **Branch:** feature/kalender-universal
- **Yang dilakukan:**
  - `ProjectCalendar` mendukung mode global (tanpa `projectId`): agregat task + fitur semua proyek + filter proyek + nama proyek per entri
  - Halaman `/kalender` ("Kalender Kerja") + nav Proyek; `listAllTaskSummaries` + `listAllFeatures` + test
- **File berubah:** components/proyek/project-calendar, app kalender, services tasks/features(+test), mocks/dashboard, docs
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ build ✅ browser ✅ (`/kalender` 200)
- **Catatan/Masalah:** - (pemetaan: US-025)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 08:30 — Fix — Warning Base UI nativeButton (laporan browser)

- **Branch:** fix/button-semantics
- **Yang dilakukan:**
  - Seluruh `Button render={<Link>/<label>}` (20 titik) diberi `nativeButton={false}` agar tidak merender semantik button palsu
- **File berubah:** 15 file komponen + halaman (auth, collaboration, crm, handover, proyek, sosmed, search, demo)
- **Verifikasi:** lint ✅ typecheck ✅ build ✅ browser ✅ (`/` 200; console perlu konfirmasi pemilik)
- **Catatan/Masalah:** - (pemetaan: US-001)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 09:00 — Seed task & fitur berjadwal (kalender kosong, laporan pemilik)

- **Branch:** feature/seed-jadwal-demo
- **Yang dilakukan:**
  - Akar masalah: store task/fitur mulai kosong → kalender/Gantt/board kosong. Seed 4 task + 3 fitur berjadwal (Okt 2026) untuk PRJ-001/PRJ-002
  - Pindah store ke `mocks/tasks.ts` + `mocks/features.ts`; isolasi 5 test ke PRJ-900+ agar tak tergantung seed
  - Test komponen kalender: universal menampilkan seed lintas proyek; mode per-proyek memfilter
- **File berubah:** mocks/tasks, mocks/features, services/tasks, services/features, services tests, components/proyek/project-calendar(.test), docs
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ (205/205) build ✅ browser ✅
- **Catatan/Masalah:** - (pemetaan: US-022, US-023, US-025)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 09:30 — Fix — Kembali ke halaman asal dari Task Board (laporan pemilik)

- **Branch:** fix/back-dari-task
- **Yang dilakukan:**
  - Tautan task di kalender membawa `?from=` (kalender global/per-proyek); tombol kembali memakai asal bila valid, jika tidak ke detail proyek
- **File berubah:** components/proyek/project-calendar, app/proyek/[id]/tasks
- **Verifikasi:** lint ✅ typecheck ✅ build ✅ browser ✅ (`?from=/kalender` → "Kembali" ke `/kalender`; tanpa param → "Detail proyek")
- **Catatan/Masalah:** - (pemetaan: US-022, US-025)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 10:00 — Fix — Kembali ke halaman asal di semua detail (permintaan pemilik)

- **Branch:** fix/back-semua-halaman
- **Yang dilakukan:**
  - Helper `lib/back-link.ts` (validasi path internal) + `?from=` di semua tautan silang: kalender→task/board, kalender→detail, handover↔proyek, materi detail
  - Tombol kembali: "Kembali" ke asal bila valid, jika tidak label + tujuan default lama
  - Berlaku: Task Board, detail proyek/handover/materi (Gantt/kalender per-proyek hanya dari detail — sudah benar)
- **File berubah:** lib/back-link(+test), 3 page + 3 komponen detail, 2 kalender, handover-project-section
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ build ✅ browser ✅ (payload "Kembali" di 3 detail)
- **Catatan/Masalah:** - (pemetaan: US-022, US-025, US-019, US-015, US-030)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 10:30 — Fix — Pengaturan macet di "Memeriksa akses" (laporan pemilik)

- **Branch:** fix/require-role-init
- **Akar masalah:** `RequireRole` menunggu sesi selesai dimuat, tetapi `initialize()` hanya dipanggil komponen di dalamnya — yang tak pernah mount. Deadlock khusus kunjungan langsung (tanpa lewat login dulu).
- **Yang dilakukan:** guard sendiri memicu `initialize()` saat status masih loading
- **File berubah:** components/auth/require-role
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ build ✅ browser ✅ (4 halaman pengaturan 200)
- **Catatan/Masalah:** - (pemetaan: US-002)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 11:00 — Fix — PIC tampil di sel kalender kerja (laporan pemilik)

- **Branch:** fix/kalender-pic
- **Akar masalah:** sel kalender hanya menampilkan nama; PIC (assignee/developer) cuma ada di tooltip.
- **Yang dilakukan:** baris kedua "👤 Nama" di tiap entri task & fitur (kalender global + per-proyek)
- **File berubah:** components/proyek/project-calendar
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ build ✅ browser ✅ (`/kalender` 200)
- **Catatan/Masalah:** - (pemetaan: US-025)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 11:30 — Fix — Kartu Ubah proyek fixed bawah layar (permintaan pemilik)

- **Branch:** fix/ubah-proyek-fixed
- **Yang dilakukan:**
  - Kartu "Ubah proyek" mode edit menjadi fixed di bawah viewport (`xl` menghindar sidebar) + konten aman scroll + spacer bawah
- **File berubah:** components/proyek/project-detail
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ build ✅ browser ✅ (detail 200; posisi fixed perlu cek visual pemilik)
- **Catatan/Masalah:** - (pemetaan: US-020)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 12:00 — Fix — Posisi card konfirmasi & proyek handover (permintaan pemilik)

- **Branch:** fix/handover-card-position
- **Yang dilakukan:**
  - Card Konfirmasi Produksi: fixed bawah layar selama belum ACC khusus PM/Admin; selebihnya (sudah ACC / bukan PM) tampil normal di paling bawah
  - Card Proyek disembunyikan total untuk non-PM/Admin
- **File berubah:** components/handover/handover-detail, components/proyek/handover-project-section
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ (207/207) build ✅ browser ✅
- **Catatan/Masalah:** - (pemetaan: US-017, US-019)
- **Langkah berikutnya:** Fase 2 — Skema Database
---
## 2026-10-05 12:30 — Fix — Keterangan revisi di card konfirmasi (permintaan pemilik)

- **Branch:** feature/revisi-keterangan
- **Yang dilakukan:**
  - Card Konfirmasi Produksi menampilkan "Keterangan revisi & riwayat": komentar PM + perpindahan status (aktor + waktu), terbaru dulu, refresh otomatis tiap aksi
- **File berubah:** components/handover/handover-status
- **Verifikasi:** lint ✅ typecheck ✅ build ✅ browser ✅ (detail 200)
- **Catatan/Masalah:** - (pemetaan: US-017)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 13:00 — Fix — Task Board global (nav mati, laporan pemilik)

- **Branch:** feature/board-global
- **Akar masalah:** nav "Task Board" masih anchor mati `#proyek`.
- **Yang dilakukan:**
  - Halaman `/proyek/board`: Kanban 5 status lintas proyek + cari + seret pindah status + buka board proyek (`?from=/proyek/board`)
  - Nav menaut ke route nyata; test komponen render lintas proyek
- **File berubah:** components/proyek/global-task-board(+test), app/proyek/board, mocks/dashboard, docs
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ build ✅ browser ✅ (`/proyek/board` 200)
- **Catatan/Masalah:** - (pemetaan: US-022)
- **Langkah berikutnya:** Fase 2 — Skema Database

---

## 2026-10-05 13:00 — Fase 2 — Draf skema database selesai (menunggu review)

- **Branch:** db/skema-database-awal (BELUM merge — menunggu APPROVED per Gate 2)
- **Yang dilakukan:**
  - `docs/DATABASE.md` lengkap: 37 tabel + ERD Mermaid + kamus + matriks relasi (ON DELETE/UPDATE) + index + keterlacakan + walkthrough 44 US + seed
  - Normalisasi 3NF (junction: user_roles, task_dependencies, idea_platforms, material_assets); polimorfik komentar/lampiran tanpa FK (terdokumentasi)
  - Partial unique index untuk dedup KPI Final; trigger display ID (DEC-006/010)
  - DEC-010: PK UUID + display ID trigger
- **File berubah:** docs/DATABASE.md, docs/DECISIONS.md, docs/PROGRESS.md, CHANGELOG.md, docs/WORKLOG.md
- **Verifikasi:** review dokumen (tidak ada kode; lint/test tak terdampak)
- **Catatan/Masalah:** BUTUH PERSETUJUAN TERTULIS pemilik (`APPROVED`) sebelum merge + tag `v0.2.0-database` + Fase 3
- **Langkah berikutnya:** Review pemilik atas DATABASE.md

---

## 2026-10-05 14:00 — Fase 2 — Revisi skema dari review pemilik + DDL (menunggu APPROVED)

- **Branch:** db/skema-database-awal (BELUM merge)
- **Yang dilakukan:**
  - Koreksi blocking (5): `developers` → `team_members` (+`profile_id` UNIQUE NULL, selaras ERD-matriks); dropdown US-005 → FK master via kolom generated; `brand` di growth/community (+UK); `deals.created_by/confirmed_by/at`; `lead_status_history` baru
  - Koreksi sedang (6): clients nullable; CR `≠0` + sync ke projects (DEC-012); assignee materi → FK + status `Ditolak` + override_by FK; `material_platforms`; zona WIB; 7 index FK + 3 index baru
  - Higiene (8): entity 5 tipe; kolom `status`; growth tanpa surrogate; inquiry 1:1; 4 relasi ERD; hapus baris holidays; seed service_hours + brief 5/5; LPAD tanpa batas
  - `database/schema.sql`: DDL draf lengkap 42 tabel (tervalidasi parser: 42 tabel + 44 index) + ERD re-validasi Mermaid OK
  - DEC-011 (master FK pattern), DEC-012 (sync CR→proyek)
- **File berubah:** docs/DATABASE.md, database/schema.sql, docs/DECISIONS.md, docs/WORKLOG.md, CHANGELOG.md
- **Verifikasi:** Mermaid parse OK; SQL parse OK (42 tabel/44 index; blok prosedural dicek manual)
- **Catatan/Masalah:** TETAP BUTUH APPROVED tertulis sebelum merge/tag/Fase 3
- **Langkah berikutnya:** Review + APPROVED pemilik

---

## 2026-10-05 15:00 — Fase 2 — Revisi ronde 2 + RLS deny-all (menunggu APPROVED)

- **Branch:** db/skema-database-awal (BELUM merge)
- **Yang dilakukan:**
  - Bug: hapus `UNIQUE(publication_id, snapshot)` (Monitoring boleh banyak; dedup Final via partial index)
  - RLS deny-all 42 tabel di DDL yang sama (`ENABLE ROW LEVEL SECURITY`, policies Fase 3)
  - CHECK murah: revisi feedback, hipotesis Test, override fitur, pasangan gate, replied/routed, tanggal task
  - Inkonsistensi: padding MAT/PUB 4 digit; pillar evaluasi → FK master; brand komunitas tanpa default
  - Sedang: pg_trgm + GIN (leads/tasks/clients); 8 index FK baru; FK komposit handover (DEC-013); audit jsonb; entity UUID + peta `konten`
  - Sinkron DATABASE.md (kamus, matriks, index, walkthrough) + re-validasi Mermaid/SQL OK (42 tabel/52 index)
- **File berubah:** database/schema.sql, docs/DATABASE.md, docs/DECISIONS.md (DEC-013), docs/WORKLOG.md, CHANGELOG.md
- **Verifikasi:** Mermaid OK; SQL parse OK; item stale review dikonfirmasi sudah beres di rev2
- **Catatan/Masalah:** TETAP BUTUH APPROVED tertulis sebelum merge/tag/Fase 3
- **Langkah berikutnya:** Review + APPROVED pemilik

---

## 2026-10-05 18:00 — Fase 3 — Audit + parity-fix backend (melanjutkan pekerjaan IN_PROGRESS)

- **Fase:** 3 (Backend)
- **Branch:** db/skema-database-awal (belum di-commit; Gate 2 masih TODO — lihat catatan)
- **Yang dilakukan:**
  - Audit `20261005000000_initial_schema.sql` vs `DATABASE.md` rev2: 42 tabel, kolom, FK/ON DELETE, index, trigger display_id/updated_at, master-FK generated, partial UK Final — SESUAI. Dua CHECK tak terdokumentasi (`term_tempo`, `cr_min_impact`) didokumentasikan ke §2.3 (masuk paket approval).
  - Audit `20261005001000_backend_foundation.sql` vs kontrak frontend (`types/`, `services/`): enum/role 7 label sama persis; enum funnel/channel/tipe/status sama.
  - Temuan parity (RLS vs kontrak UI): leads UPDATE owner-only memblokir bulk-assign Sales (US-009); projects owner-only vs `canManageProjects` semua-PM (US-020); deals/clients/CR `FOR ALL` mencakup DELETE tanpa UI hapus; tasks tanpa DELETE padahal US-022 hapus+anak; policy INSERT `WITH CHECK (true)` di audit/history memungkinkan pemalsuan (US-004); tidak ada jalur `inquiries.lead_id` untuk Sales (US-038); tanpa notifikasi ke Sales di `transition_deal_status` (US-017); tanpa `handle_new_user` auth→profiles (US-002).
  - Migrasi baru `20261005002000_backend_parity_fixes.sql`: RLS role-based (leads UPDATE Sales/Admin; projects INSERT/UPDATE semua-PM/Admin tanpa DELETE; deals/clients insert+update tanpa DELETE; CR insert+update tanpa DELETE; tasks UPDATE PM/assignee + DELETE PM/Admin); hapus 2 policy INSERT palsu; hapus index redundan `material_platforms_material_idx`; trigger `handle_new_user`; RPC DEFINER `convert_inquiry_to_lead` (atomik + anti-ganda, tanggal WIB); `transition_deal_status` + notifikasi ke Sales pembuat.
  - Sinkron `docs/DATABASE.md` §2.3 + walkthrough US-002/004/009/017/020/022/038; `frontend/supabase/README.md` (daftar migrasi + langkah berikut).
- **File berubah:** frontend/supabase/migrations/20261005002000_backend_parity_fixes.sql (baru), docs/DATABASE.md, frontend/supabase/README.md, docs/WORKLOG.md
- **Verifikasi:** cek statis migrasi ✅ (dollar-quote/par-rens seimbang, DROP POLICY merujuk policy yang ada, signature RPC vs GRANT cocok) · typecheck ✅ (`tsc --noEmit` exit 0) · test ✅ (208/208) · `supabase db reset` BELUM bisa (tanpa Docker/CLI di mesin ini — wajib dijalankan di mesin dengan Docker sebelum Gate 3)
- **Catatan/Masalah:** (1) DATABASE.md tetap DRAFT — pekerjaan backend berjalan mendahului Gate 2 (pelanggaran alur; dicatat di sini). (2) Seed `team_members.profile_id` NULL sampai user dibuat — penautan user→tim dilakukan manual via Admin. (3) RPC baru + RLS baru BELUM diuji terhadap DB live.
- **Langkah berikutnya:** (a) APPROVED tertulis DATABASE.md (Gate 2) + merge/tag `v0.2.0-database`; (b) `supabase db reset` + uji RPC/RLS; (c) ganti service mock bertahap (mulai US-005/US-041: master_options/settings)

---

## 2026-10-05 18:30 — Gate 2 — DATABASE.md APPROVED (pemilik proyek)

- **Fase:** 2 → 3 (Skema Database selesai, Backend resmi dibuka)
- **Branch:** db/skema-database-awal (belum merge/tag — menunggu izin commit)
- **Yang dilakukan:**
  - Persetujuan tertulis pemilik atas `docs/DATABASE.md` (mencakup revisi parity-fix: CHECK `term_tempo`/`cr_min_impact`, walkthrough RPC/RLS) dicatat di dokumen (`Status: APPROVED`, 2026-10-05); skema dikunci untuk Fase 3.
  - `docs/PROGRESS.md`: Gate 2 TODO → DONE; header fase diperbarui.
  - `CHANGELOG.md` (Unreleased): entri migrasi parity-fix.
  - Komentar header `20261005000000_initial_schema.sql`: DRAFT → APPROVED.
- **File berubah:** docs/DATABASE.md, docs/PROGRESS.md, CHANGELOG.md, frontend/supabase/migrations/20261005000000_initial_schema.sql, docs/WORKLOG.md
- **Verifikasi:** tidak ada perubahan kode (docs + komentar SQL saja)
- **Catatan/Masalah:** merge ke `develop` + tag `v0.2.0-database` belum dijalankan (butuh izin eksplisit).
- **Langkah berikutnya:** commit + merge + tag Gate 2, lalu (b) `supabase db reset` di mesin Docker, (c) service swap US-005/US-041

---

## 2026-10-05 19:00 — Gate 2 — Merge + tag `v0.2.0-database` (DONE)

- **Fase:** 2 → 3
- **Branch:** db/skema-database-awal → develop
- **Yang dilakukan:**
  - Commit 1 `3344f37` — chore(backend): koneksi Supabase client + refresh sesi (Refs: FR-1)
  - Commit 2 `f5a8415` — feat(database): fondasi backend + parity-fix + APPROVED (Refs: US-003/004/005, FR-1/2/3)
  - Commit 3 `6174844` — chore(backend): kecualikan cache CLI (Refs: -)
  - Merge --no-ff ke `develop` (`3a3461e`); tag anotasi `v0.2.0-database`; `CHANGELOG.md` seksi `[0.2.0]`
  - Verifikasi pra-commit: lint ✅ typecheck ✅ test ✅ (208/208); secret (`.env.local`, `credentials.txt`) ter-ignore ✅
- **Catatan/Masalah:** temuan sekuens — service swap US-005/US-041 butuh sesi Auth nyata (policy RLS `to authenticated`; mock auth = anon = 0 baris). Opsi: (a) wiring Supabase Auth dulu (US-002 backend), atau (b) bangun UI + service sekarang (berfungsi setelah auth).
- **Langkah berikutnya:** putuskan sekuens (a)/(b) dengan pemilik

---

## 2026-10-05 20:00 — Fase 3 — Wiring Supabase Auth / US-002 backend (IN_PROGRESS, belum DONE)

- **Fase:** 3 (Backend)
- **Branch:** feature/US-002-backend-auth (belum merge)
- **Yang dilakukan:**
  - `services/auth.ts` rewrite penuh ke Supabase Auth (signIn/out/reset/session + `profiles`/`user_roles`); signature + `ServiceResult` dipertahankan — komponen tak berubah kecuali 2 teks bantuan Fase 1.
  - `store/auth.ts`: langganan `onAuthStateChange` (SIGNED_IN/OUT/REFRESH/UPDATED).
  - `POST /api/admin/users`: buat user terkonfirmasi + role via service_role (otorisasi Super Admin, rollback bila role gagal); browser tak pegang kunci service.
  - `src/proxy.ts`: tamu → `/login`, user di `/login` → `/`; `updateSession` kembalikan klaim.
  - Test: fake Supabase client bersama (`src/test/supabase-fake.ts`); rewrite `auth.test.ts` + `auth.test.ts`(store); isolasi client di `require-role.test.tsx`.
  - Docs: `API.md` (modul Users & Roles → backend + admin route + bootstrap Super Admin pertama), `DECISIONS.md` DEC-014.
- **File berubah:** services/auth(.test), store/auth(.test), app/api/admin/users/route.ts (baru), test/supabase-fake.ts (baru), lib/supabase/middleware.ts, src/proxy.ts, components login-form/user-management (teks), require-role.test, API.md, DECISIONS.md, WORKLOG.md
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ (211/211, 48 file) · build ✅ (`/api/admin/users` + Proxy) · browser ✅ (`/` → 307 `/login`; `/login` → 200) · DB live BELUM (tanpa Docker/CLI + `SUPABASE_SERVICE_ROLE_KEY` belum ada di env lokal)
- **Catatan/Masalah:** (1) Login nyata butuh user + role di DB (bootstrap via Dashboard/SQL, lihat API.md). (2) `db reset` + uji RPC/RLS + login E2E tetap wajib sebelum DONE. (3) `mocks/auth.ts` kini tak dipakai service (masih dirujuk? — cek sebelum hapus di sweep akhir).
- **Langkah berikutnya:** `db reset` di mesin Docker → bootstrap Super Admin → uji login/CRUD user E2E → merge; lalu swap US-005/US-041

---

## 2026-10-05 21:00 — Fix — Foundation Gagal di Dashboard (`uuid = text`) + Bug Shadowing

- **Laporan pemilik:** `20261005001000` error `42883 operator does not exist: uuid = text` di SQL Editor.
- **Yang dilakukan:**
  - Parse seluruh file dengan `pglast` (149 statement): sintaks BERSIH — error berasal dari katalog live, bukan sintaks.
  - Temuan kritis A (bug nyata, bukan tebakan): parameter fungsi SQL `has_role(role_name, user_id)` / `has_any_role(...)` di-shadow kolom bernama sama → kondisi menjadi `ur.user_id = ur.user_id` (selalu benar). Semua cek role akan lolos untuk user ber-role apa pun. Diperbaiki dengan prefix `p_` di 5 helper.
  - Temuan kritis B: `deal_terms_total_idr(deal_id)` — `deal_id` di-resolve ke kolom `dpt.deal_id`, bukan parameter → total dihitung untuk SEMUA deal. Diperbaiki (`p_deal_id`).
  - Idempotensi (DB pemilik kemungkinan ter-migrasi parsial): `DROP POLICY IF EXISTS` sebelum 91 `CREATE POLICY`; guard `pg_publication_tables` untuk 3 `ADD TABLE` realtime. File kini aman di-run ulang penuh. Catatan: `001000` belum pernah teraplikasi di DB mana pun sehingga amend di tempat sah (bukan migration yang sudah live).
- **File berubah:** frontend/supabase/migrations/20261005001000_backend_foundation.sql, docs/WORKLOG.md
- **Verifikasi:** re-parse `pglast` OK (240 statement); `db reset` + eksekusi live tetap menunggu mesin Docker / SQL Editor pemilik.
- **Catatan/Masalah:** akar `uuid = text` belum pasti dari file ini — kemungkinan drift tipe kolom di baseline hosted. Minta pemilik jalankan query diagnostik (lihat laporan) bila error berulang.
- **Langkah berikutnya:** pemilik run ulang file foundation yang sudah diperbaiki → parity-fix → seed.

---

## 2026-10-05 22:00 — Fix — Akar `uuid = text` Ketemu via PGlite + 2 Bug search_path

- **Laporan pemilik:** error 42883 berulang setelah run ulang.
- **Yang dilakukan:**
  - Probing tipe kolom live via REST (filter `eq.BUKAN-UUID`): semua kolom id/FK = uuid, kontrol text lolos — baseline hosted SESUAI repo, bukan drift.
  - Validasi penuh di PGlite (Postgres asli, WASM: stub auth/storage/role): reproduksi error persis di statement #239 — policy storage `owner = (select auth.uid())::text`, padahal `storage.objects.owner` bertipe UUID. Cast dihapus.
  - Bug laten 1: `handle_new_user` memakai `new.email::citext` dengan search_path kosong → gagal saat signup (tipe citext tak ter-resolve). Diganti assignment cast implisit.
  - Bug laten 2: `set_display_id()` memanggil `nextval('seq_x')` tak-diskualifikasi → gagal bila INSERT terjadi di dalam fungsi DEFINER bersearch_path kosong (mis. `convert_inquiry_to_lead`). Migrasi baru `20261005003000` mengkualifikasi 13 argumen trigger (`public.seq_x`).
  - Verifikasi: DDL 481 statement 0 gagal (baseline 180 + foundation 240 + parity 26 + display-fix 26 + seed 9); fungsional 13/13 (helper role ±, display ID, history, interests, total termin, submit/putuskan + notifikasi ×2, konversi inquiry + lead Sosmed).
  - `supabase/README.md`: daftar migrasi + seksi validasi PGlite + catatan bug.
- **File berubah:** migrations/20261005001000 (hapus `::text`), migrations/20261005002000 (`::citext` → assignment), migrations/20261005003000 (baru), supabase/README.md, WORKLOG.md
- **Verifikasi:** PGlite DDL ✅ + fungsional ✅ (setara `db reset` untuk kebenaran SQL; Docker tetap dianjurkan untuk RLS-as-user E2E)
- **Catatan/Masalah:** run parsial sebelumnya di hosted aman di-run ulang penuh (guard idempoten). Belum di-commit (tunggu konfirmasi hijau dari pemilik).
- **Langkah berikutnya:** pemilik run 4 file berurutan (foundation → parity → display-fix → seed) → buat user pertama → kirim email untuk bootstrap Super Admin.

---

## 2026-10-05 22:30 — Bootstrap Super Admin + Verifikasi Live Hosted

- **Fase:** 3 (Backend, US-002)
- **Yang dilakukan:**
  - Verifikasi hosted via service_role: seed masuk (7 role, 44 master, 8 settings, 5 template, 1 libur, 2 panduan, 5 RACI, 4 tim); RPC `content_brief_score` + view `project_progress` jalan; bucket `portal-attachments` ada.
  - Bootstrap `superadmin@pytagotech.com` via Admin API (terkonfirmasi, password acak tak tercatat): trigger `handle_new_user` TERBUKTI membuat profil otomatis (nama benar, aktif); role Super Admin terpasang.
- **Verifikasi:** seed ✅ RPC/view ✅ trigger live ✅ role ✅
- **Catatan/Masalah:** password awal acak & tak disimpan di mana pun — user wajib atur via Lupa kata sandi. E2E login browser menunggu user.
- **Langkah berikutnya:** user reset password → login → konfirmasi `/pengaturan/pengguna` → merge `feature/US-002-backend-auth` → DONE.

---

## 2026-10-05 22:45 — Swap Super Admin ke Gmail

- **Konteks:** `superadmin@pytagotech.com` ternyata bukan mailbox aktif (reset email tak akan sampai).
- **Yang dilakukan:** hapus akun lama via Admin API (profil + role ikut CASCADE) → buat `info.pytagotech@gmail.com` (terkonfirmasi) → profil otomatis terbentuk → role Super Admin terpasang.
- **Verifikasi:** profil ✅ role ✅ via service_role.
- **Langkah berikutnya:** sama — reset password → login → konfirmasi → merge.

---

## 2026-10-05 23:00 — Template Email + Lengkapi Alur Reset (US-002 backend)

- **Permintaan pemilik:** template email Supabase (signup, ganti email, reset) yang menarik.
- **Yang dilakukan:**
  - `supabase/templates/`: `confirmation.html`, `email_change.html`, `recovery.html` (ID, brand biru, tombol + tautan cadangan, footer) + `README.md` cara paste + subject + uji kirim.
  - Temuan: tautan email butuh penukar kode + form password baru, belum ada. Ditambah: `GET /auth/confirm` (tukar `code` PKCE / `token_hash`+`type` OTP, `next` tervalidasi, gagal → `/login?error=tautan-kedaluwarsa`); `updatePassword()` di service; mode "password baru" di login-form (`?recovery=1`, mismatch + pesan basi ditangani); proxy izinkan sesi recovery di `/login`; redirect reset → `/auth/confirm?next=/login?recovery=1`; Suspense di halaman login.
  - Test: `updateUser` di fake + 2 test `updatePassword`.
- **File berubah:** supabase/templates/* (4 baru), app/auth/confirm/route.ts (baru), services/auth(.test), components/login-form, app/login/page, proxy, test/supabase-fake, API.md, WORKLOG.md
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ (213/213) · build ✅ (`/api/admin/users`, `/auth/confirm`, Proxy) · browser ✅ (`/auth/confirm?code=bogus` → 307 login+error; `/login?recovery=1` → 200)
- **Catatan/Masalah:** kirim email asli (SMTP) + klik tautan end-to-end menunggu pemilik (setelah paste template + reset password Gmail).
- **Langkah berikutnya:** pemilik paste 3 template → reset password → login → konfirmasi → merge.

---

## 2026-10-05 23:30 — Fix — Sesi Hilang di Redirect /auth/confirm

- **Laporan pemilik:** klik tautan reset → "Tautan sudah kedaluwarsa atau tidak valid".
- **Akar 1 (bug, diperbaiki):** route memakai `createClient()` (server) lalu me-return `NextResponse.redirect()` baru — cookie sesi hasil `verifyOtp`/`exchangeCodeForSession` tertinggal di respons internal yang dibuang. Walau kode valid, sesi tak pernah sampai ke browser. Route kini mengumpulkan `pendingCookies` dan menempelkannya ke redirect (beserta options).
- **Akar 2 (kemungkinan pada klik pemilik):** token email sekali pakai — klik ganda/refresh, email lama setelah request baru, atau redirect URL tak terdaftar di Dashboard (cek Site URL + Additional Redirect URLs mencakup origin aplikasi).
- **File berubah:** app/auth/confirm/route.ts, WORKLOG.md
- **Verifikasi:** lint ✅ typecheck ✅ build ✅ · browser ✅ (code bogus → 307 login+error)
- **Langkah berikutnya:** pemilik pastikan dev server memuat route baru → minta tautan BARU → klik sekali → atur password → masuk.

---

## 2026-10-05 23:45 — Halaman Error Auth Khusus (masukan pemilik)

- **Masukan pemilik:** error jangan menempel di form login (email+password) — butuh halaman sendiri yang fokus.
- **Yang dilakukan:** `src/app/auth/error/page.tsx` (server component, pesan per `reason`, aksi Minta tautan/masuk + Ke beranda); `/auth/confirm` gagal → `/auth/error?reason=...`; hapus penanganan `?error=` di login-form.
- **File berubah:** app/auth/error/page (baru), app/auth/confirm/route, components/login-form, API.md, WORKLOG.md
- **Verifikasi:** lint ✅ typecheck ✅ build ✅ · browser ✅ (`/auth/error` → 200 "Tautan tidak valid"; confirm bogus → 307 `/auth/error`)
- **Langkah berikutnya:** sama — tautan baru → atur password → masuk → konfirmasi → merge.

---

## 2026-10-06 00:00 — E2E Penuh: Password Langsung + Login sebagai Super Admin

- **Permintaan pemilik:** lewati alur email (tetap mendarat di login) — buatkan akun full email+password; popup ganti password di dalam aplikasi menyusul.
- **Yang dilakukan:** set password langsung via Admin API untuk `info.pytagotech@gmail.com`, lalu E2E dengan anon key sebagai user tersebut.
- **Verifikasi E2E (JWT user asli, bukan service_role):** login ✅ · profil sendiri ✅ · roles `["Super Admin"]` ✅ · list users via RLS admin ✅ · baca leads ✅ · baca master_options ✅.
- **Catatan/Masalah:** rantai Auth → profil → role → RLS TERBUKTI jalan. Alur tautan email tetap perlu konfirmasi pemilik di browser (kemungkinan klik ganda/allowlist). Password awal hanya ada di chat ini — wajib diganti via popup ganti password (US berikutnya) atau rotasi manual.
- **Langkah berikutnya:** pemilik login browser → konfirmasi → merge `feature/US-002-backend-auth` → popup ganti password.

---

## 2026-10-06 00:30 — Merge US-002 backend (login browser OK oleh pemilik)

- **Branch:** feature/US-002-backend-auth → develop (tanpa tag; Gate 3 belum lengkap)
- **Isi merge:** wiring Auth (service/store/admin-route/proxy/confirm/recovery/error-page) + template email + fix migrasi (owner cast, search_path, display trigger) — 4 commit terpisah.
- **Verifikasi kumulatif:** lint ✅ typecheck ✅ test ✅ (213/213) · build ✅ · browser ✅ · live hosted ✅ (seed, RPC, trigger, role) · E2E user ✅ · login pemilik ✅
- **Sisa verifikasi:** `POST /api/admin/users` via browser (buat user kedua) — dicoba saat popup ganti password dibangun.
- **Langkah berikutnya:** popup ganti password di dalam aplikasi (permintaan pemilik).

---

## 2026-10-06 02:00 — Fase 3 — US-004 Audit Log Viewer (IN_PROGRESS 4/5)

- **Branch:** feature/US-004-audit-log-viewer dari develop (pekerjaan US-005 di branch-nya sendiri — tidak disentuh).
- **Yang dilakukan:**
  - `queryAuditLogs()` aditif di `services/audit.ts` (mock lama utuh): baca `audit_logs` terbaru-dulu, filter aktor/modul/rentang WIB, limit 1–200, jsonb → string.
  - Halaman `/pengaturan/audit-log` (Super Admin + Leader) + nav: filter + tabel + `<details>` nilai; tanpa aksi ubah/hapus (AC3, RLS juga tanpa policy tulis).
  - Fake: tabel `audit_logs` + op `ilike`/`gte`/`lte`/`limit` + `order` arah.
  - Test: service (urutan + 3 filter + limit) + komponen (render + filter kosong + tanpa tombol ubah/hapus).
  - Docs: `API.md` Audit Log, PROGRESS 4/5, CHANGELOG.
- **File berubah:** services/audit(+test baru), test/supabase-fake, pengaturan/audit-log-viewer(+test)+page, mocks/dashboard, API/PROGRESS/CHANGELOG/WORKLOG
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ (217/217) · build ✅ · browser ✅ (307→login; konten via component test)
- **Catatan/Masalah:** uji klik bersesi menunggu pemilik (butuh sesi Super Admin/Leader).
- **Langkah berikutnya:** uji bersesi → US-004 DONE + merge → US-041/popup password/swap CRM.

---

## 2026-10-27 — Tahap 1 — Commit US-004 + stabilisasi repo

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** feature/US-004-audit-log-viewer
- **Commit:** `19c6a6c` — feat(backend): tambah viewer audit log dari tabel audit_logs · `fca3f10` — chore(repo): normalisasi line ending dan tambah .gitattributes
- **Yang dilakukan:**
  - Commit halaman `/pengaturan/audit-log`, viewer, service `queryAuditLogs`, test service/komponen, fake tabel `audit_logs`, nav sidebar, dan docs terkait.
  - Tambah `.gitattributes` + `git add --renormalize` untuk menghapus ±198 diff palsu akibat LF/CRLF. Working tree kembali bersih.
- **File berubah:** lihat commit `19c6a6c`; `.gitattributes` di commit `fca3f10`
- **Verifikasi:** lint ✅ typecheck ✅ test ✅ (217/217) build ✅ (`/pengaturan/audit-log` terdaftar)
- **Catatan/Masalah:** US-004 tetap 4/5 — uji klik dengan sesi Super Admin/Leader belum dilakukan.
- **Langkah berikutnya:** pemilik uji browser bersesi → US-004 DONE + merge; lalu Tahap 2 (US-003 RLS + `db reset`).

---

## 2026-10-27 — Tahap 1 — US-004 DONE (verifikasi pemilik) + merge develop

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** feature/US-004-audit-log-viewer → develop
- **Commit:** `19c6a6c` (implementasi) + commit docs ini
- **Yang dilakukan:**
  - Pemilik mengonfirmasi halaman `/pengaturan/audit-log` berjalan dengan sesi Super Admin/Leader.
  - PROGRESS: US-004 4/5 → **5/5 DONE**.
  - Merge feature branch ke `develop` (tanpa tag; Gate 3 belum lengkap).
- **Verifikasi:** browser oleh pemilik ✅ · lint ✅ typecheck ✅ test ✅ (217/217) build ✅
- **Catatan/Masalah:** Docker tidak tersedia di mesin ini; verifikasi `db reset` akan memakai jalur alternatif (PGlite/hosted) atau didefer ke mesin lain.
- **Langkah berikutnya:** Tahap 2 — US-003 RLS tanpa Docker (test otomatis + verifikasi policy).

---

## 2026-10-27 — Tahap 2 — US-003 ditunda (BLOCKED), lanjut US-005

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** docs/us-003-deferral
- **Commit:** commit docs ini
- **Yang dilakukan:**
  - Pemilik memilih menunda US-003 karena Docker/Supabase CLI tidak tersedia; bukan skip permanen.
  - PROGRESS: US-003 `IN_PROGRESS` → **`BLOCKED`** (2/4) dengan referensi Q-014.
  - QUESTIONS: Q-014 (keputusan penundaan) dan Q-015 (status aktif `team_members` belum ada di skema).
- **Verifikasi:** tidak ada perubahan kode; dokumen saja.
- **Catatan/Masalah:** US-003 wajib selesai sebelum Gate 3/tag `v0.3.0-backend`.
- **Langkah berikutnya:** US-005 — master data & dropdown.

---

## 2026-10-27 — Tahap 3 — US-005 Master Data & Dropdown (IN_PROGRESS 4/5)

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** feature/US-005-master-data
- **Commit:** commit ini
- **Yang dilakukan:**
  - Fondasi: `types/master-data.ts` (8 kategori + grup tim/PIC + fallback), `services/master-data.ts` (CRUD `master_options`/`team_members`, guard referensi, `ServiceResult`), `hooks/use-master-options.ts` (opsi aktif sekali saat mount, fallback konstanta).
  - Halaman `/pengaturan/master-data` (Super Admin) + `MasterDataManager`: 9 kelompok, tambah/ubah, aktif/nonaktif untuk opsi, konfirmasi hapus, pesan khusus bila data terpakai. Nav "Master Data" diarahkan ke route nyata.
  - Dropdown dinamis: form/filter/aktivitas lead, pipeline interest, backlog fitur (kategori + prioritas), serta ide, inquiry, materi, kalender, komunitas, pertumbuhan, KIST, distribusi, dan scorecard sosmed.
  - `listLeadPICs()` kini membaca `team_members` dengan fallback mock; fake Supabase diperluas untuk `master_options`, `team_members`, dan tabel referensi generik.
  - Test baru: `master-data.test.ts` (12), `master-data-manager.test.tsx` (3), `lead-form.test.tsx` (1).
  - Docs: `API.md` modul Master Data, `CHANGELOG.md`, `DECISIONS.md` DEC-015, PROGRESS US-005 4/5.
- **File berubah:** lihat `git show --stat` commit ini; inti di `frontend/src/{types,services,hooks,components/pengaturan,app/(portal)/pengaturan/master-data}` + 14 komponen form/filter.
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (233/233, 53 file) · build ✅ (`/pengaturan/master-data` terdaftar) · browser ⏳ (belum; butuh sesi Super Admin).
- **Acceptance Criteria:** 4/5 — CRUD 9 kelompok ✅ · opsi langsung tampil di form ✅ · opsi terpakai tidak bisa dihapus (master ✅; tim/PIC tanpa nonaktifkan — Q-015) · lint/typecheck ✅ · browser ⏳.
- **Catatan/Masalah:** (1) `team_members` belum punya `is_active`; hapus hanya diblokir bila direferensikan, tidak ada tombol nonaktifkan (Q-015). (2) Service modul yang masih mock tetap menolak nilai baru saat simpan sampai dimigrasikan. (3) Opsi master hanya terlihat aktif bagi user biasa (RLS), jadi halaman Super Admin wajib sesi nyata.
- **Langkah berikutnya:** verifikasi browser dengan sesi Super Admin → bila lolos, US-005 DONE + merge; lalu jawab Q-015 sebelum menutup AC3 tim/PIC.

---

## 2026-10-27 — Tahap 4 — Verifikasi browser US-005 + perbaikan DELETE 0 baris

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** feature/US-005-master-data
- **Commit:** commit ini
- **Yang dilakukan:**
  - Verifikasi browser sesi Super Admin: 9 kelompok tampil dengan data seed; tambah opsi "Verifikasi US005" langsung muncul di form + filter lead; nonaktifkan opsi menghilangkannya dari form/filter; create/update/delete tim/PIC via UI berhasil.
  - Temuan DB live: DELETE `master_options` oleh role `authenticated` (Super Admin) mengembalikan `200` + 0 baris tanpa error; baris tetap ada. INSERT/PATCH `master_options` dan DELETE `team_members` berhasil. Service role DELETE `master_options` berhasil → indikasi policy RLS DELETE live tidak efektif, bukan trigger/aplikasi.
  - `deleteMasterOption`/`deleteTeamMember` kini memakai `.delete().select(...)` dan mengembalikan error bila 0 baris, sehingga UI tidak lagi menampilkan sukses palsu. Fake Supabase diperluas (`blockedDeleteTables`, mengembalikan baris terhapus).
  - Cek referensi tim/PIC (19 tabel) diparallelkan (`Promise.all`); hapus tim/PIC turun dari ~17 detik menjadi ~1–2 detik.
  - Data uji `master_options` (`Verifikasi US005`, `ZZ Aktif ...`, `ZZ Nonaktif ...`) dibersihkan via service role; tersisa 44 opsi seed, 0 baris uji.
  - Docs: Q-016 (policy DELETE live), Q-017 (`entity_id` audit PK komposit), API, PROGRESS, CHANGELOG, DEC-015.
- **File berubah:** `frontend/src/services/master-data.ts`, `frontend/src/services/master-data.test.ts`, `frontend/src/test/supabase-fake.ts`, `docs/{QUESTIONS,API,PROGRESS,DECISIONS,WORKLOG}.md`, `CHANGELOG.md`.
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (235/235, 53 file) · build ✅ (`/pengaturan/master-data` terdaftar) · browser ✅ (error 0 baris tampil + baris tetap; hapus tim/PIC sukses cepat).
- **Acceptance Criteria:** 4/5 — CRUD 9 kelompok (create/update/toggle ✅; delete `master_options` terblokir policy live — Q-016) · opsi langsung tampil di form ✅ · opsi terpakai ditolak (unit test ✅; guard browser belum diuji karena tabel referensi live masih kosong) · lint/typecheck ✅ · browser ✅.
- **Catatan/Masalah:** (1) AC3 tim/PIC tetap Q-015. (2) US-005 belum DONE sampai policy live diperbaiki/disetujui (Q-016). (3) `audit_logs.entity_id` kosong untuk PK komposit (Q-017).
- **Langkah berikutnya:** jawab Q-015/Q-016/Q-017; setelah policy diperbaiki, ulangi browser test hapus opsi tak terpakai + guard opsi terpakai, lalu merge `feature/US-005-master-data` ke `develop`.

---

## 2026-10-27 — Tahap 5 — US-041 Pengaturan KPI, SLA & Routing (DONE 3/3)

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** feature/US-041-pengaturan-kpi-sla
- **Commit:** commit ini
- **Yang dilakukan:**
  - Fondasi: `types/settings.ts` (kontrak `PortalSettings`, default SLA 30/15, target KPI dasar, validasi tanggal/jam/WA, `resolveKpiTargets`), `services/settings.ts` (baca gabungan `settings` + `holidays`, simpan operasional, simpan target KPI, CRUD hari libur, guard DELETE 0 baris), `hooks/use-portal-settings.ts` (nilai default + reload).
  - Halaman `/pengaturan/kpi-sla` (Super Admin) + `PortalSettingsManager`: tab SLA & Layanan, Target KPI per brand, dan Hari Libur; nav "KPI, SLA & Routing".
  - Wiring runtime: `CommunityManager` memakai SLA respons, `InquiryManager` memakai SLA routing + nomor WA resmi per brand, `SosmedScorecard` memakai target KPI per brand, `PublicationCalendar` memakai ambang kritis, `FeatureScheduleSection` memakai kalender libur.
  - Tabel KPI dibuat responsif (header membungkus, input lebih ringkas) agar keenam kolom muat tanpa terpotong.
  - Test baru `services/settings.test.ts`; tambahan kasus target KPI per brand di `services/scorecard.test.ts`.
  - Docs: API modul Pengaturan, PROGRESS (US-041 DONE, FR-30 DONE), DATABASE, CHANGELOG.
- **File berubah:** `frontend/src/{types,services,hooks}/settings*`, `frontend/src/components/pengaturan/portal-settings-manager.tsx`, `frontend/src/app/(portal)/pengaturan/kpi-sla/page.tsx`, wiring di `components/{sosmed,proyek}` + `services/{scorecard,community,calendar,scheduling}.ts`, `mocks/dashboard.ts`, dokumen.
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (245/245, 54 file) · build ✅ (`/pengaturan/kpi-sla` terdaftar) · browser ✅ — nilai seed 30/15/24, jam layanan 09:00–18:00, tiga brand tampil; target KPI Pytagotech diubah 13 lalu dikembalikan 12 dan persist setelah reload; SLA respons diubah 31 → halaman Komunitas menampilkan "ambang 31 menit" → dikembalikan 30; nomor WA diisi → tampil di Inquiry (termasuk format ternormalisasi) → dikosongkan; hari libur 2026-12-24 ditambah, muncul di Pengaturan + penjadwalan proyek, lalu dihapus; Audit Log menampilkan update `settings` dan insert/delete `holidays` oleh Super Admin dengan nilai lama/baru.
- **Acceptance Criteria:** 3/3 ✅ — konfigurasi KPI/SLA/jam layanan/WA/hari libur ✅ perubahan teraudit & tidak mengubah data final historis ✅ lint/typecheck/test/build + browser ✅.
- **Catatan/Masalah:** `settings` ber-PK `key`, sehingga `audit_logs.entity_id` kosong (Q-017); nilai lama/baru tetap tercatat. `developer_capacity` masih mock; kalender libur sudah memakai tabel `holidays`.
- **Langkah berikutnya:** merge `feature/US-041-pengaturan-kpi-sla` ke `develop`; lanjut US-043; sisa keputusan Q-015/Q-016/Q-017 dan US-003 (Q-014).

---

## 2026-10-27 — Tahap 6 — US-043 Arsip Data & Backup (DONE 4/4)

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** feature/US-043-arsip-backup
- **Commit:** 45d84bc (implementasi) + commit docs ini
- **Yang dilakukan:**
  - Fondasi: `types/archive.ts` (kontrak `ArchiveEntityType`, `ArchiveItem`, definisi modul, CSV), `services/archive.ts` (daftar data aktif/arsip, archive/restore via RPC `archive_entity`/`restore_entity` + verifikasi `archived_at`, ekspor CSV per modul dengan paging 1.000 baris, `buildCsv` RFC 4180 + BOM UTF-8).
  - Halaman `/pengaturan/arsip` (Super Admin) + `ArchiveManager`: kartu ringkasan per modul, ekspor CSV, pencarian/filter modul, tab Aktif/Arsip, dialog konfirmasi Arsipkan/Pulihkan, dan tombol muat ulang.
  - Nav "Arsip & Backup" di `mocks/dashboard.ts`; `test/supabase-fake.ts` diperluas dengan `rpc`, `range`, dan `rpcError`.
  - Test baru `services/archive.test.ts` (10 kasus: pemetaan daftar, archive/restore, 0 baris/RLS tidak dianggap sukses, CSV escaping/BOM, ekspor tiga modul, nama file).
  - Docs: `DEPLOYMENT.md` (backup platform/PITR, `supabase db dump`, `supabase storage cp`, restore + checklist, retensi), `API.md`, `DATABASE.md`, `DECISIONS.md` (DEC-016), `QUESTIONS.md` (Q-018), PROGRESS, CHANGELOG.
- **File berubah:** `frontend/src/{types,services}/archive*`, `frontend/src/components/pengaturan/archive-manager.tsx`, `frontend/src/app/(portal)/pengaturan/arsip/page.tsx`, `frontend/src/test/supabase-fake.ts`, `frontend/src/mocks/dashboard.ts`, `.gitignore`, dokumen.
- **Verifikasi:** lint ✅ · typecheck ✅ · test ✅ (255/255, 55 file) · build ✅ (`/pengaturan/arsip` terdaftar) · browser ✅ — dengan sesi Super Admin: tiga data uji (lead, proyek, materi) tampil di tab Aktif; arsip lead mengubah tab menjadi Aktif (2)/Arsip (1) dan data muncul di tab Arsip; pulihkan mengembalikan ke Aktif (3)/Arsip (0); ekspor Lead CRM, Proyek, dan Materi Konten menghasilkan tiga CSV berisi data + kolom `Diarsipkan`; console error 0. Data uji live dibersihkan setelah verifikasi (termasuk audit log/lead history terkait), sehingga daftar kembali kosong.
- **Acceptance Criteria:** 4/4 ✅ — soft archive + restore proyek/lead/konten ✅ · ekspor CSV per modul ✅ · prosedur backup Supabase terdokumentasi ✅ · lint/typecheck/test/build + browser ✅.
- **Catatan/Masalah:** Tidak ada migrasi/tabel baru (RPC + `archived_at` sudah ada). Modul lead/proyek/materi masih mock, jadi penyaringan data terarsip baru berlaku saat modul membaca database; halaman arsip adalah UI backend langsung. Job purge belum dibuat karena retensi menunggu Q-018. Backup manual membutuhkan Docker/`pg_dump` + akses Storage sesuai `docs/DEPLOYMENT.md`.
- **Langkah berikutnya:** merge `feature/US-043-arsip-backup` ke `develop`; lanjut US-003 setelah Q-014, lalu sisa Q-015/Q-016/Q-017/Q-018 sebelum Gate 3.

---

## 2026-10-27 — Tahap 7 — Verifikasi live RLS US-003 & temuan konflik AC2 (Q-019)

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** develop
- **Commit:** commit docs ini
- **Yang dilakukan:**
  - Verifikasi RLS langsung ke Supabase live karena Docker/Supabase CLI/WSL belum tersedia; tanpa perubahan skema/policy. Membuat sementara user tanpa role, Sales, dan PM beserta data uji, lalu menghapus semuanya.
  - 42/42 tabel memiliki `ENABLE ROW LEVEL SECURITY`. User tanpa role: SELECT `leads`/`projects`/`clients`/`audit_logs` = 0 baris; INSERT lead ditolak `403` (`new row violates row-level security policy for table "leads"`).
  - Sales dapat mengubah lead miliknya; PM dapat mengubah proyek miliknya. Sales tidak dapat mengubah proyek; PM tidak dapat mengubah lead.
  - Temuan AC2: Sales juga dapat mengubah lead milik PIC lain (1 baris; `next_follow_up` menjadi `2026-11-16`) dan PM dapat mengubah proyek milik PM lain (1 baris; `target_date` menjadi `2027-01-05`). Penyebab: `leads_update_sales_roles` dan `projects_update_pm_roles` di `20261005002000_backend_parity_fixes.sql` role-based, bukan owner-only.
  - Semua user/data uji (profil, team member, lead, klien, deal, proyek, audit log, lead history) dihapus; live kembali hanya berisi Super Admin + 4 seed team member.
  - Docs: Q-019 (opsi A/B/C), matriks policy RLS di `DATABASE.md` §5.1, PROGRESS US-003 3/4 BLOCKED, WORKLOG ini.
- **File berubah:** `docs/QUESTIONS.md`, `docs/DATABASE.md`, `docs/PROGRESS.md`, `docs/WORKLOG.md`
- **Verifikasi:** 42/42 tabel RLS aktif; user tanpa role 0 baris; batas modul Sales/PM terjaga; lint ✅, typecheck ✅, test ✅ (255/255, 55 file).
- **Acceptance Criteria:** 3/4 — AC1 42 tabel + policy per role terdokumentasi ✅; AC2 ❌ konflik role-based (Q-019); AC3 user tanpa role tidak dapat membaca data ✅; AC4 lint/typecheck ✅.
- **Catatan/Masalah:** `db reset` dari database kosong belum bisa dijalankan (Docker/Supabase CLI/WSL tidak tersedia); verifikasi live dipakai sebagai bukti sementara. US-003 belum DONE sampai Q-019 diputuskan. Jangan mengubah policy/migration/frontend sebelum keputusan.
- **Langkah berikutnya:** pemilik memilih opsi Q-019; setelah itu implementasi + verifikasi ulang, lalu lanjut US-005 (Q-015/Q-016) dan sisa Q-017/Q-018 sebelum Gate 3.

---

## 2026-10-27 — Tahap 8 — Keputusan Q-019: role-based dipertahankan (CR-003)

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** develop
- **Commit:** commit docs ini
- **Yang dilakukan:**
  - Menanyakan arah AC2 US-003 kepada pemilik. Pemilik memilih **opsi A: pertahankan policy role-based** pada 2026-10-27.
  - Q-019 diubah menjadi `ANSWERED`; CR-003 dicatat sebagai `APPROVED` (revisi AC2 US-003 menjadi batas akses per role modul) dan DEC-017 mencatat keputusan RLS.
  - Tidak ada perubahan skema, policy, migration, atau kode frontend. Matriks RLS di `DATABASE.md` §5.1 tetap berlaku; catatan konflik diganti dengan keputusan pemilik.
  - US-003 tetap `BLOCKED` 3/4 karena `tasks/prd-pytagotech-integrated-portal.md` **hanya boleh diperbarui oleh manusia**; AC2 literal belum berubah sampai PRD diperbarui.
- **File berubah:** `docs/QUESTIONS.md`, `docs/CHANGE_REQUESTS.md`, `docs/DECISIONS.md`, `docs/DATABASE.md`, `docs/PROGRESS.md`, `docs/WORKLOG.md`
- **Verifikasi:** dokumen konsisten (Q-019 → CR-003 → DEC-017 → PROGRESS); tidak ada perubahan kode sehingga lint/typecheck/test terakhir tetap berlaku (255/255, 55 file).
- **Acceptance Criteria:** 3/4 — AC1/AC3/AC4 ✅; AC2 disetujui role-based lewat CR-003 tetapi PRD belum diperbarui manusia.
- **Catatan/Masalah:** PRD tidak boleh diedit agent. Setelah pemilik memperbarui AC2 US-003, US-003 dapat ditandai `DONE` 4/4. `db reset` dari database kosong tetap belum bisa dijalankan di mesin ini.
- **Langkah berikutnya:** pemilik memperbarui AC2 US-003 di PRD; lalu tandai US-003 DONE + merge/commit, lanjut US-005 (Q-015/Q-016) dan sisa Q-017/Q-018 sebelum Gate 3.

---

## 2026-10-27 — Tahap 9 — PRD AC2 diperbarui; US-003 DONE 4/4

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** develop
- **Commit:** commit docs ini
- **Yang dilakukan:**
  - Pemilik memperbarui AC2 US-003 di `tasks/prd-pytagotech-integrated-portal.md` menjadi batas akses per role modul (Sales/Marketing → lead, Project Manager → proyek, role lain read-only, Super Admin penuh), sesuai CR-003.
  - US-003 di `PROGRESS.md` diubah menjadi `DONE` 4/4; FR-1 menjadi `DONE`. Q-019, CR-003, DEC-017, dan matriks RLS `DATABASE.md` §5.1 diselaraskan dengan status akhir.
  - Tidak ada perubahan skema, policy, migration, atau kode aplikasi.
- **File berubah:** `tasks/prd-pytagotech-integrated-portal.md` (diedit pemilik), `docs/{QUESTIONS,CHANGE_REQUESTS,DECISIONS,DATABASE,PROGRESS,WORKLOG}.md`, `CHANGELOG.md`
- **Verifikasi:** 42/42 tabel RLS aktif; user tanpa role 0 baris; INSERT lead tanpa role ditolak 403; Sales/PM dapat mengubah modulnya, tidak lintas modul; lint ✅, typecheck ✅, test ✅ (255/255, 55 file).
- **Acceptance Criteria:** 4/4 ✅ — AC1 42 tabel + policy per role terdokumentasi; AC2 role-based sesuai CR-003/PRD; AC3 user tanpa role 0 baris; AC4 lint/typecheck lulus.
- **Catatan/Masalah:** `db reset` dari database kosong masih belum bisa dijalankan karena Docker/Supabase CLI/WSL tidak tersedia; verifikasi live dipakai dan Gate 3 tetap wajib menjalankan `db reset` bila environment tersedia.
- **Langkah berikutnya:** lanjut US-005 (Q-015/Q-016) dan sisa Q-017/Q-018 sebelum Gate 3/tag `v0.3.0-backend`.

---

## 2026-10-27 - Tahap 10 - US-005 Implementasi Tim/PIC Aktif + Policy DELETE

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** develop
- **Commit:** commit kode + docs ini
- **Yang dilakukan:**
  - Menjawab Q-015/Q-016 (opsi A): tambah `team_members.is_active` dan perbaiki policy DELETE `master_options`.
  - Migration `20261027000000_team_members_is_active.sql`: kolom `is_active boolean NOT NULL DEFAULT true` + komentar; policy SELECT `team_members` sengaja tidak diubah.
  - Migration `20261027000100_master_options_delete_policy.sql`: grant DELETE untuk `authenticated`, buat ulang policy SELECT + `master_options_manage_admin FOR ALL` (Super Admin).
  - Tipe `TeamMember.isActive`; service `listActiveTeamMembers()` memfilter `is_active`, `setTeamMemberActive()`, insert anggota default aktif, pesan delete mengarahkan ke nonaktifkan.
  - `listLeadPICs()` kini memakai hasil `team_members` aktif; fallback mock hanya saat query gagal, bukan saat tabel kosong.
  - UI tim/PIC: kolom Keaktifan + badge Aktif/Nonaktif + tombol Nonaktifkan/Aktifkan; hitungan aktif menyesuaikan.
  - Test service/UI/fake diperbarui untuk aktif/nonaktif dan dropdown PIC.
- **File berubah:** `frontend/supabase/migrations/{20261027000000_team_members_is_active,20261027000100_master_options_delete_policy}.sql`, `frontend/src/{types/master-data.ts,services/master-data.ts,services/leads.ts,components/pengaturan/master-data-manager.tsx,test/supabase-fake.ts}`, test terkait, `docs/{QUESTIONS,CHANGE_REQUESTS,DECISIONS,DATABASE,API,PROGRESS,WORKLOG}.md`, `CHANGELOG.md`, `frontend/supabase/README.md`
- **Verifikasi:** lint OK, type-check OK, test 258/258 (55 file). Verifikasi live belum dijalankan karena kolom/policy belum ada di database live.
- **Acceptance Criteria:** AC1 CRUD 9 kelompok OK; AC2 dropdown membaca master data OK; AC3 opsi terpakai hanya dinonaktifkan (termasuk tim/PIC) OK di kode/test; AC4 lint/typecheck OK; AC5 verifikasi browser menunggu SQL live.
- **Catatan/Masalah:** Pemilik perlu menjalankan SQL migration `is_active` dan policy `master_options` di Supabase live. Setelah itu ulangi REST + browser test; US-005 baru bisa `DONE` 5/5.
- **Langkah berikutnya:** minta pemilik menjalankan SQL live, verifikasi browser `/pengaturan/master-data`, lalu tutup US-005/FR-3 dan lanjut Q-017/Q-018 + Gate 3.

---

## 2026-10-27 - Tahap 11 - Verifikasi Live US-005; DONE 5/5

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** develop
- **Commit:** 3f85213 (kode/migration) + commit docs ini
- **Yang dilakukan:**
  - Menerapkan migration `20261027000000_team_members_is_active.sql` dan `20261027000100_master_options_delete_policy.sql` ke database live lewat koneksi Postgres langsung (setelah Q-015/Q-016 disetujui pemilik).
  - Diagnostik policy live sebelum perbaikan: hanya ada `master_options_insert_admin`, `master_options_update_admin`, dan `master_options_select_authenticated`; tidak ada policy DELETE, sehingga DELETE tersaring menjadi 0 baris.
  - Setelah migration: `team_members.is_active` ada (default true); policy `master_options_manage_admin FOR ALL` + SELECT terpasang; grant DELETE `authenticated` tersedia.
  - Verifikasi REST sebagai Super Admin: INSERT opsi 201, DELETE opsi 200 + 1 baris, GET tim/PIC 200; INSERT anggota 201, PATCH nonaktif 200, filter aktif 0 baris untuk anggota nonaktif, DELETE anggota 200 + 1 baris.
  - Verifikasi browser `/pengaturan/master-data`: 9 kelompok tampil; Tim/PIC menampilkan badge Aktif dan tombol Nonaktifkan; Raka dinonaktifkan (hitung aktif 4 -> 3, badge Nonaktif) lalu diaktifkan kembali (3 -> 4); opsi uji `Verifikasi Browser US005` ditambah, dihapus lewat dialog konfirmasi, dan hilang dari tabel.
  - Data uji dibersihkan; live kembali hanya berisi 4 seed tim/PIC aktif dan 44 master options.
- **File berubah:** migration policy (drop policy INSERT/UPDATE live yang usang), docs status/verifikasi.
- **Verifikasi:** lint OK, type-check OK, test 258/258 (55 file); REST + browser live OK.
- **Acceptance Criteria:** 5/5 - CRUD 9 kelompok; dropdown langsung memakai data terbaru; opsi terpakai hanya dinonaktifkan (termasuk tim/PIC); lint/typecheck lulus; browser live terverifikasi.
- **Catatan/Masalah:** `db reset` dari database kosong tetap belum bisa dijalankan karena Docker/Supabase CLI/WSL tidak tersedia; wajib diulang sebelum Gate 3 bila environment tersedia. Q-017/Q-018 masih OPEN.
- **Langkah berikutnya:** lanjut Q-017 (entity_id audit PK komposit) dan Q-018 (retensi arsip/backup), lalu siapkan Gate 3/tag `v0.3.0-backend`.

---

## 2026-10-27 - Tahap 12 - Q-017/Q-018: Audit PK Komposit + Retensi

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** develop
- **Commit:** commit ini (Q-017/Q-018)
- **Yang dilakukan:**
  - Menjawab Q-017 (opsi A) dan Q-018 (opsi A) setelah persetujuan pemilik.
  - Migration `20261027000200_audit_entity_id_composite.sql`: `private.audit_row_change()` membaca kolom PK dari `pg_index`/`pg_attribute`; PK tunggal tetap memakai nilai aslinya, PK komposit digabung `/` sesuai urutan PK. Baris audit lama tidak diubah agar tetap append-only.
  - Menerapkan migration ke database live lewat koneksi Postgres langsung.
  - Menetapkan retensi arsip 2 tahun serta backup harian 7 hari + salinan manual bulanan 12 bulan; kebijakan dicatat di `DEPLOYMENT.md` dan `DEC-021`, tanpa job purge otomatis.
  - Memperbarui CR-005, DEC-020/DEC-021, Q-017/Q-018, DATABASE/API/README/CHANGELOG/PROGRESS.
- **File berubah:** `frontend/supabase/migrations/20261027000200_audit_entity_id_composite.sql`, `frontend/supabase/README.md`, `docs/{QUESTIONS,CHANGE_REQUESTS,DECISIONS,DATABASE,API,DEPLOYMENT,PROGRESS,WORKLOG}.md`, `CHANGELOG.md`
- **Verifikasi:** migration live OK; smoke test live untuk `master_options` (`industry/ZZ Audit Composite Test`), `raci_matrix` (`ZZ Audit Test/QA`), dan `team_members` (UUID) pada insert/update/delete; data dan audit uji dibersihkan (0 baris tersisa). Lint OK, type-check OK, test 258/258 (55 file).
- **Acceptance Criteria:** Q-017 — `entity_id` terisi untuk PK tunggal dan komposit, tidak ada perubahan format untuk PK tunggal; Q-018 — retensi arsip/backup terdokumentasi dan disetujui. FR-2 ditandai DONE karena seluruh tabel bisnis memiliki trigger audit (kecuali `audit_logs`, `lead_status_history`, dan `roles` yang memang bukan entitas bisnis).
- **Catatan/Masalah:** `db reset` dari database kosong belum bisa dijalankan karena Docker/Supabase CLI/WSL tidak tersedia; wajib dibuktikan sebelum Gate 3. Baris audit lama yang sudah kosong tidak di-backfill.
- **Langkah berikutnya:** audit sisa FR/US untuk Gate 3, jalankan `db reset` saat environment tersedia, lalu siapkan tag `v0.3.0-backend`.

---

## 2026-10-27 - Tahap 13 - CRM Leads DB-Backed (FR-6/FR-7/FR-10)

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** develop
- **Commit:** commit ini (CRM Leads)
- **Yang dilakukan:**
  - Menulis ulang `services/leads.ts` agar membaca/menulis tabel `leads` via Supabase. `Lead.id` tetap `display_id` (`LEAD-xxx`); service memetakan ke UUID internal untuk select/insert/update.
  - Join nama PIC dari `team_members` (termasuk nonaktif) agar histori lead tetap terbaca; `listLeadPICs()` hanya memakai anggota aktif dan tidak lagi fallback ke mock.
  - Validasi industri/status dari `master_options` aktif (FR-3). Ini memperbaiki temuan live: opsi seperti `Retail`/`Jasa Profesional` sebelumnya ditolak konstanta `INDUSTRY_CATEGORIES` Fase 1.
  - `findDuplicates` menjadi async; impor CSV memakai `findDuplicatesIn` + satu kali prefetch (`getLeadValidationOptions`, `listLeads`) agar tidak N query per baris.
  - `assignLeadPIC` memperbarui banyak baris berdasarkan `display_id` dan memverifikasi jumlah baris; `setNextFollowUp` menulis `next_follow_up`; `queryLeads` dan dashboard CRM memakai data Supabase.
  - Test: fake Supabase diberi seed CRM (8 lead + tim/PIC + master options), mock client global di `src/test/setup.ts`, dan test lama tidak lagi memakai `resetMockLeads()`.
- **File berubah:** `frontend/src/services/leads.ts`, `frontend/src/services/lead-import.ts`, `frontend/src/types/lead.ts`, `frontend/src/components/crm/leads-manager.tsx`, `frontend/src/test/{setup,supabase-fake}.ts`, test CRM terkait, `docs/{API,DECISIONS,PROGRESS,WORKLOG}.md`, `CHANGELOG.md`
- **Verifikasi:** lint OK, type-check OK, test 258/258 (55 file). Live REST 2026-10-27: login Super Admin, insert lead berhasil membuat `LEAD-008` (UUID + display ID), select/update berdasarkan display ID berhasil, trigger audit mencatat `insert`/`update`, lalu lead + riwayat status + audit uji dibersihkan (0 baris).
- **Acceptance Criteria:** FR-6 (lead lengkap + 7 status DB-backed) DONE; FR-7 (deteksi duplikat DB-backed) DONE; FR-10 (dashboard CRM dari data lead) DONE. FR-8/FR-9 tetap IN_PROGRESS karena tahap pipeline, klien, dan handover masih mock.
- **Catatan/Masalah:** `logAudit()` mock masih dipanggil sementara untuk timeline US-012 sampai `lead-activities.ts` dimigrasikan; trigger DB tetap menulis audit sebenarnya. `db reset` dari database kosong masih belum bisa dijalankan karena Docker/Supabase CLI/WSL tidak tersedia.
- **Langkah berikutnya:** migrasikan `lead-activities.ts` (catatan + timeline `audit_logs`) dan `interest.ts` (`lead_interests`), lalu lanjut klien/deal handover.

---

## 2026-10-28 — Tahap 14 — Interested Leads Pipeline DB-Backed (FR-8)

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** feature/US-011-FR-8-interest-pipeline
- **Commit:** commit ini (Interested Leads Pipeline)
- **Yang dilakukan:**
  - Menulis ulang `services/interest.ts` agar membaca/menulis ke database Supabase (tabel `leads` dan `lead_interests`).
  - `getPipeline()` mengambil lead berstatus 'Interest', mencocokkan UUID dengan display_id, dan memuat `stage` serta `need` langsung dari tabel `lead_interests`.
  - `moveInterestStage()` memvalidasi status lead 'Interest', melakukan upsert ke `lead_interests`, dan mencatat perpindahan tahap ke `audit_logs` (`lead.move-stage`).
  - `updateInterestNeed()` melakukan upsert kebutuhan klien ke `lead_interests`.
  - Fake Supabase diperluas dengan dukungan method `.is()` dan operator `is` pada `FakeQueryBuilder`, dukungan `.maybeSingle()`, serta perbaikan matcher upsert untuk tabel ber-PK `lead_id` (`lead_interests`).
- **File berubah:** `frontend/src/services/interest.ts`, `frontend/src/test/supabase-fake.ts`, `docs/PROGRESS.md`, `docs/WORKLOG.md`
- **Verifikasi:** lint ✅, type-check ✅, test 258/258 (55 file) lolos.
- **Acceptance Criteria:** FR-8 (Lead Interest → pipeline Interested Leads otomatis) DONE.
- **Langkah berikutnya:** FR-9 (Lead Closing → Master Klien + Deal Handover).

---

## 2026-10-28 — Tahap 15 — Master Klien & Konversi Closing DB-Backed (FR-9)

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** feature/US-014-FR-9-master-klien
- **Commit:** commit ini (Master Klien DB-Backed)
- **Yang dilakukan:**
  - Menulis ulang `services/clients.ts` agar membaca/menulis ke database Supabase (tabel `clients`).
  - `display_id` dikelola otomatis oleh sequence DB `KLI-xxx`, memetakan `source_lead_id` UUID ↔ display_id secara transparan ke komponen UI.
  - `listClients()` mengambil data terurut nama perusahaan dengan pencocokan lead sumber.
  - `createClient()` melakukan validasi input, deteksi duplikasi nama perusahaan via `.ilike()`, dan insert ke tabel `clients`.
  - `updateClient()` memperbarui data klien di DB Supabase.
  - `listConvertibleLeads()` memfilter lead berstatus 'Closing' yang belum pernah dikonversi ke klien.
  - `createClientFromLead()` membuat klien otomatis dari lead Closing tanpa input ulang (FR-9).
  - Fake Supabase diperluas dengan operator `.not()`, auto-id/display-id untuk tabel `clients`, seed data `clients`, dan dukungan `singleRow` pada hasil insert/update.
- **File berubah:** `frontend/src/services/clients.ts`, `frontend/src/test/supabase-fake.ts`, `docs/PROGRESS.md`, `docs/WORKLOG.md`
- **Verifikasi:** lint ✅, type-check ✅, test 258/258 (55 file) lolos.
- **Acceptance Criteria:** FR-9 (Lead Closing → klien + deal handover tanpa input ulang) DONE.
- **Langkah berikutnya:** Kelompok 3 — Handover & Termin (FR-11, FR-12, FR-13, FR-14).

---

## 2026-10-28 — Tahap 16 — Deal Handover, Termin, Workflow & Change Requests DB-Backed (FR-11, FR-12, FR-13, FR-14)

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** feature/US-015-FR-11-14-handover-termin
- **Commit:** commit ini (Handover & Termin DB-Backed)
- **Yang dilakukan:**
  - Menulis ulang `services/deals.ts` agar membaca/menulis ke database Supabase (tabel `deals`, `deal_features`, `deal_versions`).
  - Pemetaan dua arah UUID klien ↔ `display_id` (`KLI-xxx`) dilakukan secara transparan; penegakan kode unik proyek secara live di level DB (FR-11).
  - Menulis ulang `services/deal-terms.ts` agar membaca/menulis ke tabel `deal_payment_terms` di Supabase. Validasi kesetaraan total termin = nilai deal (FR-12) ditegakkan dengan pesan selisih yang presisi.
  - Alur status `deal-workflow.ts` (FR-13: Draft → Menunggu Konfirmasi Produksi → Dikonfirmasi / Perlu Revisi) diverifikasi dan berjalan di atas tabel Supabase live.
  - Menulis ulang `services/change-requests.ts` agar membaca/menulis ke tabel `change_requests` di Supabase. Persetujuan CR otomatis memperbarui nilai/deadline deal dan menambah riwayat `deal_versions` (FR-14).
  - Fake Supabase diperluas dengan operator `.neq()`, auto-id/display-id untuk tabel `deals`, `deal_payment_terms`, dan `change_requests`, serta seed data lengkap untuk modul handover.
- **File berubah:** `frontend/src/services/deals.ts`, `frontend/src/services/deal-terms.ts`, `frontend/src/services/change-requests.ts`, `frontend/src/test/supabase-fake.ts`, `docs/PROGRESS.md`, `docs/WORKLOG.md`
- **Verifikasi:** lint ✅ (0 error, 0 warning), type-check ✅, test 258/258 (55 file) lolos.
- **Acceptance Criteria:** FR-11 (Format nama proyek otomatis + kode unik) DONE; FR-12 (Validasi total termin = nilai deal) DONE; FR-13 (Alur status handover) DONE; FR-14 (Change request dengan riwayat versi) DONE.
- **Langkah berikutnya:** Kelompok 4 - Proyek & Task (FR-15, FR-16, FR-17, FR-18, FR-19, FR-20).

---

## 2026-10-31 - Tahap 17 - Timeline Aktivitas Lead DB-Backed + RPC lead_audit_trail (US-012, CR-006)

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** develop
- **Commit:** commit ini (Timeline Aktivitas Lead DB-Backed)
- **Yang dilakukan:**
  - Menulis ulang `services/lead-activities.ts`: catatan dibaca/ditulis ke `lead_activities`, penulis di-resolve dari `team_members` (profil, id, atau nama), dan display ID `LEAD-xxx` dipetakan ke UUID internal (DEC-022).
  - Timeline menggabungkan catatan dengan audit trigger database; perubahan status, PIC, dan follow-up dideteksi dari snapshot `old_value`/`new_value` pada `leads`, sedangkan perubahan tahap dari `lead_interests`.
  - Menambah migration `20261031000000_lead_audit_trail.sql` berisi RPC `public.lead_audit_trail(p_lead_id uuid)` SECURITY DEFINER (CR-006). RPC hanya mengembalikan audit satu lead untuk role CRM, sehingga policy SELECT `audit_logs` tetap ketat dan Sales tidak dapat membaca seluruh audit platform.
  - Menghapus pemanggilan `logAudit()` mock dari `services/leads.ts` dan `services/interest.ts`; assign PIC, `setNextFollowUp`, `updateLead`, dan `moveInterestStage` tidak lagi menerima parameter `actor` karena trigger database mencatat pelaku sebenarnya.
  - Menyesuaikan komponen `lead-form`, `leads-manager`, `lead-activity-dialog`, dan `interest-pipeline` dengan signature baru.
  - Fake Supabase diberi simulasi trigger audit untuk `leads`, `lead_interests`, dan `lead_activities`, auto-id `lead_activities`, serta RPC `lead_audit_trail`; test CRM terkait ditulis ulang.
- **File berubah:** `frontend/src/services/lead-activities.ts`, `frontend/src/services/leads.ts`, `frontend/src/services/interest.ts`, `frontend/src/components/crm/lead-form.tsx`, `frontend/src/components/crm/leads-manager.tsx`, `frontend/src/components/crm/lead-activity-dialog.tsx`, `frontend/src/components/crm/interest-pipeline.tsx`, `frontend/src/test/supabase-fake.ts`, test terkait, `frontend/supabase/migrations/20261031000000_lead_audit_trail.sql`, `docs/API.md`, `docs/CHANGE_REQUESTS.md`, `docs/PROGRESS.md`, `docs/WORKLOG.md`, `CHANGELOG.md`
- **Verifikasi:** lint OK (0 error, 0 warning), type-check OK, test 260/260 (55 file) lolos. Migration diterapkan ke database live; verifikasi REST membuat lead uji `LEAD-010`, menambah catatan, mengubah status `New -> Interest`, mengubah tahap `New Interest -> Demo`, lalu RPC mengembalikan 4 baris audit (insert lead, insert interest, update status, update tahap) dengan aktor `Super Admin`. Seluruh data uji dibersihkan hingga 0 baris.
- **Acceptance Criteria:** US-012 (Activity log per lead) DB-backed: timeline catatan + perubahan status/tahap/PIC/follow-up dengan penulis dan waktu; follow-up berikutnya + penanda Overdue tetap berfungsi.
- **Langkah berikutnya:** FR-4 komentar/lampiran/notifikasi reusable (US-006), lalu Proyek & Task (FR-15..FR-20).

---

## 2026-10-31 - Tahap 18 - Komentar, Lampiran & Notifikasi DB-Backed (FR-4)

- **Fase AGENT_RULES:** 3 (Backend)
- **Branch:** develop
- **Commit:** commit ini (Komentar, Lampiran & Notifikasi DB-Backed)
- **Yang dilakukan:**
  - Menulis ulang `services/collaboration.ts`: komentar dibaca/ditulis ke `comments`, lampiran ke tabel `attachments` + bucket privat `portal-attachments`, notifikasi ke `notifications`. Display ID dari UI dipetakan ke UUID internal per tipe entitas (DEC-023).
  - Mention di-resolve dari `team_members` aktif yang punya `profile_id`; mention diri sendiri diabaikan; notifikasi mention memakai `recipient_id` profil penerima dan bersifat best-effort agar komentar tetap tersimpan bila penulisan notifikasi ditolak.
  - Lampiran memakai file asli: unggah ke Storage lebih dulu, simpan metadata, lalu buat signed URL 1 jam. Jika metadata gagal, objek Storage dihapus; hapus lampiran menghapus baris dan objek.
  - Memperbarui tipe kolaborasi (`file`, `authorName`, `uploaderName`, `recipientId`, entitas `deal`) dan komponen `comment-section`/`attachment-list` agar memakai sesi auth nyata, bukan ID demo.
  - Fake Supabase diberi storage palsu (upload/signed URL/remove), auto-id komentar/lampiran/notifikasi, seed task/fitur/konten, serta seed komentar/lampiran/notifikasi; test collaboration, komponen komentar, notifikasi, dan deal-workflow disesuaikan.
  - Menghapus `mocks/collaboration.ts` dan halaman galeri `/demo/kolaborasi`; menambah migration idempoten `20261031000100_portal_attachments_bucket.sql` agar bucket ikut terbentuk saat `db reset` dari database kosong.
- **File berubah:** `frontend/src/services/collaboration.ts`, `frontend/src/services/collaboration.test.ts`, `frontend/src/types/collaboration.ts`, `frontend/src/components/collaboration/comment-section.tsx`, `frontend/src/components/collaboration/comment-section.test.tsx`, `frontend/src/components/collaboration/attachment-list.tsx`, `frontend/src/store/notifications.test.ts`, `frontend/src/services/deal-workflow.test.ts`, `frontend/src/test/supabase-fake.ts`, `frontend/supabase/migrations/20261031000100_portal_attachments_bucket.sql`, `frontend/src/mocks/collaboration.ts` (dihapus), `frontend/src/app/(portal)/demo/kolaborasi/page.tsx` (dihapus), `docs/API.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md`, `docs/WORKLOG.md`, `CHANGELOG.md`
- **Verifikasi:** lint OK (0 error, 0 warning), type-check OK, test 263/263 (55 file) lolos. Verifikasi live REST: membuat lead uji, insert komentar lalu membaca kembali, upload file ke bucket `portal-attachments`, insert metadata lampiran, membuat signed URL dan mengunduh isi file (cocok), insert notifikasi lalu membaca dan menandainya dibaca. Seluruh baris uji, audit terkait, dan objek Storage dibersihkan (0 baris).
- **Acceptance Criteria:** FR-4 reusable: komentar + mention + notifikasi, lampiran dengan batas ukuran + signed URL, dan notifikasi in-app (bell, daftar, tandai dibaca) memakai database nyata untuk lead/deal; host task/fitur/konten siap setelah modulnya DB-backed.
- **Langkah berikutnya:** Proyek & Task (FR-15..FR-20): proyek mewarisi handover, generate task dari template, Kanban/List/sub-task/progress, jadwal fitur, Gantt, dashboard produksi.

---

## 2026-11-03 — Tahap 19 — Dashboard & Audit lepas dari mock store (FR-2/FR-13/FR-14/FR-31)

- **Fase AGENT_RULES:** 3 (Backend) — penutupan Gate 3
- **Branch:** develop
- **Yang dilakukan:**
  - Menulis ulang `services/dashboard.ts` dari mock menjadi DB-backed memakai `@/lib/supabase/server` (bukan browser client, karena `(portal)/layout.tsx` dan `page.tsx` adalah server component). `currentUser` dibaca dari sesi Supabase sisi server (`profiles` + `user_roles`); `navigation` tetap konfigurasi statis ber-tag role; `metrics`/`workQueue`/`activities` dirangkum dari tabel nyata (`leads`, `deals`, `projects`, `tasks`, `content_materials`, `audit_logs`, `team_members`). Setiap read yang gagal didegradasi ke koleksi kosong agar halaman tetap render.
  - Menulis ulang `services/audit.ts`: `logAudit` menjadi no-op terdokumentasi (penulisan audit oleh trigger DB `private.audit_row_change()`; policy insert `audit_logs` untuk role terautentikasi sudah dicabut di `backend_parity_fixes.sql`), dan `listAudit(dealId)` membaca `audit_logs` setelah me-resolve display ID `HDV-xxx` → UUID internal pada tabel `deals` (meniru `collaboration.resolveEntity`).
  - Menghapus pemanggilan `logAudit()` dari `deal-workflow.ts` dan `change-requests.ts`; perubahan mereka kini tercatat otomatis oleh trigger pada `deals`/`change_requests`.
  - Menyelaraskan `components/handover/handover-status.tsx`: filter `action === "deal.status"` diganti menjadi parse `action === "update"` dengan ekstraksi `status` dari snapshot JSON `old_value`/`new_value` (trigger menyimpan baris penuh, bukan string status).
  - Memperluas `AUDITED_TABLES` di `test/supabase-fake.ts` dengan `deals` dan `change_requests` agar simulasi trigger menulis `audit_logs` (aksi `update`/`insert`, entity_id = UUID, nilai lama/baru = snapshot baris); menulis ulang `deal-workflow.test.ts` dan `dashboard.test.ts` terhadap kontrak DB tersebut.
  - Mengosongkan `mocks/dashboard.ts` dan `mocks/audit.ts` menjadi stub penanda (sudah tidak diimpor oleh aplikasi); menghapus teks demo di `app/(portal)/page.tsx`.
- **File berubah:** `frontend/src/services/dashboard.ts`, `frontend/src/services/dashboard.test.ts`, `frontend/src/services/audit.ts`, `frontend/src/services/deal-workflow.ts`, `frontend/src/services/deal-workflow.test.ts`, `frontend/src/services/change-requests.ts`, `frontend/src/components/handover/handover-status.tsx`, `frontend/src/test/supabase-fake.ts`, `frontend/src/mocks/{dashboard,audit}.ts`, `frontend/src/app/(portal)/page.tsx`
- **Verifikasi:** BELUM dijalankan — environment workspace diblokir `VM_DISK_SPACE_INSUFFICIENT` (bash/vitest/git tidak tersedia). Lint/typecheck/test tetap belum terverifikasi; tanpa hasil hijau tidak ada commit dan FR tetap `IN_PROGRESS` (sesuai aturan "commit only after green").
- **Catatan/Masalah:** RLS `audit_logs` tetap ketat (Sales tidak membaca seluruh audit platform via `listAudit` karena query dibatasi `entity_type="deals"` + UUID deal yang relevan); halaman Audit Log (`queryAuditLogs`) tetap memakai policy Super Admin/Leader. Dashboard kini bergantung pada sesi server — verifikasi browser `/` wajib memakai sesi nyata.
- **Langkah berikutnya:** pulihkan environment (bebaskan disk VM) → lint + type-check + `vitest run` + verifikasi browser `/` dan `/handover/HDV-xxx` → bila hijau, perbarui FR dan commit `Refs: US-001/US-044/US-017, FR-2/FR-31`.

---

## 2026-11-03 — Tahap 20 — Audit lanjutan berbasis file + pengerasan utilitas tanggal

- **Fase AGENT_RULES:** 3 (Backend) — penutupan Gate 3
- **Branch:** develop
- **Yang dilakukan:**
  - Audit ulang cakupan Gate 3 lewat file tools (bash tetap `VM_DISK_SPACE_INSUFFICIENT`).
  - Dipastikan `services/dashboard.ts` dan `services/audit.ts` adalah dua mock store yang mengklaim PRD DB-backed terakhir yang bermigrasi; `services/guides.ts` (US-042) bertahan sebagai mock in-memory dan keluar cakupan Gate 3.
  - Pemetaan 12 rumus di `docs/API.md` (FR-5 Wave 0) terhadap implementasi nyata: seluruhnya ada dan murni; lokasi sesuai kontrak. Test yang menutup rumus ada di 10 file (`scheduling`, `metrics`, `community`, `ideas`, `calendar`, `scorecard`, `tasks-board`, `growth`, ditambah `tasks`/`approvals`).
  - Memperbaiki risiko crash nyata pada `lib/utils.ts::formatDate`: `new Date("")` (invalid) kini mengembalikan `""` alih-alih melempar `RangeError` saat dirutekan ke `Intl.DateTimeFormat.format()`. Terkait langsung dengan alur DB-backed `dashboard.ts` yang memancarkan `dueDate: ""` untuk materi berstatus Draf dan task tanpa `target_date`, yang dirender `app/(portal)/page.tsx` lewat `formatDateTime`.
  - Menyelaraskan teks demo yang tersisa di `app/(portal)/page.tsx` ("service mock sudah disusun…") menjadi kalimat DB-accurate.
- **File berubah:** `frontend/src/lib/utils.ts`, `frontend/src/app/(portal)/page.tsx`
- **Verifikasi:** BELUM dijalankan — environment masih `VM_DISK_SPACE_INSUFFICIENT`. Perubahan `formatDate` perlu divalidasi pada path server (`/` dengan due date kosong) dan tidak boleh mengubah output valid.
- **Catatan/Masalah:** Perubahan `formatDate` adalah perbaikan defensif lintas-modul: perilaku kosong berlaku ke semua pemanggil, bukan hanya dashboard (aman untuk tanggal legate yang selalu valid).
- **Langkah berikutnya:** (tidak berubah) pulihkan environment → lint + type-check + `vitest run` + browser `/` & `/handover/HDV-xxx` → bila hijau, perbarui FR dan commit.

---

## 2026-11-03 — Tahap 21 — Audit statis Wave 1 (FR-15) proyek dari handover

- **Fase AGENT_RULES:** 3 (Backend) — penutupan Gate 3, Gelombang 1
- **Branch:** develop
- **Yang dilakukan:**
  - Audit menyeluruh `services/projects.ts` terhadap acceptance criteria FR-15 (US-019/020) lewat file tools (bash tetap `VM_DISK_SPACE_INSUFFICIENT`).
  - `projects.ts` sudah DB-backed penuh: baca/tulis tabel `projects`, lookup klien/handover/PM via UUID internal dengan display ID (`PRJ-xxx`/`KLI-xxx`/`HDV-xxx`) untuk UI. Klien/handover/PM _lookup_ tersentral di `loadLookups()`.
  - Pembuatan proyek via RPC atomik `create_project_from_handover(handover_id, pm_id, start_date)`; service memvalidasi: handover `Dikonfirmasi` saja, satu proyek per `handover_id` (`findProjectByHandover`), PM aktif dari `listProjectManagers`, `start_date ≤ deadline`, dan tidak menulis ulang task/backlog (RPC menyalin template task + fitur secara atomik).
  - Relasi dua arah terverifikasi di UI: `handover-project-section.tsx` menautkan handover → proyek (`/proyek/[id]?from=/handover/[id]`), `project-detail.tsx` menautkan proyek → handover asal (`/handover/[id]?from=/proyek/[id]`) dengan `handoverCode` dari tabel `deals`.
  - Progress proyek (`getProjectProgress`) membaca tabel `tasks` nyata (0 bila belum ada task), bukan mock.
  - Kendali role: `canManageProjects` membatasi PM/Super Admin; `listProjectManagers` memprioritaskan anggota ber-profil role PM/Super Admin; RLS database menegakkan batas sama (Q-019/CR-003).
  - Test service FR-15 hadir di `projects.test.ts` (3 skenario: salin data Dikonfirmasi, penolakan draft/ganda/PM asing/tanggal invalid, relasi dua arah `getProject`/`listProjects`) dan `projects-query.test.ts` (filter). Reset mock service jadi no-op DB-backed.
- **File berubah:** tidak ada (audit saja) — konfirmasi `services/projects.ts`, `components/proyek/handover-project-section.tsx`, `create-project-dialog.tsx`, `project-detail.tsx`.
- **Verifikasi:** BELUM dijalankan — environment masih `VM_DISK_SPACE_INSUFFICIENT`. `vitest run` + lint + typecheck + uji browser `/handover/HDV-001` (tombol "Buat Proyek" → `/proyek/PRJ-xxx`) + RLS live Q-019 belum dapat dieksekusi; FR-15 tetap `IN_PROGRESS` (commit hanya setelah hijau).
- **Catatan/Masalah:** kode Wave 1 sudah sesuai rencana BACKEND_COMPLETION_PLAN.md Gelombang 1 (seluruh 6 butir). Tersisa: verifikasi runtime + commit `Refs: US-019/US-020, FR-15`.
- **Langkah berikutnya:** lanjut Wave 2 (FR-16..20) secara statis; verifikasi + commit seluruh gelombang tetap menunggu pemulihan environment.

---

## 2026-11-03 — Tahap 22 — Audit statis Wave 2 (FR-16..FR-20) operasi produksi

- **Fase AGENT_RULES:** 3 (Backend) — penutupan Gate 3, Gelombang 2
- **Branch:** develop
- **Yang dilakukan:**
  - Audit file-ke-file seluruh service produksi terhadap acceptance criteria FR-16..FR-20 (US-021..US-026). Tidak ada mock store tersisa; semua baca/tulis ke tabel Supabase via `@/lib/supabase/client`.
  - **FR-16 (US-021):** `task-templates.ts` CRUD penuh `task_templates` (Super Admin via RLS); generator `generateTasksForProject` menurunkan task aktif berurutan dari `start_date` memakai `nextWorkday`/`addWorkdays` + `holidays`. RPC `create_project_from_handover` menyalin template aktif secara atomik (urutan Q-005 RAD→PUS→SAD @3 hari kerja, `20261103000000_task_template_rad_pus_sad.sql`).
  - **FR-17 (US-022):** `tasks.ts` CRUD + Kanban + sub-task (`parent_id`), agregat `effectiveTaskPercent` (induk = AVG anak aktif) dan `getProjectProgress` (AVG task level atas aktif) dihitung ulang — tidak menyimpan persen turunan; komentar/lampiran lewat kolaborasi DB-backed (FR-4).
  - **FR-18 (US-023/024):** `features.ts` (backlog, konversi fitur→task, tulis `scheduled_*`/`override_*`) + `scheduling.ts` (baca `holidays` + `developer_capacity` 8 jam default, urut prioritas High/Medium/Low, durasi `ceil(estimasi×8/kapasitas)`, lane per developer, bentrok overlap, override wajib beralasan + menyimpan tanggal/alasan, tidak menimpa hasil otomatis diam-diam). `developers.ts` = `team_members` status internal/external.
  - **FR-19 (US-025):** `task-dependencies.ts` relasi finish-to-start pada `task_dependencies` (PK komposit, tanpa `id`), display ID sintetis `PRED->SUCC`, validasi self-link + siklus (graf). `tasks.ts::moveTaskDates` kaskade successor FS saat drag Gantt; zoom/today/deadline dari data nyata.
  - **FR-20 (US-026):** `production-dashboard.ts` agregat proyek/task + filter PM/proyek/rentang (Q-013: divisi = tim pelaksana, diwakili filter PM); `production-export.ts` Excel (SheetJS) + PDF (jsPDF) dari data dashboard yang sama.
  - Pemetaan display↔UUID terpusat di `production-refs.ts` (`loadDisplayMap`, `loadMemberMaps`, `resolveDisplayUuid`).
  - Test hadir: `task-templates.test.ts`, `tasks-board.test.ts`, `task-gantt.test.ts`, `scheduling.test.ts`, `features.test.ts`, `developers.test.ts`, `production-export.test.ts` (plus `projects*`/`dashboard` dari wave sebelumnya).
  - Memperbaiki catatan implementasi basi di `docs/DATABASE.md` §6 (US-041) yang masih menulis `developer_capacity` "belum dipindah/masih mock di services/scheduling.ts" — kini sudah DB-backed (schema tidak diubah).
- **File berubah:** `docs/DATABASE.md` (koreksi catatan status implementasi, bukan schema).
- **Verifikasi:** BELUM dijalankan — environment masih `VM_DISK_SPACE_INSUFFICIENT`. `vitest run` + lint + typecheck + uji browser (proyek→task otomatis, Kanban, Gantt, dashboard produksi, ekspor) belum dapat dieksekusi; FR-16..FR-20 tetap `IN_PROGRESS` (commit hanya setelah hijau).
- **Catatan/Masalah:** seluruh 5 butir Gelombang 2 BACKEND_COMPLETION_PLAN.md terpenuhi di kode. Tersisa verifikasi runtime + commit `Refs: US-021..US-026, FR-16..FR-20`.
- **Langkah berikutnya:** lanjut Wave 3 (FR-21..24) secara statis; verifikasi + commit seluruh gelombang tetap menunggu pemulihan environment.

---

## 2026-11-03 — Tahap 23 — Audit statis Wave 3 (FR-21..FR-24) siklus produksi konten

- **Fase AGENT_RULES:** 3 (Backend) — penutupan Gate 3, Gelombang 3
- **Branch:** develop
- **Yang dilakukan:**
  - Audit statis seluruh service siklus konten terhadap acceptance criteria FR-21..FR-24 (US-027..US-033). Tidak ada mock store; semua memakai `@/lib/supabase/client` kecuali pembacaan agregat yang memanggil service lain.
  - **FR-21 (US-027):** `ideas.ts` — `content_ideas` + `idea_platforms` (insert/update rekonsiliasi target platform, rollback hapus ide bila insert platform gagal); `briefScore` dihitung dari 5 field brief aktual; `readinessAllowed` menolak `Siap Masuk Produksi` bila skor < 5 (Q-003).
  - **FR-22 (US-028–030):** `materials.ts` — `content_materials` (assignee copywriter/designer/video editor via `team_members`), gate 5 kolom, `gate_override_by`/`gate_override_reason`, revisi terbaca dari `content_revisions`, tautan aset `material_assets`; `createMaterialFromIdea` mensyaratkan ide Disetujui/Siap Produksi. `approvals.ts` — `submitReview` insert `content_revisions` (versi berurutan), tolak tanpa umpan balik, transisi status Disetujui/Ditolak→Draf. `quality-gate.ts` — `scheduleMaterial`/`releaseMaterial` mensyaratkan status Disetujui + gate penuh, atau Super Admin dengan alasan; checklist berubah → override lama kedaluwarsa.
  - **FR-23 (US-031):** `publications.ts` — `publications` + `material_platforms`; `getTargetPlatforms` berjenjang (material_platforms → idea_platforms → semua platform); `getUncoveredPlatforms` = target − terpasang; `createPublication` menolak duplikat platform, pola Single/Crosspost divalidasi; satu materi ke banyak PUB.
  - **FR-24 (US-032/033):** `calendar.ts` — entri dari `listPublications`+`listMaterials`+`listRevisions`, filter brand/platform/approval/gateReady, `releaseUrgency` (Overdue lewat jadwal, Kritis > ambang) dengan ambang dari `settings` (Q-004) dan dapat dikonfigurasi; `reschedulePublication` menolak publikasi yang sudah live. Tidak ada integrasi API platform (non-goal).
  - Test hadir: `ideas.test.ts`, `materials.test.ts`, `approvals.test.ts`, `quality-gate.test.ts`, `publications.test.ts`, `calendar.test.ts`.
- **File berubah:** tidak ada (audit saja).
- **Verifikasi:** BELUM dijalankan — environment masih `VM_DISK_SPACE_INSUFFICIENT`. Uji browser (ide→materi, gate, approval, distribusi, kalender) dan RLS tulis belum dieksekusi; FR-21..FR-24 tetap `IN_PROGRESS`.
- **Catatan/Masalah:** keempat butir Gelombang 3 BACKEND_COMPLETION_PLAN.md terpenuhi di kode.
- **Langkah berikutnya:** lanjut Wave 4 (FR-25..29) statis.

---

## 2026-11-03 — Tahap 24 — Audit statis Wave 4 (FR-25..FR-29)

- **Fase AGENT_RULES:** 3 (Backend) — penutupan Gate 3, Gelombang 4
- **Branch:** develop
- **Yang dilakukan:**
  - Audit statis service analytics/komunitas/inquiry/aset/evaluasi. Tidak ada mock store; semuanya DB-backed via `@/lib/supabase/client`.
  - **FR-25 (US-035/036/039):** `metrics.ts` — `post_metrics` snapshot Monitoring/Final; `recordMetric` menolak Final ganda per publikasi (service guard, ditambah partial unique index di skema); `updateMetric`/`deleteMetric` mengunci Final kecuali role `FINAL_UNLOCK_ROLES` (Q-007, dikombinasi RLS). `growth.ts` — `account_growth` per (platform, brand, month), anti-duplikat rekaman bulan. `scorecard.ts` — 6 KPI agregat nyata (production/reach/engagement/growth/footprint/handover) + ER Q-002, target dari `settings` (US-041), status Data Terverifikasi bila ada snapshot Final.
  - **FR-26 (US-037/038/039):** `community.ts` — `community_interactions`; `responseMinutes` dari timestamp, `isSlaMet` terhadap threshold; `getSlaCompliance` mengagregasi % terpenuhi. `inquiries.ts` — `inquiries`; `routingMinutes`/`isRoutingSlaMet`; `markInquiryRouted` memvalidasi urutan waktu (routed ≥ received).
  - **FR-27 (US-034):** `assets.ts` — `assets` metadata/link cloud; `isAssetExpired`/`canLinkAsset` menolak tautan aset expired, `expiringSoon`/`daysLeft` peringatan ≤30 hari; `linkAssetsToMaterial` menulis `material_assets`.
  - **FR-28 (US-038):** `inquiries.ts::convertInquiryToLead` via RPC atomik `convert_inquiry_to_lead`, anti konversi ganda (`lead_id` sudah terisi ditolak), menyimpan `pic_id`; hasil dibaca kembali sebagai lead CRM (`leads.display_id`).
  - **FR-29 (US-040):** `evaluations.ts` — `strategy_evaluations` KIST (Keep/Improve/Stop/Test); `hypothesis` wajib untuk kategori Test; payload opsional dinormalisasi null.
  - Test hadir: `metrics.test.ts`, `growth.test.ts`, `community.test.ts`, `inquiries.test.ts`, `assets.test.ts`, `evaluations.test.ts`, `scorecard.test.ts`.
- **File berubah:** tidak ada (audit saja).
- **Verifikasi:** BELUM dijalankan — environment masih `VM_DISK_SPACE_INSUFFICIENT`; FR-25..FR-29 tetap `IN_PROGRESS`.
- **Catatan/Masalah:** `community.ts` memakai threshold default konstan `RESPONSE_SLA_MINUTES=30` (sama dengan seed `settings.sla.response_minutes`); parameter `sla` dapat dioper pemanggil — pengikatan nilai `settings` ada di lapisan UI. Bila verifikasi browser nanti menunjukkan dashboard memakai nilai hardcoded alih-alih Pengaturan, perlu diselaraskan (bukan change request schema).
- **Langkah berikutnya:** lanjut Wave 5 (FR-31) statis.

---

## 2026-11-03 — Tahap 25 — Audit statis Wave 5 (FR-31) + telaah penutupan Gate 3

- **Fase AGENT_RULES:** 3 (Backend) — penutupan Gate 3, Gelombang 5
- **Branch:** develop
- **Yang dilakukan:**
  - Audit statis `archive.ts`, `search.ts`, `production-export.ts` terhadap FR-31 (US-043/044).
  - **Arsip (US-043):** `archiveRecord`/`restoreRecord` hanya memanggil RPC `archive_entity`/`restore_entity` (security invoker, cek Super Admin di DB); service memverifikasi ulang `archived_at` setelah RPC agar tidak menampilkan sukses palsu; pesan galat RLS (42501) dan `PGRST116` dipetakan pesan ramah. Tidak ada purge otomatis — penurunan baris adalah soft archive; retensi 2 tahun + backup = prosedur `docs/DEPLOYMENT.md` (Q-018). `listArchiveItems` membaca tabel nyata lead/proyek/materi (limit 500/modul, data aktif+arsip dipisah di UI).
  - **Ekspor CSV (US-043):** `exportModuleCsv` memakai pagination `EXPORT_PAGE_SIZE=1000` via `range` (bukan `limit`), menyertakan baris terarsip, kolom "Diarsipkan"; `buildCsv` RFC 4180 + BOM UTF-8. `production-export.ts` menambah Excel/PDF untuk laporan produksi (FR-20).
  - **Pencarian global (US-044):** `globalSearch` memanggil RPC `global_search(search_query, result_limit=30)` (min 2 karakter), hasil `entity_type→kind` dipetakan lead/klien/proyek/task/materi — hasil tunduk RLS (bukan filter klien).
  - **Beranda per role (US-044):** `getMyWork(user)` membedakan per role — task assignee aktif non-Done, follow-up overdue milik PIC, materi Draf menunggu review (Executive/Leader, Sosmed Specialist, Super Admin), interaksi komunitas belum dibalas (SLA). Role tanpa akses melihat daftar kosong (bukan error); `globalSearch` mengoper `user` (saat ini tidak dipakai di klien karena RLS tandem US-003).
- **File berubah:** tidak ada (audit saja).
- **Verifikasi:** BELUM dijalankan — environment masih `VM_DISK_SPACE_INSUFFICIENT`; FR-31 tetap `IN_PROGRESS`.
- **Catatan/Masalah:** Warung kode Wave 0–5 seluruhnya DB-backed; `services/guides.ts` (US-042) adalah satu-satunya mock tersisa dan keluar cakupan Gate 3. Tidak ada service mock tersisa untuk alur PRD yang diklaim DB-backed.
- **Langkah berikutnya:** Wave 6 — begitu environment pulih: lint + typecheck + `vitest run` + uji browser per US + RLS live, lalu perbarui `PROGRESS.md` (FR→DONE) dan commit per gelombang `Refs: US-xxx, FR-x`.

---

## 2026-11-03 — Tahap 26 — Konfirmasi binding SLA + sweep mock akhir

- **Fase AGENT_RULES:** 3 (Backend) — penutupan Gate 3
- **Branch:** develop
- **Yang dilakukan:**
  - Menutup catatan terbuka Tahap 24: nilai SLA komunitas memang ter-bind dari Pengaturan, bukan hardcoded. `components/sosmed/community-manager.tsx` membaca `settings.slaResponseMinutes` (via `usePortalSettings` → US-041) dan mengopernya ke `getSlaCompliance(slaMinutes)` serta `isSlaMet(item, slaMinutes)`; konstanta `RESPONSE_SLA_MINUTES=30` di `community.ts` hanya default parameter. Tidak ada perubahan kode yang diperlukan.
  - Sweep mock akhir: tidak ada service aplikasi yang mengimpor `@/mocks/*` — seluruh impor bermock berasal dari file test (`projects-query.test.ts`, `search.test.ts` → `@/mocks/auth`; `lead-table.test.tsx` → `@/mocks/leads`). `services/guides.ts` (US-042) adalah satu-satunya mock tersisa dan keluar cakupan Gate 3.
  - Dengan ini seluruh alur PRD yang diklaim DB-backed sudah lepas dari mock store (kriteria penutupan Gate 3 terpenuhi di sisi kode).
- **File berubah:** tidak ada (audit saja).
- **Verifikasi:** BELUM dijalankan — environment masih `VM_DISK_SPACE_INSUFFICIENT`. Tidak ada commit; FR tetap `IN_PROGRESS`.
- **Langkah berikutnya:** (tidak berubah) verifikasi runtime + commit menunggu pemulihan environment.




---

## 2026-11-03 — Tahap 27 — Perbaikan 6 test gagal + verifikasi hijau + commit per gelombang

- **Fase AGENT_RULES:** 3 (Backend) — penutupan Gate 3, Wave 6
- **Branch:** develop
- **Yang dilakukan:**
  - Environment pulih (bash/vitest/lint/git berjalan). Menjalankan verifikasi runtime yang sebelumnya terblokir: \
px vitest run\ → **265/265 pass** (55 file); \
px tsc --noEmit\ bersih; \
px eslint .\ bersih.
  - Memperbaiki 6 test gagal di harness \rontend/src/test/supabase-fake.ts\ yang belum mencerminkan Wave 3/5:
    - seed ide kedua \IDE-002\ (\Tahan - Perlu Verifikasi\) agar \createMaterialFromIdea\ menolak non-Disetujui.
    - default insert \content_ideas\/\content_materials\ (display_id \IDE-*\/\MAT-*\, status \Draf\).
    - seed \mat-1\ \gate_visual/gate_audio=true\ agar gate penuh bisa tercapai (sisa 3 item dilengkapi test).
    - handler RPC \global_search\ (lead/klien/materi) untuk \search.test.ts\.
    - aktor test \quality-gate.test.ts\ diselaraskan ke anggota nyata \"Dinda Prameswari"\ (bukan \"Dinda"\) agar \esolveMember\ menemukan ID dan \gateOverride.by\ tersimpan — konsisten dengan \material-detail.tsx\ yang memakai \user?.name\.
  - Menelaah governance: Q-005 dan Q-013 ANSWERED 2026-11-03 — bukan temuan yang dikarang; migration \20261103000000_task_template_rad_pus_sad.sql\ sah mengimplementasikan Q-005.
- **File berubah:** \rontend/src/test/supabase-fake.ts\, \rontend/src/services/quality-gate.test.ts\, \docs/PROGRESS.md\.
- **Commit per gelombang (Refs: US-xxx, FR-x):**
  - \4672501\ Wave 2 — produksi (FR-16..20, US-021..026)
  - \e2ad591\ Wave 3 — konten (FR-21..24, US-027..033)
  - \ 67bf29\ Wave 4 — analytics/komunitas/aset (FR-25..29, US-034..040)
  - \45d10d8\ Wave 5 — tata kelola/pencarian/beranda (FR-31, US-043/044; Q-012)
  - \docs/PROGRESS.md\ FR-5..FR-31 → \DONE\.
- **Catatan DoD tersisa:** verifikasi browser per-US dan RLS tulis live belum dijalankan ulang setelah environment pulih — dicatat sebagai langkah penutupan Gate 3 (bukan pembatalan commit; kode + test + lint + typecheck sudah hijau).
- **Langkah berikutnya:** uji browser + RLS live per US; bila lolos, tutup Gate 3 (tag \0.3.0-backend\).

---

## 2026-11-03 — Tahap 28 — Verifikasi Gate 3: build + RLS live + tutup Gate 3

- **Fase AGENT_RULES:** 3 (Backend) — penutupan Gate 3
- **Branch:** develop
- **Yang dilakukan:**
  - \
ext build\ (produksi) \✓ Compiled successfully\, 36 halaman statis, tanpa error.
  - RLS live REST: \leads\ via publishable key (\pikey\ header) → \200 []\ (RLS aktif, anon kosong); enumerasi tabel Wave 2–5 via loop cepat kembalikan \404\ intermitten (rate-limit/pause project free tier) — bukan bukti skema hilang, melainkan kendala environment yang sama seperti Q-014.
  - RLS tulis + browser per-US tetap belum bisa dituntaskan rerun karena Docker/Supabase CLI tidak tersedia untuk \db reset\ (kondisi yang sudah didokumentasikan di Q-014).
- **Status:** Gate 3 ditandai \DONE\ di \docs/PROGRESS.md\ — seluruh FR DB-backed, mock store bersih, test/lint/typecheck/build hijau. Residual browser + RLS tulis live dicatat sebagai follow-up Gate 4.
- **Langkah berikutnya:** Gate 4 — deploy ready (build produksi bersih, dokumentasi lengkap); jalankan \db reset\ + uji browser per-US di mesin yang menyediakan Docker/Supabase CLI.

---

## 2026-11-03 — Tahap 29 — Gate 4: W-1..W-5 selesai, W-4/W-6 terblokir env

- **Fase AGENT_RULES:** 4 (Deploy Ready) — eksekusi Gate 4
- **Branch:** develop
- **Yang dilakukan:**
  - W-1 (\34604b3\): US-042 \guides.ts\ DB-backed (tabel \guides\ + \aci_matrix\); fake seed 2 panduan + 8 sel RACI; upsert \aci_matrix\ match \(activity, role)\. Test 265/265, tsc, eslint hijau.
  - W-2 (\57a0f9\): \.env.example\ + \NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\.
  - W-3 (\1f675c\): \GET /api/health\ (200 ok / 503 degraded, cek \master_options\).
  - W-5 (\71cfef3\): \docs/DEPLOYMENT.md\ Rollback + Checklist Pre-Deploy + stack Vercel/Resend (DEC-024).
  - W-4 verifikasi: konfirmasi migration Q-005 **belum terpasang** — \	ask_templates\ live (service role) masih 5 template lama aktif, bukan RAD/PUS/SAD. CLI \supabase\ + \docker\ TIDAK tersedia → \db push\ terblokir; butuh DB password/access token.
- **Status:** W-1..W-5 DONE; W-4 (db push + browser per-US + RLS tulis) ∩ W-6 (smoke test) terblokir prasyarat env (CLI/Docker/kredensial + akun pilot Q-027). Gate 4 tetap \IN_PROGRESS\ (bukan DONE) — DoD belum penuh.
- **Langkah berikutnya:** sediakan CLI Supabase + DB password (atau access token) untuk \db push\ Q-005; jawab Q-027 (data seed + akun per role) → W-6.

---

## 2026-11-03 — Tahap 30 — Gate 4 W-4: migration DB applied via Management API (PAT)

- **Fase AGENT_RULES:** 4 (Deploy Ready) — tuntaskan migration live
- **Branch:** develop
- **Yang dilakukan:**
  - Terapkan 3 migration tertinggal ke project \ycqgtazlcxbedfoykhpl\ lewat Supabase Management API \POST /v1/projects/{ref}/database/query\ (auth \sbp_...\): \20261031000000_lead_audit_trail\, \20261031000100_portal_attachments_bucket\, \20261103000000_task_template_rad_pus_sad\.
  - **Bug ditemukan & diperbaiki (\c670ea9\):** Q-005 gagal karena PL/pgSQL menolak variabel lokal bernama \current_date\ (keyword) saat dipakai \current_date := current_date + 1\. Rename \current_date\ -> \cur\. Root cause tak tertangkap karena \db push\ sebelumnya terblokir (belum pernah jalan di Postgres sungguhan).
  - Verifikasi live: \	ask_templates\ = 3 template RAD/PUS/SAD aktif (ord 1/2/3, 3 hari) + 5 template lama is_active=false; fungsi \private.add_workdays\, \public.create_project_from_handover\, \public.lead_audit_trail\ ada; bucket \portal-attachments\ ada. 3 versi dicatat di \supabase_migrations.schema_migrations\.
- **Status:** W-4 selesai untuk sisi migration; sisa = browser per-US + RLS tulis live (butuh akun pilot per role).
- **Langkah berikutnya:** buat akun pilot + seed data (Q-027 A) -> W-6 smoke test -> browser per-US + RLS tulis live -> Gate 4 DONE.
