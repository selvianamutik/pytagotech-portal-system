import { afterEach, describe, expect, it } from "vitest";

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
  pushNotification,
  resolveMentionedUserIds,
  uploadAttachment,
} from "@/services/collaboration";

const originalLimit = process.env.NEXT_PUBLIC_MAX_ATTACHMENT_SIZE_BYTES;

afterEach(() => {
  if (originalLimit === undefined) {
    delete process.env.NEXT_PUBLIC_MAX_ATTACHMENT_SIZE_BYTES;
  } else {
    process.env.NEXT_PUBLIC_MAX_ATTACHMENT_SIZE_BYTES = originalLimit;
  }
});

describe("listComments", () => {
  it("mengembalikan komentar per entitas", async () => {
    const lead = await listComments("lead", "LEAD-001");
    const task = await listComments("task", "TSK-118");
    const kosong = await listComments("fitur", "FIT-012");

    expect(lead.data).toHaveLength(2);
    expect(task.data).toHaveLength(1);
    expect(kosong.data).toHaveLength(0);
    expect(lead.data?.[0]?.authorName).toBe("Feby");
  });

  it("menolak entitas yang tidak dikenal", async () => {
    expect((await listComments("lead", "LEAD-999")).error).toMatch(
      /tidak ditemukan/
    );
  });
});

describe("addComment", () => {
  it("menambah komentar dan membuat notifikasi mention", async () => {
    const unreadBefore = await getUnreadNotificationCount();

    const result = await addComment({
      entityType: "task",
      entityId: "TSK-118",
      authorId: "user-2",
      body: "Mohon review @Nabila, terima kasih.",
    });

    expect(result.error).toBeNull();
    expect(result.data?.authorName).toBe("Feby");
    expect(result.data?.mentionedUserIds).toContain("user-4");

    const unreadAfter = await getUnreadNotificationCount();
    expect((unreadAfter.data ?? 0) - (unreadBefore.data ?? 0)).toBe(1);

    const comments = await listComments("task", "TSK-118");
    expect(comments.data).toHaveLength(2);
  });

  it("tidak me-mention diri sendiri", async () => {
    const result = await addComment({
      entityType: "lead",
      entityId: "LEAD-001",
      authorId: "user-2",
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
          entityId: "LEAD-001",
          authorId: "user-2",
          body: "   ",
        })
      ).error
    ).toBe("Komentar tidak boleh kosong.");

    expect(
      (
        await addComment({
          entityType: "lead",
          entityId: "LEAD-001",
          authorId: "user-2",
          body: "x".repeat(2001),
        })
      ).error
    ).toMatch(/maksimal 2000 karakter/);
  });
});

describe("resolveMentionedUserIds", () => {
  const candidates = [
    { profileId: "user-3", name: "Raka Pratama" },
    { profileId: "user-4", name: "Nabila" },
  ];

  it("mengenali nama depan dan nama lengkap", () => {
    expect(resolveMentionedUserIds("Halo @Raka", candidates)).toEqual([
      "user-3",
    ]);
    expect(resolveMentionedUserIds("Halo @Raka Pratama", candidates)).toEqual([
      "user-3",
    ]);
    expect(resolveMentionedUserIds("Halo @Nabila", candidates)).toEqual([
      "user-4",
    ]);
  });

  it("tidak mencocokkan awalan nama yang lebih panjang", () => {
    expect(resolveMentionedUserIds("Halo @Rakap", candidates)).toHaveLength(0);
    expect(resolveMentionedUserIds("Tanpa mention", candidates)).toHaveLength(0);
  });
});

describe("uploadAttachment", () => {
  it("mengunggah file ke storage dan menyimpan metadata", async () => {
    const file = new File(["abc"], "spesifikasi.pdf", {
      type: "application/pdf",
    });

    const result = await uploadAttachment({
      entityType: "fitur",
      entityId: "FIT-011",
      file,
      uploaderId: "user-3",
    });

    expect(result.error).toBeNull();
    expect(result.data?.fileName).toBe("spesifikasi.pdf");
    expect(result.data?.fileSizeBytes).toBe(3);
    expect(result.data?.uploadedByName).toBe("Raka");
    expect(result.data?.url).toMatch(/^#fake\/portal-attachments\//);

    const listed = await listAttachments("fitur", "FIT-011");
    expect(listed.data).toHaveLength(1);

    const removed = await deleteAttachment(result.data!.id);
    expect(removed.error).toBeNull();
    expect((await listAttachments("fitur", "FIT-011")).data).toHaveLength(0);
  });

  it("menolak file kosong dan file melebihi batas", async () => {
    const empty = new File([], "kosong.txt", { type: "text/plain" });
    expect(
      (
        await uploadAttachment({
          entityType: "fitur",
          entityId: "FIT-011",
          file: empty,
          uploaderId: "user-3",
        })
      ).error
    ).toBe("File kosong tidak dapat diunggah.");

    process.env.NEXT_PUBLIC_MAX_ATTACHMENT_SIZE_BYTES = "1";
    const big = new File(["xx"], "video-besar.mp4", { type: "video/mp4" });
    const result = await uploadAttachment({
      entityType: "fitur",
      entityId: "FIT-011",
      file: big,
      uploaderId: "user-3",
    });

    expect(getAttachmentSizeLimit()).toBe(1);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/melebihi batas/);
  });
});

describe("deleteAttachment", () => {
  it("menghapus lampiran yang ada", async () => {
    expect((await deleteAttachment("ATT-001")).error).toBeNull();
    expect((await listAttachments("lead", "LEAD-001")).data).toHaveLength(0);
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

  it("pushNotification menyimpan penerima dan tampil di daftar", async () => {
    const pushed = await pushNotification({
      type: "assignment",
      title: "Task baru untuk Anda",
      message: "Raka menugaskan review desain.",
      entityType: "task",
      entityId: "TSK-118",
      actorName: "Raka",
      recipientId: "user-4",
    });

    expect(pushed.error).toBeNull();
    expect(pushed.data?.recipientId).toBe("user-4");

    const list = await listNotifications();
    expect(list.data?.[0]?.title).toBe("Task baru untuk Anda");
  });
});
