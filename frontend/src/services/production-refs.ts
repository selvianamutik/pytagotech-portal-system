import { createClient as getSupabaseClient } from "@/lib/supabase/client";
import type { ServiceResult } from "@/services/result";

/**
 * Pemetaan display ID ↔ UUID internal untuk modul produksi (FR-16..FR-20).
 *
 * UI tetap memakai `PRJ-xxx`, `TSK-xxx`, `FIT-xxx`, sedangkan database memakai
 * UUID. Helper ini memusatkan pemetaan agar tiap service tidak menulis query
 * lookup sendiri-sendiri.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export interface DisplayMap {
  idByDisplay: Map<string, string>;
  displayById: Map<string, string>;
}

/** Muat pasangan `id`/`display_id` dari tabel yang punya trigger display ID. */
export async function loadDisplayMap(
  table: string
): Promise<ServiceResult<DisplayMap>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(table).select("id, display_id");
  if (error) {
    return { data: null, error: error.message };
  }
  const idByDisplay = new Map<string, string>();
  const displayById = new Map<string, string>();
  for (const row of (data ?? []) as { id: string; display_id: string }[]) {
    idByDisplay.set(row.display_id, row.id);
    displayById.set(row.id, row.display_id);
  }
  return { data: { idByDisplay, displayById }, error: null };
}

/**
 * Ubah display ID menjadi UUID. Nilai yang sudah UUID diteruskan apa adanya
 * agar service dapat dipanggil dengan ID internal (mis. dari hasil RPC).
 * Bila tidak ada `display_id` yang cocok, cari lewat kolom `id` agar ID
 * internal non-UUID (mis. fixture test) tetap dapat dipakai.
 */
export async function resolveDisplayUuid(
  table: string,
  displayId: string,
  label: string
): Promise<ServiceResult<string>> {
  if (isUuid(displayId)) {
    return { data: displayId, error: null };
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("display_id", displayId)
    .limit(1);
  if (error) {
    return { data: null, error: error.message };
  }
  const row = ((data ?? []) as { id: string }[])[0];
  if (row) {
    return { data: row.id, error: null };
  }
  const { data: byId, error: byIdError } = await supabase
    .from(table)
    .select("id")
    .eq("id", displayId)
    .limit(1);
  if (byIdError) {
    return { data: null, error: byIdError.message };
  }
  const idRow = ((byId ?? []) as { id: string }[])[0];
  if (!idRow) {
    return { data: null, error: `${label} tidak ditemukan.` };
  }
  return { data: idRow.id, error: null };
}

export interface MemberMaps {
  idByName: Map<string, string>;
  nameById: Map<string, string>;
}

/** Muat pasangan id/nama `team_members` (dipakai assignee & developer). */
export async function loadMemberMaps(): Promise<ServiceResult<MemberMaps>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name");
  if (error) {
    return { data: null, error: error.message };
  }
  const idByName = new Map<string, string>();
  const nameById = new Map<string, string>();
  for (const row of (data ?? []) as { id: string; name: string }[]) {
    idByName.set(row.name, row.id);
    nameById.set(row.id, row.name);
  }
  return { data: { idByName, nameById }, error: null };
}
