import { mockAuditLog } from "@/mocks/audit";
import { createClient } from "@/lib/supabase/client";
import type { AuditEntry, LogAuditInput } from "@/types/audit";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan audit trail append-only (US-004, dipakai US-009).
 * Entri tidak dapat diubah/dihapus — hanya tambah dan baca.
 * Penulisan mock (Fase 1) tetap dipakai modul lain; pembaca log backend
 * (`queryAuditLogs`) memakai tabel `audit_logs` (trigger DB, FR-2).
 */

let auditStore: AuditEntry[] = structuredClone(mockAuditLog);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockAudit(): void {
  auditStore = structuredClone(mockAuditLog);
}

export async function logAudit(
  input: LogAuditInput
): Promise<ServiceResult<AuditEntry>> {
  const entry: AuditEntry = {
    id: `AUD-${String(auditStore.length + 1).padStart(4, "0")}`,
    actorId: input.actorId,
    actorName: input.actorName,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    oldValue: input.oldValue ?? null,
    newValue: input.newValue ?? null,
    createdAt: new Date().toISOString(),
  };
  auditStore.push(entry);
  return { data: { ...entry }, error: null };
}

export async function listAudit(
  entityId?: string
): Promise<ServiceResult<AuditEntry[]>> {
  const items = entityId
    ? auditStore.filter((entry) => entry.entityId === entityId)
    : auditStore;
  return {
    data: [...items]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((entry) => ({ ...entry })),
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
