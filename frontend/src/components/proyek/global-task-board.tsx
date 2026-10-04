"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  listAllTaskSummaries,
  moveTaskSummaryStatus,
} from "@/services/tasks";
import { listProjects } from "@/services/projects";
import { effectiveTaskPercent } from "@/services/tasks";
import type { TaskStatus, TaskSummary } from "@/types/task";
import { TASK_STATUSES } from "@/types/task";

const BACK_PATH = "/proyek/board";

/**
 * Task Board global lintas proyek (laporan pemilik): nav "Task Board"
 * sebelumnya anchor mati (#proyek). Kanban 5 status + pindah via seret.
 */
export function GlobalTaskBoard() {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [projectNames, setProjectNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [{ data: taskData }, { data: projectData }] = await Promise.all([
      listAllTaskSummaries(),
      listProjects(),
    ]);
    if (taskData) {
      setTasks(taskData.filter((task) => task.isActive !== false && !task.parentId));
    }
    if (projectData) {
      setProjectNames(
        new Map(projectData.map((item) => [item.project.id, item.project.name]))
      );
    }
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listAllTaskSummaries(), listProjects()]).then(
      ([taskResult, projectResult]) => {
        if (!cancelled) {
          setTasks(
            (taskResult.data ?? []).filter((task) => task.isActive !== false && !task.parentId)
          );
          setProjectNames(
            new Map(
              (projectResult.data ?? []).map((item) => [item.project.id, item.project.name])
            )
          );
          setLoading(false);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter(
      (task) =>
        !q ||
        `${task.title} ${task.assignee ?? ""} ${projectNames.get(task.projectId) ?? ""}`
          .toLowerCase()
          .includes(q)
    );
  }, [tasks, search, projectNames]);

  async function handleDrop(status: TaskStatus, taskId: string) {
    setError(null);
    const { error: moveError } = await moveTaskSummaryStatus(taskId, status);
    if (moveError) {
      setError(moveError);
      return;
    }
    await refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat task board...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Proyek</p>
          <h1 className="mt-1 text-2xl font-bold">Task Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {visible.length} task lintas proyek. Seret kartu untuk pindah status,
            klik untuk membuka board proyeknya.
          </p>
        </div>
        <Input
          aria-label="Cari task"
          placeholder="Cari task / assignee / proyek..."
          className="w-full sm:max-w-xs"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {TASK_STATUSES.map((columnStatus) => {
          const column = visible.filter((task) => task.status === columnStatus);
          return (
            <section
              key={columnStatus}
              aria-label={`Status ${columnStatus}`}
              className="rounded-xl border bg-muted/30 p-2"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const taskId = event.dataTransfer.getData("text/plain");
                if (taskId) {
                  void handleDrop(columnStatus, taskId);
                }
              }}
            >
              <header className="flex items-center justify-between px-1 py-2">
                <h2 className="text-sm font-semibold">{columnStatus}</h2>
                <Badge variant="secondary">{column.length}</Badge>
              </header>
              <div className="space-y-2">
                {column.map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", task.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    className="cursor-grab rounded-lg border bg-card p-3 shadow-sm active:cursor-grabbing"
                  >
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {task.id}
                      {task.assignee ? ` · ${task.assignee}` : ""}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {projectNames.get(task.projectId) ?? task.projectId} ·{" "}
                      {effectiveTaskPercent(task, tasks)}%
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/proyek/${task.projectId}/tasks?from=${encodeURIComponent(BACK_PATH)}`}
                        />
                      }
                    >
                      Buka
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tidak ada task yang cocok. Task dibuat di board tiap proyek.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
