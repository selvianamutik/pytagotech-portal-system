import type { Metadata } from "next";

import { CommunityManager } from "@/components/sosmed/community-manager";

export const metadata: Metadata = {
  title: "Komunitas — Pytagotech Portal",
  description: "Interaksi audiens dan SLA response time.",
};

export default function CommunityPage() {
  return <CommunityManager />;
}
