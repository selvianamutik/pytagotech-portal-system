import { mockAuditLog } from "@/mocks/audit";
import type { AuditEntry, LogAuditInput } from "@/types/audit";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan audit trail append-only (US-004, dipakai US-009).
 * Entri tidak dapat diubah/dihapus — hanya tambah dan baca.
 * Fase 2: trigger database menulis ke tabel `audit_logs`.
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
