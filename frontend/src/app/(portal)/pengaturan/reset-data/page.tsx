import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/require-role";
import { ResetData } from "@/components/pengaturan/reset-data";

export const metadata: Metadata = {
  title: "Reset Data Demo — Pytagotech Portal",
  description: "Kembalikan data demo portal ke snapshot UAT (Super Admin).",
};

export default function ResetDataPage() {
  return (
    <RequireRole allowed={["Super Admin"]}>
      <ResetData />
    </RequireRole>
  );
}