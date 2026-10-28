import { createClient as getSupabaseClient } from "@/lib/supabase/client";
import { listClients } from "@/services/clients";
import type {
  CreateDealInput,
  DealHandover,
  HandoverStatus,
  UpdateDealInput,
} from "@/types/deal";
import { formatDealName, isHandoverStatus } from "@/types/deal";
import type { ServiceResult } from "@/services/result";

interface DealRow {
  id: string;
  display_id: string;
  title: string;
  code: string;
  client_id: string;
  scope: string;
  objective: string;
  value_idr: number;
  term_scheme: string;
  deadline: string;
  notes: string | null;
  status: string;
  created_by: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DealFeatureRow {
  deal_id: string;
  name: string;
  description: string;
  sort_order: number;
}

interface DealVersionRow {
  deal_id: string;
  version: number;
  value_idr: number;
  deadline: string;
  note: string;
  created_at: string;
}

const DEAL_COLUMNS =
  "id, display_id, title, code, client_id, scope, objective, value_idr, term_scheme, deadline, notes, status, created_by, confirmed_by, confirmed_at, created_at, updated_at";

/** Backward-compat no-op for tests. */
export function resetMockDeals(): void {}

export interface DealWithClient {
  deal: DealHandover;
  clientName: string;
  displayName: string;
}

function validateDealInput(input: CreateDealInput, clientIds: string[]): string | null {
  if (input.title.trim().length === 0) return "Judul proyek wajib diisi.";
  if (input.code.trim().length === 0) return "Kode proyek wajib diisi.";
  if (!clientIds.includes(input.clientId)) return "Klien tidak dikenal.";
  if (input.scope.trim().length === 0) return "Scope wajib diisi.";
  if (input.features.length === 0) return "Minimal satu fitur (dengan penjelasan).";
  for (const feature of input.features) {
    if (feature.name.trim().length === 0 || feature.description.trim().length === 0) {
      return "Setiap fitur wajib memiliki nama dan penjelasan.";
    }
  }
  if (input.objective.trim().length === 0) return "Objektif akhir wajib diisi.";
  if (!Number.isFinite(input.value) || input.value <= 0) return "Nilai deal harus lebih dari 0.";
  if (input.termScheme.trim().length === 0) return "Skema termin wajib diisi.";
  if (Number.isNaN(Date.parse(input.deadline))) return "Target deadline tidak valid.";
  return null;
}

async function getClientMappings(): Promise<{
  uuidToDisplay: Map<string, string>;
  displayToUuid: Map<string, string>;
  displayToName: Map<string, string>;
}> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("clients").select("id, display_id, company_name");
  const uuidToDisplay = new Map<string, string>();
  const displayToUuid = new Map<string, string>();
  const displayToName = new Map<string, string>();
  for (const c of (data ?? []) as { id: string; display_id: string; company_name: string }[]) {
    uuidToDisplay.set(c.id, c.display_id);
    displayToUuid.set(c.display_id, c.id);
    displayToName.set(c.display_id, c.company_name);
  }
  return { uuidToDisplay, displayToUuid, displayToName };
}

function rowToDeal(
  row: DealRow,
  features: DealFeatureRow[],
  versions: DealVersionRow[],
  uuidToDisplay: Map<string, string>
): DealHandover {
  const clientDisplayId = uuidToDisplay.get(row.client_id) ?? row.client_id;
  return {
    id: row.display_id,
    title: row.title,
    code: row.code,
    clientId: clientDisplayId,
    scope: row.scope,
    features: features
      .filter((f) => f.deal_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((f) => ({ name: f.name, description: f.description })),
    objective: row.objective,
    value: row.value_idr,
    termScheme: row.term_scheme,
    deadline: row.deadline,
    notes: row.notes ?? "",
    status: row.status as HandoverStatus,
    versions: versions
      .filter((v) => v.deal_id === row.id)
      .sort((a, b) => a.version - b.version)
      .map((v) => ({
        version: v.version,
        value: v.value_idr,
        deadline: v.deadline,
        note: v.note,
        createdAt: v.created_at,
      })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listDeals(): Promise<ServiceResult<DealWithClient[]>> {
  const supabase = getSupabaseClient();
  const [dealsRes, featuresRes, versionsRes, mappings] = await Promise.all([
    supabase.from("deals").select(DEAL_COLUMNS).order("updated_at", { ascending: false }),
    supabase.from("deal_features").select("deal_id, name, description, sort_order"),
    supabase.from("deal_versions").select("deal_id, version, value_idr, deadline, note, created_at"),
    getClientMappings(),
  ]);

  if (dealsRes.error) return { data: null, error: dealsRes.error.message };

  const rows = (dealsRes.data ?? []) as DealRow[];
  const features = (featuresRes.data ?? []) as DealFeatureRow[];
  const versions = (versionsRes.data ?? []) as DealVersionRow[];

  const data = rows.map((row) => {
    const deal = rowToDeal(row, features, versions, mappings.uuidToDisplay);
    const clientName = mappings.displayToName.get(deal.clientId) ?? "Klien tidak dikenal";
    return {
      deal: structuredClone(deal),
      clientName,
      displayName: formatDealName(deal.title, clientName, deal.code),
    };
  });

  return { data, error: null };
}

export async function getDeal(dealId: string): Promise<ServiceResult<DealWithClient>> {
  const { data } = await listDeals();
  const found = (data ?? []).find((item) => item.deal.id === dealId);
  if (!found) return { data: null, error: "Deal handover tidak ditemukan." };
  return { data: found, error: null };
}

export async function createDeal(input: CreateDealInput): Promise<ServiceResult<DealHandover>> {
  const { data: clients } = await listClients();
  const validationError = validateDealInput(input, (clients ?? []).map((c) => c.id));
  if (validationError) return { data: null, error: validationError };

  const supabase = getSupabaseClient();
  const { data: codeTaken } = await supabase.from("deals").select("id").ilike("code", input.code.trim());
  if ((codeTaken ?? []).length > 0) {
    return { data: null, error: `Kode proyek ${input.code.trim()} sudah dipakai.` };
  }

  const mappings = await getClientMappings();
  const clientUuid = mappings.displayToUuid.get(input.clientId);
  if (!clientUuid) {
    return { data: null, error: "Klien tidak dikenal." };
  }

  const { data: dealRow, error: dealErr } = await supabase
    .from("deals")
    .insert({
      title: input.title.trim(),
      code: input.code.trim(),
      client_id: clientUuid,
      scope: input.scope.trim(),
      objective: input.objective.trim(),
      value_idr: input.value,
      term_scheme: input.termScheme.trim(),
      deadline: input.deadline,
      notes: input.notes.trim(),
      status: "Draft",
    })
    .select(DEAL_COLUMNS)
    .single();

  if (dealErr || !dealRow) return { data: null, error: dealErr?.message ?? "Gagal membuat deal." };
  const row = dealRow as DealRow;

  if (input.features.length) {
    await supabase.from("deal_features").insert(
      input.features.map((f, i) => ({
        deal_id: row.id,
        name: f.name.trim(),
        description: f.description.trim(),
        sort_order: i,
      }))
    );
  }

  await supabase.from("deal_versions").insert({
    deal_id: row.id,
    version: 1,
    value_idr: input.value,
    deadline: input.deadline,
    note: "Versi awal saat handover dibuat.",
  });

  const { data } = await getDeal(row.display_id);
  return { data: data?.deal ?? null, error: null };
}

export async function updateDeal(dealId: string, input: UpdateDealInput): Promise<ServiceResult<DealHandover>> {
  const supabase = getSupabaseClient();
  const { data: current } = await supabase.from("deals").select(DEAL_COLUMNS).eq("display_id", dealId).maybeSingle();
  if (!current) return { data: null, error: "Deal handover tidak ditemukan." };
  const row = current as DealRow;

  if (row.status === "Dikonfirmasi") {
    return { data: null, error: "Handover yang Dikonfirmasi hanya bisa diubah via change request (US-018)." };
  }

  const mappings = await getClientMappings();
  const currentClientDisplay = mappings.uuidToDisplay.get(row.client_id) ?? row.client_id;

  const { data: clients } = await listClients();
  const merged: CreateDealInput = {
    title: input.title ?? row.title,
    code: input.code ?? row.code,
    clientId: input.clientId ?? currentClientDisplay,
    scope: input.scope ?? row.scope,
    features: input.features ?? [],
    objective: input.objective ?? row.objective,
    value: input.value ?? row.value_idr,
    termScheme: input.termScheme ?? row.term_scheme,
    deadline: input.deadline ?? row.deadline,
    notes: input.notes ?? row.notes ?? "",
  };

  if (input.features === undefined) {
    const { data: feats } = await supabase.from("deal_features").select("name, description, sort_order").eq("deal_id", row.id).order("sort_order");
    merged.features = ((feats ?? []) as { name: string; description: string }[]).map((f) => ({ name: f.name, description: f.description }));
  }

  const validationError = validateDealInput(merged, (clients ?? []).map((c) => c.id));
  if (validationError) return { data: null, error: validationError };

  const { data: codeTaken } = await supabase.from("deals").select("id").ilike("code", merged.code.trim()).neq("display_id", dealId);
  if ((codeTaken ?? []).length > 0) {
    return { data: null, error: `Kode proyek ${merged.code.trim()} sudah dipakai.` };
  }

  const clientUuid = mappings.displayToUuid.get(merged.clientId) ?? row.client_id;

  const { error: updErr } = await supabase
    .from("deals")
    .update({
      title: merged.title.trim(),
      code: merged.code.trim(),
      client_id: clientUuid,
      scope: merged.scope.trim(),
      objective: merged.objective.trim(),
      value_idr: merged.value,
      term_scheme: merged.termScheme.trim(),
      deadline: merged.deadline,
      notes: merged.notes.trim(),
    })
    .eq("display_id", dealId);

  if (updErr) return { data: null, error: updErr.message };

  if (input.features !== undefined) {
    await supabase.from("deal_features").delete().eq("deal_id", row.id);
    if (merged.features.length) {
      await supabase.from("deal_features").insert(
        merged.features.map((f, i) => ({
          deal_id: row.id,
          name: f.name.trim(),
          description: f.description.trim(),
          sort_order: i,
        }))
      );
    }
  }

  const { data } = await getDeal(dealId);
  return { data: data?.deal ?? null, error: null };
}

export async function setDealStatus(dealId: string, status: HandoverStatus): Promise<ServiceResult<DealHandover>> {
  if (!isHandoverStatus(status)) return { data: null, error: "Status handover tidak dikenal." };
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("deals").update({ status }).eq("display_id", dealId);
  if (error) return { data: null, error: error.message };
  const { data } = await getDeal(dealId);
  return { data: data?.deal ?? null, error: null };
}

export interface ApprovedChangeImpacts {
  value: number | null;
  deadline: string | null;
  note: string;
}

export async function applyApprovedChangeRequest(dealId: string, impacts: ApprovedChangeImpacts): Promise<ServiceResult<DealHandover>> {
  const supabase = getSupabaseClient();
  const { data: current } = await supabase.from("deals").select(DEAL_COLUMNS).eq("display_id", dealId).maybeSingle();
  if (!current) return { data: null, error: "Deal handover tidak ditemukan." };
  const row = current as DealRow;

  const newValue = impacts.value !== null ? impacts.value : row.value_idr;
  const newDeadline = impacts.deadline ? impacts.deadline : row.deadline;

  const { error } = await supabase.from("deals").update({ value_idr: newValue, deadline: newDeadline }).eq("display_id", dealId);
  if (error) return { data: null, error: error.message };

  const { data: versions } = await supabase.from("deal_versions").select("version").eq("deal_id", row.id);
  const nextVersion = ((versions ?? []) as { version: number }[]).length + 1;

  await supabase.from("deal_versions").insert({
    deal_id: row.id,
    version: nextVersion,
    value_idr: newValue,
    deadline: newDeadline,
    note: impacts.note,
  });

  const { data } = await getDeal(dealId);
  return { data: data?.deal ?? null, error: null };
}
