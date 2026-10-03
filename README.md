# Pytagotech Integrated Portal

Portal web multi-divisi untuk Pytagotech Group yang menyatukan CRM Marketing, Klien & Deal Handover, Manajemen Proyek, dan Operasional Sosial Media dalam satu sistem terintegrasi.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js (App Router, TypeScript) |
| UI | shadcn/ui + Tailwind CSS |
| Backend/DB | Supabase (Postgres, Auth, Storage, Realtime) |
| Auth | Supabase Auth (email + password) |
| ORM/Queries | Supabase JS Client |

---

## Prasyarat

- Node.js >= 20.x
- pnpm >= 9.x (atau npm/yarn)
- Akun Supabase (project sudah dibuat)

---

## Instalasi & Menjalankan (Development)

```bash
# 1. Clone repository
git clone <repo-url>
cd pytagotech_portal_system

# 2. Masuk ke folder frontend
cd frontend

# 3. Install dependencies
pnpm install

# 4. Salin file env
cp ../.env.example .env.local

# 5. Isi nilai env di .env.local (lihat .env.example untuk daftar variabel)

# 6. Jalankan dev server
pnpm dev
```

Aplikasi akan berjalan di `http://localhost:3000`.

---

## Menjalankan Lint & Typecheck

```bash
cd frontend
pnpm lint          # ESLint
pnpm type-check    # TypeScript check
```

---

## Menjalankan Test

```bash
cd frontend
pnpm test          # Vitest unit test
pnpm test:e2e      # Playwright e2e (jika tersedia)
```

---

## Build Produksi

```bash
cd frontend
pnpm build
pnpm start
```

---

## Struktur Folder

```
/
├── AGENT_RULES.md        # Aturan wajib untuk AI agent
├── CHANGELOG.md          # Riwayat rilis
├── README.md             # File ini
├── .env.example          # Template env var
├── tasks/
│   └── prd-pytagotech-integrated-portal.md   # PRD (read-only)
├── docs/
│   ├── PROGRESS.md       # Status tiap User Story
│   ├── WORKLOG.md        # Log kerja kronologis
│   ├── DECISIONS.md      # Keputusan teknis (ADR)
│   ├── QUESTIONS.md      # Pertanyaan & ambiguitas PRD
│   ├── API.md            # Dokumentasi endpoint API
│   ├── DEPLOYMENT.md     # Panduan deploy
│   └── CHANGE_REQUESTS.md  # Permintaan perubahan PRD
└── frontend/             # Aplikasi Next.js
```

---

## Deploy

Lihat [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) untuk panduan lengkap.

---

## Changelog

Lihat [`CHANGELOG.md`](CHANGELOG.md).
