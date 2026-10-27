"use client";

import { useEffect, useState } from "react";
import { TriangleAlertIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/crm/lead-table";
import { useMasterOptions } from "@/hooks/use-master-options";
import {
  createPublication,
  deletePublication,
  getUncoveredPlatforms,
  listPublications,
  recordRelease,
} from "@/services/publications";
import type { Publication } from "@/types/publication";
import { DISTRIBUTION_PATTERNS } from "@/types/publication";

/**
 * Distribusi multiplatform Parent-Child (US-031, FR-23): satu MAT
 * ke banyak PUB dengan pola Single/Crosspost + peringatan rekonsiliasi.
 */
export function DistributionSection({ materialId }: { materialId: string }) {
  const { options } = useMasterOptions();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [uncovered, setUncovered] = useState<string[]>([]);
  const [platform, setPlatform] = useState("");
  const [pattern, setPattern] = useState<string>(DISTRIBUTION_PATTERNS[0]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releaseFor, setReleaseFor] = useState<string | null>(null);
  const [releaseDate, setReleaseDate] = useState("");
  const [liveLink, setLiveLink] = useState("");

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

  async function handleRelease(event: React.FormEvent) {
    event.preventDefault();
    if (!releaseFor) {
      return;
    }
    setPending(true);
    setError(null);
    const { error: releaseError } = await recordRelease(releaseFor, {
      releaseDate,
      liveLink,
    });
    setPending(false);
    if (releaseError) {
      setError(releaseError);
      return;
    }
    setReleaseFor(null);
    setReleaseDate("");
    setLiveLink("");
    await refresh();
  }

  const usedPlatforms = new Set<string>(
    publications.map((publication) => publication.platform)
  );
  const available = options.platform.filter((item) => !usedPlatforms.has(item));

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
                className="rounded-lg border px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{publication.platform}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {publication.id} · {publication.pattern}
                      {publication.scheduleDate ? ` · ${publication.scheduleDate}` : ""}
                    </p>
                    {publication.releaseDate ? (
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        Live {publication.releaseDate}
                        {publication.liveLink ? ` · ${publication.liveLink}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {!publication.releaseDate ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReleaseFor(publication.id);
                          setReleaseDate(publication.scheduleDate ?? "");
                          setLiveLink("");
                          setError(null);
                        }}
                      >
                        Catat rilis
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Hapus publikasi ${publication.platform}`}
                      onClick={() => void handleDelete(publication.id)}
                    >
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                {releaseFor === publication.id ? (
                  <form onSubmit={handleRelease} className="mt-2 flex flex-wrap items-end gap-2 border-t pt-2">
                    <div className="space-y-1">
                      <label htmlFor={`rel-date-${publication.id}`} className="text-xs text-muted-foreground">
                        Tanggal aktual rilis
                      </label>
                      <Input
                        id={`rel-date-${publication.id}`}
                        type="date"
                        value={releaseDate}
                        onChange={(event) => setReleaseDate(event.target.value)}
                        required
                      />
                    </div>
                    <div className="min-w-52 flex-1 space-y-1">
                      <label htmlFor={`rel-link-${publication.id}`} className="text-xs text-muted-foreground">
                        Link post live
                      </label>
                      <Input
                        id={`rel-link-${publication.id}`}
                        placeholder="https://..."
                        value={liveLink}
                        onChange={(event) => setLiveLink(event.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" size="sm" disabled={pending}>
                      {pending ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </form>
                ) : null}
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
