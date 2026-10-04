import type { Metadata } from "next";

import { ProjectCalendar } from "@/components/proyek/project-calendar";

export const metadata: Metadata = {
  title: "Kalender Kerja — Pytagotech Portal",
  description: "Tracking semua pekerjaan: task dan fitur lintas proyek.",
};

export default function WorkCalendarPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6">
      <div>
        <p className="text-sm font-medium text-primary">Proyek</p>
        <h1 className="mt-1 text-2xl font-bold">Kalender Kerja</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Semua task dan fitur berjadwal dari seluruh proyek dalam satu tampilan.
        </p>
      </div>
      <ProjectCalendar />
    </main>
  );
}
