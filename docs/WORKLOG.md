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
