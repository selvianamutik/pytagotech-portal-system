-- Bucket lampiran portal (FR-4).
--
-- Policy Storage untuk bucket `portal-attachments` sudah dibuat di
-- `20261005001000_backend_foundation.sql`. Bucket-nya sendiri belum dibuat
-- oleh migration, sehingga `db reset` dari database kosong tidak akan punya
-- tempat menyimpan lampiran. Insert ini idempoten agar aman dijalankan pada
-- database live yang bucket-nya sudah ada.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'portal-attachments',
  'portal-attachments',
  false,
  10485760,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;
