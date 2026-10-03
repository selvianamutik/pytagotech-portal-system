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
