-- CR-006: timeline aktivitas lead untuk role CRM tanpa membuka seluruh audit_logs.
--
-- Sales/Marketing tidak memiliki policy SELECT pada `audit_logs` (hanya Super
-- Admin + Executive/Leader). RPC ini menjadi jendela baca terbatas: hanya baris
-- audit milik satu lead (`leads` + `lead_interests`) dan hanya untuk role CRM.

create or replace function public.lead_audit_trail(p_lead_id uuid)
returns table (
  actor_name text,
  action text,
  entity_type text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.actor_name,
    a.action,
    a.entity_type,
    a.old_value,
    a.new_value,
    a.created_at
  from public.audit_logs a
  where a.entity_id = p_lead_id::text
    and a.entity_type in ('leads', 'lead_interests')
    and private.has_any_role(
      array['Super Admin', 'Executive / Leader', 'Sales / Marketing']
    )
  order by a.created_at asc;
$$;

comment on function public.lead_audit_trail(uuid) is
  'Timeline audit satu lead untuk role CRM (CR-006).';

revoke all on function public.lead_audit_trail(uuid) from public;
grant execute on function public.lead_audit_trail(uuid) to authenticated;
