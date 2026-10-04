"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DownloadIcon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  getProductionDashboard,
  type ProductionDashboardData,
} from "@/services/production-dashboard";
import {
  buildExcelFile,
  buildPdfFile,
  downloadBlob,
} from "@/services/production-export";
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
 * Halaman Proyek gabungan (US-020 + US-026): KPI + deadline watch +
 * daftar dengan pencarian/filter + ekspor Excel/PDF.
 */
export function ProjectList() {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<ProjectWithNames[]>([]);
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([]);
  const [dashboard, setDashboard] = useState<ProductionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [pmName, setPmName] = useState("");
  const [clientId, setClientId] = useState("");

  const manageable = canManageProjects(user);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listClients(), getProductionDashboard({})]).then(
      ([clientsResult, dashboardResult]) => {
        if (!cancelled) {
          setClients(
            (clientsResult.data ?? []).map((client) => ({
              id: client.id,
              companyName: client.companyName,
            }))
          );
          setDashboard(dashboardResult.data);
        }
      }
    );
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

  function handleExport(kind: "excel" | "pdf") {
    if (!dashboard) {
      return;
    }
    const file = kind === "excel" ? buildExcelFile(dashboard) : buildPdfFile(dashboard);
    downloadBlob(file.blob, file.filename);
  }

  const metrics = dashboard
    ? [
        { label: "Total Proyek", value: String(dashboard.kpi.totalProjects) },
        { label: "Proyek Aktif", value: String(dashboard.kpi.activeProjects) },
        { label: "Task Selesai", value: String(dashboard.kpi.tasksDone) },
        { label: "Task Berlangsung", value: String(dashboard.kpi.tasksInProgress) },
        { label: "Task Blocked", value: String(dashboard.kpi.tasksBlocked) },
      ]
    : [];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Proyek</p>
          <h1 className="mt-1 text-2xl font-bold">Proyek</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan eksekutif + daftar portofolio. Progress dihitung otomatis dari task.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!dashboard}
            onClick={() => handleExport("excel")}
          >
            <DownloadIcon aria-hidden="true" /> Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!dashboard}
            onClick={() => handleExport("pdf")}
          >
            <DownloadIcon aria-hidden="true" /> PDF
          </Button>
        </div>
      </div>

      {manageable ? null : (
        <p className="text-xs text-muted-foreground" role="note">
          Hanya PM dan Admin yang dapat membuat/mengubah proyek. Proyek baru dibuat dari
          handover Dikonfirmasi (US-019).
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="KPI produksi">
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-5">
            Memuat ringkasan...
          </p>
        ) : (
          metrics.map((metric) => (
            <Card key={metric.label}>
              <CardHeader className="pb-0">
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-3xl font-bold">{metric.value}</CardTitle>
              </CardHeader>
            </Card>
          ))
        )}
      </section>

      {dashboard && dashboard.deadlineWatch.length > 0 ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Mendekati / melewati deadline</CardTitle>
            <CardDescription>≤ 7 hari atau sudah lewat, proyek belum selesai.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {dashboard.deadlineWatch.map((row) => (
                <li
                  key={row.projectId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{row.projectName}</p>
                    <p className="text-xs text-muted-foreground">
                      Target {formatDate(row.targetDate)} · {row.pmName}
                    </p>
                  </div>
                  <Badge variant={row.daysToDeadline < 0 ? "destructive" : "outline"}>
                    {row.daysToDeadline < 0
                      ? `Terlambat ${Math.abs(row.daysToDeadline)} hari`
                      : row.daysToDeadline === 0
                        ? "Hari ini"
                        : `${row.daysToDeadline} hari lagi`}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

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
                        nativeButton={false}
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
