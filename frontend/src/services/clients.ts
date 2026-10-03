import { mockClients } from "@/mocks/clients";
import { listLeads } from "@/services/leads";
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from "@/types/client";
import { isValidEmail, isValidWhatsapp, normalizeWhatsapp } from "@/lib/validators";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan Master Klien (US-014, FR-9). Fase 1: mock in-memory.
 * Fase 2: tabel `clients` + relasi 1-N ke `deals`/`projects`.
 */

let clientStore: Client[] = structuredClone(mockClients);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockClients(): void {
  clientStore = structuredClone(mockClients);
}

export interface SaveClientResult extends ServiceResult<Client> {
  /** Peringatan non-blokir (perusahaan sudah terdaftar). */
  warning: string | null;
}

function validateClientInput(input: CreateClientInput): string | null {
  if (input.companyName.trim().length === 0) {
    return "Nama perusahaan/entitas wajib diisi.";
  }
  if (input.picName.trim().length === 0) {
    return "Nama PIC/Direktur wajib diisi.";
  }
  if (!isValidWhatsapp(input.phone)) {
    return "Format telepon/WhatsApp tidak valid (contoh: 0812-3456-7890).";
  }
  if (!isValidEmail(input.email)) {
    return "Format email tidak valid.";
  }
  if (input.referrer.trim().length === 0) {
    return "Referrer (sumber lead) wajib diisi.";
  }
  return null;
}

function findSameCompany(companyName: string, excludeId?: string): Client[] {
  const normalized = companyName.trim().toLowerCase();
  return clientStore.filter(
    (client) => client.id !== excludeId && client.companyName.trim().toLowerCase() === normalized
  );
}

export async function listClients(): Promise<ServiceResult<Client[]>> {
  return {
    data: [...clientStore]
      .sort((a, b) => a.companyName.localeCompare(b.companyName))
      .map((client) => ({ ...client })),
    error: null,
  };
}

export async function getClient(clientId: string): Promise<ServiceResult<Client>> {
  const client = clientStore.find((item) => item.id === clientId);
  if (!client) {
    return { data: null, error: "Klien tidak ditemukan." };
  }
  return { data: { ...client }, error: null };
}

export async function createClient(
  input: CreateClientInput
): Promise<SaveClientResult> {
  const validationError = validateClientInput(input);
  if (validationError) {
    return { data: null, error: validationError, warning: null };
  }
  const same = findSameCompany(input.companyName);
  const now = new Date().toISOString();
  const client: Client = {
    id: `KLI-${String(clientStore.length + 1).padStart(3, "0")}`,
    companyName: input.companyName.trim(),
    picName: input.picName.trim(),
    phone: normalizeWhatsapp(input.phone),
    email: input.email.trim().toLowerCase(),
    referrer: input.referrer.trim(),
    sourceLeadId: input.sourceLeadId,
    createdAt: now,
    updatedAt: now,
  };
  clientStore.push(client);
  return {
    data: { ...client },
    error: null,
    warning:
      same.length > 0
        ? `Perusahaan sudah terdaftar sebagai ${same.map((item) => item.id).join(", ")}.`
        : null,
  };
}

export async function updateClient(
  clientId: string,
  input: UpdateClientInput
): Promise<SaveClientResult> {
  const client = clientStore.find((item) => item.id === clientId);
  if (!client) {
    return { data: null, error: "Klien tidak ditemukan.", warning: null };
  }
  const merged: CreateClientInput = {
    companyName: input.companyName ?? client.companyName,
    picName: input.picName ?? client.picName,
    phone: input.phone ?? client.phone,
    email: input.email ?? client.email,
    referrer: input.referrer ?? client.referrer,
    sourceLeadId: input.sourceLeadId ?? client.sourceLeadId,
  };
  const validationError = validateClientInput(merged);
  if (validationError) {
    return { data: null, error: validationError, warning: null };
  }
  client.companyName = merged.companyName.trim();
  client.picName = merged.picName.trim();
  client.phone = normalizeWhatsapp(merged.phone);
  client.email = merged.email.trim().toLowerCase();
  client.referrer = merged.referrer.trim();
  client.updatedAt = new Date().toISOString();
  const same = findSameCompany(merged.companyName, clientId);
  return {
    data: { ...client },
    error: null,
    warning:
      same.length > 0
        ? `Perusahaan sudah terdaftar sebagai ${same.map((item) => item.id).join(", ")}.`
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
  const { data: leads } = await listLeads();
  const converted = new Set(
    clientStore
      .map((client) => client.sourceLeadId)
      .filter((id): id is string => Boolean(id))
  );
  return {
    data: (leads ?? [])
      .filter((lead) => lead.status === "Closing" && !converted.has(lead.id))
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
  const { data: leads } = await listLeads();
  const lead = (leads ?? []).find((item) => item.id === leadId);
  if (!lead) {
    return { data: null, error: "Lead tidak ditemukan.", warning: null };
  }
  if (lead.status !== "Closing") {
    return {
      data: null,
      error: "Hanya lead berstatus Closing yang dapat dijadikan klien.",
      warning: null,
    };
  }
  if (clientStore.some((client) => client.sourceLeadId === leadId)) {
    return {
      data: null,
      error: "Lead ini sudah dijadikan klien.",
      warning: null,
    };
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
