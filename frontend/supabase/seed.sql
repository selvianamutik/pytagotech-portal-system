-- Seed referensi awal untuk backend Supabase lokal.
-- Data dummy bisnis dipisah dari seed produksi.

insert into roles (name) values
  ('Super Admin'),
  ('Executive / Leader'),
  ('Sales / Marketing'),
  ('Project Manager'),
  ('Developer'),
  ('Social Media Specialist'),
  ('Graphic Designer / Video Editor / Copywriter')
on conflict (name) do nothing;

insert into master_options (category, value, is_active) values
  ('lead_status', 'New', true),
  ('lead_status', 'Contacted', true),
  ('lead_status', 'Follow Up', true),
  ('lead_status', 'Interest', true),
  ('lead_status', 'Not Interested', true),
  ('lead_status', 'Lost', true),
  ('lead_status', 'Closing', true),
  ('industry', 'Teknologi', true),
  ('industry', 'Pendidikan', true),
  ('industry', 'Kesehatan', true),
  ('industry', 'F&B', true),
  ('industry', 'Retail', true),
  ('industry', 'Properti', true),
  ('industry', 'Manufaktur', true),
  ('industry', 'Jasa Profesional', true),
  ('industry', 'Komunitas', true),
  ('industry', 'Lainnya', true),
  ('interest_stage', 'New Interest', true),
  ('interest_stage', 'Contacted', true),
  ('interest_stage', 'Demo', true),
  ('interest_stage', 'Price Sent', true),
  ('interest_stage', 'Negotiation', true),
  ('interest_stage', 'Closing', true),
  ('interest_stage', 'Lost', true),
  ('brand', 'Pytagotech', true),
  ('brand', 'Pytabelajar', true),
  ('brand', 'Pytafix', true),
  ('platform', 'Instagram', true),
  ('platform', 'TikTok', true),
  ('platform', 'Threads', true),
  ('platform', 'Facebook', true),
  ('platform', 'YouTube Shorts', true),
  ('pillar', 'Edukasi', true),
  ('pillar', 'Portofolio', true),
  ('pillar', 'Promo', true),
  ('pillar', 'Behind The Scene', true),
  ('feature_category', 'Frontend', true),
  ('feature_category', 'Backend', true),
  ('feature_category', 'Integrasi', true),
  ('feature_category', 'UI/UX', true),
  ('feature_category', 'QA', true),
  ('priority', 'High', true),
  ('priority', 'Medium', true),
  ('priority', 'Low', true)
on conflict (category, value) do update set is_active = excluded.is_active;

insert into settings (key, value) values
  ('sla.response_minutes', '30'::jsonb),
  ('sla.routing_minutes', '15'::jsonb),
  ('release.critical_hours', '24'::jsonb),
  ('attachment.max_bytes', '10485760'::jsonb),
  ('brief.min_score', '5'::jsonb),
  ('service_hours', '{"timezone":"Asia/Jakarta","days":[1,2,3,4,5],"start":"09:00","end":"18:00"}'::jsonb),
  ('wa.numbers', '{"Pytagotech":"","Pytabelajar":"","Pytafix":""}'::jsonb),
  ('kpi.targets', '{"Pytagotech":{},"Pytabelajar":{},"Pytafix":{}}'::jsonb)
on conflict (key) do update set value = excluded.value;

insert into task_templates (name, ord, duration_days, is_active) values
  ('Kickoff dan klarifikasi scope', 1, 1, true),
  ('Perencanaan teknis', 2, 2, true),
  ('Implementasi fitur inti', 3, 5, true),
  ('QA internal', 4, 2, true),
  ('Handover dan dokumentasi', 5, 1, true)
on conflict (name) do update
set ord = excluded.ord,
    duration_days = excluded.duration_days,
    is_active = excluded.is_active;

insert into holidays (day, name) values
  ('2026-12-25', 'Hari libur nasional')
on conflict (day) do update set name = excluded.name;

insert into guides (slug, title, content_md) values
  ('deal-handover', 'Panduan Deal Handover', '# Panduan Deal Handover' || chr(10) || chr(10) || '- Isi scope, fitur, nilai deal, termin, dan deadline sebelum submit.'),
  ('content-quality-gate', 'Panduan Quality Gate Konten', '# Panduan Quality Gate Konten' || chr(10) || chr(10) || '- Pastikan visual, audio, cover, CTA, dan proofread lengkap sebelum jadwal rilis.')
on conflict (slug) do update
set title = excluded.title,
    content_md = excluded.content_md;

insert into raci_matrix (activity, role, value) values
  ('Deal Handover', 'Sales / Marketing', 'R'),
  ('Deal Handover', 'Project Manager', 'A'),
  ('Produksi Konten', 'Social Media Specialist', 'A'),
  ('Produksi Konten', 'Graphic Designer / Video Editor / Copywriter', 'R'),
  ('Approval Konten', 'Executive / Leader', 'A')
on conflict (activity, role) do update set value = excluded.value;

insert into team_members (name, status) values
  ('Nabila', 'internal'),
  ('Raka', 'internal'),
  ('Dimas Freelance', 'external'),
  ('Ayu Magang', 'external')
on conflict (name) do update set status = excluded.status;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
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
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
