"use client";

import { useMemo, useState } from "react";
import { CalendarDaysIcon, SaveIcon, Trash2Icon } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePortalSettings } from "@/hooks/use-portal-settings";
import {
  createHoliday,
  deleteHoliday,
  saveKpiTargets,
  saveOperationalSettings,
} from "@/services/settings";
import type { KpiKey, KpiTargetsByBrand, PortalSettings } from "@/types/settings";
import {
  DAY_LABELS,
  DAY_ORDER,
  DEFAULT_KPI_TARGETS,
  KPI_DEFINITIONS,
  resolveKpiTargets,
} from "@/types/settings";
import { SOSMED_BRANDS } from "@/types/sosmed";
import { formatDate } from "@/lib/utils";

interface OperationalDraft {
  responseMinutes: string;
  routingMinutes: string;
  criticalHours: string;
  timezone: string;
  start: string;
  end: string;
  days: number[];
  waNumbers: Record<string, string>;
}

type KpiDraft = Record<string, Record<KpiKey, string>>;

function toOperationalDraft(settings: PortalSettings): OperationalDraft {
  return {
    responseMinutes: String(settings.slaResponseMinutes),
    routingMinutes: String(settings.slaRoutingMinutes),
    criticalHours: String(settings.releaseCriticalHours),
    timezone: settings.serviceHours.timezone,
    start: settings.serviceHours.start,
    end: settings.serviceHours.end,
    days: [...settings.serviceHours.days],
    waNumbers: { ...settings.waNumbers },
  };
}

function brandsFromSettings(settings: PortalSettings): string[] {
  const extra = Object.keys(settings.kpiTargets).filter(
    (brand) => !(SOSMED_BRANDS as readonly string[]).includes(brand)
  );
  return [...SOSMED_BRANDS, ...extra];
}

function toKpiDraft(settings: PortalSettings): KpiDraft {
  const draft: KpiDraft = {};
  for (const brand of brandsFromSettings(settings)) {
    const targets = resolveKpiTargets(settings.kpiTargets, brand);
    draft[brand] = Object.fromEntries(
      KPI_DEFINITIONS.map((definition) => [definition.key, String(targets[definition.key])])
    ) as Record<KpiKey, string>;
  }
  return draft;
}

function brandList(settings: PortalSettings): string[] {
  return [
    ...brandsFromSettings(settings),
    ...Object.keys(settings.waNumbers).filter(
      (brand) =>
        !(SOSMED_BRANDS as readonly string[]).includes(brand) &&
        !Object.prototype.hasOwnProperty.call(settings.kpiTargets, brand)
    ),
  ];
}

/**
 * Halaman Pengaturan KPI, SLA & routing (US-041, FR-30) — Super Admin.
 *
 * Mengelola ambang SLA (default 30/15 menit), jam layanan, nomor WhatsApp
 * resmi, ambang kritis publikasi, target KPI per lini bisnis, dan kalender
 * hari libur. Semua perubahan ditulis ke `settings`/`holidays` yang memiliki
 * trigger audit; data historis yang sudah final tidak disentuh.
 */
export function PortalSettingsManager() {
  const { settings, loading, error: loadError, reload } = usePortalSettings();

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat pengaturan...</p>
      </main>
    );
  }

  return <PortalSettingsForm settings={settings} loadError={loadError} onSaved={reload} />;
}

interface PortalSettingsFormProps {
  settings: PortalSettings;
  loadError: string | null;
  onSaved: () => void;
}

function PortalSettingsForm({ settings, loadError, onSaved }: PortalSettingsFormProps) {
  const [form, setForm] = useState<OperationalDraft>(() => toOperationalDraft(settings));
  const [kpiDraft, setKpiDraft] = useState<KpiDraft>(() => toKpiDraft(settings));
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<"operational" | "kpi" | "holiday" | null>(null);
  const [newHolidayDay, setNewHolidayDay] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");

  const waBrands = useMemo(() => brandList(settings), [settings]);
  const brands = useMemo(() => brandsFromSettings(settings), [settings]);

  function updateForm(patch: Partial<OperationalDraft>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function toggleDay(day: number) {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day],
    }));
  }

  function updateWaNumber(brand: string, value: string) {
    setForm((current) => ({
      ...current,
      waNumbers: { ...current.waNumbers, [brand]: value },
    }));
  }

  async function handleSaveOperational(event: React.FormEvent) {
    event.preventDefault();
    setPending("operational");
    setActionError(null);
    setNotice(null);
    const result = await saveOperationalSettings({
      slaResponseMinutes: Number(form.responseMinutes),
      slaRoutingMinutes: Number(form.routingMinutes),
      releaseCriticalHours: Number(form.criticalHours),
      serviceHours: {
        timezone: form.timezone,
        days: form.days,
        start: form.start,
        end: form.end,
      },
      waNumbers: form.waNumbers,
    });
    setPending(null);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setNotice(
      "SLA, jam layanan, nomor WhatsApp, dan ambang kritis tersimpan. Perubahan tercatat di audit log."
    );
    onSaved();
  }

  function updateKpiInput(brand: string, key: KpiKey, value: string) {
    setKpiDraft((current) =>
      current && current[brand]
        ? { ...current, [brand]: { ...current[brand], [key]: value } }
        : current
    );
  }

  function resetKpiToDefaults() {
    const draft: KpiDraft = {};
    for (const brand of brands) {
      draft[brand] = Object.fromEntries(
        KPI_DEFINITIONS.map((definition) => [
          definition.key,
          String(DEFAULT_KPI_TARGETS[definition.key]),
        ])
      ) as Record<KpiKey, string>;
    }
    setKpiDraft(draft);
    setActionError(null);
    setNotice("Target dasar dimuat ke formulir. Tekan Simpan target untuk menerapkan.");
  }

  async function handleSaveKpi() {
    const targets: KpiTargetsByBrand = {};
    for (const brand of brands) {
      const row = kpiDraft[brand];
      if (!row) {
        continue;
      }
      const target: KpiTargetsByBrand[string] = {};
      for (const definition of KPI_DEFINITIONS) {
        const raw = row[definition.key]?.trim() ?? "";
        if (raw === "") {
          continue;
        }
        const numeric = Number(raw);
        // Nilai yang sama dengan target dasar tidak perlu disimpan eksplisit.
        if (numeric === DEFAULT_KPI_TARGETS[definition.key]) {
          continue;
        }
        target[definition.key] = numeric;
      }
      targets[brand] = target;
    }

    setPending("kpi");
    setActionError(null);
    setNotice(null);
    const result = await saveKpiTargets(targets);
    setPending(null);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setNotice("Target KPI per lini bisnis tersimpan. Snapshot KPI Final historis tidak berubah.");
    onSaved();
  }

  async function handleAddHoliday(event: React.FormEvent) {
    event.preventDefault();
    if (!newHolidayDay) {
      setActionError("Pilih tanggal libur terlebih dahulu.");
      return;
    }
    setPending("holiday");
    setActionError(null);
    setNotice(null);
    const result = await createHoliday(newHolidayDay, newHolidayName);
    setPending(null);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setNewHolidayDay("");
    setNewHolidayName("");
    setNotice("Hari libur ditambahkan dan langsung dipakai penjadwalan fitur.");
    onSaved();
  }

  async function handleDeleteHoliday(day: string) {
    setPending("holiday");
    setActionError(null);
    setNotice(null);
    const result = await deleteHoliday(day);
    setPending(null);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setNotice(`Hari libur ${formatDate(day)} dihapus.`);
    onSaved();
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Pengaturan · Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold">KPI, SLA &amp; Routing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ambang SLA, jam layanan, nomor WhatsApp resmi, target KPI per lini bisnis, dan
            kalender hari libur. Perubahan tercatat di audit log dan tidak mengubah data final.
          </p>
        </div>
        <Badge variant="outline">FR-30 · US-041</Badge>
      </div>

      {loadError ? (
        <p role="alert" className="text-sm text-destructive">
          {loadError}
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          {notice}
        </p>
      ) : null}

      <Tabs defaultValue="operasional" className="gap-4">
        <TabsList className="w-full max-w-xl">
          <TabsTrigger value="operasional">SLA &amp; Layanan</TabsTrigger>
          <TabsTrigger value="kpi">Target KPI</TabsTrigger>
          <TabsTrigger value="libur">Hari Libur</TabsTrigger>
        </TabsList>

        <TabsContent value="operasional">
          <form onSubmit={handleSaveOperational} className="space-y-4">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Ambang SLA &amp; routing</CardTitle>
                <CardDescription>
                  Default 30 menit untuk respons komunitas dan 15 menit untuk routing inquiry ke
                  WhatsApp. Nilai ini dipakai modul Komunitas dan Inquiry.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="sla-response" className="text-sm font-medium">
                    SLA respons (menit)
                  </label>
                  <Input
                    id="sla-response"
                    type="number"
                    min="1"
                    max="1440"
                    value={form.responseMinutes}
                    onChange={(event) => updateForm({ responseMinutes: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="sla-routing" className="text-sm font-medium">
                    SLA routing WA (menit)
                  </label>
                  <Input
                    id="sla-routing"
                    type="number"
                    min="1"
                    max="1440"
                    value={form.routingMinutes}
                    onChange={(event) => updateForm({ routingMinutes: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="critical-hours" className="text-sm font-medium">
                    Kritis publikasi (jam)
                  </label>
                  <Input
                    id="critical-hours"
                    type="number"
                    min="1"
                    max="8760"
                    value={form.criticalHours}
                    onChange={(event) => updateForm({ criticalHours: event.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Jam layanan</CardTitle>
                <CardDescription>
                  Dipakai sebagai acuan jam operasional tim. Sabtu/Minggu pada kalender kerja
                  tetap libur terpisah dari pilihan hari layanan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label htmlFor="service-timezone" className="text-sm font-medium">
                      Zona waktu
                    </label>
                    <Input
                      id="service-timezone"
                      value={form.timezone}
                      onChange={(event) => updateForm({ timezone: event.target.value })}
                      placeholder="Asia/Jakarta"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="service-start" className="text-sm font-medium">
                      Mulai
                    </label>
                    <Input
                      id="service-start"
                      type="time"
                      value={form.start}
                      onChange={(event) => updateForm({ start: event.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="service-end" className="text-sm font-medium">
                      Selesai
                    </label>
                    <Input
                      id="service-end"
                      type="time"
                      value={form.end}
                      onChange={(event) => updateForm({ end: event.target.value })}
                      required
                    />
                  </div>
                </div>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Hari layanan</legend>
                  <div className="flex flex-wrap gap-2">
                    {DAY_ORDER.map((day) => (
                      <label
                        key={day}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={form.days.includes(day)}
                          onChange={() => toggleDay(day)}
                        />
                        {DAY_LABELS[day]}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Nomor WhatsApp resmi</CardTitle>
                <CardDescription>
                  Satu nomor per lini bisnis. Kosongkan bila belum resmi diumumkan; inquiry
                  menampilkan status “Belum diatur”.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-4 sm:grid-cols-3">
                {waBrands.map((brand) => (
                  <div key={brand} className="space-y-2">
                    <label htmlFor={`wa-${brand}`} className="text-sm font-medium">
                      {brand}
                    </label>
                    <Input
                      id={`wa-${brand}`}
                      inputMode="tel"
                      placeholder="+62 812 3456 7890"
                      value={form.waNumbers[brand] ?? ""}
                      onChange={(event) => updateWaNumber(brand, event.target.value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={pending !== null}>
                <SaveIcon aria-hidden="true" />
                {pending === "operational" ? "Menyimpan..." : "Simpan SLA & layanan"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="kpi">
          <Card>
            <CardHeader className="flex flex-row items-end justify-between border-b">
              <div>
                <CardTitle className="text-base">Target KPI per lini bisnis</CardTitle>
                <CardDescription>
                  Nilai kosong memakai target dasar. Perubahan hanya memengaruhi capaian
                  berikutnya; snapshot KPI Final yang sudah tersimpan tidak diubah.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={resetKpiToDefaults}>
                Isi target dasar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="px-4">Lini bisnis</TableHead>
                      {KPI_DEFINITIONS.map((definition) => (
                        <TableHead key={definition.key} className="min-w-28 whitespace-normal">
                          {definition.label}
                          <span className="block text-xs font-normal text-muted-foreground">
                            {definition.unit}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.map((brand) => (
                      <TableRow key={brand}>
                        <TableCell className="px-4 font-medium">{brand}</TableCell>
                        {KPI_DEFINITIONS.map((definition) => (
                          <TableCell key={definition.key}>
                            <Input
                              aria-label={`Target ${definition.label} ${brand}`}
                              type="number"
                              min="0"
                              step="any"
                              className="w-24"
                              value={kpiDraft[brand]?.[definition.key] ?? ""}
                              onChange={(event) =>
                                updateKpiInput(brand, definition.key, event.target.value)
                              }
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end">
                <Button type="button" disabled={pending !== null} onClick={() => void handleSaveKpi()}>
                  <SaveIcon aria-hidden="true" />
                  {pending === "kpi" ? "Menyimpan..." : "Simpan target"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="libur">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Kalender hari libur</CardTitle>
              <CardDescription>
                Tanggal di sini dipakai penjadwalan fitur selain Sabtu/Minggu. Contoh seed:
                25 Desember 2026.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <form onSubmit={handleAddHoliday} className="flex flex-wrap items-end gap-2">
                <div className="space-y-2">
                  <label htmlFor="holiday-day" className="text-sm font-medium">
                    Tanggal
                  </label>
                  <Input
                    id="holiday-day"
                    type="date"
                    value={newHolidayDay}
                    onChange={(event) => setNewHolidayDay(event.target.value)}
                    required
                  />
                </div>
                <div className="min-w-52 flex-1 space-y-2">
                  <label htmlFor="holiday-name" className="text-sm font-medium">
                    Nama (opsional)
                  </label>
                  <Input
                    id="holiday-name"
                    placeholder="Hari libur nasional"
                    value={newHolidayName}
                    onChange={(event) => setNewHolidayName(event.target.value)}
                  />
                </div>
                <Button type="submit" disabled={pending !== null}>
                  <CalendarDaysIcon aria-hidden="true" />
                  {pending === "holiday" ? "Menyimpan..." : "Tambah libur"}
                </Button>
              </form>

              {settings.holidays.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada hari libur khusus.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="px-4">Tanggal</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.holidays.map((holiday) => (
                      <TableRow key={holiday.day}>
                        <TableCell className="px-4 font-mono text-xs">{holiday.day}</TableCell>
                        <TableCell>{holiday.name ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Hapus hari libur ${holiday.day}`}
                            disabled={pending !== null}
                            onClick={() => void handleDeleteHoliday(holiday.day)}
                          >
                            <Trash2Icon aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
