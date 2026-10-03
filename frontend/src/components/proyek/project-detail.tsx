"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/crm/lead-table";
import { FeatureBacklog } from "@/components/proyek/feature-backlog";
import { FeatureScheduleSection } from "@/components/proyek/feature-schedule";
import { ProjectTasks } from "@/components/proyek/project-tasks";
import {
  canManageProjects,
  getProject,
  listProjectManagers,
  updateProject,
  type ProjectWithNames,
} from "@/services/projects";
import { useAuthStore } from "@/store/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PROJECT_STATUSES } from "@/types/project";

/**
 * Detail proyek (US-019): info + tautan balik ke handover asal.
 * Task, fitur, dan timeline menyusul di US-021 s.d. US-025.
 */
export function ProjectDetail({ projectId }: { projectId: string }) {
  const user = useAuthStore((state) => state.user);
  const [item, setItem] = useState<ProjectWithNames | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");
  const [pmName, setPmName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const manageable = canManageProjects(user);

  function beginEdit() {
    setStatus(project.status);
    setPmName(project.pmName);
    setStartDate(project.startDate);
    setTargetDate(project.targetDate);
    setError(null);
    setEditing(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { data, error: saveError } = await updateProject(project.id, {
      status: status as ProjectWithNames["project"]["status"],
      pmName,
      startDate,
      targetDate,
    });
    setPending(false);
    if (saveError || !data) {
      setError(saveError ?? "Gagal menyimpan proyek.");
      return;
    }
    setEditing(false);
    const { data: refreshed } = await getProject(project.id);
    if (refreshed) {
      setItem(refreshed);
    }
  }

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

      {manageable && !editing ? (
        <Button type="button" variant="outline" onClick={beginEdit}>
          <PencilIcon aria-hidden="true" /> Ubah proyek
        </Button>
      ) : null}
      {!manageable ? (
        <p className="text-xs text-muted-foreground" role="note">
          Hanya PM dan Admin yang dapat mengubah proyek.
        </p>
      ) : null}

      <ProjectTasks projectId={project.id} />

      <FeatureBacklog projectId={project.id} handoverId={project.handoverId} />

      <FeatureScheduleSection projectId={project.id} />

      <div>
        <Button type="button" render={<Link href={`/proyek/${project.id}/tasks`} />}>
          Buka Task Board
        </Button>
      </div>
      <div>
        <Button type="button" variant="outline" render={<Link href={`/proyek/${project.id}/gantt`} />}>
          Buka Gantt Chart
        </Button>
      </div>

      {editing ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Ubah proyek</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                id="project-edit-status"
                label="Status"
                value={status}
                onChange={setStatus}
                options={PROJECT_STATUSES}
                required
              />
              <FormSelect
                id="project-edit-pm"
                label="Project Manager"
                value={pmName}
                onChange={setPmName}
                options={listProjectManagers()}
                required
              />
              <div className="space-y-2">
                <label htmlFor="project-edit-start" className="text-sm font-medium">
                  Tanggal mulai
                </label>
                <Input
                  id="project-edit-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="project-edit-target" className="text-sm font-medium">
                  Target selesai
                </label>
                <Input
                  id="project-edit-target"
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                  required
                />
              </div>
              {error ? (
                <p role="alert" className="text-sm text-destructive sm:col-span-2">
                  {error}
                </p>
              ) : null}
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
