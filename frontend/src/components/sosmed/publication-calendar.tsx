"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/crm/lead-table";
import { useMasterOptions } from "@/hooks/use-master-options";
import { usePortalSettings } from "@/hooks/use-portal-settings";
import {
  getCalendarEntries,
  reschedulePublication,
  type CalendarEntry,
} from "@/services/calendar";
import { APPROVAL_DECISIONS } from "@/types/material";

type ViewMode = "bulan" | "minggu";

function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Kalender publikasi (US-032, FR-24): bulan/minggu dari data distribusi,
 * filter, klik → detail, seret untuk jadwal ulang, indikator Overdue/Kritis.
 */
export function PublicationCalendar() {
  const { options } = useMasterOptions();
  const { settings } = usePortalSettings();
  const criticalHours = settings.releaseCriticalHours;
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("bulan");
  const [cursor, setCursor] = useState(() => toIso(new Date()));
  const [brand, setBrand] = useState("");
  const [platform, setPlatform] = useState("");
  const [approval, setApproval] = useState("");
  const [gateReady, setGateReady] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { data } = await getCalendarEntries(
      {
        brand: brand || undefined,
        platform: platform || undefined,
        approval: approval || undefined,
        gateReady: gateReady === "" ? undefined : gateReady === "siap",
      },
      new Date().toISOString(),
      criticalHours
    );
    if (data) {
      setEntries(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void getCalendarEntries(
      {
        brand: brand || undefined,
        platform: platform || undefined,
        approval: approval || undefined,
        gateReady: gateReady === "" ? undefined : gateReady === "siap",
      },
      new Date().toISOString(),
      criticalHours
    ).then(({ data }) => {
      if (!cancelled) {
        setEntries(data ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [brand, platform, approval, gateReady, criticalHours]);

  const days: string[] = useMemo(() => {
    const base = new Date(`${cursor}T00:00:00Z`);
    if (view === "minggu") {
      const mondayOffset = (base.getUTCDay() + 6) % 7;
      const monday = addDays(base, -mondayOffset);
      return Array.from({ length: 7 }, (_, index) => toIso(addDays(monday, index)));
    }
    const first = monthStart(base);
    const startOffset = (first.getUTCDay() + 6) % 7;
    const gridStart = addDays(first, -startOffset);
    return Array.from({ length: 42 }, (_, index) => toIso(addDays(gridStart, index)));
  }, [cursor, view]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.scheduleDate) ?? [];
      list.push(entry);
      map.set(entry.scheduleDate, list);
    }
    return map;
  }, [entries]);

  async function handleDrop(publicationId: string, date: string) {
    setError(null);
    const { error: dropError } = await reschedulePublication(publicationId, date);
    if (dropError) {
      setError(dropError);
      return;
    }
    await refresh();
  }

  function shiftCursor(daysCount: number) {
    setCursor(toIso(addDays(new Date(`${cursor}T00:00:00Z`), daysCount)));
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat kalender...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Sosmed · Publikasi</p>
          <h1 className="mt-1 text-2xl font-bold">Kalender Publikasi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries.length} publikasi terjadwal. Seret entri untuk menjadwal ulang.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => shiftCursor(view === "minggu" ? -7 : -30)}>
            ←
          </Button>
          <Button
            type="button"
            variant={view === "bulan" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("bulan")}
          >
            Bulan
          </Button>
          <Button
            type="button"
            variant={view === "minggu" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("minggu")}
          >
            Minggu
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => shiftCursor(view === "minggu" ? 7 : 30)}>
            →
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
        <FormSelect id="cal-brand" label="Lini bisnis" value={brand} onChange={setBrand} options={options.brand} />
        <FormSelect id="cal-platform" label="Platform" value={platform} onChange={setPlatform} options={options.platform} />
        <FormSelect
          id="cal-approval"
          label="Status approval"
          value={approval}
          onChange={setApproval}
          options={[...APPROVAL_DECISIONS, "Belum direview"]}
        />
        <FormSelect
          id="cal-gate"
          label="Kesiapan pra-rilis"
          value={gateReady}
          onChange={setGateReady}
          options={[
            { value: "siap", label: "Gate lengkap" },
            { value: "belum", label: "Belum lengkap" },
          ]}
        />
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border bg-border">
        <div className="grid grid-cols-7 bg-muted/40">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
            <p key={day} className="px-2 py-1 text-center text-xs font-medium text-muted-foreground">
              {day}
            </p>
          ))}
        </div>
        <div className={`grid grid-cols-7 gap-px bg-border ${view === "minggu" ? "" : ""}`}>
          {days.map((day) => (
            <div
              key={day}
              className="min-h-20 bg-card p-1"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const publicationId = event.dataTransfer.getData("text/plain");
                if (publicationId) {
                  void handleDrop(publicationId, day);
                }
              }}
            >
              <p className="text-xs text-muted-foreground">{day.slice(8, 10)}</p>
              <div className="space-y-1">
                {(byDate.get(day) ?? []).map((entry) => (
                  <Link
                    key={entry.publicationId}
                    href={`/sosmed/materi/${entry.materialId}?from=${encodeURIComponent("/sosmed/kalender")}`}
                    draggable={!entry.isLive}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", entry.publicationId);
                    }}
                    className={`block truncate rounded px-1.5 py-0.5 text-[11px] leading-4 ${
                      entry.isLive
                        ? "bg-muted text-muted-foreground"
                        : entry.urgency === "critical"
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          : entry.urgency === "overdue"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                    }`}
                    title={`${entry.materialTitle} · ${entry.platform}${entry.isLive ? " (live)" : entry.urgency === "ok" ? "" : ` (${entry.urgency})`}`}
                  >
                    {entry.platform}: {entry.materialTitle}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Ambang Overdue / Kritis</CardTitle>
          <CardDescription>
            Overdue = melewati jadwal. Kritis = terlambat melebihi {criticalHours} jam.
            Ambang diatur Super Admin di Pengaturan · KPI, SLA &amp; Routing.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
