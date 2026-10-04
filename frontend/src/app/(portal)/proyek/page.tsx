import type { Metadata } from "next";

import { ProjectList } from "@/components/proyek/project-list";

export const metadata: Metadata = {
  title: "Daftar Proyek — Pytagotech Portal",
  description: "Portofolio proyek dengan progress otomatis dari task.",
};

export default function ProjectsPage() {
  return <ProjectList />;
}
