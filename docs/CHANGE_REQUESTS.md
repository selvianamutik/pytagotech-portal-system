# CHANGE_REQUESTS.md — Permintaan Perubahan PRD

> Jika agent atau tim menemukan hal di luar PRD yang **perlu** dilakukan, catat di sini.  
> **JANGAN kerjakan** sebelum ada persetujuan eksplisit dari pemilik proyek.  
> Setelah disetujui, **PRD harus diperbarui oleh manusia** terlebih dahulu.  
> Format status: `[PENDING]` · `[APPROVED]` · `[REJECTED]`

---

<!-- Template:

## CR-XXX — [PENDING | APPROVED | REJECTED]
- **Usulan:** ...
- **Alasan:** ...
- **Dampak:** waktu / kompleksitas / bagian PRD yang terdampak
- **Persetujuan:** (diisi pemilik proyek)

-->

_Belum ada change request._

---

## CR-001 — [PENDING]

- **Usulan:** Notifikasi via saluran eksternal (email/WhatsApp) selain in-app.
- **Alasan:** Jawaban pemilik proyek atas Q-006 memilih opsi C (notifikasi eksternal). Q-006 mencatat opsi ini memerlukan CR terpisah.
- **Dampak:** Perlu integrasi Email/WhatsApp di luar scope PRD saat ini (Non-Goals mencakup integrasi WhatsApp Business API); menyentuh US-006, US-016, US-017.
- **Persetujuan:** (diisi pemilik proyek — apakah disetujui masuk scope, dan saluran mana)

---

## CR-002 — [PENDING]

- **Usulan:** Tambah role Finance khusus untuk mengelola termin pembayaran.
- **Alasan:** Jawaban pemilik proyek atas Q-011 memilih opsi B. Q-011 mencatat opsi ini perlu CR jika disetujui.
- **Dampak:** Role baru + RLS policy + menu navigasi; menyentuh US-002, US-003, US-016. Sementara itu US-016 dikerjakan dengan Sales + Admin (opsi A).
- **Persetujuan:** (diisi pemilik proyek + PRD diperbarui manusia bila disetujui)

---

## CR-003 — [APPROVED]

- **Usulan:** Revisi AC2 US-003 dari "Sales hanya dapat mengubah lead miliknya; PM hanya dapat mengubah proyek yang ia kelola" menjadi batas akses per role modul: Sales/Marketing dapat mengubah lead, Project Manager dapat mengubah proyek, role lain read-only, dan Super Admin penuh.
- **Alasan:** Keputusan pemilik atas Q-019 pada 2026-10-27 memilih opsi A. Policy `leads_update_sales_roles` dan `projects_update_pm_roles` di `20261005002000_backend_parity_fixes.sql` sengaja role-based agar sesuai US-009 (bulk assign/reassign PIC) dan US-020 (semua PM/Admin membuat/mengubah proyek). Verifikasi live 2026-10-27 membuktikan Sales/PM dapat mengubah data rekan; perilaku ini diterima sebagai desain yang diinginkan.
- **Dampak:** Tidak ada perubahan skema, policy, atau kode. Hanya AC2 US-003 dan dokumentasi. PRD **wajib diperbarui oleh manusia** sebelum US-003 dapat ditandai `DONE`.
- **Persetujuan:** Pemilik memilih opsi A pada 2026-10-27 (Q-019). PRD telah diperbarui oleh manusia pada 2026-10-27 (AC2 US-003); US-003 ditandai `DONE` 4/4.

---

## CR-004 — [APPROVED]

- **Usulan:** Tambah kolom `team_members.is_active boolean NOT NULL DEFAULT true` agar anggota tim/PIC yang sudah dipakai dapat dinonaktifkan tanpa dihapus, sesuai AC3 US-005.
- **Alasan:** Skema `team_members` yang disetujui pada Gate 2 belum punya flag aktif. Keputusan pemilik atas Q-015 pada 2026-10-27 memilih opsi A (tambah kolom lewat CR + migration); dropdown form hanya menampilkan anggota aktif, sedangkan baris nonaktif tetap tersimpan untuk histori lead/proyek/task.
- **Dampak:** Satu migration baru (`20261027000000_team_members_is_active.sql`), tipe/service/UI tim/PIC, dan test. Policy SELECT `team_members` tetap `using (true)` untuk user terautentikasi agar nama historis tetap resolve; penyaringan aktif dilakukan di service/UI, bukan dengan mempersempit SELECT.
- **Persetujuan:** Pemilik memilih opsi A pada 2026-10-27 (Q-015); migration dan implementasi US-005 dikerjakan pada hari yang sama.
