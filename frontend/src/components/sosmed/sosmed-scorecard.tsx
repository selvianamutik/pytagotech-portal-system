"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/crm/lead-table";
import { useMasterOptions } from "@/hooks/use-master-options";
import { usePortalSettings } from "@/hooks/use-portal-settings";
import { getScorecard, type KpiScore } from "@/services/scorecard";

/**
 * Dashboard eksekutif Sosmed / KPI Scorecard (US-039): 6 KPI dengan
 * target per lini bisnis dari Pengaturan (US-041), capaian, dan status
 * verifikasi + filter brand/periode.
 */
export function SosmedScorecard() {
  const { options } = useMasterOptions();
  const { settings } = usePortalSettings();
  const [scores, setScores] = useState<KpiScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState("");
  const [month, setMonth] = useState("");

  useEffect(() => {
    let cancelled = false;
    void getScorecard(
      { brand: brand || undefined, month: month || undefined },
      { kpiTargets: settings.kpiTargets }
    ).then(({ data }) => {
      if (!cancelled) {
        setScores(data ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [brand, month, settings.kpiTargets]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Sosmed · Eksekutif</p>
          <h1 className="mt-1 text-2xl font-bold">KPI Scorecard Sosmed</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Target mengikuti Pengaturan per lini bisnis; tanpa filter brand memakai
            target dasar.
          </p>
        </div>
      </div>

      <div className="grid max-w-xl gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
        <FormSelect id="score-brand" label="Lini bisnis" value={brand} onChange={setBrand} options={options.brand} />
        <div className="space-y-2">
          <label htmlFor="score-month" className="text-sm font-medium">
            Periode (kosongkan = semua)
          </label>
          <Input id="score-month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Menghitung scorecard...</p>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="KPI Sosmed">
          {scores.map((kpi) => (
            <Card key={kpi.key}>
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardDescription>{kpi.label}</CardDescription>
                  <Badge variant={kpi.verified ? "default" : "outline"}>
                    {kpi.verified ? "Data Terverifikasi" : "Monitoring Sementara"}
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-bold">
                  {kpi.actual.toLocaleString("id-ID")}{" "}
                  <span className="text-base font-normal text-muted-foreground">{kpi.unit}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Target: {kpi.target.toLocaleString("id-ID")} {kpi.unit} · Capaian{" "}
                  {kpi.achievement.toFixed(0)}%
                </p>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={Math.min(100, Math.round(kpi.achievement))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Capaian ${kpi.label}`}
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, kpi.achievement)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
