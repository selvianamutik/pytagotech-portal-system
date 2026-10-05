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
