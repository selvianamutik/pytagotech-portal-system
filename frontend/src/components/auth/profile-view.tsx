"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";

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
import { useAuthStore } from "@/store/auth";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Halaman profil akun aktif (US-002): menampilkan data diri dari sesi
 * Supabase dan menyediakan tombol keluar.
 */
export function ProfileView() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const initialize = useAuthStore((state) => state.initialize);
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (status === "loading" || !user) {
    return (
      <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Memuat profil...
      </p>
    );
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader className="border-b">
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Status akun</dt>
              <dd>
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Terdaftar sejak</dt>
              <dd className="font-medium">
                {new Date(user.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <Button variant="destructive" onClick={() => void handleSignOut()}>
            <LogOutIcon className="size-4" />
            Keluar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}