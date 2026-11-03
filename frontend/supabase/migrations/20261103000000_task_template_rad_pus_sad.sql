-- Q-005 (2026-11-03): template produksi resmi.
-- Template lama dipertahankan untuk audit, tetapi dinonaktifkan agar proyek
-- baru hanya menghasilkan RAD, PUS, dan SAD, masing-masing tiga hari kerja.

update public.task_templates
set is_active = false
where name not in (
  'Pembuatan dokumen RAD',
  'Pembuatan dokumen PUS',
  'Pembuatan dokumen SAD'
);

insert into public.task_templates (name, ord, duration_days, is_active) values
  ('Pembuatan dokumen RAD', 1, 3, true),
  ('Pembuatan dokumen PUS', 2, 3, true),
  ('Pembuatan dokumen SAD', 3, 3, true)
on conflict (name) do update
set ord = excluded.ord,
    duration_days = excluded.duration_days,
    is_active = excluded.is_active;

-- Durasi template menggunakan hari kerja Senin–Jumat dan tabel holidays,
-- sama seperti scheduler fitur. Hari mulai yang jatuh pada hari libur maju ke
-- hari kerja berikutnya.
create or replace function private.add_workdays(base_date date, workdays integer)
returns date
language plpgsql
stable
set search_path = ''
as $$
declare
  cur date := base_date;
  added integer := 0;
begin
  while extract(isodow from cur) in (6, 7)
    or exists (select 1 from public.holidays h where h.day = cur) loop
    cur := cur + 1;
  end loop;

  while added < greatest(workdays, 0) loop
    cur := cur + 1;
    if extract(isodow from cur) not in (6, 7)
      and not exists (select 1 from public.holidays h where h.day = cur) then
      added := added + 1;
    end if;
  end loop;
  return cur;
end;
$$;

create or replace function public.create_project_from_handover(
  handover_id uuid,
  pm_id uuid,
  start_date date
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deal_record public.deals%rowtype;
  client_name text;
  project_id uuid;
begin
  if not private.has_any_role(array['Super Admin', 'Project Manager']) then
    raise exception 'Hanya PM atau Super Admin yang dapat membuat proyek dari handover.' using errcode = '42501';
  end if;
  select * into deal_record from public.deals where id = handover_id and status = 'Dikonfirmasi' for update;
  if not found then raise exception 'Handover terkonfirmasi tidak ditemukan.' using errcode = '22023'; end if;
  select p.id into project_id from public.projects p where p.handover_id = handover_id limit 1;
  if project_id is not null then return project_id; end if;
  if start_date > deal_record.deadline then raise exception 'Tanggal mulai proyek tidak boleh melewati deadline.' using errcode = '23514'; end if;
  select c.company_name into client_name from public.clients c where c.id = deal_record.client_id;
  insert into public.projects (name, code, client_id, pm_id, start_date, target_date, value_idr, status, handover_id)
  values (deal_record.title || ' - ' || coalesce(client_name, 'Klien') || ' (' || deal_record.code || ')', deal_record.code, deal_record.client_id, pm_id, start_date, deal_record.deadline, deal_record.value_idr, 'Planning', deal_record.id)
  returning id into project_id;
  insert into public.tasks (project_id, title, start_date, target_date)
  select project_id, tt.name,
    private.add_workdays(start_date, coalesce((select sum(previous.duration_days) from public.task_templates previous where previous.is_active and previous.ord < tt.ord), 0)),
    private.add_workdays(start_date, coalesce((select sum(previous.duration_days) from public.task_templates previous where previous.is_active and previous.ord < tt.ord), 0) + tt.duration_days - 1)
  from public.task_templates tt where tt.is_active order by tt.ord;
  insert into public.features (project_id, name, category, priority, estimate_days, source)
  select project_id, df.name, 'Backend', 'Medium', 1, 'handover' from public.deal_features df where df.deal_id = handover_id;
  return project_id;
end;
$$;
