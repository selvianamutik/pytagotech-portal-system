-- Backend foundation untuk PRD Pytagotech Portal.
-- Fokus: RLS, audit trail, guardrail bisnis inti, view/RPC dasar.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------- Helper role & identitas ----------

create or replace function private.has_role(p_role_name text, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = p_user_id
      and ur.role_name = p_role_name
      and p.is_active = true
  );
$$;

create or replace function private.has_any_role(p_role_names text[], p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = p_user_id
      and ur.role_name = any(p_role_names)
      and p.is_active = true
  );
$$;

create or replace function private.current_team_member_id(p_user_id uuid default auth.uid())
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select tm.id
  from public.team_members tm
  join public.profiles p on p.id = tm.profile_id
  where tm.profile_id = p_user_id
    and p.is_active = true
  limit 1;
$$;

create or replace function private.is_super_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select private.has_role('Super Admin', p_user_id);
$$;

create or replace function private.can_manage_platform(p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select private.has_any_role(array['Super Admin', 'Executive / Leader'], p_user_id);
$$;

grant execute on function private.has_role(text, uuid) to authenticated;
grant execute on function private.has_any_role(text[], uuid) to authenticated;
grant execute on function private.current_team_member_id(uuid) to authenticated;
grant execute on function private.is_super_admin(uuid) to authenticated;
grant execute on function private.can_manage_platform(uuid) to authenticated;

-- ---------- Audit trail ----------

create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  actor_label text;
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
  record_id := coalesce(
    case when TG_OP = 'DELETE' then (to_jsonb(OLD)->>'id') else (to_jsonb(NEW)->>'id') end,
    case when TG_OP = 'DELETE' then (to_jsonb(OLD)->>'display_id') else (to_jsonb(NEW)->>'display_id') end,
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

create or replace function private.attach_audit_trigger(table_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  execute format('drop trigger if exists trg_audit_%I on public.%I', table_name, table_name);
  execute format(
    'create trigger trg_audit_%I after insert or update or delete on public.%I for each row execute function private.audit_row_change()',
    table_name,
    table_name
  );
end;
$$;

select private.attach_audit_trigger(t)
from unnest(array[
  'profiles',
  'user_roles',
  'team_members',
  'master_options',
  'leads',
  'lead_interests',
  'lead_activities',
  'clients',
  'deals',
  'deal_features',
  'deal_payment_terms',
  'deal_versions',
  'change_requests',
  'projects',
  'task_templates',
  'tasks',
  'task_dependencies',
  'features',
  'developer_capacity',
  'holidays',
  'content_ideas',
  'idea_platforms',
  'content_materials',
  'material_platforms',
  'content_revisions',
  'publications',
  'post_metrics',
  'account_growth',
  'community_interactions',
  'inquiries',
  'assets',
  'material_assets',
  'strategy_evaluations',
  'comments',
  'attachments',
  'notifications',
  'settings',
  'guides',
  'raci_matrix'
]) as x(t);

revoke update, delete on public.audit_logs from authenticated;

-- ---------- Guardrail bisnis ----------

create or replace function private.sync_lead_status_side_effects()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  team_id uuid := private.current_team_member_id((select auth.uid()));
begin
  if TG_OP = 'INSERT' or OLD.status is distinct from NEW.status then
    insert into public.lead_status_history (lead_id, status, changed_by)
    values (NEW.id, NEW.status, team_id);

    if NEW.status = 'Interest' then
      insert into public.lead_interests (lead_id, stage)
      values (NEW.id, 'New Interest')
      on conflict (lead_id) do nothing;
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_leads_status_side_effects on public.leads;
create trigger trg_leads_status_side_effects
after insert or update of status on public.leads
for each row execute function private.sync_lead_status_side_effects();

create or replace function public.content_brief_score(
  hook text,
  angle text,
  key_points text,
  cta text,
  asset_ref text
)
returns integer
language sql
immutable
as $$
  select
    (case when nullif(trim(coalesce(hook, '')), '') is not null then 1 else 0 end) +
    (case when nullif(trim(coalesce(angle, '')), '') is not null then 1 else 0 end) +
    (case when nullif(trim(coalesce(key_points, '')), '') is not null then 1 else 0 end) +
    (case when nullif(trim(coalesce(cta, '')), '') is not null then 1 else 0 end) +
    (case when nullif(trim(coalesce(asset_ref, '')), '') is not null then 1 else 0 end);
$$;

create or replace function private.enforce_content_idea_readiness()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  min_score integer := coalesce((select (value #>> '{}')::integer from public.settings where key = 'brief.min_score'), 5);
  score integer;
begin
  score := public.content_brief_score(NEW.hook, NEW.angle, NEW.key_points, NEW.cta, NEW.asset_ref);

  if NEW.readiness = 'Siap Masuk Produksi' and score < min_score then
    raise exception 'Brief belum lengkap: skor % dari %, minimal % untuk Siap Masuk Produksi.', score, 5, min_score
      using errcode = '23514';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_content_ideas_readiness_gate on public.content_ideas;
create trigger trg_content_ideas_readiness_gate
before insert or update on public.content_ideas
for each row execute function private.enforce_content_idea_readiness();

create or replace function private.enforce_material_quality_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if NEW.status in ('Dijadwalkan', 'Rilis') then
    if not (
      NEW.gate_visual and
      NEW.gate_audio and
      NEW.gate_cover and
      NEW.gate_cta and
      NEW.gate_proofread
    ) and NEW.gate_override_by is null then
      raise exception 'Materi belum lolos quality gate dan tidak memiliki override Admin.'
        using errcode = '23514';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_material_quality_gate on public.content_materials;
create trigger trg_material_quality_gate
before insert or update on public.content_materials
for each row execute function private.enforce_material_quality_gate();

create or replace function private.reject_expired_material_asset()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expired_asset text;
begin
  select a.display_id || ' - ' || a.name
  into expired_asset
  from public.assets a
  where a.id = NEW.asset_id
    and a.license_expiry is not null
    and a.license_expiry < ((now() at time zone 'Asia/Jakarta')::date)
  limit 1;

  if expired_asset is not null then
    raise exception 'Aset % sudah kedaluwarsa dan tidak dapat ditautkan ke materi baru.', expired_asset
      using errcode = '23514';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_material_assets_reject_expired on public.material_assets;
create trigger trg_material_assets_reject_expired
before insert or update on public.material_assets
for each row execute function private.reject_expired_material_asset();

-- ---------- View kalkulasi ----------

create or replace view public.project_progress as
select
  p.id as project_id,
  p.display_id,
  p.name,
  p.status,
  coalesce(round(avg(t.percent)::numeric, 2), 0) as progress_percent,
  count(t.id) filter (where t.status = 'Done') as done_tasks,
  count(t.id) as total_tasks
from public.projects p
left join public.tasks t on t.project_id = p.id and t.parent_id is null and t.is_active = true
group by p.id, p.display_id, p.name, p.status;

create or replace view public.community_sla_summary as
select
  ci.id,
  ci.platform,
  ci.brand,
  ci.type,
  ci.received_at,
  ci.replied_at,
  case
    when ci.replied_at is null then null
    else floor(extract(epoch from (ci.replied_at - ci.received_at)) / 60)::integer
  end as response_minutes,
  case
    when ci.replied_at is null then false
    else floor(extract(epoch from (ci.replied_at - ci.received_at)) / 60)::integer <=
      coalesce((select (value #>> '{}')::integer from public.settings where key = 'sla.response_minutes'), 30)
  end as within_sla
from public.community_interactions ci;

create or replace view public.inquiry_routing_sla_summary as
select
  i.id,
  i.display_id,
  i.platform,
  i.brand,
  i.status,
  i.received_at,
  i.routed_at,
  case
    when i.routed_at is null then null
    else floor(extract(epoch from (i.routed_at - i.received_at)) / 60)::integer
  end as routing_minutes,
  case
    when i.routed_at is null then false
    else floor(extract(epoch from (i.routed_at - i.received_at)) / 60)::integer <=
      coalesce((select (value #>> '{}')::integer from public.settings where key = 'sla.routing_minutes'), 15)
  end as within_sla
from public.inquiries i;

create or replace view public.asset_license_status as
select
  a.*,
  case
    when a.license_expiry is null then 'valid'
    when a.license_expiry < ((now() at time zone 'Asia/Jakarta')::date) then 'expired'
    when a.license_expiry <= ((now() at time zone 'Asia/Jakarta')::date + interval '30 days')::date then 'expiring'
    else 'valid'
  end as license_status
from public.assets a;

-- ---------- RPC workflow dasar ----------

create or replace function public.archive_entity(entity_type text, entity_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_super_admin() then
    raise exception 'Hanya Super Admin yang dapat mengarsipkan data.'
      using errcode = '42501';
  end if;

  case entity_type
    when 'lead' then
      update public.leads set archived_at = now() where id = entity_id;
    when 'project' then
      update public.projects set archived_at = now() where id = entity_id;
    when 'content_material' then
      update public.content_materials set archived_at = now() where id = entity_id;
    else
      raise exception 'Entity type % tidak mendukung arsip.', entity_type
        using errcode = '22023';
  end case;
end;
$$;

create or replace function public.restore_entity(entity_type text, entity_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_super_admin() then
    raise exception 'Hanya Super Admin yang dapat memulihkan data arsip.'
      using errcode = '42501';
  end if;

  case entity_type
    when 'lead' then
      update public.leads set archived_at = null where id = entity_id;
    when 'project' then
      update public.projects set archived_at = null where id = entity_id;
    when 'content_material' then
      update public.content_materials set archived_at = null where id = entity_id;
    else
      raise exception 'Entity type % tidak mendukung restore.', entity_type
        using errcode = '22023';
  end case;
end;
$$;

create or replace function public.global_search(search_query text, result_limit integer default 30)
returns table (
  entity_type text,
  entity_id uuid,
  display_id text,
  title text,
  subtitle text,
  href text,
  updated_at timestamptz
)
language sql
security invoker
stable
set search_path = ''
as $$
  with q as (
    select '%' || trim(search_query) || '%' as term,
           greatest(1, least(coalesce(result_limit, 30), 50)) as lim
  )
  select * from (
    select 'lead'::text, l.id, l.display_id, l.company_name, l.status, '/crm/leads', l.updated_at
    from public.leads l, q
    where l.archived_at is null and (l.company_name ilike q.term or l.email ilike q.term or l.whatsapp ilike q.term)
    union all
    select 'client', c.id, c.display_id, c.company_name, c.email, '/klien', c.updated_at
    from public.clients c, q
    where c.company_name ilike q.term or c.email ilike q.term or c.phone ilike q.term
    union all
    select 'project', p.id, p.display_id, p.name, p.status, '/proyek/' || p.id::text, p.updated_at
    from public.projects p, q
    where p.archived_at is null and (p.name ilike q.term or p.code ilike q.term)
    union all
    select 'task', t.id, t.display_id, t.title, t.status, '/proyek/' || t.project_id::text || '/tasks', t.updated_at
    from public.tasks t, q
    where t.is_active = true and t.title ilike q.term
    union all
    select 'content_material', m.id, m.display_id, m.title, m.status, '/sosmed/materi/' || m.id::text, m.updated_at
    from public.content_materials m, q
    where m.archived_at is null and m.title ilike q.term
  ) results
  order by updated_at desc
  limit (select lim from q);
$$;

create or replace function public.create_client_from_lead(
  lead_id uuid,
  pic_name text,
  referrer text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  lead_record public.leads%rowtype;
  client_id uuid;
begin
  select * into lead_record
  from public.leads
  where id = lead_id
    and status = 'Closing'
    and archived_at is null;

  if not found then
    raise exception 'Lead Closing tidak ditemukan atau tidak dapat dikonversi.'
      using errcode = '22023';
  end if;

  select c.id into client_id
  from public.clients c
  where c.source_lead_id = lead_id
  limit 1;

  if client_id is not null then
    return client_id;
  end if;

  insert into public.clients (company_name, pic_name, phone, email, referrer, source_lead_id)
  values (
    lead_record.company_name,
    nullif(trim(pic_name), ''),
    lead_record.whatsapp,
    lead_record.email,
    coalesce(nullif(trim(referrer), ''), lead_record.source),
    lead_record.id
  )
  returning id into client_id;

  return client_id;
end;
$$;

create or replace function public.deal_terms_total_idr(p_deal_id uuid)
returns bigint
language sql
security invoker
stable
set search_path = ''
as $$
  select coalesce(sum(
    case
      when dpt.kind = 'percent' then round(d.value_idr * dpt.value / 100)::bigint
      else dpt.value::bigint
    end
  ), 0)
  from public.deals d
  left join public.deal_payment_terms dpt on dpt.deal_id = d.id
  where d.id = p_deal_id;
$$;

create or replace function public.transition_deal_status(
  deal_id uuid,
  next_status text,
  comment_body text default null
)
returns public.deals
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_deal public.deals%rowtype;
  actor_team uuid := private.current_team_member_id();
begin
  select * into current_deal from public.deals where id = deal_id for update;
  if not found then
    raise exception 'Handover tidak ditemukan.' using errcode = '22023';
  end if;

  if next_status not in ('Draft', 'Menunggu Konfirmasi Produksi', 'Dikonfirmasi', 'Perlu Revisi') then
    raise exception 'Status handover tidak valid: %', next_status using errcode = '22023';
  end if;

  if next_status = 'Menunggu Konfirmasi Produksi' and current_deal.status not in ('Draft', 'Perlu Revisi') then
    raise exception 'Hanya Draft atau Perlu Revisi yang dapat diajukan ke Produksi.' using errcode = '23514';
  end if;

  if next_status in ('Dikonfirmasi', 'Perlu Revisi') then
    if not private.has_any_role(array['Super Admin', 'Project Manager']) then
      raise exception 'Hanya PM atau Super Admin yang dapat memberi keputusan handover.' using errcode = '42501';
    end if;

    if current_deal.status <> 'Menunggu Konfirmasi Produksi' then
      raise exception 'Hanya handover Menunggu Konfirmasi Produksi yang dapat diputuskan.' using errcode = '23514';
    end if;

    if next_status = 'Perlu Revisi' and nullif(trim(coalesce(comment_body, '')), '') is null then
      raise exception 'Komentar wajib saat handover perlu revisi.' using errcode = '23514';
    end if;
  end if;

  if next_status = 'Menunggu Konfirmasi Produksi'
     and public.deal_terms_total_idr(deal_id) <> current_deal.value_idr then
    raise exception 'Total termin harus sama dengan nilai deal sebelum submit.'
      using errcode = '23514';
  end if;

  update public.deals
  set status = next_status,
      confirmed_by = case when next_status = 'Dikonfirmasi' then actor_team else confirmed_by end,
      confirmed_at = case when next_status = 'Dikonfirmasi' then now() else confirmed_at end
  where id = deal_id
  returning * into current_deal;

  if nullif(trim(coalesce(comment_body, '')), '') is not null then
    insert into public.comments (entity_type, entity_id, author_id, body)
    values ('deal', deal_id, actor_team, comment_body);
  end if;

  return current_deal;
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
    raise exception 'Hanya PM atau Super Admin yang dapat membuat proyek dari handover.'
      using errcode = '42501';
  end if;

  select * into deal_record
  from public.deals
  where id = handover_id
    and status = 'Dikonfirmasi'
  for update;

  if not found then
    raise exception 'Handover terkonfirmasi tidak ditemukan.' using errcode = '22023';
  end if;

  select p.id into project_id
  from public.projects p
  where p.handover_id = handover_id
  limit 1;

  if project_id is not null then
    return project_id;
  end if;

  if start_date > deal_record.deadline then
    raise exception 'Tanggal mulai proyek tidak boleh melewati deadline.'
      using errcode = '23514';
  end if;

  select c.company_name into client_name
  from public.clients c
  where c.id = deal_record.client_id;

  insert into public.projects (name, code, client_id, pm_id, start_date, target_date, value_idr, status, handover_id)
  values (
    deal_record.title || ' - ' || coalesce(client_name, 'Klien') || ' (' || deal_record.code || ')',
    deal_record.code,
    deal_record.client_id,
    pm_id,
    start_date,
    deal_record.deadline,
    deal_record.value_idr,
    'Planning',
    deal_record.id
  )
  returning id into project_id;

  insert into public.tasks (project_id, title, start_date, target_date)
  select
    project_id,
    tt.name,
    start_date + (tt.ord - 1),
    start_date + (tt.ord + tt.duration_days - 2)
  from public.task_templates tt
  where tt.is_active = true
  order by tt.ord;

  insert into public.features (project_id, name, category, priority, estimate_days, source)
  select project_id, df.name, 'Backend', 'Medium', 1, 'handover'
  from public.deal_features df
  where df.deal_id = handover_id;

  return project_id;
end;
$$;

grant execute on function public.archive_entity(text, uuid) to authenticated;
grant execute on function public.restore_entity(text, uuid) to authenticated;
grant execute on function public.global_search(text, integer) to authenticated;
grant execute on function public.create_client_from_lead(uuid, text, text) to authenticated;
grant execute on function public.deal_terms_total_idr(uuid) to authenticated;
grant execute on function public.transition_deal_status(uuid, text, text) to authenticated;
grant execute on function public.create_project_from_handover(uuid, uuid, date) to authenticated;

-- ---------- RLS policies ----------

-- Auth/platform tables.
drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated" on public.roles
for select to authenticated using (true);

drop policy if exists "roles_manage_super_admin" on public.roles;
create policy "roles_manage_super_admin" on public.roles
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists "profiles_select_self_or_manager" on public.profiles;
create policy "profiles_select_self_or_manager" on public.profiles
for select to authenticated using (id = (select auth.uid()) or private.can_manage_platform());

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin" on public.profiles
for insert to authenticated with check (id = (select auth.uid()) or private.is_super_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
for update to authenticated using (id = (select auth.uid()) or private.is_super_admin())
with check (id = (select auth.uid()) or private.is_super_admin());

drop policy if exists "user_roles_select_self_or_admin" on public.user_roles;
create policy "user_roles_select_self_or_admin" on public.user_roles
for select to authenticated using (user_id = (select auth.uid()) or private.is_super_admin());

drop policy if exists "user_roles_manage_super_admin" on public.user_roles;
create policy "user_roles_manage_super_admin" on public.user_roles
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists "team_members_select_authenticated" on public.team_members;
create policy "team_members_select_authenticated" on public.team_members
for select to authenticated using (true);

drop policy if exists "team_members_manage_admin" on public.team_members;
create policy "team_members_manage_admin" on public.team_members
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists "master_options_select_authenticated" on public.master_options;
create policy "master_options_select_authenticated" on public.master_options
for select to authenticated using (is_active = true or private.is_super_admin());

drop policy if exists "master_options_manage_admin" on public.master_options;
create policy "master_options_manage_admin" on public.master_options
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists "settings_select_authenticated" on public.settings;
create policy "settings_select_authenticated" on public.settings
for select to authenticated using (true);

drop policy if exists "settings_manage_admin" on public.settings;
create policy "settings_manage_admin" on public.settings
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

-- CRM.
drop policy if exists "leads_select_crm_roles" on public.leads;
create policy "leads_select_crm_roles" on public.leads
for select to authenticated using (
  private.has_any_role(array['Super Admin', 'Executive / Leader', 'Sales / Marketing', 'Project Manager'])
);

drop policy if exists "leads_insert_sales_roles" on public.leads;
create policy "leads_insert_sales_roles" on public.leads
for insert to authenticated with check (
  private.has_any_role(array['Super Admin', 'Sales / Marketing'])
);

drop policy if exists "leads_update_owner_or_admin" on public.leads;
create policy "leads_update_owner_or_admin" on public.leads
for update to authenticated using (
  private.is_super_admin() or pic_id = private.current_team_member_id()
) with check (
  private.is_super_admin() or pic_id = private.current_team_member_id()
);

drop policy if exists "lead_interests_select_crm_roles" on public.lead_interests;
create policy "lead_interests_select_crm_roles" on public.lead_interests
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Sales / Marketing']));

drop policy if exists "lead_interests_manage_sales" on public.lead_interests;
create policy "lead_interests_manage_sales" on public.lead_interests
for all to authenticated using (private.has_any_role(array['Super Admin', 'Sales / Marketing']))
with check (private.has_any_role(array['Super Admin', 'Sales / Marketing']));

drop policy if exists "lead_status_history_select_crm_roles" on public.lead_status_history;
create policy "lead_status_history_select_crm_roles" on public.lead_status_history
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Sales / Marketing', 'Project Manager']));

drop policy if exists "lead_status_history_insert_authenticated" on public.lead_status_history;
create policy "lead_status_history_insert_authenticated" on public.lead_status_history
for insert to authenticated with check (true);

drop policy if exists "lead_activities_select_crm_roles" on public.lead_activities;
create policy "lead_activities_select_crm_roles" on public.lead_activities
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Sales / Marketing']));

drop policy if exists "lead_activities_insert_crm_roles" on public.lead_activities;
create policy "lead_activities_insert_crm_roles" on public.lead_activities
for insert to authenticated with check (private.has_any_role(array['Super Admin', 'Sales / Marketing']));

-- Klien, handover, proyek.
drop policy if exists "clients_select_business_roles" on public.clients;
create policy "clients_select_business_roles" on public.clients
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Sales / Marketing', 'Project Manager']));

drop policy if exists "clients_manage_sales_admin" on public.clients;
create policy "clients_manage_sales_admin" on public.clients
for all to authenticated using (private.has_any_role(array['Super Admin', 'Sales / Marketing']))
with check (private.has_any_role(array['Super Admin', 'Sales / Marketing']));

drop policy if exists "deals_select_business_roles" on public.deals;
create policy "deals_select_business_roles" on public.deals
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Sales / Marketing', 'Project Manager']));

drop policy if exists "deals_manage_sales_pm" on public.deals;
create policy "deals_manage_sales_pm" on public.deals
for all to authenticated using (private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager']))
with check (private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager']));

drop policy if exists "deal_children_select_business_roles" on public.deal_features;
create policy "deal_children_select_business_roles" on public.deal_features
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Sales / Marketing', 'Project Manager']));
drop policy if exists "deal_children_manage_business_roles" on public.deal_features;
create policy "deal_children_manage_business_roles" on public.deal_features
for all to authenticated using (private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager']))
with check (private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager']));

drop policy if exists "deal_terms_select_business_roles" on public.deal_payment_terms;
create policy "deal_terms_select_business_roles" on public.deal_payment_terms
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Sales / Marketing', 'Project Manager']));
drop policy if exists "deal_terms_manage_business_roles" on public.deal_payment_terms;
create policy "deal_terms_manage_business_roles" on public.deal_payment_terms
for all to authenticated using (private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager']))
with check (private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager']));

drop policy if exists "deal_versions_select_business_roles" on public.deal_versions;
create policy "deal_versions_select_business_roles" on public.deal_versions
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Sales / Marketing', 'Project Manager']));
drop policy if exists "deal_versions_insert_business_roles" on public.deal_versions;
create policy "deal_versions_insert_business_roles" on public.deal_versions
for insert to authenticated with check (private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager']));

drop policy if exists "change_requests_select_business_roles" on public.change_requests;
create policy "change_requests_select_business_roles" on public.change_requests
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Sales / Marketing', 'Project Manager']));
drop policy if exists "change_requests_manage_business_roles" on public.change_requests;
create policy "change_requests_manage_business_roles" on public.change_requests
for all to authenticated using (private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager']))
with check (private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager']));

drop policy if exists "projects_select_production_roles" on public.projects;
create policy "projects_select_production_roles" on public.projects
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Project Manager', 'Developer']));

drop policy if exists "projects_manage_pm_admin" on public.projects;
create policy "projects_manage_pm_admin" on public.projects
for all to authenticated using (private.is_super_admin() or pm_id = private.current_team_member_id())
with check (private.is_super_admin() or pm_id = private.current_team_member_id());

drop policy if exists "task_templates_select_authenticated" on public.task_templates;
create policy "task_templates_select_authenticated" on public.task_templates
for select to authenticated using (true);
drop policy if exists "task_templates_manage_admin" on public.task_templates;
create policy "task_templates_manage_admin" on public.task_templates
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists "tasks_select_production_roles" on public.tasks;
create policy "tasks_select_production_roles" on public.tasks
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Project Manager', 'Developer']));
drop policy if exists "tasks_insert_pm_admin" on public.tasks;
create policy "tasks_insert_pm_admin" on public.tasks
for insert to authenticated with check (private.has_any_role(array['Super Admin', 'Project Manager']));
drop policy if exists "tasks_update_owner_pm_admin" on public.tasks;
create policy "tasks_update_owner_pm_admin" on public.tasks
for update to authenticated using (
  private.is_super_admin()
  or assignee_id = private.current_team_member_id()
  or exists (select 1 from public.projects p where p.id = tasks.project_id and p.pm_id = private.current_team_member_id())
) with check (
  private.is_super_admin()
  or assignee_id = private.current_team_member_id()
  or exists (select 1 from public.projects p where p.id = tasks.project_id and p.pm_id = private.current_team_member_id())
);

drop policy if exists "task_dependencies_select_production_roles" on public.task_dependencies;
create policy "task_dependencies_select_production_roles" on public.task_dependencies
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Project Manager', 'Developer']));
drop policy if exists "task_dependencies_manage_pm_admin" on public.task_dependencies;
create policy "task_dependencies_manage_pm_admin" on public.task_dependencies
for all to authenticated using (private.has_any_role(array['Super Admin', 'Project Manager']))
with check (private.has_any_role(array['Super Admin', 'Project Manager']));

drop policy if exists "features_select_production_roles" on public.features;
create policy "features_select_production_roles" on public.features
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Project Manager', 'Developer']));
drop policy if exists "features_manage_pm_admin" on public.features;
create policy "features_manage_pm_admin" on public.features
for all to authenticated using (private.has_any_role(array['Super Admin', 'Project Manager']))
with check (private.has_any_role(array['Super Admin', 'Project Manager']));

drop policy if exists "developer_capacity_select_production_roles" on public.developer_capacity;
create policy "developer_capacity_select_production_roles" on public.developer_capacity
for select to authenticated using (private.has_any_role(array['Super Admin', 'Project Manager', 'Developer']));
drop policy if exists "developer_capacity_manage_pm_admin" on public.developer_capacity;
create policy "developer_capacity_manage_pm_admin" on public.developer_capacity
for all to authenticated using (private.has_any_role(array['Super Admin', 'Project Manager']))
with check (private.has_any_role(array['Super Admin', 'Project Manager']));

drop policy if exists "holidays_select_authenticated" on public.holidays;
create policy "holidays_select_authenticated" on public.holidays
for select to authenticated using (true);
drop policy if exists "holidays_manage_admin" on public.holidays;
create policy "holidays_manage_admin" on public.holidays
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

-- Sosmed.
drop policy if exists "sosmed_core_select_roles" on public.content_ideas;
create policy "sosmed_core_select_roles" on public.content_ideas
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']));
drop policy if exists "sosmed_ideas_manage_roles" on public.content_ideas;
create policy "sosmed_ideas_manage_roles" on public.content_ideas
for all to authenticated using (private.has_any_role(array['Super Admin', 'Social Media Specialist']))
with check (private.has_any_role(array['Super Admin', 'Social Media Specialist']));

drop policy if exists "idea_platforms_select_sosmed_roles" on public.idea_platforms;
create policy "idea_platforms_select_sosmed_roles" on public.idea_platforms
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']));
drop policy if exists "idea_platforms_manage_sosmed_roles" on public.idea_platforms;
create policy "idea_platforms_manage_sosmed_roles" on public.idea_platforms
for all to authenticated using (private.has_any_role(array['Super Admin', 'Social Media Specialist']))
with check (private.has_any_role(array['Super Admin', 'Social Media Specialist']));

drop policy if exists "materials_select_sosmed_roles" on public.content_materials;
create policy "materials_select_sosmed_roles" on public.content_materials
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']));
drop policy if exists "materials_manage_sosmed_roles" on public.content_materials;
create policy "materials_manage_sosmed_roles" on public.content_materials
for all to authenticated using (private.has_any_role(array['Super Admin', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']))
with check (private.has_any_role(array['Super Admin', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']));

drop policy if exists "material_platforms_select_sosmed_roles" on public.material_platforms;
create policy "material_platforms_select_sosmed_roles" on public.material_platforms
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']));
drop policy if exists "material_platforms_manage_sosmed_roles" on public.material_platforms;
create policy "material_platforms_manage_sosmed_roles" on public.material_platforms
for all to authenticated using (private.has_any_role(array['Super Admin', 'Social Media Specialist']))
with check (private.has_any_role(array['Super Admin', 'Social Media Specialist']));

drop policy if exists "content_revisions_select_sosmed_roles" on public.content_revisions;
create policy "content_revisions_select_sosmed_roles" on public.content_revisions
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']));
drop policy if exists "content_revisions_manage_reviewers" on public.content_revisions;
create policy "content_revisions_manage_reviewers" on public.content_revisions
for all to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist']))
with check (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist']));

drop policy if exists "publications_select_sosmed_roles" on public.publications;
create policy "publications_select_sosmed_roles" on public.publications
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']));
drop policy if exists "publications_manage_sosmed_roles" on public.publications;
create policy "publications_manage_sosmed_roles" on public.publications
for all to authenticated using (private.has_any_role(array['Super Admin', 'Social Media Specialist']))
with check (private.has_any_role(array['Super Admin', 'Social Media Specialist']));

drop policy if exists "post_metrics_select_sosmed_roles" on public.post_metrics;
create policy "post_metrics_select_sosmed_roles" on public.post_metrics
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist']));
drop policy if exists "post_metrics_insert_sosmed_roles" on public.post_metrics;
create policy "post_metrics_insert_sosmed_roles" on public.post_metrics
for insert to authenticated with check (private.has_any_role(array['Super Admin', 'Social Media Specialist']));
drop policy if exists "post_metrics_update_final_admin_leader" on public.post_metrics;
create policy "post_metrics_update_final_admin_leader" on public.post_metrics
for update to authenticated using (
  snapshot <> 'Final' or private.has_any_role(array['Super Admin', 'Executive / Leader'])
) with check (
  snapshot <> 'Final' or private.has_any_role(array['Super Admin', 'Executive / Leader'])
);

drop policy if exists "account_growth_select_sosmed_roles" on public.account_growth;
create policy "account_growth_select_sosmed_roles" on public.account_growth
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist']));
drop policy if exists "account_growth_manage_sosmed_roles" on public.account_growth;
create policy "account_growth_manage_sosmed_roles" on public.account_growth
for all to authenticated using (private.has_any_role(array['Super Admin', 'Social Media Specialist']))
with check (private.has_any_role(array['Super Admin', 'Social Media Specialist']));

drop policy if exists "community_select_sosmed_roles" on public.community_interactions;
create policy "community_select_sosmed_roles" on public.community_interactions
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist']));
drop policy if exists "community_manage_sosmed_roles" on public.community_interactions;
create policy "community_manage_sosmed_roles" on public.community_interactions
for all to authenticated using (private.has_any_role(array['Super Admin', 'Social Media Specialist']))
with check (private.has_any_role(array['Super Admin', 'Social Media Specialist']));

drop policy if exists "inquiries_select_crm_sosmed_roles" on public.inquiries;
create policy "inquiries_select_crm_sosmed_roles" on public.inquiries
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Sales / Marketing', 'Social Media Specialist']));
drop policy if exists "inquiries_manage_sosmed_roles" on public.inquiries;
create policy "inquiries_manage_sosmed_roles" on public.inquiries
for all to authenticated using (private.has_any_role(array['Super Admin', 'Social Media Specialist']))
with check (private.has_any_role(array['Super Admin', 'Social Media Specialist']));

drop policy if exists "assets_select_sosmed_roles" on public.assets;
create policy "assets_select_sosmed_roles" on public.assets
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']));
drop policy if exists "assets_manage_sosmed_roles" on public.assets;
create policy "assets_manage_sosmed_roles" on public.assets
for all to authenticated using (private.has_any_role(array['Super Admin', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']))
with check (private.has_any_role(array['Super Admin', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']));

drop policy if exists "material_assets_select_sosmed_roles" on public.material_assets;
create policy "material_assets_select_sosmed_roles" on public.material_assets
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']));
drop policy if exists "material_assets_manage_sosmed_roles" on public.material_assets;
create policy "material_assets_manage_sosmed_roles" on public.material_assets
for all to authenticated using (private.has_any_role(array['Super Admin', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']))
with check (private.has_any_role(array['Super Admin', 'Social Media Specialist', 'Graphic Designer / Video Editor / Copywriter']));

drop policy if exists "strategy_select_sosmed_roles" on public.strategy_evaluations;
create policy "strategy_select_sosmed_roles" on public.strategy_evaluations
for select to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist']));
drop policy if exists "strategy_manage_sosmed_roles" on public.strategy_evaluations;
create policy "strategy_manage_sosmed_roles" on public.strategy_evaluations
for all to authenticated using (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist']))
with check (private.has_any_role(array['Super Admin', 'Executive / Leader', 'Social Media Specialist']));

-- Kolaborasi, notifikasi, audit, panduan.
drop policy if exists "comments_select_authenticated" on public.comments;
create policy "comments_select_authenticated" on public.comments
for select to authenticated using (true);
drop policy if exists "comments_insert_authenticated" on public.comments;
create policy "comments_insert_authenticated" on public.comments
for insert to authenticated with check (author_id is null or author_id = private.current_team_member_id());
drop policy if exists "comments_update_author_admin" on public.comments;
create policy "comments_update_author_admin" on public.comments
for update to authenticated using (private.is_super_admin() or author_id = private.current_team_member_id())
with check (private.is_super_admin() or author_id = private.current_team_member_id());

drop policy if exists "attachments_select_authenticated" on public.attachments;
create policy "attachments_select_authenticated" on public.attachments
for select to authenticated using (true);
drop policy if exists "attachments_insert_authenticated" on public.attachments;
create policy "attachments_insert_authenticated" on public.attachments
for insert to authenticated with check (uploaded_by is null or uploaded_by = private.current_team_member_id());
drop policy if exists "attachments_delete_owner_admin" on public.attachments;
create policy "attachments_delete_owner_admin" on public.attachments
for delete to authenticated using (private.is_super_admin() or uploaded_by = private.current_team_member_id());

drop policy if exists "notifications_select_recipient" on public.notifications;
create policy "notifications_select_recipient" on public.notifications
for select to authenticated using (recipient_id = (select auth.uid()) or private.is_super_admin());
drop policy if exists "notifications_update_recipient" on public.notifications;
create policy "notifications_update_recipient" on public.notifications
for update to authenticated using (recipient_id = (select auth.uid()) or private.is_super_admin())
with check (recipient_id = (select auth.uid()) or private.is_super_admin());
drop policy if exists "notifications_insert_authenticated" on public.notifications;
create policy "notifications_insert_authenticated" on public.notifications
for insert to authenticated with check (true);

drop policy if exists "audit_logs_select_admin_leader" on public.audit_logs;
create policy "audit_logs_select_admin_leader" on public.audit_logs
for select to authenticated using (private.can_manage_platform());
drop policy if exists "audit_logs_insert_authenticated" on public.audit_logs;
create policy "audit_logs_insert_authenticated" on public.audit_logs
for insert to authenticated with check (true);

drop policy if exists "guides_select_authenticated" on public.guides;
create policy "guides_select_authenticated" on public.guides
for select to authenticated using (true);
drop policy if exists "guides_manage_admin" on public.guides;
create policy "guides_manage_admin" on public.guides
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists "raci_select_authenticated" on public.raci_matrix;
create policy "raci_select_authenticated" on public.raci_matrix
for select to authenticated using (true);
drop policy if exists "raci_manage_admin" on public.raci_matrix;
create policy "raci_manage_admin" on public.raci_matrix
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

-- View mengikuti RLS tabel dasar lewat security_invoker.
alter view public.project_progress set (security_invoker = true);
alter view public.community_sla_summary set (security_invoker = true);
alter view public.inquiry_routing_sla_summary set (security_invoker = true);
alter view public.asset_license_status set (security_invoker = true);

-- Realtime untuk notifikasi dan board/task utama.
do $$
begin
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
    and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
do $$
begin
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
    and tablename = 'tasks') then
    alter publication supabase_realtime add table public.tasks;
  end if;
end
$$;
do $$
begin
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
    and tablename = 'comments') then
    alter publication supabase_realtime add table public.comments;
  end if;
end
$$;

-- Storage privat untuk lampiran portal.
create policy "portal_attachments_read_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'portal-attachments');

create policy "portal_attachments_insert_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'portal-attachments');

create policy "portal_attachments_delete_owner_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portal-attachments'
  and (
    owner = (select auth.uid())
    or private.is_super_admin()
  )
);
