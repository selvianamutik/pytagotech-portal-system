import type { Metadata } from "next";

import { IdeaManager } from "@/components/sosmed/idea-manager";

export const metadata: Metadata = {
  title: "Content Planner — Pytagotech Portal",
  description: "Perencanaan ide konten dengan skor brief otomatis.",
};

export default function PlannerPage() {
  return <IdeaManager />;
}
