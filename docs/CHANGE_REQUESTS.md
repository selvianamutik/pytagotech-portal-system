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
