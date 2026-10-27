-- Status aktif tim/PIC (Q-015, CR-004, US-005 AC3).
--
-- Anggota yang sudah dipakai lead/proyek/task tidak dihapus agar penugasan
-- historis tetap utuh; barisnya cukup dinonaktifkan sehingga hilang dari
-- dropdown form. Policy SELECT `team_members` sengaja tidak diubah: semua user
-- terautentikasi tetap bisa membaca nama historis, sedangkan UI form memfilter
-- `is_active = true` lewat service.
--
-- Refs: US-005, US-022, FR-3

alter table public.team_members
  add column if not exists is_active boolean not null default true;

comment on column public.team_members.is_active is
  'false = tidak tampil di dropdown penugasan; baris tetap tersimpan untuk histori';
