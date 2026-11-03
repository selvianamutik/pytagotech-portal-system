import type { ComponentType } from "react";
import {
  BriefcaseBusinessIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  ClipboardListIcon,
  Clock3Icon,
  DatabaseIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  SettingsIcon,
} from "lucide-react";

import { MyWorkSection } from "@/components/search/my-work-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatDateTime } from "@/lib/utils";
import { getDashboardSnapshot } from "@/services/dashboard";
import type { PortalModule } from "@/types/dashboard";

const moduleIcons: Record<PortalModule, ComponentType<{ className?: string }>> = {
  Beranda: LayoutDashboardIcon,
  CRM: DatabaseIcon,
  "Klien & Handover": BriefcaseBusinessIcon,
  Proyek: ClipboardListIcon,
  Sosmed: MegaphoneIcon,
  Pengaturan: SettingsIcon,
};

/**
 * Beranda portal (US-001 + US-044): ringkasan lintas modul.
 * Shell (sidebar + header) kini disediakan layout global `(portal)`.
 */
export default async function Home() {
  const { data, error } = await getDashboardSnapshot();

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Dashboard belum tersedia</CardTitle>
            <CardDescription>
              Data ringkasan tidak bisa dimuat. Coba muat ulang halaman.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main id="beranda" className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-primary">Ringkasan operasional</p>
          <h1 className="mt-1 text-3xl font-bold leading-10 md:text-4xl">
            Ruang kerja operasional Pytagotech
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ringkasan lintas CRM, handover, produksi, dan sosmed yang dibaca
            langsung dari database Supabase.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.currentUser.roles.map((role) => (
            <Badge
              key={role}
              variant="outline"
              className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300"
            >
              {role}
            </Badge>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <Card key={metric.label} className="border shadow-[0_1px_2px_rgba(26,25,24,0.03)]">
            <CardHeader className="pb-0">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl font-bold">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge tone={metric.tone}>{metric.change}</StatusBadge>
            </CardContent>
          </Card>
        ))}
      </section>

      <MyWorkSection />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card id="proyek" className="border shadow-[0_1px_2px_rgba(26,25,24,0.03)]">
          <CardHeader className="border-b">
            <CardTitle>Antrean kerja prioritas</CardTitle>
            <CardDescription>
              Antrean kerja lintas modul yang dibaca dari database.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="px-4 text-[11px] uppercase tracking-[0.03em] text-muted-foreground">
                    ID
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.03em] text-muted-foreground">
                    Pekerjaan
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.03em] text-muted-foreground">
                    Modul
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.03em] text-muted-foreground">
                    PIC
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.03em] text-muted-foreground">
                    Deadline
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.03em] text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.workQueue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                      {item.id}
                    </TableCell>
                    <TableCell className="min-w-64 font-medium">{item.title}</TableCell>
                    <TableCell>{item.module}</TableCell>
                    <TableCell>{item.owner}</TableCell>
                    <TableCell>{formatDateTime(item.dueDate)}</TableCell>
                    <TableCell>
                      <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border shadow-[0_1px_2px_rgba(26,25,24,0.03)]">
            <CardHeader className="border-b">
              <CardTitle>Aktivitas terbaru</CardTitle>
              <CardDescription>Preview perubahan penting dari jejak audit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.activities.map((activity) => {
                const ModuleIcon = moduleIcons[activity.module];

                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted">
                      <ModuleIcon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-5">
                        <span className="font-medium">{activity.actor}</span> {activity.action}{" "}
                        <span className="font-medium">{activity.subject}</span>
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3Icon className="size-3" aria-hidden="true" />
                        {formatDateTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card id="pengaturan" className="border shadow-[0_1px_2px_rgba(26,25,24,0.03)]">
            <CardHeader>
              <CardTitle>Fondasi siap dipakai</CardTitle>
              <CardDescription>
                Komponen dasar, tema, dan layout saling terhubung dengan layanan
                database untuk seluruh modul.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Button, Input, Select, Table, Dialog, Tabs, Badge, Toast tersedia",
                "Light/dark mode aktif di seluruh halaman",
                "Data ringkasan dibaca dari database (services/dashboard.ts)",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CircleCheckIcon className="size-4 text-emerald-600" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
              <Separator />
              <Button variant="outline" className="w-full justify-between">
                Lihat kontrak data
                <ChevronRightIcon aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
