"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProject } from "@/services/projects";
import {
  addDependency,
  listDependencies,
  removeDependency,
  type TaskDependency,
} from "@/services/task-dependencies";
import { listFeatures } from "@/services/features";
import { listTaskSummaries, moveTaskDates } from "@/services/tasks";
import { overrideFeatureSchedule } from "@/services/scheduling";
import type { Project } from "@/types/project";
import type { ProjectFeature } from "@/types/feature";
import type { TaskSummary } from "@/types/task";

type Zoom = "harian" | "mingguan" | "bulanan";

const PX_PER_DAY: Record<Zoom, number> = { harian: 28, mingguan: 10, bulanan: 4 };

interface GanttRow {
  key: string;
  kind: "task" | "feature";
  id: string;
  label: string;
  sub: string;
  startDate: string;
  endDate: string;
  indent: boolean;
}

function shiftDate(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function diffDays(fromIso: string, toIso: string): number {
  return Math.round(
    (new Date(`${toIso}T00:00:00Z`).getTime() - new Date(`${fromIso}T00:00:00Z`).getTime()) /
      (24 * 60 * 60 * 1000)
  );
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Gantt chart interaktif (US-025, FR-19): task + fitur per proyek,
 * zoom harian/mingguan/bulanan, seret untuk pindah tanggal (tersimpan),
 * dependensi finish-to-start dengan kaskade, garis hari ini & deadline.
 */
export function GanttChart({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [features, setFeatures] = useState<ProjectFeature[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [zoom, setZoom] = useState<Zoom>("mingguan");
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ key: string; dayDelta: number } | null>(null);
  const [depFor, setDepFor] = useState("");
  const [depPred, setDepPred] = useState("");

  async function refresh() {
    const [{ data: projectData }, { data: taskData }, { data: featureData }, { data: depData }] =
      await Promise.all([
        getProject(projectId),
        listTaskSummaries(projectId),
        listFeatures(projectId),
        listDependencies(projectId),
      ]);
    if (projectData) {
      setProject(projectData.project);
    }
    setTasks((taskData ?? []).filter((task) => task.isActive !== false && task.startDate && task.targetDate));
    setFeatures(
      (featureData ?? []).filter((feature) => feature.scheduledStart && feature.scheduledEnd)
    );
    setDependencies(depData ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getProject(projectId),
      listTaskSummaries(projectId),
      listFeatures(projectId),
      listDependencies(projectId),
    ]).then(([projectResult, taskResult, featureResult, depResult]) => {
      if (cancelled) {
        return;
      }
      if (projectResult.data) {
        setProject(projectResult.data.project);
      }
      setTasks(
        (taskResult.data ?? []).filter(
          (task) => task.isActive !== false && task.startDate && task.targetDate
        )
      );
      setFeatures(
        (featureResult.data ?? []).filter(
          (feature) => feature.scheduledStart && feature.scheduledEnd
        )
      );
      setDependencies(depResult.data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const rows: GanttRow[] = useMemo(() => {
    const list: GanttRow[] = [];
    for (const task of tasks.filter((item) => !item.parentId)) {
      list.push({
        key: `task-${task.id}`,
        kind: "task",
        id: task.id,
        label: task.title,
        sub: `${task.id}${task.assignee ? ` · ${task.assignee}` : ""}`,
        startDate: task.startDate as string,
        endDate: (task.targetDate ?? task.startDate) as string,
        indent: false,
      });
      for (const child of tasks.filter((item) => item.parentId === task.id)) {
        list.push({
          key: `task-${child.id}`,
          kind: "task",
          id: child.id,
          label: `↳ ${child.title}`,
          sub: child.id,
          startDate: child.startDate as string,
          endDate: (child.targetDate ?? child.startDate) as string,
          indent: true,
        });
      }
    }
    for (const feature of features) {
      list.push({
        key: `feature-${feature.id}`,
        kind: "feature",
        id: feature.id,
        label: feature.name,
        sub: `${feature.id} · fitur`,
        startDate: feature.scheduledStart as string,
        endDate: (feature.scheduledEnd ?? feature.scheduledStart) as string,
        indent: false,
      });
    }
    return list;
  }, [tasks, features]);

  const windowStart = useMemo(() => {
    const candidates = [
      project?.startDate,
      ...rows.map((row) => row.startDate),
    ].filter(Boolean) as string[];
    if (candidates.length === 0) {
      return todayIso();
    }
    return shiftDate(candidates.sort()[0] as string, -3);
  }, [rows, project]);

  const windowDays = useMemo(() => {
    const candidates = [
      project?.targetDate,
      ...rows.map((row) => row.endDate),
    ].filter(Boolean) as string[];
    const last = (candidates.sort().at(-1) ?? windowStart) as string;
    return Math.max(14, diffDays(windowStart, last) + 8);
  }, [rows, project, windowStart]);

  const pxPerDay = PX_PER_DAY[zoom];
  const today = todayIso();

  function barStyle(row: GanttRow, extraDays = 0): React.CSSProperties {
    const offset = diffDays(windowStart, row.startDate) + extraDays;
    const length = Math.max(1, diffDays(row.startDate, row.endDate) + 1);
    return {
      left: offset * pxPerDay,
      width: Math.max(pxPerDay, length * pxPerDay - 2),
    };
  }

  function tickLabel(dayIndex: number): string {
    const date = shiftDate(windowStart, dayIndex);
    if (zoom === "harian") {
      return date.slice(8, 10);
    }
    if (zoom === "mingguan") {
      return new Date(`${date}T00:00:00Z`).getUTCDay() === 1 ? date.slice(5) : "";
    }
    return date.slice(8, 10) === "01" ? date.slice(0, 7) : "";
  }

  async function commitDrag(row: GanttRow, dayDelta: number) {
    if (dayDelta === 0) {
      return;
    }
    setError(null);
    const newStart = shiftDate(row.startDate, dayDelta);
    if (row.kind === "task") {
      const { error: moveError } = await moveTaskDates(row.id, newStart);
      if (moveError) {
        setError(moveError);
      }
    } else {
      const current = features.find((feature) => feature.id === row.id);
      const newEnd = shiftDate(row.endDate, dayDelta);
      const { error: overrideError } = await overrideFeatureSchedule(row.id, {
        startDate: newStart,
        endDate: newEnd,
        reason: `Digeser via Gantt dari ${row.startDate} (jadwal: ${current?.scheduledStart}→${current?.scheduledEnd}).`,
      });
      if (overrideError) {
        setError(overrideError);
      }
    }
    await refresh();
  }

  async function handleAddDependency() {
    if (!depFor || !depPred) {
      return;
    }
    setError(null);
    const { error: depError } = await addDependency(projectId, depPred, depFor);
    if (depError) {
      setError(depError);
      return;
    }
    setDepFor("");
    setDepPred("");
    await refresh();
  }

  const taskOptions = tasks.filter((task) => !task.parentId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-end justify-between border-b">
          <div>
            <CardTitle className="text-base">Timeline Gantt</CardTitle>
            <CardDescription>
              Seret balok untuk memindahkan jadwal. Garis merah = hari ini, kuning =
              deadline {project ? project.targetDate : ""}.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(
              [
                ["harian", "Harian"],
                ["mingguan", "Mingguan"],
                ["bulanan", "Bulanan"],
              ] as [Zoom, string][]
            ).map(([option, label]) => (
              <Button
                key={option}
                type="button"
                variant={zoom === option ? "default" : "outline"}
                size="sm"
                onClick={() => setZoom(option)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <p role="alert" className="mb-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada task/fitur berjadwal. Tambahkan tanggal di Task Board atau
              jalankan penjadwalan fitur.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ minWidth: 220 + windowDays * pxPerDay }}>
                <div className="flex">
                  <div className="shrink-0" style={{ width: 220 }} />
                  <div className="relative flex-1" style={{ height: 24 }}>
                    {Array.from({ length: windowDays + 1 }, (_, index) => (
                      <span
                        key={index}
                        className="absolute top-0 text-[10px] text-muted-foreground"
                        style={{ left: index * pxPerDay + 2 }}
                      >
                        {tickLabel(index)}
                      </span>
                    ))}
                  </div>
                </div>
                {rows.map((row) => {
                  const dragging = drag?.key === row.key ? drag.dayDelta : 0;
                  const todayOffset = diffDays(windowStart, today);
                  const deadlineOffset = project ? diffDays(windowStart, project.targetDate) : -9999;
                  return (
                    <div key={row.key} className="flex border-t">
                      <div className="shrink-0 truncate px-1 py-1.5" style={{ width: 220 }}>
                        <p className={`truncate text-xs font-medium ${row.indent ? "pl-4" : ""}`}>
                          {row.label}
                        </p>
                        <p className="truncate font-mono text-[10px] text-muted-foreground">{row.sub}</p>
                      </div>
                      <div className="relative flex-1" style={{ height: 44 }}>
                        {todayOffset >= 0 && todayOffset <= windowDays ? (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                            title={`Hari ini (${today})`}
                            style={{ left: todayOffset * pxPerDay }}
                          />
                        ) : null}
                        {deadlineOffset >= 0 && deadlineOffset <= windowDays ? (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-amber-500"
                            title={`Deadline (${project?.targetDate})`}
                            style={{ left: deadlineOffset * pxPerDay }}
                          />
                        ) : null}
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label={`Geser ${row.label}`}
                          title={`${row.startDate} → ${row.endDate}${dragging ? ` (pratinjau ${dragging > 0 ? "+" : ""}${dragging} hari)` : ""}`}
                          className={`absolute top-2 h-6 cursor-grab rounded-md border active:cursor-grabbing ${
                            row.kind === "task"
                              ? "border-primary/40 bg-primary/70"
                              : "border-emerald-600/40 bg-emerald-500/70"
                          }`}
                          style={barStyle(row, dragging)}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            const startX = event.clientX;
                            const handleMove = (moveEvent: MouseEvent) => {
                              const delta = Math.round((moveEvent.clientX - startX) / pxPerDay);
                              setDrag({ key: row.key, dayDelta: delta });
                            };
                            const handleUp = (upEvent: MouseEvent) => {
                              const delta = Math.round((upEvent.clientX - startX) / pxPerDay);
                              setDrag(null);
                              window.removeEventListener("mousemove", handleMove);
                              window.removeEventListener("mouseup", handleUp);
                              void commitDrag(row, delta);
                            };
                            window.addEventListener("mousemove", handleMove);
                            window.addEventListener("mouseup", handleUp);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Dependensi finish-to-start</CardTitle>
          <CardDescription>
            Successor mulai setelah predecessor selesai; menggeser predecessor
            menggeser successor yang tertabrak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label htmlFor="dep-task" className="text-xs text-muted-foreground">
                Task
              </label>
              <select
                id="dep-task"
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                value={depFor}
                onChange={(event) => setDepFor(event.target.value)}
              >
                <option value="">Pilih task...</option>
                {taskOptions.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="dep-pred" className="text-xs text-muted-foreground">
                Bergantung pada
              </label>
              <select
                id="dep-pred"
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                value={depPred}
                onChange={(event) => setDepPred(event.target.value)}
              >
                <option value="">Pilih predecessor...</option>
                {taskOptions.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.id})
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void handleAddDependency()}>
              Tambah
            </Button>
          </div>
          {dependencies.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada dependensi.</p>
          ) : (
            <ul className="space-y-1">
              {dependencies.map((dependency) => (
                <li key={dependency.id} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-mono">
                    {dependency.predecessorId} → {dependency.successorId}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      void removeDependency(dependency.id).then(() => void refresh())
                    }
                  >
                    Hapus
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
