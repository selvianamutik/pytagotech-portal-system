"use client";

import { useEffect, useState } from "react";
import {
  AtSignIcon,
  BellIcon,
  BellRingIcon,
  CheckCheckIcon,
  UserPlusIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/utils";
import { useNotificationStore } from "@/store/notifications";
import {
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
} from "@/types/collaboration";

const typeIcons: Record<NotificationType, typeof AtSignIcon> = {
  mention: AtSignIcon,
  assignment: UserPlusIcon,
  status: BellRingIcon,
};

type Filter = "semua" | "belum-dibaca";

/**
 * Bel notifikasi in-app (US-006) yang membuka dropdown: daftar, filter
 * sudah/belum dibaca, dan tanda dibaca — tanpa pindah ke halaman terpisah.
 */
export function NotificationBell() {
  const items = useNotificationStore((state) => state.items);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const loading = useNotificationStore((state) => state.loading);
  const refresh = useNotificationStore((state) => state.refresh);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const [filter, setFilter] = useState<Filter>("semua");

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visible =
    filter === "semua" ? items : items.filter((item) => !item.isRead);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" aria-label="Notifikasi" />}
      >
        <span className="relative">
          <BellIcon aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <div className="flex items-center justify-between gap-2 px-1.5 pt-1 pb-0.5">
          <DropdownMenuLabel className="px-0 py-0">
            Notifikasi
          </DropdownMenuLabel>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={unreadCount === 0}
            onClick={() => void markAllRead()}
          >
            <CheckCheckIcon className="size-3.5" />
            Tandai semua dibaca
          </Button>
        </div>

        <div className="mb-2 flex gap-1 px-1.5">
          <Button
            type="button"
            variant={filter === "semua" ? "default" : "outline"}
            size="xs"
            onClick={() => setFilter("semua")}
          >
            Semua
          </Button>
          <Button
            type="button"
            variant={filter === "belum-dibaca" ? "default" : "outline"}
            size="xs"
            onClick={() => setFilter("belum-dibaca")}
          >
            Belum dibaca ({unreadCount})
          </Button>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-[60vh] overflow-y-auto p-1">
          {loading ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              Memuat notifikasi...
            </p>
          ) : visible.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              {filter === "semua"
                ? "Belum ada notifikasi."
                : "Semua notifikasi sudah dibaca. 🎉"}
            </p>
          ) : (
            <ul className="space-y-1">
              {visible.map((item) => {
                const Icon = typeIcons[item.type];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => void markRead(item.id)}
                      className={`flex w-full gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/60 ${
                        item.isRead ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {!item.isRead ? (
                            <span
                              className="size-2 shrink-0 rounded-full bg-primary"
                              aria-label="Belum dibaca"
                            />
                          ) : null}
                          <p className="truncate text-sm font-medium">
                            {item.title}
                          </p>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                          {item.message}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <Badge variant="outline">
                            {NOTIFICATION_TYPE_LABELS[item.type]}
                          </Badge>
                          <span>{formatDateTime(item.createdAt)}</span>
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}