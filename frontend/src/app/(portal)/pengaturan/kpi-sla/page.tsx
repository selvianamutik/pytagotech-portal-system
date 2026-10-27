import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/require-role";
import { PortalSettingsManager } from "@/components/pengaturan/portal-settings-manager";

export const metadata: Metadata = {
  title: "KPI, SLA & Routing — Pytagotech Portal",
  description:
    "Kelola target KPI per lini bisnis, ambang SLA, jam layanan, nomor WhatsApp resmi, dan kalender hari libur.",
};

export default function PortalSettingsPage() {
  return (
    <RequireRole allowed={["Super Admin"]}>
      <PortalSettingsManager />
    </RequireRole>
  );
}
