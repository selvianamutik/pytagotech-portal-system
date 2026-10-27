"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/crm/lead-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { queryAuditLogs } from "@/services/audit";
import type { AuditEntry } from "@/types/audit";
import { formatDateTime } from "@/lib/utils";

/**
 * Halaman Audit Log (US-004, AC2): riwayat perubahan dari trigger database
 * dengan filter aktor, modul (tipe entitas), dan rentang tanggal.
 * Append-only: tidak ada aksi ubah/hapus di UI (AC3).
 */
export function AuditLogViewer() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [actor, setActor] = useState("");
  const [entityType, setEntityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function search(filters?: {
    actor?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await queryAuditLogs({
      actor: filters?.actor || undefined,
      entityType: filters?.entityType || undefined,
      dateFrom: filters?.dateFrom || undefined,
      dateTo: filters?.dateTo || undefined,
    });
    setLoading(false);
    if (error || !data) {
      setLoadError(error ?? "Gagal memuat audit log.");
      return;
    }
    setEntries(data);
    setEntityTypes((previous) => {
      const merged = new Set([
        ...previous,
        ...data.map((entry) => entry.entityType),
      ]);
      return [...merged].sort();
    });
  }

  useEffect(() => {
    let cancelled = false;
    void queryAuditLogs({}).then(({ data, error }) => {
      if (cancelled) {
        return;
      }
      if (error || !data) {
        setLoadError(error ?? "Gagal memuat audit log.");
      } else {
        setEntries(data);
        setEntityTypes([...new Set(data.map((entry) => entry.entityType))].sort());
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    void search({ actor, entityType, dateFrom, dateTo });
  }

  function handleReset() {
    setActor("");
    setEntityType("");
    setDateFrom("");
    setDateTo("");
    void search({});
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div>
        <p className="text-sm font-medium text-primary">Pengaturan · Audit</p>
        <h1 className="mt-1 text-2xl font-bold">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Setiap create/update/delete pada entitas utama tercatat otomatis
          (aktor, waktu, tabel, nilai lama & baru). Log bersifat final.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-5"
      >
        <div className="space-y-2">
          <label htmlFor="audit-actor" className="text-sm font-medium">
            Aktor
          </label>
          <Input
            id="audit-actor"
            placeholder="Nama aktor..."
            value={actor}
            onChange={(event) => setActor(event.target.value)}
          />
        </div>
        <FormSelect
          id="audit-entity"
          label="Modul"
          value={entityType}
          onChange={setEntityType}
          options={entityTypes}
        />
        <div className="space-y-2">
          <label htmlFor="audit-from" className="text-sm font-medium">
            Dari tanggal
          </label>
          <Input
            id="audit-from"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="audit-to" className="text-sm font-medium">
            Sampai tanggal
          </label>
          <Input
            id="audit-to"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit">Cari</Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </form>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Memuat audit log...</p>
          ) : loadError ? (
            <div className="p-6">
              <p className="mb-3 text-sm text-destructive">{loadError}</p>
              <Button type="button" onClick={() => void search({})}>
                Muat ulang
              </Button>
            </div>
          ) : entries.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Belum ada entri audit untuk filter ini.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="px-4">Waktu</TableHead>
                  <TableHead>Aktor</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Entitas</TableHead>
                  <TableHead>Perubahan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="px-4 whitespace-nowrap">
                      {formatDateTime(entry.createdAt)}
                    </TableCell>
                    <TableCell>{entry.actorName}</TableCell>
                    <TableCell className="font-mono text-xs">{entry.action}</TableCell>
                    <TableCell>
                      <p className="font-medium">{entry.entityType}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {entry.entityId.slice(0, 8)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {entry.oldValue || entry.newValue ? (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-primary">
                            Lihat nilai
                          </summary>
                          {entry.oldValue ? (
                            <pre className="mt-1 max-w-72 overflow-auto rounded bg-muted p-2">
                              <span className="text-destructive">- {entry.oldValue}</span>
                            </pre>
                          ) : null}
                          {entry.newValue ? (
                            <pre className="mt-1 max-w-72 overflow-auto rounded bg-muted p-2">
                              <span className="text-emerald-700 dark:text-emerald-300">
                                + {entry.newValue}
                              </span>
                            </pre>
                          ) : null}
                        </details>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
