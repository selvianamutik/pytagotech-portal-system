import type { Metadata } from "next";

import { NotificationCenter } from "@/components/collaboration/notification-center";

export const metadata: Metadata = {
  title: "Notifikasi — Pytagotech Portal",
  description: "Notifikasi in-app: penugasan, mention, dan perubahan status.",
};

export default function NotificationsPage() {
  return <NotificationCenter />;
}
