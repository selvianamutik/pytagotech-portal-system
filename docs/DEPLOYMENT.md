# DEPLOYMENT.md — Panduan Deploy

> **Status:** Placeholder (Fase 0)  
> Dokumen ini akan dilengkapi saat **Fase 3 — Deploy Ready** dimulai (Gate 2 terpenuhi).

---

## Ringkasan Stack Deploy

| Komponen | Platform (rencana) |
|----------|--------------------|
| Frontend (Next.js) | Vercel / VPS dengan Docker |
| Backend/DB | Supabase (managed) |
| Storage | Supabase Storage |
| CI/CD | GitHub Actions |

---

## Environment Variables yang Dibutuhkan

Lihat [`.env.example`](../.env.example) untuk daftar lengkap.

---

## Langkah Deploy (akan diisi di Fase 3)

1. Setup Supabase project (production)
2. Jalankan semua migration: `supabase db push`
3. Deploy frontend ke Vercel/server
4. Set semua env var di platform deploy
5. Verifikasi health check endpoint
6. Lakukan smoke test

---

## Rollback

> _Akan didokumentasikan di Fase 3_

---

## Checklist Pre-Deploy

> _Akan didokumentasikan di Fase 3 (Gate 3)_
