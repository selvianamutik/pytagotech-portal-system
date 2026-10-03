/**
 * Kontrak data kolaborasi reusable (US-006, FR-4).
 * Dipakai lintas entitas: lead, task, fitur, konten.
 * Fase 1: mock (`@/mocks/collaboration`) via `services/collaboration`.
 * Fase 2: tabel `comments`, `attachments` (Supabase Storage), `notifications`.
 */

/** Entitas yang bisa ditempeli komentar & lampiran. */
export type CollaborableEntityType = "lead" | "task" | "fitur" | "konten" | "deal";

export interface CommentItem {
  id: string;
  entityType: CollaborableEntityType;
  entityId: string;
  authorId: string;
  authorName: string;
  /** Isi mentah; token `@Nama` di-highlight saat tampil. */
  body: string;
  /** ID user yang di-mention di body. */
  mentionedUserIds: string[];
  createdAt: string;
}

export interface AttachmentItem {
  id: string;
  entityType: CollaborableEntityType;
  entityId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  /** URL file (mock Fase 1; URL Supabase Storage di Fase 2). */
  url: string;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

export type NotificationType = "assignment" | "mention" | "status";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: CollaborableEntityType;
  entityId?: string;
  actorName?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AddCommentInput {
  entityType: CollaborableEntityType;
  entityId: string;
  authorId: string;
  body: string;
}

export interface UploadAttachmentInput {
  entityType: CollaborableEntityType;
  entityId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploaderId: string;
}

/** Label Indonesia untuk tipe entitas (dipakai di UI). */
export const ENTITY_TYPE_LABELS: Record<CollaborableEntityType, string> = {
  lead: "Lead",
  task: "Task",
  fitur: "Fitur",
  konten: "Konten",
  deal: "Deal",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  assignment: "Penugasan",
  mention: "Mention",
  status: "Perubahan status",
};
