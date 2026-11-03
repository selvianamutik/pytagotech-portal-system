# Rencana Gate 4 — Deploy Ready

> **Tanggal:** 2026-11-03
> **Ruang lingkup:** memenuhi kriteria Gate 4 `docs/PROGRESS.md` (build produksi bersih + dokumentasi lengkap), menutup residual Gate 3, dan menyelaraskan sisa implementasi dengan PRD.
> **Sumber kebenaran:** `tasks/prd-pytagotech-integrated-portal.md`, `docs/DATABASE.md` (APPROVED), `docs/BACKEND_COMPLETION_PLAN.md`.

## 1. Kondisi awal

- Gate 1–3 `DONE`. FR-5 dan FR-15..FR-31 `DONE`; seluruh service DB-backed kecuali `guides.ts` (US-042).
- Verifikasi hijau: test **265/265**, `tsc --noEmit`, `eslint .`, `next build` (36 halaman statis).
- **Residual Gate 3 (prasyarat Gate 4):**
  - Browser per-US dan RLS tulis live belum dijalankan ulang — Docker/Supabase CLI tidak tersedia; proyek Supabase free intermitten `404`.
  - Migration `20261103000000_task_template_rad_pus_sad.sql` (Q-005) belum di-`db push` ke live.

## 2. Temuan kesesuaian PRD (audit 2026-11-03)

| # | Temuan | PRD | Status |
|---|--------|-----|--------|
| G4-1 | `services/guides.ts` (US-042) masih **mock in-memory** (`guideStore`/`raciStore`), padahal schema `guides` + `raci_matrix` sudah ada di DATABASE.md | US-042 AC "panduan markdown diedit Admin" + "matriks RACI" | GAP — harus DB-backed |
| G4-2 | `.env.example` stale: tidak memuat `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` yang kini dipakai `.env.local` | US-001/Tech | Doc gap |
| G4-3 | Tidak ada endpoint health check (`/health`) padahal langkah deploy menuntut "verifikasi health check" | Bagian 8 + `docs/DEPLOYMENT.md` | Gap |
| G4-4 | `Guides` (2 seed) & `raci_matrix` (3 seed) terdokumentasi di DATABASE.md tetapi belum dialirkan ke service | US-042 | Terkait G4-1 |
| G4-5 | `docs/DEPLOYMENT.md` masih placeholder untuk Rollback & Pre-Deploy checklist | Gate 4 DoD | Doc gap |

**Konforming (dikonfirmasi):** FR-5..FR-31 DB-backed; tidak ada service aplikasi yang mengimpor `@/mocks/*`; audit via trigger DB; RLS active (Q-019, 42/42 tabel); build produksi bersih.

## 3. Work items (berurutan)

1. **W-1 — DB-back US-042 (G4-1/G4-4).** Ganti `guides.ts` → tabel `guides` + `raci_matrix`; `updateGuide` (Admin) persist; `setRaciCell` ke `raci_matrix`; seed 2 panduan + 3 RACI. Pertahankan `resetMockGuides` sebagai no-op (konsisten service lain). Perlakukan sebagai perubahan dalam schema APPROVED (bukan schema baru).
2. **W-2 — Lengkapi `.env.example` (G4-2).** Tambah `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; samakan daftar var dengan `.env.local`.
3. **W-3 — Health check endpoint (G4-3).** Tambah `GET /api/health` yang mengembalikan status build + konektivitas DB minimal (tanpa membocorkan info).
4. **W-4 — Tuntaskan residual Gate 3.** `supabase db reset`/`db push` (butuh Docker/CLI), lalu verifikasi browser per-US + RLS tulis live. Tandai per-US sebagai `DONE` hanya setelah lolos.
5. **W-5 — Lengkapi `docs/DEPLOYMENT.md` (G4-5).** Isi Rollback + Checklist Pre-Deploy (health, env, migration, smoke test, backup).
6. **W-6 — Smoke test.** Setelah akun/seed tersedia: login per role, daftar lead/proyek/materi, ekspor CSV, `/pengaturan/arsip`, `/pengaturan/master-data`, jadwal+sosmed.
7. **W-7 — Penutupan Gate 4.** Perbarui `docs/PROGRESS.md`/`docs/WORKLOG.md`, commit per item (`Refs: US-xxx, FR-x`).

## 4. Blocker / keputusan pemilik (lihat `docs/QUESTIONS.md`)

> **Jawaban pemilik 2026-11-03** (DEC-024): Q-020 A (Vercel) · Q-021 Free · Q-022 project sekarang · Q-023 A (prod saja) · Q-024 B (Resend) · Q-025 B (seed data) · Q-026 A (GitHub Actions + Vercel).

| Q | Isu | Status |
|---|-----|--------|
| Q-020 | Target deploy (Vercel vs VPS/Docker) | ANSWERED — Vercel |
| Q-021 | Plan Supabase (Free vs Pro) | ANSWERED — Free (risiko backup/PITR diterima) |
| Q-022 | Project Supabase production | ANSWERED — project sekarang |
| Q-023 | Domain & jumlah environment | ANSWERED — prod saja |
| Q-024 | Provider email Auth | ANSWERED — Resend |
| Q-025 | Akun pilot & strategi seed | ANSWERED — B (seed data); rincian → Q-027 |
| Q-026 | CI/CD remote + secrets + monitoring | ANSWERED — GitHub Actions + Vercel |
| Q-027 | Rincian data seed pilot + akun per role | **OPEN** — menunggu jawaban |

## 5. Kriteria penutupan Gate 4 (Definition of Done)

- [x] US-042 DB-backed (W-1) + test hidup; `.env.example` lengkap (W-2).
- [ ] `supabase db push` ke project yang disetujui; migration Q-005 terpasang. ⛔ CLI/Docker tidak tersedia; Q-005 belum terpasang live.
- [ ] Browser per-US + RLS tulis live tuntas dan terdokumentasi (residual Gate 3).
- [~] `next build` bersih; health check merespons 200; smoke test lolos. — build ✅, health ✅, smoke test ⛔ (butuh akun pilot Q-027).
- [x] `docs/DEPLOYMENT.md` Rollback + Pre-Deploy checklist lengkap (W-5).
- [ ] `docs/PROGRESS.md` Gate 4 → `DONE`; commit `Refs: US-xxx, FR-x`.

## 6. Status

- [x] W-1 · [x] W-2 · [x] W-3 · [ ] W-4 · [x] W-5 · [ ] W-6 · [ ] W-7

**Catatan W-4 (terblokir):** verifikasi live memastikan migration Q-005 **belum** terpasang — `task_templates` live masih berisi 5 template lama aktif (`Kickoff dan klarifikasi scope`, dst), bukan RAD/PUS/SAD. Butuh `supabase db push` (CLI `supabase` + `docker` TIDAK tersedia di environment ini; butuh DB password/access token dari pemilik). Browser per-US + RLS tulis live ikut terblokir pada prasyarat yang sama.