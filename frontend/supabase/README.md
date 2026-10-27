# Backend Supabase

Backend Pytagotech Portal ditempatkan di dalam `frontend/supabase` agar tetap satu project dengan aplikasi Next.js.

## Isi

- `config.toml`: konfigurasi Supabase CLI lokal.
- `migrations/20261005000000_initial_schema.sql`: baseline schema dari `../../docs/DATABASE.md`.
- `migrations/20261005001000_backend_foundation.sql`: helper role, audit generik, guardrail bisnis, view/RPC dasar, dan policy RLS per modul.
- `migrations/20261005002000_backend_parity_fixes.sql`: parity-fix hasil audit kontrak frontend (RLS role-based, RPC konversi inquiry, notifikasi handover, profil otomatis, hapus policy pemalsu audit).
- `migrations/20261005003000_display_id_search_path.sql`: skualifikasi nama sequence di argumen trigger display ID (lihat bug search_path di bawah).
- `migrations/20261027000000_team_members_is_active.sql`: status aktif tim/PIC (CR-004, US-005 AC3) tanpa mengubah policy SELECT historis.
- `migrations/20261027000100_master_options_delete_policy.sql`: grant + policy ulang DELETE `master_options` untuk Super Admin (Q-016).
- `migrations/20261027000200_audit_entity_id_composite.sql`: `entity_id` audit dari PK tunggal/komposit (Q-017/CR-005); format komposit `kolom1/kolom2`.
- `seed.sql`: data referensi awal untuk role, master options, settings, task template, guides, RACI, team members, dan bucket lampiran.

## Catatan Analisis DATABASE.md

- Schema sudah mencakup seluruh entitas PRD: CRM, handover, proyek/task, sosmed, kolaborasi, audit, settings, dan search primitives.
- RLS sudah diaktifkan deny-all pada semua tabel, tetapi policy detail belum ada. Ini cocok sebagai default aman, tetapi UI belum bisa membaca data nyata sebelum policy Fase 3 dibuat.
- `master_options` memakai FK komposit melalui generated column. Pola ini bagus untuk dropdown admin-managed, tetapi seed wajib masuk sebelum data modul dibuat.
- Audit log sudah memakai `jsonb` untuk `old_value` dan `new_value`; trigger generik masih perlu dibuat pada langkah backend berikutnya.
- `comments` dan `attachments` memakai relasi polimorfik tanpa FK. Ini fleksibel, tetapi validasi entity tujuan harus ditegakkan di service/RPC.
- Display ID memakai sequence + trigger. Migration baseline menambahkan `pgcrypto` karena schema memakai `gen_random_uuid()`.
- `storage.buckets` disiapkan di seed untuk lampiran privat; policy storage object masih perlu dibuat bersama RLS detail.

## Workflow Lokal

Jalankan dari folder `frontend`:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:types
```

`pnpm supabase:types` menghasilkan `src/types/database.ts` dari database lokal.

## Validasi tanpa Docker (PGlite)

Seluruh migrasi + seed + 13 uji fungsional (helper role, trigger lead,
workflow handover + notifikasi, konversi inquiry, profil otomatis) lolos di
PGlite/Postgres asli pada 2026-10-05. `supabase db reset` di mesin Docker
tetap dianjurkan sebagai validasi akhir sebelum Gate 3.

## Bug search_path yang Pernah Ditemukan (catatan)

- `storage.objects.owner` bertipe UUID — policy dengan `::text` gagal 42883.
- Fungsi `SECURITY DEFINER` bersearch_path kosong tidak boleh memakai nama
  tak-diskualifikasi di luar `pg_catalog`: `::citext` (pakai assignment cast)
  dan `nextval('seq_x')` (pakai `public.seq_x`) pernah gagal saat runtime.

## Urutan Implementasi Berikutnya

1. Finalisasi Gate 2 (persetujuan tertulis `DATABASE.md`, sudah mencakup revisi parity-fix) dan samakan migration dengan schema approved.
2. Jalankan `pnpm supabase:reset` di mesin dengan Docker untuk membuktikan migration berjalan dari database kosong (validasi SQL + RLS + RPC, belum bisa di mesin ini).
3. ✅ Helper SQL role/RLS (`has_role`, `is_super_admin`, `current_team_member_id`) — ada di `20261005001000`.
4. ✅ Policy RLS per modul — ada di `20261005001000`, parity-fix di `20261005002000`.
5. ✅ Trigger audit generik — ada di `20261005001000` (trigger-only sejak `20261005002000`).
6. Ganti service mock frontend secara bertahap dengan query/RPC Supabase.
