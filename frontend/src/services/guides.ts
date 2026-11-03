import { createClient } from "@/lib/supabase/client";
import type { Guide, RaciRow, RaciValue } from "@/types/guide";
import { RACI_ROLES, RACI_VALUES } from "@/types/guide";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan panduan SOP & RACI (US-042). Panduan markdown disimpan di tabel
 * `guides` (edit khusus Super Admin via RLS `guides_manage_admin`); matriks
 * RACI di `raci_matrix` (PK komposit `activity`, `role`).
 */

type GuideRow = {
  slug: string; title: string; content_md: string; updated_at: string;
};
type RaciCell = { activity: string; role: string; value: string };

export function resetMockGuides(): void {}

function mapGuide(row: GuideRow): Guide {
  return {
    slug: row.slug,
    title: row.title,
    content: row.content_md,
    updatedAt: row.updated_at,
  };
}

export async function listGuides(): Promise<ServiceResult<Guide[]>> {
  const { data, error } = await createClient().from("guides").select("*");
  if (error) return { data: null, error: error.message };
  return { data: ((data ?? []) as GuideRow[]).map(mapGuide), error: null };
}

export async function updateGuide(
  slug: string,
  content: string
): Promise<ServiceResult<Guide>> {
  if (!content.trim()) {
    return { data: null, error: "Isi panduan tidak boleh kosong." };
  }
  const { data, error } = await createClient()
    .from("guides")
    .update({ content_md: content.trim() })
    .eq("slug", slug)
    .select("slug,title,content_md,updated_at")
    .single();
  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Panduan tidak ditemukan." };
  return { data: mapGuide(data as GuideRow), error: null };
}

export async function listRaci(): Promise<ServiceResult<RaciRow[]>> {
  const { data, error } = await createClient()
    .from("raci_matrix")
    .select("activity,role,value");
  if (error) return { data: null, error: error.message };
  const cells = (data ?? []) as RaciCell[];
  const grouped = new Map<string, Record<string, RaciValue>>();
  for (const cell of cells) {
    if (!grouped.has(cell.activity)) {
      grouped.set(
        cell.activity,
        Object.fromEntries(RACI_ROLES.map((role) => [role, ""])) as Record<string, RaciValue>
      );
    }
    grouped.get(cell.activity)![cell.role] = cell.value as RaciValue;
  }
  return {
    data: [...grouped].map(([activity, assignments]) => ({ activity, assignments })),
    error: null,
  };
}

export async function setRaciCell(
  activity: string,
  role: string,
  value: string
): Promise<ServiceResult<RaciRow>> {
  if (!(RACI_ROLES as readonly string[]).includes(role)) {
    return { data: null, error: "Role tidak dikenal." };
  }
  if (value !== "" && !(RACI_VALUES as readonly string[]).includes(value as RaciValue)) {
    return { data: null, error: "Nilai harus R, A, C, I, atau kosong." };
  }
  const db = createClient();
  const { data: existing } = await db
    .from("raci_matrix")
    .select("activity")
    .eq("activity", activity)
    .limit(1);
  if (!((existing ?? []) as { activity: string }[])[0]) {
    return { data: null, error: "Aktivitas tidak ditemukan." };
  }
  const { error } = await db
    .from("raci_matrix")
    .upsert({ activity, role, value });
  if (error) return { data: null, error: error.message };
  const { data: cells } = await db
    .from("raci_matrix")
    .select("role,value")
    .eq("activity", activity);
  const assignments = Object.fromEntries(
    RACI_ROLES.map((r) => [r, ""])
  ) as Record<string, RaciValue>;
  for (const cell of (cells ?? []) as { role: string; value: string }[]) {
    assignments[cell.role] = cell.value as RaciValue;
  }
  return { data: { activity, assignments }, error: null };
}