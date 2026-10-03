"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProject, type ProjectWithNames } from "@/services/projects";
import { formatCurrency, formatDate } from "@/lib/utils";

/**
 * Detail proyek (US-019): info + tautan balik ke handover asal.
 * Task, fitur, dan timeline menyusul di US-021 s.d. US-025.
 */
export function ProjectDetail({ projectId }: { projectId: string }) {
  const [item, setItem] = useState<ProjectWithNames | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getProject(projectId).then(({ data }) => {
      if (cancelled) {
        return;
      }
      if (data) {
        setItem(data);
      } else {
        setNotFound(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (notFound) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Proyek tidak ditemukan</CardTitle>
            <CardDescription>ID {projectId} tidak terdaftar.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat proyek...</p>
      </main>
    );
  }

  const { project, clientName, handoverCode } = item;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 sm:px-6">
      <Button variant="outline" size="sm" render={<Link href="/handover" />}>
        <ArrowLeftIcon aria-hidden="true" /> Semua handover
      </Button>

      <div>
        <p className="font-mono text-xs text-muted-foreground">
          {project.id} · {project.code}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{project.name}</h1>
        <div className="mt-2 flex gap-2">
          <Badge variant="outline">{project.status}</Badge>
          <Badge variant="secondary">{formatCurrency(project.value)}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Informasi proyek</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Klien</p>
            <p className="text-sm font-medium">{clientName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Project Manager</p>
            <p className="text-sm font-medium">{project.pmName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tanggal mulai</p>
            <p className="text-sm font-medium">{formatDate(project.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Target selesai</p>
            <p className="text-sm font-medium">{formatDate(project.targetDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Handover asal</p>
            <Link
              href={`/handover/${project.handoverId}`}
              className="font-mono text-sm text-primary underline-offset-4 hover:underline"
            >
              {project.handoverId} ({handoverCode})
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
