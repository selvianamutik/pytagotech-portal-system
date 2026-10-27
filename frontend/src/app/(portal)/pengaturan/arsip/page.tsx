import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/require-role";
import { ArchiveManager } from "@/components/pengaturan/archive-manager";

export const metadata: Metadata = {
  title: "Arsip & Backup — Pytagotech Portal",
  description:
    "Arsipkan dan pulihkan lead, proyek, serta materi konten; ekspor data per modul ke CSV.",
};

export default function ArchivePage() {
  return (
    <RequireRole allowed={["Super Admin"]}>
      <ArchiveManager />
    </RequireRole>
  );
}
