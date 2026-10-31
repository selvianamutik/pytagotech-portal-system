import { createClient } from "@/lib/supabase/client";
import { listTeamMembers } from "@/services/master-data";
import type { TeamMember } from "@/types/master-data";
import type { ServiceResult } from "@/services/result";

/**
 * Aktivitas per lead (US-012, FR-9).
 *
 * Catatan disimpan di `lead_activities`; perubahan otomatis (status, tahap,
 * PIC, follow-up) dibaca dari `audit_logs` lewat RPC `lead_audit_trail`
 * (CR-006) agar Sales dapat melihat timeline tanpa membuka seluruh audit log.
 * `lead_activities.author_id` merujuk `team_members`; nama penulis di-resolve
 * dari sana. Lead tetap memakai display ID di UI (DEC-022).
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

interface LeadRef {
  id: string;
  displayId: string;
}

interface LeadActivityRow {
  id: string;
  lead_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

interface LeadAuditRow {
  actor_name: string;
  action: string;
  entity_type: string;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
}

function errorMessage(error: { message: string } | null, fallback: string): string {
  return error?.message || fallback;
}

/** Resolve display ID (`LEAD-xxx`) ke UUID internal. */
async function resolveLead(leadId: string): Promise<ServiceResult<LeadRef>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, display_id")
    .eq("display_id", leadId)
    .limit(1);
  if (error) {
    return { data: null, error: errorMessage(error, "Gagal memuat lead.") };
  }
  const row = ((data ?? []) as { id: string; display_id: string }[])[0];
  if (!row) {
    return { data: null, error: "Lead tidak ditemukan." };
  }
  return { data: { id: row.id, displayId: row.display_id }, error: null };
}

function findTeamMember(
  members: TeamMember[],
  actor: { id: string; name: string }
): TeamMember | undefined {
  return (
    members.find((member) => member.profileId === actor.id) ??
    members.find((member) => member.id === actor.id) ??
    members.find((member) => member.name === actor.name)
  );
}

export async function listLeadNotes(
  leadId: string
): Promise<ServiceResult<LeadNote[]>> {
  const lead = await resolveLead(leadId);
  if (lead.error || !lead.data) {
    return { data: null, error: lead.error ?? "Lead tidak ditemukan." };
  }

  const supabase = createClient();
  const [notesResult, membersResult] = await Promise.all([
    supabase
      .from("lead_activities")
      .select("id, lead_id, author_id, body, created_at")
      .eq("lead_id", lead.data.id)
      .order("created_at", { ascending: true }),
    listTeamMembers(),
  ]);
  if (notesResult.error) {
    return {
      data: null,
      error: errorMessage(notesResult.error, "Gagal memuat catatan lead."),
    };
  }
  if (membersResult.error || !membersResult.data) {
    return {
      data: null,
      error: membersResult.error ?? "Gagal memuat data tim/PIC.",
    };
  }

  const names = new Map(membersResult.data.map((member) => [member.id, member.name]));
  const notes = ((notesResult.data ?? []) as LeadActivityRow[]).map((row) => ({
    id: row.id,
    leadId: lead.data!.displayId,
    authorId: row.author_id ?? "",
    authorName: row.author_id ? names.get(row.author_id) ?? "Tim" : "Tim",
    body: row.body,
    createdAt: row.created_at,
  }));
  return { data: notes, error: null };
}

export async function addLeadNote(
  leadId: string,
  actor: { id: string; name: string },
  body: string
): Promise<ServiceResult<LeadNote>> {
  const text = body.trim();
  if (text.length === 0) {
    return { data: null, error: "Catatan tidak boleh kosong." };
  }
  if (text.length > 2000) {
    return { data: null, error: "Catatan maksimal 2000 karakter." };
  }

  const lead = await resolveLead(leadId);
  if (lead.error || !lead.data) {
    return { data: null, error: lead.error ?? "Lead tidak ditemukan." };
  }

  const membersResult = await listTeamMembers();
  if (membersResult.error || !membersResult.data) {
    return {
      data: null,
      error: membersResult.error ?? "Gagal memuat data tim/PIC.",
    };
  }
  const author = findTeamMember(membersResult.data, actor);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("lead_activities")
    .insert({
      lead_id: lead.data.id,
      author_id: author?.id ?? null,
      body: text,
    })
    .select("id, lead_id, author_id, body, created_at");
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal menyimpan catatan lead."),
    };
  }
  const row = ((data ?? []) as LeadActivityRow[])[0];
  if (!row) {
    return { data: null, error: "Catatan gagal disimpan." };
  }
  return {
    data: {
      id: row.id,
      leadId: lead.data.displayId,
      authorId: row.author_id ?? "",
      authorName: author?.name ?? "Tim",
      body: row.body,
      createdAt: row.created_at,
    },
    error: null,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function textValue(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function picName(names: Map<string, string>, picId: string | null): string {
  return picId ? names.get(picId) ?? "PIC tidak dikenal" : "Belum ada PIC";
}

/**
 * Ubah baris audit mentah menjadi item timeline. Audit trigger menulis
 * snapshot `old_value`/`new_value`, sehingga perubahan dideteksi dengan
 * membandingkan kolom yang relevan.
 */
function toAuditItems(
  rows: LeadAuditRow[],
  names: Map<string, string>
): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const row of rows) {
    const oldRow = asRecord(row.old_value);
    const newRow = asRecord(row.new_value);
    const actorName = row.actor_name || "Sistem";

    if (row.entity_type === "leads" && row.action === "update") {
      const oldStatus = textValue(oldRow, "status");
      const newStatus = textValue(newRow, "status");
      if (oldStatus !== newStatus && newStatus) {
        items.push({
          kind: "status",
          title: `Status: ${oldStatus ?? "?"} → ${newStatus}`,
          detail: "",
          actorName,
          createdAt: row.created_at,
        });
      }

      const oldPic = textValue(oldRow, "pic_id");
      const newPic = textValue(newRow, "pic_id");
      if (oldPic !== newPic) {
        items.push({
          kind: "assign",
          title: `PIC diubah ke ${picName(names, newPic)}`,
          detail: `${picName(names, oldPic)} → ${picName(names, newPic)}`,
          actorName,
          createdAt: row.created_at,
        });
      }

      const oldFollowUp = textValue(oldRow, "next_follow_up");
      const newFollowUp = textValue(newRow, "next_follow_up");
      if (oldFollowUp !== newFollowUp) {
        items.push({
          kind: "followup",
          title: newFollowUp
            ? `Follow-up dijadwalkan ${newFollowUp}`
            : "Jadwal follow-up dihapus",
          detail: oldFollowUp ? `Sebelumnya ${oldFollowUp}` : "",
          actorName,
          createdAt: row.created_at,
        });
      }
    }

    if (
      row.entity_type === "lead_interests" &&
      (row.action === "insert" || row.action === "update")
    ) {
      const oldStage = textValue(oldRow, "stage");
      const newStage = textValue(newRow, "stage");
      if (newStage && oldStage !== newStage) {
        items.push({
          kind: "stage",
          title: oldStage
            ? `Tahap: ${oldStage} → ${newStage}`
            : `Tahap: ${newStage}`,
          detail: "",
          actorName,
          createdAt: row.created_at,
        });
      }
    }
  }

  return items;
}

/**
 * Timeline gabungan per lead: catatan + perubahan (status, tahap, PIC,
 * follow-up), terurut terbaru, lengkap dengan penulis dan waktu.
 */
export async function getLeadTimeline(
  leadId: string
): Promise<ServiceResult<TimelineItem[]>> {
  const lead = await resolveLead(leadId);
  if (lead.error || !lead.data) {
    return { data: null, error: lead.error ?? "Lead tidak ditemukan." };
  }

  const supabase = createClient();
  const [notesResult, auditResult, membersResult] = await Promise.all([
    listLeadNotes(leadId),
    supabase.rpc("lead_audit_trail", { p_lead_id: lead.data.id }),
    listTeamMembers(),
  ]);

  if (notesResult.error || !notesResult.data) {
    return {
      data: null,
      error: notesResult.error ?? "Gagal memuat catatan lead.",
    };
  }
  if (auditResult.error) {
    return {
      data: null,
      error: errorMessage(auditResult.error, "Gagal memuat riwayat perubahan lead."),
    };
  }
  if (membersResult.error || !membersResult.data) {
    return {
      data: null,
      error: membersResult.error ?? "Gagal memuat data tim/PIC.",
    };
  }

  const names = new Map(membersResult.data.map((member) => [member.id, member.name]));
  const items: TimelineItem[] = [
    ...notesResult.data.map((note) => ({
      kind: "note" as TimelineKind,
      title: "Catatan",
      detail: note.body,
      actorName: note.authorName,
      createdAt: note.createdAt,
    })),
    ...toAuditItems((auditResult.data ?? []) as LeadAuditRow[], names),
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
