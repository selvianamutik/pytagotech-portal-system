import type { Metadata } from "next";

import { PublicationCalendar } from "@/components/sosmed/publication-calendar";

export const metadata: Metadata = {
  title: "Kalender Publikasi — Pytagotech Portal",
  description: "Antrean rilis konten dari data distribusi.",
};

export default function CalendarPage() {
  return <PublicationCalendar />;
}
