import type { Metadata } from "next";

import { GuidesManager } from "@/components/sosmed/guides-manager";

export const metadata: Metadata = {
  title: "Panduan & RACI — Pytagotech Portal",
  description: "SOP, panduan, dan matriks tanggung jawab.",
};

export default function GuidesPage() {
  return <GuidesManager />;
}
