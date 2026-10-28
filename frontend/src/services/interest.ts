import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/services/audit";
import { getLead, listLeads } from "@/services/leads";
import type {
  InterestStage,
  PipelineCard,
} from "@/types/interest";
import { isInterestStage } from "@/types/interest";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan pipeline Interested Leads (US-011, FR-8).
 *
 * Menggunakan database Supabase (tabel `leads` dan `lead_interests`).
 * Anggota pipeline diturunkan otomatis dari lead berstatus Interest;
 * tahap & kebutuhan disimpan di tabel `lead_interests` yang berelasi 1:1 via FK `lead_id`.
 *
 * Perubahan tahap dicatat audit (`lead.move-stage`) sebagai bahan timeline US-012.
 */

interface LeadInterestRow {
  lead_id: string;
  stage: string;
  need: string | null;
}

/** Fungsi backward-compatibility untuk test runner */
export function resetMockInterest(): void {
  // Database-backed — pembersihan ditangani oleh fake Supabase per-test.
}

export async function getPipeline(): Promise<ServiceResult<PipelineCard[]>> {
  const supabase = createClient();

  const [leadsResult, mappingResult, interestsResult] = await Promise.all([
    listLeads(),
    supabase
      .from("leads")
      .select("id, display_id")
      .eq("status", "Interest")
      .is("archived_at", null),
    supabase
      .from("lead_interests")
      .select("lead_id, stage, need"),
  ]);

  if (leadsResult.error) {
    return { data: null, error: leadsResult.error };
  }
  if (mappingResult.error) {
    return { data: null, error: mappingResult.error.message };
  }
  if (interestsResult.error) {
    return { data: null, error: interestsResult.error.message };
  }

  const leads = (leadsResult.data ?? []).filter((lead) => lead.status === "Interest");
  const uuidToDisplay = new Map<string, string>(
    ((mappingResult.data ?? []) as { id: string; display_id: string }[]).map(
      (row) => [row.id, row.display_id]
    )
  );

  const interestByDisplayId = new Map<string, LeadInterestRow>();
  for (const item of (interestsResult.data ?? []) as LeadInterestRow[]) {
    const displayId = uuidToDisplay.get(item.lead_id);
    if (displayId) {
      interestByDisplayId.set(displayId, item);
    }
  }

  const cards: PipelineCard[] = leads.map((lead) => {
    const interest = interestByDisplayId.get(lead.id);
    return {
      lead: { ...lead },
      stage: (interest?.stage as InterestStage) ?? "New Interest",
      need: interest?.need ?? "",
      updatedAt: lead.updatedAt,
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

  const supabase = createClient();
  const { data: leadRow, error: leadError } = await supabase
    .from("leads")
    .select("id, display_id, status")
    .eq("display_id", leadId)
    .is("archived_at", null)
    .maybeSingle();

  if (leadError) {
    return { data: null, error: leadError.message };
  }
  if (!leadRow) {
    return { data: null, error: "Lead tidak ditemukan." };
  }
  if (leadRow.status !== "Interest") {
    return { data: null, error: "Hanya lead berstatus Interest yang masuk pipeline." };
  }

  const { data: existingInterest } = await supabase
    .from("lead_interests")
    .select("stage, need")
    .eq("lead_id", leadRow.id)
    .maybeSingle();

  const oldStage = (existingInterest?.stage as InterestStage) ?? "New Interest";

  const { error: upsertError } = await supabase
    .from("lead_interests")
    .upsert({
      lead_id: leadRow.id,
      stage: stage,
      need: existingInterest?.need ?? "",
    });

  if (upsertError) {
    return { data: null, error: upsertError.message };
  }

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

  const leadResult = await getLead(leadId);
  if (leadResult.error || !leadResult.data) {
    return { data: null, error: leadResult.error ?? "Lead tidak ditemukan." };
  }

  return {
    data: {
      lead: leadResult.data,
      stage,
      need: existingInterest?.need ?? "",
      updatedAt: new Date().toISOString(),
    },
    error: null,
  };
}

export async function updateInterestNeed(
  leadId: string,
  need: string
): Promise<ServiceResult<PipelineCard>> {
  const supabase = createClient();
  const { data: leadRow, error: leadError } = await supabase
    .from("leads")
    .select("id, display_id, status")
    .eq("display_id", leadId)
    .is("archived_at", null)
    .maybeSingle();

  if (leadError) {
    return { data: null, error: leadError.message };
  }
  if (!leadRow) {
    return { data: null, error: "Lead tidak ditemukan." };
  }

  const { data: existingInterest } = await supabase
    .from("lead_interests")
    .select("stage, need")
    .eq("lead_id", leadRow.id)
    .maybeSingle();

  const stage = (existingInterest?.stage as InterestStage) ?? "New Interest";
  const trimmedNeed = need.trim();

  const { error: upsertError } = await supabase
    .from("lead_interests")
    .upsert({
      lead_id: leadRow.id,
      stage,
      need: trimmedNeed,
    });

  if (upsertError) {
    return { data: null, error: upsertError.message };
  }

  const leadResult = await getLead(leadId);
  if (leadResult.error || !leadResult.data) {
    return { data: null, error: leadResult.error ?? "Lead tidak ditemukan." };
  }

  return {
    data: {
      lead: leadResult.data,
      stage,
      need: trimmedNeed,
      updatedAt: new Date().toISOString(),
    },
    error: null,
  };
}
