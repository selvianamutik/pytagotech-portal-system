"use client";

import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";

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
import { listIdeas } from "@/services/ideas";
import {
  createMaterial,
  createMaterialFromIdea,
  listMaterials,
} from "@/services/materials";
import type { ContentIdea } from "@/types/content-idea";
import type { ContentMaterial } from "@/types/material";
import { SOSMED_BRANDS } from "@/types/sosmed";

/**
 * Database produksi konten (US-028): tabel materi + form +
 * pembuatan dari ide Disetujui. Quality gate & approval menyusul.
 */
export function MaterialManager() {
  const [materials, setMaterials] = useState<ContentMaterial[]>([]);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [draftLink, setDraftLink] = useState("");
  const [copywriter, setCopywriter] = useState("");
  const [designer, setDesigner] = useState("");
  const [videoEditor, setVideoEditor] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [{ data: materialData }, { data: ideaData }] = await Promise.all([
      listMaterials(),
      listIdeas(),
    ]);
    if (materialData) {
      setMaterials(materialData);
    }
    if (ideaData) {
      setIdeas(
        ideaData.filter(
          (idea) => idea.readiness === "Disetujui" || idea.readiness === "Siap Masuk Produksi"
        )
      );
    }
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listMaterials(), listIdeas()]).then(([materialResult, ideaResult]) => {
      if (cancelled) {
        return;
      }
      if (materialResult.data) {
        setMaterials(materialResult.data);
      }
      if (ideaResult.data) {
        setIdeas(
          ideaResult.data.filter(
            (idea) => idea.readiness === "Disetujui" || idea.readiness === "Siap Masuk Produksi"
          )
        );
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: createError } = await createMaterial({
      title,
      brand,
      draftLink,
      copywriter,
      designer,
      videoEditor,
    });
    setPending(false);
    if (createError) {
      setError(createError);
      return;
    }
    setDialogOpen(false);
    setTitle("");
    await refresh();
  }

  async function handleFromIdea(ideaId: string) {
    setError(null);
    const { error: ideaError } = await createMaterialFromIdea(ideaId);
    if (ideaError) {
      setError(ideaError);
      return;
    }
    await refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat materi...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Sosmed · Produksi</p>
          <h1 className="mt-1 text-2xl font-bold">Database Produksi Konten</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {materials.length} materi terlacak dari draf sampai rilis.
          </p>
        </div>
        <Button type="button" onClick={() => setDialogOpen(true)}>
          <PlusIcon aria-hidden="true" /> Tambah materi
        </Button>
      </div>

      {error && !dialogOpen ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {ideas.length > 0 ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Ide siap produksi</CardTitle>
            <CardDescription>Buat materi langsung dari ide Disetujui.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {ideas.map((idea) => (
                <li key={idea.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    <span className="font-medium">{idea.title}</span>{" "}
                    <span className="font-mono text-xs text-muted-foreground">{idea.id}</span>
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => void handleFromIdea(idea.id)}>
                    Jadikan materi
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">Materi</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead>Tim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="px-4">
                    <p className="font-medium">{material.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {material.id}
                      {material.ideaId ? ` · dari ${material.ideaId}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>{material.brand}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{material.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {material.scheduleDate ?? "—"}
                    {material.releaseTime ? ` ${material.releaseTime}` : ""}
                  </TableCell>
                  <TableCell className="text-xs">
                    {[material.copywriter && `CW: ${material.copywriter}`, material.designer && `GD: ${material.designer}`, material.videoEditor && `VE: ${material.videoEditor}`]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Materi baru</DialogTitle>
            <DialogDescription>Status awal Draf; penugasan tim produksi.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="mat-title" className="text-sm font-medium">
                Judul materi
              </label>
              <Input id="mat-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>
            <FormSelect id="mat-brand" label="Lini bisnis" value={brand} onChange={setBrand} options={SOSMED_BRANDS} required />
            <div className="space-y-2">
              <label htmlFor="mat-link" className="text-sm font-medium">
                Link draft
              </label>
              <Input id="mat-link" placeholder="https://... (opsional)" value={draftLink} onChange={(event) => setDraftLink(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="mat-cw" className="text-sm font-medium">
                Copywriter
              </label>
              <Input id="mat-cw" value={copywriter} onChange={(event) => setCopywriter(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="mat-gd" className="text-sm font-medium">
                Graphic Designer
              </label>
              <Input id="mat-gd" value={designer} onChange={(event) => setDesigner(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="mat-ve" className="text-sm font-medium">
                Video Editor
              </label>
              <Input id="mat-ve" value={videoEditor} onChange={(event) => setVideoEditor(event.target.value)} />
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
