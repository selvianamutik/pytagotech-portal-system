-- Parity-fix backend: samakan RLS + RPC dengan kontrak frontend Fase 1.
-- Refs: US-002 (profil otomatis), US-004 (audit trigger-only), US-009/US-020
-- (manajemen role-based, bukan owner-only), US-017 (notifikasi ke Sales),
-- US-022 (hapus task), US-038/FR-28 (konversi inquiry via RPC).
--
-- Temuan audit:
-- 1. leads UPDATE owner-or-admin memblokir Sales men-assign lead milik orang
--    lain, padahal frontend (assignLeadPIC, US-009) tidak punya gate owner.
-- 2. projects FOR ALL owner-or-admin memblokir PM yang bukan lead PM,
--    padahal canManageProjects (US-020) mengizinkan SEMUA PM.
-- 3. deals/clients/change_requests FOR ALL mencakup DELETE, padahal tidak ada
--    UI hapus (tidak ada deleteDeal/deleteClient di services).
-- 4. tasks tanpa policy DELETE, padahal US-022 mendukung "hapus beserta anak".
-- 5. INSERT policy `WITH CHECK (true)` di audit_logs/lead_status_history
--    memungkinkan baris palsu; satu-satunya penulis sah adalah trigger
--    SECURITY DEFINER yang bypass RLS sehingga policy tak dibutuhkan.
-- 6. Tidak ada jalur backend untuk inquiries.lead_id: Sales/Marketing tidak
--    punya UPDATE ke inquiries, dan create_client_from_lead tidak menyentuh
--    inquiries — padahal convertInquiryToLead (US-038) wajib menautkan.
-- 7. transition_deal_status tidak mengirim notifikasi ke Sales pembuat,
--    padahal deal-workflow frontend selalu pushNotification tiap transisi.
-- 8. Tidak ada sync auth.users -> profiles (handle_new_user), sehingga user
--    yang sign-up tidak punya baris profil sampai dibuat manual.

-- ---------- 1. leads UPDATE role-based (US-009) ----------

drop policy if exists leads_update_owner_or_admin on public.leads;

create policy "leads_update_sales_roles" on public.leads
for update to authenticated using (
  private.has_any_role(array['Super Admin', 'Sales / Marketing'])
) with check (
  private.has_any_role(array['Super Admin', 'Sales / Marketing'])
);

-- ---------- 2. projects INSERT/UPDATE role-based, tanpa DELETE (US-020) ----------

drop policy if exists projects_manage_pm_admin on public.projects;

create policy "projects_insert_pm_roles" on public.projects
for insert to authenticated with check (
  private.has_any_role(array['Super Admin', 'Project Manager'])
);

create policy "projects_update_pm_roles" on public.projects
for update to authenticated using (
  private.has_any_role(array['Super Admin', 'Project Manager'])
) with check (
  private.has_any_role(array['Super Admin', 'Project Manager'])
);

-- ---------- 3. deals/clients/change_requests: buang DELETE (tanpa UI hapus) ----------

drop policy if exists deals_manage_sales_pm on public.deals;

create policy "deals_insert_sales_pm" on public.deals
for insert to authenticated with check (
  private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager'])
);

create policy "deals_update_sales_pm" on public.deals
for update to authenticated using (
  private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager'])
) with check (
  private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager'])
);

drop policy if exists clients_manage_sales_admin on public.clients;

create policy "clients_insert_sales_admin" on public.clients
for insert to authenticated with check (
  private.has_any_role(array['Super Admin', 'Sales / Marketing'])
);

create policy "clients_update_sales_admin" on public.clients
for update to authenticated using (
  private.has_any_role(array['Super Admin', 'Sales / Marketing'])
) with check (
  private.has_any_role(array['Super Admin', 'Sales / Marketing'])
);

drop policy if exists change_requests_manage_business_roles on public.change_requests;

create policy "change_requests_insert_business_roles" on public.change_requests
for insert to authenticated with check (
  private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager'])
);

create policy "change_requests_update_business_roles" on public.change_requests
for update to authenticated using (
  private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager'])
) with check (
  private.has_any_role(array['Super Admin', 'Sales / Marketing', 'Project Manager'])
);

-- ---------- 4. tasks: UPDATE role-based + DELETE PM/Admin (US-022) ----------

drop policy if exists tasks_update_owner_pm_admin on public.tasks;

create policy "tasks_update_pm_assignee" on public.tasks
for update to authenticated using (
  private.has_any_role(array['Super Admin', 'Project Manager'])
  or assignee_id = private.current_team_member_id()
  or exists (select 1 from public.projects p where p.id = tasks.project_id and p.pm_id = private.current_team_member_id())
) with check (
  private.has_any_role(array['Super Admin', 'Project Manager'])
  or assignee_id = private.current_team_member_id()
  or exists (select 1 from public.projects p where p.id = tasks.project_id and p.pm_id = private.current_team_member_id())
);

create policy "tasks_delete_pm_admin" on public.tasks
for delete to authenticated using (
  private.has_any_role(array['Super Admin', 'Project Manager'])
);

-- ---------- 5. Audit & history trigger-only (US-004) ----------

drop policy if exists audit_logs_insert_authenticated on public.audit_logs;
drop policy if exists lead_status_history_insert_authenticated on public.lead_status_history;

-- ---------- 6. Index redundan: PK (material_id, platform) sudah mencakupnya ----------

drop index if exists public.material_platforms_material_idx;

-- ---------- 7. Profil otomatis saat sign-up (US-002, FR-1) ----------
-- Role TIDAK diisi otomatis; Super Admin menetapkan via user_roles (US-002).

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
begin
  display_name := nullif(trim(coalesce(new.raw_user_meta_data->>'name', '')), '');
  if display_name is null then
    display_name := split_part(coalesce(new.email, 'pengguna'), '@', 1);
  end if;

  insert into public.profiles (id, email, name)
  values (new.id, new.email::citext, display_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
after insert on auth.users
for each row execute function private.handle_new_user();

-- ---------- 8. Konversi inquiry -> lead via RPC DEFINER (US-038, FR-28) ----------
-- Sales/Marketing tidak punya UPDATE ke inquiries, sehingga penautan
-- inquiries.lead_id + status 'Handover Selesai' dilakukan di sini.
-- Cerminan convertInquiryToLead di frontend: industri 'Lainnya',
-- sumber 'Sosmed/<platform>', tanggal kontak = tanggal terima (WIB).

create or replace function public.convert_inquiry_to_lead(
  inquiry_id uuid,
  company_name text,
  whatsapp text,
  email text,
  instagram text default null,
  pic_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inq_record public.inquiries%rowtype;
  new_lead_id uuid;
begin
  if not private.has_any_role(array['Super Admin', 'Sales / Marketing']) then
    raise exception 'Hanya Sales/Marketing atau Super Admin yang dapat mengonversi inquiry.'
      using errcode = '42501';
  end if;

  select * into inq_record
  from public.inquiries
  where id = inquiry_id
  for update;

  if not found then
    raise exception 'Inquiry tidak ditemukan.' using errcode = '22023';
  end if;

  if inq_record.lead_id is not null then
    raise exception 'Inquiry ini sudah dijadikan lead.' using errcode = '23505';
  end if;

  if nullif(trim(coalesce(company_name, '')), '') is null then
    raise exception 'Nama perusahaan wajib diisi.' using errcode = '23514';
  end if;

  if nullif(trim(coalesce(whatsapp, '')), '') is null then
    raise exception 'WhatsApp wajib diisi.' using errcode = '23514';
  end if;

  if nullif(trim(coalesce(email, '')), '') is null then
    raise exception 'Email wajib diisi.' using errcode = '23514';
  end if;

  if pic_id is not null and not exists (select 1 from public.team_members tm where tm.id = pic_id) then
    raise exception 'PIC tidak dikenal.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.master_options mo where mo.category = 'industry' and mo.value = 'Lainnya') then
    raise exception 'Master industry "Lainnya" belum di-seed.' using errcode = '22023';
  end if;

  insert into public.leads (contact_date, company_name, industry, whatsapp, instagram, email, pic_id, status, source)
  values (
    (inq_record.received_at at time zone 'Asia/Jakarta')::date,
    trim(company_name),
    'Lainnya',
    trim(whatsapp),
    nullif(trim(coalesce(instagram, '')), ''),
    trim(email),
    pic_id,
    'New',
    'Sosmed/' || inq_record.platform
  )
  returning id into new_lead_id;

  update public.inquiries
  set lead_id = new_lead_id,
      status = 'Handover Selesai'
  where id = inquiry_id;

  return new_lead_id;
end;
$$;

grant execute on function public.convert_inquiry_to_lead(uuid, text, text, text, text, uuid) to authenticated;

-- ---------- 9. Notifikasi ke Sales pembuat saat handover diputuskan (US-017, FR-4) ----------
-- Cerminan pushNotification di deal-workflow frontend.

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
  actor_label text;
  sales_profile uuid;
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

  select coalesce(p.name, p.email::text, 'Sistem') into actor_label
  from public.profiles p
  where p.id = (select auth.uid());
  actor_label := coalesce(actor_label, 'Sistem');

  select tm.profile_id into sales_profile
  from public.team_members tm
  where tm.id = current_deal.created_by;

  if sales_profile is not null then
    insert into public.notifications (type, title, message, entity_type, entity_id, actor_name, recipient_id)
    values (
      'status',
      current_deal.display_id || ' kini ' || next_status,
      actor_label || ': ' || current_deal.display_id || ' kini berstatus "' || next_status || '".',
      'deal',
      deal_id::text,
      actor_label,
      sales_profile
    );
  end if;

  return current_deal;
end;
$$;
