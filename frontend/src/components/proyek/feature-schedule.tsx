"use client";

import { useEffect, useState } from "react";
import { CalendarClockIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePortalSettings } from "@/hooks/use-portal-settings";
import {
  getScheduleSettings,
  overrideFeatureSchedule,
  scheduleProjectFeatures,
  setScheduleSettings,
  type FeatureSchedule,
  type ScheduleSettings,
} from "@/services/scheduling";
import { createHoliday, deleteHoliday } from "@/services/settings";
import { formatDate } from "@/lib/utils";

/**
 * Penjadwalan fitur otomatis (US-024, FR-18): hitung jadwal,
 * override beralasan, peringatan bentrok, pengaturan kalender.
 * Hari libur dibaca dari Pengaturan (US-041).
 */
export function FeatureScheduleSection({ projectId }: { projectId: string }) {
  const { settings: portalSettings, reload: reloadSettings } = usePortalSettings();
  const [schedules, setSchedules] = useState<FeatureSchedule[]>([]);
  const [settings, setSettings] = useState<ScheduleSettings>({ holidays: [], capacityHoursPerDay: {} });
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overrideTarget, setOverrideTarget] = useState<FeatureSchedule | null>(null);
  const [overrideStart, setOverrideStart] = useState("");
  const [overrideEnd, setOverrideEnd] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const [newHoliday, setNewHoliday] = useState("");
  const [capacityName, setCapacityName] = useState("");
  const [capacityHours, setCapacityHours] = useState("8");

  const holidayKey = portalSettings.holidays
    .map((holiday) => holiday.day)
    .join(",");

  function holidayDays(): string[] {
    return holidayKey ? holidayKey.split(",").filter(Boolean) : [];
  }

  async function refresh() {
    const [{ data: scheduleData }, { data: settingsData }] = await Promise.all([
      scheduleProjectFeatures(projectId, { holidays: holidayDays() }),
      getScheduleSettings(),
    ]);
    if (scheduleData) {
      setSchedules(scheduleData);
    }
    if (settingsData) {
      setSettings(settingsData);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      scheduleProjectFeatures(projectId, {
        holidays: holidayKey ? holidayKey.split(",").filter(Boolean) : [],
      }),
      getScheduleSettings(),
    ]).then(([scheduleResult, settingsResult]) => {
      if (cancelled) {
        return;
      }
      if (scheduleResult.data) {
        setSchedules(scheduleResult.data);
      }
      if (settingsResult.data) {
        setSettings(settingsResult.data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, holidayKey]);

  async function handleSchedule() {
    setPending(true);
    setError(null);
    await refresh();
    setPending(false);
  }

  async function handleOverride(event: React.FormEvent) {
    event.preventDefault();
    if (!overrideTarget) {
      return;
    }
    setPending(true);
    setError(null);
    const { error: overrideError } = await overrideFeatureSchedule(overrideTarget.featureId, {
      startDate: overrideStart,
      endDate: overrideEnd,
      reason: overrideReason,
    });
    setPending(false);
    if (overrideError) {
      setError(overrideError);
      return;
    }
    setOverrideTarget(null);
    await refresh();
  }

  async function handleAddHoliday() {
    if (!newHoliday) {
      return;
    }
    setError(null);
    const { error: holidayError } = await createHoliday(newHoliday, "Hari libur khusus");
    if (holidayError) {
      setError(holidayError);
      return;
    }
    setNewHoliday("");
    reloadSettings();
  }

  async function handleRemoveHoliday(day: string) {
    setError(null);
    const { error: holidayError } = await deleteHoliday(day);
    if (holidayError) {
      setError(holidayError);
      return;
    }
    reloadSettings();
  }

  async function handleSaveCapacity() {
    if (!capacityName.trim()) {
      return;
    }
    const hours = Number(capacityHours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
      setError("Kapasitas harus 1–24 jam/hari.");
      return;
    }
    const { data } = await setScheduleSettings({
      ...settings,
      capacityHoursPerDay: { ...settings.capacityHoursPerDay, [capacityName.trim()]: hours },
    });
    if (data) {
      setSettings(data);
    }
    setCapacityName("");
    setCapacityHours("8");
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat jadwal...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-end justify-between border-b">
          <div>
            <CardTitle className="text-base">Penjadwalan otomatis</CardTitle>
            <CardDescription>
              Prioritas → estimasi × kapasitas → hari kerja (Senin–Jumat + libur).
            </CardDescription>
          </div>
          <Button type="button" size="sm" disabled={pending} onClick={() => void handleSchedule()}>
            <CalendarClockIcon aria-hidden="true" />
            {pending ? "Menghitung..." : "Jadwalkan otomatis"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada fitur untuk dijadwalkan.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="px-4">Fitur</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((item) => (
                  <TableRow key={item.featureId}>
                    <TableCell className="px-4">
                      <p className="font-medium">{item.featureName}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {item.featureId} · est. {item.estimateDays} hari
                      </p>
                    </TableCell>
                    <TableCell>{item.developer || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {formatDate(item.startDate)} → {formatDate(item.endDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.overridden ? (
                          <Badge variant="secondary" title={item.overrideReason ?? ""}>
                            Override
                          </Badge>
                        ) : null}
                        {item.conflictsWith.length > 0 ? (
                          <Badge
                            variant="destructive"
                            title={`Bentrok dengan ${item.conflictsWith.join(", ")}`}
                          >
                            Bentrok
                          </Badge>
                        ) : null}
                        {!item.overridden && item.conflictsWith.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Otomatis</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOverrideTarget(item);
                          setOverrideStart(item.startDate);
                          setOverrideEnd(item.endDate);
                          setOverrideReason("");
                          setError(null);
                        }}
                      >
                        Override
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Kalender & kapasitas</CardTitle>
          <CardDescription>
            Sabtu/Minggu selalu libur. Hari libur mengikuti Pengaturan. Estimasi = hari-orang
            @8 jam.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium">Hari libur</p>
            <ul className="mt-2 space-y-1">
              {portalSettings.holidays.length === 0 ? (
                <li className="text-xs text-muted-foreground">Belum ada hari libur khusus.</li>
              ) : (
                portalSettings.holidays.map((holiday) => (
                  <li key={holiday.day} className="flex items-center justify-between text-sm">
                    <span>
                      <span className="font-mono">{holiday.day}</span>
                      {holiday.name ? (
                        <span className="ml-2 text-xs text-muted-foreground">{holiday.name}</span>
                      ) : null}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleRemoveHoliday(holiday.day)}
                    >
                      Hapus
                    </Button>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-2 flex gap-2">
              <Input
                aria-label="Tanggal libur baru"
                type="date"
                value={newHoliday}
                onChange={(event) => setNewHoliday(event.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => void handleAddHoliday()}>
                Tambah
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Kapasitas developer (jam/hari)</p>
            <ul className="mt-2 space-y-1">
              {Object.entries(settings.capacityHoursPerDay).map(([name, hours]) => (
                <li key={name} className="flex items-center justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-mono">{hours} jam</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <Input
                aria-label="Nama developer"
                placeholder="Nama"
                value={capacityName}
                onChange={(event) => setCapacityName(event.target.value)}
              />
              <Input
                aria-label="Kapasitas jam per hari"
                type="number"
                min="1"
                max="24"
                className="w-24"
                value={capacityHours}
                onChange={(event) => setCapacityHours(event.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => void handleSaveCapacity()}>
                Simpan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={overrideTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOverrideTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override jadwal — {overrideTarget?.featureName}</DialogTitle>
            <DialogDescription>
              Alasan wajib diisi. Bentrok dengan developer yang sama akan ditandai.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOverride} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="override-start" className="text-sm font-medium">
                  Mulai
                </label>
                <Input
                  id="override-start"
                  type="date"
                  value={overrideStart}
                  onChange={(event) => setOverrideStart(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="override-end" className="text-sm font-medium">
                  Selesai
                </label>
                <Input
                  id="override-end"
                  type="date"
                  value={overrideEnd}
                  onChange={(event) => setOverrideEnd(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="override-reason" className="text-sm font-medium">
                Alasan
              </label>
              <textarea
                id="override-reason"
                className="min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring"
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
                required
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan override"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
