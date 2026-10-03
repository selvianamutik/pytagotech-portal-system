import type { ComponentType, ReactNode } from "react";
import {
  BellIcon,
  BriefcaseBusinessIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  ClipboardListIcon,
  Clock3Icon,
  DatabaseIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { getDashboardSnapshot } from "@/services/dashboard";
import type { PortalModule, StatusTone } from "@/types/dashboard";

const portalModules: PortalModule[] = [
  "Beranda",
  "CRM",
  "Klien & Handover",
  "Proyek",
  "Sosmed",
  "Pengaturan",
];

const moduleIcons: Record<PortalModule, ComponentType<{ className?: string }>> = {
  Beranda: LayoutDashboardIcon,
  CRM: DatabaseIcon,
  "Klien & Handover": BriefcaseBusinessIcon,
  Proyek: ClipboardListIcon,
  Sosmed: MegaphoneIcon,
  Pengaturan: SettingsIcon,
};

const toneClasses: Record<StatusTone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  critical:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  priority:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
};

function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <Badge variant="outline" className={toneClasses[tone]}>
      {children}
    </Badge>
  );
}

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
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-sidebar xl:flex xl:flex-col">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheckIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5">Pytagotech Portal</p>
            <p className="text-xs text-muted-foreground">Integrated Workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {portalModules.map((module) => {
            const ModuleIcon = moduleIcons[module];
            const items = data.navigation.filter((item) => item.module === module);

            return (
              <div key={module}>
                <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
                  <ModuleIcon className="size-3.5" aria-hidden="true" />
                  {module}
                </div>
                <div className="space-y-1">
                  {items.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <Badge variant="secondary" className="h-5 min-w-5 justify-center">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="hidden size-9 items-center justify-center rounded-lg border bg-card sm:flex xl:hidden">
                <ShieldCheckIcon className="size-5 text-primary" aria-hidden="true" />
              </div>
              <div className="relative hidden w-full max-w-md md:block">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Pencarian global"
                  placeholder="Cari lead, klien, proyek, task, materi..."
                  className="pl-8"
                />
              </div>
            </div>
            <Button variant="outline" size="icon" aria-label="Buka notifikasi" title="Notifikasi">
              <BellIcon aria-hidden="true" />
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="h-10 gap-2 px-2" />}>
                <Avatar>
                  <AvatarFallback>DP</AvatarFallback>
                </Avatar>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-medium leading-4">{data.currentUser.name}</span>
                  <span className="block text-xs text-muted-foreground">Super Admin</span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{data.currentUser.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profil</DropdownMenuItem>
                <DropdownMenuItem>Preferensi</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Keluar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="beranda" className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-primary">Fase 1 - Fondasi Platform</p>
              <h1 className="mt-1 text-3xl font-bold leading-10 md:text-4xl">
                Ruang kerja operasional Pytagotech
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Ringkasan lintas CRM, handover, produksi, dan sosmed dengan data dummy
                terstruktur untuk menggantikan spreadsheet secara bertahap.
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

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card id="proyek" className="border shadow-[0_1px_2px_rgba(26,25,24,0.03)]">
              <CardHeader className="border-b">
                <CardTitle>Antrean kerja prioritas</CardTitle>
                <CardDescription>
                  Contoh data lintas modul untuk validasi layout, tabel, status, dan role.
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
                  <CardDescription>Audit-style preview untuk perubahan penting.</CardDescription>
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
                    Komponen dasar, tema, layout, dan service mock sudah disusun untuk user story
                    berikutnya.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Button, Input, Select, Table, Dialog, Tabs, Badge, Toast tersedia",
                    "Light/dark mode aktif di seluruh halaman",
                    "Dummy data lewat services/dashboard.ts",
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
      </div>
    </div>
  );
}
