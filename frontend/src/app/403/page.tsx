import type { Metadata } from "next";

import { ForbiddenContent } from "@/components/auth/require-role";

export const metadata: Metadata = {
  title: "403 Akses Ditolak — Pytagotech Portal",
  description: "Halaman ini memerlukan role yang tidak Anda miliki.",
};

export default function ForbiddenPage() {
  return <ForbiddenContent />;
}
