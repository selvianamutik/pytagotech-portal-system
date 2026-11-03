import { createClient as getSupabaseClient } from "@/lib/supabase/client";
import { pushNotification } from "@/services/collaboration";
import { applyApprovedChangeRequest, getDeal } from "@/services/deals";
import type {
  ChangeRequest,
  CreateChangeRequestInput,
} from "@/types/deal";
import { isChangeRequestKind } from "@/types/deal";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan change request & catatan khusus (US-018, FR-14).
 *
 * Menggunakan database Supabase (tabel `change_requests`).
 * CR yang Disetujui memperbarui nilai/deadline deal + menambah
 * riwayat versi.
 */

interface ChangeRequestRow {
  id: string;
  display_id: string;
  deal_id: string;
  kind: string;
  description: string;
  value_impact: number | null;
  deadline_impact: string | null;
  status: string;
  created_by: string | null;
  created_by_name: string;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

const CR_COLUMNS =
  "id, display_id, deal_id, kind, description, value_impact, deadline_impact, status, created_by, created_by_name, decided_at, created_at, updated_at";

/** Backward-compat no-op for tests */
export function resetMockChangeRequests(): void {}

function rowToCr(row: ChangeRequestRow, dealDisplayId: string): ChangeRequest {
  return {
    id: row.display_id,
    dealId: dealDisplayId,
    kind: row.kind as ChangeRequest["kind"],
    description: row.description,
    valueImpact: row.value_impact !== null ? Number(row.value_impact) : null,
    deadlineImpact: row.deadline_impact,
    status: row.status as ChangeRequest["status"],
    createdById: row.created_by ?? "",
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  };
}

export async function listChangeRequests(
  dealId: string
): Promise<ServiceResult<ChangeRequest[]>> {
  const supabase = getSupabaseClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("id, display_id")
    .eq("display_id", dealId)
    .maybeSingle();

  if (!deal) return { data: [], error: null };

  const { data, error } = await supabase
    .from("change_requests")
    .select(CR_COLUMNS)
    .eq("deal_id", deal.id)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };

  const requests = ((data ?? []) as ChangeRequestRow[]).map((r) =>
    rowToCr(r, deal.display_id)
  );

  return { data: requests, error: null };
}

export async function createChangeRequest(
  dealId: string,
  input: CreateChangeRequestInput,
  author: { id: string; name: string }
): Promise<ServiceResult<ChangeRequest>> {
  const { data: found } = await getDeal(dealId);
  if (!found) {
    return { data: null, error: "Deal handover tidak ditemukan." };
  }
  if (!isChangeRequestKind(input.kind)) {
    return { data: null, error: "Jenis change request tidak dikenal." };
  }
  if (input.description.trim().length === 0) {
    return { data: null, error: "Deskripsi change request wajib diisi." };
  }
  if (
    input.valueImpact !== undefined &&
    input.valueImpact !== null &&
    (!Number.isFinite(input.valueImpact) || input.valueImpact <= 0)
  ) {
    return { data: null, error: "Dampak nilai harus lebih dari 0." };
  }
  if (input.deadlineImpact && Number.isNaN(Date.parse(input.deadlineImpact))) {
    return { data: null, error: "Dampak deadline tidak valid." };
  }
  if ((input.valueImpact ?? null) === null && !input.deadlineImpact) {
    return { data: null, error: "Isi minimal satu dampak: nilai atau deadline." };
  }

  const supabase = getSupabaseClient();
  const { data: dealRow } = await supabase
    .from("deals")
    .select("id")
    .eq("display_id", dealId)
    .maybeSingle();

  if (!dealRow) {
    return { data: null, error: "Deal handover tidak ditemukan." };
  }

  const { data, error } = await supabase
    .from("change_requests")
    .insert({
      deal_id: dealRow.id,
      kind: input.kind,
      description: input.description.trim(),
      value_impact: input.valueImpact ?? null,
      deadline_impact: input.deadlineImpact || null,
      status: "Diajukan",
      created_by: author.id.startsWith("tm-") || author.id.includes("-") ? author.id : null,
      created_by_name: author.name,
    })
    .select(CR_COLUMNS)
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? "Gagal membuat change request." };
  }

  return { data: rowToCr(data as ChangeRequestRow, dealId), error: null };
}

export interface DecideChangeRequestInput {
  crId: string;
  decision: "Disetujui" | "Ditolak";
  actor: { id: string; name: string };
}

/**
 * Putuskan CR. Persetujuan menerapkan dampak ke deal + menambah
 * versi riwayat (FR-14); penolakan hanya mengubah status.
 */
export async function decideChangeRequest(
  input: DecideChangeRequestInput
): Promise<ServiceResult<ChangeRequest>> {
  const supabase = getSupabaseClient();
  const { data: current, error: fetchErr } = await supabase
    .from("change_requests")
    .select(CR_COLUMNS)
    .eq("display_id", input.crId)
    .maybeSingle();

  if (fetchErr) return { data: null, error: fetchErr.message };
  if (!current) return { data: null, error: "Change request tidak ditemukan." };

  const crRow = current as ChangeRequestRow;
  if (crRow.status !== "Diajukan") {
    return { data: null, error: `Change request sudah ${crRow.status}.` };
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateErr } = await supabase
    .from("change_requests")
    .update({
      status: input.decision,
      decided_at: now,
    })
    .eq("id", crRow.id)
    .select(CR_COLUMNS)
    .single();

  if (updateErr || !updated) {
    return { data: null, error: updateErr?.message ?? "Gagal memutuskan change request." };
  }

  const { data: dealRow } = await supabase
    .from("deals")
    .select("display_id")
    .eq("id", crRow.deal_id)
    .maybeSingle();

  const dealDisplayId = (dealRow as { display_id: string } | null)?.display_id ?? "";

  if (input.decision === "Disetujui") {
    const { data: found } = await getDeal(dealDisplayId);
    if (!found) {
      return { data: null, error: "Deal handover tidak ditemukan." };
    }

    const { error: applyErr } = await applyApprovedChangeRequest(dealDisplayId, {
      value: crRow.value_impact ? Number(crRow.value_impact) : null,
      deadline: crRow.deadline_impact,
      note: `${crRow.display_id} ${crRow.kind}: ${crRow.description}`,
    });

    if (applyErr) {
      return { data: null, error: applyErr };
    }

    await pushNotification({
      type: "status",
      title: `Change request ${crRow.display_id} disetujui`,
      message: `${input.actor.name}: ${found.displayName} diperbarui (versi baru tersimpan).`,
      entityType: "deal",
      entityId: dealDisplayId,
      actorName: input.actor.name,
    });
  }

  return {
    data: rowToCr(updated as ChangeRequestRow, dealDisplayId),
    error: null,
  };
}
