import { beforeEach, describe, expect, it } from "vitest";

import {
  addComment,
  deleteAttachment,
  getAttachmentSizeLimit,
  getUnreadNotificationCount,
  listAttachments,
  listComments,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  resetMockCollaboration,
  resolveMentionedUserIds,
  uploadAttachment,
} from "@/services/collaboration";

beforeEach(() => {
  resetMockCollaboration();
});

describe("listComments", () => {
  it("mengembalikan komentar per entitas", async () => {
    const lead = await listComments("lead", "LEAD-024");
    const task = await listComments("task", "TSK-118");
    const kosong = await listComments("fitur", "FIT-999");

    expect(lead.data).toHaveLength(2);
    expect(task.data).toHaveLength(1);
    expect(kosong.data).toHaveLength(0);
  });
});

describe("addComment", () => {
  it("menambah komentar dan membuat notifikasi mention", async () => {
    const unreadBefore = await getUnreadNotificationCount();

    const result = await addComment({
      entityType: "task",
      entityId: "TSK-118",
      authorId: "USR-002",
      body: "Mohon review @Nabila, terima kasih.",
    });

    expect(result.error).toBeNull();
    expect(result.data?.mentionedUserIds).toContain("USR-004");

    const unreadAfter = await getUnreadNotificationCount();
    expect((unreadAfter.data ?? 0) - (unreadBefore.data ?? 0)).toBe(1);

    const comments = await listComments("task", "TSK-118");
    expect(comments.data).toHaveLength(2);
  });

  it("tidak me-mention diri sendiri", async () => {
    const result = await addComment({
      entityType: "lead",
      entityId: "LEAD-024",
      authorId: "USR-002",
      body: "Catatan untuk @Feby sendiri.",
    });

    expect(result.error).toBeNull();
    expect(result.data?.mentionedUserIds).toHaveLength(0);
  });

  it("menolak komentar kosong dan terlalu panjang", async () => {
    expect(
      (
        await addComment({
          entityType: "lead",
          entityId: "LEAD-024",
          authorId: "USR-002",
          body: "   ",
        })
      ).error
    ).toBe("Komentar tidak boleh kosong.");

    expect(
      (
        await addComment({
          entityType: "lead",
          entityId: "LEAD-024",
          authorId: "USR-002",
          body: "x".repeat(2001),
        })
      ).error
    ).toMatch(/maksimal 2000 karakter/);
  });
});

describe("resolveMentionedUserIds", () => {
  it("mengenali nama depan dan mengabaikan user nonaktif", async () => {
    // Sinta (USR-005) nonaktif → tidak ikut ter-resolve.
    expect(resolveMentionedUserIds("Halo @Raka dan @Sinta")).toContain("USR-003");
    expect(resolveMentionedUserIds("Halo @Raka dan @Sinta")).not.toContain("USR-005");
    expect(resolveMentionedUserIds("Tanpa mention")).toHaveLength(0);
  });
});

describe("uploadAttachment", () => {
  it("menerima file dalam batas ukuran", async () => {
    const result = await uploadAttachment({
      entityType: "fitur",
      entityId: "FIT-011",
      fileName: "spesifikasi.pdf",
      fileSizeBytes: 1024,
      mimeType: "application/pdf",
      uploaderId: "USR-003",
    });

    expect(result.error).toBeNull();
    expect((await listAttachments("fitur", "FIT-011")).data).toHaveLength(1);
  });

  it("menolak file melebihi batas", async () => {
    const limit = getAttachmentSizeLimit();
    const result = await uploadAttachment({
      entityType: "fitur",
      entityId: "FIT-011",
      fileName: "video-besar.mp4",
      fileSizeBytes: limit + 1,
      mimeType: "video/mp4",
      uploaderId: "USR-003",
    });

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/melebihi batas/);
  });
});

describe("deleteAttachment", () => {
  it("menghapus lampiran yang ada", async () => {
    expect((await deleteAttachment("ATT-001")).error).toBeNull();
    expect((await listAttachments("lead", "LEAD-024")).data).toHaveLength(0);
  });

  it("menolak id yang tidak dikenal", async () => {
    expect((await deleteAttachment("ATT-999")).error).toBe(
      "Lampiran tidak ditemukan."
    );
  });
});

describe("notifikasi", () => {
  it("menandai satu dan semua notifikasi dibaca", async () => {
    expect((await getUnreadNotificationCount()).data).toBe(2);

    await markNotificationRead("NTF-001");
    expect((await getUnreadNotificationCount()).data).toBe(1);

    const marked = await markAllNotificationsRead();
    expect(marked.data).toBe(1);
    expect((await getUnreadNotificationCount()).data).toBe(0);
  });

  it("daftar terurut dari yang terbaru", async () => {
    const list = await listNotifications();
    const times = (list.data ?? []).map((item) => item.createdAt);
    expect([...times].sort().reverse()).toEqual(times);
  });
});
