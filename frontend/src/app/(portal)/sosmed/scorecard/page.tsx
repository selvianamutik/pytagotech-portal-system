import type { Metadata } from "next";

import { SosmedScorecard } from "@/components/sosmed/sosmed-scorecard";

export const metadata: Metadata = {
  title: "KPI Sosmed — Pytagotech Portal",
  description: "Scorecard KPI media sosial per lini bisnis dan periode.",
};

export default function ScorecardPage() {
  return <SosmedScorecard />;
}
