"use client";

import { useEffect, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  createTaskTemplate,
  deleteTaskTemplate,
  listTaskTemplates,
  updateTaskTemplate,
} from "@/services/task-templates";
import type { TaskTemplate } from "@/types/task";

/**
 * Kelola template task standar (US-021, FR-16) — khusus Admin.
 * Isi seed menunggu jawaban Q-005 dari tim Produksi.
 */
export function TaskTemplateManager() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TaskTemplate | null>(null);
  const [name, setName] = useState("");
  const [order, setOrder] = useState("1");
  const [duration, setDuration] = useState("1");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { data } = await listTaskTemplates();
    if (data) {
      setTemplates(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listTaskTemplates().then(({ data }) => {
      if (!cancelled) {
        setTemplates(data ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditTarget(null);
    setName("");
    setOrder(String(templates.length + 1));
    setDuration("1");
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(template: TaskTemplate) {
    setEditTarget(template);
    setName(template.name);
    setOrder(String(template.order));
    setDuration(String(template.defaultDurationDays));
    setError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const input = {
      name,
      order: Number(order),
      defaultDurationDays: Number(duration),
      isActive: editTarget?.isActive ?? true,
    };
    const result = editTarget
      ? await updateTaskTemplate(editTarget.id, input)
      : await createTaskTemplate(input);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    await refresh();
  }

  async function handleToggle(template: TaskTemplate) {
    await updateTaskTemplate(template.id, {
      name: template.name,
      order: template.order,
      defaultDurationDays: template.defaultDurationDays,
      isActive: !template.isActive,
    });
    await refresh();
  }

  async function handleDelete(template: TaskTemplate) {
    const { error: deleteError } = await deleteTaskTemplate(template.id);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    await refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat template...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Pengaturan · Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold">Template Task</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Task standar yang ter-generate otomatis setiap proyek baru.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <PlusIcon aria-hidden="true" /> Tambah template
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Daftar template</CardTitle>
          <CardDescription>
            Isi awal menunggu daftar standar tim Produksi (Q-005). Template
            nonaktif dilewati saat generate.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">Urutan</TableHead>
                <TableHead>Aktivitas</TableHead>
                <TableHead>Durasi (hari)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="px-4 font-mono">{template.order}</TableCell>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.defaultDurationDays}</TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? "default" : "outline"}>
                      {template.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(template)}>
                        <PencilIcon aria-hidden="true" /> Ubah
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleToggle(template)}
                      >
                        {template.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Hapus ${template.name}`}
                        onClick={() => void handleDelete(template)}
                      >
                        <Trash2Icon aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {error && !dialogOpen ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? `Ubah ${editTarget.id}` : "Template baru"}</DialogTitle>
            <DialogDescription>Nama aktivitas, urutan, dan durasi default.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="tpl-name" className="text-sm font-medium">
                Nama aktivitas
              </label>
              <Input id="tpl-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="tpl-order" className="text-sm font-medium">
                Urutan
              </label>
              <Input
                id="tpl-order"
                type="number"
                min="1"
                value={order}
                onChange={(event) => setOrder(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tpl-duration" className="text-sm font-medium">
                Durasi default (hari)
              </label>
              <Input
                id="tpl-duration"
                type="number"
                min="1"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                required
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
