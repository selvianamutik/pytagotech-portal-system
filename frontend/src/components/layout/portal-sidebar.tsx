"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusinessIcon,
  ClipboardListIcon,
  DatabaseIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NavigationItem, PortalModule } from "@/types/dashboard";

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

/**
 * Sidebar navigasi global portal (US-001, dipindah dari halaman beranda
 * ke layout agar dipakai semua halaman). Item aktif mengikuti route.
 */
export function PortalSidebar({ navigation }: { navigation: NavigationItem[] }) {
  const pathname = usePathname();

  return (
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
          const items = navigation.filter((item) => item.module === module);

          return (
            <div key={module}>
              <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
                <ModuleIcon className="size-3.5" aria-hidden="true" />
                {module}
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <Badge variant="secondary" className="h-5 min-w-5 justify-center">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
