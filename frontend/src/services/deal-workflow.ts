import { addComment, pushNotification } from "@/services/collaboration";
import { logAudit } from "@/services/audit";
import { listTerms } from "@/services/deal-terms";
import { getDeal, setDealStatus } from "@/services/deals";
import type { DealHandover, HandoverStatus } from "@/types/deal";
import type { ServiceResult } from "@/services/result";

/**
 * Alur status handover (US-017, FR-13):
 * Draft → Menunggu Konfirmasi Produksi → Dikonfirmasi / Perlu Revisi.
 * Setiap perubahan mengirimi notifikasi + mencatat audit.
 * Fase 2: RLS memastikan hanya PM yang memutuskan (US-003).
 */

export interface StatusTransitionActor {
  id: string;
  name: string;
  roles: string[];
}

const ALLOWED_TRANSITIONS: Record<HandoverStatus, HandoverStatus[]> = {
  Draft: ["Menunggu Konfirmasi Produksi"],
  "Menunggu Konfirmasi Produksi": ["Dikonfirmasi", "Perlu Revisi"],
  Dikonfirmasi: [],
  "Perlu Revisi": ["Menunggu Konfirmasi Produksi"],
};

function canDecide(actor: StatusTransitionActor): boolean {
  return actor.roles.includes("Project Manager") || actor.roles.includes("Super Admin");
}

export interface TransitionInput {
  dealId: string;
  to: HandoverStatus;
  actor: StatusTransitionActor;
  /** Wajib bila meminta revisi (usulan perubahan deadline/termin). */
  comment?: string;
}

/**
 * Pindahkan status handover dengan seluruh aturan bisnis:
 * alur valid, termin seimbang saat pengajuan, putusan oleh PM,
 * komentar wajib saat Perlu Revisi, notifikasi + audit selalu.
 */
export async function transitionDealStatus(
  input: TransitionInput
): Promise<ServiceResult<DealHandover>> {
  const { data: found } = await getDeal(input.dealId);
  if (!found) {
    return { data: null, error: "Deal handover tidak ditemukan." };
  }
  const deal = found.deal;
  if (!ALLOWED_TRANSITIONS[deal.status].includes(input.to)) {
    return {
      data: null,
      error: `Status tidak dapat pindah dari ${deal.status} ke ${input.to}.`,
    };
  }

  const deciding = input.to === "Dikonfirmasi" || input.to === "Perlu Revisi";
  if (deciding && !canDecide(input.actor)) {
    return {
      data: null,
      error: "Hanya Project Manager (atau Super Admin) yang dapat mengonfirmasi handover.",
    };
  }
  const comment = (input.comment ?? "").trim();
  if (input.to === "Perlu Revisi" && !comment) {
    return {
      data: null,
      error: "Usulan perubahan deadline/termin wajib disertai komentar.",
    };
  }

  // Pengajuan ke Produksi mensyaratkan termin seimbang (FR-12).
  if (input.to === "Menunggu Konfirmasi Produksi") {
    const { data: terms } = await listTerms(deal.id);
    if (!terms) {
      return { data: null, error: "Termin tidak ditemukan." };
    }
    if (terms.terms.length === 0 || !terms.balanced) {
      return {
        data: null,
        error: "Termin belum seimbang dengan nilai deal. Lengkapi termin sebelum mengajukan.",
      };
    }
  }

  const oldStatus = deal.status;
  const { data: updated, error: statusError } = await setDealStatus(deal.id, input.to);
  if (statusError || !updated) {
    return { data: null, error: statusError ?? "Gagal mengubah status." };
  }

  await logAudit({
    actorId: input.actor.id,
    actorName: input.actor.name,
    action: "deal.status",
    entityType: "deal",
    entityId: deal.id,
    oldValue: oldStatus,
    newValue: input.to,
  });

  if (comment) {
    await addComment({
      entityType: "deal",
      entityId: deal.id,
      authorId: input.actor.id,
      body: comment,
    });
  }

  await pushNotification({
    type: "status",
    title: `Handover ${deal.code}: ${input.to}`,
    message: `${input.actor.name}: ${found.displayName} kini berstatus “${input.to}”.`,
    entityType: "deal",
    entityId: deal.id,
    actorName: input.actor.name,
  });

  return { data: updated, error: null };
}
