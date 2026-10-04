"use client";

import { useEffect, useState } from "react";
import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Markdown } from "@/components/sosmed/markdown";
import {
  listGuides,
  listRaci,
  setRaciCell,
  updateGuide,
} from "@/services/guides";
import { useAuthStore } from "@/store/auth";
import type { Guide, RaciRow } from "@/types/guide";
import { RACI_ROLES, RACI_VALUES } from "@/types/guide";

/**
 * SOP, panduan & matriks RACI (US-042): panduan markdown dapat
 * dibaca semua role dan disunting Admin; RACI per aktivitas × role.
 */
export function GuidesManager() {
  const user = useAuthStore((state) => state.user);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [raci, setRaci] = useState<RaciRow[]>([]);
  const [activeSlug, setActiveSlug] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const admin =
    user?.roles.includes("Super Admin") || user?.roles.includes("Executive / Leader");

  async function refresh() {
    const [{ data: guideData }, { data: raciData }] = await Promise.all([
      listGuides(),
      listRaci(),
    ]);
    if (guideData) {
      setGuides(guideData);
      setActiveSlug((previous) => previous || guideData[0]?.slug || "");
    }
    if (raciData) {
      setRaci(raciData);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listGuides(), listRaci()]).then(([guideResult, raciResult]) => {
      if (!cancelled) {
        setGuides(guideResult.data ?? []);
        setActiveSlug((guideResult.data ?? [])[0]?.slug ?? "");
        setRaci(raciResult.data ?? []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = guides.find((guide) => guide.slug === activeSlug);

  async function handleSaveGuide() {
    if (!active) {
      return;
    }
    setPending(true);
    setError(null);
    const { error: saveError } = await updateGuide(active.slug, draft);
    setPending(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    setEditing(false);
    await refresh();
  }

  async function handleRaciCell(activity: string, role: string, value: string) {
    const { error: cellError } = await setRaciCell(activity, role, value);
    if (cellError) {
      setError(cellError);
      return;
    }
    await refresh();
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div>
        <p className="text-sm font-medium text-primary">Pengaturan · Tata Kelola</p>
        <h1 className="mt-1 text-2xl font-bold">SOP, Panduan & RACI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Panduan peran dan matriks tanggung jawab lintas role.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="space-y-1">
            {guides.map((guide) => (
              <button
                key={guide.slug}
                type="button"
                onClick={() => {
                  setActiveSlug(guide.slug);
                  setEditing(false);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                  guide.slug === activeSlug ? "bg-muted font-medium" : "hover:bg-muted/50"
                }`}
              >
                {guide.title}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-end justify-between border-b">
            <div>
              <CardTitle className="text-base">{active?.title}</CardTitle>
              <CardDescription>
                Terakhir diubah {active ? new Date(active.updatedAt).toLocaleString("id-ID") : "—"}
              </CardDescription>
            </div>
            {admin && !editing ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDraft(active?.content ?? "");
                  setError(null);
                  setEditing(true);
                }}
              >
                <PencilIcon aria-hidden="true" /> Ubah
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-2">
                <label htmlFor="guide-draft" className="sr-only">
                  Isi panduan (markdown)
                </label>
                <textarea
                  id="guide-draft"
                  className="min-h-64 w-full rounded-lg border border-input bg-transparent p-3 font-mono text-sm outline-none focus-visible:border-ring"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" disabled={pending} onClick={() => void handleSaveGuide()}>
                    {pending ? "Menyimpan..." : "Simpan"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <Markdown content={active?.content ?? ""} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Matriks RACI</CardTitle>
          <CardDescription>
            R = Responsible, A = Accountable, C = Consulted, I = Informed.
            {admin ? " Klik sel untuk mengubah." : " Hanya Admin yang dapat mengubah."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="px-4">Aktivitas</TableHead>
                  {RACI_ROLES.map((role) => (
                    <TableHead key={role} className="text-xs">
                      {role}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {raci.map((row) => (
                  <TableRow key={row.activity}>
                    <TableCell className="px-4 text-sm font-medium">{row.activity}</TableCell>
                    {RACI_ROLES.map((role) => (
                      <TableCell key={role}>
                        {admin ? (
                          <select
                            aria-label={`${row.activity} — ${role}`}
                            className="h-8 rounded-lg border border-input bg-transparent px-1 text-sm"
                            value={row.assignments[role] ?? ""}
                            onChange={(event) =>
                              void handleRaciCell(row.activity, role, event.target.value)
                            }
                          >
                            <option value="">—</option>
                            {RACI_VALUES.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-mono text-sm">
                            {row.assignments[role] || "—"}
                          </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
