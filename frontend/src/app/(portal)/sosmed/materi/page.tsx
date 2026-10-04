import type { Metadata } from "next";

import { MaterialManager } from "@/components/sosmed/material-manager";

export const metadata: Metadata = {
  title: "Produksi Konten — Pytagotech Portal",
  description: "Database materi konten dari draf sampai rilis.",
};

export default function MaterialsPage() {
  return <MaterialManager />;
}
