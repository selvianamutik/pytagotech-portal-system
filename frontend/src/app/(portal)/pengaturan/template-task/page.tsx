import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/require-role";
import { TaskTemplateManager } from "@/components/proyek/task-template-manager";

export const metadata: Metadata = {
  title: "Template Task — Pytagotech Portal",
  description: "Kelola template task standar proyek (Admin).",
};

export default function TaskTemplatePage() {
  return (
    <RequireRole allowed={["Super Admin"]}>
      <TaskTemplateManager />
    </RequireRole>
  );
}
