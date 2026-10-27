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

## Q-005 — [OPEN]

- **Terkait:** US-021, FR-16
- **Pertanyaan:** Apa daftar lengkap template task standar untuk proyek baru? (nama aktivitas, urutan, durasi default)
- **Konteks:** US-021 menyebut "Admin dapat mengelola template task" — tapi task awal (seed) perlu didefinisikan agar sistem tidak dimulai dari template kosong.
- **Dampak jika salah:** Jika template salah, setiap proyek baru perlu penyesuaian manual yang menambah waktu PM.
- **Jawaban:** _(diisi tim Produksi / pemilik proyek)_

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

## Q-012 — [OPEN]

- **Terkait:** US-015 / FR-11
- **Pertanyaan:** Apa isi panduan pengisian (SOP dari sheet "Read me") yang harus tampil sebagai panel bantuan di form Deal Handover?
- **Opsi yang dipertimbangkan:**
  - A) Salin isi sheet "Read me" apa adanya ke panel bantuan
  - B) Ringkas menjadi panduan per field
- **Dampak jika salah:** Panel saat ini memakai panduan interim yang diturunkan dari PRD; perlu diganti setelah jawaban tersedia.
- **Jawaban:** _(diisi pemilik proyek)_

---

## Q-013 — [OPEN]

- **Terkait:** US-026 / FR-20
- **Pertanyaan:** Apa yang dimaksud "divisi" pada filter dashboard produksi (per divisi, proyek, rentang waktu)? Apakah divisi = tim/role (Sales, Produksi, Sosmed), atau ada struktur divisi tersendiri?
- **Opsi yang dipertimbangkan:**
  - A) Divisi = tim pelaksana (filter per PM/role yang sudah ada)
  - B) Ada master divisi tersendiri (perlu tabel + filter baru)
- **Dampak jika salah:** Filter dashboard salah sasaran; bila opsi B, perlu master data tambahan.
- **Jawaban:** _(diisi pemilik proyek)_

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

## Q-015 — [OPEN]

- **Terkait:** US-005 / FR-3
- **Pertanyaan:** Acceptance Criteria US-005 menyebut opsi yang sedang dipakai hanya boleh dinonaktifkan. Skema `team_members` yang disetujui belum memiliki kolom `is_active`, sehingga anggota tim/PIC tidak bisa dinonaktifkan tanpa perubahan skema.
- **Opsi yang dipertimbangkan:**
  - A) Tambah kolom `team_members.is_active` lewat CR + migration (dropdown form memfilter yang aktif)
  - B) Tanpa perubahan skema: blokir hapus anggota yang sudah dipakai, edit nama/status tetap bisa; anggota tak terpakai boleh dihapus
  - C) Keluarkan tim/PIC dari US-005 dan jadikan US terpisah
- **Dampak jika salah:** Opsi A menambah kolom + migration baru dan menunda verifikasi karena `db reset` belum bisa dijalankan. Opsi B membuat perilaku tim/PIC sedikit berbeda dari opsi master lain (tidak ada tombol nonaktifkan).
- **Jawaban:** _(diisi pemilik proyek)_

---

## Q-016 — [OPEN]

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
- **Jawaban:** _(diisi pemilik proyek)_

---

## Q-017 — [OPEN]

- **Terkait:** US-004 / FR-2
- **Pertanyaan:** `audit_logs.entity_id` kosong untuk tabel ber-PK komposit seperti `master_options(category, value)` dan `user_roles(user_id, role_name)`. Trigger audit hanya membaca kolom `id`/`display_id`. Apakah perlu diperbaiki sekarang atau dicatat sebagai keterbatasan?
- **Bukti:** Audit log `master_options` insert/update menampilkan kolom Entitas kosong; baris seed `user_roles` juga kosong.
- **Opsi yang dipertimbangkan:**
  - A) Perbaiki `private.audit_row_change()` agar membangun `entity_id` dari kolom PK komposit (butuh migration + verifikasi `db reset`).
  - B) Biarkan; nilai lama/baru di `old_value`/`new_value` sudah cukup untuk audit.
- **Dampak jika salah:** A memperbaiki keterlacakan audit; B menyisakan kolom entitas kosong untuk beberapa tabel.
- **Jawaban:** _(diisi pemilik proyek)_
