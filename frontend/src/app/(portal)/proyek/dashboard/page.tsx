import type { Metadata } from "next";

import { ProductionDashboard } from "@/components/proyek/production-dashboard";

export const metadata: Metadata = {
  title: "Dashboard Produksi — Pytagotech Portal",
  description: "Ringkasan eksekutif proyek, task, dan deadline.",
};

export default function ProductionDashboardPage() {
  return <ProductionDashboard />;
}
