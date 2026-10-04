"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { globalSearch, type SearchHit } from "@/services/search";
import { useAuthStore } from "@/store/auth";

const KIND_LABELS: Record<SearchHit["kind"], string> = {
  lead: "Lead",
  klien: "Klien",
  proyek: "Proyek",
  task: "Task",
  materi: "Materi",
};

/**
 * Pencarian global Ctrl/Cmd+K (US-044, FR-31): lead, klien, proyek,
 * task, materi. Hak akses penuh ditegakkan RLS Fase 2 (US-003).
 */
export function GlobalSearch() {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      return;
    }
    const timer = setTimeout(() => {
      void globalSearch(query, user).then(({ data }) => setHits(data ?? []));
    }, 150);
    return () => clearTimeout(timer);
  }, [open, query, user]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setHits([]);
    }
  }

  const grouped = new Map<string, SearchHit[]>();
  for (const hit of hits) {
    const list = grouped.get(hit.kind) ?? [];
    list.push(hit);
    grouped.set(hit.kind, list);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-8 w-full max-w-md items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground md:flex"
        aria-label="Pencarian global (Ctrl+K)"
      >
        <SearchIcon className="size-4" aria-hidden="true" />
        <span className="flex-1 text-left">Cari lead, klien, proyek, task, materi...</span>
        <kbd className="rounded border px-1 font-mono text-[10px]">Ctrl K</kbd>
      </button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pencarian global</DialogTitle>
          </DialogHeader>
          <Input
            aria-label="Kata kunci pencarian"
            placeholder="Ketik minimal 2 huruf..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (event.target.value.trim().length < 2) {
                setHits([]);
              }
            }}
            autoFocus
          />
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {query.trim().length >= 2 && hits.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada hasil.</p>
            ) : (
              [...grouped.entries()].map(([kind, list]) => (
                <div key={kind}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {KIND_LABELS[kind as SearchHit["kind"]]}
                  </p>
                  <ul className="space-y-1">
                    {list.map((hit) => (
                      <li key={`${hit.kind}-${hit.id}`}>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto w-full justify-start py-2"
                          nativeButton={false}
                          render={
                            <Link href={hit.href} onClick={() => setOpen(false)} />
                          }
                        >
                          <span className="min-w-0 text-left">
                            <span className="block truncate text-sm font-medium">
                              {hit.title}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {hit.subtitle}
                            </span>
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
