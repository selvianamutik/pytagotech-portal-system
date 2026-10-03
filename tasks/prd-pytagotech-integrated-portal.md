# PRD: Pytagotech Integrated Portal

**Versi:** 1.0 | **Tanggal:** 4 Oktober 2026 | **Status:** Draft untuk review
**Sumber:** CRM Pythagotech September.xlsx, Data Klien.xlsx, Tracker_Produksi_v3.xlsx, PYTAGOTECH SOSMED.xlsx

---

## 1. Introduction / Overview

Pytagotech Group saat ini menjalankan operasional dengan **empat spreadsheet terpisah**:

| Spreadsheet | Fungsi | Pengguna utama |
| :--- | :--- | :--- |
| CRM Pythagotech | Pipeline lead & penjualan | Sales/Marketing |
| Data Klien | Deal handover (kontrak, nilai, termin, deadline) | Sales → Produksi |
| Tracker Produksi v3 | Proyek, task, fitur, timeline, dashboard | PM, Developer |
| PYTAGOTECH SOSMED | Operasional konten & media sosial multi-brand | Tim Sosmed, Leader |

Masalah utama: data tersebar dan diinput manual, tidak ada relasi antar-spreadsheet (lead yang closing harus diketik ulang ke Data Klien, lalu diketik ulang lagi ke Tracker Produksi), rumus antar-sheet rawan rusak, tidak ada kontrol akses, tidak ada kolaborasi real-time, dan tidak ada audit trail.

**Solusi:** satu **web portal multi-divisi** (Next.js + Supabase + shadcn/ui + Tailwind) dengan data bersama dan role-based access. Alur inti: **Lead → Closing → Deal Handover → Proyek → Task/Fitur → Timeline**, ditambah modul operasional Sosmed. Spreadsheet lama diarsipkan, tanpa migrasi data (mulai dari nol).

**Strategi rilis:** Full scope, dibagi 5 fase (lihat Bagian 9).

---

## 2. Goals

- G1: Menyatukan 4 spreadsheet ke satu sistem dengan satu sumber data (single source of truth).
- G2: Menghilangkan input ganda: lead yang Closing menjadi klien dan deal handover tanpa mengetik ulang; deal yang disetujui Produksi menjadi proyek beserta template task otomatis.
- G3: Semua angka dashboard dihitung otomatis dari database, tanpa rumus spreadsheet.
- G4: Menyediakan kontrol akses per divisi dan audit trail untuk semua perubahan data penting.
- G5: Menyediakan alat kolaborasi (komentar, lampiran, notifikasi) pada lead, task, dan konten.
- G6: Memantau SLA operasional (response time komunitas ≤ 30 menit, routing WhatsApp ≤ 15 menit) secara otomatis.

---

## 3. User Roles

| Role | Deskripsi | Akses utama |
| :--- | :--- | :--- |
| **Super Admin** | Pengelola sistem | Semua modul, pengaturan, user management, audit log |
| **Executive / Leader** | Pimpinan | Read-only semua dashboard; approval konten (Leader reviewer) |
| **Sales / Marketing** | Tim PIC lead (mis. Feby, Fira, Figo, dst.) | CRM, Interested Leads, input Deal Handover |
| **Project Manager** | Penanggung jawab proyek | Proyek, Task, Fitur Planner, Timeline, konfirmasi handover |
| **Developer** | Pengerjaan fitur/task | Task yang di-assign, Kanban, update progress |
| **Social Media Specialist** | Perencana & pengelola konten | Content Planner, Produksi Konten, Community, Analytics |
| **Graphic Designer / Video Editor / Copywriter** | Tim produksi konten | Task konten yang di-assign, upload aset |

---

## 4. User Stories

> Catatan umum: setiap story dengan UI menyertakan kriteria "Verify in browser using dev-browser skill". Semua story menyertakan "Typecheck/lint passes".

### EPIC A: Fondasi Platform (Fase 1)

### US-001: Setup proyek & desain sistem
**Description:** Sebagai developer, saya ingin fondasi proyek yang konsisten agar semua modul dibangun di atas standar yang sama.

**Acceptance Criteria:**
- [ ] Proyek Next.js (App Router, TypeScript) terhubung ke Supabase
- [ ] Tailwind + shadcn/ui terpasang; komponen dasar tersedia (Button, Input, Select, Table, Dialog, Tabs, Badge, Toast)
- [ ] Layout dashboard dengan sidebar navigasi per modul dan header user menu
- [ ] Tema light/dark berfungsi
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-002: Autentikasi & manajemen user
**Description:** Sebagai Super Admin, saya ingin mengundang user dan menetapkan role agar akses terkontrol.

**Acceptance Criteria:**
- [ ] Login email + password via Supabase Auth; logout; reset password
- [ ] Super Admin dapat membuat/menonaktifkan user dan mengubah role
- [ ] Satu user dapat memiliki lebih dari satu role
- [ ] Halaman yang tidak diizinkan menampilkan halaman 403, bukan data kosong
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-003: Row Level Security per role
**Description:** Sebagai Super Admin, saya ingin data dilindungi di level database agar akses tidak hanya bergantung pada UI.

**Acceptance Criteria:**
- [ ] RLS aktif di semua tabel; policy per role terdokumentasi
- [ ] Sales hanya dapat mengubah lead miliknya; PM hanya dapat mengubah proyek yang ia kelola
- [ ] Test otomatis memverifikasi user tanpa role tidak dapat membaca data
- [ ] Typecheck/lint passes

### US-004: Audit trail
**Description:** Sebagai Super Admin, saya ingin riwayat perubahan data agar setiap perubahan dapat ditelusuri.

**Acceptance Criteria:**
- [ ] Setiap create/update/delete pada entitas utama tercatat: user, waktu, tabel, nilai lama, nilai baru
- [ ] Halaman Audit Log dengan filter user, modul, dan rentang tanggal
- [ ] Log tidak dapat diubah atau dihapus dari UI
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-005: Pengaturan master data & dropdown
**Description:** Sebagai Super Admin, saya ingin mengelola opsi dropdown terpusat agar tidak ada hardcode di tiap modul.

**Acceptance Criteria:**
- [ ] CRUD untuk: kategori industri, status lead, tahapan interest, tim/PIC, lini bisnis, platform, pillar konten, kategori fitur, prioritas
- [ ] Perubahan opsi langsung tampil di semua form terkait
- [ ] Opsi yang sedang dipakai tidak bisa dihapus (hanya dinonaktifkan)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-006: Komentar, lampiran, dan notifikasi
**Description:** Sebagai pengguna, saya ingin berkomentar, melampirkan file, dan menerima notifikasi agar kolaborasi tidak lewat chat terpisah.

**Acceptance Criteria:**
- [ ] Komponen komentar reusable (dengan @mention) dapat dipasang pada lead, task, fitur, dan konten
- [ ] Upload lampiran ke Supabase Storage (batas ukuran dikonfigurasi)
- [ ] Notifikasi in-app saat di-assign, di-mention, atau status berubah
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### EPIC B: CRM Marketing (Fase 2)

### US-007: Database Lead
**Description:** Sebagai Sales, saya ingin mencatat lead dengan data lengkap agar prospek tersimpan terpusat.

**Acceptance Criteria:**
- [ ] Form dan tabel lead dengan field: tanggal hubungi, nama perusahaan/brand, kategori industri, WhatsApp, Instagram, email, PIC, status
- [ ] Status: New, Contacted, Follow Up, Interest, Not Interested, Lost, Closing
- [ ] Validasi format nomor WhatsApp dan email
- [ ] Peringatan duplikat berdasarkan nomor WhatsApp atau nama perusahaan
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-008: Pencarian, filter, dan pewarnaan status
**Description:** Sebagai Sales, saya ingin memfilter lead dan melihat status dengan warna agar mudah dipindai.

**Acceptance Criteria:**
- [ ] Filter multi-kriteria: status, PIC, kategori industri, rentang tanggal; pencarian teks
- [ ] Badge/baris berwarna konsisten per status
- [ ] Sort per kolom; paginasi
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-009: Penugasan PIC & bulk action
**Description:** Sebagai Sales Lead, saya ingin menugaskan lead ke anggota tim agar beban kerja terbagi.

**Acceptance Criteria:**
- [ ] Assign/reassign PIC per lead dan massal (multi-select)
- [ ] Perubahan PIC tercatat di audit log
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-010: Import lead dari CSV
**Description:** Sebagai Sales, saya ingin mengimpor daftar lead baru dari CSV agar input massal cepat. (Ini untuk lead baru ke depan, bukan migrasi data lama.)

**Acceptance Criteria:**
- [ ] Upload CSV dengan template yang bisa diunduh
- [ ] Preview baris valid/tidak valid sebelum konfirmasi
- [ ] Baris duplikat ditandai dan dapat dilewati
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-011: Pipeline Interested Leads
**Description:** Sebagai Sales, saya ingin memantau lead berminat dalam pipeline agar negosiasi terkelola.

**Acceptance Criteria:**
- [ ] Lead berstatus Interest otomatis muncul di Interested Leads
- [ ] Tahapan: New Interest, Contacted, Demo, Price Sent, Negotiation, Closing, Lost
- [ ] Tampilan Kanban (drag-and-drop) dan tabel
- [ ] Field kebutuhan/solusi yang dicari klien
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-012: Activity log per lead
**Description:** Sebagai Sales, saya ingin mencatat riwayat komunikasi agar tindak lanjut tidak terlewat.

**Acceptance Criteria:**
- [ ] Timeline aktivitas per lead (catatan, perubahan status, perubahan tahap) dengan penulis dan waktu
- [ ] Opsi tanggal follow-up berikutnya; lead lewat jadwal ditandai "Overdue"
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-013: Dashboard CRM
**Description:** Sebagai Executive/Sales Lead, saya ingin KPI penjualan otomatis agar performa tim terlihat.

**Acceptance Criteria:**
- [ ] KPI: Total Database Lead, Total Outreach, New, Follow Up, Interested, Closing, Lost
- [ ] Interest Rate (%) = Interested ÷ Outreach; Closing Rate (%) = Closing ÷ Outreach (rumus tertulis di tooltip)
- [ ] Tabel kinerja per PIC (lead ditangani, contacted, follow up, interest, not interested, lost, closing)
- [ ] Filter periode (harian/bulanan/custom)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### EPIC C: Klien & Deal Handover (Fase 3)

### US-014: Master Klien
**Description:** Sebagai Sales, saya ingin profil klien terstruktur agar data klien satu tempat.

**Acceptance Criteria:**
- [ ] Field: nama perusahaan/entitas, nama PIC/Direktur, telepon/WhatsApp, email, referrer (lead source)
- [ ] Klien dapat dibuat otomatis dari lead berstatus Closing (data terisi dari lead)
- [ ] Satu klien dapat memiliki banyak proyek/deal
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-015: Form Deal Handover
**Description:** Sebagai Sales, saya ingin mengisi data kesepakatan agar Produksi menerima informasi lengkap.

**Acceptance Criteria:**
- [ ] Field: judul proyek, kode proyek, klien, scope & daftar fitur (dengan penjelasan), objektif akhir, nilai deal, skema termin, target deadline, catatan
- [ ] Nama proyek otomatis diformat `[Judul Project] - [Nama Klien] ([Kode Proyek])`
- [ ] Kode proyek unik; validasi wajib isi sebelum submit
- [ ] Panduan pengisian (SOP dari sheet "Read me") tampil sebagai panel bantuan
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-016: Termin pembayaran
**Description:** Sebagai Sales/Finance, saya ingin mendefinisikan termin pembayaran agar jadwal tagihan jelas.

**Acceptance Criteria:**
- [ ] Tambah banyak termin: nama, persentase atau nominal, tanggal/milestone jatuh tempo
- [ ] Total termin harus sama dengan nilai deal; jika tidak, form menolak simpan dengan pesan jelas
- [ ] Status per termin: Belum Ditagih, Ditagih, Lunas
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-017: Konfirmasi Produksi atas handover
**Description:** Sebagai PM, saya ingin mengonfirmasi atau menolak handover agar jadwal dan termin realistis.

**Acceptance Criteria:**
- [ ] Status handover: Draft → Menunggu Konfirmasi Produksi → Dikonfirmasi / Perlu Revisi
- [ ] PM dapat mengonfirmasi atau mengusulkan perubahan deadline/termin lengkap dengan komentar
- [ ] Sales mendapat notifikasi setiap perubahan status
- [ ] Hanya handover berstatus Dikonfirmasi yang dapat dijadikan proyek
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-018: Change request & catatan khusus
**Description:** Sebagai Sales/PM, saya ingin mencatat change request agar perubahan scope, harga, dan waktu terdokumentasi.

**Acceptance Criteria:**
- [ ] Log change request: jenis (negosiasi, penambahan fitur, percepatan waktu, penyesuaian harga), deskripsi, dampak nilai/deadline, status (Diajukan, Disetujui, Ditolak)
- [ ] Change request yang disetujui memperbarui nilai deal/deadline dengan riwayat versi
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### EPIC D: Manajemen Proyek & Produksi (Fase 3 dan 4)

### US-019: Pembuatan proyek dari handover
**Description:** Sebagai PM, saya ingin proyek dibuat otomatis dari handover agar tidak input ulang.

**Acceptance Criteria:**
- [ ] Tombol "Buat Proyek" pada handover Dikonfirmasi menyalin klien, nama, kode, nilai, deadline, dan daftar fitur
- [ ] Proyek memiliki: ID, nama, klien, PM, tanggal mulai, target selesai, status
- [ ] Status proyek: Planning, Active, On Hold, Completed, Cancelled
- [ ] Relasi ke handover asal dapat diklik dua arah
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-020: Daftar proyek
**Description:** Sebagai PM/Executive, saya ingin melihat dan memfilter proyek agar status portofolio jelas.

**Acceptance Criteria:**
- [ ] Tabel proyek dengan pencarian dan filter status/PM/klien
- [ ] Kolom progress (%) dihitung otomatis dari task
- [ ] Hanya PM dan Admin yang dapat membuat/mengubah proyek
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-021: Template task otomatis
**Description:** Sebagai PM, saya ingin task standar terbentuk otomatis saat proyek dibuat agar tidak menyalin baris manual.

**Acceptance Criteria:**
- [ ] Admin dapat mengelola template task (nama aktivitas, urutan, durasi default)
- [ ] Saat proyek dibuat, task dari template ter-generate dengan jadwal relatif terhadap tanggal mulai
- [ ] PM dapat menonaktifkan atau menghapus task hasil generate
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-022: Task board (Kanban dan List)
**Description:** Sebagai Developer/PM, saya ingin mengelola task di Kanban dan list agar progres jelas.

**Acceptance Criteria:**
- [ ] Field task: nama aktivitas, penanggung jawab, status, tanggal mulai, target selesai, % selesai, catatan, lampiran/link
- [ ] Status: To Do, In Progress, Blocked, Review, Done
- [ ] Kanban drag-and-drop mengubah status; List view dengan sort/filter
- [ ] Sub-task; % task induk dihitung dari sub-task, % proyek dihitung dari task
- [ ] Komentar dan lampiran per task (US-006)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-023: Backlog fitur
**Description:** Sebagai PM, saya ingin backlog fitur per proyek agar scope terpetakan.

**Acceptance Criteria:**
- [ ] Field: nama fitur, kategori, prioritas (High/Medium/Low), developer, estimasi hari
- [ ] Fitur dari handover masuk backlog otomatis saat proyek dibuat
- [ ] Fitur dapat diubah menjadi task
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-024: Penjadwalan fitur otomatis
**Description:** Sebagai PM, saya ingin tanggal mulai/selesai fitur dihitung otomatis agar tidak ada rumus manual.

**Acceptance Criteria:**
- [ ] Jadwal dihitung dari tanggal mulai proyek, estimasi hari, urutan prioritas, dan kalender hari kerja (Sabtu/Minggu dan hari libur dikonfigurasi)
- [ ] Kapasitas developer (jam/hari) dapat diatur dan diperhitungkan
- [ ] Jadwal bentrok pada developer yang sama ditandai peringatan
- [ ] Hasil penjadwalan dapat di-override manual dengan alasan
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-025: Gantt chart interaktif
**Description:** Sebagai PM, saya ingin timeline visual yang bisa digeser agar perubahan jadwal cepat.

**Acceptance Criteria:**
- [ ] Gantt menampilkan task/fitur per proyek dengan zoom harian/mingguan/bulanan
- [ ] Drag-and-drop mengubah tanggal mulai/selesai dan tersimpan
- [ ] Dependensi antar-task (finish-to-start); menggeser task induk menggeser task bergantung
- [ ] Penanda hari ini dan deadline proyek
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-026: Dashboard eksekutif produksi
**Description:** Sebagai Executive, saya ingin ringkasan proyek real-time agar keputusan cepat.

**Acceptance Criteria:**
- [ ] KPI: Total Proyek, Proyek Aktif, Task Selesai/Berlangsung/Blocked, % progress per proyek
- [ ] Widget proyek mendekati/melewati deadline
- [ ] Filter per divisi, proyek, dan rentang waktu
- [ ] Ekspor laporan ke PDF dan Excel
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### EPIC E: Sosmed: Perencanaan & Produksi Konten (Fase 4)

### US-027: Content Planner
**Description:** Sebagai Social Media Specialist, saya ingin merencanakan ide konten dengan struktur jelas agar editorial terarah.

**Acceptance Criteria:**
- [ ] Field ide: judul, lini bisnis (Pytagotech, Pytabelajar, Pytafix), pillar, funnel (Awareness/Consideration/Conversion), platform target
- [ ] Brief: Hook, Angle, Poin Kunci/Value, CTA, Referensi Aset
- [ ] Skor kelengkapan brief dihitung otomatis (jumlah field brief terisi ÷ 5)
- [ ] Status kelayakan: Siap Masuk Produksi, Tahan - Perlu Verifikasi, Disetujui, Ditunda
- [ ] Ide dengan skor di bawah ambang batas tidak bisa berstatus Siap Masuk Produksi
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-028: Database Produksi Konten
**Description:** Sebagai tim produksi, saya ingin materi konten terlacak dari draf sampai rilis agar tidak ada yang terlewat.

**Acceptance Criteria:**
- [ ] Materi induk (ID `MAT-xxxx`, otomatis) dengan status draf, jadwal tayang, jam rilis, link draft
- [ ] Penugasan Copywriter, Graphic Designer, Video Editor
- [ ] Materi dapat dibuat dari ide Content Planner berstatus Disetujui/Siap Produksi
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-029: Quality gate pra-rilis
**Description:** Sebagai tim produksi, saya ingin checklist pra-rilis agar kualitas konsisten.

**Acceptance Criteria:**
- [ ] Checklist: rasio visual, lisensi audio, brand cover, link bio/CTA, proofread copy
- [ ] Materi tidak dapat dijadwalkan/dirilis jika checklist belum lengkap (dengan pengecualian Admin disertai alasan)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-030: Alur approval & riwayat revisi
**Description:** Sebagai Leader/Specialist, saya ingin mereview materi dan melihat riwayat revisi agar keputusan terdokumentasi.

**Acceptance Criteria:**
- [ ] Versi: Draft Awal/Rev 0, Rev 1, dst., dengan timestamp dan reviewer (Leader atau Specialist)
- [ ] Keputusan: Disetujui Tanpa Revisi, Disetujui dengan Revisi Minor, Ditolak
- [ ] Catatan umpan balik wajib saat Ditolak; link bukti penyelesaian revisi
- [ ] Materi hanya bisa dijadwalkan setelah berstatus Disetujui
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-031: Distribusi multiplatform (Parent-Child)
**Description:** Sebagai Social Media Specialist, saya ingin satu materi induk didistribusikan ke banyak platform agar relasinya jelas.

**Acceptance Criteria:**
- [ ] Satu `MAT-xxxx` memiliki banyak publikasi `PUB-xxxx` (Instagram, TikTok, Threads, Facebook, YouTube Shorts)
- [ ] Pola distribusi: Single Platform atau Crosspost/Mirroring
- [ ] Indikator rekonsiliasi: peringatan jika platform tujuan belum memiliki publikasi
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-032: Kalender publikasi
**Description:** Sebagai tim Sosmed, saya ingin kalender tayang otomatis agar antrean rilis terlihat.

**Acceptance Criteria:**
- [ ] Tampilan bulan/minggu yang bersumber dari data distribusi
- [ ] Filter: lini bisnis, platform, status approval, kesiapan pra-rilis
- [ ] Klik entri membuka detail; drag untuk menjadwal ulang (hanya jika belum live)
- [ ] Indikator Overdue/Kritis untuk jadwal terlewat
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-033: Pelacakan rilis & post live
**Description:** Sebagai tim Sosmed, saya ingin mencatat rilis aktual agar laporan akurat.

**Acceptance Criteria:**
- [ ] Input tanggal aktual rilis dan link post live per publikasi
- [ ] Status otomatis Overdue/Kritis bila jadwal terlewat tanpa rilis (ambang batas dapat diatur)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-034: Asset & Content Library
**Description:** Sebagai tim produksi, saya ingin katalog aset dengan info lisensi agar tidak melanggar hak cipta.

**Acceptance Criteria:**
- [ ] Metadata aset: nama, tipe (Figma, PSD, MP4, dll.), link cloud, pemilik (internal/klien/partner)
- [ ] Tipe izin legal dan masa berlaku lisensi; peringatan aset yang kedaluwarsa dalam 30 hari
- [ ] Aset berlisensi kedaluwarsa tidak dapat ditautkan ke materi baru
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### EPIC F: Sosmed: Analytics, Komunitas & Evaluasi (Fase 5)

### US-035: Analytics performa posting
**Description:** Sebagai Social Media Specialist, saya ingin mencatat metrik per posting agar performa terukur.

**Acceptance Criteria:**
- [ ] Input: Views/Impresi, Reach, Likes, Comments, Shares, Saves per publikasi
- [ ] Engagement Rate (%) dihitung otomatis; rumus ditampilkan dan dikonfirmasi saat desain (lihat Open Questions)
- [ ] Setiap pencatatan bertanda snapshot: Monitoring Sementara atau KPI Final
- [ ] Hanya satu snapshot KPI Final per publikasi (deduplikasi); data final terkunci kecuali Admin
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-036: Pertumbuhan akun
**Description:** Sebagai Social Media Specialist, saya ingin data pertumbuhan audiens bulanan agar tren terlihat.

**Acceptance Criteria:**
- [ ] Input per platform per bulan: Followers Awal, Followers Masuk, Unfollows, Account Reach, Profile Visits
- [ ] Net Growth (%) dihitung otomatis
- [ ] Grafik tren bulanan per platform
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-037: Community management & SLA response time
**Description:** Sebagai Community Manager, saya ingin mencatat interaksi audiens dan waktu tanggapnya agar SLA terpantau.

**Acceptance Criteria:**
- [ ] Catat interaksi: kanal (komentar/DM), platform, tipe (Konsultasi Teknis, Pertanyaan Layanan, Komplain, Spam), waktu masuk, waktu dibalas
- [ ] Waktu tanggap (menit) dihitung otomatis; SLA tercapai jika ≤ 30 menit (nilai dari Pengaturan)
- [ ] Persentase SLA tercapai tampil di dashboard Sosmed
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-038: Inquiry tracking & handover WhatsApp
**Description:** Sebagai Social Media Specialist, saya ingin mencatat inquiry dari sosmed dan menyerahkannya ke Sales agar tidak ada lead hilang.

**Acceptance Criteria:**
- [ ] Catat inquiry: sumber platform, lini bisnis, waktu masuk, waktu dialihkan ke WhatsApp resmi
- [ ] SLA routing ≤ 15 menit dihitung otomatis
- [ ] Status: Diproses, Handover Selesai, Dialihkan
- [ ] Tombol "Jadikan Lead" membuat lead baru di CRM dengan sumber tercatat
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-039: Dashboard eksekutif Sosmed (KPI Scorecard)
**Description:** Sebagai Executive, saya ingin scorecard KPI Sosmed agar pencapaian target terlihat.

**Acceptance Criteria:**
- [ ] 6 KPI: Content Production, Reach & Awareness, Engagement Rate, Audience Growth, Social Footprint, WhatsApp Lead Handover
- [ ] Filter lini bisnis (Pytagotech, Pytabelajar, Pytafix) dan periode
- [ ] Setiap KPI menampilkan target (dari Pengaturan), capaian, dan status: Data Terverifikasi atau Monitoring Sementara
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-040: Evaluasi strategi KIST
**Description:** Sebagai Leader/Specialist, saya ingin mengevaluasi strategi konten dengan kerangka KIST agar keputusan berbasis data.

**Acceptance Criteria:**
- [ ] Entri evaluasi dikategorikan Keep, Improve, Stop, Test, ditautkan ke pillar/format dan data pendukung
- [ ] Untuk kategori Test: hipotesis, rencana aksi, target sukses, dampak bisnis, hasil
- [ ] Filter per periode dan lini bisnis
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### EPIC G: Tata Kelola, Integrasi & Penutup (Fase 5)

### US-041: Pengaturan KPI, SLA, dan routing
**Description:** Sebagai Super Admin, saya ingin mengatur target KPI dan SLA agar tidak hardcode.

**Acceptance Criteria:**
- [ ] Target KPI per lini bisnis, ambang SLA (default 30 menit dan 15 menit), jam layanan, nomor WhatsApp resmi per lini bisnis, kalender hari libur
- [ ] Perubahan nilai tercatat di audit log dan tidak mengubah data historis yang sudah final
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-042: SOP, panduan, dan matriks RACI
**Description:** Sebagai anggota tim, saya ingin panduan dan RACI di dalam portal agar peran jelas.

**Acceptance Criteria:**
- [ ] Halaman panduan (markdown) yang dapat diedit Admin
- [ ] Matriks RACI per aktivitas dan role (Social Media Specialist, Graphic Designer, Video Editor, Lead, dst.)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-043: Arsip data & backup
**Description:** Sebagai Super Admin, saya ingin mengarsipkan data lama agar sistem tetap cepat dan data aman.

**Acceptance Criteria:**
- [ ] Arsipkan proyek/lead/konten (soft archive) dan pulihkan dari arsip
- [ ] Ekspor data per modul ke CSV
- [ ] Prosedur backup Supabase terdokumentasi
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-044: Pencarian global & beranda per role
**Description:** Sebagai pengguna, saya ingin pencarian global dan beranda yang relevan dengan role saya agar cepat menemukan pekerjaan.

**Acceptance Criteria:**
- [ ] Pencarian global (Ctrl/Cmd+K) untuk lead, klien, proyek, task, materi
- [ ] Beranda menampilkan "Tugas saya" (task, follow-up, revisi, SLA yang akan jatuh tempo) sesuai role
- [ ] Hasil pencarian hanya menampilkan data yang boleh diakses user
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

## 5. Functional Requirements

**Platform**
- FR-1: Sistem harus menggunakan autentikasi email/password dan otorisasi berbasis role dengan RLS di database.
- FR-2: Sistem harus mencatat audit trail (siapa, kapan, apa, nilai lama/baru) untuk semua perubahan pada entitas utama.
- FR-3: Semua dropdown harus bersumber dari master data terpusat yang dapat dikelola Admin.
- FR-4: Sistem harus menyediakan komentar, lampiran, dan notifikasi in-app yang reusable di lead, task, fitur, dan materi konten.
- FR-5: Semua perhitungan metrik (rate, progress, SLA, engagement, net growth, skor brief) harus dilakukan di sistem, dan rumusnya terdokumentasi.

**CRM**
- FR-6: Sistem harus menyimpan lead dengan field kontak, industri, PIC, dan status tujuh tahap.
- FR-7: Sistem harus mendeteksi lead duplikat dan memperingatkan pengguna.
- FR-8: Lead berstatus Interest harus otomatis masuk ke pipeline Interested Leads dengan tujuh tahap.
- FR-9: Lead berstatus Closing harus dapat dikonversi menjadi klien dan deal handover tanpa input ulang.
- FR-10: Dashboard CRM harus menampilkan KPI agregat dan kinerja per PIC dengan filter periode.

**Klien & Handover**
- FR-11: Sistem harus memformat nama proyek otomatis menjadi `[Judul Project] - [Nama Klien] ([Kode Proyek])` dan menjaga kode proyek unik.
- FR-12: Total termin pembayaran harus sama dengan nilai deal; sistem menolak simpan jika tidak sama.
- FR-13: Handover harus melewati status Draft → Menunggu Konfirmasi Produksi → Dikonfirmasi/Perlu Revisi; hanya yang Dikonfirmasi dapat dijadikan proyek.
- FR-14: Perubahan nilai, deadline, atau scope setelah konfirmasi harus melalui change request dengan riwayat versi.

**Produksi**
- FR-15: Proyek yang dibuat dari handover harus mewarisi klien, nilai, deadline, dan daftar fitur.
- FR-16: Sistem harus meng-generate task dari template saat proyek dibuat.
- FR-17: Task harus mendukung Kanban, List, sub-task, komentar, lampiran, dan progress otomatis.
- FR-18: Sistem harus menghitung jadwal fitur berdasarkan estimasi, prioritas, kapasitas developer, dan kalender kerja, serta mendeteksi bentrok.
- FR-19: Gantt chart harus mendukung drag-and-drop, zoom, dan dependensi finish-to-start.
- FR-20: Dashboard produksi harus dapat difilter dan diekspor ke PDF dan Excel.

**Sosmed**
- FR-21: Sistem harus menghitung skor kelengkapan brief dan menahan ide berskor rendah dari status Siap Produksi.
- FR-22: Materi tidak boleh dijadwalkan sebelum lolos quality gate dan berstatus Disetujui.
- FR-23: Sistem harus menyimpan relasi 1 materi induk (`MAT-xxxx`) ke banyak publikasi (`PUB-xxxx`) dengan pola Single/Crosspost.
- FR-24: Kalender publikasi harus ditarik otomatis dari data distribusi dan mendukung filter multi-parameter.
- FR-25: Metrik posting harus bertanda snapshot (Monitoring Sementara/KPI Final) dan hanya satu KPI Final per publikasi.
- FR-26: Sistem harus menghitung response time komunitas dan SLA routing WhatsApp berdasarkan ambang di Pengaturan.
- FR-27: Aset berlisensi kedaluwarsa tidak boleh ditautkan ke materi baru; peringatan 30 hari sebelum kedaluwarsa.
- FR-28: Inquiry sosmed harus dapat dikonversi menjadi lead CRM dengan sumber tercatat.
- FR-29: Evaluasi strategi harus mengikuti kerangka KIST dan mencatat hipotesis untuk kategori Test.

**Tata kelola**
- FR-30: Target KPI, ambang SLA, jam layanan, nomor WhatsApp resmi, dan kalender libur harus dikonfigurasi dari halaman Pengaturan.
- FR-31: Sistem harus menyediakan arsip (soft archive), ekspor CSV per modul, dan pencarian global yang menghormati hak akses.

---

## 6. Non-Goals (Out of Scope)

- Tidak ada migrasi data dari spreadsheet lama; spreadsheet diarsipkan dan sistem mulai dari nol. (Import CSV hanya untuk lead baru ke depan, US-010.)
- Tidak ada portal klien eksternal (pengguna hanya internal).
- Tidak ada modul invoicing/akuntansi penuh; termin pembayaran hanya pelacakan status.
- Tidak ada integrasi API otomatis ke Instagram/TikTok/Meta untuk menarik metrik; metrik diinput manual pada versi ini.
- Tidak ada integrasi WhatsApp Business API; routing WhatsApp hanya dicatat dan diukur SLA-nya.
- Tidak ada aplikasi mobile native (web responsif saja).
- Tidak ada penyimpanan file master besar (PSD/MP4) di sistem; hanya metadata dan link cloud. Lampiran task/komentar dibatasi ukuran.
- Tidak ada fitur penagihan/pembayaran online, HRIS, atau payroll.

---

## 7. Design Considerations

- **UI Kit:** shadcn/ui + Tailwind; konsisten di semua modul; light/dark mode.
- **Navigasi:** sidebar dikelompokkan per divisi: Beranda, CRM, Klien & Handover, Proyek, Sosmed, Pengaturan. Menu disembunyikan sesuai role.
- **Pola UI reusable:** DataTable (sort/filter/paginasi), Kanban board, Timeline aktivitas, panel komentar, badge status berwarna, dialog konfirmasi untuk aksi destruktif.
- **Pewarnaan status** konsisten (lead, task, handover, SLA) dan tidak hanya mengandalkan warna (sertakan teks/ikon).
- **Responsif:** semua halaman dapat dipakai di tablet; tabel lebar scroll horizontal.
- **Bahasa antarmuka:** Bahasa Indonesia; istilah teknis (Kanban, Gantt, SLA) tetap.
- **Empty state** informatif pada setiap daftar kosong.

---

## 8. Technical Considerations

**Stack:** Next.js (App Router, TypeScript), Supabase (Postgres, Auth, Storage, Realtime, RLS), shadcn/ui, Tailwind CSS.

**Entitas data utama (garis besar):**
`profiles/roles`, `master_options`, `leads`, `lead_activities`, `clients`, `deals` (handover), `deal_payment_terms`, `change_requests`, `projects`, `tasks`, `task_dependencies`, `features`, `developer_capacity`, `holidays`, `content_ideas`, `content_materials` (MAT), `content_revisions`, `publications` (PUB), `post_metrics`, `account_growth`, `community_interactions`, `inquiries`, `assets`, `strategy_evaluations`, `comments`, `attachments`, `notifications`, `audit_logs`, `settings`.

**Relasi kunci:** `leads → clients → deals → projects → (tasks, features)`; `content_ideas → content_materials → publications → post_metrics`; `inquiries → leads`.

**Pertimbangan teknis:**
- RLS wajib di semua tabel; test otomatis untuk kebijakan akses.
- Audit trail via trigger database agar tidak bisa dilewati.
- Kalkulasi KPI menggunakan view/SQL function agar konsisten antara dashboard dan ekspor.
- Realtime Supabase untuk Kanban dan notifikasi.
- Library Gantt: pilih komponen yang mendukung drag, zoom, dan dependensi (evaluasi saat Fase 4); pastikan kompatibel dengan Tailwind/shadcn.
- Ekspor PDF/Excel dilakukan di sisi server.
- Zona waktu tunggal (WIB, Asia/Jakarta) untuk perhitungan SLA dan jadwal.
- Performa: dashboard utama termuat < 2 detik untuk data hingga 50.000 baris per tabel utama; gunakan indeks dan paginasi server-side.
- Penyimpanan file via Supabase Storage dengan bucket privat dan signed URL.

---

## 9. Fase Rilis

| Fase | Cakupan | Story |
| :--- | :--- | :--- |
| **1. Fondasi** | Platform, auth, RLS, audit, master data, komentar/lampiran | US-001 – 006 |
| **2. CRM Marketing** | Lead, pipeline, dashboard CRM | US-007 – 013 |
| **3. Klien, Handover & Proyek** | Master klien, handover, change request, proyek, task board | US-014 – 022 |
| **4. Produksi lanjutan & Sosmed inti** | Fitur planner, Gantt, dashboard produksi; content planner, produksi, approval, distribusi, kalender, aset | US-023 – 034 |
| **5. Sosmed analytics & tata kelola** | Analytics, komunitas, inquiry, KPI Sosmed, KIST, pengaturan, SOP, arsip, pencarian | US-035 – 044 |

---

## 10. Success Metrics

- 100% lead, deal, proyek, dan operasional konten baru tercatat di portal; 0 spreadsheet aktif setelah 1 bulan go-live per modul.
- Waktu dari lead Closing ke proyek terbentuk berkurang ≥ 70% dibanding proses manual (target ≤ 15 menit tanpa input ulang).
- Selisih data antara dashboard dan sumber = 0 (semua metrik dari database).
- ≥ 90% respons komunitas dalam SLA ≤ 30 menit dan ≥ 90% routing WhatsApp dalam ≤ 15 menit (dibandingkan baseline setelah 1 bulan data terkumpul).
- ≥ 95% konten tayang lolos quality gate dan berstatus Disetujui sebelum rilis.
- ≥ 80% pengguna aktif mingguan dari tim terkait pada bulan kedua setelah go-live per modul.
- Tidak ada insiden akses data lintas role (diverifikasi test RLS dan audit log).

---

## 11. Open Questions

1. Apakah satu klien dapat memiliki beberapa PM, atau satu PM per proyek?
2. Rumus Engagement Rate resmi: berdasarkan Reach atau Views? Perlu dikunci agar konsisten dengan laporan lama.
3. Ambang skor kelengkapan brief minimal untuk "Siap Masuk Produksi" (usulan: 5/5 atau 4/5)?
4. Batas waktu "Overdue" dan "Kritis" untuk jadwal rilis konten (jam/hari)?
5. Daftar lengkap template task standar proyek (nama aktivitas, urutan, durasi) perlu disediakan tim Produksi.
6. Apakah termin pembayaran perlu pengingat tagihan otomatis ke Sales/Finance?
7. Siapa yang berhak mengubah data KPI Final setelah terkunci (hanya Admin atau Leader juga)?
8. Perlu notifikasi eksternal (email/WhatsApp) selain in-app?
9. Apakah tiga lini bisnis (Pytagotech, Pytabelajar, Pytafix) juga perlu memisahkan data CRM dan Proyek, atau hanya Sosmed?
10. Batas ukuran lampiran dan kebijakan retensi arsip data?
11. Perlu role Finance khusus untuk termin pembayaran?
