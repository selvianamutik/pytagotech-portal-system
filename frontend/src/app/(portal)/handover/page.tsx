import type { Metadata } from "next";

import { HandoverManager } from "@/components/handover/handover-manager";

export const metadata: Metadata = {
  title: "Deal Handover — Pytagotech Portal",
  description: "Data kesepakatan dari Sales untuk Produksi.",
};

export default function HandoverPage() {
  return <HandoverManager />;
}
