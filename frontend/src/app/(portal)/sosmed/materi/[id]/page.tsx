import type { Metadata } from "next";

import { MaterialDetail } from "@/components/sosmed/material-detail";
import { resolveBackLink } from "@/lib/back-link";

export const metadata: Metadata = {
  title: "Detail Materi — Pytagotech Portal",
  description: "Quality gate, jadwal, dan rilis materi konten.",
};

export default async function MaterialDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const back = resolveBackLink(from, "/sosmed/materi", "Database materi");
  return <MaterialDetail materialId={id} backHref={back.href} backLabel={back.label} />;
}
