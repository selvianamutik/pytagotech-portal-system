import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectCalendar } from "@/components/proyek/project-calendar";

export const metadata: Metadata = {
  title: "Kalender Proyek — Pytagotech Portal",
  description: "Antrean jadwal task dan fitur proyek.",
};

export default async function ProjectCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-2">
        <div>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/proyek/${id}`} />}>
            <ArrowLeftIcon aria-hidden="true" /> Detail proyek
          </Button>
        </div>
        <div>
          <p className="font-mono text-xs text-muted-foreground">{id}</p>
          <h1 className="mt-1 text-2xl font-bold">Kalender Proyek</h1>
        </div>
      </div>
      <ProjectCalendar projectId={id} />
    </main>
  );
}
