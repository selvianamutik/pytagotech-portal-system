import { createClient as getSupabaseClient } from "@/lib/supabase/client";
import { isTeamMemberInUse } from "@/services/master-data";
import type { Developer, DeveloperInput } from "@/types/developer";
import { isEmploymentStatus } from "@/types/developer";
import type { ServiceResult } from "@/services/result";

/**
 * Master data developer (dropdown assignee task/fitur).
 *
 * Skema APPROVED tidak punya tabel `developers`; developer adalah anggota
 * `team_members` dengan status `internal`/`external`. UI memakai UUID anggota
 * sebagai ID (tabel ini tidak punya display ID). Anggota yang sudah dipakai
 * tidak dihapus agar penugasan lama tidak hilang.
 */

interface MemberRow {
  id: string;
  name: string;
  status: string;
  is_active: boolean;
  created_at: string;
}

const MEMBER_COLUMNS = "id, name, status, is_active, created_at";

/** Backward-compat no-op untuk test runner. */
export function resetMockDevelopers(): void {
  // Database-backed — pembersihan ditangani oleh fake Supabase per-test.
}

function toDeveloper(row: MemberRow): Developer | null {
  if (!isEmploymentStatus(row.status)) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listDevelopers(): Promise<ServiceResult<Developer[]>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("team_members")
    .select(MEMBER_COLUMNS)
    .order("name", { ascending: true });
  if (error) {
    return { data: null, error: error.message };
  }
  return {
    data: ((data ?? []) as MemberRow[])
      .map(toDeveloper)
      .filter((row): row is Developer => row !== null),
    error: null,
  };
}

/** Nama developer aktif untuk dropdown penugasan. */
export async function listDeveloperNames(): Promise<ServiceResult<string[]>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("team_members")
    .select(MEMBER_COLUMNS)
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) {
    return { data: null, error: error.message };
  }
  return {
    data: ((data ?? []) as MemberRow[])
      .map(toDeveloper)
      .filter((row): row is Developer => row !== null)
      .map((developer) => developer.name),
    error: null,
  };
}

async function findMemberByName(name: string): Promise<MemberRow | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("team_members")
    .select(MEMBER_COLUMNS)
    .eq("name", name)
    .limit(1);
  return ((data ?? []) as MemberRow[])[0] ?? null;
}

export async function createDeveloper(
  input: DeveloperInput
): Promise<ServiceResult<Developer>> {
  const name = input.name.trim();
  if (name.length === 0) {
    return { data: null, error: "Nama developer wajib diisi." };
  }
  if (!isEmploymentStatus(input.status)) {
    return { data: null, error: "Status harus internal atau external." };
  }
  const supabase = getSupabaseClient();
  const { data: existing } = await supabase
    .from("team_members")
    .select("id, name")
    .ilike("name", name);
  if (
    ((existing ?? []) as { name: string }[]).some(
      (row) => row.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    return { data: null, error: "Nama developer sudah terdaftar." };
  }

  const { data, error } = await supabase
    .from("team_members")
    .insert({ name, status: input.status, is_active: true })
    .select(MEMBER_COLUMNS);
  if (error) {
    return { data: null, error: error.message };
  }
  const row = ((data ?? []) as MemberRow[])[0];
  const developer = row ? toDeveloper(row) : null;
  if (!developer) {
    return { data: null, error: "Developer gagal dibuat." };
  }
  return { data: developer, error: null };
}

export async function updateDeveloper(
  developerId: string,
  input: DeveloperInput
): Promise<ServiceResult<Developer>> {
  const name = input.name.trim();
  if (name.length === 0) {
    return { data: null, error: "Nama developer wajib diisi." };
  }
  if (!isEmploymentStatus(input.status)) {
    return { data: null, error: "Status harus internal atau external." };
  }
  const existing = await findMemberByName(name);
  if (existing && existing.id !== developerId) {
    return { data: null, error: "Nama developer sudah terdaftar." };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("team_members")
    .update({ name, status: input.status })
    .eq("id", developerId)
    .select(MEMBER_COLUMNS);
  if (error) {
    return { data: null, error: error.message };
  }
  const row = ((data ?? []) as MemberRow[])[0];
  const developer = row ? toDeveloper(row) : null;
  if (!developer) {
    return { data: null, error: "Developer tidak ditemukan." };
  }
  return { data: developer, error: null };
}

export async function deleteDeveloper(
  developerId: string
): Promise<ServiceResult<true>> {
  const usage = await isTeamMemberInUse(developerId);
  if (usage.error) {
    return { data: null, error: "Gagal memeriksa pemakaian developer." };
  }
  if (usage.inUse) {
    return {
      data: null,
      error:
        "Developer ini sudah dipakai pada task/fitur dan tidak bisa dihapus. Nonaktifkan agar tidak muncul di dropdown.",
    };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", developerId)
    .select("id");
  if (error) {
    return { data: null, error: error.message };
  }
  if (!data || data.length === 0) {
    return { data: null, error: "Developer tidak ditemukan." };
  }
  return { data: true, error: null };
}
