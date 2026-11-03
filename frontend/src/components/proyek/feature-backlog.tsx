"use client";

import { useEffect, useState } from "react";
import { ArrowRightIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

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
import { FormSelect } from "@/components/crm/lead-table";
import { AssigneeSelect } from "@/components/proyek/assignee-select";
import { useMasterOptions } from "@/hooks/use-master-options";
import {
  convertFeatureToTask,
  createFeature,
  deleteFeature,
  ensureBacklogFromHandover,
  listFeatures,
  updateFeature,
} from "@/services/features";
import type { FeatureInput, ProjectFeature } from "@/types/feature";

const PRIORITY_STYLES: Record<string, string> = {
  High: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  Medium:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
};

/**
 * Backlog fitur per proyek (US-023): CRUD + impor handover + ubah jadi task.
 * Penjadwalan otomatis menyusul di US-024.
 */
export function FeatureBacklog({
  projectId,
  handoverId,
}: {
  projectId: string;
  handoverId: string;
}) {
  const { options } = useMasterOptions();
  const [features, setFeatures] = useState<ProjectFeature[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectFeature | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<string>("Medium");
  const [developer, setDeveloper] = useState("");
  const [estimateDays, setEstimateDays] = useState("1");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { data } = await listFeatures(projectId);
    if (data) {
      setFeatures(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listFeatures(projectId).then(({ data }) => {
      if (!cancelled && data) {
        setFeatures(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function openCreate() {
    setEditTarget(null);
    setName("");
    setCategory("");
    setPriority("Medium");
    setDeveloper("");
    setEstimateDays("1");
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(feature: ProjectFeature) {
    setEditTarget(feature);
    setName(feature.name);
    setCategory(feature.category);
    setPriority(feature.priority);
    setDeveloper(feature.developer);
    setEstimateDays(String(feature.estimateDays));
    setError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const input: FeatureInput = {
      name,
      category,
      priority: priority as FeatureInput["priority"],
      developer,
      estimateDays: Number(estimateDays),
    };
    const result = editTarget
      ? await updateFeature(editTarget.id, input)
      : await createFeature(projectId, input);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    await refresh();
  }

  async function handleImport() {
    setError(null);
    const { data, error: importError } = await ensureBacklogFromHandover(projectId, handoverId);
    if (importError) {
      setError(importError);
      return;
    }
    if ((data ?? []).length === 0) {
      setError("Tidak ada fitur baru dari handover.");
      return;
    }
    await refresh();
  }

  async function handleConvert(featureId: string) {
    setError(null);
    const { error: convertError } = await convertFeatureToTask(featureId);
    if (convertError) {
      setError(convertError);
      return;
    }
    await refresh();
  }

  async function handleDelete(featureId: string) {
    const { error: deleteError } = await deleteFeature(featureId);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    await refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-end justify-between border-b">
        <div>
          <CardTitle className="text-base">Backlog fitur</CardTitle>
          <CardDescription>
            Scope terpetakan per proyek. Penjadwalan otomatis menyusul.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void handleImport()}>
            Impor dari handover
          </Button>
          <Button type="button" size="sm" onClick={openCreate}>
            <PlusIcon aria-hidden="true" /> Fitur
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {features.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada fitur. Impor dari handover atau tambah manual.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">Fitur</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>Estimasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell className="px-4">
                    <p className="font-medium">{feature.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {feature.id}
                      {feature.source === "handover" ? " · dari handover" : ""}
                      {feature.taskId ? ` → ${feature.taskId}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>{feature.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PRIORITY_STYLES[feature.priority]}>
                      {feature.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{feature.developer || "—"}</TableCell>
                  <TableCell>{feature.estimateDays} hari</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {!feature.taskId ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleConvert(feature.id)}
                        >
                          <ArrowRightIcon aria-hidden="true" /> Jadi task
                        </Button>
                      ) : null}
                      <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(feature)}>
                        <PencilIcon aria-hidden="true" /> Ubah
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Hapus ${feature.name}`}
                        onClick={() => void handleDelete(feature.id)}
                      >
                        <Trash2Icon aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editTarget ? `Ubah ${editTarget.id}` : "Fitur baru"}</DialogTitle>
              <DialogDescription>Nama, kategori, prioritas, developer, estimasi hari.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="feature-name" className="text-sm font-medium">
                  Nama fitur
                </label>
                <Input id="feature-name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <FormSelect
                id="feature-category"
                label="Kategori"
                value={category}
                onChange={setCategory}
                options={options.feature_category}
                required
              />
              <FormSelect
                id="feature-priority"
                label="Prioritas"
                value={priority}
                onChange={setPriority}
                options={options.priority}
              />
              <AssigneeSelect
                id="feature-dev"
                label="Developer"
                value={developer}
                onChange={setDeveloper}
              />
              <div className="space-y-2">
                <label htmlFor="feature-estimate" className="text-sm font-medium">
                  Estimasi (hari)
                </label>
                <Input
                  id="feature-estimate"
                  type="number"
                  min="1"
                  value={estimateDays}
                  onChange={(event) => setEstimateDays(event.target.value)}
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
      </CardContent>
    </Card>
  );
}
