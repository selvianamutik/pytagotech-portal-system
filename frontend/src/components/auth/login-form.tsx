"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/services/auth";
import { useAuthStore } from "@/store/auth";

/**
 * Form masuk + reset kata sandi + status sesi (US-002).
 * Seluruh akses data lewat `store/auth` → `services/auth` (mock Fase 1).
 */
export function LoginForm() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const authError = useAuthStore((state) => state.error);
  const initialize = useAuthStore((state) => state.initialize);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);

  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground">Memuat sesi...</p>
      </main>
    );
  }

  if (status === "authenticated" && user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Anda sudah masuk</CardTitle>
            <CardDescription>
              {user.name} · {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  void signOut();
                }}
              >
                Keluar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
              >
                Ke beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const ok = await signIn({ email, password });
    setPending(false);
    if (ok) {
      router.push("/");
    }
  }

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    setResetError(null);
    const { data, error } = await requestPasswordReset(email);
    setPending(false);
    if (error) {
      setResetError(error);
    } else {
      setNotice(data);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {mode === "login" ? "Masuk ke Pytagotech Portal" : "Reset kata sandi"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Gunakan email dan kata sandi akun portal Anda."
              : "Masukkan email akun Anda untuk menerima tautan reset."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@pytagotech.test"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Kata sandi
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              {authError ? (
                <p role="alert" className="text-sm text-destructive">
                  {authError}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Memeriksa..." : "Masuk"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    setMode("reset");
                    setNotice(null);
                  }}
                >
                  Lupa kata sandi?
                </button>
                <Link href="/" className="text-muted-foreground hover:underline">
                  Kembali ke beranda
                </Link>
              </div>
              <p className="rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
                Demo Fase 1 (data mock): coba{" "}
                <span className="font-mono">dinda@pytagotech.test</span> (Super
                Admin) atau{" "}
                <span className="font-mono">feby@pytagotech.test</span> (Sales /
                Marketing) dengan kata sandi bebas minimal 8 karakter.
              </p>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="reset-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@pytagotech.test"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              {resetError ? (
                <p role="alert" className="text-sm text-destructive">
                  {resetError}
                </p>
              ) : null}
              {notice ? (
                <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
                  {notice}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Mengirim..." : "Kirim tautan reset"}
              </Button>
              <button
                type="button"
                className="text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => setMode("login")}
              >
                Kembali masuk
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
