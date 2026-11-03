import { createClient } from "@/lib/supabase/client";
import type { AuditEntry, LogAuditInput } from "@/types/audit";
import type { ServiceResult } from "@/services/result";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type BrowserSupabase = ReturnType<typeof createClient>;

/**
 * Lapisan audit trail append-only (US-004, FR-2).
 *
 * Penulisan audit dilakukan oleh trigger database `private.audit_row_change()`
 * (SECURITY DEFINER, `action = lower(TG_OP)`, `entity_type = TG_TABLE_NAME`,
 * `entity_id` dari kolom primary key). Aplikasi TIDAK menulis `audit_logs`
 * secara langsung: policy insert untuk role ter-autentikasi sengaja dicabut
 * (lihat `backend_parity_fixes.sql`), jadi setiap perubahan data yang sudah
 * DB-backed otomatis tercatat oleh trigger.
 *
 * `logAudit` dipertahankan sebagai no-op backward-compatible bagi pemanggil
 * lama (alur handover dan change request) — perubahan mereka sudah terekam
 * oleh trigger pada tabel `deals`/`change_requests`.
 */

/** Deprecated no-op — audit kini dicatat oleh trigger database. */
export function resetMockAudit(): void {}

/**
 * Deprecated no-op. Perubahan data dictat oleh trigger DB secara otomatis;
 * entri yang dikembalikan hanyalah artefak agar pemanggil lama tetap kompilasi.
 */
export async function logAudit(
  input: LogAuditInput
): Promise<ServiceResult<AuditEntry>> {
  void input;
  return { data: null, error: null };
}

/** Resolve display ID (`HDV-xxx`) sebuah deal ke UUID internal. */
async function resolveDealId(
  supabase: BrowserSupabase,
  dealId: string
): Promise<string | null> {
  if (UUID_PATTERN.test(dealId)) {
    return dealId;
  }
  const { data, error } = await supabase
    .from("deals")
    .select("id")
    .eq("display_id", dealId)
    .limit(1);
  if (error) {
    return null;
  }
  const row = ((data ?? []) as { id: string }[])[0];
  return row?.id ?? null;
}

interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: unknown | null;
  new_value: unknown | null;
  created_at: string;
}

/** Baca log audit suatu deal dari tabel `audit_logs` (terbaru dulu). */
export async function listAudit(
  dealId?: string
): Promise<ServiceResult<AuditEntry[]>> {
  if (!dealId) {
    return { data: [], error: null };
  }
  const supabase = createClient();
  const entityUuid = await resolveDealId(supabase, dealId);
  if (!entityUuid) {
    return { data: [], error: null };
  }
  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      "id, actor_id, actor_name, action, entity_type, entity_id, old_value, new_value, created_at"
    )
    .eq("entity_type", "deals")
    .eq("entity_id", entityUuid)
    .order("created_at", { ascending: false });
  if (error || !data) {
    return { data: null, error: "Gagal memuat riwayat audit." };
  }
  return {
    data: (data as AuditLogRow[]).map((row) => ({
      id: row.id,
      actorId: row.actor_id ?? "",
      actorName: row.actor_name,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      oldValue: stringifyValue(row.old_value),
      newValue: stringifyValue(row.new_value),
      createdAt: row.created_at,
    })),
    error: null,
  };
}

export interface AuditLogFilter {
  /** Pencarian nama aktor (contains, case-insensitive). */
  actor?: string;
  /** Tipe entitas persis (mis. `leads`, `deals`). */
  entityType?: string;
  /** Tanggal WIB `YYYY-MM-DD` (inklusif). */
  dateFrom?: string;
  dateTo?: string;
  /** Batas baris (1–200, default 100). */
  limit?: number;
}

interface AuditLogQueryRow {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: unknown | null;
  new_value: unknown | null;
  created_at: string;
}

function stringifyValue(value: unknown | null): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

/**
 * Baca log audit backend untuk halaman Audit Log (US-004, AC2).
 * RLS: hanya Super Admin + Executive/Leader; terbaru dulu.
 */
export async function queryAuditLogs(
  filter: AuditLogFilter = {}
): Promise<ServiceResult<AuditEntry[]>> {
  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 200);
  const supabase = createClient();
  let query = supabase
    .from("audit_logs")
    .select(
      "id, actor_id, actor_name, action, entity_type, entity_id, old_value, new_value, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (filter.actor?.trim()) {
    query = query.ilike("actor_name", `%${filter.actor.trim()}%`);
  }
  if (filter.entityType) {
    query = query.eq("entity_type", filter.entityType);
  }
  if (filter.dateFrom) {
    query = query.gte("created_at", `${filter.dateFrom}T00:00:00+07:00`);
  }
  if (filter.dateTo) {
    query = query.lte("created_at", `${filter.dateTo}T23:59:59.999+07:00`);
  }
  const { data, error } = await query;
  if (error || !data) {
    return { data: null, error: "Gagal memuat audit log." };
  }
  return {
    data: (data as AuditLogQueryRow[]).map((row) => ({
      id: row.id,
      actorId: row.actor_id ?? "",
      actorName: row.actor_name,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      oldValue: stringifyValue(row.old_value),
      newValue: stringifyValue(row.new_value),
      createdAt: row.created_at,
    })),
    error: null,
  };
}