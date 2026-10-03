import type { Metadata } from "next";

import { ProjectDetail } from "@/components/proyek/project-detail";

export const metadata: Metadata = {
  title: "Detail Proyek — Pytagotech Portal",
  description: "Informasi proyek, task, fitur, dan timeline.",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetail projectId={id} />;
}
