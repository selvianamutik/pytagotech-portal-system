# DEPLOYMENT.md — Panduan Deploy

> **Status:** Placeholder (Fase 0)  
> Dokumen ini akan dilengkapi saat **Fase 4 — Deploy Ready** dimulai (Gate 3 terpenuhi).

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

> _Akan didokumentasikan di Fase 4_

---

## Checklist Pre-Deploy

> _Akan didokumentasikan di Fase 4 (Gate 4)_
