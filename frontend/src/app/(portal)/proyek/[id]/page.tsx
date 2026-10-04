import type { Metadata } from "next";

import { ProjectDetail } from "@/components/proyek/project-detail";
import { resolveBackLink } from "@/lib/back-link";

export const metadata: Metadata = {
  title: "Detail Proyek — Pytagotech Portal",
  description: "Informasi proyek, task, fitur, dan timeline.",
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const back = resolveBackLink(from, "/handover", "Semua handover");
  return <ProjectDetail projectId={id} backHref={back.href} backLabel={back.label} />;
}
