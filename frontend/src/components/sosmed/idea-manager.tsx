"use client";

import { useEffect, useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";

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
import { FormSelect } from "@/components/crm/lead-table";
import { briefScore, IDEA_FUNNELS, IDEA_READINESS, type ContentBrief, type ContentIdea, type IdeaInput } from "@/types/content-idea";
import { SOSMED_BRANDS, SOSMED_PLATFORMS } from "@/types/sosmed";
import { createIdea, listIdeas, updateIdea } from "@/services/ideas";

const EMPTY_BRIEF: ContentBrief = { hook: "", angle: "", keyPoints: "", cta: "", assetRef: "" };

const BRIEF_FIELDS: { key: keyof ContentBrief; label: string }[] = [
  { key: "hook", label: "Hook" },
  { key: "angle", label: "Angle" },
  { key: "keyPoints", label: "Poin Kunci / Value" },
  { key: "cta", label: "CTA" },
  { key: "assetRef", label: "Referensi Aset" },
];

/**
 * Content Planner (US-027, FR-21): ide + brief + skor otomatis
 * + validasi ambang Siap Masuk Produksi 5/5.
 */
export function IdeaManager() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ContentIdea | null>(null);

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [pillar, setPillar] = useState("");
  const [funnel, setFunnel] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [brief, setBrief] = useState<ContentBrief>(EMPTY_BRIEF);
  const [readiness, setReadiness] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { data } = await listIdeas();
    if (data) {
      setIdeas(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listIdeas().then(({ data }) => {
      if (!cancelled) {
        setIdeas(data ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditTarget(null);
    setTitle("");
    setBrand("");
    setPillar("");
    setFunnel("");
    setPlatforms([]);
    setBrief(EMPTY_BRIEF);
    setReadiness("");
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(idea: ContentIdea) {
    setEditTarget(idea);
    setTitle(idea.title);
    setBrand(idea.brand);
    setPillar(idea.pillar);
    setFunnel(idea.funnel);
    setPlatforms([...idea.targetPlatforms]);
    setBrief({ ...idea.brief });
    setReadiness(idea.readiness);
    setError(null);
    setDialogOpen(true);
  }

  const liveScore = briefScore(brief);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const input: IdeaInput = {
      title,
      brand,
      pillar,
      funnel,
      targetPlatforms: platforms as IdeaInput["targetPlatforms"],
      brief,
      readiness,
    };
    const result = editTarget
      ? await updateIdea(editTarget.id, input)
      : await createIdea(input);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    await refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat content planner...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Sosmed · Perencanaan</p>
          <h1 className="mt-1 text-2xl font-bold">Content Planner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ideas.length} ide. Skor brief = field terisi ÷ 5; Siap Produksi butuh 5/5.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <PlusIcon aria-hidden="true" /> Tambah ide
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">Ide</TableHead>
                <TableHead>Brand / Pillar / Funnel</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Skor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ideas.map((idea) => {
                const score = briefScore(idea.brief);
                return (
                  <TableRow key={idea.id}>
                    <TableCell className="px-4">
                      <p className="font-medium">{idea.title}</p>
                      <p className="font-mono text-xs text-muted-foreground">{idea.id}</p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {idea.brand} · {idea.pillar} · {idea.funnel}
                    </TableCell>
                    <TableCell className="text-xs">{idea.targetPlatforms.join(", ")}</TableCell>
                    <TableCell>
                      <Badge variant={score === 5 ? "default" : "outline"}>{score}/5</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{idea.readiness}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(idea)}>
                        <PencilIcon aria-hidden="true" /> Ubah
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Ubah ${editTarget.id}` : "Ide baru"}</DialogTitle>
            <DialogDescription>
              Skor brief saat ini: {liveScore}/5.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="idea-title" className="text-sm font-medium">
                Judul
              </label>
              <Input id="idea-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>
            <FormSelect id="idea-brand" label="Lini bisnis" value={brand} onChange={setBrand} options={SOSMED_BRANDS} required />
            <div className="space-y-2">
              <label htmlFor="idea-pillar" className="text-sm font-medium">
                Pillar
              </label>
              <Input id="idea-pillar" value={pillar} onChange={(event) => setPillar(event.target.value)} required />
            </div>
            <FormSelect id="idea-funnel" label="Funnel" value={funnel} onChange={setFunnel} options={IDEA_FUNNELS} required />
            <FormSelect
              id="idea-readiness"
              label="Status kelayakan"
              value={readiness}
              onChange={setReadiness}
              options={IDEA_READINESS}
              required
            />
            <fieldset className="space-y-2 sm:col-span-2">
              <legend className="text-sm font-medium">Platform target</legend>
              <div className="flex flex-wrap gap-3">
                {SOSMED_PLATFORMS.map((platform) => (
                  <label key={platform} className="flex cursor-pointer items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={platforms.includes(platform)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setPlatforms((previous) => [...previous, platform]);
                        } else {
                          setPlatforms((previous) => previous.filter((item) => item !== platform));
                        }
                      }}
                    />
                    {platform}
                  </label>
                ))}
              </div>
            </fieldset>
            {BRIEF_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <label htmlFor={`brief-${field.key}`} className="text-sm font-medium">
                  {field.label}
                </label>
                <Input
                  id={`brief-${field.key}`}
                  value={brief[field.key]}
                  onChange={(event) => setBrief((previous) => ({ ...previous, [field.key]: event.target.value }))}
                />
              </div>
            ))}
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
