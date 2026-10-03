"use client";

import { useEffect, useState } from "react";

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
import {
  getCrmDashboard,
  type CrmDashboardData,
  type DashboardPeriodMode,
} from "@/services/crm-dashboard";
import { formatPercent } from "@/lib/utils";

const INTEREST_FORMULA = "Interest Rate = Interested ÷ Outreach × 100%";
const CLOSING_FORMULA = "Closing Rate = Closing ÷ Outreach × 100%";

/**
 * Dashboard CRM (US-013): KPI otomatis + tabel kinerja per PIC
 * + filter periode harian/bulanan/kustom. Rumus tertulis di tooltip.
 */
export function CrmDashboard() {
  const [mode, setMode] = useState<DashboardPeriodMode>("monthly");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<CrmDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getCrmDashboard({
      mode,
      from: from || undefined,
      to: to || undefined,
    }).then(({ data: result }) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mode, from, to]);

  const metrics: { label: string; value: string; title?: string }[] = data
    ? [
        { label: "Total Database Lead", value: String(data.kpi.totalLeads) },
        { label: "Total Outreach", value: String(data.kpi.outreach) },
        { label: "New", value: String(data.kpi.newCount) },
        { label: "Follow Up", value: String(data.kpi.followUp) },
        { label: "Interested", value: String(data.kpi.interested) },
        { label: "Closing", value: String(data.kpi.closing) },
        { label: "Lost", value: String(data.kpi.lost) },
        {
          label: "Interest Rate",
          value: formatPercent(data.kpi.interestRate),
          title: INTEREST_FORMULA,
        },
        {
          label: "Closing Rate",
          value: formatPercent(data.kpi.closingRate),
          title: CLOSING_FORMULA,
        },
      ]
    : [];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">CRM · Marketing</p>
          <h1 className="mt-1 text-2xl font-bold">Dashboard CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Semua angka dihitung otomatis dari database lead — tanpa rumus spreadsheet.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex gap-2">
            {(
              [
                ["daily", "Harian"],
                ["monthly", "Bulanan"],
                ["custom", "Kustom"],
              ] as [DashboardPeriodMode, string][]
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={mode === value ? "default" : "outline"}
                size="sm"
                onClick={() => setMode(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          {mode === "custom" ? (
            <>
              <div className="space-y-1">
                <label htmlFor="dash-from" className="text-xs text-muted-foreground">
                  Dari
                </label>
                <Input
                  id="dash-from"
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="dash-to" className="text-xs text-muted-foreground">
                  Sampai
                </label>
                <Input
                  id="dash-to"
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {loading || !data ? (
        <p className="text-sm text-muted-foreground">Menghitung KPI...</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground" role="status">
            Periode {data.range.from} s.d. {data.range.to} ({data.range.label})
          </p>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="KPI penjualan">
            {metrics.map((metric) => (
              <Card key={metric.label}>
                <CardHeader className="pb-0">
                  <CardDescription title={metric.title}>{metric.label}</CardDescription>
                  <CardTitle className="text-3xl font-bold" title={metric.title}>
                    {metric.value}
                  </CardTitle>
                </CardHeader>
                {metric.title ? (
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{metric.title}</p>
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Kinerja per PIC</CardTitle>
              <CardDescription>
                Lead ditangani dan capaian tiap tahap dalam periode terpilih.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.perPic.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  Tidak ada outreach pada periode ini.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="px-4">PIC</TableHead>
                      <TableHead>Ditangani</TableHead>
                      <TableHead>Contacted</TableHead>
                      <TableHead>Follow Up</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Not Interested</TableHead>
                      <TableHead>Lost</TableHead>
                      <TableHead>Closing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.perPic.map((row) => (
                      <TableRow key={row.picName}>
                        <TableCell className="px-4 font-medium">{row.picName}</TableCell>
                        <TableCell>{row.handled}</TableCell>
                        <TableCell>{row.contacted}</TableCell>
                        <TableCell>{row.followUp}</TableCell>
                        <TableCell>{row.interest}</TableCell>
                        <TableCell>{row.notInterested}</TableCell>
                        <TableCell>{row.lost}</TableCell>
                        <TableCell>{row.closing}</TableCell>
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
