import type { Metadata } from "next";

import { CrmDashboard } from "@/components/crm/crm-dashboard";

export const metadata: Metadata = {
  title: "Dashboard CRM — Pytagotech Portal",
  description: "KPI penjualan dan kinerja PIC otomatis dari database lead.",
};

export default function CrmDashboardPage() {
  return <CrmDashboard />;
}
