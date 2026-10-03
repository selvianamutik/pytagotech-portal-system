import { mockUsers } from "@/mocks/auth";
import {
  mockAttachments,
  mockComments,
  mockNotifications,
} from "@/mocks/collaboration";
import type {
  AddCommentInput,
  AttachmentItem,
  CollaborableEntityType,
  CommentItem,
  NotificationItem,
  UploadAttachmentInput,
} from "@/types/collaboration";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan akses data kolaborasi reusable (US-006, FR-4).
 * Satu service untuk komentar, lampiran, dan notifikasi di semua
 * entitas (lead, task, fitur, konten). Fase 1: mock in-memory.
 * Komponen HANYA boleh memanggil fungsi dari file ini.
 */

const DEFAULT_ATTACHMENT_LIMIT_BYTES = 10 * 1024 * 1024;
const MAX_COMMENT_LENGTH = 2000;

let commentStore: CommentItem[] = structuredClone(mockComments);
let attachmentStore: AttachmentItem[] = structuredClone(mockAttachments);
let notificationStore: NotificationItem[] = structuredClone(mockNotifications);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockCollaboration(): void {
  commentStore = structuredClone(mockComments);
  attachmentStore = structuredClone(mockAttachments);
  notificationStore = structuredClone(mockNotifications);
}

/** Batas ukuran lampiran (bytes) dari env, fallback 10MB. */
export function getAttachmentSizeLimit(): number {
  const raw = process.env.NEXT_PUBLIC_MAX_ATTACHMENT_SIZE_BYTES;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_ATTACHMENT_LIMIT_BYTES;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Mencocokkan token `@Nama` di teks dengan user mock
 * (nama depan atau nama lengkap, case-insensitive).
 */
export function resolveMentionedUserIds(body: string): string[] {
  const ids: string[] = [];
  for (const user of mockUsers) {
    if (!user.isActive) {
      continue;
    }
    const firstName = user.name.split(" ")[0];
    const matches =
      new RegExp(`@${escapeRegExp(firstName)}\\b`, "i").test(body) ||
      new RegExp(`@${escapeRegExp(user.name)}\\b`, "i").test(body);
    if (matches && !ids.includes(user.id)) {
      ids.push(user.id);
    }
  }
  return ids;
}

function nextId(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

export async function listComments(
  entityType: CollaborableEntityType,
  entityId: string
): Promise<ServiceResult<CommentItem[]>> {
  return {
    data: commentStore
      .filter(
        (comment) =>
          comment.entityType === entityType && comment.entityId === entityId
      )
      .map((comment) => ({ ...comment, mentionedUserIds: [...comment.mentionedUserIds] })),
    error: null,
  };
}

export async function addComment(
  input: AddCommentInput
): Promise<ServiceResult<CommentItem>> {
  const body = input.body.trim();
  if (body.length === 0) {
    return { data: null, error: "Komentar tidak boleh kosong." };
  }
  if (body.length > MAX_COMMENT_LENGTH) {
    return {
      data: null,
      error: `Komentar maksimal ${MAX_COMMENT_LENGTH} karakter.`,
    };
  }
  const author = mockUsers.find((user) => user.id === input.authorId);
  if (!author) {
    return { data: null, error: "Penulis komentar tidak dikenal." };
  }

  const mentionedUserIds = resolveMentionedUserIds(body).filter(
    (id) => id !== author.id
  );
  const comment: CommentItem = {
    id: nextId("CMT", commentStore.length + 100),
    entityType: input.entityType,
    entityId: input.entityId,
    authorId: author.id,
    authorName: author.name,
    body,
    mentionedUserIds,
    createdAt: new Date().toISOString(),
  };
  commentStore.push(comment);

  // Notifikasi mention otomatis untuk setiap user yang disebut.
  for (const userId of mentionedUserIds) {
    const mentioned = mockUsers.find((user) => user.id === userId);
    if (!mentioned) {
      continue;
    }
    notificationStore.unshift({
      id: nextId("NTF", notificationStore.length + 100),
      type: "mention",
      title: `${author.name} me-mention Anda`,
      message: `${author.name.split(" ")[0]}: “${body.slice(0, 80)}${body.length > 80 ? "…" : ""}” (${input.entityId})`,
      entityType: input.entityType,
      entityId: input.entityId,
      actorName: author.name,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  return { data: { ...comment }, error: null };
}

export async function listAttachments(
  entityType: CollaborableEntityType,
  entityId: string
): Promise<ServiceResult<AttachmentItem[]>> {
  return {
    data: attachmentStore
      .filter(
        (attachment) =>
          attachment.entityType === entityType && attachment.entityId === entityId
      )
      .map((attachment) => ({ ...attachment })),
    error: null,
  };
}

export async function uploadAttachment(
  input: UploadAttachmentInput
): Promise<ServiceResult<AttachmentItem>> {
  const fileName = input.fileName.trim();
  if (fileName.length === 0) {
    return { data: null, error: "Nama file wajib diisi." };
  }
  if (input.fileSizeBytes <= 0) {
    return { data: null, error: "File kosong tidak dapat diunggah." };
  }
  const limit = getAttachmentSizeLimit();
  if (input.fileSizeBytes > limit) {
    return {
      data: null,
      error: `Ukuran file melebihi batas ${formatMegabytes(limit)} (file: ${formatMegabytes(input.fileSizeBytes)}).`,
    };
  }
  const uploader = mockUsers.find((user) => user.id === input.uploaderId);
  if (!uploader) {
    return { data: null, error: "Pengunggah tidak dikenal." };
  }

  const attachment: AttachmentItem = {
    id: nextId("ATT", attachmentStore.length + 100),
    entityType: input.entityType,
    entityId: input.entityId,
    fileName,
    fileSizeBytes: input.fileSizeBytes,
    mimeType: input.mimeType || "application/octet-stream",
    // Fase 2: diganti URL publik Supabase Storage.
    url: `#mock/${encodeURIComponent(fileName)}`,
    uploadedById: uploader.id,
    uploadedByName: uploader.name,
    createdAt: new Date().toISOString(),
  };
  attachmentStore.push(attachment);
  return { data: { ...attachment }, error: null };
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function deleteAttachment(
  attachmentId: string
): Promise<ServiceResult<true>> {
  const index = attachmentStore.findIndex(
    (attachment) => attachment.id === attachmentId
  );
  if (index === -1) {
    return { data: null, error: "Lampiran tidak ditemukan." };
  }
  attachmentStore.splice(index, 1);
  return { data: true, error: null };
}

export async function listNotifications(): Promise<
  ServiceResult<NotificationItem[]>
> {
  return {
    data: [...notificationStore]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((notification) => ({ ...notification })),
    error: null,
  };
}

export async function getUnreadNotificationCount(): Promise<
  ServiceResult<number>
> {
  return {
    data: notificationStore.filter((notification) => !notification.isRead).length,
    error: null,
  };
}

export async function markNotificationRead(
  notificationId: string
): Promise<ServiceResult<NotificationItem>> {
  const notification = notificationStore.find((item) => item.id === notificationId);
  if (!notification) {
    return { data: null, error: "Notifikasi tidak ditemukan." };
  }
  notification.isRead = true;
  return { data: { ...notification }, error: null };
}

export async function markAllNotificationsRead(): Promise<ServiceResult<number>> {
  let changed = 0;
  for (const notification of notificationStore) {
    if (!notification.isRead) {
      notification.isRead = true;
      changed += 1;
    }
  }
  return { data: changed, error: null };
}
