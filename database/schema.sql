-- =====================================================================
-- schema.sql — DRAF DDL referensi (BUKAN migration resmi).
-- Status mengikuti docs/DATABASE.md (saat ini DRAFT, revisi 2).
-- Aturan: dilarang menulis migration/backend sebelum Gate 2 (APPROVED).
-- RLS policies + seed menyusul di Fase 3 (US-003).
-- Konvensi: PK UUID, display_id via trigger, UTC, validasi master via
-- kolom generated + FK komposit ke master_options.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------- Fungsi utilitas ----------

-- updated_at otomatis.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Display ID berpola: prefix + sequence per tabel, padding LAR minimum
-- (tumbuh tanpa batas atas: LPAD hanya menjamin lebar minimum).
-- MAT-xxxx dan PUB-xxxx memakai lebar 4 sesuai PRD; lainnya 3.
CREATE OR REPLACE FUNCTION set_display_id()
RETURNS trigger AS $$
DECLARE
  seq_name text := TG_ARGV[0];
  prefix text := TG_ARGV[1];
  min_width integer := TG_ARGV[2]::integer;
BEGIN
  IF NEW.display_id IS NULL OR NEW.display_id = '' THEN
    NEW.display_id := prefix || LPAD(nextval(seq_name)::text, min_width, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS seq_lead_no;
CREATE SEQUENCE IF NOT EXISTS seq_client_no;
CREATE SEQUENCE IF NOT EXISTS seq_deal_no;
CREATE SEQUENCE IF NOT EXISTS seq_cr_no;
CREATE SEQUENCE IF NOT EXISTS seq_project_no;
CREATE SEQUENCE IF NOT EXISTS seq_task_no;
CREATE SEQUENCE IF NOT EXISTS seq_feature_no;
CREATE SEQUENCE IF NOT EXISTS seq_idea_no;
CREATE SEQUENCE IF NOT EXISTS seq_material_no;
CREATE SEQUENCE IF NOT EXISTS seq_pub_no;
CREATE SEQUENCE IF NOT EXISTS seq_inquiry_no;
CREATE SEQUENCE IF NOT EXISTS seq_asset_no;
CREATE SEQUENCE IF NOT EXISTS seq_evaluation_no;

-- ---------- Auth, user & tim ----------

CREATE TABLE roles (
  name text PRIMARY KEY
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email citext NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
  user_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE ON UPDATE CASCADE,
  role_name text NOT NULL REFERENCES roles (name) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (user_id, role_name)
);

CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES profiles (id) ON DELETE SET NULL ON UPDATE CASCADE,
  name text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('internal', 'external')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE master_options (
  category text NOT NULL,
  value text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (category, value)
);

-- ---------- CRM ----------

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  contact_date date NOT NULL,
  company_name text NOT NULL,
  industry text NOT NULL,
  industry_category text GENERATED ALWAYS AS ('industry') STORED,
  whatsapp text NOT NULL,
  instagram text,
  email text NOT NULL,
  pic_id uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  status text NOT NULL DEFAULT 'New',
  status_category text GENERATED ALWAYS AS ('lead_status') STORED,
  next_follow_up date,
  source text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (industry_category, industry) REFERENCES master_options (category, value),
  FOREIGN KEY (status_category, status) REFERENCES master_options (category, value)
);
CREATE INDEX leads_status_idx ON leads (status);
CREATE INDEX leads_company_trgm_idx ON leads USING gin (company_name gin_trgm_ops);
CREATE INDEX leads_pic_idx ON leads (pic_id);
CREATE INDEX leads_industry_idx ON leads (industry);
CREATE INDEX leads_contact_date_idx ON leads (contact_date);
CREATE INDEX leads_whatsapp_idx ON leads (whatsapp);
CREATE INDEX leads_next_follow_up_idx ON leads (next_follow_up);

CREATE TABLE lead_interests (
  lead_id uuid PRIMARY KEY REFERENCES leads (id) ON DELETE CASCADE ON UPDATE CASCADE,
  stage text NOT NULL DEFAULT 'New Interest',
  stage_category text GENERATED ALWAYS AS ('interest_stage') STORED,
  need text,
  FOREIGN KEY (stage_category, stage) REFERENCES master_options (category, value)
);

CREATE TABLE lead_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads (id) ON DELETE CASCADE ON UPDATE CASCADE,
  status text NOT NULL,
  status_category text GENERATED ALWAYS AS ('lead_status') STORED,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (status_category, status) REFERENCES master_options (category, value)
);
CREATE INDEX lead_status_history_lead_idx ON lead_status_history (lead_id, changed_at);

CREATE TABLE lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads (id) ON DELETE CASCADE ON UPDATE CASCADE,
  author_id uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  body varchar(2000) NOT NULL CHECK (char_length(body) <= 2000 AND char_length(body) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_activities_lead_idx ON lead_activities (lead_id);

-- ---------- Klien & handover ----------

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  company_name text NOT NULL,
  pic_name text,
  phone text NOT NULL,
  email text NOT NULL,
  referrer text,
  source_lead_id uuid REFERENCES leads (id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clients_company_idx ON clients USING gin (company_name gin_trgm_ops);

CREATE TABLE deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  title text NOT NULL CHECK (char_length(title) > 0),
  code text NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES clients (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  scope text NOT NULL,
  objective text NOT NULL,
  value_idr bigint NOT NULL CHECK (value_idr > 0),
  term_scheme text NOT NULL,
  deadline date NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Menunggu Konfirmasi Produksi', 'Dikonfirmasi', 'Perlu Revisi')),
  created_by uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  confirmed_by uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Pasangan (id, client_id) untuk FK komposit projects(handover_id, client_id):
  -- menjamin klien proyek SELALU sama dengan klien handover-nya.
  UNIQUE (id, client_id)
);
CREATE INDEX deals_status_idx ON deals (status);
CREATE INDEX deals_client_idx ON deals (client_id);
CREATE INDEX deals_created_by_idx ON deals (created_by);
CREATE INDEX deals_confirmed_by_idx ON deals (confirmed_by);

CREATE TABLE deal_features (
  deal_id uuid NOT NULL REFERENCES deals (id) ON DELETE CASCADE ON UPDATE CASCADE,
  name text NOT NULL,
  description text NOT NULL CHECK (char_length(description) > 0),
  PRIMARY KEY (deal_id, name)
);

CREATE TABLE deal_payment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals (id) ON DELETE CASCADE ON UPDATE CASCADE,
  name text NOT NULL CHECK (char_length(name) > 0),
  kind text NOT NULL CHECK (kind IN ('percent', 'amount')),
  value numeric NOT NULL CHECK (value > 0),
  due_date date,
  milestone text,
  status text NOT NULL DEFAULT 'Belum Ditagih'
    CHECK (status IN ('Belum Ditagih', 'Ditagih', 'Lunas')),
  CONSTRAINT term_tempo CHECK (due_date IS NOT NULL OR (milestone IS NOT NULL AND char_length(milestone) > 0)),
  CONSTRAINT term_percent_max CHECK (kind <> 'percent' OR value <= 100)
);
CREATE INDEX deal_payment_terms_deal_idx ON deal_payment_terms (deal_id);

CREATE TABLE deal_versions (
  deal_id uuid NOT NULL REFERENCES deals (id) ON DELETE CASCADE ON UPDATE CASCADE,
  version integer NOT NULL CHECK (version >= 1),
  value_idr bigint NOT NULL CHECK (value_idr > 0),
  deadline date NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (deal_id, version)
);

CREATE TABLE change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  deal_id uuid NOT NULL REFERENCES deals (id) ON DELETE CASCADE ON UPDATE CASCADE,
  kind text NOT NULL
    CHECK (kind IN ('negosiasi', 'penambahan fitur', 'percepatan waktu', 'penyesuaian harga')),
  description text NOT NULL CHECK (char_length(description) > 0),
  value_impact bigint CHECK (value_impact IS NULL OR value_impact <> 0),
  deadline_impact date,
  status text NOT NULL DEFAULT 'Diajukan'
    CHECK (status IN ('Diajukan', 'Disetujui', 'Ditolak')),
  created_by uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  CONSTRAINT cr_min_impact CHECK (value_impact IS NOT NULL OR deadline_impact IS NOT NULL)
);
CREATE INDEX change_requests_deal_idx ON change_requests (deal_id);

-- ---------- Proyek & task ----------

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES clients (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  pm_id uuid NOT NULL REFERENCES team_members (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  start_date date NOT NULL,
  target_date date NOT NULL,
  value_idr bigint NOT NULL CHECK (value_idr > 0),
  status text NOT NULL DEFAULT 'Planning'
    CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled')),
  handover_id uuid NOT NULL UNIQUE,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_dates CHECK (start_date <= target_date),
  -- FK komposit: klien proyek DIJAMIN sama dengan klien handover-nya.
  FOREIGN KEY (handover_id, client_id) REFERENCES deals (id, client_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX projects_status_idx ON projects (status);
CREATE INDEX projects_pm_idx ON projects (pm_id);
CREATE INDEX projects_client_idx ON projects (client_id);
CREATE INDEX projects_target_idx ON projects (target_date);

CREATE TABLE task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  ord integer NOT NULL CHECK (ord >= 1),
  duration_days integer NOT NULL CHECK (duration_days >= 1),
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE,
  parent_id uuid REFERENCES tasks (id) ON DELETE CASCADE ON UPDATE CASCADE,
  title text NOT NULL CHECK (char_length(title) > 0),
  assignee_id uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  status text NOT NULL DEFAULT 'To Do'
    CHECK (status IN ('To Do', 'In Progress', 'Blocked', 'Review', 'Done')),
  start_date date,
  target_date date,
  percent integer NOT NULL DEFAULT 0 CHECK (percent BETWEEN 0 AND 100),
  notes text,
  link text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tasks_dates CHECK (start_date IS NULL OR target_date IS NULL OR start_date <= target_date)
);
CREATE INDEX tasks_project_idx ON tasks (project_id);
CREATE INDEX tasks_status_idx ON tasks (status);
CREATE INDEX tasks_parent_idx ON tasks (parent_id);
CREATE INDEX tasks_assignee_idx ON tasks (assignee_id);
CREATE INDEX tasks_title_idx ON tasks USING gin (title gin_trgm_ops);

CREATE TABLE task_dependencies (
  predecessor_id uuid NOT NULL REFERENCES tasks (id) ON DELETE CASCADE ON UPDATE CASCADE,
  successor_id uuid NOT NULL REFERENCES tasks (id) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (predecessor_id, successor_id),
  CONSTRAINT no_self_dep CHECK (predecessor_id <> successor_id)
);
CREATE INDEX task_dependencies_successor_idx ON task_dependencies (successor_id);

CREATE TABLE features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE,
  name text NOT NULL CHECK (char_length(name) > 0),
  category text NOT NULL,
  category_key text GENERATED ALWAYS AS ('feature_category') STORED,
  priority text NOT NULL DEFAULT 'Medium',
  priority_key text GENERATED ALWAYS AS ('priority') STORED,
  developer_id uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  estimate_days integer NOT NULL CHECK (estimate_days >= 1),
  source text NOT NULL CHECK (source IN ('handover', 'manual')),
  task_id uuid UNIQUE REFERENCES tasks (id) ON DELETE SET NULL ON UPDATE CASCADE,
  scheduled_start date,
  scheduled_end date,
  override_start date,
  override_end date,
  override_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (category_key, category) REFERENCES master_options (category, value),
  FOREIGN KEY (priority_key, priority) REFERENCES master_options (category, value),
  CONSTRAINT feature_override_reason CHECK (
    (override_start IS NULL AND override_end IS NULL)
    OR (override_reason IS NOT NULL AND char_length(override_reason) > 0)
  )
);
CREATE INDEX features_project_idx ON features (project_id);
CREATE INDEX features_developer_idx ON features (developer_id);

CREATE TABLE developer_capacity (
  developer_id uuid PRIMARY KEY REFERENCES team_members (id) ON DELETE CASCADE ON UPDATE CASCADE,
  hours_per_day integer NOT NULL DEFAULT 8 CHECK (hours_per_day BETWEEN 1 AND 24)
);

CREATE TABLE holidays (
  day date PRIMARY KEY,
  name text
);

-- ---------- Sosmed ----------

CREATE TABLE content_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  title text NOT NULL CHECK (char_length(title) > 0),
  brand text NOT NULL,
  brand_key text GENERATED ALWAYS AS ('brand') STORED,
  pillar text NOT NULL,
  pillar_key text GENERATED ALWAYS AS ('pillar') STORED,
  funnel text NOT NULL CHECK (funnel IN ('Awareness', 'Consideration', 'Conversion')),
  hook text,
  angle text,
  key_points text,
  cta text,
  asset_ref text,
  readiness text NOT NULL
    CHECK (readiness IN ('Siap Masuk Produksi', 'Tahan - Perlu Verifikasi', 'Disetujui', 'Ditunda')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (brand_key, brand) REFERENCES master_options (category, value),
  FOREIGN KEY (pillar_key, pillar) REFERENCES master_options (category, value)
);
CREATE INDEX content_ideas_brand_idx ON content_ideas (brand);

CREATE TABLE idea_platforms (
  idea_id uuid NOT NULL REFERENCES content_ideas (id) ON DELETE CASCADE ON UPDATE CASCADE,
  platform text NOT NULL,
  platform_key text GENERATED ALWAYS AS ('platform') STORED,
  PRIMARY KEY (idea_id, platform),
  FOREIGN KEY (platform_key, platform) REFERENCES master_options (category, value)
);

CREATE TABLE content_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  title text NOT NULL CHECK (char_length(title) > 0),
  brand text NOT NULL,
  brand_key text GENERATED ALWAYS AS ('brand') STORED,
  status text NOT NULL DEFAULT 'Draf'
    CHECK (status IN ('Draf', 'Ditolak', 'Disetujui', 'Dijadwalkan', 'Rilis')),
  schedule_date date,
  release_time text CHECK (release_time IS NULL OR release_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  draft_link text,
  copywriter_id uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  designer_id uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  video_editor_id uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  idea_id uuid REFERENCES content_ideas (id) ON DELETE SET NULL ON UPDATE CASCADE,
  gate_visual boolean NOT NULL DEFAULT false,
  gate_audio boolean NOT NULL DEFAULT false,
  gate_cover boolean NOT NULL DEFAULT false,
  gate_cta boolean NOT NULL DEFAULT false,
  gate_proofread boolean NOT NULL DEFAULT false,
  gate_override_by uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  gate_override_reason text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (brand_key, brand) REFERENCES master_options (category, value),
  CONSTRAINT gate_override_pair CHECK (
    (gate_override_by IS NULL) = (gate_override_reason IS NULL)
  )
);
CREATE INDEX content_materials_idea_idx ON content_materials (idea_id);
CREATE INDEX content_materials_brand_idx ON content_materials (brand);
CREATE INDEX content_materials_status_idx ON content_materials (status);
CREATE INDEX content_materials_copywriter_idx ON content_materials (copywriter_id);
CREATE INDEX content_materials_designer_idx ON content_materials (designer_id);
CREATE INDEX content_materials_video_editor_idx ON content_materials (video_editor_id);

CREATE TABLE material_platforms (
  material_id uuid NOT NULL REFERENCES content_materials (id) ON DELETE CASCADE ON UPDATE CASCADE,
  platform text NOT NULL,
  platform_key text GENERATED ALWAYS AS ('platform') STORED,
  PRIMARY KEY (material_id, platform),
  FOREIGN KEY (platform_key, platform) REFERENCES master_options (category, value)
);
CREATE INDEX material_platforms_material_idx ON material_platforms (material_id);

CREATE TABLE content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES content_materials (id) ON DELETE CASCADE ON UPDATE CASCADE,
  version integer NOT NULL CHECK (version >= 0),
  reviewer text NOT NULL CHECK (char_length(reviewer) > 0),
  decision text NOT NULL
    CHECK (decision IN ('Disetujui Tanpa Revisi', 'Disetujui dengan Revisi Minor', 'Ditolak')),
  feedback text,
  evidence_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (material_id, version),
  CONSTRAINT revision_feedback CHECK (decision <> 'Ditolak' OR (feedback IS NOT NULL AND char_length(feedback) > 0))
);

CREATE TABLE publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  material_id uuid NOT NULL REFERENCES content_materials (id) ON DELETE CASCADE ON UPDATE CASCADE,
  platform text NOT NULL,
  platform_key text GENERATED ALWAYS AS ('platform') STORED,
  pattern text NOT NULL CHECK (pattern IN ('Single', 'Crosspost')),
  schedule_date date,
  release_date date,
  live_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (platform_key, platform) REFERENCES master_options (category, value),
  UNIQUE (material_id, platform)
);
CREATE INDEX publications_material_idx ON publications (material_id);
CREATE INDEX publications_schedule_idx ON publications (schedule_date);

CREATE TABLE post_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES publications (id) ON DELETE CASCADE ON UPDATE CASCADE,
  views_impressions bigint NOT NULL DEFAULT 0 CHECK (views_impressions >= 0),
  reach bigint NOT NULL DEFAULT 0 CHECK (reach >= 0),
  likes bigint NOT NULL DEFAULT 0 CHECK (likes >= 0),
  comments bigint NOT NULL DEFAULT 0 CHECK (comments >= 0),
  shares bigint NOT NULL DEFAULT 0 CHECK (shares >= 0),
  saves bigint NOT NULL DEFAULT 0 CHECK (saves >= 0),
  snapshot text NOT NULL DEFAULT 'Monitoring' CHECK (snapshot IN ('Monitoring', 'Final')),
  recorded_by uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Dedup KPI Final: hanya satu Final per publikasi (Monitoring boleh banyak).
CREATE UNIQUE INDEX post_metrics_final_uniq
  ON post_metrics (publication_id) WHERE snapshot = 'Final';
CREATE INDEX post_metrics_publication_idx ON post_metrics (publication_id);

CREATE TABLE account_growth (
  platform text NOT NULL,
  platform_key text GENERATED ALWAYS AS ('platform') STORED,
  brand text NOT NULL,
  brand_key text GENERATED ALWAYS AS ('brand') STORED,
  month text NOT NULL CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  followers_start bigint NOT NULL CHECK (followers_start >= 0),
  followers_gained bigint NOT NULL CHECK (followers_gained >= 0),
  unfollows bigint NOT NULL CHECK (unfollows >= 0),
  account_reach bigint NOT NULL CHECK (account_reach >= 0),
  profile_visits bigint NOT NULL CHECK (profile_visits >= 0),
  PRIMARY KEY (platform, brand, month),
  FOREIGN KEY (platform_key, platform) REFERENCES master_options (category, value),
  FOREIGN KEY (brand_key, brand) REFERENCES master_options (category, value)
);

CREATE TABLE community_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('komentar', 'DM')),
  platform text NOT NULL,
  platform_key text GENERATED ALWAYS AS ('platform') STORED,
  brand text NOT NULL,
  brand_key text GENERATED ALWAYS AS ('brand') STORED,
  type text NOT NULL
    CHECK (type IN ('Konsultasi Teknis', 'Pertanyaan Layanan', 'Komplain', 'Spam')),
  received_at timestamptz NOT NULL,
  replied_at timestamptz,
  handler_id uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (platform_key, platform) REFERENCES master_options (category, value),
  FOREIGN KEY (brand_key, brand) REFERENCES master_options (category, value),
  CONSTRAINT replied_after_received CHECK (replied_at IS NULL OR replied_at >= received_at)
);
CREATE INDEX community_received_idx ON community_interactions (received_at);
CREATE INDEX community_handler_idx ON community_interactions (handler_id);

CREATE TABLE inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  platform text NOT NULL,
  platform_key text GENERATED ALWAYS AS ('platform') STORED,
  brand text NOT NULL,
  brand_key text GENERATED ALWAYS AS ('brand') STORED,
  received_at timestamptz NOT NULL,
  routed_at timestamptz,
  status text NOT NULL DEFAULT 'Diproses'
    CHECK (status IN ('Diproses', 'Handover Selesai', 'Dialihkan')),
  lead_id uuid UNIQUE REFERENCES leads (id) ON DELETE SET NULL ON UPDATE CASCADE,
  handler_id uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (platform_key, platform) REFERENCES master_options (category, value),
  FOREIGN KEY (brand_key, brand) REFERENCES master_options (category, value),
  CONSTRAINT routed_after_received CHECK (routed_at IS NULL OR routed_at >= received_at)
);
CREATE INDEX inquiries_status_idx ON inquiries (status);
CREATE INDEX inquiries_handler_idx ON inquiries (handler_id);

CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  name text NOT NULL CHECK (char_length(name) > 0),
  file_type text NOT NULL CHECK (char_length(file_type) > 0),
  cloud_link text,
  owner text NOT NULL CHECK (owner IN ('internal', 'klien', 'partner')),
  license_type text NOT NULL,
  license_expiry date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assets_expiry_idx ON assets (license_expiry);

CREATE TABLE material_assets (
  material_id uuid NOT NULL REFERENCES content_materials (id) ON DELETE CASCADE ON UPDATE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets (id) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (material_id, asset_id)
);
CREATE INDEX material_assets_asset_idx ON material_assets (asset_id);

CREATE TABLE strategy_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('Keep', 'Improve', 'Stop', 'Test')),
  pillar text NOT NULL,
  pillar_key text GENERATED ALWAYS AS ('pillar') STORED,
  format text,
  brand text NOT NULL,
  brand_key text GENERATED ALWAYS AS ('brand') STORED,
  period text NOT NULL CHECK (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  summary text NOT NULL CHECK (char_length(summary) > 0),
  evidence text,
  hypothesis text,
  action_plan text,
  success_target text,
  business_impact text,
  result text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (brand_key, brand) REFERENCES master_options (category, value),
  FOREIGN KEY (pillar_key, pillar) REFERENCES master_options (category, value),
  CONSTRAINT test_hypothesis CHECK (category <> 'Test' OR (hypothesis IS NOT NULL AND char_length(hypothesis) > 0))
);

-- ---------- Lintas modul ----------

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('lead', 'task', 'fitur', 'konten', 'deal')),
  -- entity_id = UUID entitas tujuan (lead→leads, task→tasks, fitur→features,
  -- konten→content_materials, deal→deals); tanpa FK karena polimorfik.
  entity_id uuid NOT NULL,
  author_id uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  body varchar(2000) NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_entity_idx ON comments (entity_type, entity_id);
CREATE INDEX comments_author_idx ON comments (author_id);

CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('lead', 'task', 'fitur', 'konten', 'deal')),
  -- Sama seperti comments: UUID entitas tujuan, tanpa FK (polimorfik).
  entity_id uuid NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0),
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES team_members (id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX attachments_entity_idx ON attachments (entity_type, entity_id);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('assignment', 'mention', 'status')),
  title text NOT NULL,
  message text NOT NULL,
  entity_type text,
  entity_id text,
  actor_name text,
  recipient_id uuid REFERENCES profiles (id) ON DELETE CASCADE ON UPDATE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_recipient_idx ON notifications (recipient_id, is_read);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles (id) ON DELETE SET NULL ON UPDATE CASCADE,
  actor_name text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
CREATE INDEX audit_logs_created_idx ON audit_logs (created_at);
-- Append-only ditegakkan di Fase 3: REVOKE UPDATE, DELETE ON audit_logs FROM authenticated.
-- jsonb (bukan text) agar trigger audit generik mudah ditulis dan bisa di-query
-- (mis. new_value->>'status').

CREATE TABLE settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

CREATE TABLE guides (
  slug text PRIMARY KEY,
  title text NOT NULL,
  content_md text NOT NULL CHECK (char_length(content_md) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE raci_matrix (
  activity text NOT NULL,
  role text NOT NULL,
  value text NOT NULL DEFAULT '' CHECK (value IN ('R', 'A', 'C', 'I', '')),
  PRIMARY KEY (activity, role)
);

-- ---------- Trigger display_id ----------

CREATE TRIGGER trg_leads_display BEFORE INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_lead_no', 'LEAD-', '3');
CREATE TRIGGER trg_clients_display BEFORE INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_client_no', 'KLI-', '3');
CREATE TRIGGER trg_deals_display BEFORE INSERT ON deals
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_deal_no', 'HDV-', '3');
CREATE TRIGGER trg_cr_display BEFORE INSERT ON change_requests
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_cr_no', 'CR-', '3');
CREATE TRIGGER trg_projects_display BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_project_no', 'PRJ-', '3');
CREATE TRIGGER trg_tasks_display BEFORE INSERT ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_task_no', 'TSK-', '3');
CREATE TRIGGER trg_features_display BEFORE INSERT ON features
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_feature_no', 'FIT-', '3');
CREATE TRIGGER trg_ideas_display BEFORE INSERT ON content_ideas
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_idea_no', 'IDE-', '3');
CREATE TRIGGER trg_materials_display BEFORE INSERT ON content_materials
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_material_no', 'MAT-', '4');
CREATE TRIGGER trg_pubs_display BEFORE INSERT ON publications
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_pub_no', 'PUB-', '4');
CREATE TRIGGER trg_inquiries_display BEFORE INSERT ON inquiries
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_inquiry_no', 'INQ-', '3');
CREATE TRIGGER trg_assets_display BEFORE INSERT ON assets
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_asset_no', 'AST-', '3');
CREATE TRIGGER trg_evaluations_display BEFORE INSERT ON strategy_evaluations
  FOR EACH ROW EXECUTE FUNCTION set_display_id('seq_evaluation_no', 'EVL-', '3');

-- ---------- Trigger updated_at ----------

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_team_updated BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_features_updated BEFORE UPDATE ON features
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ideas_updated BEFORE UPDATE ON content_ideas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_materials_updated BEFORE UPDATE ON content_materials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pubs_updated BEFORE UPDATE ON publications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_assets_updated BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_guides_updated BEFORE UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Row Level Security (deny-all; policies menyusul Fase 3/US-003) ----------
-- Tanpa policy, akses via anon/authenticated key DITOLAK di semua tabel.

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE raci_matrix ENABLE ROW LEVEL SECURITY;

