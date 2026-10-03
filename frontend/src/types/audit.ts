/**
 * Kontrak audit trail (US-004, dipakai awal oleh US-009 untuk
 * pencatatan perubahan PIC). Fase 1: mock append-only.
 * Fase 2: tabel `audit_logs` (trigger DB) + halaman Audit Log.
 */
export interface AuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  /** Contoh: "lead.assign-pic", "lead.update-status". */
  action: string;
  entityType: string;
  entityId: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface LogAuditInput {
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string | null;
  newValue?: string | null;
}
