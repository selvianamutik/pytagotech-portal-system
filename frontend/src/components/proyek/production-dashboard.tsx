"use client";

import { useEffect, useState } from "react";
import { DownloadIcon } from "lucide-react";

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
import { ProgressBar } from "@/components/proyek/project-list";
import {
  getProductionDashboard,
  type ProductionDashboardData,
} from "@/services/production-dashboard";
import {
  buildExcelFile,
  buildPdfFile,
  downloadBlob,
} from "@/services/production-export";
import { listProjectManagers, listProjects } from "@/services/projects";
import { formatDate } from "@/lib/utils";

/**
 * Dashboard eksekutif produksi (US-026, FR-20): KPI real-time,
 * widget deadline, filter, ekspor Excel & PDF.
 */
export function ProductionDashboard() {
  const [data, setData] = useState<ProductionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pmName, setPmName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [projectOptions, setProjectOptions] = useState<{ id: string; name: string }[]>([]);

  const filtersActive = pmName !== "" || projectId !== "" || dateFrom !== "" || dateTo !== "";

  function resetFilters() {
    setPmName("");
    setProjectId("");
    setDateFrom("");
    setDateTo("");
  }

  useEffect(() => {
    let cancelled = false;
    void listProjects().then(({ data: projects }) => {
      if (!cancelled && projects) {
        setProjectOptions(
          projects.map((item) => ({ id: item.project.id, name: item.project.name }))
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getProductionDashboard({
      pmName: pmName || undefined,
      projectId: projectId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }).then(({ data: dashboard }) => {
      if (!cancelled) {
        setData(dashboard);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pmName, projectId, dateFrom, dateTo]);

  function handleExport(kind: "excel" | "pdf") {
    if (!data) {
      return;
    }
    const file = kind === "excel" ? buildExcelFile(data) : buildPdfFile(data);
    downloadBlob(file.blob, file.filename);
  }

  const metrics = data
    ? [
        { label: "Total Proyek", value: String(data.kpi.totalProjects) },
        { label: "Proyek Aktif", value: String(data.kpi.activeProjects) },
        { label: "Task Selesai", value: String(data.kpi.tasksDone) },
        { label: "Task Berlangsung", value: String(data.kpi.tasksInProgress) },
        { label: "Task Blocked", value: String(data.kpi.tasksBlocked) },
      ]
    : [];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Proyek · Eksekutif</p>
          <h1 className="mt-1 text-2xl font-bold">Dashboard Produksi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan real-time dari database proyek dan task.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={!data} onClick={() => handleExport("excel")}>
            <DownloadIcon aria-hidden="true" /> Excel
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!data} onClick={() => handleExport("pdf")}>
            <DownloadIcon aria-hidden="true" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
        <FormSelect
          id="prod-filter-pm"
          label="PM / Tim"
          value={pmName}
          onChange={setPmName}
          options={listProjectManagers()}
        />
        <FormSelect
          id="prod-filter-project"
          label="Proyek"
          value={projectId}
          onChange={setProjectId}
          options={projectOptions.map((option) => ({
            value: option.id,
            label: `${option.name.slice(0, 40)} (${option.id})`,
          }))}
        />
        <div className="space-y-2">
          <label htmlFor="prod-from" className="text-sm font-medium">
            Periode dari
          </label>
          <Input id="prod-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="prod-to" className="text-sm font-medium">
            Periode sampai
          </label>
          <Input id="prod-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </div>
        {filtersActive ? (
          <div className="md:col-span-2 xl:col-span-4">
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              Reset filter
            </Button>
          </div>
        ) : null}
      </div>

      {loading || !data ? (
        <p className="text-sm text-muted-foreground">Menghitung dashboard...</p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="KPI produksi">
            {metrics.map((metric) => (
              <Card key={metric.label}>
                <CardHeader className="pb-0">
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle className="text-3xl font-bold">{metric.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Mendekati / melewati deadline</CardTitle>
              <CardDescription>≤ 7 hari atau sudah lewat, proyek belum selesai.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.deadlineWatch.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Tidak ada proyek mendesak. 🎉
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.deadlineWatch.map((row) => (
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
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Progress per proyek</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.projects.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  Tidak ada proyek pada filter ini.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="px-4">Proyek</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.projects.map((row) => (
                      <TableRow key={row.projectId}>
                        <TableCell className="px-4">
                          <p className="font-medium">{row.projectName}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.projectId} · {row.pmName}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <ProgressBar value={row.progress} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
