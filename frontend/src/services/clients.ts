import { createClient as getSupabaseClient } from "@/lib/supabase/client";
import { getLead, listLeads } from "@/services/leads";
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from "@/types/client";
import { isValidEmail, isValidWhatsapp, normalizeWhatsapp } from "@/lib/validators";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan Master Klien (US-014, FR-9).
 *
 * Menggunakan database Supabase (tabel `clients`).
 * `display_id` dibuat otomatis via trigger database (`set_display_id('seq_client_no', 'KLI-', '3')`).
 * Relasi 1-N ke `deals` dan `projects`.
 */

interface ClientRow {
  id: string;
  display_id: string;
  company_name: string;
  pic_name: string | null;
  phone: string;
  email: string;
  referrer: string | null;
  source_lead_id: string | null;
  created_at: string;
  updated_at: string;
}

const CLIENT_COLUMNS =
  "id, display_id, company_name, pic_name, phone, email, referrer, source_lead_id, created_at, updated_at";

export interface SaveClientResult extends ServiceResult<Client> {
  /** Peringatan non-blokir (perusahaan sudah terdaftar). */
  warning: string | null;
}

/** Fungsi backward-compatibility untuk test runner */
export function resetMockClients(): void {
  // Database-backed — pembersihan ditangani oleh fake Supabase per-test.
}

function validateClientInput(input: CreateClientInput): string | null {
  if (!input || !input.companyName || input.companyName.trim().length === 0) {
    return "Nama perusahaan/entitas wajib diisi.";
  }
  if (!input.picName || input.picName.trim().length === 0) {
    return "Nama PIC/Direktur wajib diisi.";
  }
  if (!isValidWhatsapp(input.phone)) {
    return "Format telepon/WhatsApp tidak valid (contoh: 0812-3456-7890).";
  }
  if (!isValidEmail(input.email)) {
    return "Format email tidak valid.";
  }
  if (!input.referrer || input.referrer.trim().length === 0) {
    return "Referrer (sumber lead) wajib diisi.";
  }
  return null;
}

function toClient(row: ClientRow, leadUuidToDisplay: Map<string, string>): Client {
  return {
    id: row.display_id,
    companyName: row.company_name,
    picName: row.pic_name ?? "",
    phone: row.phone,
    email: row.email,
    referrer: row.referrer ?? "",
    sourceLeadId: row.source_lead_id ? leadUuidToDisplay.get(row.source_lead_id) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getLeadMappings(): Promise<{
  uuidToDisplay: Map<string, string>;
  displayToUuid: Map<string, string>;
}> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("leads")
    .select("id, display_id");

  const uuidToDisplay = new Map<string, string>();
  const displayToUuid = new Map<string, string>();

  for (const row of (data ?? []) as { id: string; display_id: string }[]) {
    uuidToDisplay.set(row.id, row.display_id);
    displayToUuid.set(row.display_id, row.id);
  }

  return { uuidToDisplay, displayToUuid };
}

export async function listClients(): Promise<ServiceResult<Client[]>> {
  const supabase = getSupabaseClient();
  const [clientsResult, mappings] = await Promise.all([
    supabase
      .from("clients")
      .select(CLIENT_COLUMNS)
      .order("company_name", { ascending: true }),
    getLeadMappings(),
  ]);

  if (clientsResult.error) {
    return { data: null, error: clientsResult.error.message };
  }

  const clients = ((clientsResult.data ?? []) as ClientRow[]).map((row) =>
    toClient(row, mappings.uuidToDisplay)
  );

  return { data: clients, error: null };
}

export async function getClient(clientId: string): Promise<ServiceResult<Client>> {
  const supabase = getSupabaseClient();
  const [clientResult, mappings] = await Promise.all([
    supabase
      .from("clients")
      .select(CLIENT_COLUMNS)
      .eq("display_id", clientId)
      .maybeSingle(),
    getLeadMappings(),
  ]);

  if (clientResult.error) {
    return { data: null, error: clientResult.error.message };
  }
  if (!clientResult.data) {
    return { data: null, error: "Klien tidak ditemukan." };
  }

  return {
    data: toClient(clientResult.data as ClientRow, mappings.uuidToDisplay),
    error: null,
  };
}

export async function createClient(
  input: CreateClientInput
): Promise<SaveClientResult> {
  const validationError = validateClientInput(input);
  if (validationError) {
    return { data: null, error: validationError, warning: null };
  }

  const supabase = getSupabaseClient();
  const normalizedName = input.companyName.trim();

  // Cek perusahaan dengan nama yang sama (case-insensitive)
  const { data: existingSame } = await supabase
    .from("clients")
    .select("id, display_id, company_name")
    .ilike("company_name", normalizedName);

  const same = (existingSame ?? []) as { id: string; display_id: string; company_name: string }[];

  const mappings = await getLeadMappings();
  const sourceLeadUuid = input.sourceLeadId
    ? mappings.displayToUuid.get(input.sourceLeadId) ?? null
    : null;

  const { data, error } = await supabase
    .from("clients")
    .insert({
      company_name: normalizedName,
      pic_name: input.picName.trim(),
      phone: normalizeWhatsapp(input.phone),
      email: input.email.trim().toLowerCase(),
      referrer: input.referrer.trim(),
      source_lead_id: sourceLeadUuid,
    })
    .select(CLIENT_COLUMNS)
    .single();

  if (error) {
    return { data: null, error: error.message, warning: null };
  }

  return {
    data: toClient(data as ClientRow, mappings.uuidToDisplay),
    error: null,
    warning:
      same.length > 0
        ? `Perusahaan sudah terdaftar sebagai ${same.map((item) => item.display_id).join(", ")}.`
        : null,
  };
}

export async function updateClient(
  clientId: string,
  input: UpdateClientInput
): Promise<SaveClientResult> {
  const supabase = getSupabaseClient();
  const { data: current, error: fetchError } = await supabase
    .from("clients")
    .select(CLIENT_COLUMNS)
    .eq("display_id", clientId)
    .maybeSingle();

  if (fetchError) {
    return { data: null, error: fetchError.message, warning: null };
  }
  if (!current) {
    return { data: null, error: "Klien tidak ditemukan.", warning: null };
  }

  const currentRow = current as ClientRow;
  const merged: CreateClientInput = {
    companyName: input.companyName ?? currentRow.company_name,
    picName: input.picName ?? currentRow.pic_name ?? "",
    phone: input.phone ?? currentRow.phone,
    email: input.email ?? currentRow.email,
    referrer: input.referrer ?? currentRow.referrer ?? "",
    sourceLeadId: input.sourceLeadId,
  };

  const validationError = validateClientInput(merged);
  if (validationError) {
    return { data: null, error: validationError, warning: null };
  }

  const normalizedName = merged.companyName.trim();
  const { data: existingSame } = await supabase
    .from("clients")
    .select("id, display_id, company_name")
    .ilike("company_name", normalizedName);

  const same = ((existingSame ?? []) as { id: string; display_id: string; company_name: string }[]).filter(
    (item) => item.display_id !== clientId
  );

  const mappings = await getLeadMappings();
  const sourceLeadUuid = merged.sourceLeadId
    ? mappings.displayToUuid.get(merged.sourceLeadId) ?? null
    : currentRow.source_lead_id;

  const { data, error: updateError } = await supabase
    .from("clients")
    .update({
      company_name: normalizedName,
      pic_name: merged.picName.trim(),
      phone: normalizeWhatsapp(merged.phone),
      email: merged.email.trim().toLowerCase(),
      referrer: merged.referrer.trim(),
      source_lead_id: sourceLeadUuid,
    })
    .eq("display_id", clientId)
    .select(CLIENT_COLUMNS)
    .single();

  if (updateError) {
    return { data: null, error: updateError.message, warning: null };
  }

  return {
    data: toClient(data as ClientRow, mappings.uuidToDisplay),
    error: null,
    warning:
      same.length > 0
        ? `Perusahaan sudah terdaftar sebagai ${same.map((item) => item.display_id).join(", ")}.`
        : null,
  };
}

export interface ClosingLeadOption {
  id: string;
  companyName: string;
  whatsapp: string;
  email: string;
}

/**
 * Lead Closing yang belum dijadikan klien — bahan tombol
 * "Jadikan klien" (FR-9: tanpa input ulang).
 */
export async function listConvertibleLeads(): Promise<
  ServiceResult<ClosingLeadOption[]>
> {
  const supabase = getSupabaseClient();
  const [{ data: leads, error: leadsError }, { data: clients, error: clientsError }, mappings] =
    await Promise.all([
      listLeads(),
      supabase
        .from("clients")
        .select("source_lead_id")
        .not("source_lead_id", "is", null),
      getLeadMappings(),
    ]);

  if (leadsError) {
    return { data: null, error: leadsError };
  }
  if (clientsError) {
    return { data: null, error: clientsError.message };
  }

  const convertedLeadDisplayIds = new Set(
    ((clients ?? []) as { source_lead_id: string }[])
      .map((c) => mappings.uuidToDisplay.get(c.source_lead_id))
      .filter((id): id is string => Boolean(id))
  );

  return {
    data: (leads ?? [])
      .filter((lead) => lead.status === "Closing" && !convertedLeadDisplayIds.has(lead.id))
      .map((lead) => ({
        id: lead.id,
        companyName: lead.companyName,
        whatsapp: lead.whatsapp,
        email: lead.email,
      })),
    error: null,
  };
}

/**
 * Buat klien otomatis dari lead Closing: data terisi dari lead,
 * PIC/Direktur dan referrer dilengkapi user (tidak ada di lead).
 */
export async function createClientFromLead(
  leadId: string,
  extra: { picName: string; referrer: string }
): Promise<SaveClientResult> {
  const leadResult = await getLead(leadId);
  if (leadResult.error || !leadResult.data) {
    return { data: null, error: "Lead tidak ditemukan.", warning: null };
  }

  const lead = leadResult.data;
  if (lead.status !== "Closing") {
    return {
      data: null,
      error: "Hanya lead berstatus Closing yang dapat dijadikan klien.",
      warning: null,
    };
  }

  const supabase = getSupabaseClient();
  const mappings = await getLeadMappings();
  const leadUuid = mappings.displayToUuid.get(leadId);

  if (leadUuid) {
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("source_lead_id", leadUuid)
      .maybeSingle();

    if (existingClient) {
      return {
        data: null,
        error: "Lead ini sudah dijadikan klien.",
        warning: null,
      };
    }
  }

  return createClient({
    companyName: lead.companyName,
    picName: extra.picName,
    phone: lead.whatsapp,
    email: lead.email,
    referrer: extra.referrer,
    sourceLeadId: lead.id,
  });
}
