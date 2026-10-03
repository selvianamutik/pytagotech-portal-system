import { beforeEach, describe, expect, it } from "vitest";

import { resetMockCollaboration } from "@/services/collaboration";
import { useNotificationStore } from "@/store/notifications";

beforeEach(() => {
  resetMockCollaboration();
  useNotificationStore.setState({ items: [], unreadCount: 0, loading: true });
});

describe("useNotificationStore", () => {
  it("refresh memuat daftar dan jumlah belum dibaca", async () => {
    await useNotificationStore.getState().refresh();

    expect(useNotificationStore.getState().items).toHaveLength(3);
    expect(useNotificationStore.getState().unreadCount).toBe(2);
    expect(useNotificationStore.getState().loading).toBe(false);
  });

  it("markAllRead menghabiskan unread", async () => {
    await useNotificationStore.getState().refresh();
    await useNotificationStore.getState().markAllRead();

    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it("markRead menandai satu notifikasi", async () => {
    await useNotificationStore.getState().refresh();
    await useNotificationStore.getState().markRead("NTF-001");

    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });
});
