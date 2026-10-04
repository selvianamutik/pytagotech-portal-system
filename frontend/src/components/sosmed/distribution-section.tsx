"use client";

import { useEffect, useState } from "react";
import { TriangleAlertIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/crm/lead-table";
import {
  createPublication,
  deletePublication,
  getUncoveredPlatforms,
  listPublications,
} from "@/services/publications";
import { SOSMED_PLATFORMS } from "@/types/sosmed";
import type { Publication } from "@/types/publication";
import { DISTRIBUTION_PATTERNS } from "@/types/publication";

/**
 * Distribusi multiplatform Parent-Child (US-031, FR-23): satu MAT
 * ke banyak PUB dengan pola Single/Crosspost + peringatan rekonsiliasi.
 */
export function DistributionSection({ materialId }: { materialId: string }) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [uncovered, setUncovered] = useState<string[]>([]);
  const [platform, setPlatform] = useState("");
  const [pattern, setPattern] = useState<string>(DISTRIBUTION_PATTERNS[0]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [{ data: pubData }, { data: uncoveredData }] = await Promise.all([
      listPublications(materialId),
      getUncoveredPlatforms(materialId),
    ]);
    if (pubData) {
      setPublications(pubData);
    }
    if (uncoveredData) {
      setUncovered(uncoveredData);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      listPublications(materialId),
      getUncoveredPlatforms(materialId),
    ]).then(([pubResult, uncoveredResult]) => {
      if (!cancelled) {
        setPublications(pubResult.data ?? []);
        setUncovered(uncoveredResult.data ?? []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [materialId]);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: createError } = await createPublication(materialId, platform, pattern);
    setPending(false);
    if (createError) {
      setError(createError);
      return;
    }
    setPlatform("");
    await refresh();
  }

  async function handleDelete(publicationId: string) {
    const { error: deleteError } = await deletePublication(publicationId);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    await refresh();
  }

  const usedPlatforms = new Set(publications.map((publication) => publication.platform));
  const available = SOSMED_PLATFORMS.filter((item) => !usedPlatforms.has(item));

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">Distribusi multiplatform</CardTitle>
        <CardDescription>
          Satu materi induk ke banyak publikasi (Single / Crosspost).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {uncovered.length > 0 ? (
          <p
            role="status"
            className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
          >
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Platform tujuan belum memiliki publikasi: {uncovered.join(", ")}.
          </p>
        ) : null}

        {publications.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada publikasi.</p>
        ) : (
          <ul className="space-y-2">
            {publications.map((publication) => (
              <li
                key={publication.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{publication.platform}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {publication.id} · {publication.pattern}
                    {publication.scheduleDate ? ` · ${publication.scheduleDate}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Hapus publikasi ${publication.platform}`}
                  onClick={() => void handleDelete(publication.id)}
                >
                  <Trash2Icon aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
          <FormSelect
            id={`pub-platform-${materialId}`}
            label="Platform"
            value={platform}
            onChange={setPlatform}
            options={available}
          />
          <FormSelect
            id={`pub-pattern-${materialId}`}
            label="Pola"
            value={pattern}
            onChange={setPattern}
            options={DISTRIBUTION_PATTERNS}
          />
          <Button type="submit" size="sm" disabled={pending || !platform}>
            {pending ? "Menambah..." : "Tambah publikasi"}
          </Button>
        </form>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
