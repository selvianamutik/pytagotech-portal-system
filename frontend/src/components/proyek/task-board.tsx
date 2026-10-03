"use client";

import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttachmentList } from "@/components/collaboration/attachment-list";
import { CommentSection } from "@/components/collaboration/comment-section";
import { FormSelect } from "@/components/crm/lead-table";
import {
  addTaskSummary,
  deleteTaskSummary,
  effectiveTaskPercent,
  listTaskSummaries,
  moveTaskSummaryStatus,
  updateTaskSummary,
} from "@/services/tasks";
import { formatDate } from "@/lib/utils";
import type { TaskStatus, TaskSummary } from "@/types/task";
import { TASK_STATUSES } from "@/types/task";

type ViewMode = "kanban" | "list";

/**
 * Task board per proyek (US-022, FR-17): Kanban drag-and-drop +
 * List sort/filter, sub-task + rollup %, komentar & lampiran per task.
 */
export function TaskBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("kanban");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TaskSummary | null>(null);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [status, setStatus] = useState<TaskStatus>("To Do");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [percent, setPercent] = useState("0");
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [pending, setPending] = useState(false);

  async function refresh() {
    const { data } = await listTaskSummaries(projectId);
    if (data) {
      setTasks(data.filter((task) => task.isActive !== false));
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listTaskSummaries(projectId).then(({ data }) => {
      if (!cancelled) {
        setTasks((data ?? []).filter((task) => task.isActive !== false));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const visible = tasks.filter((task) => {
    if (statusFilter && task.status !== statusFilter) {
      return false;
    }
    if (search && !`${task.title} ${task.assignee ?? ""}`.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });
  const topLevel = visible.filter((task) => !task.parentId);

  function openCreate() {
    setEditTarget(null);
    setTitle("");
    setAssignee("");
    setStatus("To Do");
    setStartDate("");
    setTargetDate("");
    setPercent("0");
    setNotes("");
    setLink("");
    setSubTitle("");
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(task: TaskSummary) {
    setEditTarget(task);
    setTitle(task.title);
    setAssignee(task.assignee ?? "");
    setStatus(task.status);
    setStartDate(task.startDate ?? "");
    setTargetDate(task.targetDate ?? "");
    setPercent(String(task.percent));
    setNotes(task.notes ?? "");
    setLink(task.link ?? "");
    setSubTitle("");
    setError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const payload = {
      title,
      assignee: assignee || undefined,
      status,
      startDate: startDate || undefined,
      targetDate: targetDate || undefined,
      percent: Number(percent),
      notes: notes || undefined,
      link: link || undefined,
    };
    const result = editTarget
      ? await updateTaskSummary(editTarget.id, payload)
      : await addTaskSummary({ ...payload, projectId });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    await refresh();
  }

  async function handleAddSubTask() {
    if (!editTarget || !subTitle.trim()) {
      return;
    }
    const { error: addError } = await addTaskSummary({
      projectId,
      title: subTitle.trim(),
      parentId: editTarget.id,
    });
    if (addError) {
      setError(addError);
      return;
    }
    setSubTitle("");
    await refresh();
  }

  async function handleDrop(statusTarget: TaskStatus, taskId: string) {
    setError(null);
    const { error: moveError } = await moveTaskSummaryStatus(taskId, statusTarget);
    if (moveError) {
      setError(moveError);
      return;
    }
    await refresh();
  }

  const childrenOf = (id: string) => tasks.filter((task) => task.parentId === id);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat task...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            Kanban
          </Button>
          <Button
            type="button"
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            List
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            aria-label="Cari task"
            placeholder="Cari task / assignee..."
            className="w-52"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label="Filter status"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Semua status</option>
            {TASK_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Button type="button" size="sm" onClick={openCreate}>
            <PlusIcon aria-hidden="true" /> Task
          </Button>
        </div>
      </div>

      {error && !dialogOpen ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {view === "kanban" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {TASK_STATUSES.map((columnStatus) => {
            const column = topLevel.filter((task) => task.status === columnStatus);
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
                  <h3 className="text-sm font-semibold">{columnStatus}</h3>
                  <Badge variant="secondary">{column.length}</Badge>
                </header>
                <div className="space-y-2">
                  {column.map((task) => {
                    const effective = effectiveTaskPercent(task, tasks);
                    const children = childrenOf(task.id);
                    return (
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
                        <p className="mt-1 text-xs text-muted-foreground">
                          {effective}%{children.length > 0 ? ` (dari ${children.length} sub-task)` : ""}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-1"
                          onClick={() => openEdit(task)}
                        >
                          Buka
                        </Button>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="px-4">Aktivitas</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="px-4">
                      <p className={`font-medium ${task.parentId ? "pl-4 text-sm" : ""}`}>
                        {task.parentId ? "↳ " : ""}
                        {task.title}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{task.id}</p>
                    </TableCell>
                    <TableCell>{task.assignee || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {task.startDate ? formatDate(task.startDate) : "—"}
                      {" → "}
                      {task.targetDate ? formatDate(task.targetDate) : "—"}
                    </TableCell>
                    <TableCell>{effectiveTaskPercent(task, tasks)}%</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(task)}>
                        Ubah
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Task ${editTarget.id}` : "Task baru"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Ubah detail, kelola sub-task, diskusi, dan lampiran."
                : "Task baru berstatus To Do."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="task-title" className="text-sm font-medium">
                Nama aktivitas
              </label>
              <Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="task-assignee" className="text-sm font-medium">
                Penanggung jawab
              </label>
              <Input
                id="task-assignee"
                placeholder="Nama developer"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
              />
            </div>
            <FormSelect
              id="task-status"
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as TaskStatus)}
              options={TASK_STATUSES}
            />
            <div className="space-y-2">
              <label htmlFor="task-start" className="text-sm font-medium">
                Tanggal mulai
              </label>
              <Input id="task-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="task-target" className="text-sm font-medium">
                Target selesai
              </label>
              <Input id="task-target" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="task-percent" className="text-sm font-medium">
                % selesai
              </label>
              <Input
                id="task-percent"
                type="number"
                min="0"
                max="100"
                value={percent}
                onChange={(event) => setPercent(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="task-link" className="text-sm font-medium">
                Lampiran / link
              </label>
              <Input
                id="task-link"
                placeholder="https://..."
                value={link}
                onChange={(event) => setLink(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="task-notes" className="text-sm font-medium">
                Catatan
              </label>
              <textarea
                id="task-notes"
                className="min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {error}
              </p>
            ) : null}
            <DialogFooter className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : editTarget ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>

          {editTarget ? (
            <div className="space-y-4 border-t pt-4">
              <div>
                <p className="text-sm font-medium">Sub-task (% induk = rata-rata)</p>
                <ul className="mt-2 space-y-1">
                  {childrenOf(editTarget.id).map((child) => (
                    <li key={child.id} className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm">
                      <span>
                        {child.title} · {child.percent}%
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Hapus sub-task ${child.title}`}
                        onClick={() =>
                          void deleteTaskSummary(child.id).then(() => void refresh())
                        }
                      >
                        <MinusIcon aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <Input
                    aria-label="Nama sub-task baru"
                    placeholder="Sub-task baru..."
                    value={subTitle}
                    onChange={(event) => setSubTitle(event.target.value)}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => void handleAddSubTask()}>
                    Tambah
                  </Button>
                </div>
              </div>
              <CommentSection entityType="task" entityId={editTarget.id} />
              <AttachmentList entityType="task" entityId={editTarget.id} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
