# Kredensial Uji (UAT) — Pytagotech Portal

> **Environment:** Supabase project `ycqgtazlcxbedfoykhpl` (production, Q-022).
> **URL app:** local dev `http://localhost:3000` · production Vercel (setelah deploy).
> **Kata sandi pilot (kecuali Super Admin):** `Pytagotech!2026`

## Akun per role

| Role | Email | Kata sandi | Catatan |
|------|-------|-----------|---------|
| Super Admin | `info.pytagotech@gmail.com` | *(milik pemilik — tidak diset)* | Akun existing pemilik |
| Executive / Leader | `pilot.executive@pytagotech.id` | `Pytagotech!2026` | |
| Sales / Marketing | `pilot.sales@pytagotech.id` | `Pytagotech!2026` | |
| Project Manager | `pilot.pm@pytagotech.id` | `Pytagotech!2026` | |
| Developer | `pilot.developer@pytagotech.id` | `Pytagotech!2026` | |
| Social Media Specialist | `pilot.sosmed@pytagotech.id` | `Pytagotech!2026` | |
| Graphic Designer / Video Editor / Copywriter | `pilot.designer@pytagotech.id` | `Pytagotech!2026` | |

## Data seed live (Q-027 A)

| Entitas | Isi |
|---------|-----|
| Team members | Nabila · Raka · Dimas Freelance · Ayu Magang |
| Leads | `LEAD-012` (test, F&B), `LEAD-013` (test, F&B) |
| Klien | `pak abi` (id `d15eec32-...`) |
| Deal handover | `HDV-011` — kode `pyt-001`, status `Dikonfirmasi`, deadline `2026-11-19`, nilai 8.000.000 |
| Proyek | `PRJ-010` — `teduh - pak abi (pyt-001)`, Planning, PM Raka, 09–19 Nov 2026 |
| Task | RAD (09–11), PUS (12–16), SAD (17–19) |
| Content ideas | `IDE-001` (Edukasi, Siap Masuk Produksi), `IDE-002` (Promo, Ditunda) |
| Content material | `MAT-0002` (Draf, jadwal 20 Nov) |
| Publication | `PUB-0001` (Instagram, Single, 20 Nov) |

## Reset data demo (Super Admin)

Halaman **Pengaturan → Reset Data Demo** (khusus Super Admin) memulihkan data
operasional ke snapshot di atas dalam satu klik. Memanggil RPC
`public.reset_demo_data()` (SECURITY DEFINER): menghapus semua data operasional
lalu mengisi ulang seed (lead, klien, handover, proyek, task, konten). Akun
login, role, tim, master data, dan pengaturan **tidak** disentuh.

## Perhatian keamanan

- Kredensial ini hanya untuk UAT/pilot, bukan produksi sungguhan.
- Jangan commit file ini ke repo publik; sudah di luar kontrol akses produksi.
- Rotasi kata sandi sebelum go-live.