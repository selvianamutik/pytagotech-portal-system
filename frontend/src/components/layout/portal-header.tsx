import { ShieldCheckIcon } from "lucide-react";

import { GlobalSearch } from "@/components/search/global-search";
import { NotificationBell } from "@/components/collaboration/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PortalUserInfo {
  name: string;
  email: string;
  roles: string[];
  initials: string;
}

/**
 * Header global portal (US-001, dipindah dari halaman beranda):
 * pencarian, notifikasi, tema, dan menu user.
 */
export function PortalHeader({ user }: { user: PortalUserInfo }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden size-9 items-center justify-center rounded-lg border bg-card sm:flex xl:hidden">
            <ShieldCheckIcon className="size-5 text-primary" aria-hidden="true" />
          </div>
          <div className="relative hidden w-full max-w-md md:block">
            <GlobalSearch />
          </div>
        </div>
        <NotificationBell />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-10 gap-2 px-2" />}>
            <Avatar>
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-4">{user.name}</span>
              <span className="block text-xs text-muted-foreground">{user.roles[0]}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Preferensi</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
