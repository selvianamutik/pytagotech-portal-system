-- US-044 / Gate 4: fitur "Reset Data Demo" khusus Super Admin.
-- Mengembalikan data operasional ke snapshot UAT saat ini (fiktif minimal,
-- Q-027 jawaban A). Data master tidak disentuh: auth.users, profiles,
-- user_roles, team_members, master_options, settings, holidays, audit_logs,
-- notifications, assets, task_templates.

-- `display_id` eksplisit tetap disimpan berkat trigger `set_display_id` yang
-- hanya mengisi saat NULL/empty, sehingga urutan tidak perlu di-reset.

create or replace function public.reset_demo_data()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead_012 uuid := '10e7edea-628b-4e29-a231-18d5dd826269';
  v_lead_013 uuid := '3ff9ba40-cde2-4949-96a4-790097caba87';
  v_client    uuid := 'd15eec32-d359-42b9-880d-1080ca114e26';
  v_deal      uuid := 'fa54f80a-7811-4b0c-b0d1-cb0e21293323';
  v_project   uuid := '25f33eb7-59c2-499f-b743-ba616410632a';
  v_task_rad  uuid := 'b9a2cde4-f9a8-4994-8583-0fbb1749d82d';
  v_task_pus  uuid := 'd81bad76-e0c2-45f4-87b4-79383bd1efb5';
  v_task_sad  uuid := '2ff0b8f6-3e64-4e56-b65a-754a2feb9461';
  v_pic       uuid := '30815fff-f1b9-4dc0-ac90-7f96ae54f6a5';
  v_pm        uuid := '3c4951a5-159e-4975-b921-4e80051f9643';
  v_idea_001  uuid := 'aa81a88c-a2dc-49ce-9ee8-ecb4a87ef3e8';
  v_idea_002  uuid := '02379c27-ae14-4a2d-8218-726695b9adc8';
  v_material  uuid := '1822ce5e-a584-4956-8401-84705f093f3d';
  v_pub       uuid := '2ba2e650-3987-491e-914a-4f54cd665a75';
begin
  if not private.has_any_role(array['Super Admin']) then
    raise exception 'Hanya Super Admin yang dapat mereset data demo.' using errcode = '42501';
  end if;

  -- Kosongkan seluruh data operasional (CASCADE menarik semua tabel anak
  -- yang ber-FK ke tabel-tabel ini; tabel master/identitas tidak menjadi anak
  -- dari tabel operasional mana pun sehingga aman).
  truncate table
    public.leads,
    public.lead_interests,
    public.lead_activities,
    public.lead_status_history,
    public.inquiries,
    public.clients,
    public.deals,
    public.deal_features,
    public.deal_payment_terms,
    public.deal_versions,
    public.change_requests,
    public.projects,
    public.tasks,
    public.task_dependencies,
    public.features,
    public.content_ideas,
    public.idea_platforms,
    public.content_materials,
    public.material_assets,
    public.material_platforms,
    public.content_revisions,
    public.publications,
    public.post_metrics
  cascade;

  -- Lead. Disisipkan dengan status "New" lalu di-update ke status final agar
  -- trigger `sync_lead_status_side_effects` mengisi lead_status_history dan
  -- (untuk status Interest) lead_interests, persis seperti alur produksi.
  insert into public.leads
    (id, display_id, contact_date, company_name, industry, whatsapp, instagram, email, pic_id, status, next_follow_up)
  values
    (v_lead_012, 'LEAD-012', '2026-11-01', 'test', 'F&B', '6281234567890', '@arunadigital2', 'sales@arunadigital.id', v_pic, 'New', '2026-11-05'),
    (v_lead_013, 'LEAD-013', '2026-11-01', 'test', 'F&B', '628965457232', null, 'test@test.com', v_pic, 'New', null);

  update public.leads set status = 'Follow Up' where id = v_lead_012;
  update public.leads set status = 'Interest' where id = v_lead_013;

  -- Samakan stage interest dgn snapshot UAT.
  update public.lead_interests set stage = 'Contacted', need = '' where lead_id = v_lead_013;

  -- Klien.
  insert into public.clients
    (id, display_id, company_name, pic_name, phone, email, referrer, source_lead_id)
  values
    (v_client, 'KLI-011', 'pak abi', 'pak abi', '628975452457', 'kwidiyansa@gmail.com', 'web', null);

  -- Deal (handover terkonfirmasi).
  insert into public.deals
    (id, display_id, title, code, client_id, scope, objective, value_idr, term_scheme, deadline, notes, status)
  values
    (v_deal, 'HDV-011', 'teduh', 'pyt-001', v_client, 'vc, login, report, export report', 'aplikasi', 8000000, '20-50-30', '2026-11-19', '', 'Dikonfirmasi');

  insert into public.deal_payment_terms (deal_id, name, kind, value, due_date, milestone, status)
  values
    (v_deal, 'dp', 'percent', 20, '2026-11-02', null, 'Belum Ditagih'),
    (v_deal, 'termin 3', 'percent', 30, '2026-11-30', null, 'Belum Ditagih'),
    (v_deal, 'termin 2', 'percent', 50, null, '70% aplikasi jadi', 'Belum Ditagih');

  insert into public.deal_versions (deal_id, version, value_idr, deadline, note)
  values (v_deal, 1, 8000000, '2026-11-19', 'Versi awal saat handover dibuat.');

  -- Proyek + task (template RAD/PUS/SAD).
  insert into public.projects
    (id, display_id, name, code, client_id, pm_id, start_date, target_date, value_idr, status, handover_id)
  values
    (v_project, 'PRJ-010', 'teduh - pak abi (pyt-001)', 'pyt-001', v_client, v_pm, '2026-11-09', '2026-11-19', 8000000, 'Planning', v_deal);

  insert into public.tasks
    (id, display_id, project_id, parent_id, title, assignee_id, status, start_date, target_date, percent, notes, link, is_active)
  values
    (v_task_rad, 'TSK-001', v_project, null, 'Pembuatan dokumen RAD', null, 'To Do', '2026-11-09', '2026-11-11', 0, null, null, true),
    (v_task_pus, 'TSK-002', v_project, null, 'Pembuatan dokumen PUS', null, 'To Do', '2026-11-12', '2026-11-16', 0, null, null, true),
    (v_task_sad, 'TSK-003', v_project, null, 'Pembuatan dokumen SAD', null, 'To Do', '2026-11-17', '2026-11-19', 0, null, null, true);

  -- Konten.
  insert into public.content_ideas
    (id, display_id, title, brand, pillar, funnel, hook, angle, key_points, cta, asset_ref, readiness)
  values
    (v_idea_001, 'IDE-001', 'Edukasi: 5 Tips Coding untuk UMKM', 'Pytagotech', 'Edukasi', 'Awareness', '5 tips coding praktis', 'Sudut pandang praktis untuk pemula', '3 poin kunci yang gampang dipahami', 'Kunjungi web kami', 'asset/ide1.png', 'Siap Masuk Produksi'),
    (v_idea_002, 'IDE-002', 'Promo: Diskon Jasa Landing Page', 'Pytagotech', 'Promo', 'Conversion', null, null, null, null, null, 'Ditunda');

  insert into public.content_materials
    (id, display_id, title, brand, status, schedule_date, idea_id)
  values
    (v_material, 'MAT-0002', 'Materi edukasi tips coding', 'Pytagotech', 'Draf', '2026-11-20', v_idea_001);

  insert into public.publications
    (id, display_id, material_id, platform, pattern, schedule_date)
  values
    (v_pub, 'PUB-0001', v_material, 'Instagram', 'Single', '2026-11-20');

  return 'Data demo berhasil dikembalikan ke snapshot UAT.';
end;
$$;