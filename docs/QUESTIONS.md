# QUESTIONS.md — Pertanyaan & Ambiguitas PRD

> Pertanyaan ini diajukan ke pemilik proyek. Pekerjaan pada bagian yang terblokir **ditunda** sampai ada jawaban.  
> Format status: `[OPEN]` atau `[ANSWERED]`

---

## Q-001 — [ANSWERED]

- **Terkait:** US-020, US-019 / FR-15
- **Pertanyaan:** Apakah satu klien dapat memiliki beberapa PM (Project Manager), atau satu PM per proyek?
- **Opsi yang dipertimbangkan:**
  - A) Satu PM per proyek (relasi 1-1 proyek:PM)
  - B) Banyak PM per proyek (relasi M-M proyek:PM) — lebih fleksibel tapi lebih kompleks
- **Dampak jika salah:** Skema database berbeda (kolom `pm_id` vs tabel join `project_managers`); perlu migration ulang.
- **Jawaban:** A

---

## Q-002 — [ANSWERED]

- **Terkait:** US-035, FR-25
- **Pertanyaan:** Rumus Engagement Rate resmi: berdasarkan Reach atau Views/Impresi?
- **Opsi yang dipertimbangkan:**
  - A) `ER = (Likes + Comments + Shares + Saves) / Reach × 100%`
  - B) `ER = (Likes + Comments + Shares + Saves) / Views × 100%`
  - C) Formula lain yang sudah digunakan tim
- **Dampak jika salah:** Angka dashboard akan berbeda dari laporan lama; perlu update formula dan data historis.
- **Jawaban:** C (Total engagement ÷ Total reach) × 100%

---

## Q-003 — [ANSWERED]

- **Terkait:** US-027, FR-21
- **Pertanyaan:** Berapa ambang skor kelengkapan brief minimal agar ide bisa berstatus "Siap Masuk Produksi"?
- **Opsi yang dipertimbangkan:**
  - A) 5/5 (semua field brief wajib terisi)
  - B) 4/5 (satu field boleh kosong)
- **Dampak jika salah:** Jika terlalu ketat (5/5), banyak ide tertahan dan menghambat produksi. Jika terlalu longgar (4/5), ada konten kurang persiapan masuk produksi.
- **Jawaban:** A

---

## Q-004 — [ANSWERED]

- **Terkait:** US-033, FR-24
- **Pertanyaan:** Berapa jam/hari toleransi sebelum jadwal rilis konten ditandai "Overdue" dan "Kritis"?
- **Opsi yang dipertimbangkan:**
  - A) Overdue: melewati jam rilis yang dijadwalkan; Kritis: > 24 jam dari jadwal
  - B) Nilai jam dapat dikonfigurasi dari halaman Pengaturan
- **Dampak jika salah:** Indikator Overdue/Kritis akan muncul terlalu cepat atau terlambat, memengaruhi SOP tim.
- **Jawaban:** B

---

## Q-005 — [ANSWERED]

- **Terkait:** US-021, FR-16
- **Pertanyaan:** Apa daftar lengkap template task standar untuk proyek baru? (nama aktivitas, urutan, durasi default)
- **Konteks:** US-021 menyebut "Admin dapat mengelola template task" — tapi task awal (seed) perlu didefinisikan agar sistem tidak dimulai dari template kosong.
- **Dampak jika salah:** Jika template salah, setiap proyek baru perlu penyesuaian manual yang menambah waktu PM.
- **Jawaban (2026-11-03):** Urutan task default: (1) Pembuatan dokumen RAD, (2) Pembuatan dokumen PUS, (3) Pembuatan dokumen SAD. Masing-masing berdurasi **3 hari kerja**.

---

## Q-006 — [ANSWERED]

- **Terkait:** US-016, FR-12
- **Pertanyaan:** Apakah termin pembayaran perlu pengingat/notifikasi otomatis ke Sales/Finance saat tanggal jatuh tempo mendekat?
- **Opsi yang dipertimbangkan:**
  - A) Tidak ada pengingat otomatis (hanya tampil di UI)
  - B) Notifikasi in-app saja (sesuai US-006)
  - C) Notifikasi eksternal (email/WhatsApp) — ini memerlukan CR terpisah
- **Dampak jika salah:** Jika tidak ada pengingat, Sales/Finance bisa melewatkan tanggal tagihan. Jika notifikasi eksternal dibutuhkan, perlu integrasi tambahan di luar scope PRD saat ini.
- **Jawaban:** C

---

## Q-007 — [ANSWERED]

- **Terkait:** US-035, FR-25
- **Pertanyaan:** Siapa yang berhak mengubah data KPI Final setelah terkunci — hanya Super Admin, atau Leader juga?
- **Opsi yang dipertimbangkan:**
  - A) Hanya Super Admin
  - B) Super Admin + Leader/Executive
- **Dampak jika salah:** Jika terlalu terbuka, integritas data KPI Final terganggu. Jika terlalu ketat, Admin terbebani permintaan unlock.
- **Jawaban:** B

---

## Q-008 — [ANSWERED]

- **Terkait:** US-006, FR-4
- **Pertanyaan:** Apakah notifikasi perlu dikirim via saluran eksternal (email / WhatsApp) selain in-app?
- **Opsi yang dipertimbangkan:**
  - A) In-app saja (sesuai scope PRD saat ini)
  - B) Email tambahan
  - C) WhatsApp tambahan (perlu integrasi — CR terpisah)
- **Dampak jika salah:** Jika notifikasi eksternal diminta sekarang, perlu CR dan integrasi tambahan yang tidak ada di PRD.
- **Jawaban:** A

---

## Q-009 — [ANSWERED]

- **Terkait:** US-007, US-013, US-027 / FR-6, FR-10, FR-21
- **Pertanyaan:** Apakah tiga lini bisnis (Pytagotech, Pytabelajar, Pytafix) memisahkan data CRM dan Proyek, atau hanya Sosmed?
- **Opsi yang dipertimbangkan:**
  - A) Lini bisnis hanya relevan untuk modul Sosmed (kolom `brand` di tabel konten)
  - B) Semua modul (CRM, Proyek, Sosmed) memiliki kolom `lini_bisnis` — lead, proyek, dan konten bisa difilter per brand
- **Dampak jika salah:** Skema tabel dan filter dashboard berbeda; perlu tambah kolom di `leads`, `projects`, dll. jika pilihan B.
- **Jawaban:** C untuk sekarang hanya 1 lini bisnis saja

---

## Q-010 — [ANSWERED]

- **Terkait:** US-006, US-034 / FR-4
- **Pertanyaan:** Berapa batas ukuran lampiran per file, dan berapa lama data arsip disimpan sebelum dihapus permanen?
- **Opsi yang dipertimbangkan:**
  - Ukuran: A) 5MB  B) 10MB  C) Dapat dikonfigurasi dari Pengaturan
  - Retensi arsip: A) Tidak pernah dihapus otomatis  B) Dihapus setelah X tahun (perlu dikonfirmasi)
- **Dampak jika salah:** Jika terlalu kecil, user frustrasi. Jika terlalu besar, biaya Supabase Storage membengkak. Kebijakan retensi memengaruhi prosedur backup (US-043).
- **Jawaban:** ukuran : C, retensi arsip : B

---

## Q-011 — [ANSWERED]

- **Terkait:** US-016 / FR-12
- **Pertanyaan:** Apakah diperlukan role Finance khusus untuk mengelola termin pembayaran, atau cukup Sales dan Admin?
- **Opsi yang dipertimbangkan:**
  - A) Tidak perlu role Finance terpisah — Sales + Admin cukup
  - B) Tambah role Finance — bisa melihat dan mengubah status termin (perlu CR jika disetujui)
- **Dampak jika salah:** Jika Finance dibutuhkan, perlu tambah role, RLS policy, dan menu navigasi — ini di luar scope PRD saat ini.
- **Jawaban:** B

---

## Q-012 — [ANSWERED]

- **Terkait:** US-015 / FR-11
- **Pertanyaan:** Apa isi panduan pengisian (SOP dari sheet "Read me") yang harus tampil sebagai panel bantuan di form Deal Handover?
- **Opsi yang dipertimbangkan:**
  - A) Salin isi sheet "Read me" apa adanya ke panel bantuan
  - B) Ringkas menjadi panduan per field
- **Dampak jika salah:** Panel saat ini memakai panduan interim yang diturunkan dari PRD; perlu diganti setelah jawaban tersedia.
- **Jawaban (2026-11-03):** B — ringkas menjadi panduan per field.

---

## Q-013 — [ANSWERED]

- **Terkait:** US-026 / FR-20
- **Pertanyaan:** Apa yang dimaksud "divisi" pada filter dashboard produksi (per divisi, proyek, rentang waktu)? Apakah divisi = tim/role (Sales, Produksi, Sosmed), atau ada struktur divisi tersendiri?
- **Opsi yang dipertimbangkan:**
  - A) Divisi = tim pelaksana (filter per PM/role yang sudah ada)
  - B) Ada master divisi tersendiri (perlu tabel + filter baru)
- **Dampak jika salah:** Filter dashboard salah sasaran; bila opsi B, perlu master data tambahan.
- **Jawaban (2026-11-03):** A — divisi berarti tim pelaksana; gunakan filter PM/role yang sudah ada. Tidak ada master divisi atau tabel baru.

---

## Q-014 — [ANSWERED]

- **Terkait:** US-003 / FR-1
- **Pertanyaan:** Verifikasi RLS lewat `supabase db reset` + uji role belum bisa dijalankan karena Docker dan Supabase CLI tidak tersedia di mesin ini. Apakah US-003 ditunda sampai environment verifikasi tersedia?
- **Opsi yang dipertimbangkan:**
  - A) Pasang Docker / jalankan `db reset` di mesin lain sebelum menutup US-003
  - B) Uji policy dengan PGlite sebagai pengganti sementara
  - C) Tunda US-003, tandai `BLOCKED`, lanjut ke US-005
- **Dampak jika salah:** Gate 3 dan tag `v0.3.0-backend` tidak bisa ditutup sebelum US-003 selesai; menandai `DONE` tanpa verifikasi akan melanggar Definition of Done.
- **Jawaban:** Pemilik memilih **opsi C (tunda)** pada 2026-10-27. US-003 tetap `BLOCKED` dan wajib diselesaikan sebelum Gate 3.

---

## Q-015 — [ANSWERED]

- **Terkait:** US-005 / FR-3
- **Pertanyaan:** Acceptance Criteria US-005 menyebut opsi yang sedang dipakai hanya boleh dinonaktifkan. Skema `team_members` yang disetujui belum memiliki kolom `is_active`, sehingga anggota tim/PIC tidak bisa dinonaktifkan tanpa perubahan skema.
- **Opsi yang dipertimbangkan:**
  - A) Tambah kolom `team_members.is_active` lewat CR + migration (dropdown form memfilter yang aktif)
  - B) Tanpa perubahan skema: blokir hapus anggota yang sudah dipakai, edit nama/status tetap bisa; anggota tak terpakai boleh dihapus
  - C) Keluarkan tim/PIC dari US-005 dan jadikan US terpisah
- **Dampak jika salah:** Opsi A menambah kolom + migration baru dan menunda verifikasi karena `db reset` belum bisa dijalankan. Opsi B membuat perilaku tim/PIC sedikit berbeda dari opsi master lain (tidak ada tombol nonaktifkan).
- **Jawaban:** Pemilik memilih **opsi A** pada 2026-10-27: tambah `team_members.is_active` lewat CR-004 + migration. Dropdown form memfilter anggota aktif; anggota yang sudah dipakai dinonaktifkan, bukan dihapus. Migration sudah diterapkan ke live; REST (toggle aktif/nonaktif + filter dropdown) dan browser `/pengaturan/master-data` lolos pada 2026-10-27.

---

## Q-016 — [ANSWERED]

- **Terkait:** US-005 / FR-3
- **Pertanyaan:** Di database live, DELETE `master_options` oleh Super Admin mengembalikan HTTP 200 dengan 0 baris tanpa error, sehingga opsi tidak terhapus. INSERT/PATCH `master_options` dan DELETE `team_members` berhasil. Dengan service role, DELETE `master_options` berhasil. Apakah pemilik menyetujui perbaikan policy RLS live + migration pengaman di repo, atau menonaktifkan tombol hapus sementara?
- **Bukti (2026-10-27):**
  - REST DELETE `master_options?category=eq.industry&value=eq.Verifikasi%20US005` → `200 []`; baris tetap ada setelah reload.
  - REST DELETE `team_members?id=eq.<uuid>` → `200` + 1 baris terhapus.
  - Service role DELETE tiga baris uji `master_options` → `200` + 1 baris per request; data uji sudah bersih.
  - `audit_logs` mencatat insert/update `master_options`, tetapi tidak ada delete karena 0 baris terhapus.
  - Repo `20261005001000_backend_foundation.sql` sudah punya policy `master_options_manage_admin for all ... using (private.is_super_admin())`; kemungkinan policy live tertinggal/berbeda.
- **Opsi yang dipertimbangkan:**
  - A) Pemilik menjalankan diagnostik SQL, menerapkan ulang policy live, dan menambahkan migration pengaman di repo; lalu ulangi browser test.
  - B) Sembunyikan tombol hapus `master_options` sementara (hanya tambah/ubah/aktif/nonaktif) sampai policy diperbaiki.
  - C) Tunggu US-003 (`db reset` + verifikasi RLS) selesai, baru perbaiki live.
- **Dampak jika salah:** A memulihkan CRUD penuh; B menurunkan AC (tidak ada delete) tetapi tidak menyesatkan user; C menunda penutupan US-005.
- **Diagnostik yang diminta:**
  ```sql
  select policyname, permissive, roles, cmd, qual, with_check
  from pg_policies
  where schemaname = 'public' and tablename = 'master_options';

  select grantee, privilege_type
  from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'master_options';

  select tgname, pg_get_triggerdef(oid)
  from pg_trigger
  where tgrelid = 'public.master_options'::regclass and not tgisinternal;
  ```
- **Usulan perbaikan (setelah disetujui):**
  ```sql
  drop policy if exists "master_options_manage_admin" on public.master_options;
  create policy "master_options_manage_admin" on public.master_options
  for all to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());
  ```
- **Jawaban:** Pemilik memilih **opsi A** pada 2026-10-27: perbaiki policy live + tambahkan migration pengaman. Migration `20261027000100_master_options_delete_policy.sql` mengembalikan policy SELECT/manage dan grant DELETE untuk role `authenticated`; RLS tetap membatasi tulis ke Super Admin. Diagnostik live menunjukkan hanya ada policy INSERT/UPDATE/SELECT (tanpa DELETE), sehingga baris terfilter saat DELETE. Setelah migration diterapkan, REST DELETE mengembalikan 1 baris dan browser berhasil menghapus opsi uji; data uji sudah dibersihkan.

---

## Q-017 — [ANSWERED]

- **Terkait:** US-004 / FR-2
- **Pertanyaan:** `audit_logs.entity_id` kosong untuk tabel ber-PK komposit seperti `master_options(category, value)` dan `user_roles(user_id, role_name)`. Trigger audit hanya membaca kolom `id`/`display_id`. Apakah perlu diperbaiki sekarang atau dicatat sebagai keterbatasan?
- **Bukti:** Audit log `master_options` insert/update menampilkan kolom Entitas kosong; baris seed `user_roles` juga kosong.
- **Opsi yang dipertimbangkan:**
  - A) Perbaiki `private.audit_row_change()` agar membangun `entity_id` dari kolom PK komposit (butuh migration + verifikasi `db reset`).
  - B) Biarkan; nilai lama/baru di `old_value`/`new_value` sudah cukup untuk audit.
- **Dampak jika salah:** A memperbaiki keterlacakan audit; B menyisakan kolom entitas kosong untuk beberapa tabel.
- **Jawaban:** Pemilik memilih **opsi A** pada 2026-10-27: perbaiki `private.audit_row_change()` agar `entity_id` dibangun dari seluruh kolom PK. Migration `20261027000200_audit_entity_id_composite.sql` membaca kolom PK dari katalog; PK tunggal tetap memakai nilai aslinya, sedangkan PK komposit digabung dengan `/` (mis. `industry/F&B`). Verifikasi live: `master_options` menghasilkan `industry/ZZ Audit Composite Test`, `raci_matrix` menghasilkan `ZZ Audit Test/QA`, dan `team_members` (PK tunggal) tetap menghasilkan UUID. Data/audit uji dibersihkan; baris audit lama tidak diubah agar sifat append-only tetap terjaga.

---

## Q-018 — [ANSWERED]

- **Terkait:** US-043 / FR-5, lanjutan Q-010
- **Pertanyaan:** Q-010 memilih retensi arsip opsi B (dihapus permanen setelah X tahun), tetapi nilai X belum ditentukan. Berapa tahun arsip disimpan sebelum dihapus, dan berapa lama backup Supabase perlu dipertahankan?
- **Opsi yang dipertimbangkan:**
  - A) Arsip 2 tahun; backup harian 7 hari + backup manual bulanan 12 bulan
  - B) Arsip 5 tahun; backup harian 30 hari + backup manual bulanan 24 bulan
  - C) Tidak ada penghapusan otomatis; backup mengikuti batas plan Supabase
  - D) Nilai lain (diisi pemilik)
- **Dampak jika salah:** Job purge tidak boleh dibuat sebelum X disepakati. Retensi backup memengaruhi biaya penyimpanan dan kepatuhan terhadap data pelanggan. Saat ini arsip hanya mengisi `archived_at` dan **belum ada penghapusan otomatis**.
- **Jawaban:** Pemilik memilih **opsi A** pada 2026-10-27: arsip disimpan **2 tahun** sebelum boleh dihapus permanen; backup harian disimpan **7 hari** dan salinan backup manual bulanan disimpan **12 bulan**. Kebijakan dicatat di `docs/DEPLOYMENT.md` dan `DEC-021`; belum ada job purge otomatis, dan penghapusan manual tidak boleh dilakukan sebelum masa retensi/backup terpenuhi.

---

## Q-019 — [ANSWERED]

- **Terkait:** US-003 AC2 vs US-009, US-020 / FR-1, FR-6, FR-15
- **Pertanyaan:** AC2 US-003 meminta "Sales hanya dapat mengubah lead miliknya; PM hanya dapat mengubah proyek yang ia kelola". Namun migrasi `20261005002000_backend_parity_fixes.sql` sengaja mengganti policy owner-only menjadi role-based agar sesuai kontrak frontend US-009 (Sales boleh assign/reassign PIC massal) dan US-020 (semua PM/Admin boleh membuat/mengubah proyek). Policy live saat ini mengikuti role-based. Arah mana yang benar?
- **Bukti verifikasi live (2026-10-27):**
  - 42/42 tabel memiliki `ENABLE ROW LEVEL SECURITY`. User tanpa role mendapat 0 baris untuk `leads`, `projects`, `clients`, dan `audit_logs`; INSERT lead ditolak `403` dengan pesan `new row violates row-level security policy for table "leads"`.
  - Sales dapat mengubah lead miliknya (`200`, 1 baris); PM dapat mengubah proyek miliknya (`200`, 1 baris).
  - Sales **juga** dapat mengubah lead milik PIC lain (`200`, 1 baris; `next_follow_up` berubah menjadi `2026-11-16`) dan PM **juga** dapat mengubah proyek milik PM lain (`200`, 1 baris; `target_date` berubah menjadi `2027-01-05`).
  - Batas antar-modul tetap terjaga: Sales tidak dapat mengubah proyek dan PM tidak dapat mengubah lead.
  - Semua user/data uji dihapus setelah verifikasi; tidak ada perubahan skema/policy.
- **Opsi yang dipertimbangkan:**
  - A) **Pertahankan role-based** (kondisi repo/live saat ini). Sales + Super Admin boleh mengubah semua lead; PM + Super Admin semua proyek. AC2 US-003 diubah lewat CR dari "miliknya" menjadi "sesuai role modul"; dokumentasi menyatakan batas akses per modul, bukan per baris.
  - B) **Kembalikan owner-only** untuk UPDATE `leads`/`projects` (Super Admin tetap penuh). Frontend US-009/US-020 harus diberi guard: bulk assign ke PIC lain dan edit proyek PM lain ditolak dengan pesan jelas.
  - C) **Hybrid: owner-only + RPC reassignment (disarankan).** UPDATE biasa hanya untuk pemilik (`leads.pic_id`/`projects.pm_id` = team member user; Super Admin penuh), sedangkan reassign PIC/proyek dilakukan lewat RPC `SECURITY DEFINER` khusus dengan validasi role + audit: Sales untuk lead (US-009), PM hanya untuk proyek yang dikelolanya, Super Admin untuk semua. Sales tetap bisa bulk assign, reassign proyek tetap tersedia, dan AC2 terpenuhi untuk perubahan data biasa. Perlu migration baru + penyesuaian service frontend.
- **Dampak jika salah:**
  - A: AC2 literal tidak terpenuhi; Sales/PM berisiko mengubah data rekan. Tidak ada perubahan kode, tetapi perlu persetujuan perubahan AC.
  - B: melanggar kontrak UI US-009/US-020; bulk assign dan edit proyek lintas PM gagal sampai frontend diubah.
  - C: paling sesuai AC2 + PRD, tetapi menambah migration, RPC, perubahan service, dan verifikasi ulang.
- **Catatan:** Tidak ada policy, migration, atau frontend yang diubah sampai pemilik memilih. `db reset` dari database kosong masih belum bisa dijalankan karena Docker/Supabase CLI/WSL tidak tersedia; verifikasi live dipakai sebagai bukti sementara.
- **Jawaban:** Pemilik memilih **opsi A (pertahankan role-based)** pada 2026-10-27. AC2 US-003 direvisi lewat **CR-003**: Sales/Marketing dapat mengubah lead dan Project Manager dapat mengubah proyek sesuai batas role modul; Super Admin penuh. PRD telah diperbarui oleh pemilik pada 2026-10-27; **US-003 DONE 4/4**.

---

## Q-020 — [ANSWERED] — Deploy target

- **Terkait:** Gate 4 — Deploy Ready (Bagian 8, docs/DEPLOYMENT.md)
- **Pertanyaan:** Frontend Next.js di-deploy ke mana?
- **Opsi yang dipertimbangkan:**
  - A) Vercel (managed, paling cepat, dukungan Next.js penuh)
  - B) VPS + Docker (kontrol penuh, self-host)
- **Dampak jika salah:** Menentukan CI/CD, konfigurasi env, domain, dan prosedur rollback.
- **Jawaban (2026-11-03):** A — Vercel.

---

## Q-021 — [ANSWERED] — Plan Supabase

- **Terkait:** Gate 4; Q-018 (backup/PITR); residual Gate 3
- **Pertanyaan:** Plan Supabase mana yang dipakai untuk produksi?
- **Opsi yang dipertimbangkan:** Free / Pro / Team.
- **Dampak jika salah:** Plan Free tidak bisa mengunduh backup (Q-018 mensyaratkan backup harian 7 hari + bulanan 12 bulan) dan PITR tidak tersedia; rate-limit Free juga memicu intermitten 404 saat verifikasi RLS live. Pro memasukkan backup download + PITR → memenuhi Q-018.
- **Jawaban (2026-11-03):** Free. **Risiko terdokumentasi:** backup platform tak dapat diunduh dan PITR tak tersedia di plan Free — prosedur backup manual `docs/DEPLOYMENT.md` tetap berlaku sebagai mitigasi; intermitten 404 pada verifikasi RLS live adalah efek rate-limit Free, bukan kegagalan skema.

---

## Q-022 — [ANSWERED] — Project Supabase produksi

- **Terkait:** Gate 4
- **Pertanyaan:** Project Supabase produksi: pakai project ycqgtazlcxbedfoykhpl yang terhubung saat ini, atau buat project baru khusus produksi?
- **Dampak jika salah:** Tujuan db push (migration termasuk Q-005) dan nilai env berbeda.
- **Jawaban (2026-11-03):** Pakai project saat ini (`ycqgtazlcxbedfoykhpl`).

---

## Q-023 — [ANSWERED] — Domain & environment

- **Terkait:** Gate 4
- **Pertanyaan:** Apakah perlu environment staging vs production terpisah, dan custom domain apa yang dipakai?
- **Opsi yang dipertimbangkan:** A) prod saja; B) staging + prod.
- **Dampak jika salah:** Butuh 1 vs 2 project Supabase + konfigurasi domain, memengaruhi rollback.
- **Jawaban (2026-11-03):** A — produksi saja, tanpa environment staging terpisah.

---

## Q-024 — [ANSWERED] — Email provider Auth

- **Terkait:** US-002 (invite user, reset password)
- **Pertanyaan:** Email invite/reset password lewat SMTP apa?
- **Opsi yang dipertimbangkan:** A) default supabase.co (rate limit, bukan domain sendiri); B) SMTP custom (Resend/SendGrid, pakai domain sendiri).
- **Dampak jika salah:** Email invite/reset bisa masuk spam atau tidak terkirim di produksi.
- **Jawaban (2026-11-03):** B — Resend (SMTP custom).

---

## Q-025 — [ANSWERED] — Akun pilot & strategi seed

- **Terkait:** Gate 4 smoke test + go-live
- **Pertanyaan:** Siapa user pertama per role (akun pilot), dan konfirmasi strategi "tanpa migrasi data lama" tetap berlaku?
- **Opsi yang dipertimbangkan:** A) mulai nol sesuai Non-Goals PRD; B) seed beberapa data contoh untuk demo/pilot.
- **Dampak jika salah:** Smoke test butuh akun nyata per role; data seed menentukan hasil uji browser.
- **Jawaban (2026-11-03):** B — sediakan data contoh untuk demo/pilot. Rincian data seed dipindah ke **Q-027** (pertanyaan baru).

---

## Q-026 — [ANSWERED] — CI/CD, secrets & monitoring

- **Terkait:** Gate 4
- **Pertanyaan:** Apakah remote GitHub / runner CI tersedia, dan butuh monitoring error apa (Sentry/alternatif)?
- **Opsi yang dipertimbangkan:** A) GitHub Actions + Vercel; B) manual deploy.
- **Dampak jika salah:** Deploy otomatis tidak berjalan; tidak ada observability error produksi.
- **Jawaban (2026-11-03):** A — GitHub Actions + Vercel.

---

## Q-027 — [ANSWERED] — Rincian data seed pilot

- **Terkait:** Gate 4 (W-6); lanjutan Q-025 (B)
- **Pertanyaan:** Data contoh mana yang perlu di-seed untuk demo/pilot, dan apa sumbernya?
- **Opsi yang dipertimbangkan:**
  - A) Fiktif minimal per modul (2–3 lead, 1 klien, 1 deal handover + proyek, 3 task template RAD/PUS/SAD, 2 ide konten + 1 materi, 1 publikasi) — cukup untuk smoke test.
  - B) Salinan terbatas dari spreadsheet lama (PII dihilangkan) — lebih realistis tapi menyentuh Non-Goals "tanpa migrasi".
  - C) Kombinasi: fiktif untuk data operasional + kalender hari libur & master data sungguhan (industri/status/platform/brand) dari PRD.
- **Dampak jika salah:** Tanpa seed, browser per-US dan smoke test tidak bisa dilengkapi; dengan data lama, melanggar Non-Goals PRD (migrasi) kecuali disetujui terpisah.
- **Tambahan yang perlu dikonfirmasi:** kumpulan akun pilot per role (Super Admin, Executive, Sales, PM, Developer, Sosmed Specialist, tim produksi) — email login untuk masing-masing.
- **Jawaban (2026-11-03):** A — Fiktif minimal per modul (2–3 lead, 1 klien, 1 deal handover + proyek, 3 task template RAD/PUS/SAD, 2 ide konten + 1 materi, 1 publikasi) — cukup untuk smoke test.
