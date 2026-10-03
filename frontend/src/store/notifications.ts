"use client";

import { create } from "zustand";

import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/collaboration";
import type { NotificationItem } from "@/types/collaboration";

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

/**
 * State notifikasi in-app client-side (US-006).
 * Diisi dari `services/collaboration`. Fase 2: diganti Supabase Realtime
 * agar bell berdering tanpa refresh manual.
 */
export const useNotificationStore = create<NotificationState>()((set) => ({
  items: [],
  unreadCount: 0,
  loading: true,

  async refresh() {
    const [list, unread] = await Promise.all([
      listNotifications(),
      getUnreadNotificationCount(),
    ]);
    set({
      items: list.data ?? [],
      unreadCount: unread.data ?? 0,
      loading: false,
    });
  },

  async markRead(id) {
    const { error } = await markNotificationRead(id);
    if (!error) {
      const [list, unread] = await Promise.all([
        listNotifications(),
        getUnreadNotificationCount(),
      ]);
      set({ items: list.data ?? [], unreadCount: unread.data ?? 0 });
    }
  },

  async markAllRead() {
    await markAllNotificationsRead();
    const [list, unread] = await Promise.all([
      listNotifications(),
      getUnreadNotificationCount(),
    ]);
    set({ items: list.data ?? [], unreadCount: unread.data ?? 0 });
  },
}));
