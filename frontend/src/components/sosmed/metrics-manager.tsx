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
import { FormSelect } from "@/components/crm/lead-table";
import { listMaterials } from "@/services/materials";
import {
  deleteMetric,
  listMetrics,
  recordMetric,
  updateMetric,
} from "@/services/metrics";
import { listPublications } from "@/services/publications";
import { useAuthStore } from "@/store/auth";
import { engagementRate, ER_FORMULA, type MetricInput, type PostMetric } from "@/types/metric";

const METRIC_FIELDS: { key: keyof Omit<MetricInput, "snapshot">; label: string }[] = [
  { key: "views", label: "Views/Impresi" },
  { key: "reach", label: "Reach" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Shares" },
  { key: "saves", label: "Saves" },
];

/**
 * Analytics performa posting (US-035, FR-25): metrik per publikasi,
 * ER otomatis (Q-002 C), snapshot Monitoring/Final + kunci Final.
 */
export function MetricsManager() {
  const user = useAuthStore((state) => state.user);
  const [publications, setPublications] = useState<{ id: string; label: string }[]>([]);
  const [publicationId, setPublicationId] = useState("");
  const [metrics, setMetrics] = useState<PostMetric[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PostMetric | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [snapshot, setSnapshot] = useState("Monitoring");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = user?.roles ?? ["Social Media Specialist"];

  async function refresh(publId: string) {
    const { data } = await listMetrics(publId || undefined);
    if (data) {
      setMetrics(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listPublications(), listMaterials()]).then(([pubResult, matResult]) => {
      if (!cancelled) {
        const titles = new Map(
          (matResult.data ?? []).map((material) => [material.id, material.title])
        );
        setPublications(
          (pubResult.data ?? []).map((publication) => ({
            id: publication.id,
            label: `${publication.id} · ${publication.platform} · ${titles.get(publication.materialId) ?? publication.materialId}`,
          }))
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listMetrics(publicationId || undefined).then(({ data }) => {
      if (!cancelled && data) {
        setMetrics(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [publicationId]);

  function openCreate() {
    setEditTarget(null);
    setValues({});
    setSnapshot("Monitoring");
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(metric: PostMetric) {
    setEditTarget(metric);
    setValues({
      views: String(metric.views),
      reach: String(metric.reach),
      likes: String(metric.likes),
      comments: String(metric.comments),
      shares: String(metric.shares),
      saves: String(metric.saves),
    });
    setSnapshot(metric.snapshot);
    setError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!publicationId && !editTarget) {
      setError("Pilih publikasi terlebih dahulu.");
      return;
    }
    setPending(true);
    setError(null);
    const input: MetricInput = {
      views: Number(values.views),
      reach: Number(values.reach),
      likes: Number(values.likes),
      comments: Number(values.comments),
      shares: Number(values.shares),
      saves: Number(values.saves),
      snapshot: snapshot as MetricInput["snapshot"],
    };
    const result = editTarget
      ? await updateMetric(editTarget.id, input, [...roles])
      : await recordMetric(publicationId, input, user?.name ?? "Alya");
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    await refresh(editTarget?.publicationId ?? publicationId);
  }

  async function handleDelete(metricId: string) {
    const { error: deleteError } = await deleteMetric(metricId, [...roles]);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    await refresh(publicationId);
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Sosmed · Analytics</p>
          <h1 className="mt-1 text-2xl font-bold">Analytics Performa Posting</h1>
          <p className="mt-1 text-sm text-muted-foreground" title={ER_FORMULA}>
            {ER_FORMULA}
          </p>
        </div>
        <Button type="button" onClick={openCreate} disabled={!publicationId}>
          <PlusIcon aria-hidden="true" /> Catat metrik
        </Button>
      </div>

      <div className="max-w-md">
        <FormSelect
          id="metric-pub"
          label="Publikasi"
          value={publicationId}
          onChange={setPublicationId}
          options={publications.map((option) => ({ value: option.id, label: option.label }))}
        />
      </div>

      {error && !dialogOpen ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Snapshot metrik</CardTitle>
          <CardDescription>
            Final: satu per publikasi, terkunci kecuali Super Admin / Leader.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {metrics.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {publicationId ? "Belum ada metrik untuk publikasi ini." : "Pilih publikasi terlebih dahulu."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="px-4">Tanggal</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Reach</TableHead>
                  <TableHead>Interaksi</TableHead>
                  <TableHead>ER</TableHead>
                  <TableHead>Snapshot</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell className="px-4 font-mono text-xs">
                      {metric.id}
                    </TableCell>
                    <TableCell>{metric.views.toLocaleString("id-ID")}</TableCell>
                    <TableCell>{metric.reach.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-xs">
                      👍 {metric.likes} · 💬 {metric.comments} · 🔁 {metric.shares} · 🔖 {metric.saves}
                    </TableCell>
                    <TableCell className="font-medium" title={ER_FORMULA}>
                      {engagementRate(metric).toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant={metric.snapshot === "Final" ? "default" : "outline"}>
                        {metric.snapshot === "Final" ? "KPI Final" : "Monitoring"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(metric)}>
                          <PencilIcon aria-hidden="true" /> Ubah
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Hapus ${metric.id}`}
                          onClick={() => void handleDelete(metric.id)}
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? `Ubah ${editTarget.id}` : "Metrik baru"}</DialogTitle>
            <DialogDescription>Angka per publikasi dari dasbor platform (input manual).</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {METRIC_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <label htmlFor={`metric-${field.key}`} className="text-sm font-medium">
                  {field.label}
                </label>
                <Input
                  id={`metric-${field.key}`}
                  type="number"
                  min="0"
                  value={values[field.key] ?? ""}
                  onChange={(event) =>
                    setValues((previous) => ({ ...previous, [field.key]: event.target.value }))
                  }
                  required
                />
              </div>
            ))}
            <FormSelect
              id="metric-snapshot"
              label="Snapshot"
              value={snapshot}
              onChange={setSnapshot}
              options={["Monitoring", "Final"]}
            />
            {error ? (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {error}
              </p>
            ) : null}
            <DialogFooter className="sm:col-span-2">
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
