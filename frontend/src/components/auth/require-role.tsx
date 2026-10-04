"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth";
import { hasRole, type UserRole } from "@/types/auth";

export function ForbiddenContent() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="max-w-md text-center">
        <CardHeader className="items-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldXIcon aria-hidden="true" />
          </div>
          <CardTitle className="text-6xl font-bold">403</CardTitle>
          <CardDescription>
            Anda tidak memiliki akses ke halaman ini. Hubungi Super Admin jika
            Anda merasa ini keliru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button nativeButton={false} render={<Link href="/" />}>Kembali ke beranda</Button>
        </CardContent>
      </Card>
    </main>
  );
}

interface RequireRoleProps {
  allowed: UserRole[];
  children: ReactNode;
}

/**
 * Penjaga halaman berbasis role (US-002).
 * Menampilkan konten 403 (bukan data kosong) saat role tidak mencukupi.
 * Fase 2: dilengkapi middleware + RLS server-side (US-003).
 */
export function RequireRole({ allowed, children }: RequireRoleProps) {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const initialize = useAuthStore((state) => state.initialize);

  // Guard sendiri memicu pemuatan sesi agar tidak macet di "Memeriksa akses..."
  // bila komponen di dalamnya belum sempat mount.
  useEffect(() => {
    if (status === "loading") {
      void initialize();
    }
  }, [status, initialize]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground">Memeriksa akses...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Perlu masuk terlebih dahulu</CardTitle>
            <CardDescription>
              Sesi Anda berakhir atau belum masuk. Masuk untuk melanjutkan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} render={<Link href="/login" />}>Ke halaman masuk</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!hasRole(user, allowed)) {
    return <ForbiddenContent />;
  }

  return <>{children}</>;
}
