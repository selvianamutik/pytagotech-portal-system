import { createClient as getSupabaseClient } from "@/lib/supabase/client";
import type {
  PaymentTerm,
  PaymentTermInput,
  TermStatus,
} from "@/types/deal";
import { isTermStatus, termAmount } from "@/types/deal";
import { formatCurrency } from "@/lib/utils";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan termin pembayaran (US-016, FR-12).
 *
 * Menggunakan database Supabase (tabel `deal_payment_terms` dan `deals`).
 * Termin disimpan sebagai SET per deal: `replaceTerms` memvalidasi
 * total = nilai deal dan menolak simpan bila tidak sama.
 */

interface DealPaymentTermRow {
  id: string;
  deal_id: string;
  name: string;
  kind: "percent" | "amount";
  value: number;
  due_date: string | null;
  milestone: string | null;
  status: string;
}

const TERM_COLUMNS = "id, deal_id, name, kind, value, due_date, milestone, status";

/** Backward-compat no-op for tests */
export function resetMockTerms(): void {}

export interface TermsSummary {
  terms: PaymentTerm[];
  totalAmount: number;
  dealValue: number;
  balanced: boolean;
}

function rowToTerm(row: DealPaymentTermRow, dealDisplayId: string): PaymentTerm {
  return {
    id: row.id,
    dealId: dealDisplayId,
    name: row.name,
    kind: row.kind,
    value: Number(row.value),
    dueDate: row.due_date ?? undefined,
    milestone: row.milestone ?? undefined,
    status: row.status as TermStatus,
  };
}

export async function listTerms(dealId: string): Promise<ServiceResult<TermsSummary>> {
  const supabase = getSupabaseClient();
  const { data: dealRow, error: dealError } = await supabase
    .from("deals")
    .select("id, display_id, value_idr")
    .eq("display_id", dealId)
    .maybeSingle();

  if (dealError) return { data: null, error: dealError.message };
  if (!dealRow) return { data: null, error: "Deal handover tidak ditemukan." };

  const { data: termsData, error: termsError } = await supabase
    .from("deal_payment_terms")
    .select(TERM_COLUMNS)
    .eq("deal_id", dealRow.id);

  if (termsError) return { data: null, error: termsError.message };

  const terms = ((termsData ?? []) as DealPaymentTermRow[]).map((r) =>
    rowToTerm(r, dealRow.display_id)
  );

  const dealValue = Number(dealRow.value_idr);
  const totalAmount = terms.reduce(
    (sum, term) => sum + termAmount(term, dealValue),
    0
  );

  return {
    data: {
      terms,
      totalAmount,
      dealValue,
      balanced: totalAmount === dealValue,
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
  const supabase = getSupabaseClient();
  const { data: dealRow, error: dealError } = await supabase
    .from("deals")
    .select("id, display_id, value_idr, status")
    .eq("display_id", dealId)
    .maybeSingle();

  if (dealError) return { data: null, error: dealError.message };
  if (!dealRow) return { data: null, error: "Deal handover tidak ditemukan." };

  if (dealRow.status === "Dikonfirmasi") {
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

  const dealValue = Number(dealRow.value_idr);
  const totalAmount = inputs.reduce(
    (sum, row) => sum + termAmount(row, dealValue),
    0
  );

  if (totalAmount !== dealValue) {
    const diff = totalAmount - dealValue;
    const direction = diff > 0 ? "melebihi" : "kurang";
    return {
      data: null,
      error: `Total termin ${formatCurrency(totalAmount)} tidak sama dengan nilai deal ${formatCurrency(dealValue)} (${direction} ${formatCurrency(Math.abs(diff))}).`,
    };
  }

  // Ambil existing terms untuk mempertahankan status jika ID sama
  const { data: existingTerms } = await supabase
    .from("deal_payment_terms")
    .select(TERM_COLUMNS)
    .eq("deal_id", dealRow.id);

  const existingMap = new Map(
    ((existingTerms ?? []) as DealPaymentTermRow[]).map((t) => [t.id, t])
  );

  // Hapus semua termin lama untuk deal ini
  await supabase.from("deal_payment_terms").delete().eq("deal_id", dealRow.id);

  // Masukkan termin baru
  const insertPayload = inputs.map((row) => {
    const old = row.id ? existingMap.get(row.id) : undefined;
    return {
      ...(row.id ? { id: row.id } : {}),
      deal_id: dealRow.id,
      name: row.name.trim(),
      kind: row.kind,
      value: row.value,
      due_date: row.dueDate || null,
      milestone: (row.milestone ?? "").trim() || null,
      status: old?.status ?? "Belum Ditagih",
    };
  });

  const { error: insertError } = await supabase
    .from("deal_payment_terms")
    .insert(insertPayload);

  if (insertError) {
    return { data: null, error: insertError.message };
  }

  return listTerms(dealId);
}

export async function updateTermStatus(
  termId: string,
  status: TermStatus
): Promise<ServiceResult<PaymentTerm>> {
  if (!isTermStatus(status)) {
    return { data: null, error: "Status termin tidak dikenal." };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("deal_payment_terms")
    .update({ status })
    .eq("id", termId)
    .select(TERM_COLUMNS)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Termin tidak ditemukan." };

  const termRow = data as DealPaymentTermRow;
  const { data: deal } = await supabase
    .from("deals")
    .select("display_id")
    .eq("id", termRow.deal_id)
    .maybeSingle();

  return {
    data: rowToTerm(termRow, (deal as { display_id: string } | null)?.display_id ?? ""),
    error: null,
  };
}
