import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/require-role";
import { DeveloperManager } from "@/components/proyek/developer-manager";

export const metadata: Metadata = {
  title: "Master Developer — Pytagotech Portal",
  description: "Kelola daftar developer dan status internal/external.",
};

export default function DeveloperPage() {
  return (
    <RequireRole allowed={["Super Admin"]}>
      <DeveloperManager />
    </RequireRole>
  );
}
