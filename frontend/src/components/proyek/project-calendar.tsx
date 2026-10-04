"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAllFeatures, listFeatures } from "@/services/features";
import { moveTaskDates } from "@/services/tasks";
import { listAllTaskSummaries, listTaskSummaries } from "@/services/tasks";
import { listProjects } from "@/services/projects";
import { overrideFeatureSchedule } from "@/services/scheduling";
import type { ProjectFeature } from "@/types/feature";
import type { TaskSummary } from "@/types/task";

type ViewMode = "bulan" | "minggu";
type TypeFilter = "semua" | "task" | "fitur";

interface CalendarItem {
  key: string;
  kind: "task" | "fitur";
  id: string;
  label: string;
  sub: string;
  startDate: string;
  endDate: string;
  href: string;
}

function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDate(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Kalender kerja (permintaan pemilik, ala kalender sosmed): bulan/minggu
 * berisi task + fitur berjadwal, klik → board/detail, seret untuk
 * menjadwal ulang (task via moveTaskDates, fitur via override beralasan).
 * Tanpa `projectId` = universal lintas proyek + filter proyek.
 */
export function ProjectCalendar({ projectId }: { projectId?: string }) {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [features, setFeatures] = useState<ProjectFeature[]>([]);
  const [projectNames, setProjectNames] = useState<Map<string, string>>(new Map());
  const [projectFilter, setProjectFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("bulan");
  const [cursor, setCursor] = useState(() => toIso(new Date()));
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("semua");
  const [error, setError] = useState<string | null>(null);

  const scopedTasks = projectId
    ? tasks
    : tasks.filter((task) => !projectFilter || task.projectId === projectFilter);
  const scopedFeatures = projectId
    ? features
    : features.filter((feature) => !projectFilter || feature.projectId === projectFilter);

  async function refresh() {
    const [{ data: taskData }, { data: featureData }] = projectId
      ? await Promise.all([listTaskSummaries(projectId), listFeatures(projectId)])
      : await Promise.all([listAllTaskSummaries(), listAllFeatures()]);
    if (taskData) {
      setTasks(taskData.filter((task) => task.isActive !== false && task.startDate));
    }
    if (featureData) {
      setFeatures(
        featureData.filter((feature) => feature.scheduledStart && feature.scheduledEnd)
      );
    }
  }

  useEffect(() => {
    let cancelled = false;
    if (projectId) {
      void Promise.all([listTaskSummaries(projectId), listFeatures(projectId)]).then(
        ([taskResult, featureResult]) => {
          if (cancelled) {
            return;
          }
          setTasks(
            (taskResult.data ?? []).filter((task) => task.isActive !== false && task.startDate)
          );
          setFeatures(
            (featureResult.data ?? []).filter(
              (feature) => feature.scheduledStart && feature.scheduledEnd
            )
          );
          setLoading(false);
        }
      );
    } else {
      void Promise.all([
        listAllTaskSummaries(),
        listAllFeatures(),
        listProjects(),
      ]).then(([taskResult, featureResult, projectResult]) => {
        if (cancelled) {
          return;
        }
        setTasks(
          (taskResult.data ?? []).filter((task) => task.isActive !== false && task.startDate)
        );
        setFeatures(
          (featureResult.data ?? []).filter(
            (feature) => feature.scheduledStart && feature.scheduledEnd
          )
        );
        setProjectNames(
          new Map(
            (projectResult.data ?? []).map((item) => [item.project.id, item.project.name])
          )
        );
        setLoading(false);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const items: CalendarItem[] = useMemo(() => {
    const list: CalendarItem[] = [];
    const projectShort = (id: string) => {
      const name = projectNames.get(id);
      return name ? ` · ${name.split(" - ")[0]}` : "";
    };
    if (typeFilter === "semua" || typeFilter === "task") {
      for (const task of scopedTasks) {
        list.push({
          key: `task-${task.id}`,
          kind: "task",
          id: task.id,
          label: task.title,
          sub: `${task.id}${task.assignee ? ` · ${task.assignee}` : ""}${projectId ? "" : projectShort(task.projectId)}`,
          startDate: task.startDate as string,
          endDate: (task.targetDate ?? task.startDate) as string,
          href: `/proyek/${task.projectId}/tasks`,
        });
      }
    }
    if (typeFilter === "semua" || typeFilter === "fitur") {
      for (const feature of scopedFeatures) {
        list.push({
          key: `feature-${feature.id}`,
          kind: "fitur",
          id: feature.id,
          label: feature.name,
          sub: `${feature.id} · fitur${feature.developer ? ` · ${feature.developer}` : ""}${projectId ? "" : projectShort(feature.projectId)}`,
          startDate: feature.scheduledStart as string,
          endDate: (feature.scheduledEnd ?? feature.scheduledStart) as string,
          href: `/proyek/${feature.projectId}`,
        });
      }
    }
    return list;
  }, [scopedTasks, scopedFeatures, typeFilter, projectId, projectNames]);

  const days: string[] = useMemo(() => {
    const base = new Date(`${cursor}T00:00:00Z`);
    if (view === "minggu") {
      const mondayOffset = (base.getUTCDay() + 6) % 7;
      const monday = addDays(base, -mondayOffset);
      return Array.from({ length: 7 }, (_, index) => toIso(addDays(monday, index)));
    }
    const first = monthStart(base);
    const startOffset = (first.getUTCDay() + 6) % 7;
    const gridStart = addDays(first, -startOffset);
    return Array.from({ length: 42 }, (_, index) => toIso(addDays(gridStart, index)));
  }, [cursor, view]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      for (let day = item.startDate; day <= item.endDate; day = shiftDate(day, 1)) {
        const list = map.get(day) ?? [];
        list.push(item);
        map.set(day, list);
      }
    }
    return map;
  }, [items]);

  async function handleDrop(item: CalendarItem, date: string) {
    setError(null);
    if (item.kind === "task") {
      const { error: moveError } = await moveTaskDates(item.id, date);
      if (moveError) {
        setError(moveError);
        return;
      }
    } else {
      const current = features.find((feature) => feature.id === item.id);
      if (!current) {
        return;
      }
      const shift = Math.round(
        (new Date(`${date}T00:00:00Z`).getTime() -
          new Date(`${item.startDate}T00:00:00Z`).getTime()) /
          (24 * 60 * 60 * 1000)
      );
      const { error: overrideError } = await overrideFeatureSchedule(item.id, {
        startDate: date,
        endDate: shiftDate(item.endDate, shift),
        reason: `Digeser via kalender proyek (jadwal: ${current.scheduledStart}→${current.scheduledEnd}).`,
      });
      if (overrideError) {
        setError(overrideError);
        return;
      }
    }
    await refresh();
  }

  function shiftCursor(daysCount: number) {
    setCursor(toIso(addDays(new Date(`${cursor}T00:00:00Z`), daysCount)));
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat kalender...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-end justify-between border-b">
          <div>
            <CardTitle className="text-base">Kalender proyek</CardTitle>
            <CardDescription>
              Task + fitur berjadwal. Seret entri untuk menjadwal ulang, klik untuk
              membuka.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => shiftCursor(view === "minggu" ? -7 : -30)}
            >
              ←
            </Button>
            <Button
              type="button"
              variant={view === "bulan" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("bulan")}
            >
              Bulan
            </Button>
            <Button
              type="button"
              variant={view === "minggu" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("minggu")}
            >
              Minggu
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => shiftCursor(view === "minggu" ? 7 : 30)}
            >
              →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["semua", "Semua"],
                ["task", "Task"],
                ["fitur", "Fitur"],
              ] as [TypeFilter, string][]
            ).map(([option, label]) => (
              <Button
                key={option}
                type="button"
                variant={typeFilter === option ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(option)}
              >
                {label}
              </Button>
            ))}
            {!projectId ? (
              <select
                aria-label="Filter proyek"
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value)}
              >
                <option value="">Semua proyek</option>
                {[...projectNames.entries()].map(([id, name]) => (
                  <option key={id} value={id}>
                    {name.split(" - ")[0]} ({id})
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada task/fitur berjadwal. Tambahkan tanggal di Task Board atau
              jalankan penjadwalan fitur.
            </p>
          ) : (
            <div className="grid gap-px overflow-hidden rounded-xl border bg-border">
              <div className="grid grid-cols-7 bg-muted/40">
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
                  <p
                    key={day}
                    className="px-2 py-1 text-center text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </p>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-border">
                {days.map((day) => (
                  <div
                    key={day}
                    className="min-h-20 bg-card p-1"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      try {
                        const dropped = JSON.parse(
                          event.dataTransfer.getData("text/plain")
                        ) as { key: string; id: string; kind: string };
                        const item = items.find((candidate) => candidate.key === dropped.key);
                        if (item) {
                          void handleDrop(item, day);
                        }
                      } catch {
                        // Payload drag asing — abaikan.
                      }
                    }}
                  >
                    <p className="text-xs text-muted-foreground">{day.slice(8, 10)}</p>
                    <div className="space-y-1">
                      {(byDate.get(day) ?? []).map((entry) => (
                        <Link
                          key={`${day}-${entry.key}`}
                          href={entry.href}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData(
                              "text/plain",
                              JSON.stringify({ key: entry.key, id: entry.id, kind: entry.kind })
                            );
                          }}
                          className={`block truncate rounded px-1.5 py-0.5 text-[11px] leading-4 ${
                            entry.kind === "task"
                              ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                          title={`${entry.label} (${entry.sub})`}
                        >
                          {entry.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
