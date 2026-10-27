import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/require-role";
import { AuditLogViewer } from "@/components/pengaturan/audit-log-viewer";

export const metadata: Metadata = {
  title: "Audit Log — Pytagotech Portal",
  description: "Riwayat perubahan data portal (Super Admin & Leader).",
};

export default function AuditLogPage() {
  return (
    <RequireRole allowed={["Super Admin", "Executive / Leader"]}>
      <AuditLogViewer />
    </RequireRole>
  );
}
