"use client";

import { useEffect, useState } from "react";
import { AtSignIcon, BellRingIcon, UserPlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNotificationStore } from "@/store/notifications";
import { formatDateTime } from "@/lib/utils";
import type { NotificationType } from "@/types/collaboration";
import { NOTIFICATION_TYPE_LABELS } from "@/types/collaboration";

const typeIcons: Record<NotificationType, typeof AtSignIcon> = {
  mention: AtSignIcon,
  assignment: UserPlusIcon,
  status: BellRingIcon,
};

type Filter = "semua" | "belum-dibaca";

/**
 * Pusat notifikasi in-app (US-006): daftar, filter, tandai dibaca.
 */
export function NotificationCenter() {
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

  const visible = filter === "semua" ? items : items.filter((item) => !item.isRead);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Kolaborasi</p>
          <h1 className="mt-1 text-2xl font-bold">Notifikasi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Penugasan, mention, dan perubahan status untuk Anda.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={unreadCount === 0}
          onClick={() => void markAllRead()}
        >
          Tandai semua dibaca
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        <Button
          type="button"
          variant={filter === "semua" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("semua")}
        >
          Semua
        </Button>
        <Button
          type="button"
          variant={filter === "belum-dibaca" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("belum-dibaca")}
        >
          Belum dibaca ({unreadCount})
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat notifikasi...</p>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {filter === "semua"
                ? "Belum ada notifikasi."
                : "Semua notifikasi sudah dibaca. 🎉"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void markRead(item.id)}
                  className={`flex w-full gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/50 ${
                    item.isRead ? "opacity-70" : "border-primary/40"
                  }`}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
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
                      <p className="truncate text-sm font-medium">{item.title}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.message}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">
                        {NOTIFICATION_TYPE_LABELS[item.type]}
                      </Badge>
                      {item.entityId ? (
                        <span className="font-mono">{item.entityId}</span>
                      ) : null}
                      <span>{formatDateTime(item.createdAt)}</span>
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
