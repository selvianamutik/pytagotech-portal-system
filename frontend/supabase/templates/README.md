# Template Email Auth

Template HTML siap paste ke Supabase Dashboard → **Authentication → Email Templates**
(US-002, FR-1). Bahasa Indonesia, gaya Pytagotech Portal, kompatibel klien email
(tabel + inline CSS, tanpa JS/font eksternal).

| File | Template Dashboard | Subject yang disarankan |
|------|--------------------|-------------------------|
| `confirmation.html` | Confirm signup | `Konfirmasi akun Pytagotech Portal Anda` |
| `email_change.html` | Change Email Address | `Konfirmasi perubahan email Anda` |
| `recovery.html` | Reset Password | `Reset kata sandi Pytagotech Portal` |

## Cara pasang

1. Buka Dashboard → Authentication → Email Templates → pilih template.
2. Ganti **Subject** sesuai tabel (atau pertahankan bawaan).
3. Buka tab **Source** (atau Edit), hapus isi lama, paste seluruh isi file HTML.
4. **Send test email** ke email sendiri → klik tombol → pastikan mendarat di
   aplikasi dan alur selesai:
   - Confirm signup → `/auth/confirm` → `/`
   - Reset Password → `/auth/confirm` → `/login?recovery=1` → atur kata sandi baru
   - Change Email → `/auth/confirm` → `/`
5. Simpan. Ulangi untuk ketiga template.

## Variabel yang dipakai

- `{{ .ConfirmationURL }}` — tautan aksi (tombol + tautan cadangan).
- `{{ .Email }}` — email penerima (recovery, confirmation).
- `{{ .NewEmail }}` — email baru (change-email).

Jangan mengubah nama variabel — diisi otomatis oleh Supabase Auth.
