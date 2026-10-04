"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BellIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/notifications";

/**
 * Bel notifikasi in-app dengan badge jumlah belum dibaca (US-006).
 * Dipasang di header dashboard; mengarah ke halaman `/notifikasi`.
 */
export function NotificationBell() {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const refresh = useNotificationStore((state) => state.refresh);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Button
      variant="outline"
      size="icon"
      nativeButton={false}
      aria-label={
        unreadCount > 0
          ? `Buka notifikasi (${unreadCount} belum dibaca)`
          : "Buka notifikasi"
      }
      title="Notifikasi"
      render={<Link href="/notifikasi" />}
    >
      <span className="relative">
        <BellIcon aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </span>
    </Button>
  );
}
