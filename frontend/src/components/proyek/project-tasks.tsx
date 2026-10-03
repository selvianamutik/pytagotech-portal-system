"use client";

import { useEffect, useState } from "react";
import { Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteTaskSummary,
  listTaskSummaries,
  setTaskSummaryActive,
} from "@/services/tasks";
import { canManageProjects } from "@/services/projects";
import { useAuthStore } from "@/store/auth";
import { formatDate } from "@/lib/utils";
import type { TaskSummary } from "@/types/task";

/**
 * Daftar task hasil generate pada detail proyek (US-021):
 * PM dapat menonaktifkan atau menghapus task.
 * Board penuh (Kanban/List, sub-task) menyusul di US-022.
 */
export function ProjectTasks({ projectId }: { projectId: string }) {
  const user = useAuthStore((state) => state.user);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const manageable = canManageProjects(user);

  async function refresh() {
    const { data } = await listTaskSummaries(projectId);
    if (data) {
      setTasks(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listTaskSummaries(projectId).then(({ data }) => {
      if (!cancelled && data) {
        setTasks(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function handleToggle(task: TaskSummary) {
    const { error: toggleError } = await setTaskSummaryActive(
      task.id,
      !(task.isActive ?? true)
    );
    if (toggleError) {
      setError(toggleError);
      return;
    }
    await refresh();
  }

  async function handleDelete(taskId: string) {
    const { error: deleteError } = await deleteTaskSummary(taskId);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    await refresh();
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">Task proyek</CardTitle>
        <CardDescription>
          Ter-generate otomatis dari template. Kelola penuh di Task Board (US-022).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada task.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => {
              const active = task.isActive ?? true;
              return (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${active ? "" : "opacity-60"}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{task.id}</span>
                      {task.startDate ? ` · ${formatDate(task.startDate)} → ${formatDate(task.targetDate ?? task.startDate)}` : ""}
                      {` · ${task.percent}%`}
                    </p>
                  </div>
                  {!active ? <Badge variant="outline">Nonaktif</Badge> : null}
                  {manageable ? (
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => void handleToggle(task)}>
                        {active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Hapus ${task.title}`}
                        onClick={() => void handleDelete(task.id)}
                      >
                        <Trash2Icon aria-hidden="true" />
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
