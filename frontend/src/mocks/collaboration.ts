import type {
  AttachmentItem,
  CommentItem,
  NotificationItem,
} from "@/types/collaboration";

/**
 * Data mock kolaborasi untuk Fase 1 (US-006).
 * Komentar mencakup contoh @mention; notifikasi mencakup
 * ketiga tipe: assignment, mention, status.
 */
export const mockComments: CommentItem[] = [
  {
    id: "CMT-001",
    entityType: "lead",
    entityId: "LEAD-024",
    authorId: "USR-002",
    authorName: "Feby",
    body: "Sudah follow up via WA, @Dinda minta tolong siapkan deck penawaran.",
    mentionedUserIds: ["USR-001"],
    createdAt: "2026-10-04T03:10:00Z",
  },
  {
    id: "CMT-002",
    entityType: "lead",
    entityId: "LEAD-024",
    authorId: "USR-001",
    authorName: "Dinda Prameswari",
    body: "Deck siap, aku kirim ke email mereka sore ini.",
    mentionedUserIds: [],
    createdAt: "2026-10-04T03:40:00Z",
  },
  {
    id: "CMT-003",
    entityType: "task",
    entityId: "TSK-118",
    authorId: "USR-003",
    authorName: "Raka",
    body: "@Nabila revisi hero section dulu, copy dari @Dinda menyusul.",
    mentionedUserIds: ["USR-004", "USR-001"],
    createdAt: "2026-10-04T02:50:00Z",
  },
  {
    id: "CMT-004",
    entityType: "konten",
    entityId: "MAT-0018",
    authorId: "USR-004",
    authorName: "Nabila",
    body: "Carousel slide 3 diganti dengan data terbaru.",
    mentionedUserIds: [],
    createdAt: "2026-10-04T01:55:00Z",
  },
];

export const mockAttachments: AttachmentItem[] = [
  {
    id: "ATT-001",
    entityType: "lead",
    entityId: "LEAD-024",
    fileName: "penawaran-aruna-v2.pdf",
    fileSizeBytes: 482_312,
    mimeType: "application/pdf",
    url: "#mock/penawaran-aruna-v2.pdf",
    uploadedById: "USR-001",
    uploadedByName: "Dinda Prameswari",
    createdAt: "2026-10-04T03:45:00Z",
  },
  {
    id: "ATT-002",
    entityType: "task",
    entityId: "TSK-118",
    fileName: "referensi-hero.png",
    fileSizeBytes: 1_208_442,
    mimeType: "image/png",
    url: "#mock/referensi-hero.png",
    uploadedById: "USR-004",
    uploadedByName: "Nabila",
    createdAt: "2026-10-04T02:55:00Z",
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: "NTF-001",
    type: "mention",
    title: "Dinda Prameswari me-mention Anda",
    message: "Feby: “@Dinda minta tolong siapkan deck penawaran.” (LEAD-024)",
    entityType: "lead",
    entityId: "LEAD-024",
    actorName: "Feby",
    isRead: false,
    createdAt: "2026-10-04T03:10:00Z",
  },
  {
    id: "NTF-002",
    type: "assignment",
    title: "Task baru untuk Anda",
    message: "Raka menugaskan “Review desain landing Pytabelajar” (TSK-118).",
    entityType: "task",
    entityId: "TSK-118",
    actorName: "Raka",
    isRead: false,
    createdAt: "2026-10-04T02:30:00Z",
  },
  {
    id: "NTF-003",
    type: "status",
    title: "Status handover berubah",
    message: "Deal handover HDV-007 kini “Menunggu Konfirmasi Produksi”.",
    actorName: "Sistem",
    isRead: true,
    createdAt: "2026-10-04T01:20:00Z",
  },
];
