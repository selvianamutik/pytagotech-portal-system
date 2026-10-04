import type { Metadata } from "next";

import { MetricsManager } from "@/components/sosmed/metrics-manager";

export const metadata: Metadata = {
  title: "Analytics Sosmed — Pytagotech Portal",
  description: "Metrik performa posting dengan Engagement Rate otomatis.",
};

export default function AnalyticsPage() {
  return <MetricsManager />;
}
