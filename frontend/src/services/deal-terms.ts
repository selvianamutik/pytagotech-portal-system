import { mockTerms } from "@/mocks/deal-terms";
import { listDeals } from "@/services/deals";
import type {
  PaymentTerm,
  PaymentTermInput,
  TermStatus,
} from "@/types/deal";
import { isTermStatus, termAmount } from "@/types/deal";
import { formatCurrency } from "@/lib/utils";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan termin pembayaran (US-016, FR-12). Fase 1: mock in-memory.
 * Termin disimpan sebagai SET per deal: `replaceTerms` memvalidasi
 * total = nilai deal dan menolak simpan bila tidak sama.
 * Fase 2: tabel `deal_payment_terms`.
 */

let termStore: PaymentTerm[] = structuredClone(mockTerms);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockTerms(): void {
  termStore = structuredClone(mockTerms);
}

export interface TermsSummary {
  terms: PaymentTerm[];
  totalAmount: number;
  dealValue: number;
  balanced: boolean;
}

export async function listTerms(dealId: string): Promise<ServiceResult<TermsSummary>> {
  const { data: deals } = await listDeals();
  const deal = (deals ?? []).find((item) => item.deal.id === dealId);
  if (!deal) {
    return { data: null, error: "Deal handover tidak ditemukan." };
  }
  const terms = termStore
    .filter((term) => term.dealId === dealId)
    .map((term) => ({ ...term }));
  const totalAmount = terms.reduce(
    (sum, term) => sum + termAmount(term, deal.deal.value),
    0
  );
  return {
    data: {
      terms,
      totalAmount,
      dealValue: deal.deal.value,
      balanced: totalAmount === deal.deal.value,
    },
    error: null,
  };
}

function validateTermRow(row: PaymentTermInput): string | null {
  if (row.name.trim().length === 0) {
    return "Nama termin wajib diisi.";
  }
  if (!Number.isFinite(row.value) || row.value <= 0) {
    return `Nilai termin "${row.name || "(tanpa nama)"}" harus lebih dari 0.`;
  }
  if (row.kind === "percent" && row.value > 100) {
    return `Persentase termin "${row.name}" maksimal 100%.`;
  }
  if (row.dueDate && Number.isNaN(Date.parse(row.dueDate))) {
    return `Tanggal termin "${row.name}" tidak valid.`;
  }
  if (!row.dueDate && !(row.milestone ?? "").trim()) {
    return `Termin "${row.name}" wajib memiliki tanggal atau milestone jatuh tempo.`;
  }
  return null;
}

/**
 * Simpan ulang seluruh set termin deal. Menolak bila total ≠ nilai deal
 * (FR-12) dengan pesan selisih yang jelas. Status termin lama dipertahankan
 * berdasarkan id; baris baru berstatus Belum Ditagih.
 */
export async function replaceTerms(
  dealId: string,
  inputs: PaymentTermInput[]
): Promise<ServiceResult<TermsSummary>> {
  const { data: deals } = await listDeals();
  const deal = (deals ?? []).find((item) => item.deal.id === dealId);
  if (!deal) {
    return { data: null, error: "Deal handover tidak ditemukan." };
  }
  if (deal.deal.status === "Dikonfirmasi") {
    return {
      data: null,
      error: "Termin handover Dikonfirmasi hanya bisa diubah via change request (US-018).",
    };
  }
  if (inputs.length === 0) {
    return { data: null, error: "Minimal satu termin." };
  }
  for (const row of inputs) {
    const rowError = validateTermRow(row);
    if (rowError) {
      return { data: null, error: rowError };
    }
  }
  const totalAmount = inputs.reduce(
    (sum, row) => sum + termAmount(row, deal.deal.value),
    0
  );
  if (totalAmount !== deal.deal.value) {
    const diff = totalAmount - deal.deal.value;
    const direction = diff > 0 ? "melebihi" : "kurang";
    return {
      data: null,
      error: `Total termin ${formatCurrency(totalAmount)} tidak sama dengan nilai deal ${formatCurrency(deal.deal.value)} (${direction} ${formatCurrency(Math.abs(diff))}).`,
    };
  }

  const kept = new Map(
    termStore.filter((term) => term.dealId === dealId).map((term) => [term.id, term])
  );
  const next: PaymentTerm[] = inputs.map((row, index) => {
    const existing = row.id ? kept.get(row.id) : undefined;
    return {
      id: existing?.id ?? `TRM-${String(termStore.length + index + 1).padStart(3, "0")}`,
      dealId,
      name: row.name.trim(),
      kind: row.kind,
      value: row.value,
      dueDate: row.dueDate || undefined,
      milestone: (row.milestone ?? "").trim() || undefined,
      status: existing?.status ?? "Belum Ditagih",
    };
  });
  termStore = [...termStore.filter((term) => term.dealId !== dealId), ...next];
  return listTerms(dealId);
}

export async function updateTermStatus(
  termId: string,
  status: TermStatus
): Promise<ServiceResult<PaymentTerm>> {
  if (!isTermStatus(status)) {
    return { data: null, error: "Status termin tidak dikenal." };
  }
  const term = termStore.find((item) => item.id === termId);
  if (!term) {
    return { data: null, error: "Termin tidak ditemukan." };
  }
  term.status = status;
  return { data: { ...term }, error: null };
}
