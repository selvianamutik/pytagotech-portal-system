import type { Metadata } from "next";

import { MaterialDetail } from "@/components/sosmed/material-detail";

export const metadata: Metadata = {
  title: "Detail Materi — Pytagotech Portal",
  description: "Quality gate, jadwal, dan rilis materi konten.",
};

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MaterialDetail materialId={id} />;
}
