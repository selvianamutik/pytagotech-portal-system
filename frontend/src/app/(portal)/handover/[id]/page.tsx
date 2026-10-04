import type { Metadata } from "next";

import { HandoverDetail } from "@/components/handover/handover-detail";
import { resolveBackLink } from "@/lib/back-link";

export const metadata: Metadata = {
  title: "Detail Handover — Pytagotech Portal",
  description: "Rincian deal handover, termin, status, dan change request.",
};

export default async function HandoverDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const back = resolveBackLink(from, "/handover", "Semua handover");
  return <HandoverDetail dealId={id} backHref={back.href} backLabel={back.label} />;
}
