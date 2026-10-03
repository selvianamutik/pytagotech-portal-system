import { mockUsers } from "@/mocks/auth";
import { listAudit } from "@/services/audit";
import type { AuditEntry } from "@/types/audit";
import type { ServiceResult } from "@/services/result";

/**
 * Aktivitas per lead (US-012): catatan komunikasi + timeline gabungan
 * (catatan, perubahan status, pindah tahap, assign PIC) + follow-up.
 * Fase 1: catatan di mock; perubahan otomatis dibaca dari audit trail.
 * Fase 2: tabel `lead_activities` + kolom `next_follow_up` di `leads`.
 */

export interface LeadNote {
  id: string;
  leadId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export type TimelineKind = "note" | "status" | "stage" | "assign" | "followup";

export interface TimelineItem {
  kind: TimelineKind;
  title: string;
  detail: string;
  actorName: string;
  createdAt: string;
}

const seedNotes: LeadNote[] = [
  {
    id: "LAN-001",
    leadId: "LEAD-001",
    authorId: "USR-002",
    authorName: "Feby",
    body: "Klien minta penawaran paket website + maintenance 1 tahun.",
    createdAt: "2026-10-01T04:00:00Z",
  },
  {
    id: "LAN-002",
    leadId: "LEAD-002",
    authorId: "USR-006",
    authorName: "Fira",
    body: "Demo berjalan lancar, mereka suka fitur katalog.",
    createdAt: "2026-10-03T06:00:00Z",
  },
];

let noteStore: LeadNote[] = structuredClone(seedNotes);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockLeadActivities(): void {
  noteStore = structuredClone(seedNotes);
}

const AUDIT_KIND: Record<string, TimelineKind> = {
  "lead.assign-pic": "assign",
  "lead.update-status": "status",
  "lead.move-stage": "stage",
  "lead.followup": "followup",
};

function auditTitle(entry: AuditEntry): string {
  switch (entry.action) {
    case "lead.assign-pic":
      return `PIC diubah ke ${entry.newValue}`;
    case "lead.update-status":
      return `Status: ${entry.oldValue} → ${entry.newValue}`;
    case "lead.move-stage":
      return `Tahap: ${entry.oldValue} → ${entry.newValue}`;
    case "lead.followup":
      return entry.newValue
        ? `Follow-up dijadwalkan ${entry.newValue}`
        : "Jadwal follow-up dihapus";
    default:
      return entry.action;
  }
}

export async function listLeadNotes(
  leadId: string
): Promise<ServiceResult<LeadNote[]>> {
  return {
    data: noteStore
      .filter((note) => note.leadId === leadId)
      .map((note) => ({ ...note })),
    error: null,
  };
}

export async function addLeadNote(
  leadId: string,
  authorId: string,
  body: string
): Promise<ServiceResult<LeadNote>> {
  const text = body.trim();
  if (text.length === 0) {
    return { data: null, error: "Catatan tidak boleh kosong." };
  }
  if (text.length > 2000) {
    return { data: null, error: "Catatan maksimal 2000 karakter." };
  }
  const author = mockUsers.find((user) => user.id === authorId);
  if (!author) {
    return { data: null, error: "Penulis tidak dikenal." };
  }
  const note: LeadNote = {
    id: `LAN-${String(noteStore.length + 1).padStart(3, "0")}`,
    leadId,
    authorId,
    authorName: author.name,
    body: text,
    createdAt: new Date().toISOString(),
  };
  noteStore.push(note);
  return { data: { ...note }, error: null };
}

/**
 * Timeline gabungan per lead: catatan + perubahan (dari audit),
 * terurut terbaru, lengkap dengan penulis dan waktu.
 */
export async function getLeadTimeline(
  leadId: string
): Promise<ServiceResult<TimelineItem[]>> {
  const [notesResult, auditResult] = await Promise.all([
    listLeadNotes(leadId),
    listAudit(leadId),
  ]);
  const items: TimelineItem[] = [
    ...(notesResult.data ?? []).map((note) => ({
      kind: "note" as TimelineKind,
      title: "Catatan",
      detail: note.body,
      actorName: note.authorName,
      createdAt: note.createdAt,
    })),
    ...(auditResult.data ?? [])
      .filter((entry) => AUDIT_KIND[entry.action] !== undefined)
      .map((entry) => ({
        kind: AUDIT_KIND[entry.action],
        title: auditTitle(entry),
        detail: "",
        actorName: entry.actorName,
        createdAt: entry.createdAt,
      })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { data: items, error: null };
}

const CLOSED_STATUSES = ["Closing", "Lost", "Not Interested"];

/**
 * Apakah lead lewat jadwal follow-up (Overdue): ada tanggal follow-up
 * yang sudah lewat hari ini dan status belum final.
 */
export function isFollowUpOverdue(
  nextFollowUp: string | undefined,
  status: string,
  todayIso: string = new Date().toISOString().slice(0, 10)
): boolean {
  if (!nextFollowUp || CLOSED_STATUSES.includes(status)) {
    return false;
  }
  return nextFollowUp < todayIso;
}
