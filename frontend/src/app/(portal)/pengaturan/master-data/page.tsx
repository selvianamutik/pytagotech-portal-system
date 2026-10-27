import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/require-role";
import { MasterDataManager } from "@/components/pengaturan/master-data-manager";

export const metadata: Metadata = {
  title: "Master Data — Pytagotech Portal",
  description: "Kelola opsi dropdown terpusat: industri, status, brand, platform, dan tim/PIC.",
};

export default function MasterDataPage() {
  return (
    <RequireRole allowed={["Super Admin"]}>
      <MasterDataManager />
    </RequireRole>
  );
}
