import { mockChangeRequests } from "@/mocks/change-requests";
import { logAudit } from "@/services/audit";
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
 * CR yang Disetujui memperbarui nilai/deadline deal + menambah
 * riwayat versi. Fase 1: mock; Fase 2: tabel `change_requests`.
 */

let crStore: ChangeRequest[] = structuredClone(mockChangeRequests);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockChangeRequests(): void {
  crStore = structuredClone(mockChangeRequests);
}

export async function listChangeRequests(
  dealId: string
): Promise<ServiceResult<ChangeRequest[]>> {
  return {
    data: crStore
      .filter((cr) => cr.dealId === dealId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((cr) => ({ ...cr })),
    error: null,
  };
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
  if (input.valueImpact !== undefined && input.valueImpact !== null && (!Number.isFinite(input.valueImpact) || input.valueImpact <= 0)) {
    return { data: null, error: "Dampak nilai harus lebih dari 0." };
  }
  if (input.deadlineImpact && Number.isNaN(Date.parse(input.deadlineImpact))) {
    return { data: null, error: "Dampak deadline tidak valid." };
  }
  if (
    (input.valueImpact ?? null) === null &&
    !input.deadlineImpact
  ) {
    return { data: null, error: "Isi minimal satu dampak: nilai atau deadline." };
  }

  const cr: ChangeRequest = {
    id: `CR-${String(crStore.length + 1).padStart(3, "0")}`,
    dealId,
    kind: input.kind,
    description: input.description.trim(),
    valueImpact: input.valueImpact ?? null,
    deadlineImpact: input.deadlineImpact || null,
    status: "Diajukan",
    createdById: author.id,
    createdByName: author.name,
    createdAt: new Date().toISOString(),
    decidedAt: null,
  };
  crStore.push(cr);
  return { data: { ...cr }, error: null };
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
  const cr = crStore.find((item) => item.id === input.crId);
  if (!cr) {
    return { data: null, error: "Change request tidak ditemukan." };
  }
  if (cr.status !== "Diajukan") {
    return { data: null, error: `Change request sudah ${cr.status}.` };
  }

  cr.status = input.decision;
  cr.decidedAt = new Date().toISOString();

  if (input.decision === "Disetujui") {
    const { data: found } = await getDeal(cr.dealId);
    if (!found) {
      return { data: null, error: "Deal handover tidak ditemukan." };
    }
    // Terapkan dampak langsung: deal Dikonfirmasi terkunci dari form,
    // tetapi CR yang disetujui adalah jalur resminya (FR-14).
    const { error } = await applyApprovedChangeRequest(cr.dealId, {
      value: cr.valueImpact,
      deadline: cr.deadlineImpact,
      note: `${cr.id} ${cr.kind}: ${cr.description}`,
    });
    if (error) {
      return { data: null, error };
    }
    await pushNotification({
      type: "status",
      title: `Change request ${cr.id} disetujui`,
      message: `${input.actor.name}: ${found.displayName} diperbarui (versi baru tersimpan).`,
      entityType: "deal",
      entityId: cr.dealId,
      actorName: input.actor.name,
    });
  }

  await logAudit({
    actorId: input.actor.id,
    actorName: input.actor.name,
    action: "deal.change-request",
    entityType: "deal",
    entityId: cr.dealId,
    oldValue: "Diajukan",
    newValue: input.decision,
  });

  return { data: { ...cr }, error: null };
}
