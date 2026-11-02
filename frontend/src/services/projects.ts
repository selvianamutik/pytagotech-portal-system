import { createClient as getSupabaseClient } from "@/lib/supabase/client";
import { getDeal } from "@/services/deals";
import { listTeamMembers } from "@/services/master-data";
import { getProjectProgress } from "@/services/tasks";
import type { PortalUser } from "@/types/auth";
import type { CreateProjectInput, Project } from "@/types/project";
import { isProjectStatus } from "@/types/project";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan Proyek (US-019, US-020, FR-15).
 *
 * Proyek hanya lahir dari handover Dikonfirmasi (gerbang US-017), satu
 * handover = satu proyek. Pembuatan memakai RPC database
 * `create_project_from_handover` agar penyalinan data handover, task template,
 * dan backlog fitur terjadi atomik. UI tetap memakai display ID (`PRJ-xxx`),
 * service memetakan ke UUID internal.
 */

interface ProjectRow {
  id: string;
  display_id: string;
  name: string;
  code: string;
  client_id: string;
  pm_id: string;
  start_date: string;
  target_date: string;
  value_idr: number | string;
  status: string;
  handover_id: string;
  created_at: string;
  updated_at: string;
}

interface Lookups {
  clients: Map<string, string>;
  clientNames: Map<string, string>;
  deals: Map<string, string>;
  dealCodes: Map<string, string>;
  members: Map<string, string>;
}

const PROJECT_COLUMNS =
  "id, display_id, name, code, client_id, pm_id, start_date, target_date, value_idr, status, handover_id, created_at, updated_at";

/** Backward-compat no-op untuk test runner. */
export function resetMockProjects(): void {
  // Database-backed — pembersihan ditangani oleh fake Supabase per-test.
}

/**
 * Daftar PM untuk dropdown. Prioritas anggota tim yang profilnya ber-role
 * Project Manager/Super Admin; bila belum ada tautan profil, seluruh anggota
 * aktif dipakai agar proyek tetap dapat dibuat (data tim live belum tertaut).
 */
export async function listProjectManagers(): Promise<ServiceResult<string[]>> {
  const membersResult = await listTeamMembers();
  if (membersResult.error || !membersResult.data) {
    return {
      data: null,
      error: membersResult.error ?? "Gagal memuat data tim.",
    };
  }
  const members = membersResult.data;
  const supabase = getSupabaseClient();
  const [profilesResult, rolesResult] = await Promise.all([
    supabase.from("profiles").select("id"),
    supabase.from("user_roles").select("user_id, role_name"),
  ]);
  const pmProfileIds = new Set(
    ((rolesResult.data ?? []) as { user_id: string; role_name: string }[])
      .filter(
        (row) =>
          row.role_name === "Project Manager" || row.role_name === "Super Admin"
      )
      .map((row) => row.user_id)
  );
  const knownProfiles = new Set(
    ((profilesResult.data ?? []) as { id: string }[]).map((row) => row.id)
  );
  const linked = members.filter(
    (member) =>
      member.profileId &&
      knownProfiles.has(member.profileId) &&
      pmProfileIds.has(member.profileId)
  );
  const chosen = linked.length > 0 ? linked : members;
  return { data: chosen.map((member) => member.name), error: null };
}

export interface ProjectWithNames {
  project: Project;
  clientName: string;
  handoverCode: string;
  /** % dihitung otomatis dari task (US-020, FR-17). */
  progress: number;
}

/** Role yang boleh membuat/mengubah proyek: PM dan Admin (Super Admin). */
export function canManageProjects(user: PortalUser | null): boolean {
  if (!user || !user.isActive) {
    return false;
  }
  return user.roles.includes("Project Manager") || user.roles.includes("Super Admin");
}

async function loadLookups(): Promise<ServiceResult<Lookups>> {
  const supabase = getSupabaseClient();
  const [clientsRes, dealsRes, membersRes] = await Promise.all([
    supabase.from("clients").select("id, display_id, company_name"),
    supabase.from("deals").select("id, display_id, code"),
    supabase.from("team_members").select("id, name"),
  ]);
  const error = clientsRes.error ?? dealsRes.error ?? membersRes.error;
  if (error) {
    return { data: null, error: error.message };
  }
  const clients = new Map<string, string>();
  const clientNames = new Map<string, string>();
  for (const row of (clientsRes.data ?? []) as {
    id: string;
    display_id: string;
    company_name: string;
  }[]) {
    clients.set(row.id, row.display_id);
    clientNames.set(row.id, row.company_name);
  }
  const deals = new Map<string, string>();
  const dealCodes = new Map<string, string>();
  for (const row of (dealsRes.data ?? []) as {
    id: string;
    display_id: string;
    code: string;
  }[]) {
    deals.set(row.id, row.display_id);
    dealCodes.set(row.id, row.code);
  }
  const members = new Map<string, string>();
  for (const row of (membersRes.data ?? []) as { id: string; name: string }[]) {
    members.set(row.id, row.name);
  }
  return { data: { clients, clientNames, deals, dealCodes, members }, error: null };
}

function toProject(row: ProjectRow, lookups: Lookups): Project {
  return {
    id: row.display_id,
    name: row.name,
    code: row.code,
    clientId: lookups.clients.get(row.client_id) ?? row.client_id,
    pmName: lookups.members.get(row.pm_id) ?? "PM tidak dikenal",
    startDate: row.start_date,
    targetDate: row.target_date,
    value: Number(row.value_idr),
    status: row.status as Project["status"],
    handoverId: lookups.deals.get(row.handover_id) ?? row.handover_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchRows(
  column?: "id" | "display_id" | "handover_id",
  value?: string
): Promise<ServiceResult<ProjectRow[]>> {
  const supabase = getSupabaseClient();
  const query = supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("updated_at", { ascending: false });
  const { data, error } =
    column && value
      ? await query.eq(column, value).limit(1)
      : await query;
  if (error) {
    return { data: null, error: error.message };
  }
  return { data: (data ?? []) as ProjectRow[], error: null };
}

async function withNames(row: ProjectRow): Promise<ProjectWithNames> {
  const lookupsResult = await loadLookups();
  if (lookupsResult.error || !lookupsResult.data) {
    throw new Error(lookupsResult.error ?? "Gagal memuat relasi proyek.");
  }
  const lookups = lookupsResult.data;
  const project = toProject(row, lookups);
  return {
    project,
    clientName:
      lookups.clientNames.get(row.client_id) ?? "Klien tidak dikenal",
    handoverCode: lookups.dealCodes.get(row.handover_id) ?? "-",
    progress: await getProjectProgress(project.id),
  };
}

export async function listProjects(): Promise<ServiceResult<ProjectWithNames[]>> {
  const rows = await fetchRows();
  if (rows.error || !rows.data) {
    return { data: null, error: rows.error ?? "Gagal memuat proyek." };
  }
  try {
    const items = await Promise.all(rows.data.map((row) => withNames(row)));
    return { data: items, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Gagal memuat proyek.",
    };
  }
}

export async function getProject(
  projectId: string
): Promise<ServiceResult<ProjectWithNames>> {
  const rows = await fetchRows("display_id", projectId);
  if (rows.error || !rows.data) {
    return { data: null, error: rows.error ?? "Gagal memuat proyek." };
  }
  if (rows.data.length === 0) {
    return { data: null, error: "Proyek tidak ditemukan." };
  }
  try {
    return { data: await withNames(rows.data[0]), error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Gagal memuat proyek.",
    };
  }
}

/** Cari proyek dari display ID handover (`HDV-xxx`). */
export async function findProjectByHandover(
  handoverId: string
): Promise<Project | null> {
  const supabase = getSupabaseClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("id")
    .eq("display_id", handoverId)
    .limit(1);
  const dealRow = ((deal ?? []) as { id: string }[])[0];
  if (!dealRow) {
    return null;
  }
  const rows = await fetchRows("handover_id", dealRow.id);
  if (rows.error || !rows.data || rows.data.length === 0) {
    return null;
  }
  const lookupsResult = await loadLookups();
  if (lookupsResult.error || !lookupsResult.data) {
    return null;
  }
  return toProject(rows.data[0], lookupsResult.data);
}

export interface ProjectQuery {
  search?: string;
  statuses?: Project["status"][];
  pmNames?: string[];
  clientIds?: string[];
}

/** Daftar proyek dengan pencarian + filter status/PM/klien (US-020). */
export async function queryProjects(
  query: ProjectQuery
): Promise<ServiceResult<ProjectWithNames[]>> {
  const { data, error } = await listProjects();
  if (error) {
    return { data: null, error };
  }
  const search = (query.search ?? "").trim().toLowerCase();
  const items = (data ?? []).filter((item) => {
    if (search) {
      const haystack =
        `${item.project.name} ${item.project.code} ${item.clientName} ${item.project.pmName}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }
    if (query.statuses && query.statuses.length > 0 && !query.statuses.includes(item.project.status)) {
      return false;
    }
    if (query.pmNames && query.pmNames.length > 0 && !query.pmNames.includes(item.project.pmName)) {
      return false;
    }
    if (query.clientIds && query.clientIds.length > 0 && !query.clientIds.includes(item.project.clientId)) {
      return false;
    }
    return true;
  });
  return { data: items, error: null };
}

/**
 * Buat proyek dari handover Dikonfirmasi (FR-15). RPC database menyalin
 * klien, nama, kode, nilai, deadline, membuat task dari template, dan
 * memasukkan fitur handover ke backlog secara atomik.
 */
export async function createProjectFromHandover(
  handoverId: string,
  input: CreateProjectInput
): Promise<ServiceResult<Project>> {
  const { data: found } = await getDeal(handoverId);
  if (!found) {
    return { data: null, error: "Deal handover tidak ditemukan." };
  }
  const deal = found.deal;
  if (deal.status !== "Dikonfirmasi") {
    return {
      data: null,
      error: "Hanya handover berstatus Dikonfirmasi yang dapat dijadikan proyek.",
    };
  }
  if (await findProjectByHandover(handoverId)) {
    return { data: null, error: "Handover ini sudah dijadikan proyek." };
  }
  const pmNames = await listProjectManagers();
  if (pmNames.error || !pmNames.data?.includes(input.pmName)) {
    return { data: null, error: "PM tidak dikenal." };
  }
  if (Number.isNaN(Date.parse(input.startDate))) {
    return { data: null, error: "Tanggal mulai tidak valid." };
  }
  if (input.startDate > deal.deadline) {
    return { data: null, error: "Tanggal mulai tidak boleh melewati deadline handover." };
  }

  const supabase = getSupabaseClient();
  const [dealRes, membersResult] = await Promise.all([
    supabase.from("deals").select("id").eq("display_id", handoverId).limit(1),
    listTeamMembers(),
  ]);
  const dealRow = ((dealRes.data ?? []) as { id: string }[])[0];
  const member = membersResult.data?.find(
    (item) => item.name === input.pmName && item.isActive
  );
  if (!dealRow) {
    return { data: null, error: "Deal handover tidak ditemukan." };
  }
  if (!member) {
    return { data: null, error: "PM tidak dikenal." };
  }

  const { data: createdId, error: rpcError } = await supabase.rpc(
    "create_project_from_handover",
    {
      handover_id: dealRow.id,
      pm_id: member.id,
      start_date: input.startDate,
    }
  );
  if (rpcError) {
    return { data: null, error: rpcError.message };
  }
  if (!createdId) {
    return { data: null, error: "Proyek gagal dibuat." };
  }

  const rows = await fetchRows("id", String(createdId));
  if (rows.error || !rows.data || rows.data.length === 0) {
    return { data: null, error: rows.error ?? "Proyek gagal dimuat." };
  }
  const lookupsResult = await loadLookups();
  if (lookupsResult.error || !lookupsResult.data) {
    return {
      data: null,
      error: lookupsResult.error ?? "Gagal memuat relasi proyek.",
    };
  }
  const project = toProject(rows.data[0], lookupsResult.data);

  // RPC database sudah menyalin task template dan backlog fitur secara
  // atomik; service tidak boleh menulis ulang (hindari duplikasi).
  return { data: project, error: null };
}

export interface UpdateProjectInput {
  status?: Project["status"];
  pmName?: string;
  startDate?: string;
  targetDate?: string;
}

/**
 * Ubah proyek (US-020). UI memanggil hanya untuk PM/Admin
 * (canManageProjects); RLS database menegakkan batas yang sama.
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<ServiceResult<Project>> {
  const rows = await fetchRows("display_id", projectId);
  if (rows.error || !rows.data) {
    return { data: null, error: rows.error ?? "Gagal memuat proyek." };
  }
  if (rows.data.length === 0) {
    return { data: null, error: "Proyek tidak ditemukan." };
  }
  const current = rows.data[0];
  if (input.status && !isProjectStatus(input.status)) {
    return { data: null, error: "Status proyek tidak dikenal." };
  }
  let pmId = current.pm_id;
  if (input.pmName) {
    const pmNames = await listProjectManagers();
    if (pmNames.error || !pmNames.data?.includes(input.pmName)) {
      return { data: null, error: "PM tidak dikenal." };
    }
    const membersResult = await listTeamMembers();
    const member = membersResult.data?.find(
      (item) => item.name === input.pmName && item.isActive
    );
    if (!member) {
      return { data: null, error: "PM tidak dikenal." };
    }
    pmId = member.id;
  }
  const startDate = input.startDate ?? current.start_date;
  const targetDate = input.targetDate ?? current.target_date;
  if (Number.isNaN(Date.parse(startDate)) || Number.isNaN(Date.parse(targetDate))) {
    return { data: null, error: "Tanggal proyek tidak valid." };
  }
  if (startDate > targetDate) {
    return { data: null, error: "Tanggal mulai tidak boleh melewati target selesai." };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .update({
      status: input.status ?? current.status,
      pm_id: pmId,
      start_date: startDate,
      target_date: targetDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select(PROJECT_COLUMNS);
  if (error) {
    return { data: null, error: error.message };
  }
  const updated = ((data ?? []) as ProjectRow[])[0];
  if (!updated) {
    return { data: null, error: "Proyek tidak ditemukan." };
  }
  const lookupsResult = await loadLookups();
  if (lookupsResult.error || !lookupsResult.data) {
    return {
      data: null,
      error: lookupsResult.error ?? "Gagal memuat relasi proyek.",
    };
  }
  return { data: toProject(updated, lookupsResult.data), error: null };
}
