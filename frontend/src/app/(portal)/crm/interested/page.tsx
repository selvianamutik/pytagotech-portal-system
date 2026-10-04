import type { Metadata } from "next";

import { InterestPipeline } from "@/components/crm/interest-pipeline";

export const metadata: Metadata = {
  title: "Interested Leads — Pytagotech Portal",
  description: "Pipeline negosiasi lead berminat (Kanban dan tabel).",
};

export default function InterestedPage() {
  return <InterestPipeline />;
}
