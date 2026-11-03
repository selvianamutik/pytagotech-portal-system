# DEPLOYMENT.md — Panduan Deploy

> **Status:** Gate 4 — Deploy Ready (2026-11-03)
> Platform final per `DEC-024`: Vercel + Supabase (project `ycqgtazlcxbedfoykhpl`) + Resend SMTP.

---

## Ringkasan Stack Deploy

| Komponen | Platform |
|----------|--------------------|
| Frontend (Next.js) | Vercel (Q-020 A) |
| Backend/DB | Supabase (managed) — project sekarang (Q-022) |
| Storage | Supabase Storage |
| Email Auth | Resend SMTP (Q-024 B) |
| CI/CD | GitHub Actions + Vercel (Q-026 A) |
| Environment | Produksi saja, tanpa staging (Q-023 A) |

---

## Environment Variables yang Dibutuhkan

Lihat [`.env.example`](../.env.example) untuk daftar lengkap.

---

## Langkah Deploy (Vercel + Supabase)

1. Setup project Supabase production (sudah: `ycqgtazlcxbedfoykhpl`).
2. Jalankan semua migration: `supabase db push` (termasuk Q-005 template RAD/PUS/SAD).
3. Deploy frontend ke Vercel (hubungkan repo, framework Next.js).
4. Set semua env var di Vercel (lihat `.env.example`; sertakan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
5. Verifikasi `GET /api/health` → `200` `{ status: "ok" }`.
6. Lakukan smoke test (lihat Checklist Pre-Deploy di bawah).

---

## Backup & Restore Supabase (US-043)

> **Arsip bukan backup.** Soft archive hanya mengisi `archived_at`; baris tetap
> ada di database. Backup terpisah wajib untuk melindungi dari penghapusan,
> kerusakan, atau bencana.

### Cakupan backup

| Objek | Metode utama | Catatan |
|-------|--------------|---------|
| Database `public` | Backup otomatis Supabase + `supabase db dump` | Skema, data bisnis, RPC, trigger, policy RLS |
| Role database | `supabase db dump --role-only` | Untuk self-hosted/cluster; project hosted biasanya sudah punya role bawaan |
| Auth users | Backup platform / PITR / Admin API | `db dump` **tidak** menyertakan schema `auth` |
| Storage `portal-attachments` | `supabase storage cp -r` | Lampiran/berkas yang ditautkan ke tabel `attachments` |
| Environment & secrets | Vault/password manager | Jangan pernah masuk dump SQL atau repo |

### Jadwal & retensi

- **Otomatis:** Supabase menjalankan backup harian sesuai plan project. Buka
  Dashboard → Database → Backups untuk melihat daftar, status, dan masa
  simpannya. Backup **tidak dapat diunduh pada plan Free**; aktifkan plan yang
  mendukung atau gunakan `pg_dump` manual.
- **Manual:** sebelum migration besar, rilis produksi, impor data massal, atau
  perubahan konfigurasi RLS.
- **Bulanan:** simpan satu salinan jangka panjang di storage terenkripsi di
  luar Supabase selama **12 bulan**; backup harian platform disimpan **7 hari**
  (Q-018, `DEC-021`).
- **PITR (Point-in-Time Recovery):** opsi berbayar bila butuh RPO < 24 jam.
  Restore PITR dilakukan ke timestamp tertentu lewat Dashboard atau Management
  API; aktifkan sebelum insiden, bukan sesudahnya.
- Simpan minimal **dua salinan** (satu di region/akun berbeda) dan uji restore
  secara berkala. Backup yang belum pernah diuji restore belum bisa diandalkan.

### Prasyarat

1. Supabase CLI v2+ dan project sudah di-link (`supabase link --project-ref ...`).
2. `SUPABASE_DB_URL` berisi connection string **percent-encoded** dengan user
   yang boleh membaca seluruh tabel. Jangan memakai service role key di browser.
3. `psql` untuk restore. `supabase db dump` menjalankan `pg_dump` di container,
   jadi Docker harus tersedia; bila tidak, gunakan `pg_dump` lokal dengan versi
   yang cocok atau backup platform.
4. Ruang disk cukup untuk skema + data + storage. Backup berisi PII — atur akses
   dan enkripsi sejak file dibuat.

### Prosedur backup manual

Jalankan pada jam sepi. Untuk konsistensi maksimal, hentikan penulisan aplikasi
(maintenance mode) atau gunakan backup platform/PITR; dump logis saat aplikasi
aktif bisa menangkap data di tengah transaksi.

```bash
export SUPABASE_PROJECT_REF="<project-ref>"
export BACKUP_DIR="backups/$(date +%F-%H%M)"
mkdir -p "$BACKUP_DIR"

supabase link --project-ref "$SUPABASE_PROJECT_REF"

# 1. Role (opsional untuk project hosted)
supabase db dump --linked --role-only -f "$BACKUP_DIR/roles.sql"

# 2. Skema public (tanpa data)
supabase db dump --linked -f "$BACKUP_DIR/schema.sql"

# 3. Data public
supabase db dump --linked --data-only -f "$BACKUP_DIR/data.sql"

# 4. Storage lampiran
supabase storage cp -r ss:///portal-attachments "$BACKUP_DIR/portal-attachments" --linked

# 5. Checksum & metadata
sha256sum "$BACKUP_DIR"/*.sql > "$BACKUP_DIR/SHA256SUMS"
```

Alternatif tanpa project link, memakai connection string langsung:

```bash
supabase db dump --db-url "$SUPABASE_DB_URL" -f "$BACKUP_DIR/schema.sql"
supabase db dump --db-url "$SUPABASE_DB_URL" --data-only -f "$BACKUP_DIR/data.sql"
```

Setelah selesai:

- Pastikan setiap file berukuran > 0 dan tidak berisi error di akhir output.
- Enkripsi sebelum dipindah keluar mesin, mis. `age`, `gpg`, atau fitur enkripsi
  bucket/disk. Simpan kunci enkripsi terpisah dari backup.
- Catat tanggal, project ref, commit aplikasi, dan pembuat backup di catatan
  operasional.
- Folder `backups/` sudah di-ignore Git; tetap periksa `git status` sebelum commit.

### Prosedur restore

> **Jangan restore langsung ke produksi tanpa persetujuan pemilik.** Utamakan
> project staging/new project agar bisa diverifikasi lebih dulu.

1. Siapkan database target kosong (project Supabase baru atau instance Postgres).
2. Cabut default privilege agar tabel hasil restore tidak otomatis terbuka untuk
   `anon`/`authenticated` (dokumentasi Supabase):
   ```bash
   psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
   ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
   SQL
   ```
3. Restore skema, lalu data (hentikan bila ada error):
   ```bash
   psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f "$BACKUP_DIR/schema.sql"
   psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f "$BACKUP_DIR/data.sql"
   ```
4. Restore Storage:
   ```bash
   supabase storage cp -r "$BACKUP_DIR/portal-attachments" ss:///portal-attachments --linked
   ```
5. **Auth users:** dump SQL tidak memuat `auth.users`. Untuk pemulihan penuh,
   pakai backup platform/PITR. Bila hanya punya dump SQL, buat ulang user via
   Admin API/Supabase Auth, lalu pastikan `profiles.id` dan `user_roles` kembali
   terhubung. Uji login sebelum mengarahkan aplikasi ke database hasil restore.
6. Verifikasi (lihat checklist di bawah), lalu arahkan environment aplikasi ke
   database hasil restore dan deploy ulang bila perlu.

Untuk penghapusan data yang tidak disengaja, gunakan **PITR** ke timestamp
sebelum insiden (bila aktif) atau restore backup ke project baru. Jangan menjalankan
`data.sql` di atas database produksi yang masih berisi data baru — akan terjadi
konflik primary key dan kehilangan data pasca-backup.

### Checklist verifikasi restore

- [ ] `schema.sql` dan `data.sql` selesai tanpa error (`ON_ERROR_STOP=1`).
- [ ] Jumlah baris tabel utama cocok dengan sumber (leads, projects, tasks,
      content_materials, audit_logs).
- [ ] Login Auth berhasil; `profiles` + `user_roles` terhubung benar.
- [ ] RLS diuji: user tanpa role mendapat 0 baris; role sesuai hanya melihat
      data yang diizinkan.
- [ ] Contoh file `portal-attachments` bisa dibuka dan URL-nya valid.
- [ ] Trigger audit masih mencatat perubahan baru (append-only).
- [ ] Kolom `archived_at` data arsip tetap terisi dan restore data berjalan.
- [ ] Aplikasi lolos smoke test: login, daftar lead/proyek/materi, ekspor CSV,
      dan halaman `/pengaturan/arsip`.

### Retensi arsip & penghapusan permanen

- Data arsip disimpan **2 tahun** sejak `archived_at` sebelum boleh dihapus
  permanen (Q-018, `DEC-021`). Backup harian disimpan 7 hari dan salinan
  backup manual bulanan disimpan 12 bulan.
- Saat ini belum ada job penghapusan otomatis. Jangan menghapus arsip secara
  manual sebelum masa retensi 2 tahun dan salinan backup terkait memenuhi
  retensinya.
- Bila nanti job purge dibuat: ekspor CSV modul terkait lebih dulu, jalankan
  purge terjadwal dengan log audit, lalu verifikasi jumlah baris. Backup yang
  memuat data tersebut tetap mengikuti kebijakan retensi backup di atas.

---

## Rollback

Rollback tersedia dalam tiga tingkat, sesuai lapisan yang gagal.

### 1. Rollback frontend (Vercel)

- Vercel menyimpan deployment sebelumnya; buka Dashboard → Deployments → pilih
  build stabil → **Promote to Production** atau **Redeploy** untuk kembali.
- Jangan hapus deployment aktif sebelum deployment pengganti lolos smoke test.
- Bila masalah muncul dari env var, perbaiki variabel di Vercel lalu redeploy;
  perubahan env memicu build ulang otomatis.

### 2. Rollback database (Supabase)

- **Migration yang gagal di tengah:** perbaiki migration, lalu `supabase db push`
  ulang. Supabase memakai tabel `supabase_migrations`; bandingkan hash bila terjadi
  drift. Bila migration merusak data, restore backup (lihat prosedur restore di atas)
  ke project baru, jangan tumpuk migration di atas data produksi.
- **Perubahan skema/policy yang salah:** karena environment produksi dipakai
  langsung (Q-023 A, tanpa staging), **backup wajib dilakukan sebelum `db push`**.
  Simpan `data.sql` + `schema.sql` sebelum menjalankan migration apa pun.
- **Perubahan data massal:** pulihkan dari backup/PITR. Plan Free (Q-021) tidak
  menyediakan PITR dan backup platform tak dapat diunduh — andalkan dump manual
  (`supabase db dump`) yang dijalankan sebelum perubahan.

### 3. Rollback penuh (frontend + DB)

1. Kembalikan frontend ke deployment stabil (Vercel Promote).
2. Restore database dari backup ke project baru atau database target kosong.
3. Arahkan env `NEXT_PUBLIC_SUPABASE_URL` ke database hasil restore.
4. Jalankan checklist verifikasi restore + smoke test.
5. Crystal-kan penyebab di `docs/WORKLOG.md`; update status Gate bila perlu.

> **Imbang rollback:** rollback online (Vercel) memakan waktu detik–menit;
> rollback database memakan waktu menit–jam. Utamakan mencegah lewat backup
> pra-migration dan uji di project terpisah sebelum menyentuh produksi.

---

## Checklist Pre-Deploy

Jalankan sebelum setiap rilis produksi; seluruh kotak wajib ter-centang.

### Build & kode

- [ ] `pnpm test` hijau (265/265; termasuk `guides.test.ts` DB-backed US-042).
- [ ] `pnpm type-check` (`tsc --noEmit`) tanpa error.
- [ ] `pnpm lint` (`eslint .`) tanpa error.
- [ ] `pnpm build` (`next build`) bersih, tanpa warning fatal.

### Database & migration

- [ ] `supabase db push` terhadap project `ycqgtazlcxbedfoykhpl` sukses.
- [ ] Migration Q-005 (`task_template_rad_pus_sad`) terpasang.
- [ ] Backup manual (`schema.sql` + `data.sql`) tersimpan sebelum push.
- [ ] RLS tulis live terverifikasi: Super Admin penuh; Sales tulis lead; PM tulis
      proyek; antar-modul tetap terblokir.

### Environment & layanan

- [ ] Semua env var Vercel terisi: `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`,
      `TZ`, `NEXT_PUBLIC_MAX_ATTACHMENT_SIZE_BYTES`.
- [ ] Resend SMTP terpasang di Auth (email invite/reset terkirim, tak masuk spam).
- [ ] `GET /api/health` → `200` `{ status: "ok", db: "ok" }`.

### Smoke test (per role)

- [ ] Super Admin login → kelola user, master data, panduan.
- [ ] Sales login → buat lead, ubah lead, ekspor CSV, lihat pipeline.
- [ ] PM login → buat proyek, tambah task, tampilkan gantt/kalender.
- [ ] Sosmed Specialist login → ide konten, materi, publikasi, kalender sosmed.
- [ ] Halaman `/pengaturan/arsip` dan `/pengaturan/audit-log` terbuka.

### Akun & data pilot (Q-027)

- [ ] Akun pilot per role dibuat (Super Admin, Executive, Sales, PM, Developer,
      Sosmed Specialist, tim produksi) dengan email aktif.
- [ ] Data seed contoh terpasang (per jawaban Q-027) untuk demo/pilot.
