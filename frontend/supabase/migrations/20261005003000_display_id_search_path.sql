-- Display ID trigger: skualifikasi nama sequence (US-007+).
--
-- `set_display_id()` memanggil `nextval(nama_sequence)` dengan nama TAK
-- diskualifikasi, yang di-resolve lewat search_path pemanggil. Bila INSERT
-- terjadi di dalam fungsi SECURITY DEFINER bersearch_path kosong
-- (mis. `convert_inquiry_to_lead`, `create_client_from_lead`,
-- `create_project_from_handover`), lookup gagal:
-- `relation "seq_xxx_no" does not exist`.
-- Argumen trigger kini `public.seq_xxx_no` sehingga resolve di search_path
-- apa pun. Fungsi `set_display_id()` sendiri tidak berubah.
--
-- Refs: FR-6, FR-9, FR-11, FR-15, FR-21, FR-23, FR-28, US-007, US-014,
--   US-015, US-018, US-019, US-021, US-023, US-027, US-028, US-031,
--   US-033, US-034, US-038, US-040

drop trigger if exists trg_leads_display on public.leads;
create trigger trg_leads_display before insert on public.leads
  for each row execute function set_display_id('public.seq_lead_no', 'LEAD-', '3');

drop trigger if exists trg_clients_display on public.clients;
create trigger trg_clients_display before insert on public.clients
  for each row execute function set_display_id('public.seq_client_no', 'KLI-', '3');

drop trigger if exists trg_deals_display on public.deals;
create trigger trg_deals_display before insert on public.deals
  for each row execute function set_display_id('public.seq_deal_no', 'HDV-', '3');

drop trigger if exists trg_cr_display on public.change_requests;
create trigger trg_cr_display before insert on public.change_requests
  for each row execute function set_display_id('public.seq_cr_no', 'CR-', '3');

drop trigger if exists trg_projects_display on public.projects;
create trigger trg_projects_display before insert on public.projects
  for each row execute function set_display_id('public.seq_project_no', 'PRJ-', '3');

drop trigger if exists trg_tasks_display on public.tasks;
create trigger trg_tasks_display before insert on public.tasks
  for each row execute function set_display_id('public.seq_task_no', 'TSK-', '3');

drop trigger if exists trg_features_display on public.features;
create trigger trg_features_display before insert on public.features
  for each row execute function set_display_id('public.seq_feature_no', 'FIT-', '3');

drop trigger if exists trg_ideas_display on public.content_ideas;
create trigger trg_ideas_display before insert on public.content_ideas
  for each row execute function set_display_id('public.seq_idea_no', 'IDE-', '3');

drop trigger if exists trg_materials_display on public.content_materials;
create trigger trg_materials_display before insert on public.content_materials
  for each row execute function set_display_id('public.seq_material_no', 'MAT-', '4');

drop trigger if exists trg_pubs_display on public.publications;
create trigger trg_pubs_display before insert on public.publications
  for each row execute function set_display_id('public.seq_pub_no', 'PUB-', '4');

drop trigger if exists trg_inquiries_display on public.inquiries;
create trigger trg_inquiries_display before insert on public.inquiries
  for each row execute function set_display_id('public.seq_inquiry_no', 'INQ-', '3');

drop trigger if exists trg_assets_display on public.assets;
create trigger trg_assets_display before insert on public.assets
  for each row execute function set_display_id('public.seq_asset_no', 'AST-', '3');

drop trigger if exists trg_evaluations_display on public.strategy_evaluations;
create trigger trg_evaluations_display before insert on public.strategy_evaluations
  for each row execute function set_display_id('public.seq_evaluation_no', 'EVL-', '3');
