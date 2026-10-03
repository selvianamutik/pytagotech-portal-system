"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { listClients } from "@/services/clients";
import {
  canManageProjects,
  listProjectManagers,
  queryProjects,
  type ProjectWithNames,
} from "@/services/projects";
import { useAuthStore } from "@/store/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PROJECT_STATUSES } from "@/types/project";

/** Bilah progress sederhana (US-020). */
export function ProgressBar({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="h-2 w-20 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress ${value}%`}
      >
        <span className="block h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </span>
      <span className="text-xs text-muted-foreground">{value}%</span>
    </span>
  );
}

/**
 * Daftar proyek (US-020): pencarian + filter + progress otomatis.
 * Tombol buat/ubah hanya untuk PM dan Admin.
 */
export function ProjectList() {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<ProjectWithNames[]>([]);
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [pmName, setPmName] = useState("");
  const [clientId, setClientId] = useState("");

  const manageable = canManageProjects(user);

  useEffect(() => {
    let cancelled = false;
    void listClients().then(({ data }) => {
      if (!cancelled && data) {
        setClients(data.map((client) => ({ id: client.id, companyName: client.companyName })));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void queryProjects({
      search: search || undefined,
      statuses: status ? [status as ProjectWithNames["project"]["status"]] : undefined,
      pmNames: pmName ? [pmName] : undefined,
      clientIds: clientId ? [clientId] : undefined,
    }).then(({ data }) => {
      if (!cancelled) {
        setItems(data ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [search, status, pmName, clientId]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Proyek</p>
          <h1 className="mt-1 text-2xl font-bold">Daftar Proyek</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} proyek. Progress dihitung otomatis dari task.
          </p>
        </div>
        {manageable ? (
          <p className="text-xs text-muted-foreground">
            Proyek baru dibuat dari handover Dikonfirmasi (US-019).
          </p>
        ) : (
          <p className="text-xs text-muted-foreground" role="note">
            Hanya PM dan Admin yang dapat membuat/mengubah proyek.
          </p>
        )}
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <label htmlFor="project-search" className="text-sm font-medium">
            Pencarian
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="project-search"
              placeholder="Nama, kode, klien, PM..."
              className="pl-8"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        <FormSelect
          id="project-filter-status"
          label="Status"
          value={status}
          onChange={setStatus}
          options={PROJECT_STATUSES}
        />
        <FormSelect
          id="project-filter-pm"
          label="PM"
          value={pmName}
          onChange={setPmName}
          options={listProjectManagers()}
        />
        <FormSelect
          id="project-filter-client"
          label="Klien"
          value={clientId}
          onChange={setClientId}
          options={clients.map((client) => ({
            value: client.id,
            label: client.companyName,
          }))}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Memuat proyek...</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Tidak ada proyek yang cocok. Proyek lahir dari handover Dikonfirmasi.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="px-4">Proyek</TableHead>
                  <TableHead>PM</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(({ project, clientName, progress }) => (
                  <TableRow key={project.id}>
                    <TableCell className="px-4">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.id} · {clientName} · {formatCurrency(project.value)}
                      </p>
                    </TableCell>
                    <TableCell>{project.pmName}</TableCell>
                    <TableCell>{formatDate(project.targetDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={progress} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        render={<Link href={`/proyek/${project.id}`} />}
                      >
                        Buka
                      </Button>
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
