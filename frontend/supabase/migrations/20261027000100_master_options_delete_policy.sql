-- Policy tulis `master_options` untuk Super Admin (Q-016, US-005 AC3).
--
-- Di database live, DELETE oleh Super Admin sempat mengembalikan `200 []`
-- (0 baris) meskipun SELECT/INSERT/UPDATE berhasil. Service role berhasil,
-- jadi masalahnya ada di policy/grant role `authenticated`. Migration ini
-- mengembalikan definisi policy yang sudah ada di repo dan memastikan grant
-- DELETE tersedia; RLS tetap membatasi operasi ke Super Admin.
--
-- Refs: US-005, US-003, FR-3

grant select, insert, update, delete on table public.master_options to authenticated;

drop policy if exists "master_options_select_authenticated" on public.master_options;
create policy "master_options_select_authenticated" on public.master_options
for select to authenticated
using (is_active = true or private.is_super_admin());

-- Live sempat memakai policy INSERT/UPDATE terpisah tanpa DELETE. Hapus agar
-- tidak ada policy duplikat; `master_options_manage_admin` di bawah mencakup
-- SELECT/INSERT/UPDATE/DELETE untuk Super Admin.
drop policy if exists "master_options_insert_admin" on public.master_options;
drop policy if exists "master_options_update_admin" on public.master_options;
drop policy if exists "master_options_manage_admin" on public.master_options;
create policy "master_options_manage_admin" on public.master_options
for all to authenticated
using (private.is_super_admin())
with check (private.is_super_admin());
