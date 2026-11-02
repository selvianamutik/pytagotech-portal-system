# Rencana Penyelesaian Backend — Gate 3

> **Tanggal:** 2026-11-02  
> **Ruang lingkup:** seluruh Functional Requirement yang masih `IN_PROGRESS` di `docs/PROGRESS.md`.  
> **Sumber kebenaran:** `tasks/prd-pytagotech-integrated-portal.md` dan `docs/DATABASE.md` yang berstatus APPROVED. PRD tidak diubah oleh rencana ini.

## Kondisi awal

- Gate 1 dan Gate 2 sudah selesai. UI seluruh user story tersedia, tetapi sebagian besar modul Produksi dan Sosmed masih memakai mock store di `frontend/src/services/`.
- FR-4 telah DB-backed dan dapat dipakai kembali untuk komentar, lampiran, dan notifikasi di task, fitur, serta materi.
- Working tree saat ini berisi pekerjaan belum di-commit untuk memindahkan `services/projects.ts` ke Supabase. Pekerjaan itu adalah gelombang pertama FR-15; jangan ditimpa atau dicampur dengan pekerjaan FR lain sebelum diverifikasi dan di-commit.
- Skema sudah mencakup entitas, FK, index, dan matriks RLS yang diperlukan. Jika implementasi menemukan kebutuhan schema baru, berhenti dan buat change request; jangan menambah tabel/kolom di luar PRD.

## Urutan pelaksanaan

Urutan ini menjaga dependensi data: proyek harus nyata sebelum task/fitur; materi harus nyata sebelum publikasi/metrik; lalu dashboard dan pencarian memakai data nyata tersebut.

| Gelombang | FR / user story | Hasil yang harus selesai | Ketergantungan |
|---|---|---|---|
| 0 | FR-5 | Satu dokumen rumus + pengujian semua kalkulasi | Dapat dimulai sekarang dan dilengkapi per gelombang |
| 1 | FR-15 — US-019/020 | Proyek dari handover DB-backed, relasi dua arah, daftar/filter/progress | Handover DB-backed sudah selesai |
| 2 | FR-16–20 — US-021 s.d. US-026 | Template, task, backlog, scheduling, Gantt, dashboard produksi DB-backed | Gelombang 1 |
| 3 | FR-21–24 — US-027 s.d. US-033 | Ide, materi, gate/approval, publikasi, kalender DB-backed | Master data dan pengaturan sudah selesai |
| 4 | FR-25–29 — US-034 s.d. US-040 | Analytics, komunitas, inquiry, aset, evaluasi DB-backed | Gelombang 3 untuk metrik publikasi; CRM DB-backed untuk konversi inquiry |
| 5 | FR-31 — US-043/044 | Arsip, ekspor, pencarian global memakai sumber DB yang sudah lengkap | Gelombang 1–4 |
| 6 | Gate 3 | Verifikasi seluruh FR/US, dokumen, lint, typecheck, test, browser | Semua gelombang |

## Rencana rinci

### Gelombang 0 — rumus dan kontrak perhitungan (FR-5)

1. Inventarisir rumus yang dipakai UI: progress task/induk/proyek, jadwal fitur dan bentrok, skor brief, quality gate, urgensi rilis, engagement rate, net growth, response time dan SLA, serta KPI scorecard.
2. Tambahkan bagian rumus ke `docs/API.md` atau `docs/DECISIONS.md`: input, satuan, zona waktu, pembulatan, kondisi data kosong, dan referensi FR/US. Gunakan keputusan Q-002 (ER), Q-003 (skor minimum 5/5), Q-004 (ambang kritis dari Pengaturan), dan FR-30.
3. Jadikan fungsi perhitungan pure dan beri unit test dengan edge case: nilai nol, tanggal kosong, hari libur, akhir pekan, sub-task kosong, dan snapshot Final terkunci.
4. Setiap gelombang berikutnya menutup rumus yang relevan; FR-5 baru `DONE` ketika seluruh daftar rumus tersebut terdokumentasi dan diuji.

### Gelombang 1 — proyek dari handover (FR-15; US-019/020)

1. Selesaikan perubahan working tree saat ini secara terisolasi: `projects` membaca/menulis tabel `projects`, lookup klien/handover/PM memakai ID UUID internal, sementara UI mempertahankan display ID.
2. Terapkan dan uji RPC atomik `create_project_from_handover`: hanya handover `Dikonfirmasi`, satu proyek per `handover_id`, salin klien/nama/kode/nilai/deadline/fitur, dan kembalikan ID proyek yang dibuat.
3. Pastikan relasi dua arah dapat dinavigasi: halaman handover membuka proyek, halaman proyek membuka handover asal.
4. Ganti kalkulasi progress proyek agar membaca `tasks` database (pada awalnya 0 bila belum ada task), bukan mock store.
5. Verifikasi RLS role-based sesuai keputusan Q-019/CR-003: PM/Super Admin membuat dan mengubah; role lain hanya sesuai matriks `DATABASE.md`.
6. Jalankan unit test service, lint, typecheck, dan uji browser semua acceptance criteria US-019/020. Commit hanya setelah hasilnya hijau.

### Gelombang 2 — operasi produksi (FR-16 sampai FR-20; US-021 sampai US-026)

1. **FR-16 / US-021:** pindahkan `task-templates` ke tabel `task_templates`; CRUD khusus Super Admin. Lengkapi RPC proyek agar memasukkan template aktif berurutan dengan tanggal relatif terhadap `start_date`. PM dapat menonaktifkan/menghapus hasilnya melalui `tasks.is_active`/DELETE. Q-005 masih OPEN: jangan mengarang seed template resmi; gunakan data yang dibuat Admin dan catat bahwa seed menunggu jawaban pemilik.
2. **FR-17 / US-022:** pindahkan `tasks.ts` ke `tasks` dan `task_dependencies`. Implementasikan CRUD, Kanban update status, list sort/filter, parent/sub-task, agregat persentase induk dan proyek, lalu hubungkan panel komentar/lampiran yang sudah DB-backed. Hindari menyimpan persentase turunan yang dapat dihitung ulang tanpa alasan PRD.
3. **FR-18 / US-023/024:** pindahkan backlog dan kapasitas/kalender dari mock (`features.ts`, scheduling) ke `features`, `developer_capacity`, dan `holidays`. Scheduler harus memakai hari kerja, prioritas, estimasi, kapasitas, hari libur, serta tanda bentrok developer. Override wajib menyimpan tanggal dan alasan; jangan mengubah hasil kalkulasi otomatis secara diam-diam.
4. **FR-19 / US-025:** simpan perubahan drag-drop Gantt ke tanggal task/fitur. CRUD dependensi hanya finish-to-start pada `task_dependencies`; validasi self-link dan siklus sebelum simpan, lalu kaskadekan jadwal successor secara terukur. Sediakan zoom harian/mingguan/bulanan, hari ini, dan deadline proyek dari data nyata.
5. **FR-20 / US-026:** dashboard produksi membaca agregat proyek/task database dan memakai query filter yang sama untuk ekspor. Lengkapi ekspor Excel dan PDF sesuai PRD. Q-013 masih OPEN: implementasi filter tidak boleh menebak master divisi; gunakan filter proyek dan rentang waktu, dan tahan/labeli filter divisi sampai pemilik memutuskan definisinya.
6. Setelah setiap FR: test service, test komponen, test RLS operasi tulis, lint/typecheck, browser acceptance criteria. Baru ubah baris FR dan US terkait ke `DONE`.

### Gelombang 3 — siklus produksi konten (FR-21 sampai FR-24; US-027 sampai US-033)

1. **FR-21 / US-027:** ganti `ideas.ts` dengan `content_ideas` dan `idea_platforms`; hitung lima field brief dari data aktual dan tolak readiness `Siap Masuk Produksi` bila skor < 5 (Q-003).
2. **FR-22 / US-028–030:** ganti layanan materi dan revisi ke `content_materials` dan `content_revisions`. Terapkan transisi approval dan riwayat revisi. Jadwal hanya boleh tersimpan jika seluruh quality gate lulus atau override Admin memiliki pelaku dan alasan.
3. **FR-23 / US-031:** pindahkan `publications.ts` ke `publications` dan target platform ke `material_platforms`; tegakkan satu materi ke banyak PUB dan pola Single/Crosspost, termasuk rekonsiliasi target platform.
4. **FR-24 / US-032/033:** kalender membaca publikasi nyata, menyimpan perubahan jadwal via drag-drop, menerapkan filter multi-parameter PRD, dan menghitung Overdue/Kritis dari setting ambang waktu (Q-004), tanpa integrasi API platform.
5. Uji setiap guard di service dan database-facing flow: skor rendah, gate gagal, revisi ditolak tanpa feedback, duplikasi platform, serta rilis melewati jadwal.

### Gelombang 4 — analytics, komunitas, dan aset (FR-25 sampai FR-29; US-034 sampai US-040)

1. **FR-25 / US-035/036/039:** pindahkan metrik dan pertumbuhan akun ke `post_metrics`/`account_growth`; simpan snapshot Monitoring atau Final dan tegakkan satu Final per publikasi (partial unique index). Hak ubah Final mengikuti Q-007. Dashboard Sosmed membaca agregat nyata dan rumus ER Q-002.
2. **FR-26 / US-037/038/039:** pindahkan community dan inquiry ke `community_interactions`/`inquiries`; hitung response time dari timestamp, SLA dari settings/jam layanan/hari libur, serta status routing. Konversi inquiry harus memakai RPC atomik `convert_inquiry_to_lead`, menyimpan sumber `Sosmed/<platform>`, dan mencegah konversi ganda.
3. **FR-27 / US-034:** pindahkan `assets.ts` dan hubungan materi-aset ke `assets`/`material_assets`; tolak tautan aset yang telah expired dan tampilkan peringatan bila kedaluwarsa dalam 30 hari. Tetap hanya metadata/link cloud, bukan upload file master besar.
4. **FR-28 / US-038:** verifikasi hasil konversi muncul sebagai lead CRM dengan source, tetapi tidak menggandakan data atau melewati RLS CRM.
5. **FR-29 / US-040:** pindahkan evaluasi ke `strategy_evaluations`; tegakkan kerangka KIST dan `hypothesis` wajib bagi kategori Test.

### Gelombang 5 — tata kelola lintas-modul (FR-31; US-043/044)

1. Audit ulang archive manager agar hanya memanggil RPC `archive_entity`/`restore_entity` dan daftar/ekspor membaca tabel nyata untuk lead, proyek, dan materi. Terapkan retensi 2 tahun dan prosedur backup sesuai Q-018/`docs/DEPLOYMENT.md`; jangan membuat purge otomatis di luar keputusan tersebut.
2. Pastikan ekspor CSV per modul memakai pagination dan RLS, termasuk data terarsip sesuai kebutuhan admin.
3. Ganti pencarian global dari mock dengan query/RPC database atas lead, klien, proyek, task, dan materi. Hasil harus bergantung RLS, bukan hanya filter di klien.
4. Beranda per role mengambil “Tugas saya” dari task, follow-up, revisi, dan SLA nyata serta diuji untuk minimal satu role yang memiliki akses dan satu role yang tidak.

## Aturan delivery tiap gelombang

1. Kerjakan satu user story sampai tuntas; jangan mencampur migrasi besar lintas gelombang.
2. Reuse schema APPROVED dan policy RLS yang ada. Kebutuhan schema/policy baru harus masuk `docs/CHANGE_REQUESTS.md`, disetujui pemilik, lalu PRD/dokumen skema diperbarui manusia sebelum implementasi.
3. Migrate satu service mock demi satu ke Supabase, pertahankan display ID untuk UI, dan hapus fallback mock setelah test database-facing lulus.
4. Setiap perubahan tulis harus menghasilkan audit trail yang benar; setiap data lintas modul harus diverifikasi dengan UUID internal dan display ID di UI.
5. Jangan memberi `DONE` hanya karena UI terlihat benar. Definition of Done: semua acceptance criteria, test unit/integrasi, lint, typecheck, RLS, dan browser verification telah lulus; lalu perbarui `docs/PROGRESS.md`, `docs/WORKLOG.md`, dan commit dengan `Refs: US-xxx, FR-x`.

## Blocker yang membutuhkan keputusan pemilik

| ID | Dampak | Tindakan sampai terjawab |
|---|---|---|
| Q-005 | Tidak ada daftar template task standar untuk proyek baru | Selesaikan CRUD/generasi dari template yang dibuat Admin; jangan membuat seed template resmi sendiri. |
| Q-013 | Definisi filter “divisi” dashboard produksi belum jelas | Selesaikan filter proyek dan rentang waktu; jangan menambah master divisi atau mengklaim AC filter divisi selesai. |

## Kriteria penutupan Gate 3

- Semua FR-5, FR-15 s.d. FR-29, dan FR-31 berubah menjadi `DONE`, beserta user story backend yang dipengaruhinya.
- Tidak ada service yang masih memakai mock store untuk alur PRD yang diklaim DB-backed.
- Semua acceptance criteria PRD, policy RLS, audit, lint, typecheck, test, dan browser verification terdokumentasi di `docs/PROGRESS.md`/`docs/WORKLOG.md`.
- Q-005 dan Q-013 sudah terjawab, atau acceptance criteria yang bergantung padanya secara eksplisit tetap `BLOCKED` (bukan `DONE`).
