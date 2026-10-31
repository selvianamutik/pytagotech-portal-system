import { createClient } from "@/lib/supabase/client";
import { listTeamMembers } from "@/services/master-data";
import type { TeamMember } from "@/types/master-data";
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
 *
 * Satu service untuk komentar, lampiran, dan notifikasi di semua entitas
 * (lead, task, fitur, konten, deal). Data disimpan di tabel `comments`,
 * `attachments`, dan `notifications`; file lampiran di bucket privat
 * `portal-attachments`. `entityId` dari UI adalah display ID dan dipetakan ke
 * UUID internal sebelum menyentuh tabel polimorfik.
 */

const DEFAULT_ATTACHMENT_LIMIT_BYTES = 10 * 1024 * 1024;
const MAX_COMMENT_LENGTH = 2000;
const ATTACHMENT_BUCKET = "portal-attachments";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Fungsi backward-compatibility untuk test runner (data di fake per-test). */
export function resetMockCollaboration(): void {
  // Database-backed — pembersihan ditangani oleh fake Supabase per-test.
}

const ENTITY_TABLES: Record<CollaborableEntityType, string> = {
  lead: "leads",
  task: "tasks",
  fitur: "features",
  konten: "content_materials",
  deal: "deals",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface CommentRow {
  id: string;
  entity_type: string;
  entity_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

interface AttachmentRow {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_size_bytes: number | string;
  mime_type: string;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
}

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  actor_name: string | null;
  recipient_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface ResolvedEntity {
  id: string;
  displayId: string;
}

function errorMessage(
  error: { message: string } | null,
  fallback: string
): string {
  return error?.message || fallback;
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

export interface MentionCandidate {
  profileId: string;
  name: string;
}

/**
 * Mencocokkan token `@Nama` di teks dengan kandidat mention
 * (nama depan atau nama lengkap, case-insensitive).
 */
export function resolveMentionedUserIds(
  body: string,
  candidates: MentionCandidate[]
): string[] {
  const ids: string[] = [];
  for (const candidate of candidates) {
    const firstName = candidate.name.split(/\s+/)[0];
    const matches =
      new RegExp(`@${escapeRegExp(firstName)}(?![\\w.])`, "i").test(body) ||
      new RegExp(`@${escapeRegExp(candidate.name)}(?![\\w.])`, "i").test(body);
    if (matches && !ids.includes(candidate.profileId)) {
      ids.push(candidate.profileId);
    }
  }
  return ids;
}

function mentionCandidates(members: TeamMember[]): MentionCandidate[] {
  return members
    .filter((member) => member.isActive && member.profileId)
    .map((member) => ({
      profileId: member.profileId as string,
      name: member.name,
    }));
}

function findTeamMember(
  members: TeamMember[],
  userId: string
): TeamMember | undefined {
  return (
    members.find((member) => member.profileId === userId) ??
    members.find((member) => member.id === userId)
  );
}

/** Resolve display ID (`LEAD-xxx`, `TSK-xxx`, dst.) ke UUID internal. */
async function resolveEntity(
  entityType: CollaborableEntityType,
  entityId: string
): Promise<ServiceResult<ResolvedEntity>> {
  if (UUID_PATTERN.test(entityId)) {
    return { data: { id: entityId, displayId: entityId }, error: null };
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from(ENTITY_TABLES[entityType])
    .select("id, display_id")
    .eq("display_id", entityId)
    .limit(1);
  if (error) {
    return { data: null, error: errorMessage(error, "Gagal memuat entitas.") };
  }
  const row = ((data ?? []) as { id: string; display_id: string }[])[0];
  if (!row) {
    return { data: null, error: "Entitas tidak ditemukan." };
  }
  return { data: { id: row.id, displayId: row.display_id }, error: null };
}

async function loadMembers(): Promise<ServiceResult<TeamMember[]>> {
  const result = await listTeamMembers();
  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error ?? "Gagal memuat data tim.",
    };
  }
  return { data: result.data, error: null };
}

function toCommentItem(
  row: CommentRow,
  displayId: string,
  members: TeamMember[],
  candidates: MentionCandidate[]
): CommentItem {
  const author = members.find((member) => member.id === row.author_id);
  return {
    id: row.id,
    entityType: row.entity_type as CollaborableEntityType,
    entityId: displayId,
    authorId: row.author_id ?? "",
    authorName: author?.name ?? "Tim",
    body: row.body,
    mentionedUserIds: resolveMentionedUserIds(row.body, candidates).filter(
      (profileId) => profileId !== author?.profileId
    ),
    createdAt: row.created_at,
  };
}

export async function listComments(
  entityType: CollaborableEntityType,
  entityId: string
): Promise<ServiceResult<CommentItem[]>> {
  const entity = await resolveEntity(entityType, entityId);
  if (entity.error || !entity.data) {
    return { data: null, error: entity.error ?? "Entitas tidak ditemukan." };
  }
  const [membersResult, commentsResult] = await Promise.all([
    loadMembers(),
    createClient()
      .from("comments")
      .select("id, entity_type, entity_id, author_id, body, created_at")
      .eq("entity_type", entityType)
      .eq("entity_id", entity.data.id)
      .order("created_at", { ascending: true }),
  ]);
  if (membersResult.error || !membersResult.data) {
    return {
      data: null,
      error: membersResult.error ?? "Gagal memuat data tim.",
    };
  }
  if (commentsResult.error) {
    return {
      data: null,
      error: errorMessage(commentsResult.error, "Gagal memuat komentar."),
    };
  }
  const members = membersResult.data;
  const resolved = entity.data;
  const candidates = mentionCandidates(members);
  return {
    data: ((commentsResult.data ?? []) as CommentRow[]).map((row) =>
      toCommentItem(row, resolved.displayId, members, candidates)
    ),
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

  const entity = await resolveEntity(input.entityType, input.entityId);
  if (entity.error || !entity.data) {
    return { data: null, error: entity.error ?? "Entitas tidak ditemukan." };
  }
  const membersResult = await loadMembers();
  if (membersResult.error || !membersResult.data) {
    return {
      data: null,
      error: membersResult.error ?? "Gagal memuat data tim.",
    };
  }

  const members = membersResult.data;
  const author = findTeamMember(members, input.authorId);
  const authorName = author?.name ?? input.authorName ?? "Tim";
  const candidates = mentionCandidates(members);
  const mentionedUserIds = resolveMentionedUserIds(body, candidates).filter(
    (profileId) => profileId !== input.authorId
  );

  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      entity_type: input.entityType,
      entity_id: entity.data.id,
      author_id: author?.id ?? null,
      body,
    })
    .select("id, entity_type, entity_id, author_id, body, created_at");
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal menyimpan komentar."),
    };
  }
  const row = ((data ?? []) as CommentRow[])[0];
  if (!row) {
    return { data: null, error: "Komentar gagal disimpan." };
  }

  if (mentionedUserIds.length > 0) {
    // Notifikasi mention bersifat best-effort: komentar tetap tersimpan
    // walaupun penulisan notifikasi ditolak RLS.
    await supabase.from("notifications").insert(
      mentionedUserIds.map((profileId) => ({
        type: "mention",
        title: `${authorName} me-mention Anda`,
        message: `${authorName.split(" ")[0]}: “${body.slice(0, 80)}${
          body.length > 80 ? "…" : ""
        }” (${entity.data!.displayId})`,
        entity_type: input.entityType,
        entity_id: entity.data!.displayId,
        actor_name: authorName,
        recipient_id: profileId,
      }))
    );
  }

  return {
    data: toCommentItem(row, entity.data.displayId, members, candidates),
    error: null,
  };
}

function toAttachmentItem(
  row: AttachmentRow,
  displayId: string,
  members: TeamMember[],
  url: string
): AttachmentItem {
  return {
    id: row.id,
    entityType: row.entity_type as CollaborableEntityType,
    entityId: displayId,
    fileName: row.file_name,
    fileSizeBytes: Number(row.file_size_bytes),
    mimeType: row.mime_type,
    url,
    uploadedById: row.uploaded_by ?? "",
    uploadedByName:
      members.find((member) => member.id === row.uploaded_by)?.name ?? "Tim",
    createdAt: row.created_at,
  };
}

export async function listAttachments(
  entityType: CollaborableEntityType,
  entityId: string
): Promise<ServiceResult<AttachmentItem[]>> {
  const entity = await resolveEntity(entityType, entityId);
  if (entity.error || !entity.data) {
    return { data: null, error: entity.error ?? "Entitas tidak ditemukan." };
  }
  const [membersResult, attachmentsResult] = await Promise.all([
    loadMembers(),
    createClient()
      .from("attachments")
      .select(
        "id, entity_type, entity_id, file_name, file_size_bytes, mime_type, storage_path, uploaded_by, created_at"
      )
      .eq("entity_type", entityType)
      .eq("entity_id", entity.data.id)
      .order("created_at", { ascending: true }),
  ]);
  if (membersResult.error || !membersResult.data) {
    return {
      data: null,
      error: membersResult.error ?? "Gagal memuat data tim.",
    };
  }
  if (attachmentsResult.error) {
    return {
      data: null,
      error: errorMessage(attachmentsResult.error, "Gagal memuat lampiran."),
    };
  }

  const supabase = createClient();
  const rows = (attachmentsResult.data ?? []) as AttachmentRow[];
  const items = await Promise.all(
    rows.map(async (row) => {
      const signed = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
      return toAttachmentItem(
        row,
        entity.data!.displayId,
        membersResult.data!,
        signed.data?.signedUrl ?? ""
      );
    })
  );
  return { data: items, error: null };
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeFileName(fileName: string): string {
  const clean = fileName.replace(/[^\w.-]+/g, "_").slice(0, 80);
  return clean || "file";
}

export async function uploadAttachment(
  input: UploadAttachmentInput
): Promise<ServiceResult<AttachmentItem>> {
  const fileName = input.file.name.trim();
  if (fileName.length === 0) {
    return { data: null, error: "Nama file wajib diisi." };
  }
  if (input.file.size <= 0) {
    return { data: null, error: "File kosong tidak dapat diunggah." };
  }
  const limit = getAttachmentSizeLimit();
  if (input.file.size > limit) {
    return {
      data: null,
      error: `Ukuran file melebihi batas ${formatMegabytes(limit)} (file: ${formatMegabytes(input.file.size)}).`,
    };
  }

  const entity = await resolveEntity(input.entityType, input.entityId);
  if (entity.error || !entity.data) {
    return { data: null, error: entity.error ?? "Entitas tidak ditemukan." };
  }
  const membersResult = await loadMembers();
  if (membersResult.error || !membersResult.data) {
    return {
      data: null,
      error: membersResult.error ?? "Gagal memuat data tim.",
    };
  }

  const uploader = findTeamMember(membersResult.data, input.uploaderId);
  const uploaderName = uploader?.name ?? input.uploaderName ?? "Tim";
  const supabase = createClient();
  const storagePath = `${input.entityType}/${entity.data.id}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
  const mimeType = input.file.type || "application/octet-stream";

  const upload = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .upload(storagePath, input.file, { contentType: mimeType, upsert: false });
  if (upload.error) {
    return {
      data: null,
      error: errorMessage(upload.error, "Gagal mengunggah file."),
    };
  }

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      entity_type: input.entityType,
      entity_id: entity.data.id,
      file_name: fileName,
      file_size_bytes: input.file.size,
      mime_type: mimeType,
      storage_path: storagePath,
      uploaded_by: uploader?.id ?? null,
    })
    .select(
      "id, entity_type, entity_id, file_name, file_size_bytes, mime_type, storage_path, uploaded_by, created_at"
    );
  if (error) {
    await supabase.storage.from(ATTACHMENT_BUCKET).remove([storagePath]);
    return {
      data: null,
      error: errorMessage(error, "Gagal menyimpan lampiran."),
    };
  }
  const row = ((data ?? []) as AttachmentRow[])[0];
  if (!row) {
    await supabase.storage.from(ATTACHMENT_BUCKET).remove([storagePath]);
    return { data: null, error: "Lampiran gagal disimpan." };
  }

  const signed = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  return {
    data: {
      ...toAttachmentItem(
        row,
        entity.data.displayId,
        membersResult.data,
        signed.data?.signedUrl ?? ""
      ),
      uploadedByName: uploaderName,
    },
    error: null,
  };
}

export async function deleteAttachment(
  attachmentId: string
): Promise<ServiceResult<true>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId)
    .select("id, storage_path");
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal menghapus lampiran."),
    };
  }
  const row = ((data ?? []) as { id: string; storage_path: string }[])[0];
  if (!row) {
    return { data: null, error: "Lampiran tidak ditemukan." };
  }
  await supabase.storage.from(ATTACHMENT_BUCKET).remove([row.storage_path]);
  return { data: true, error: null };
}

export interface PushNotificationInput {
  type: NotificationItem["type"];
  title: string;
  message: string;
  entityType?: NotificationItem["entityType"];
  entityId?: string;
  actorName?: string;
  /** Profil penerima; jika kosong dipakai sesi saat ini. */
  recipientId?: string;
}

function toNotificationItem(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type as NotificationItem["type"],
    title: row.title,
    message: row.message,
    entityType: (row.entity_type as CollaborableEntityType | null) ?? undefined,
    entityId: row.entity_id ?? undefined,
    actorName: row.actor_name ?? undefined,
    recipientId: row.recipient_id ?? undefined,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

const NOTIFICATION_COLUMNS =
  "id, type, title, message, entity_type, entity_id, actor_name, recipient_id, is_read, created_at";

async function currentProfileId(): Promise<string | null> {
  const { data } = await createClient().auth.getSession();
  return data.session?.user.id ?? null;
}

/**
 * Buat notifikasi in-app (dipakai alur handover US-017, change request, dsb.).
 * Bila `recipientId` tidak diisi, notifikasi ditujukan ke sesi saat ini.
 */
export async function pushNotification(
  input: PushNotificationInput
): Promise<ServiceResult<NotificationItem>> {
  const recipientId = input.recipientId ?? (await currentProfileId());
  const { data, error } = await createClient()
    .from("notifications")
    .insert({
      type: input.type,
      title: input.title,
      message: input.message,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      actor_name: input.actorName ?? null,
      recipient_id: recipientId,
    })
    .select(NOTIFICATION_COLUMNS);
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal membuat notifikasi."),
    };
  }
  const row = ((data ?? []) as NotificationRow[])[0];
  if (!row) {
    return { data: null, error: "Notifikasi gagal dibuat." };
  }
  return { data: toNotificationItem(row), error: null };
}

export async function listNotifications(): Promise<ServiceResult<NotificationItem[]>> {
  const { data, error } = await createClient()
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal memuat notifikasi."),
    };
  }
  return {
    data: ((data ?? []) as NotificationRow[]).map(toNotificationItem),
    error: null,
  };
}

export async function getUnreadNotificationCount(): Promise<
  ServiceResult<number>
> {
  const { data, error } = await createClient()
    .from("notifications")
    .select("id")
    .eq("is_read", false);
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal menghitung notifikasi."),
    };
  }
  return { data: (data ?? []).length, error: null };
}

export async function markNotificationRead(
  notificationId: string
): Promise<ServiceResult<NotificationItem>> {
  const { data, error } = await createClient()
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .select(NOTIFICATION_COLUMNS);
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal menandai notifikasi."),
    };
  }
  const row = ((data ?? []) as NotificationRow[])[0];
  if (!row) {
    return { data: null, error: "Notifikasi tidak ditemukan." };
  }
  return { data: toNotificationItem(row), error: null };
}

export async function markAllNotificationsRead(): Promise<ServiceResult<number>> {
  const { data, error } = await createClient()
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false)
    .select("id");
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal menandai semua notifikasi."),
    };
  }
  return { data: (data ?? []).length, error: null };
}
