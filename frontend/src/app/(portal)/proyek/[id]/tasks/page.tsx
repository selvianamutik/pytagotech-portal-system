import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TaskBoard } from "@/components/proyek/task-board";

export const metadata: Metadata = {
  title: "Task Board — Pytagotech Portal",
  description: "Kanban dan daftar task proyek.",
};

export default async function ProjectTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  // Kembali ke halaman asal bila valid (mis. /kalender), jika tidak ke detail.
  const backHref = from && from.startsWith("/") && !from.startsWith("//") ? from : `/proyek/${id}`;
  const backLabel = backHref === `/proyek/${id}` ? "Detail proyek" : "Kembali";
  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-2">
        <div>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={backHref} />}>
            <ArrowLeftIcon aria-hidden="true" /> {backLabel}
          </Button>
        </div>
        <div>
          <p className="font-mono text-xs text-muted-foreground">{id}</p>
          <h1 className="mt-1 text-2xl font-bold">Task Board</h1>
        </div>
      </div>
      <TaskBoard projectId={id} />
    </main>
  );
}
