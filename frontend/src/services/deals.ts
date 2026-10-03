import { mockDeals } from "@/mocks/deals";
import { listClients } from "@/services/clients";
import type {
  CreateDealInput,
  DealHandover,
  UpdateDealInput,
} from "@/types/deal";
import { formatDealName } from "@/types/deal";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan Deal Handover (US-015, FR-11). Fase 1: mock in-memory.
 * Fase 2: tabel `deals` + trigger display ID & validasi kode unik.
 * Status flow (US-017) dan change request (US-018) menyusul.
 */

let dealStore: DealHandover[] = structuredClone(mockDeals);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockDeals(): void {
  dealStore = structuredClone(mockDeals);
}

export interface DealWithClient {
  deal: DealHandover;
  clientName: string;
  /** Nama terformat otomatis (FR-11). */
  displayName: string;
}

function validateDealInput(input: CreateDealInput, clientIds: string[]): string | null {
  if (input.title.trim().length === 0) {
    return "Judul proyek wajib diisi.";
  }
  if (input.code.trim().length === 0) {
    return "Kode proyek wajib diisi.";
  }
  if (!clientIds.includes(input.clientId)) {
    return "Klien tidak dikenal.";
  }
  if (input.scope.trim().length === 0) {
    return "Scope wajib diisi.";
  }
  if (input.features.length === 0) {
    return "Minimal satu fitur (dengan penjelasan).";
  }
  for (const feature of input.features) {
    if (feature.name.trim().length === 0 || feature.description.trim().length === 0) {
      return "Setiap fitur wajib memiliki nama dan penjelasan.";
    }
  }
  if (input.objective.trim().length === 0) {
    return "Objektif akhir wajib diisi.";
  }
  if (!Number.isFinite(input.value) || input.value <= 0) {
    return "Nilai deal harus lebih dari 0.";
  }
  if (input.termScheme.trim().length === 0) {
    return "Skema termin wajib diisi.";
  }
  if (Number.isNaN(Date.parse(input.deadline))) {
    return "Target deadline tidak valid.";
  }
  return null;
}

export async function listDeals(): Promise<ServiceResult<DealWithClient[]>> {
  const { data: clients } = await listClients();
  const names = new Map((clients ?? []).map((client) => [client.id, client.companyName]));
  return {
    data: [...dealStore]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((deal) => {
        const clientName = names.get(deal.clientId) ?? "Klien tidak dikenal";
        return {
          deal: structuredClone(deal),
          clientName,
          displayName: formatDealName(deal.title, clientName, deal.code),
        };
      }),
    error: null,
  };
}

export async function getDeal(dealId: string): Promise<ServiceResult<DealWithClient>> {
  const { data } = await listDeals();
  const found = (data ?? []).find((item) => item.deal.id === dealId);
  if (!found) {
    return { data: null, error: "Deal handover tidak ditemukan." };
  }
  return { data: found, error: null };
}

export async function createDeal(
  input: CreateDealInput
): Promise<ServiceResult<DealHandover>> {
  const { data: clients } = await listClients();
  const validationError = validateDealInput(
    input,
    (clients ?? []).map((client) => client.id)
  );
  if (validationError) {
    return { data: null, error: validationError };
  }
  const codeTaken = dealStore.some(
    (deal) => deal.code.trim().toLowerCase() === input.code.trim().toLowerCase()
  );
  if (codeTaken) {
    return { data: null, error: `Kode proyek ${input.code.trim()} sudah dipakai.` };
  }
  const now = new Date().toISOString();
  const deal: DealHandover = {
    id: `HDV-${String(dealStore.length + 1).padStart(3, "0")}`,
    title: input.title.trim(),
    code: input.code.trim(),
    clientId: input.clientId,
    scope: input.scope.trim(),
    features: input.features.map((feature) => ({
      name: feature.name.trim(),
      description: feature.description.trim(),
    })),
    objective: input.objective.trim(),
    value: input.value,
    termScheme: input.termScheme.trim(),
    deadline: input.deadline,
    notes: input.notes.trim(),
    status: "Draft",
    versions: [
      { version: 1, value: input.value, deadline: input.deadline, note: "Versi awal saat handover dibuat.", createdAt: now },
    ],
    createdAt: now,
    updatedAt: now,
  };
  dealStore.push(deal);
  return { data: structuredClone(deal), error: null };
}

export async function updateDeal(
  dealId: string,
  input: UpdateDealInput
): Promise<ServiceResult<DealHandover>> {
  const deal = dealStore.find((item) => item.id === dealId);
  if (!deal) {
    return { data: null, error: "Deal handover tidak ditemukan." };
  }
  if (deal.status === "Dikonfirmasi") {
    return {
      data: null,
      error: "Handover yang Dikonfirmasi hanya bisa diubah via change request (US-018).",
    };
  }
  const { data: clients } = await listClients();
  const merged: CreateDealInput = {
    title: input.title ?? deal.title,
    code: input.code ?? deal.code,
    clientId: input.clientId ?? deal.clientId,
    scope: input.scope ?? deal.scope,
    features: input.features ?? deal.features,
    objective: input.objective ?? deal.objective,
    value: input.value ?? deal.value,
    termScheme: input.termScheme ?? deal.termScheme,
    deadline: input.deadline ?? deal.deadline,
    notes: input.notes ?? deal.notes,
  };
  const validationError = validateDealInput(
    merged,
    (clients ?? []).map((client) => client.id)
  );
  if (validationError) {
    return { data: null, error: validationError };
  }
  const codeTaken = dealStore.some(
    (other) =>
      other.id !== dealId &&
      other.code.trim().toLowerCase() === merged.code.trim().toLowerCase()
  );
  if (codeTaken) {
    return { data: null, error: `Kode proyek ${merged.code.trim()} sudah dipakai.` };
  }
  Object.assign(deal, {
    title: merged.title.trim(),
    code: merged.code.trim(),
    clientId: merged.clientId,
    scope: merged.scope.trim(),
    features: merged.features.map((feature) => ({
      name: feature.name.trim(),
      description: feature.description.trim(),
    })),
    objective: merged.objective.trim(),
    value: merged.value,
    termScheme: merged.termScheme.trim(),
    deadline: merged.deadline,
    notes: merged.notes.trim(),
    updatedAt: new Date().toISOString(),
  });
  return { data: structuredClone(deal), error: null };
}
