import {
  createLead,
  findDuplicates,
  listLeadPICs,
  validateLeadInput,
} from "@/services/leads";
import { normalizeWhatsapp } from "@/lib/validators";
import type { CreateLeadInput } from "@/types/lead";
import type { ServiceResult } from "@/services/result";

/**
 * Impor lead dari CSV (US-010, untuk lead baru ke depan —
 * bukan migrasi data lama sesuai Non-Goals PRD).
 * Alur: unggah → preview valid/tidak-valid/duplikat → konfirmasi.
 */

export const LEAD_CSV_HEADERS = [
  "companyName",
  "industry",
  "contactDate",
  "whatsapp",
  "instagram",
  "email",
  "picName",
  "status",
] as const;

/** Template CSV yang bisa diunduh user (dipakai komponen impor). */
export const LEAD_CSV_TEMPLATE = [
  LEAD_CSV_HEADERS.join(","),
  "PT Contoh Abadi,Teknologi,2026-10-04,081234560000,@contohabadi,halo@contohabadi.id,Feby,New",
].join("\n");

export interface CsvImportRow {
  lineNumber: number;
  input: CreateLeadInput;
  errors: string[];
  duplicateWith: string[];
}

/** Parser CSV minimal: dukung koma dalam kutip dan kutip ganda (""). */
export function parseLeadCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    current.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    // Abaikan baris kosong (mis. newline terakhir).
    if (!(current.length === 1 && current[0].trim() === "")) {
      rows.push(current);
    }
    current = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\r") {
      // Abaikan; newline ditangani "\n".
    } else if (char === "\n") {
      pushRow();
    } else {
      field += char;
    }
  }
  if (field !== "" || current.length > 0) {
    pushRow();
  }
  return rows;
}

function headerMatches(header: string[]): boolean {
  return (
    header.length === LEAD_CSV_HEADERS.length &&
    LEAD_CSV_HEADERS.every((name, index) => header[index]?.trim() === name)
  );
}

export interface ImportPreview {
  rows: CsvImportRow[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
}

/**
 * Validasi seluruh baris tanpa menyimpan (tahap preview).
 * Duplikat dicek terhadap data tersimpan DAN antar-baris file.
 */
export async function previewLeadImport(
  csvText: string
): Promise<ServiceResult<ImportPreview>> {
  const rawRows = parseLeadCsv(csvText);
  if (rawRows.length === 0) {
    return { data: null, error: "File CSV kosong." };
  }
  const [header, ...body] = rawRows;
  if (!headerMatches(header)) {
    return {
      data: null,
      error: `Header tidak sesuai template. Harus: ${LEAD_CSV_HEADERS.join(",")}.`,
    };
  }
  if (body.length === 0) {
    return { data: null, error: "Tidak ada baris data di file CSV." };
  }

  const pics = await listLeadPICs();
  const picNames = (pics.data ?? []).map((pic) => pic.name);
  const rows: CsvImportRow[] = [];
  const seenWhatsapp = new Set<string>();
  const seenNames = new Set<string>();

  body.forEach((columns, index) => {
    const lineNumber = index + 2;
    const get = (position: number) => (columns[position] ?? "").trim();
    const rawStatus = get(7);
    const input: CreateLeadInput = {
      companyName: get(0),
      industry: get(1),
      contactDate: get(2),
      whatsapp: get(3),
      instagram: get(4),
      email: get(5),
      picName: get(6),
      // Status asing sengaja diteruskan agar validator menolak dengan pesan jelas.
      status: rawStatus as CreateLeadInput["status"],
    };
    const errors: string[] = [];
    if (columns.length !== LEAD_CSV_HEADERS.length) {
      errors.push(
        `Jumlah kolom harus ${LEAD_CSV_HEADERS.length}, ditemukan ${columns.length}.`
      );
    }
    const validationError = validateLeadInput(input, picNames);
    if (validationError) {
      errors.push(validationError);
    }

    const stored = errors.length === 0 ? findDuplicates(input.whatsapp, input.companyName) : [];
    const normalizedWhatsapp = normalizeWhatsapp(input.whatsapp);
    const normalizedName = input.companyName.toLowerCase();
    const inFile =
      seenWhatsapp.has(normalizedWhatsapp) || seenNames.has(normalizedName);
    if (errors.length === 0) {
      seenWhatsapp.add(normalizedWhatsapp);
      seenNames.add(normalizedName);
    }
    rows.push({
      lineNumber,
      input,
      errors,
      duplicateWith: [...stored.map((lead) => lead.id), ...(inFile ? ["file ini"] : [])],
    });
  });

  return {
    data: {
      rows,
      validCount: rows.filter(
        (row) => row.errors.length === 0 && row.duplicateWith.length === 0
      ).length,
      invalidCount: rows.filter((row) => row.errors.length > 0).length,
      duplicateCount: rows.filter(
        (row) => row.errors.length === 0 && row.duplicateWith.length > 0
      ).length,
    },
    error: null,
  };
}

export interface ImportResult {
  created: number;
  skippedDuplicates: number;
  skippedInvalid: number;
}

/**
 * Simpan baris preview yang valid. Baris duplikat dilewati bila
 * `skipDuplicates` true (default), baris tidak valid selalu dilewati.
 */
export async function importLeads(
  preview: ImportPreview,
  options?: { skipDuplicates?: boolean }
): Promise<ServiceResult<ImportResult>> {
  const skipDuplicates = options?.skipDuplicates ?? true;
  let created = 0;
  let skippedDuplicates = 0;
  let skippedInvalid = 0;

  for (const row of preview.rows) {
    if (row.errors.length > 0) {
      skippedInvalid += 1;
      continue;
    }
    if (row.duplicateWith.length > 0 && skipDuplicates) {
      skippedDuplicates += 1;
      continue;
    }
    const { error } = await createLead(row.input);
    if (error) {
      skippedInvalid += 1;
    } else {
      created += 1;
    }
  }
  return { data: { created, skippedDuplicates, skippedInvalid }, error: null };
}
