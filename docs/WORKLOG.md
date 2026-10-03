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
