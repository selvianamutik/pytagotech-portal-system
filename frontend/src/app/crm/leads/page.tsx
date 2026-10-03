import type { Metadata } from "next";

import { LeadsManager } from "@/components/crm/leads-manager";

export const metadata: Metadata = {
  title: "Database Lead — Pytagotech Portal",
  description: "Catat dan kelola prospek penjualan terpusat (CRM).",
};

export default function LeadsPage() {
  return <LeadsManager />;
}
