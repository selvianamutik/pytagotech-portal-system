import type { Metadata } from "next";

import { GlobalTaskBoard } from "@/components/proyek/global-task-board";

export const metadata: Metadata = {
  title: "Task Board — Pytagotech Portal",
  description: "Kanban task lintas proyek.",
};

export default function BoardPage() {
  return <GlobalTaskBoard />;
}
