import { logAudit } from "@/services/audit";
import { listLeads } from "@/services/leads";
import type {
  InterestStage,
  InterestState,
  PipelineCard,
} from "@/types/interest";
import { isInterestStage } from "@/types/interest";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan pipeline Interested Leads (US-011, FR-8).
 * Anggota pipeline diturunkan otomatis dari lead berstatus Interest;
 * tahap & kebutuhan disimpan terpisah. Perubahan tahap dicatat audit
 * (`lead.move-stage`) sebagai bahan timeline US-012.
 */

const seedStates: InterestState[] = [
  {
    leadId: "LEAD-002",
    stage: "Demo",
    need: "Website company profile + katalog produk, estimasi 20 halaman.",
    updatedAt: "2026-10-03T05:00:00Z",
  },
  {
    leadId: "LEAD-006",
    stage: "Price Sent",
    need: "Paket pengelolaan sosmed 3 platform selama 3 bulan.",
    updatedAt: "2026-10-02T04:00:00Z",
  },
];

let interestStore: InterestState[] = structuredClone(seedStates);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockInterest(): void {
  interestStore = structuredClone(seedStates);
}

function stateFor(leadId: string): InterestState {
  let state = interestStore.find((item) => item.leadId === leadId);
  if (!state) {
    state = {
      leadId,
      stage: "New Interest",
      need: "",
      updatedAt: new Date().toISOString(),
    };
    interestStore.push(state);
  }
  return state;
}

export async function getPipeline(): Promise<ServiceResult<PipelineCard[]>> {
  const { data: leads } = await listLeads();
  const cards: PipelineCard[] =
    (leads ?? [])
      .filter((lead) => lead.status === "Interest")
      .map((lead) => {
        const state = stateFor(lead.id);
        return {
          lead: { ...lead },
          stage: state.stage,
          need: state.need,
          updatedAt: state.updatedAt,
        };
      });
  return { data: cards, error: null };
}

export async function moveInterestStage(
  leadId: string,
  stage: InterestStage,
  actor: { id: string; name: string }
): Promise<ServiceResult<PipelineCard>> {
  if (!isInterestStage(stage)) {
    return { data: null, error: "Tahapan pipeline tidak dikenal." };
  }
  const { data: leads } = await listLeads();
  const lead = (leads ?? []).find((item) => item.id === leadId);
  if (!lead) {
    return { data: null, error: "Lead tidak ditemukan." };
  }
  if (lead.status !== "Interest") {
    return { data: null, error: "Hanya lead berstatus Interest yang masuk pipeline." };
  }

  const state = stateFor(leadId);
  const oldStage = state.stage;
  state.stage = stage;
  state.updatedAt = new Date().toISOString();

  if (oldStage !== stage) {
    await logAudit({
      actorId: actor.id,
      actorName: actor.name,
      action: "lead.move-stage",
      entityType: "lead",
      entityId: leadId,
      oldValue: oldStage,
      newValue: stage,
    });
  }
  return {
    data: { lead: { ...lead }, stage, need: state.need, updatedAt: state.updatedAt },
    error: null,
  };
}

export async function updateInterestNeed(
  leadId: string,
  need: string
): Promise<ServiceResult<PipelineCard>> {
  const { data: leads } = await listLeads();
  const lead = (leads ?? []).find((item) => item.id === leadId);
  if (!lead) {
    return { data: null, error: "Lead tidak ditemukan." };
  }
  const state = stateFor(leadId);
  state.need = need.trim();
  state.updatedAt = new Date().toISOString();
  return {
    data: { lead: { ...lead }, stage: state.stage, need: state.need, updatedAt: state.updatedAt },
    error: null,
  };
}
