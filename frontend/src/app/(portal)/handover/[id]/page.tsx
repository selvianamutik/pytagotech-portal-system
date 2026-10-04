import type { Metadata } from "next";

import { HandoverDetail } from "@/components/handover/handover-detail";

export const metadata: Metadata = {
  title: "Detail Handover — Pytagotech Portal",
  description: "Rincian deal handover, termin, status, dan change request.",
};

export default async function HandoverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HandoverDetail dealId={id} />;
}
