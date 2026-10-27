-- Q-017: audit_logs.entity_id untuk tabel ber-PK komposit.
--
-- Trigger audit sebelumnya hanya membaca kolom `id`/`display_id`, sehingga
-- tabel seperti master_options(category, value), user_roles(user_id, role_name),
-- dan raci_matrix(activity, role) menghasilkan entity_id kosong. Fungsi ini
-- membaca kolom primary key dari katalog lalu menggabungkan nilainya dengan
-- pemisah '/'. Tabel ber-PK tunggal tetap memakai nilai kolom PK apa adanya.
create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  actor_label text;
  row_data jsonb;
  pk_columns text[];
  record_id text;
begin
  if TG_TABLE_NAME = 'audit_logs' then
    if TG_OP = 'DELETE' then
      return OLD;
    end if;
    return NEW;
  end if;

  select coalesce(p.name, p.email::text, 'Sistem')
  into actor_label
  from public.profiles p
  where p.id = actor;

  actor_label := coalesce(actor_label, 'Sistem');
  row_data := case when TG_OP = 'DELETE' then to_jsonb(OLD) else to_jsonb(NEW) end;

  -- Ambil kolom PK sesuai urutan definisi index primary key.
  select array_agg(a.attname::text order by k.ord)
  into pk_columns
  from pg_catalog.pg_index i
  cross join lateral unnest(i.indkey::smallint[]) with ordinality as k(attnum, ord)
  join pg_catalog.pg_attribute a
    on a.attrelid = i.indrelid
   and a.attnum = k.attnum
  where i.indrelid = TG_RELID
    and i.indisprimary;

  if pk_columns is not null then
    select string_agg(row_data ->> c.attname, '/' order by c.ord)
    into record_id
    from unnest(pk_columns) with ordinality as c(attname, ord);
  end if;

  record_id := coalesce(
    nullif(record_id, ''),
    row_data ->> 'id',
    row_data ->> 'display_id',
    ''
  );

  insert into public.audit_logs (
    actor_id,
    actor_name,
    action,
    entity_type,
    entity_id,
    old_value,
    new_value
  ) values (
    actor,
    actor_label,
    lower(TG_OP),
    TG_TABLE_NAME,
    record_id,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(OLD) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(NEW) else null end
  );

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  return NEW;
end;
$$;
