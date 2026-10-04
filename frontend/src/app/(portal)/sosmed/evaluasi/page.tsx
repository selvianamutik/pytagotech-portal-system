import type { Metadata } from "next";

import { KistBoard } from "@/components/sosmed/kist-board";

export const metadata: Metadata = {
  title: "Evaluasi KIST — Pytagotech Portal",
  description: "Evaluasi strategi konten Keep, Improve, Stop, Test.",
};

export default function KistPage() {
  return <KistBoard />;
}
