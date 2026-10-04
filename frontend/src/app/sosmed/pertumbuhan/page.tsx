import type { Metadata } from "next";

import { GrowthManager } from "@/components/sosmed/growth-manager";

export const metadata: Metadata = {
  title: "Pertumbuhan Akun — Pytagotech Portal",
  description: "Tren audiens bulanan per platform.",
};

export default function GrowthPage() {
  return <GrowthManager />;
}
